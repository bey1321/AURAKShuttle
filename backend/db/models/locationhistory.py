from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship

from ..setup import Base
from datetime import datetime, date

import uuid


def generate_uuid():
    return str(uuid.uuid4())


class LocationHistory(Base):

    __tablename__ = 'location_history'

    id = Column(String, primary_key= True, default = generate_uuid)
    trip_id = Column(String, ForeignKey('trip.id'), nullable = False)
    
    latitude =Column(Float, nullable = False)
    longtitude = Column(Float, nullable=False)

    speed = Column(Float, default = 0.0)
    heading = Column(Float, default = 0.0)

    timestamp = Column(DateTime, default = datetime.now , index = True)

    trip = relationship('Trip', back_populates='location_history')