from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from ..setup import Base
from datetime import datetime, date


class Lost(Base):
    __tablename__ = "lost"

    id = Column(Integer, primary_key=True, autoincrement=True)

    obj_name = Column(String, nullable=False)
    obj_description = Column(String, nullable= True)
    obj_type = Column(String)
    
    date = Column(Date, default = datetime.now().date())
    status = Column(String, default = 'pending')  #prepare domain for it
    

    trip = relationship('Trip', back_populates='lost_item')
    trip_id = Column(Integer,ForeignKey('trip.id'))

    user = relationship('UserLost', back_populates='item')


