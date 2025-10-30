from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..setup import Base

class Claim(Base):
    __tablename__ = "claim"

    id = Column(Integer, autoincrement=True, primary_key=True)
    
    claimer = relationship('UserClaim', back_populates='claim')
    
    phone = Column(Integer, nullable = False)

    item = relationship('Found', back_populates='claim')
    item_id = Column(Integer, ForeignKey('Found.id'))
