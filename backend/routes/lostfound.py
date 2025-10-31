from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from typing import Annotated
from sqlalchemy.orm import Session
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
            obj_name = data.objName,
            obj_description = data.objDescription,
            obj_type = data.objType,
            trip_id = data.tripId
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


    try:
        claim = Claim(
            item_id = item_id,
            claimer_id = user['id']

        )

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
            obj_name = data.objName,
            obj_description = data.objDescription,
            obj_type = data.objType,
            trip_id = data.tripId,
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





