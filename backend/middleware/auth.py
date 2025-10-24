from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')



class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        token = request.cookies.get('auth_token')

        if token:
            try:

                payload = jwt.decode(token, key = SECRET_KEY, algorithms=[ALGORITHM])

                request.state.user = {
                    'email': payload.get('email'),
                    'role': payload.get('role')
                }
            except JWTError:
                request.state.user = None
        
        else:
            request.state.user = None

        response  = await call_next(request)
        return response
