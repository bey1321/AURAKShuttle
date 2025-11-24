from fastapi import APIRouter, Request, Response, Depends, HTTPException
from db.models.user import User
from db.models.bus import Bus
from db.models.trip import Trip
from db.models.terminal import Terminal
from db.models.route import Route
from db.models.tripterminal import TripTerminal
from db.models.registered import Registered
from db.models.rating import Rating

from db.setup import get_db
from middleware.role import get_user
from middleware.role import role_required


from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from typing import Annotated, List
from datetime import datetime, timedelta
from starlette import status
from pydantic import field_validator
from .auth import hash_password

from schema.admin import newDriver, updateDriver, UserResponse, DriverResponse
from schema.user import UserCreateRequest
from schema.bus import BusCreateRequest, BusUpdateRequst, BusResponse
from schema.trip import (
    TripResponse, SemesterTripCreateRequest, SingleTripCreateRequest, 
    TerminalCreateRequest,TerminalUpdateRequest, TerminalResponse, 
    TripUpdateRequest, RouteResponse)


from .student import calculate_total_seats_taken

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

db_dependency = Annotated[Session, Depends(get_db)]

@router.post('/create_user', status_code= status.HTTP_201_CREATED)
def create_user(data: UserCreateRequest, db:db_dependency, admin = Depends(get_user)):

    if not admin or admin['role'] != 'admin':
        raise HTTPException(status_code= status.HTTP_403_FORBIDDEN, detail = 'Unauthorized access')
    
    try:
        newUser = User(
            first_name = data.first_name,
            last_name = data.last_name,
            email = data.email,
            role = data.role,
            hased_password = hash_password(data.password)
        )

        db.add(newUser)
        db.commit()

        return {'message': 'New user created!'}

    except Exception as e:
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail= f'Unable to create user. {str(e)}')

@router.delete('/user/{user_id}', status_code= status.HTTP_200_OK)
def delete_user_account(user_id: int,  db:db_dependency, admin = Depends(get_user)):

    if not admin or admin['role'] != 'admin':
        raise HTTPException(status_code= status.HTTP_403_FORBIDDEN, detail = 'Unauthorized access')
    
    if user_id == admin['id']:
        raise HTTPException(status_code= status.HTTP_406_NOT_ACCEPTABLE, detail = 'Cannot delelte own account!')
    
    try:

        user = db.query(User).filter(User.id == user_id).first()

        db.delete(user)
        db.commit()

        return {'message': 'User account deleted!'}
    
    except Exception as e:
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail= f'Unable to delete user account. {str(e)}')



@router.get('/all_users') #, response_model= List[UserResponse]
def get_users(db: db_dependency):
    try:
        users = db.query(User).filter(User.role.notin_(['driver', 'admin'])).all()
        return users
    
    except Exception as e:
        raise HTTPException(status_code= status.HTTP_500_INTERNAL_SERVER_ERROR, detail= f'Unable to get users. {str(e)}')


#driver related routes
@router.get('/drivers') #, response_model=List[DriverResponse]
def get_driver(db: db_dependency 
):
    try:
        drivers = db.query(User).filter(User.role == 'driver').all()
        return drivers
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to get drivers! {str(e)}'
        )


@router.post('/create/driver', status_code=status.HTTP_201_CREATED)
def createDriver(driver: newDriver, db:db_dependency):
    try:
        new_user = User(
            email=driver.email,
            hased_password=hash_password(driver.password),
            last_name=driver.last_name,
            first_name=driver.first_name,
            role='driver' 
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user) 

        return {'message': 'New driver created', 'driver_id': new_user.id}
    except Exception as e:
        import traceback
        print("=== ERROR ===")
        traceback.print_exc()       # prints full stack trace
        print("Exception:", str(e)) # prints the exception message
        raise e  # re-raise so FastAPI still returns 500
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to create account! {str(e)}'
        )


@router.patch('/update/driver/{driver_id}')
def updateDriver(driver_id: int, driverData: updateDriver, db:db_dependency):
    
    driver = db.query(User).filter(User.id == driver_id, User.role == 'driver').first()
    
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Driver not found')

    try:
        driver.email = driverData.email or driver.email
        driver.first_name = driverData.first_name or driver.first_name
        driver.last_name = driverData.last_name or driver.last_name

        if driverData.password:
            driver.hased_password =hash_password(driverData.password)

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
def deleteDriver(driver_id: int, db:db_dependency):
    
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
@router.get('/bus', response_model=List[BusResponse])
def get_bus(db: db_dependency):
    try:
        buses = db.query(Bus).all()

        return buses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error! Unable to fetch buses! {str(e)}'
        )


@router.post('/create/bus')
def createBus(newBus: BusCreateRequest, db: db_dependency):
    try:
        new_bus = Bus(
            plate_num = newBus.plate_num,
            no_seats = newBus.no_seats,
            model = newBus.model,
            manufacturer = newBus.manufacturer,
            status = newBus.status
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
def updateBus(bus_id: int, busData: BusUpdateRequst, db: db_dependency):
    
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
def deleteBus(bus_id: int, db:db_dependency):
   
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




@router.get('/terminals', response_model= List[TerminalResponse])
def get_termianls(db: db_dependency):
    try:
        terminals = db.query(Terminal).all()
        return terminals
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching terminals: {str(e)}"
            )
    

@router.post('/create/terminal')
def create_terminal(request:TerminalCreateRequest, db: db_dependency ):
    try:
        new_terminal = Terminal(
            city = request.city,
            terminalName= request.terminalName
        )

        db.add(new_terminal)
        db.commit()
        db.refresh(new_terminal)

        return{'message': f'New terminal created! terminal id is {new_terminal.id}'}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating terminal: {str(e)}"
            )
    

@router.patch('/terminals')
def update_termianl(data: TerminalUpdateRequest, db: db_dependency):

    terminal = db.query(Terminal).filter(Terminal.id == data.id).first()

    if not terminal:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= 'Unable to find terminal')
        
    try:
        terminal.city  = data.city or terminal.city
        terminal.terminalName = data.terminalName or terminal.terminalName

        db.commit()

        return{'message': 'Terminal updated!'}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=
                        f'Unable to update termianls.{str(e)} ')

@router.delete('/terminal/{terminal_id}')
def delete_termianl(terminal_id: int, db: db_dependency):
    terminal= db.query(Terminal).filter(Terminal.id == terminal_id).first()

    if not terminal:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= 'Unable to find terminal')

    try:

        db.delete(terminal)
        db.commit()

        return {'message': 'Delete terminal!'}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f'Unable to delete terminal. {str(e)}')
    
#trip related routes
@router.post('/create_single_trip', status_code=status.HTTP_201_CREATED)
def create_single_trip(trip_data: SingleTripCreateRequest , db: db_dependency):
    try:

        new_route = Route(
            name = trip_data.name,
            start_terminal_id = trip_data.start_terminal_id,
            type = trip_data.type,
            start_time = trip_data.start_time,
            end_time = trip_data.end_time

        )

        db.add(new_route)
        db.commit()
        db.refresh(new_route)

        new_trip = Trip(
            date =trip_data.date,
            status = trip_data.status or None,
            bus_id= trip_data.bus_id or None,
            route_id = new_route.id

        )



        if (trip_data.driver_id):
            new_trip.driver_id = trip_data.driver_id

 

        for terminal in trip_data.terminals:
            ter = db.query(Terminal).filter(Terminal.id == terminal).first()
            if not ter:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = f'Unable to find terminal with id: {terminal}')
            new_terminal = TripTerminal(
                route_id = new_route.id,
                terminal_id = terminal
            )
            db.add(new_terminal)
            db.commit()
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)

 


        return {'message': 'Trip added successfully'}



    
    except Exception as e:
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating trip: {str(e)}"
            )


@router.get('/all_trips')
def get_all_trips(db: db_dependency):
    try:
        today = datetime.now().date()
        
        query = (
            select(Trip)
            .where(Trip.date >= today, Trip.status != 'completed')
            .options(
                selectinload(Trip.bus), 
                selectinload(Trip.driver),
                selectinload(Trip.route).selectinload(Route.start_terminal),
                selectinload(Trip.route).selectinload(Route.terminals).selectinload(TripTerminal.terminal)
            )
        )
        trips = db.scalars(query).all()
        
        # Convert to dict and add seat information
        response_data = []
        for trip in trips:
            # Convert SQLAlchemy object to dict
            trip_dict = {c.name: getattr(trip, c.name) for c in trip.__table__.columns}
            
            # Add route details (including nested relationships)
            if trip.route:
                route_dict = {c.name: getattr(trip.route, c.name) for c in trip.route.__table__.columns}
                
                # Add start_terminal
                if trip.route.start_terminal:
                    route_dict['start_terminal'] = {c.name: getattr(trip.route.start_terminal, c.name) 
                                                   for c in trip.route.start_terminal.__table__.columns}
                else:
                    route_dict['start_terminal'] = None
                
                # Add terminals list
                if trip.route.terminals:
                    route_dict['terminals'] = []
                    for trip_terminal in trip.route.terminals:
                        tt_dict = {c.name: getattr(trip_terminal, c.name) for c in trip_terminal.__table__.columns}
                        if trip_terminal.terminal:
                            tt_dict['terminal'] = {c.name: getattr(trip_terminal.terminal, c.name) 
                                                  for c in trip_terminal.terminal.__table__.columns}
                        else:
                            tt_dict['terminal'] = None
                        route_dict['terminals'].append(tt_dict)
                else:
                    route_dict['terminals'] = []
                
                trip_dict['route'] = route_dict
            else:
                trip_dict['route'] = None
            
            # Add bus details
            if trip.bus:
                trip_dict['bus'] = {c.name: getattr(trip.bus, c.name) for c in trip.bus.__table__.columns}
            else:
                trip_dict['bus'] = None
            
            # Add driver details
            if trip.driver:
                trip_dict['driver'] = {c.name: getattr(trip.driver, c.name) for c in trip.driver.__table__.columns}
            else:
                trip_dict['driver'] = None
            
            # Calculate and add seat information
            seats_taken = calculate_total_seats_taken(db, trip.id, trip.route_id)
            total_capacity = trip.bus.no_seats if trip.bus else 0
            
            trip_dict['seats_taken'] = seats_taken
            trip_dict['total_capacity'] = total_capacity
            trip_dict['seats_available'] = total_capacity - seats_taken
            
            response_data.append(trip_dict)
        
        return response_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Unable to get all trips. {str(e)}'
        )
    

@router.patch('/trip/{trip_id}')
def update_trip(trip_id: int, request: TripUpdateRequest, db: db_dependency):
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if not trip:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = 'Unable to find trip with id {trip_id}')
        
        trip.date = request.date or trip.date
        trip.bus_id = request.bus_id or trip.bus_id
        trip.status = request.status or trip.status

        if request.driver_id:
            trip.driver_id = request.driver_id

 

        db.commit()

        return {'message': f'Updated trip with trip id: {trip_id} successfully'}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail =f'Unable to update trip with id {trip_id}. {str(e)}'
        )

@router.delete('/trip/{trip_id}')
def delete_trip(trip_id: int, db: db_dependency):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = 'Unable to find trip with id {trip_id}')
    try:
        db.delete(trip)
        db.commit()

        return {'message': 'trip deleted'}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail =f'Unable to delete trip with id {trip_id}. {str(e)}'
        )

    
#routes related to semester trips
@field_validator('days_of_week')
def validate_days(cls, v):
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in v:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}. Must be one of {valid_days}")
        return v
    
@field_validator('end_date')
def validate_dates(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError("end_date must be after start_date")
        return v


@router.post("/semester_trips", status_code=status.HTTP_201_CREATED)
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
        for terminal_id in request.terminals:
            ter = db.query(Terminal).filter(Terminal.id == terminal_id).first()
            if not ter:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f'Unable to find terminal with id: {terminal_id}'
                        )
        # Generate all dates in the semester that match the requested days
        created_trips = []
        current_date = request.start_date
        new_route = Route(
            name = request.name,
            start_terminal_id = request.start_terminal_id,
            type = request.type,
            start_time = request.start_time,
            end_time = request.end_time,
            days_of_week = request.days_of_week )
        
        db.add(new_route)
        db.commit()
        db.refresh(new_route)

        for terminal in request.terminals:

            new_terminal = TripTerminal(
                route_id = new_route.id,
                terminal_id = terminal
            )

            db.add(new_terminal)
            db.commit()

        while current_date <= request.end_date:
            # Check if current day is one of the requested days
            if current_date.weekday() in target_weekdays:
                # Create trip for this date
                trip = Trip(
                    date=current_date,
                    bus_id=request.bus_id,

                    route_id=new_route.id,
                    status="scheduled",  # Default status

                )
                if request.driver_id:
                    driver = db.query(User).filter(User.id == request.driver_id).first()
            
                    if not driver:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Driver with id {request.driver_id} not found"
                        )
                    trip.driver_id = request.driver_id
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


@router.patch('/semester_trip/{route_id}', status_code=status.HTTP_202_ACCEPTED)
def updateRoute(route_id: int, request: SemesterTripCreateRequest, db: db_dependency):
    try:
        route = db.query(Route).filter(Route.id == route_id).first()

        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail = f'Route with id {route_id} not found'
            )
        
        route.name = request.name
        route.type = request.type
        route.start_terminal_id = request.start_terminal_id
        route.start_time = request.start_time
        route.end_time = request.end_time
        route.days_of_week = request.days_of_week

        db.commit()
        db.refresh(route)


        db.query(TripTerminal).filter(TripTerminal.route_id== route_id).delete()

        for terminal in request.terminals:
            db.add(TripTerminal(route_id = route_id, terminal_id = terminal))
        
        db.commit()


        today = datetime.now().date()

        db.query(Trip).filter(
            Trip.route_id == route_id,
            Trip.date >= today,
            Trip.status.in_(['scheduled', 'upcoming'])
        ).delete()

        db.commit()

        day_mapping = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2,
            "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6 
        }

        target_weekdays = [day_mapping[day] for day in request.days_of_week]
        
        created_trips = []
        current_date = request.start_date
        
        while current_date <= request.end_date:
            if current_date.weekday() in target_weekdays and current_date >= today:
                new_trip = Trip(
                    date=current_date,
                    bus_id=request.bus_id,
                    route_id=route_id,
                    status="scheduled"
                )
                db.add(new_trip)
                created_trips.append(current_date)
            current_date += timedelta(days=1)

        db.commit()

        return {
            "message": f"Route '{route.name}' updated successfully.",
            "total_new_trips_created": len(created_trips),
            "note": "Completed trips were preserved."
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating semester trip: {str(e)}"
        )

@router.delete('/semester_trip/{route_id}', status_code = status.HTTP_202_ACCEPTED)
def delete_route(route_id: int, db: db_dependency):
    """
    Delete a route and all associated trips.
    """
    try:
        # Verify route exists
        route = db.query(Route).filter(Route.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Route with id {route_id} not found"
            )
        

        # Delete related trips first (to avoid FK constraint)
        deleted_trips = db.query(Trip).filter(Trip.route_id == route_id).delete()
        db.commit()

        # Delete terminals under the route
        db.query(TripTerminal).filter(TripTerminal.route_id == route_id).delete()
        db.commit()

        # Delete the route itself
        db.delete(route)
        db.commit()

        return {
            "message": "Route and all related trips deleted successfully",
            "deleted_trips_count": deleted_trips
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting route/trips: {str(e)}"
        )


@router.get('/routes', status_code=status.HTTP_200_OK, response_model =List[RouteResponse])
def get_all_routes(db: db_dependency):
    try:
        query = select(Route).options(
            selectinload(Route.terminals).selectinload(TripTerminal.terminal),
            selectinload(Route.start_terminal)
        )

        routes = db.scalars(query).all()

        return routes

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Uable to get all routes. {str(e)}'
        )
    


@router.post('/approve_registration/{registration_id}')
def approve_registration(registration_id: int,db: db_dependency, user =Depends(get_user) ):
    if not user or user['role'] != 'admin':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail= 'Unauthorized access')
    
    reg = db.query(Registered).filter(Registered.id == registration_id).first()

    if not reg:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= 'Unable to find regisration request')
    
    try:
        reg.status = 'approved'

        db.commit()

        return {'message': 'approved registered'}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Uable to approve registration. {str(e)}'
        )
    


@router.get('/registration_request')
def get_registration_request(db: db_dependency, admin = Depends(get_user)):
    if not admin or admin['role'] != 'admin':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f'Unauthorized access.'
            )
    
    try:
        db.query(Registered).filter(Registered.status == 'requested').all()

        smtm = (
            select(Registered).
            where(Registered.status == 'requested')
            .options(
                selectinload(Registered.student),
                selectinload(Registered.route)
            )

        )
        return db.scalars(smtm).all()


    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Uable to get registration requests. {str(e)}'
        )       
#lost and found related routes


@router.get('/feedback', status_code= status.HTTP_200_OK)
def get_feedbacks(db: db_dependency, admin = Depends(get_user)):

    if not admin or admin['role'] != 'admin':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f'Unauthorized access.'
            )

    try:
        
        
        query = (
            select(Rating)
            .options(
                selectinload(Rating.trip).selectinload(Trip.route),
                selectinload(Rating.trip).selectinload(Trip.driver),
                selectinload(Rating.trip).selectinload(Trip.bus),
                selectinload(Rating.user)
            )
        )

        return db.scalars(query).all()
    

    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Uable to get feedbacks. {str(e)}'
        )       


def removeItem(id: int):
    pass



