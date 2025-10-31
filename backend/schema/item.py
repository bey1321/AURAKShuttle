from pydantic import BaseModel

class LostItemCreate(BaseModel):
    objName: str
    objDescription: str
    objType: str
    tripId: int

class MakeClaim(BaseModel):
    itemId:int

class FoundItemCreate(BaseModel):
    objName: str
    objDescription: str
    objType: str
    tripId: int