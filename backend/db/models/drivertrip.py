from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

class DriverTrip(Base):

    __tablename__ = 'drivertrip'

    id = Column(Integer, primary_key=True, autoincrement=True)

    driver = relationship('User', back_populates='drives')
    trip = relationship('Trip', back_populates='driver')

    driver_id = Column(Integer, ForeignKey('user.id'))
    trip_id = Column(Integer, ForeignKey('trip.id'))


