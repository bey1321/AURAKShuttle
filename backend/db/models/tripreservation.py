from sqlalchemy import Integer, Column, ForeignKey, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from ..setup import Base
from datetime import datetime


class TripReservation(Base):
    __tablename__ = "tripreservation"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    trip_id = Column(Integer, ForeignKey('trip.id'), nullable=False)
    reserved_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='confirmed')  # confirmed/cancelled/completed
    
    student = relationship('User', back_populates='trip_reservations')
    trip = relationship('Trip', back_populates='reservations')
    
    # Prevent duplicate reservations for same student + trip
    __table_args__ = (
        UniqueConstraint('student_id', 'trip_id', name='unique_student_trip_reservation'),
    )