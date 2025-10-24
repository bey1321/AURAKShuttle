from pydantic import BaseModel



class UserCreateRequest(BaseModel):
    email: str
    passowrd: str
    firstName : str
    lastName : str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ChangePassword(BaseModel):
    newPassword: str