from enum import Enum


class esriTimeUnits(Enum):
    '''
    https://pro.arcgis.com/en/pro-app/latest/sdk/api-reference/#topic118.html
    '''
    Centuries = r"esriTimeUnitsCenturies"
    Decades = r"esriTimeUnitsDecades"
    Years = r"esriTimeUnitsYears"
    Months = r"esriTimeUnitsMonths"
    Weeks = r"esriTimeUnitsWeeks"
    Days = r"esriTimeUnitsDays"
    Hours = r"esriTimeUnitsHours"
    Minutes = r"esriTimeUnitsMinutes"
    Seconds = r"esriTimeUnitsSeconds"
    Milliseconds = r"esriTimeUnitsMilliseconds"
    Unknown = r"esriTimeUnitsUnknown"
