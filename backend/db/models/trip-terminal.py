from sqlalchemy import Column, Integer, String, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from ..setup import Base

class TripTerminal(Base):

    __tablename__ = 'tripterminal'

    trip_id = Column(Integer, ForeignKey('trip.id'))
    terminal_id = Column (String, ForeignKey('terminal.terminalName'))

    trip = relationship('Trip', back_populates='terminal')
    terminal = relationship('Terminal', back_populates='trip')


    __table_args__ = (
        PrimaryKeyConstraint('terminal_id', 'trip_id')
    )





