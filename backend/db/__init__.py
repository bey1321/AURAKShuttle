from .setup import Base, engine
from .models.bus import Bus
from .models.claim import Claim
from .models.lostfound import LostFound
from .models.schedule import Schedule
from .models.terminal import Terminal
from .models.trip import Trip
from .models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)
    print('All tables created successfully')


if __name__ == "__main__":
    init_db()
