
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from db.setup import get_db
from middleware.role import get_user
from typing import Annotated
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from starlette import status
from db.models.trip import Trip
from db.models.route import Route
from db.models.tripterminal import TripTerminal
from db.models.registered import Registered
from db.models.tripreservation import TripReservation
from db.models.user import User

from schema.notification import NotificationRequest, NotificationResponse
from services.notification_service import notification_service

from .student import calculate_total_seats_taken

router  = APIRouter(prefix='/driver', tags=['Driver'])


@router.post('/log_detail')  #related to start time and end time of the trip
def logTripDetails():
    pass


@router.post('/complete_trip/{trip_id}')
def complete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_user)
):
    """
    Mark a trip as completed when the driver intentionally ends the trip.
    This is different from 'stopped' which indicates an interruption or error.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not authorized. Please login'
        )

    if user['role'] != 'driver':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only drivers can complete trips'
        )

    try:
        # Get the trip and verify it belongs to this driver
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Trip with id {trip_id} not found'
            )

        if trip.driver_id != user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You can only complete your own trips'
            )

        # Update trip status to completed
        trip.status = 'completed'
        db.add(trip)
        db.commit()

        return {
            'message': 'Trip marked as completed successfully',
            'trip_id': trip_id,
            'status': 'completed'
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error completing trip: {str(e)}'
        )

@router.post('/send_notification', response_model=NotificationResponse)
def send_trip_notification(
    notification_data: NotificationRequest,
    db: Session = Depends(get_db),
    user = Depends(get_user)
):
    """
    Send SMS notification to all students registered for a specific trip.
    Driver selects a trip and a predefined message or custom message.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not authorized. Please login'
        )

    if user['role'] != 'driver':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only drivers can send notifications'
        )

    try:
        # Get the trip and verify it belongs to this driver
        trip = db.query(Trip).filter(Trip.id == notification_data.trip_id).first()

        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Trip with id {notification_data.trip_id} not found'
            )

        print(f"=== NOTIFICATION DEBUG ===")
        print(f"Trip ID: {trip.id}")
        print(f"Trip Route ID: {trip.route_id}")
        print(f"Trip Driver ID: {trip.driver_id}")
        print(f"User ID: {user['id']}")

        if trip.driver_id != user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You can only send notifications for your own trips'
            )

        # Get all students registered for this trip's route
        registered_students = (
            db.query(User)
            .join(Registered, Registered.student_id == User.id)
            .filter(
                Registered.route_id == trip.route_id,
                Registered.status == 'approved'
            )
            .all()
        )

        print(f"Registered students for route {trip.route_id}: {len(registered_students)}")
        for student in registered_students:
            print(f"  - Student ID: {student.id}, Email: {student.email}, Phone: {student.phone}")

        # Get students with one-time reservations for this specific trip
        reserved_students = (
            db.query(User)
            .join(TripReservation, TripReservation.student_id == User.id)
            .filter(
                TripReservation.trip_id == notification_data.trip_id,
                TripReservation.status == 'confirmed'
            )
            .all()
        )

        print(f"Reserved students for trip {notification_data.trip_id}: {len(reserved_students)}")
        for student in reserved_students:
            print(f"  - Student ID: {student.id}, Email: {student.email}, Phone: {student.phone}")

        # Combine and deduplicate students
        all_students_dict = {student.id: student for student in registered_students}
        for student in reserved_students:
            if student.id not in all_students_dict:
                all_students_dict[student.id] = student

        all_students = list(all_students_dict.values())

        print(f"Total unique students: {len(all_students)}")

        if not all_students:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='No students registered for this trip'
            )

        # Filter students with valid phone numbers
        students_with_phone = [
            student for student in all_students
            if student.phone
        ]

        print(f"Students with phone numbers: {len(students_with_phone)}")
        for student in students_with_phone:
            print(f"  - Student ID: {student.id}, Phone: {student.phone}, Type: {type(student.phone)}")

        if not students_with_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No students have phone numbers registered'
            )

        # Prepare the message
        if notification_data.message_type == 'custom':
            if not notification_data.custom_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='Custom message is required when message_type is "custom"'
                )
            message = notification_data.custom_message
        else:
            trip_info = {
                'route_name': trip.route.name if trip.route else ''
            }
            message = notification_service.get_predefined_message(
                notification_data.message_type,
                trip_info
            )

        # Get phone numbers
        phone_numbers = [str(student.phone) for student in students_with_phone]

        print(f"Phone numbers to send to: {phone_numbers}")
        print(f"Message to send: {message}")

        # Send notifications
        results = notification_service.send_bulk_sms(phone_numbers, message)

        print(f"SMS Send Results:")
        print(f"  - Successful: {len(results['successful'])}")
        print(f"  - Failed: {len(results['failed'])}")
        print(f"  - Successful details: {results['successful']}")
        print(f"  - Failed details: {results['failed']}")
        print(f"=== END DEBUG ===")

        return NotificationResponse(
            message='Notifications sent successfully',
            trip_id=notification_data.trip_id,
            recipients_count=len(results['successful']),
            failed_count=len(results['failed'])
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Notification service not configured: {str(e)}'
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Error sending notifications: {str(e)}'
        )


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
                selectinload(Trip.route).selectinload(Route.start_terminal),
                selectinload(Trip.route).selectinload(Route.terminals).selectinload(TripTerminal.terminal),
                selectinload(Trip.bus),
                selectinload(Trip.driver)
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
            detail=f'Unable to get driver trips. {str(e)}'
        )



