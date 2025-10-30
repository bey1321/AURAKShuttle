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
from db.models.found_item import Found
from db.models.lost_item import Lost
from db.models.claim import Claim
from db.models.userclaim import UserClaim
from db.models.userfound import UserFound
from db.models.userlost import UserLost


from schema.item import MakeClaim, LostItemCreate, FoundItemCreate

router = APIRouter('/trip', tags=['Trip'])

db_dependency = Annotated[Session, Depends(get_db)]





@router.post('/lost_item')
def postLostItem(data: LostItemCreate,db: db_dependency, user = Depends(get_user)):
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

        user_lost = UserLost(
            user_id = user.id,
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
    except:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = 'Internal Server Error')


@router.post('/claim')
def postClaim(data: MakeClaim, db: db_dependency, user = Depends(get_user)):
    try:
        claim = Claim(
            phone = data.phone,
            item_id = data.itemId,

        )

        db.add(claim)
        db.commit()
        db.refresh(claim)

        user_claim = UserClaim(
            user_id = user.id,
            item_id = claim.id
        )

        db.add(user_claim)
        db.commit()
        db.refresh(user_claim)
        
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
            trip_id = data.tripId
        )
        db.add(found_item)
        db.commit()
        db.refresh(found_item)  # Get the generated ID

        # 2️⃣ Create the relation in UserFound
        user_found = UserFound(
            user_id=user.id,
            found_id=found_item.id
        )
        db.add(user_found)
        db.commit()
        db.refresh(user_found)

        return {
            "found_item": {
                "id": found_item.id,
                "name": found_item.obj_name,
                "description": found_item.obj_description
            },
            "user_found": {
                "id": user_found.id,
                "user_id": user_found.user_id,
                "found_id": user_found.item_id
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
