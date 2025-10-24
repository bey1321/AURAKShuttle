from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship

from ..setup import Base
from datetime import datetime, date
class LostFound(Base):
    __tablename__ = "lostfound"

    id = Column(Integer, primary_key=True, autoincrement=True)

    obj_name = Column(String, nullable=False)
    obj_description = Column(String, nullable= True)
    obj_type = Column(String)
    
    date = Column(Date, default = datetime.now().date())
    status = Column(String, default = 'found')  #prepare domain for it
    

    trip_id = relationship('Trip', back_populates='lost_item')

