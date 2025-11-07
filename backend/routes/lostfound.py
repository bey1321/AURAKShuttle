from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from typing import Annotated
from sqlalchemy.orm import Session, selectinload
from db.setup import get_db
from middleware.role import get_user
from sqlalchemy import select

from db.models.registered import Registered
from db.models.trip import Trip
from db.models.user import User
from db.models.bus import Bus
from db.models.founditem import Found
from db.models.lostitem import Lost
from db.models.claim import Claim
from db.models.userlost import UserLost
from db.models.rating import Rating

from schema.item import MakeClaim, LostItemCreate, FoundItemCreate

router = APIRouter(prefix='/lostfound', tags=['Trip'])

db_dependency = Annotated[Session, Depends(get_db)]


@router.post('/lost_item')
def postLostItem(data: LostItemCreate,db: db_dependency, user = Depends(get_user)):

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    try:
        lost_item = Lost(
            obj_name = data.obj_name,
            obj_description = data.obj_description,
            obj_type = data.obj_type,
            trip_id = data.trip_id
        )

        db.add(lost_item)
        db.commit()
        db.refresh(lost_item)
        print('good up to here')

        user_lost = UserLost(
            user_id = user['id'],
            
            item_id = lost_item.id
        )

        db.add(user_lost)
        db.commit()
        db.refresh(user_lost)
        
        return {
            "lost_item": {
                "id": lost_item.id,
                "name": lost_item.obj_name,
                "type": lost_item.obj_type,
                "description": lost_item.obj_description
            },
            "user_lost": {
                "id": user_lost.id,
                "user_id": user_lost.user_id,
                "lost_id": user_lost.item_id
            }
        }
    except Exception as e:
        db.rollback()
        print("❌ Error in /lost_item route:", str(e))  # Print real error to terminal
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )


@router.post('/claim/{item_id}')
def postClaim(item_id:int,  db: db_dependency, user = Depends(get_user)):
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Unauthorized access')

    item = db.query(Found).filter(Found.id == item_id).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = f"Unable to find item with id: {item_id}")
    try:
        claim = Claim(
            item_id = item.id,
            claimer_id = user['id']

        )
        item.status = 'claimed'

        db.add(claim)
        db.commit()
        db.refresh(claim)

        return {'message': 'claim successfully made'}
    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')


@router.post('/found_item', status_code=201)
def postFoundItem(data: FoundItemCreate, db: Session = Depends(get_db), user = Depends(get_user)):
    try:
        # 1️⃣ Create a new FoundItem
        found_item = Found(
            obj_name = data.obj_name,
            obj_description = data.obj_description,
            obj_type = data.obj_type,
            trip_id = data.trip_id,
            finder_id = user['id']
        )
        db.add(found_item)
        db.commit()
        db.refresh(found_item)  # Get the generated ID



        return {
            "found_item": {
                "id": found_item.id,
                "name": found_item.obj_name,
                "description": found_item.obj_description
            }

        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal Server Error"
        )


@router.get('/found_items', status_code=status.HTTP_200_OK)
def getFoundItems(db: Session = Depends(get_db)):
    try:
        items = db.query(Found).all()
        return {'found_items': items}

    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal Server Error"
        )


@router.get('/lost_item', status_code=status.HTTP_200_OK)
def getLostItems(db: db_dependency):
    try:
        items = db.query(Lost).all()
        return {'lost items': items}

    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal Server Error"
        )



@router.get('/admin/found_and_claim') # need response model to filter the password fromt the data to be sent
def get_found_items(db: Session = Depends(get_db), user = Depends(get_user) ):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "User not authorized")
    
    if user['role'] != 'admin':
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Not allowed")
    
    try:

        query = (
            select(Found).where(Found.status != 'recieved').options(
                selectinload(Found.claim).selectinload(Claim.claimer),
                selectinload(Found.discoveredBy),
                selectinload(Found.trip)
            )
        )

        found_items = db.scalars(query).all()

        return found_items



    except Exception as e:
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Unable to fetch found items. {str(e)}"
        )
    


@router.post('/admin/found_recieved/student/{student_id}/claim/{claim_id}')
def declare_recieved(student_id: int, claim_id: int, db: Session = Depends(get_db), user = Depends(get_user) ):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "User not authorized")
    
    if user['role'] != 'admin':
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Not allowed")
    
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail = f"Unable to student with id: {student_id}"
        )
    claim = db.query(Claim).filter(Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail = f"Unable to claim with id: {claim_id}"
        )
    
    try:

        claim.status = 'recieved'

        found_item = db.query(Found).filter(Found.id == claim.item_id).first()

        if not found_item:
            raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail = f"Unable to item with id: {claim.item_id}"
            )
        
        found_item.status = 'recieved'

        db.commit()

        return {'message': 'Updated done!'}

    except Exception as e:
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Unable to update found item. {str(e)}"
        )
    

@router.post('/admin/approve/claim/{claim_id}')
def approve_claim(claim_id: int, db: Session = Depends(get_db), user = Depends(get_user) ):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "User not authorized")
    
    if user['role'] != 'admin':
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail = "Not allowed")
    claim = db.query(Claim).filter(Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail = f"Unable to claim with id: {claim_id}"
        )
    try:
        claim.status = 'approved'
        db.commit()

        return {'message': 'Claim approved'}

    except Exception as e:
        raise HTTPException(
                status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail = f"Unable to approve claim. {str(e)}"
            )
        