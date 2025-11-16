from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth
from routes.admin import router as admin
from routes.student import router as student
from routes.driver import router as driver
from routes.lostfound import router as lostfound
from routes.gps import router as gps


from middleware.auth import AuthMiddleware

from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth)
app.include_router(admin)
app.include_router(student)
app.include_router(driver)
app.include_router(lostfound)
app.include_router(gps)


print("\n" + "="*50)
print("REGISTERED ROUTES:")
print("="*50)
for route in app.routes:
    if hasattr(route, 'path'):
        methods = getattr(route, 'methods', None)
        if methods:
            print(f"HTTP  : {route.path} [{', '.join(methods)}]")
        else:
            print(f"WS    : {route.path}")
print("="*50 + "\n")
@app.get('/')
def greet():
    return 'Welcome to Our Project'