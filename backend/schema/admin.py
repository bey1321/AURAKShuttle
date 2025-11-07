from pydantic import BaseModel

from typing import Optional

class newDriver(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class updateDriver(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[int] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: str
    phone: str
    email: str

class DriverResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: str


