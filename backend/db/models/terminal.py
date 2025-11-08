from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from ..setup import Base

class Terminal(Base):
    __tablename__ = "terminal"

    id = Column(Integer, index=True, primary_key=True, autoincrement=True)
    
    terminalName =  Column(String, nullable= False)
    city = Column(String, nullable= False)

    start_trip = relationship('Route', back_populates='start_terminal')
    tripterminals = relationship('TripTerminal', back_populates='terminal')


