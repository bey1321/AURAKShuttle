from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload, Session

from db.models.locationhistory import LocationHistory
from db.models.trip import Trip
from db.setup import get_db, get_async_db

from middleware.role import get_user
from schema.gps import LocationResponse, LocationUpdate

from utils.websocket_manager import gps_manager

from datetime import datetime, timedelta
from typing import Optional, List, Annotated
import json
from starlette import status

router = APIRouter(prefix='/gps', tags = ['GPS'])

db_dependency = Annotated[Session, Depends(get_db)]

active_locations: dict={}


async def save_location(db: AsyncSession, location: LocationUpdate) -> LocationHistory:
    db_location = LocationHistory(
        trip_id= location.trip_id,
        latitude = location.latitude,
        longitude = location.longitude,
        speed = location.speed,
        heading = location.heading,
        accuracy = location.accuracy,
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
async def student_websocket(websocket: WebSocket, trip_id: int, student=Depends(get_user), db: AsyncSession=Depends(get_async_db)):
    if not student:
        raise HTTPException(status_code=401, detail="User not authorized")

    await accept_and_register(websocket, "trip", trip_id)

    # Check if trip is active
    trip = await db.get(Trip, trip_id)
    if not trip or trip.status not in ["active", "in_progress"]:
        await websocket.send_json({"type": "error", "message": "Trip is not active"})
        await websocket.close()
        return

    # Send initial location if available
    latest_location = await get_latest_location(db, trip_id)
    if latest_location:
        await websocket.send_json({
            "type": "initial_location",
            "data": {
                "trip_id": trip_id,
                "bus_id": trip.bus_id if trip.bus else None,
                "bus_number": trip.bus.plate_num if trip.bus else "Unknown",
                "latitude": latest_location.latitude,
                "longitude": latest_location.longitude,
                "speed": latest_location.speed,
                "heading": latest_location.heading,
                "last_update": latest_location.timestamp.isoformat()
            }
        })

    try:
        await keep_alive(websocket)
    except WebSocketDisconnect:
        await unregister_on_disconnect(websocket, "trip", trip_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await unregister_on_disconnect(websocket, "trip", trip_id)



@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket, admin=Depends(get_user)):
    if not admin or admin["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await accept_and_register(websocket, "admin", admin["id"])

    # Send initial snapshot of all buses
    await websocket.send_json({"type": "all_buses", "data": list(active_locations.values())})

    try:
        await keep_alive(websocket)
    except WebSocketDisconnect:
        await unregister_on_disconnect(websocket, "admin", admin["id"])
    except Exception as e:
        print(f"WebSocket error: {e}")
        await unregister_on_disconnect(websocket, "admin", admin["id"])


from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

@router.websocket("/ws/driver/{driver_id}")
async def driver_websocket(websocket: WebSocket, driver_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    WebSocket endpoint for drivers to send real-time location updates.
    - Automatically marks the trip as in_progress on first location update.
    - Marks trip as completed on disconnect.
    """

    await websocket.accept()
    await gps_manager.connect(websocket, "driver", driver_id)

    active_trip_id = None  # Track which trip the driver is updating

    try:
        while True:
            data = await websocket.receive_json()

            trip_id = data.get("trip_id")
            if not trip_id:
                await websocket.send_json({"type": "error", "message": "Missing trip_id"})
                continue

            trip = await db.get(Trip, trip_id)
            if not trip:
                await websocket.send_json({"type": "error", "message": "Trip not found"})
                continue

            # Track which trip is active for this driver
            active_trip_id = trip_id
            
            if trip.status == "completed":
                await websocket.send_json({"type": "error", "message": "Trip already completed"})
                return


            # If this is the first update, mark trip as in_progress
            if trip.status != "in_progress":
                trip.status = "in_progress"
                db.add(trip)
                await db.commit()

            # Save location update
            location = LocationUpdate(
                trip_id=trip_id,
                latitude=data["latitude"],
                longitude=data["longitude"],
                speed=data.get("speed", 0.0),
                heading=data.get("heading", 0.0),
                accuracy=data.get("accuracy")
            )
            await save_location(db, location)

            # Update active location cache
            location_data = {
                "trip_id": trip_id,
                "bus_id": trip.bus_id,
                "bus_number": trip.bus.plate_number if trip.bus else "Unknown",
                "latitude": location.latitude,
                "longitude": location.longitude,
                "speed": location.speed,
                "heading": location.heading,
                "last_update": datetime.utcnow().isoformat(),
                "status": trip.status
            }
            active_locations[str(trip_id)] = location_data

            # Confirm to driver
            await websocket.send_json({
                "type": "location_confirmed",
                "timestamp": datetime.utcnow().isoformat()
            })

            # Broadcast updates
            await gps_manager.broadcast_to_students(trip_id, {"type": "location_update", "data": location_data}, db)
            await gps_manager.broadcast_to_admins({"type": "bus_location", "data": location_data})

    except WebSocketDisconnect:
        # On disconnect, mark trip as completed or stopped
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
