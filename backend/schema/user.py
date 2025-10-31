from pydantic import BaseModel



class UserCreateRequest(BaseModel):
    email: str
    password: str
    firstName : str
    lastName : str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ChangePassword(BaseModel):
    email: str
    newPassword: str