from sqlalchemy import Column, String

from ..setup import Base

class Terminal(Base):
    __tablename__ = "terminal"

    terminal =  Column(String, nullable= False, index=True, primary_key=True)
    city = Column(String, nullable= False)