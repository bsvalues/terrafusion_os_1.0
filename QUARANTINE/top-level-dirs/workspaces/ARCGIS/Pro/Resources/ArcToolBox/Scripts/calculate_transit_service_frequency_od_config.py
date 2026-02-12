"""For the Calculate Transit Service Frequency tool, defines OD Cost matrix solver object properties that are not
specified in the tool dialog.

A list of OD cost matrix solver properties is documented here:
https://pro.arcgis.com/en/pro-app/latest/arcpy/network-analyst/odcostmatrix.htm

You can include any of them in the dictionary in this file, and the tool will
use them. However, the defaultImpedanceCutoff, travelMode, timeUnits, and distanceUnits properties will
be ignored because those are specified using the tool's input parameters.
"""

import arcpy

OD_SETTINGS = {
    "accumulateAttributeNames": [],
    # "allowAutoRelocate": True,  # Not all portals support this parameter. Only uncomment if you are using this.
    "allowSaveLayerFile": False,
    "defaultDestinationCount": None,  # "None" means find all destinations for each origin
    "ignoreInvalidLocations": True,
    "lineShapeType": arcpy.nax.LineShapeType.NoLine,
    "overrides": "",
    # "searchSources": [],  # This parameter is very network specific. Only uncomment if you are using it.
    "searchTolerance": 500,
    "searchToleranceUnits": arcpy.nax.DistanceUnits.Meters,
    "timeOfDay": None,
    "timeZone": arcpy.nax.TimeZoneUsage.LocalTimeAtLocations,
}
