from sqlalchemy import Integer, Column, String, PrimaryKeyConstraint, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base

class Registered(Base):
    __tablename__ = 'registered'

    id = Column(Integer, primary_key=True, autoincrement=True)

    student = relationship('User', back_populates='route')
    student_id = Column(String, ForeignKey('user.id'))
    
    route = relationship('Route', back_populates='student')
    route_id = Column(Integer, ForeignKey('route.id'))

    status = Column(String, default = 'requested')

