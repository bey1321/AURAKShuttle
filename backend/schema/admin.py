from pydantic import BaseModel

from typing import Optional

class newDriver(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class updateDriver(BaseModel):
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[int] = None
    password: Optional[str] = None


