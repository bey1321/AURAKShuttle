from sqlalchemy import Integer, Column, String, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from ..setup import Base

class Registered(Base):
    __tablename__ = 'registered'

    student_email = relationship('User', back_populates='trip')
    trip_id = relationship('Trip', back_populates='student')

    __table_args__ = (
        PrimaryKeyConstraint('student_id', 'trip_id')
    )