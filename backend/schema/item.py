from pydantic import BaseModel

class LostItemCreate(BaseModel):
    obj_name: str
    obj_description: str
    obj_type: str
    trip_id: int

class MakeClaim(BaseModel):
    itemId:int

class FoundItemCreate(BaseModel):
    obj_name: str
    obj_description: str
    obj_type: str
    trip_id: int