from fastapi import APIRouter, Depends, HTTPException, Response, Request
from schema.user import UserCreateRequest, UserLoginRequest
from db.models.user import User
from db.setup import get_db
from sqlalchemy.orm import Session

router = APIRouter('/auth', tags=['auth'])


@router.post('/signup')
def createAccount(data:UserCreateRequest):
    pass

@router.get('/login')
def login(data: UserLoginRequest):
    pass


@router.post('/change_password')
def change_password(data,db : Session = Depends(get_db)):
    pass


@router.logout('/logout')
def logout(db : Session = Depends(get_db)):
    pass