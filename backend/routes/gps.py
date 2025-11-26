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

from datetime import datetime, timedelta, timezone
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
    print('student websocket requsted')
    await websocket.accept()

    # ---- AUTH: READ TOKEN FROM COOKIES OR QUERY PARAMETERS ----
    # WebSocket connections don't reliably send cookies, so we also check query params
    token = websocket.cookies.get("auth_token") or websocket.query_params.get("token")
    print(f"🔍 [Student WS] Token received: {token[:20] if token else 'None'}...")
    
    if not token:
        print("❌ [Student WS] No token provided")
        await websocket.send_json({'type': 'error', 'message': 'Missing authentication token'})
        await websocket.close()
        return

    try:
        payload = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ [Student WS] Token decoded: {payload}")
    except Exception as e:
        print(f"❌ [Student WS] Token decode error: {e}")
        await websocket.send_json({'type': 'error', 'message': f'Invalid token: {str(e)}'})
        await websocket.close()
        return

    # ---- AUTHORIZATION CHECK ----
    student_id = payload.get("id")
    role = payload.get("role")
    print(f"👤 [Student WS] Student ID: {student_id}, Role: {role}")
    
    if not student_id or role != "student":
        print(f"❌ [Student WS] Role check failed: role={role}, student_id={student_id}")
        await websocket.send_json({'type': 'error', 'message': f'Not authorized - students only. Current role: {role}'})
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
        print(f"❌ [Student WS] Trip {trip_id} not found")
        await websocket.send_json({'type': 'error', 'message': f'Trip {trip_id} not found'})
        await websocket.close()
        return

    # ---- CHECK IF TRIP IS IN PROGRESS ----
    if trip.status != "in_progress":
        print(f"❌ [Student WS] Trip {trip_id} is not active. Status: {trip.status}")
        await websocket.send_json({
            'type': 'error',
            'message': f'Trip is not active. Current status: {trip.status}',
            'status': trip.status
        })
        await websocket.close()
        return

    print(f"✅ [Student WS] Trip {trip_id} found and in progress, route_id: {trip.route_id if trip.route_id else 'None'}")

    # Check if student is registered for this route (make it optional/warning only)
    registration_result = await db.execute(
        select(Registered)
        .where(
            Registered.student_id == student_id,
            Registered.route_id == trip.route_id
        )
    )
    registration = registration_result.scalar_one_or_none()
    """if not registration:
        print(f"❌ [Student WS] Student {student_id} not registered for route {trip.route_id}")
        await websocket.send_json({'type': 'error', 'message': f'Student not registered for this route (route_id: {trip.route_id})'})
        await websocket.close()
        return"""
    
    print(f"✅ [Student WS] Student {student_id} is registered for route {trip.route_id}")

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
    print(f"✅ [Student WS] Registering connection for student {student_id}, trip {trip_id}")
    await gps_manager.connect(websocket, "student", student_id)

    # Send full route history and latest location
    route_history = await get_trip_route_history(db, trip_id, limit=500)  # Get last 500 points
    latest_location = route_history[0] if route_history else None
    
    print(f"📍 [Student WS] Latest location: {latest_location.latitude if latest_location else 'None'}, {latest_location.longtitude if latest_location else 'None'}")
    print(f"📍 [Student WS] Route history points: {len(route_history)}")
    
    if latest_location:
        # Convert route history to list of coordinates
        path_coordinates = [
            {
                "latitude": loc.latitude,
                "longitude": loc.longtitude,
                "timestamp": loc.timestamp.isoformat(),
                "speed": loc.speed,
                "heading": loc.heading
            }
            for loc in reversed(route_history)  # Reverse to get chronological order (oldest to newest)
        ]
        
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
                "has_reservation": bool(reservation),
                "path": path_coordinates  # Add full path history
            }
        })
    else:
        # Send empty state if no location yet
        await websocket.send_json({
            "type": "initial_location",
            "data": {
                "trip_id": trip_id,
                "bus_id": trip.bus_id if trip.bus else None,
                "bus_number": trip.bus.plate_num if trip.bus else "Unknown",
                "latitude": 0.0,
                "longitude": 0.0,
                "speed": 0.0,
                "heading": 0.0,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "has_reservation": bool(reservation),
                "status": "waiting",
                "path": []  # Empty path
            }
        })
        print(f"📍 [Student WS] No location data yet, sent empty state")

    try:
        while True:
            if trip.status == "completed":
                print(f"❌ [Student WS] Trip {trip_id} is not active. Status: {trip.status}")
                await websocket.send_json({
                    'type': 'error',
                    'message': f'Trip is completed. Current status: {trip.status}',
                    'status': trip.status
                })
                await websocket.close()
                return
            data = await websocket.receive_json()
            # Optionally handle client messages (ping/pong, requests, etc.)
    except WebSocketDisconnect:
        gps_manager.disconnect(websocket, "student", student_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        gps_manager.disconnect(websocket, "student", student_id)


@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket):
    try:
        print(f"🔌 [Admin WS] Connection attempt received")
        await websocket.accept()
        print(f"✅ [Admin WS] Connection accepted")

        token = websocket.query_params.get("token")
        print(f"🔍 [Admin WS] Token received: {token[:20] if token else 'None'}...")  # First 20 chars

        if not token:
            print("❌ [Admin WS] No token provided")
            await websocket.send_json({'type': 'error', 'message': 'Missing token'})
            await websocket.close(code=1008, reason="Missing token")
            return
        
        try:
            admin = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
            print(f"✅ [Admin WS] Token decoded: {admin}")
        except Exception as e:
            print(f"❌ [Admin WS] Token decode error: {e}")
            await websocket.send_json({'type': 'error', 'message': f'Invalid token: {str(e)}'})
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        admin_id = admin.get('id')
        admin_role = admin.get('role')
        print(f"👤 [Admin WS] Admin ID: {admin_id}, Role: {admin_role}")
        
        if admin_role != 'admin':
            print(f"❌ [Admin WS] Role check failed: {admin_role} != 'admin'")
            await websocket.send_json({'type': 'error', 'message': f'Not authorized. Current role: {admin_role}'})
            await websocket.close(code=1008, reason="Not authorized")
            return
        
        print(f"✅ [Admin WS] Admin {admin_id} authorized successfully")
        
        # Register connection
        await gps_manager.connect(websocket, 'admin', admin_id)
        print(f"✅ [Admin WS] Connection registered with GPS manager")
        
        # Send initial data
        initial_data = list(active_locations.values())
        print(f"📊 [Admin WS] Sending initial data: {len(initial_data)} active buses")
        await websocket.send_json({
            'type': 'all_buses',
            'data': initial_data
        })
        print(f"✅ [Admin WS] Initial data sent successfully")

        try:
            while True:
                # Keep connection alive - receive any messages
                try:
                    data = await websocket.receive_json()
                    # Optionally handle client messages
                except Exception as e:
                    # If JSON parsing fails, try receiving as text (for ping/pong)
                    try:
                        text_data = await websocket.receive_text()
                        # Echo back ping as pong
                        if text_data == "ping":
                            await websocket.send_text("pong")
                    except:
                        raise e
        except WebSocketDisconnect:
            print(f"🔌 [Admin WS] WebSocket disconnected for admin {admin_id}")
            gps_manager.disconnect(websocket, 'admin', admin_id)
        except Exception as e:
            print(f'❌ [Admin WS] Websocket error: {e}')
            import traceback
            traceback.print_exc()
            gps_manager.disconnect(websocket, 'admin', admin_id)
    except Exception as e:
        print(f"❌ [Admin WS] Fatal error in admin_websocket: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.close(code=1011, reason=f"Server error: {str(e)}")
        except:
            pass



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
    print('driver websocket requested')
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

            # Broadcast to students and admins with new location point
            # For students: send just the new point to append to their path
            student_location_data = {
                "type": "location_update", 
                "data": {
                    **location_data,
                    "new_point": {  # Single new point to add to path
                        "latitude": location.latitude,
                        "longitude": location.longitude,
                        "timestamp": datetime.utcnow().isoformat(),
                        "speed": location.speed,
                        "heading": location.heading
                    }
                }
            }
            
            await gps_manager.broadcast_to_students(
                trip_id,
                student_location_data,
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
                trip.status = "completed"
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