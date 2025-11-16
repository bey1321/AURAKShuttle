from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload, Session

from db.models.locationhistory import LocationHistory
from db.models.trip import Trip
from db.models.tripreservation import TripReservation  # Adjust import
from db.models.registered import Registered

from db.setup import get_db, get_async_db

from middleware.role import get_user
from schema.gps import LocationResponse, LocationUpdate

from utils.websocket_manager import gps_manager

from datetime import datetime, timedelta
from typing import Optional, List, Annotated
import json
from starlette import status
from jose import jwt
import os

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')


router = APIRouter(prefix='/gps', tags = ['GPS'])

db_dependency = Annotated[Session, Depends(get_db)]

active_locations: dict={}





async def save_location(db: AsyncSession, location: LocationUpdate) -> LocationHistory:
    db_location = LocationHistory(
        trip_id= location.trip_id,
        latitude = location.latitude,
        longtitude = location.longitude,
        speed = location.speed,
        heading = location.heading,
        #accuracy = location.accuracy,
        timestamp = datetime.now()
    )

    db.add(db_location)
    await db.commit()
    await db.refresh(db_location)
    return db_location


async def get_trip_route_history(
        db: AsyncSession,
        trip_id: int,
        limit: Optional[int] = 100
) -> List[LocationHistory]:
    query = (
        select(LocationHistory)
        .where(LocationHistory.trip_id== trip_id)
        .order_by(desc(LocationHistory.timestamp))
        .limit(limit)
    )

    result = await db.execute(query)

    return result.scalars().all()




#function students will use
async def get_latest_location(db: AsyncSession, trip_id:int) -> Optional[LocationHistory]:

    query = (
        select(LocationHistory)
        .where(LocationHistory.trip_id == trip_id)
        .order_by(desc(LocationHistory.timestamp))
        .limit(1)

    )

    result = await db.execute(query)
    return result.scalar_one_or_none()



#function admins should use to get all active trips
async def get_active_trips(db: AsyncSession) -> List[Trip]:

    query = (

        select(Trip)
        .where(Trip.status.in_(['active', 'in_progress']))
        .options(
            selectinload(Trip.bus),
            selectinload(Trip.route),
            selectinload(Trip.driver)
        )
    )

    result = await db.execute(query)

    return result.scalars().all()


async def cleanup_old_locaton(db: AsyncSession,days: int = 30):

    cutoff_date = datetime.now() -timedelta(days=days)
    query = select(LocationHistory).where(LocationHistory.timestamp < cutoff_date)

    result = await db.execute(query)
    old_locations = result.scalars().all()

    for location in old_locations:
        await db.delete(location)

    await db.commit()
    return len(old_locations)




async def accept_and_register(websocket: WebSocket, client_type: str, client_id: int):
    await websocket.accept()
    await gps_manager.connect(websocket, client_type, client_id)

async def unregister_on_disconnect(websocket: WebSocket, client_type: str, client_id: int):
    gps_manager.disconnect(websocket, client_type, client_id)

async def keep_alive(websocket: WebSocket):
    """Keep WebSocket alive; optionally handle incoming messages."""
    while True:
        await websocket.receive_text()


@router.websocket("/ws/student/trip/{trip_id}")
async def student_websocket(
    websocket: WebSocket, 
    trip_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    WebSocket endpoint for students to receive real-time location updates.
    Token is read from cookies automatically sent by the browser.
    """
    
    await websocket.accept()

    # ---- AUTH: READ TOKEN FROM COOKIES ----
    token = websocket.cookies.get("auth_token")
    if not token:
        await websocket.send_json({'type': 'error', 'message': 'Missing authentication token'})
        await websocket.close()
        return

    try:
        payload = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        await websocket.send_json({'type': 'error', 'message': 'Invalid token'})
        await websocket.close()
        return

    # ---- AUTHORIZATION CHECK ----
    student_id = payload.get("id")
    role = payload.get("role")
    if not student_id or role != "student":
        await websocket.send_json({'type': 'error', 'message': 'Not authorized - students only'})
        await websocket.close()
        return

    # ---- VERIFY STUDENT IS REGISTERED FOR THE ROUTE ----
    trip_result = await db.execute(
        select(Trip)
        .where(Trip.id == trip_id)
        .options(
            selectinload(Trip.route),
            selectinload(Trip.bus)  # ← FIXED: Eagerly load bus relationship
        )
    )
    trip = trip_result.scalar_one_or_none()

    if not trip:
        await websocket.send_json({'type': 'error', 'message': 'Trip not found'})
        await websocket.close()
        return

    # Check if student is registered for this route
    registration_result = await db.execute(
        select(Registered)
        .where(
            Registered.student_id == student_id,
            Registered.route_id == trip.route_id
        )
    )
    registration = registration_result.scalar_one_or_none()
    if not registration:
        await websocket.send_json({'type': 'error', 'message': 'Student not registered for this route'})
        await websocket.close()
        return

    # ---- OPTIONAL: CHECK IF STUDENT HAS A TRIP RESERVATION ----
    reservation_result = await db.execute(
        select(TripReservation)
        .where(
            TripReservation.student_id == student_id,
            TripReservation.trip_id == trip_id
        )
    )
    reservation = reservation_result.scalar_one_or_none()

    # ---- SUCCESS: REGISTER CONNECTION WITH STUDENT ID ----
    await gps_manager.connect(websocket, "student", student_id)

    # Send latest location if available
    latest_location = await get_latest_location(db, trip_id)
    if latest_location:
        await websocket.send_json({
            "type": "initial_location",
            "data": {
                "trip_id": trip_id,
                "bus_id": trip.bus_id if trip.bus else None,
                "bus_number": trip.bus.plate_num if trip.bus else "Unknown",
                "latitude": latest_location.latitude,
                "longitude": latest_location.longtitude,
                "speed": latest_location.speed,
                "heading": latest_location.heading,
                "last_update": latest_location.timestamp.isoformat(),
                "has_reservation": bool(reservation)
            }
        })

    try:
        while True:
            data = await websocket.receive_json()
            # Optionally handle client messages (ping/pong, requests, etc.)
    except WebSocketDisconnect:
        gps_manager.disconnect(websocket, "student", student_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        gps_manager.disconnect(websocket, "student", student_id)


@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket):
    await websocket.accept()

    token = websocket.query_params.get("token")
    print(f"🔍 Token received: {token[:20] if token else 'None'}...")  # First 20 chars

    if not token:
        print("❌ No token provided")
        await websocket.send_json({'type': 'error', 'message': 'Missing token'})
        await websocket.close()
        return
    
    try:
        admin = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token decoded: {admin}")
    except Exception as e:
        print(f"❌ Token decode error: {e}")
        await websocket.send_json({'type': 'error', 'message': 'Invalid token'})
        await websocket.close()
        return
    
    admin_id = admin.get('id')
    admin_role = admin.get('role')
    print(f"👤 Admin ID: {admin_id}, Role: {admin_role}")
    
    if admin_role != 'admin':
        print(f"❌ Role check failed: {admin_role} != 'admin'")
        await websocket.send_json({'type': 'error', 'message': 'Not authorized'})
        await websocket.close()
        return
    
    print(f"✅ Admin {admin_id} authorized successfully")
    
    # Register connection
    await gps_manager.connect(websocket, 'admin', admin_id)
    
    # Send initial data
    await websocket.send_json({
        'type': 'all_buses',
        'data': list(active_locations.values())
    })

    try:
        while True:
            data = await websocket.receive_json()
    except WebSocketDisconnect:
        gps_manager.disconnect(websocket, 'admin', admin_id)
    except Exception as e:
        print(f'Websocket error: {e}')
        gps_manager.disconnect(websocket, 'admin', admin_id)



from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession


@router.websocket("/ws/driver/{driver_id}")
async def driver_websocket(websocket: WebSocket, driver_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    WebSocket endpoint for drivers to send real-time location updates.
    Token is passed as a query parameter: ?token=xxxx
    Example: ws://localhost:8000/gps/ws/driver/2?token=abc.def.xyz
    """

    # Accept the WebSocket connection first
    await websocket.accept()

    # ---- AUTH: READ TOKEN FROM QUERY PARAMETERS ----
    token = websocket.query_params.get("token")

    if not token:
        await websocket.send_json({'type': 'error', 'message': 'Missing token'})
        await websocket.close()
        return

    try:
        driver = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        await websocket.send_json({'type': 'error', 'message': 'Invalid token'})
        await websocket.close()
        return

    # ---- AUTHORIZATION CHECK ----
    if driver.get("id") != driver_id or driver.get("role") != "driver":
        await websocket.send_json({'type': 'error', 'message': 'Not allowed'})
        await websocket.close()
        return

    # ---- SUCCESS: REGISTER CONNECTION ----
    await gps_manager.connect(websocket, "driver", driver_id)

    active_trip_id = None

    try:
        while True:
            data = await websocket.receive_json()

            trip_id = data.get("trip_id")
            if not trip_id:
                await websocket.send_json({"type": "error", "message": "Missing trip_id"})
                continue

            # Replace the db.get() with this:
            result = await db.execute(
                select(Trip)
                .options(selectinload(Trip.bus))
                .where(Trip.id == trip_id)
            )
            trip = result.scalar_one_or_none()
            
            if not trip:
                await websocket.send_json({"type": "error", "message": "Trip not found"})
                continue

            active_trip_id = trip_id

            if trip.status == "completed":
                await websocket.send_json({"type": "error", "message": "Trip already completed"})
                return

            # First update → mark in_progress
            if trip.status != "in_progress":
                trip.status = "in_progress"
                db.add(trip)
                await db.commit()

            # Save location
            location = LocationUpdate(
                trip_id=trip_id,
                latitude=data["latitude"],
                longitude=data["longitude"],
                speed=data.get("speed", 0.0),
                heading=data.get("heading", 0.0),
                accuracy=data.get("accuracy")
            )
            await save_location(db, location)

            # Cache live location
            location_data = {
                "trip_id": trip_id,
                "bus_id": trip.bus_id,
                "bus_number": trip.bus.plate_num if trip.bus else "Unknown",
                "latitude": location.latitude,
                "longitude": location.longitude,
                "speed": location.speed,
                "heading": location.heading,
                "last_update": datetime.utcnow().isoformat(),
                "status": trip.status
            }
            active_locations[str(trip_id)] = location_data

            # Acknowledge driver
            await websocket.send_json({
                "type": "location_confirmed",
                "timestamp": datetime.utcnow().isoformat()
            })

            # Broadcast to students and admins
            
            await gps_manager.broadcast_to_students(
                trip_id,
                {"type": "location_update", "data": location_data},
                db
            )
            print('data sent to students from driver route')
            await gps_manager.broadcast_to_admins(
                {"type": "bus_location", "data": location_data}
            )

    except WebSocketDisconnect:
        # Mark trip stopped
        if active_trip_id:
            trip = await db.get(Trip, active_trip_id)
            if trip and trip.status == "in_progress":
                trip.status = "stopped"
                db.add(trip)
                await db.commit()

        gps_manager.disconnect(websocket, "driver", driver_id)

    except Exception as e:
        print(f"WebSocket error: {e}")

        if active_trip_id:
            trip = await db.get(Trip, active_trip_id)
            if trip and trip.status == "in_progress":
                trip.status = "stopped"
                db.add(trip)
                await db.commit()

        gps_manager.disconnect(websocket, "driver", driver_id)
