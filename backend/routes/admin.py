from fastapi import APIRouter, Request, Response, Depends, HTTPException
from db.models.user import User
from db.models.bus import Bus
from schema.admin import newDriver, updateDriver, BusCreate

from db.setup import get_db
from middleware.role import get_user



from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from auth import bcrypt_context
router  = APIRouter('/admin', tags=['admin'])




db_dependency = Annotated[Session, Depends(get_db)]

#driver related routes
@router.post('/create/driver', status_code=status.HTTP_201_CREATED)
def createDriver(newDriver: newDriver, db: Session = Depends(db_dependency)):
    try:
        new_user = User(
            email=newDriver.email,
            password=bcrypt_context.hash(newDriver.password),
            lastName=newDriver.lastName,
            firstName=newDriver.firstName,
            role='driver' 
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user) 

        return {'message': 'New driver created', 'driver_id': new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to create account! {str(e)}'
        )


@router.patch('/update/driver/{driver_id}')
def updateDriver(driver_id: int, driverData: newDriver, db: Session = Depends(db_dependency)):
    
    driver = db.query(User).filter(User.id == driver_id, User.role == 'driver').first()
    
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Driver not found')

    try:
        driver.email = driverData.email or driver.email
        driver.firstName = driverData.firstName or driver.firstName
        driver.lastName = driverData.lastName or driver.lastName

        if driverData.password:
            driver.password = bcrypt_context.hash(driverData.password)

        db.commit()
        db.refresh(driver)

        return {'message': 'Driver updated', 'driver_id': driver.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to update driver! {str(e)}'
        )


@router.delete('/delete/driver/{driver_id}')
def deleteDriver(driver_id: int, db: Session = Depends(db_dependency)):
    
    driver = db.query(User).filter(User.id == driver_id, User.role == 'driver').first()
    
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Driver not found')

    try:
        
        db.delete(driver)
        db.commit()
        return {'message': 'Driver deleted', 'driver_id': driver_id}
    
    except Exception as e:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to delete driver! {str(e)}'
        )


#bus related routes
@router.post('/create/bus')
def createBus(newBus: BusCreate, db: db_dependency):
    try:
        new_bus = Bus(
            plate_num = newBus.plateNumber,
            no_seats = newBus.numSeats
        )
        db.add(new_bus)
        db.commit()
        db.refresh(new_bus) 

        return {'message': 'New Bus created', 'bus_id': new_bus.id}
    except Exception as e:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to create new bus! {str(e)}'
        )


@router.patch('/update/bus/{bus_id}')
def updateBus(bus_id: int, busData: BusCreate, db: Session = Depends(db_dependency)):
    
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    
    if not bus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bus not found")

    try:
        
        bus.plate_num = busData.plateNumber or bus.plate_num
        bus.no_seats = busData.numSeats or bus.no_seats

        db.commit()
        db.refresh(bus)

        return {'message': 'Bus updated', 'bus_id': bus.id}
    
    except Exception as e:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to update bus! {str(e)}'
        )


@router.delete('/delete/bus/{bus_id}')
def deleteBus(bus_id: int, db: Session = Depends(db_dependency)):
   
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    
    if not bus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bus not found")

    try:
        
        db.delete(bus)
        db.commit()
        return {'message': 'Bus deleted', 'bus_id': bus_id}
    
    except Exception as e:
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to delete bus! {str(e)}'
        )



#trip related routes
@router.post('/create/trip')
def createTrip():
    pass


@router.put('/update/trip')
def updateTrip():
    pass

@router.delete('delete/trip/{id}')
def deleteTrip(id: int):
    pass



#lost and found related routes
@router.get('/remove_item/{id}')
def removeItem(id: int):
    pass



