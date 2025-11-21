from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.models.tripreservation import TripReservation
from fastapi import WebSocket
from sqlalchemy import select, union
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession


from db.models.registered import Registered
from db.models.trip import Trip

async def get_students_for_trip(db: AsyncSession, trip_id: int) -> List[int]:
    """Get all student IDs for a trip: either registered for its route or with a reservation."""
    
    # First, get the route_id of the trip
    trip_result = await db.execute(
        select(Trip.route_id).where(Trip.id == trip_id)
    )
    trip = trip_result.scalar_one_or_none()
    if trip is None:
        return []

    route_id = trip

    #Students with reservations for this trip
    reservation_query = select(TripReservation.student_id).where(TripReservation.trip_id == trip_id)
    
    # Students registered for the route
    registered_query = select(Registered.student_id).where(Registered.route_id == route_id)
    
    # Combine both queries using UNION (removes duplicates)
    combined_query = union(reservation_query, registered_query)
    
    result = await db.execute(combined_query)
    return [row[0] for row in result.all()]


class GPSConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_type: str, user_id: int):
        
        key = f"{client_type}:{user_id}"
        self.active_connections.setdefault(key, []).append(websocket)

    def disconnect(self, websocket: WebSocket, client_type: str, user_id: int):
        
        key = f"{client_type}:{user_id}"
        if key in self.active_connections and websocket in self.active_connections[key]:
            
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")

    
    async def broadcast_to_students(self, trip_id: int, message: dict, db: AsyncSession):
        """Fetch student IDs from DB in current async context, then broadcast if connected"""
        print('broadcast to students called')

        student_ids = await get_students_for_trip(db, trip_id)

        if not student_ids:
            return  # No students, skip broadcasting

        for student_id in student_ids:
            key = f"student:{student_id}"
            if key in self.active_connections:
                for ws in self.active_connections[key]:
                    await self.send_personal_message(message, ws)
        
        print('broadcast to students done')

    async def broadcast_to_admins(self, message: dict):
        admin_keys = [k for k in self.active_connections.keys() if k.startswith("admin:")]
        for key in admin_keys:
            for ws in self.active_connections[key]:
                await self.send_personal_message(message, ws)

gps_manager = GPSConnectionManager()
