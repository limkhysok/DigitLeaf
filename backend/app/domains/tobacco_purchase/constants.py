from enum import Enum

class ClosingStatus(str, Enum):
    YES = "YES"
    NO = "NO"

class TobaccoCategory(int, Enum):
    LEAF = 2
    # Add others if known, but 2 is what's used currently.
