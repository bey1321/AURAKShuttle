from sqlalchemy import Column, Integer, String
from ..setup import Base

class Bus(Base):
    __tablename__ = "bus"
    
    plate_num = Column(String, primary_key=True, nullable= False)
    no_seats = Column(Integer)
    