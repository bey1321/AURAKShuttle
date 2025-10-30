from sqlalchemy import Integer, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base


class UserLost(Base):

    __tablename__ ='userlost'

    id = Column(Integer, primary_key=True, autoincrement=True)

    user = relationship('User', back_populates='lost')
    user_id = Column(Integer, ForeignKey('user.id'))

    item = relationship('Lost', back_populates='user')
    item_id = Column(Integer, ForeignKey('lost.id'))

