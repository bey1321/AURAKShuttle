from pydantic import BaseModel, Field

from typing import Optional
from datetime import datetime

class LocationUpdate(BaseModel):
    trip_id: int
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge = -180, le = 180)
    speed : Optional[float] = 0.0
    heading: Optional[float] = 0.0
    accuracy : Optional[float] = None


class LocationResponse(BaseModel):

    id: int
    trip_id: int
    latitude: float
    longitude: float
    speed: float
    heading: float
    accuracy: Optional[float]
    timestamp: datetime

    class Config:
        from_attribues = True

class ActiveBusLocaton(BaseModel):

    trip_id: int
    bus_id: int
    bus_plate: str
    driver_name: Optional[str]
    route_name: Optional[str]
    latitude: float
    longtiude: float
    speed: float
    heading: float
    last_update: datetime
    status: str