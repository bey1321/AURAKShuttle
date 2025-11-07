from sqlalchemy import Integer, Column,String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

from datetime import time,date


class Trip(Base):
    __tablename__ = "trip"

    id = Column(Integer, primary_key=True, index = True)
    date = Column(Date, nullable=False)
    status = Column(String, default= 'scheduled') #set a default for this and make a domain for this
    ETA = Column(Time, nullable = True)  

    bus_id = Column(Integer, ForeignKey('bus.id'))
    bus = relationship('Bus', back_populates='trip')
    
    driver_id = Column(Integer, ForeignKey('user.id'))
    driver = relationship('User', back_populates='drives_trip')
    
    rating = relationship('Rating', back_populates='trip')
    lost_item = relationship('Lost', back_populates='trip')
    found_item = relationship('Found', back_populates='trip')
    
    route = relationship('Route', back_populates='trips')
    route_id = Column(Integer, ForeignKey('route.id'))
    
    reservations = relationship('TripReservation', back_populates='trip')

    location_history = relationship('LocationHistory', back_populates='trip')



