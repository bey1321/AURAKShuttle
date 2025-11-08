from sqlalchemy import Column, Integer, String, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from ..setup import Base

class TripTerminal(Base):

    __tablename__ = 'tripterminal'

    route_id = Column(Integer, ForeignKey('route.id'))
    terminal_id = Column (Integer, ForeignKey('terminal.id'))

    route = relationship('Route', back_populates='terminals')
    terminal = relationship('Terminal', back_populates='tripterminals')


    __table_args__ = (
        PrimaryKeyConstraint('terminal_id', 'route_id'),
    )





