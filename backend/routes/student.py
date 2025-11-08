from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from typing import Annotated
from middleware.role import get_user

from sqlalchemy import select
from sqlalchemy.orm import selectinload, Session

from db.setup import get_db
from db.models.registered import Registered
from db.models.trip import Trip
from db.models.user import User
from db.models.bus import Bus
from db.models.rating import Rating
from db.models.route import Route
from db.models.tripreservation import TripReservation

from schema.trip import TripResponse
from schema.rating import RatingRequest, RatingResponse


from datetime import datetime, timedelta
from typing import List


router = APIRouter(prefix='/user', tags=['Trip'])

db_dependency = Annotated[Session, Depends(get_db)]

@router.get('/get_mytrips', status_code=status.HTTP_200_OK)#, response_model=List[TripResponse]
def get_my_trips(db: db_dependency, user = Depends(get_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized access')

    try:
        # Get all trips from routes the student is registered for (semester-long)
        regular_trips_stmt = (
            select(Trip)
            .join(Route, Trip.route_id == Route.id)
            .join(Registered, Registered.route_id == Route.id)
            .where(Registered.student_id == user['id'])
            .options(
                selectinload(Trip.route), 
                selectinload(Trip.bus)
            )
        )
        
        # Get trips from one-time reservations
        reserved_trips_stmt = (
            select(Trip)
            .join(TripReservation, TripReservation.trip_id == Trip.id)
            .where(
                TripReservation.student_id == user['id'],
                TripReservation.status == 'confirmed'
            )
            .options(
                selectinload(Trip.route), 
                selectinload(Trip.bus)
            )
        )
        
        regular_trips = db.scalars(regular_trips_stmt).all()
        reserved_trips = db.scalars(reserved_trips_stmt).all()
        
        # Combine both lists and remove duplicates using trip.id as key
        all_trips_dict = {trip.id: trip for trip in regular_trips}
        for trip in reserved_trips:
            if trip.id not in all_trips_dict:
                all_trips_dict[trip.id] = trip
        
        all_trips = list(all_trips_dict.values())
        
        # Sort by date and ETA
        sorted_trips = sorted(
            all_trips, 
            key=lambda t: (t.date, t.ETA)
        )
        
        # Build response with route_name from the route relationship
        response_data = []
        for trip in sorted_trips:
            trip_data = {
                "id": trip.id,
                "date": trip.date,
                "status": trip.status,
                "ETA": trip.ETA,
                "bus_id": trip.bus_id,
                "route_id": trip.route_id,
                "route_name": trip.route.name if trip.route else None,  # Get name from Route
                # Add any other fields your TripResponse needs
            }
            response_data.append(trip_data)
        
        return response_data

    except Exception as e:
        print(f"Error getting trips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f'Internal Server Error! Unable to get your shuttle trips: {str(e)}'
        )

@router.get('/all_trips', status_code=status.HTTP_200_OK) #, response_model=List[TripResponse]
def getAllTrips(db: db_dependency, user = Depends(get_user)):

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized access')

    try:
        # Query all trips with route relationship loaded
        trips = db.query(Trip).options(
            selectinload(Trip.route),
            selectinload(Trip.bus)
        ).all()
        
        # Build response with route_name
        response_data = []
        for trip in trips:
            trip_data = {
                "id": trip.id,
                "date": trip.date,
                "status": trip.status,
                "ETA": trip.ETA,
                "bus_id": trip.bus_id,
                "route_id": trip.route_id,
                "route_name": trip.route.name if trip.route else None,
                # Add any other fields your TripResponse needs
            }
            response_data.append(trip_data)
        
        return response_data
         
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f'Internal Server Error: {str(e)}'
        )

"""@router.get('/get_trip/{id}', status_code=status.HTTP_200_OK)
def getTrip(id: int, db: db_dependency, user = Depends(get_user) ):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    try:

        pass

    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')
"""


@router.post('/reserve_seat/{trip_id}', status_code=status.HTTP_201_CREATED)
async def reserve_seat(trip_id: int, db: db_dependency, user = Depends(get_user)):
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized access')
    
    try:
        # Get trip with route and bus info
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Trip not found')
        
        if not trip.bus:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No bus assigned to this trip')
        
        # Check if user is already registered for this route (semester-long)
        route_registration = db.query(Registered).filter(
            Registered.student_id == user['id'],
            Registered.route_id == trip.route_id
        ).first()
        
        if route_registration:
            return {'message':'You are already registered for this route for the semester. No need to reserve individual trips.' }
            
        
        # Check if user already reserved this specific trip
        existing_reservation = db.query(TripReservation).filter(
            TripReservation.student_id == user['id'],
            TripReservation.trip_id == trip_id,
            TripReservation.status == 'confirmed'
        ).first()
        
        if existing_reservation:
            return {'message': 'You have already reserved a seat for this trip'}
            
        
        total_seats = trip.bus.no_seats
        
        # Count students registered for this route (they have priority, semester-long registration)
        regular_students_count = db.query(Registered).filter(
            Registered.route_id == trip.route_id
        ).count()
        
        # Count one-time reservations for this specific trip
        one_time_reservations_count = db.query(TripReservation).filter(
            TripReservation.trip_id == trip_id,
            TripReservation.status == 'confirmed'
        ).count()
        
        total_taken_seats = regular_students_count + one_time_reservations_count
        
        if total_taken_seats >= total_seats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f'No available seats. Bus is full ({total_taken_seats}/{total_seats} seats taken).'
            )
        
        # Create one-time reservation
        new_reservation = TripReservation(
            student_id=user['id'],
            trip_id=trip_id,
            status='confirmed'
        )
        
        db.add(new_reservation)
        db.commit()
        db.refresh(new_reservation)
        
        seats_remaining = total_seats - total_taken_seats - 1
        
        return {
            'message': 'Successfully reserved seat for this trip',
            'trip_id': trip_id,
            'reservation_id': new_reservation.id,
            'seats_remaining': seats_remaining,
            'total_seats': total_seats
        }

    except Exception as e:
        db.rollback()
        print(f"Error reserving seat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f'Internal Server Error {str(e)}'
        )
    
@router.delete('/cancel_reservation/{trip_id}', status_code=status.HTTP_200_OK)
async def cancel_reservation(trip_id: int, db: db_dependency, user = Depends(get_user)):
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized access')
    
    try:
        reservation = db.query(TripReservation).filter(
            TripReservation.student_id == user['id'],
            TripReservation.trip_id == trip_id,
            TripReservation.status == 'confirmed'
        ).first()
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail='No active reservation found for this trip'
            )
        
        # Mark as cancelled instead of deleting (keeps history)
        reservation.status = 'cancelled'
        db.commit()
        
        return {'message': 'Reservation cancelled successfully'}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error cancelling reservation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail='Internal Server Error'
        )
    

@router.get("/my_reviews")
def get_my_reviews(
    db: db_dependency,
    user=Depends(get_user)
):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized"
        )

    try:
        reviews = db.query(Rating).filter(Rating.user_id == user['id']).all()

        # If no reviews, return empty list (not a dict)
        if not reviews:
            return []

        # Return the list directly, not wrapped in a dict
        return reviews

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reviews: {str(e)}"
        )
@router.get(
    "/getTrips_for_feedback",
    response_model=List[TripResponse]
)
def get_feedback_trips(db: db_dependency, user=Depends(get_user)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized"
        )

    try:
        now = datetime.now().date()  # Get only the date part
        five_days_ago = now - timedelta(days=5)

        stmt = (
            select(Trip)
            .join(Route, Trip.route_id == Route.id)  # Join through Route
            .join(Registered, Registered.route_id == Route.id)  # Then to Registered
            .where(
                (Registered.student_id == user['id'])
                & (Trip.date < now)
                & (Trip.date > five_days_ago)
            )
            .options(
                selectinload(Trip.route),
                selectinload(Trip.bus)
            )
        )

        trips = db.scalars(stmt).all()

        if not trips:
            return []

        # Build response with route_name
        response_data = []
        for trip in trips:
            trip_data = {
                "id": trip.id,
                "date": trip.date,
                "status": trip.status,
                "ETA": trip.ETA,
                "bus_id": trip.bus_id,
                "route_id": trip.route_id,
                "route_name": trip.route.name if trip.route else None,
            }
            response_data.append(trip_data)

        return response_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching trips: {str(e)}"
        )
    

@router.post("/rate_trip")
def rate_trip(rating: RatingRequest, db: db_dependency, user=Depends(get_user)):
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized"
        )
    
    try:
        # Optional: Prevent duplicate rating
        existing = db.query(Rating).filter(
            Rating.user_id == user['id'],
            Rating.trip_id == rating.trip_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already rated this trip"
            )

        new_rating = Rating(
            user_id=user['id'],
            trip_id=rating.trip_id,
            cleanliness=rating.cleanliness,
            driver_rating=rating.driver_rating,
            timeliness=rating.timeliness,
            comment=rating.comment
        )

        db.add(new_rating)
        db.commit()

        return {"message": "Rating added successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding rating: {str(e)}"
        )


#routes related to gps tracking