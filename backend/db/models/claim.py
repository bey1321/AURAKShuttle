from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..setup import Base

class Claim(Base):
    __tablename__ = "claim"

    id = Column(Integer, autoincrement=True, primary_key=True)
    
    claimer = relationship('User', back_populates='claim')
    claimer_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    

    item = relationship('Found', back_populates='claim')
    item_id = Column(Integer, ForeignKey('found.id'))

    status = Column(String, default="pending")  # pending, approved, received

