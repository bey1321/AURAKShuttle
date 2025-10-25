from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from schema.user import UserCreateRequest, UserLoginRequest
from db.models.user import User
from db.setup import get_db
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from datetime import timedelta, datetime
from jose import jwt, JWTError

load_dotenv()

router = APIRouter('/auth', tags=['auth'])


db_dependency = Annotated[Session, Depends(get_db)]


secret_key = os.getenv('SECRET_KEY')
algorithm = os.getenv('ALGORITHM')
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')




@router.post('/signup', status_code=status.HTTP_201_CREATED)
async def createAccount(data:UserCreateRequest, db: db_dependency):
    try:
        new_user = User(
            email = data.email,
            first_name = data.firstName,
            last_name = data.lastName,
            hashed_password = bcrypt_context.hash(data.password) 
        )

        db.add(new_user)
        db.commit()

        return {'message': 'User account created successfully'}

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Error! Unable to create account! {e.message}')

@router.post('/login', status_code= status.HTTP_200_OK)
async def login(data: UserLoginRequest, db: db_dependency):
    email = data.email
    password = data.password

    user = authenticate_user(email, password, db)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user')

    token = create_access_token(user.email, user.role, timedelta(minutes=300))

    response = JSONResponse(
        content={"access_token": token, "token_type": "bearer"},
        status_code=status.HTTP_200_OK
    )
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=18000,  # 20 minutes in seconds
    )
    
    return response

@router.post('/change_password')
def change_password(data,db : db_dependency):
    pass


@router.logout('/logout')
def logout(db : Session = Depends(get_db)):
    pass





def authenticate_user (  email:str , password: str, db):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return False
    
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    
    return user


def create_access_token(email: str, role: str, expires_delta : timedelta):
    encode = {'email' : email, 'role': role}
    expires = datetime.now() + expires_delta
    encode.update({'exp': expires})

    token = jwt.encode(encode, secret_key, algorithm= algorithm)

    return token