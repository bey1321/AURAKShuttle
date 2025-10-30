from sqlalchemy import Integer, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..setup import Base


class UserClaim(Base):

    __tablename__ ='userclaim'

    id = Column(Integer, primary_key=True, autoincrement=True)

    user = relationship('User', back_populates='claim')
    user_id = Column(Integer, ForeignKey('user.id'))

    claim = relationship('Claim', back_populates='claimer')
    claim_id = Column(Integer, ForeignKey('claim.id'))