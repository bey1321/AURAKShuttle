from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..setup import Base

class Bus(Base):
    __tablename__ = "bus"
    id = Column(Integer,primary_key=True,autoincrement=True )
    plate_num = Column(String,  nullable= False)
    no_seats = Column(Integer)
    #bus model

    trip = relationship('Trip', back_populates='bus')
    