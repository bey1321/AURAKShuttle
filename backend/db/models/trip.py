from sqlalchemy import Integer, Column,String, Date, Time
from sqlalchemy.orm import relationship
from ..setup import Base

from datetime import time,date
class Trip(Base):
    __tablename__ = "trip"


    id = Column(Integer, primary_key=True, index = True)
    
    date = Column(Date, nullable=False)
    schedule = relationship('Schedule', back_populates='trip')

    status = Column(String) #set a default for this and make a domain for this

    bus = relationship('Bus', back_populates='trip')
    driver = relationship('User', back_populates='trip')
    
    start_terminal = relationship('Terminal', back_populates='start_trip')
    stop_terminal = relationship('Terminal', back_populates='stop_terminal')
    
    ETA = Column(Time, nullable = True)    

    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)

    type = Column(String, default = 'regular')

