from pydantic import BaseModel
from datetime import datetime, date, time
from typing import List, Optional
from schema.admin import DriverResponse
from schema.bus import BusResponse


class TerminalResponse(BaseModel):
    id: int
    terminalName : str 
    city: str 
    class Config:
        orm_mode = True

class TripTerminalResponse(BaseModel):
    terminal: Optional[TerminalResponse] = None

    class Config:
        orm_mode = True
class RouteResponse(BaseModel):
    id: int
    name: str
    status : str
    type: str
    start_time: time
    end_time: time
    start_terminal: Optional[TerminalResponse] = None
    terminals: List[TripTerminalResponse] = []
    days_of_week: Optional[List[str] ]= None

    
    class Config:
        orm_mode = True




class TripResponse(BaseModel):
    id: int
    route_name: str
    date: date
    bus: Optional[BusResponse]
    driver: Optional[DriverResponse]
    route: Optional[RouteResponse]
    
    class Config:
        orm_mode = True

class TripUpdateRequest(BaseModel):

    id: int
    date: Optional[date ] = None
    bus_id: Optional[int ]= None
    driver_id: Optional[int ] = None
    status : Optional[str ] = None





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
    terminals : List[int]
    name: str

class TerminalCreateRequest(BaseModel):

    terminalName : str
    city: str

class TerminalUpdateRequest(BaseModel):
    id: int
    terminalName : str = None
    city: str = None




