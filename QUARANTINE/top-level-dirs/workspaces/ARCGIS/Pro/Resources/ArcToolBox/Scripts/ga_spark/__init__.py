import arcpy

# check license before doing anything else
if not (arcpy.CheckProduct("ArcInfo") in ["Available", "AlreadyInitialized"]):
    # TODO "tool not licensed is not quite the right error in this case"
    arcpy.AddError(arcpy.GetIDMessage(824))
    raise Exception(arcpy.GetIDMessage(824))

from .local import _launcher
from .local import _extensions

from . import extensions

spark = _launcher.ProSparkSession()

def get_or_create():
    """
    Gets a SparkSession that uses the Spark runtime that ships with Pro and provides
    access to GeoAnalytics functionality.

    :return: a new or existing SparkSession
    """
    return spark
