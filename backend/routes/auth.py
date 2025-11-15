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
import hashlib

load_dotenv()

router = APIRouter(prefix='/auth', tags=['Auth'])

db_dependency = Annotated[Session, Depends(get_db)]

secret_key = os.getenv('SECRET_KEY')
algorithm = os.getenv('ALGORITHM')



pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


@router.post('/signup', status_code=status.HTTP_201_CREATED)
async def createAccount(data: UserCreateRequest, db: db_dependency):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email already registered"
            )
        
        new_user = User(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            hased_password=hash_password(data.password)
        )

        db.add(new_user)
        db.commit()

        return {'message': 'User account created successfully'}


    except Exception as e:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Unable to create account{str(e)}"
        )


@router.post('/login', status_code=status.HTTP_200_OK)
async def login(data: UserLoginRequest, db: db_dependency):
    email = data.email
    password = data.password

    user = authenticate_user(email, password, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail='Invalid email or password'
        )

    token = create_access_token(user.id, user.role, timedelta(minutes=300))

    response = JSONResponse(
        content={"role": user.role},
        status_code=status.HTTP_200_OK
    )
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=18000,  # 300 minutes in seconds
    )
    
    return response


@router.post('/change_password')
def change_password(data, db: db_dependency):
    pass


@router.get('/logout')
def logout(db: Session = Depends(get_db)):
    pass


def authenticate_user(email: str, password: str, db):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return False
    
    # Use the new verify_password function with pre-hashing
    if not verify_password(password, user.hased_password):
        return False
    
    return user


def create_access_token(id: int, role: str, expires_delta: timedelta):
    encode = {'id': id, 'role': role}
    expires = datetime.now() + expires_delta
    encode.update({'exp': expires})

    token = jwt.encode(encode, secret_key, algorithm=algorithm)

    return token