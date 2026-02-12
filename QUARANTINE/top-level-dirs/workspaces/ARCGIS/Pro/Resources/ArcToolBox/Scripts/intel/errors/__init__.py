import arcpy

class TimeEnablementError(ValueError):
    pass

class DuplicateDates(ValueError):
    pass

class GASparkNotInitializedError(arcpy.ExecuteError):
    pass

class InvalidPortalTokenError(BaseException):
    pass