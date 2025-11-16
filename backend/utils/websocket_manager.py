from fastapi import WebSocket
from typing import Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
import json

class GPSConnectionManager:

    def __init__(self):
        self.active_connections : Dict[str, List[WebSocket]] = {}


    async def connect(self, websocket: WebSocket, client_type: str, user_id: int):

        await websocket.accept()

        key = f'{client_type}: {user_id}'

        if key not in self.active_connections:
            self.active_connections[key]=[]

        self.active_connections[key].append(websocket)

    def disconnect(self, websocket: WebSocket, client_type: str, user_id: int):

        key = f'{client_type}:{user_id}'

        if key in self.active_connections:
            if websocket in self.active_connections[key]:
                self.active_connections[key].remove[websocket]

            if not self.active_connections[key]:
                del self.active_connections[key]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):

        try:
            await websocket.send_json(message)

        except Exception as e:
            print(f'Error sending message: {e}')

    async def broadcast_to_students(self, trip_id:int, message: dict, db: AsyncSession):

        students = await get_students_for_trip(db, trip_id)

        for student_id in students:
            key =f'stduent:{student_id}'

            if key in self.active_connections:

                for connection in self.active_connections[key]:
                    await self.send_personal_message(message, connection)

    async def broadcast_to_admins(self, message: dict):
        admin_keys = [k for k in self.active_connections.keys() if k.startswith('admin:')]

        for key in admin_keys:
            for connection in self.active_connections[key]:
                await self.send_personal_message(message, connection)

    async def broadcast_to_trip(self, trip_id:int, message: dict):

        keys = [k for k in self.active_connections.keys() if f'trip:{trip_id}']

        for key in keys:
            for connection in self.active_connections[key]:
                await self.send_personal_message(message, connection)


gps_manager = GPSConnectionManager()
