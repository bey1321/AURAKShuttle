
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from db.setup import get_db
from middleware.role import get_user
from typing import Annotated
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from starlette import status
from db.models.trip import Trip
from db.models.route import Route
router  = APIRouter(prefix='/driver', tags=['Driver'])


@router.post('/log_detail')  #related to start time and end time of the trip
def logTripDetails():
    pass

@router.post('/notify')
def notify():
    pass


#routes related to gps tracking




@router.get('/my_trips')
def get_driver_trips(db:Session= Depends(get_db), user = Depends(get_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not authorized. Please login')
    
    if user['role']!= 'driver':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not authorized.')
    
    try:
        query = (
            select(Trip)
            .where(Trip.driver_id == int(user['id']))
            .options(
                selectinload(Trip.route).selectinload(Route.terminals),
                selectinload(Trip.bus)

            )
        )

        trips = db.scalars(query).all()
        return trips

    except Exception as e:
        pass




