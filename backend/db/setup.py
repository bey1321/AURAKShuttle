import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

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


DATABASE_URL = "sqlite+aiosqlite:///./database.db"  # Example for SQLite async

# Create the async engine
async_engine = create_async_engine(
    DATABASE_URL,
    echo=True,           # optional: logs SQL statements
)
# This is what you will use as AsyncSessionLocal
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,  # important: must use AsyncSession class
    expire_on_commit=False,
    autoflush=False
)

async def get_async_db():
    """
    FastAPI dependency to get an async database session.
    Usage in endpoints:
        async def endpoint(db: AsyncSession = Depends(get_async_db))
    """
    async with AsyncSessionLocal() as db:  # context manager ensures session is closed
        yield db