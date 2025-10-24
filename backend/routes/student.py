from fastapi import APIRouter


router = APIRouter('/trip', tags=['Trip'])


@router.get('/get_mytrip')
def getTrip():
    pass


@router.get('/all_trips')
def getAllTrips():
    pass


@router.get('/get_trip/{id}')
def getTrip(id: int):
    pass


@router.get('/researve_seat/{id}') #id: trip number
def getTrip(id: int):
    pass


@router.post('/lost_item')
def postLostItem():
    pass


@router.post('/claim')
def postClaim():
    pass
