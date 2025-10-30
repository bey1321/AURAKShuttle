from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from ..setup import Base

class Terminal(Base):
    __tablename__ = "terminal"

    terminalName =  Column(String, nullable= False, index=True, primary_key=True)
    city = Column(String, nullable= False)

    trip = relationship('TripTerminal', back_populates='trip-terminal')
    start_trip = relationship('Trip', back_populates='trip-terminal')

