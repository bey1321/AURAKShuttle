from pydantic import BaseModel
from typing import Optional


class UserCreateRequest(BaseModel):
    email: str
    password: str
    first_name : str
    last_name : str
    role : str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ChangePassword(BaseModel):
    email: str
    newPassword: str