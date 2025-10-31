from fastapi import APIRouter, Request, Response, Depends, HTTPException
from db.models.user import User
from db.models.bus import Bus
from db.models.trip import Trip
from db.models.drivertrip import DriverTrip
from db.models.terminal import Terminal
from db.models.route import Route

from db.setup import get_db
from middleware.role import get_user
from middleware.role import role_required


from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Annotated, List
from datetime import datetime, timedelta
from starlette import status
from pydantic import field_validator
from auth import bcrypt_context

from schema.admin import newDriver, updateDriver
from schema.bus import BusCreateRequest, BusUpdateRequst
from schema.trip import TripResponse, SemesterTripCreateRequest, SingleTripCreateRequest


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(role_required("admin"))]
)

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
def createBus(newBus: BusCreateRequest, db: db_dependency):
    try:
        new_bus = Bus(
            plate_num = newBus.plate_num,
            no_seats = newBus.no_seats,
            model = new_bus.model,
            manufacturer = new_bus.manufacturer,
            status = new_bus.status
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
def updateBus(bus_id: int, busData: BusUpdateRequst, db: Session = Depends(db_dependency)):
    
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    
    if not bus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bus not found")

    try:
        
        bus.plate_num = busData.plate_num or bus.plate_num
        bus.no_seats = busData.no_seats or bus.no_seats
        bus.manufacturer = busData.manufacturer or bus.manufacturer
        bus.model = busData.model or bus.model
        bus.status = busData.status or bus.status


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



@router.get('/get_bus_assigned_trips/{bus_id}', response_model=List[TripResponse])
def get_bus_assigned_trips(bus_id: int, db: db_dependency):

    bus = db.query(Bus).filter(Bus.id == bus_id).first()

    if not bus:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unable to find Bus')
    
    try:

        stmt = (
            select(Trip)
            .join(Bus)
            .where(Bus.id == Trip.bus_id & Trip.date > datetime.now())
        )

        trips = db.scalars(stmt).all()

        return trips

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting trips for a bus: {str(e)}"
        )


#trip related routes
@router.post('/create_single_trip', status_code=status.HTTP_201_CREATED)
def create_single_trip(trip_data: SingleTripCreateRequest , db: db_dependency):
    try:
        new_trip = Trip(
            date =trip_data.date,
            status = trip_data.status or None,
            bus_id= trip_data.bus_id,
            start_term_id = trip_data.start_terminal_id,
            start_time = trip_data.start_time,
            end_time = trip_data.end_time,
            type = trip_data.type,
            route= trip_data.route
        )

        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)

        driver_trip = DriverTrip(
            trip_id = new_trip.id,
            driver_id = trip_data.driver_id
        )

        db.add(driver_trip)
        db.commit()


        return {'message': 'Trip added successfully'}



    
    except Exception as e:
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating trip: {str(e)}"
            )


@validator('days_of_week')
def validate_days(cls, v):
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in v:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}. Must be one of {valid_days}")
        return v
    
@validator('end_date')
def validate_dates(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError("end_date must be after start_date")
        return v


@router.post("/semester-trips", status_code=status.HTTP_201_CREATED)
async def create_semester_trips(
    request: SemesterTripCreateRequest,
    db: db_dependency  # Ensure only admin can create
):
    """
    Create trips for an entire semester based on specified days of the week.
    """
    try:
        # Map day names to weekday numbers (0=Monday, 6=Sunday)
        day_mapping = {
            "Monday": 0,
            "Tuesday": 1,
            "Wednesday": 2,
            "Thursday": 3,
            "Friday": 4,
            "Saturday": 5,
            "Sunday": 6
        }
        
        # Convert requested days to weekday numbers
        target_weekdays = [day_mapping[day] for day in request.days_of_week]
        
        # Validate bus and driver exist if provided
        if request.bus_id:
            bus = db.query(Bus).filter(Bus.id == request.bus_id).first()
            if not bus:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bus with id {request.bus_id} not found"
                )
        
        #check if the bus is already allocated


        if request.driver_id:
            driver = db.query(User).filter(User.id == request.driver_id).first()
            
            if not driver:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Driver with id {request.driver_id} not found"
                )
            
            #check if the bus driver is already assigned at this time interval and date
        
        # Validate start terminal exists
        start_terminal = db.query(Terminal).filter(
            Terminal.id == request.start_terminal_id
        ).first()

        if not start_terminal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Terminal with id {request.start_terminal_id} not found"
            )
        
        # Generate all dates in the semester that match the requested days
        created_trips = []
        current_date = request.start_date
        
        while current_date <= request.end_date:
            # Check if current day is one of the requested days
            if current_date.weekday() in target_weekdays:
                # Create trip for this date
                trip = Trip(
                    date=current_date,
                    bus_id=request.bus_id,
                    start_terminal_id=request.start_terminal_id,
                    start_time=request.start_time,
                    end_time=request.end_time,
                    type=request.type,
                    route=request.route,
                    status="scheduled",  # Default status

                )
                db.add(trip)
                created_trips.append({
                    "date": current_date,
                    "day": request.days_of_week[target_weekdays.index(current_date.weekday())],
                    "start_time": request.start_time,
                    "end_time": request.end_time
                })
            
            # Move to next day
            current_date += timedelta(days=1)
        
        # Commit all trips to database
        db.commit()
        
        return {
            "message": f"Successfully created {len(created_trips)} trips",
            "semester_info": {
                "start_date": request.start_date,
                "end_date": request.end_date,
                "days_of_week": request.days_of_week
            },
            "total_trips_created": len(created_trips),
            "trip_details": created_trips[:10],  # Return first 10 as sample
            "route_info": {
                "route": request.route,
                "type": request.type,
                "start_terminal_id": request.start_terminal_id,
                "terminals": request.terminals
            }
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating semester trips: {str(e)}"
        )


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



