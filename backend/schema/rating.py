from pydantic import BaseModel


class RatingRequest(BaseModel):
    
    trip_id: int
    cleanliness: int
    driver_rating: int
    timeliness: int
    comment: str


class RatingResponse(BaseModel):
    pass