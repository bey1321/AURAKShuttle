from pydantic import BaseModel

class BusCreateRequest(BaseModel):

    plate_num: str
    no_seats: int
    model: str = None
    manufacturer: str = None
    status: str =None



class BusUpdateRequst(BaseModel):
    plate_num: str =None
    no_seats: int = None
    model: str = None
    manufacturer: str = None
    status: str =None