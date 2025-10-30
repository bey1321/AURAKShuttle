from sqlalchemy import Integer, Column,String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

from datetime import time,date


class Trip(Base):
    __tablename__ = "trip"


    id = Column(Integer, primary_key=True, index = True)
    
    date = Column(Date, nullable=False)
    schedule = relationship('Schedule', back_populates='trip')

    status = Column(String, default= 'scheduled') #set a default for this and make a domain for this

    bus_plate = Column(String, ForeignKey('bus.plate_num'))
    bus = relationship('Bus', back_populates='trip')
    
    driver = relationship('DriverTrip', back_populates='trip')

    terminals = relationship('TripTerminal', back_populates='trip')
    
   
    start_term_id =  Column(Integer, ForeignKey('terminal.id'))
    start_terminal = relationship('Terminal',  foreign_keys=[start_term_id] , back_populates='start_trip')
    

    ETA = Column(Time, nullable = True)    

    start_time = Column(Time, ForeignKey('schedule.id'))
    end_time = Column(Time, ForeignKey('schedule.id'))

    start_schedule = relationship('Schedule', foreign_keys=[start_time] , back_populates='trip')
    end_schedule = relationship('Schedule',foreign_keys=[end_time] ,back_populates='trip')

    type = Column(String, default = 'regular')

    rating = relationship('Rating', back_populates='trip')




