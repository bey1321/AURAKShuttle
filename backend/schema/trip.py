from pydantic import BaseModel
from datetime import datetime, date, time
from typing import List

class TripResponse(BaseModel):
    id: int
    route_name: str
    date: datetime
    bus_id: int | None = None
    driver_id: int | None = None
    
    class Config:
        orm_mode = True


class SingleTripCreateRequest(BaseModel):
    date: date
    end_time : time
    start_time: time
    name: str
    status: str = None
    bus_id: int = None
    driver_id : int = None
    start_terminal_id : int
    type: str
    terminals : List[int]

class SemesterTripCreateRequest(BaseModel):
    start_date: date
    end_date: date

    days_of_week: List[str]

    bus_id: int = None
    driver_id : int =None
    start_terminal_id : int
    start_time: time
    end_time: time
    type: str
    terminals : List[str]
    name: str

class TerminalCreateRequest(BaseModel):

    terminalName : str
    city: str