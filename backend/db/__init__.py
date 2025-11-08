from .setup import Base, engine
from .models.bus import Bus
from .models.claim import Claim
from .models.lostitem import Lost
from .models.terminal import Terminal
from .models.trip import Trip
from .models.user import User
from .models.registered import Registered
from .models.founditem import Found
from .models.rating import Rating
from .models.tripterminal import TripTerminal
from .models.userlost import UserLost
from .models.user import User
from .models.route import Route
from .models.tripreservation import TripReservation
from .models.locationhistory import LocationHistory
def init_db():
    Base.metadata.drop_all(engine)

    Base.metadata.create_all(bind=engine)
    print('All tables created successfully')


if __name__ == "__main__":
    init_db()
