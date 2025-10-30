from pydantic import BaseModel


class newDriver(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class updateDriver(BaseModel):
    email: str = None
    firstName: str = None
    lastName: str = None
    phone: int = None



class BusCreate(BaseModel):
    plateNumber: str
    numSeats: int