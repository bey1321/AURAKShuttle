from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth

from middleware.auth import AuthMiddleware

from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(AuthMiddleware)

app.add_route(auth)

app.get('/')
def greet():
    return 'Welcome to Our Project'