from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
import os
from starlette import status

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

def get_user(request: Request):
    

    token = request.cookies.get('auth_token')

    if not token:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')
    
    try:
        payload = jwt.decode(token,key= SECRET_KEY, algorithms=[ALGORITHM])

        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = 'invalid token')
    


def role_required(role: str):
    async def verify_role(user = Depends(get_user)):
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if user['role'] != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized! Access denied")
        return user
    return Depends(verify_role)