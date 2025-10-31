from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

class Route(Base):
    __tablename__ = "route"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  # e.g., "Route 42"
    
    start_terminal_id = Column(Integer, ForeignKey('terminal.id'))
    
    start_terminal = relationship('Terminal', foreign_keys=[start_terminal_id])
    terminal = relationship('TripTerminal', back_populates='trip')
    
    status = Column(String, default='active')  # active/inactive
    
    trips = relationship('Trip', back_populates='route')
    student = relationship('Registered', back_populates='route')

    type = Column(String, default = 'regular')
