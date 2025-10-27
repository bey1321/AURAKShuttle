from sqlalchemy import Integer, Column, String, Time
from sqlalchemy.orm import relationship
from ..setup import Base
from datetime import time

class Schedule(Base):
    __tablename__ = "schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    time = Column(Time, nullable=False)
    
    trip_start = relationship('Trip',foreign_keys="[Trip.start_time]" ,back_populates='start_schedule')
    trip_end = relationship('Trip',foreign_keys="[Trip.end_time]" ,back_populates='end_schedule')


