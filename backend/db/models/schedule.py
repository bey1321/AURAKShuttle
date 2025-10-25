from sqlalchemy import Integer, Column, String, Time
from ..setup import Base
from datetime import time

class Schedule(Base):
    __tablename__ = "schedule"

    start_time = Column(Time, primary_key=True)