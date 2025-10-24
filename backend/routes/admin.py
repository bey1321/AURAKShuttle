from fastapi import APIRouter, Request, Response

from schema.admin import newDriver, updateDriver
router  = APIRouter('/admin', tags=['admin'])


#driver related routes
@router.post('/create/driver')
def createDriver(newDriver: newDriver):
    try:
        pass
    except:
        pass

@router.patch('/update/driver')
def updateDriver():
    pass

@router.delete('/delete/driver')
def deleteDriver():
    pass


#bus related routes
@router.post('/create/bus')
def createBus():
    pass

@router.patch('/update/bus')
def updateBus():
    pass

@router.delete('/delete/bus')
def deleteBus():
    pass



#trip related routes
@router.post('/create/trip')
def createTrip():
    pass


@router.put('/update/trip')
def updateTrip():
    pass

@router.delete('delete/trip/{id}')
def deleteTrip(id: int):
    pass



#lost and found related routes
@router.get('/remove_item/{id}')
def removeItem(id: int):
    pass

@router.get('/approve_item/{id}')
def approveItem(id: int):
    pass

@router.get('/approve_item/{id}')
def approveItem(id: int):
    pass

