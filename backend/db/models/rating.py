from sqlalchemy import Integer, Column,String, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base


class Rating(Base):

    __tablename__ = 'rating'

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey('user.id'))
    user = relationship('User', back_populates='rating')

    trip_id = Column(Integer, ForeignKey('trip.id'))
    trip = relationship('Trip', back_populates='rating')

    cleanliness = Column(Integer)
    driver_rating = Column(Integer)
    timeliness = Column(Integer)
    comment = Column(String)
