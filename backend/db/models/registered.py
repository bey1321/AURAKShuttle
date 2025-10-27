from sqlalchemy import Integer, Column, String, PrimaryKeyConstraint, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

class Registered(Base):
    __tablename__ = 'registered'

    student = relationship('User', back_populates='trip')
    student_id = Column(String, ForeignKey('user.id'))
    
    trip = relationship('Trip', back_populates='student')
    trip_id = Column(Integer, ForeignKey('trip.id'))

    __table_args__ = (
        PrimaryKeyConstraint('student_id', 'trip_id')
    )