from datetime import datetime as dt
from uuid import uuid4

# These are module level constants, so they will not change between rows during CalculateField.
# However, it will change between runs, so if you want this to always be static, you can use the following format:
# NOW = datetime(year=2019, month=1, day=1, hour=8, minute=35, second=26)
NOW = dt.now()
NOW_UTC = dt.utcnow()


def create_guid() -> str:
    """Creates a UUID that can be stored in a GUID field"""
    return f"{{{uuid4()}}}"


def concatenate(*values: str, delimiter: str = " ") -> str:
    """
    Concatenates multiple values together with a delimiter, removing Null values.

    Args:
        values: the values to join together. They will be cast to string before concatenation
        delimiter (str): the delimiter to join the fields with. Defaults to " "
    """
    return delimiter.join(map(str, filter(None, values)))


def year_to_date(year, month: int = 1, day: int = 1) -> dt:
    """Converts a 2 or 4 year date str/int representation into a datetime object"""
    if not year or not month or not day:
        return None
    return dt.strptime(f"{year}/{month}/{day}", f"{'%y' if len(str(year)) == 2 else '%Y'}/%m/%d")


def conditional(expression, true_value=1, false_value=0):
    """Returns a given value if a conditional expression evaluates to True, and returns an alternate value if that
    condition evaluates to False."""
    return true_value if expression else false_value


def left(value: str, count: int = 1) -> str:
    """Returns the specified number of characters from the beginning of a text value"""
    if not value:
        return value
    return value[:count] if count > 0 else ""


def right(value: str, count: int = 1) -> str:
    """Returns the specified number of characters from the end of a text value"""
    if not value:
        return value
    return value[-count:] if count > 0 else ""


def upper(value: str) -> str:
    """Makes a text value upper case."""
    if not value:
        return value
    return value.upper()


def lower(value: str) -> str:
    """Makes a text value lower case."""
    if not value:
        return value
    return value.lower()


def title(value: str) -> str:
    """Makes a text value title case."""
    if not value:
        return value
    return value.title()
