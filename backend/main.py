from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth
from routes.admin import router as admin
from routes.student import router as student
from routes.driver import router as driver
from routes.lostfound import router as lostfound

from middleware.auth import AuthMiddleware

from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(AuthMiddleware)

app.include_router(auth)
app.include_router(admin)
app.include_router(student)
app.include_router(driver)
app.include_router(lostfound)


@app.get('/')
def greet():
    return 'Welcome to Our Project'