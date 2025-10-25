import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


load_dotenv()


DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL, echo= True)


Session = sessionmaker(autocommit= False, autoflush=False, bind = engine)


Base = declarative_base()

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()