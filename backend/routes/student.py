from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from typing import Annotated
from sqlalchemy.orm import Session
from db.setup import get_db
from middleware.role import get_user
from sqlalchemy import select

from db.models.registered import Registered
from db.models.trip import Trip
from db.models.user import User
from db.models.bus import Bus

router = APIRouter('/trip', tags=['Trip'])

db_dependency = Annotated[Session, Depends(get_db)]


@router.get('/get_mytrip', status_code=status.HTTP_200_OK)
def getTrip(db: db_dependency, user = Depends(get_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    try:

        stmt = (
            select(Trip)
            .join(Registered)
            .where(Registered.student_id == user.id)
        )

        trips = db.scalars(stmt).all()

        return trips

    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail= 'Internal Server Error! Unable to get your shuttle trips')


@router.get('/all_trips',status_code=status.HTTP_200_OK)
def getAllTrips(db: db_dependency,user = Depends(get_user) ):

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    try:
        return db.query(Trip).filter(Trip.type == 'regular', Trip.status != 'completed').all()
         
    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')

"""@router.get('/get_trip/{id}', status_code=status.HTTP_200_OK)
def getTrip(id: int, db: db_dependency, user = Depends(get_user) ):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    try:

        pass

    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')
"""



@router.post('/researve_seat/{trip_id}',status_code=status.HTTP_202_ACCEPTED) #id: trip number
async def getTrip(trip_id: int, db: db_dependency, user = Depends(get_user)):
    #first get the number of total seats
    #get register students number
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')
    try:

        stmt = (
            select(Bus.no_seats)
            .join(Trip)
            .where(Trip.id == id)
        )

        total_seats = db.scalars(stmt).first()

        stmt2 = (
            select(Trip)
            .join(Registered)
            .where(Trip.id == id)
        )

        taken_seats =len(db.scalars(stmt2).all())

        if taken_seats < total_seats:
            new_registration = Registered(
                student_id  = user.id,
                trip_id = trip_id
            )

            db.add(new_registration)
            db.commit()
            return {'message': 'Succesffuly completed'}
        
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= 'The bus for this trip is full')
    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')


@router.post('/lost_item')
def postLostItem():
    pass


@router.post('/claim')
def postClaim():
    pass
