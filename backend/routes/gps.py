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



@router.websocket("/ws/student/trip/{trip_id}")
async def student_websocket(websocket: WebSocket, trip_id: int, student = Depends(get_user),db: AsyncSession = Depends(get_async_db)):
    """
    Student WebSocket to track a specific trip.
    Sends an error if the trip is not active.

    """

    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "User not authorized")
    
    await websocket.accept()  # accept the connection

    # Get the trip from DB
    trip = await db.get(Trip, trip_id)
    if not trip or trip.status not in ['active', 'in_progress']:
            # Trip is not active → send error and close connection
            await websocket.send_json({
                "type": "error",
                "message": "Trip is not active and cannot be tracked"
            })
            await websocket.close()
            return

        # Add student to GPS manager for this trip
    await gps_manager.connect(websocket, f"student_trip:{student['id']}:{trip_id}", websocket)

    try:
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

            # Keep connection alive for live updates
            while True:
                await websocket.receive_text()

    except WebSocketDisconnect:
            gps_manager.disconnect(websocket, f"student_trip:{student['id']}:{trip_id}")
    except Exception as e:
            print(f"WebSocket error: {e}")
            gps_manager.disconnect(websocket, f"student_trip:{student['id']}:{trip_id}")


@router.websocket('/ws/admin/{admin_id}')
async def admin_websocket(websocket: WebSocket, admin =Depends(get_user)):
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'User not authorized')
    
    if admin['role'] != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Not authorized to access")
    
    await gps_manager.connect(websocket, 'admin', admin['id'])

    try:
        await websocket.send_json({
            'type': 'all_buses',
            'data': list(active_locations.values())
        })

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        gps_manager.disconnect(websocket, 'admin', admin['id'])

    except Exception as e:
        print(f'Websocket error: {e}')
        gps_manager.disconnect(websocket,'admin',admin['id'])


@router.websocket("/ws/driver/{driver_id}")
async def driver_websocket(websocket: WebSocket, driver_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    WebSocket endpoint for drivers to send real-time location updates
    
    Expected message format:
    {
        "trip_id": 123,
        "latitude": 25.2048,
        "longitude": 55.2708,
        "speed": 45.5,
        "heading": 180.0,
        "accuracy": 10.0
    }
    """
    await gps_manager.connect(websocket, "driver", driver_id)
    
    # Get database session
    try:
            while True:
                # Receive location data from driver
                data = await websocket.receive_json()
                
                # Validate trip is active
                trip = await db.get(Trip, data["trip_id"])
                if not trip or trip.status not in ['active', 'in_progress']:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Trip is not active"
                    })
                    continue
                
                # Create location update
                location = LocationUpdate(
                    trip_id=data["trip_id"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    speed=data.get("speed", 0.0),
                    heading=data.get("heading", 0.0),
                    accuracy=data.get("accuracy")
                )
                
                # Save to database
                await save_location(db, location)
                
                # Update cache
                location_data = {
                    "trip_id": data["trip_id"],
                    "bus_id": trip.bus_id,
                    "bus_number": trip.bus.plate_number if trip.bus else "Unknown",
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "speed": location.speed,
                    "heading": location.heading,
                    "last_update": datetime.utcnow().isoformat(),
                    "status": trip.status
                }
                active_locations[str(data["trip_id"])] = location_data
                
                # Confirm to driver
                await websocket.send_json({
                    "type": "location_confirmed",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Broadcast to students on this trip
                await gps_manager.broadcast_to_students(data["trip_id"], {
                    "type": "location_update",
                    "data": location_data
                }, db)
                
                # Broadcast to admins
                await gps_manager.broadcast_to_admins({
                    "type": "bus_location",
                    "data": location_data
                })
                
    except WebSocketDisconnect:
            gps_manager.disconnect(websocket, "driver", driver_id)
    except Exception as e:
            print(f"WebSocket error: {e}")
            gps_manager.disconnect(websocket, "driver", driver_id)
