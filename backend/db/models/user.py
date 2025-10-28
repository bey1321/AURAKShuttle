from sqlalchemy import Integer, Column, String
from sqlalchemy.orm import relationship
from ..setup import Base

import re

class User(Base):
    __tablename__ = "user"


    #change to school id
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String,nullable=False, unique=True)  # add email validater later
    hased_password= Column(String, nullable= False)
    
    role = Column(String, default='student')
    
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(Integer, nullable = True)

    drives = relationship('DriverTrip', back_populates='driver')
    
    claim = relationship('UserClaim',back_populates='user')
    lost = relationship('UserLost', back_populates='user')
    found = relationship('UserFound', back_populates='user')
    rating = relationship('Rating', back_populates='user')


