from sqlalchemy import Integer, Column, String
from sqlalchemy.orm import relationship
from ..setup import Base

import re

class User(Base):
    __tablename__ = "user"

    email = Column(String,nullable=False, unique=True, primary_key=True, index = True)  # add email validater later
    hased_password= Column(String, nullable= False)
    role = Column(String, default='student')
    
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(Integer, nullable = True)

