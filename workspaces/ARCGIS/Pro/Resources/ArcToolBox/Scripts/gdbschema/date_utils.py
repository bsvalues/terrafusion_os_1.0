from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import datetime


def to_datetime(val: int | str | float | Decimal | datetime.datetime) -> datetime.datetime | None:
    """Converts val to date object"""

    from datetime import datetime, date, time, timedelta

    if isinstance(val, int):  # Date + Time
        # datetime.fromtimestamp does not handle dates before epoch
        return datetime(1970, 1, 1) + timedelta(milliseconds=val)
    elif isinstance(val, str):
        if "T" in val:  # Timestamp
            return datetime.fromisoformat(val).replace(tzinfo=None)
        elif "-" in val:  # Date
            return datetime.combine(date.fromisoformat(val), time())
        else:  # Time
            return datetime.combine(date(1899, 12, 30), time.fromisoformat(val))
    elif isinstance(val, datetime):
        return val
    elif isinstance(val, (float, Decimal)):
        return ole_date_to_datetime(val)


def to_datetime_str(val) -> str:
    """Converts val to a ISO-8601 date string"""

    if (as_date := to_datetime(val)) is None:
        return val

    return as_date.isoformat(timespec="milliseconds" if as_date.microsecond else "seconds")


def to_stamp(val) -> int:
    """Converts val to a POSIX timestamp"""
    from datetime import datetime

    if (as_date := to_datetime(val)) is None:
        return val

    return int((as_date - datetime(1970, 1, 1)).total_seconds() * 1_000)


def ole_date_to_datetime(com: float) -> datetime.datetime:
    """Converts OLE date to datetime object"""
    from datetime import datetime, timedelta
    from math import modf

    seconds, days = modf(com)
    seconds *= 86_400  # number of seconds in a day

    # Seconds are always treated as positive.
    delta = timedelta(days=days, seconds=abs(seconds))
    return datetime(1899, 12, 30) + delta


def date_to_ole(val: datetime.date | datetime.time) -> float:
    """Converts date/time/datetime to OLE date"""
    from datetime import datetime, date, time, timedelta

    # https://docs.microsoft.com/en-us/cpp/atl-mfc-shared/date-type?view=vs-2019

    if isinstance(val, time):
        delta = timedelta(hours=val.hour, minutes=val.minute, seconds=val.second, microseconds=val.microsecond)
    elif isinstance(val, datetime):
        delta = val - datetime(1899, 12, 30)
    else:
        delta = val - date(1899, 12, 30)

    seconds = delta.seconds / 86_400  # Number of seconds in a day
    # If days is negative, we need to subtract the seconds portion.
    return delta.days - seconds if delta.days < 0 else delta.days + seconds
