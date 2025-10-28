from sqlalchemy import Integer, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base


class UserFound(Base):

    __tablename__ ='userfound'

    id = Column(Integer, primary_key=True, autoincrement=True)

    user = relationship('User', back_populates='found')
    user_id = Column(Integer, ForeignKey('user.id'))

    claim = relationship('Found', back_populates='claimer')
    claim_id = Column(Integer, ForeignKey('found.id'))