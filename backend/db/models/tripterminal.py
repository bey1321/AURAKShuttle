from sqlalchemy import Column, Integer, String, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from ..setup import Base

class TripTerminal(Base):

    __tablename__ = 'tripterminal'

    route_id = Column(Integer, ForeignKey('route.id'))
    terminal_id = Column (String, ForeignKey('terminal.id'))

    trip = relationship('Route', back_populates='terminal')
    terminal = relationship('Terminal', back_populates='trip')


    __table_args__ = (
        PrimaryKeyConstraint('terminal_id', 'route_id'),
    )





