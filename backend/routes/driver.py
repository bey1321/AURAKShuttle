
from fastapi import APIRouter, Request, Response


router  = APIRouter('/driver', tags=['Driver'])


@router.post('/log_detail')  #related to start time and end time of the trip
def logTripDetails():
    pass

@router.post('/notify')
def notify():
    pass


#routes related to gps tracking