from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..setup import Base

class Claim(Base):
    __tablename__ = "claim"

    id = Column(Integer, autoincrement=True, primary_key=True)
    stud_id = relationship('User', back_populates='claim')
    stud_name = Column(String)  # not really necessary to store it here
    phone = Column(Integer, nullable = False)
    email = Column(String) # again not necessary
