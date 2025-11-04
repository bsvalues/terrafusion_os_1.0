"""For the Calculate Transit Service Frequency tool, defines Service Area solver object properties that are not
specified in the tool dialog.

A list of Service Area solver properties is documented here:
https://pro.arcgis.com/en/pro-app/latest/arcpy/network-analyst/servicearea.htm

You can include any of them in the dictionary in this file, and the tool will
use them. However, the defaultImpedanceCutoffs, travelMode, timeUnits, and distanceUnits properties will
be ignored because those are specified using the tool's input parameters. The polygonBufferDistance and
polygonBufferDistanceUnits properties will be ignored because optimal values are calculated internally based
on the user's input cell size value.
"""

import arcpy

SA_SETTINGS = {
    "accumulateAttributeNames": [],
    # "allowAutoRelocate": True,  # Not all portals support this parameter. Only uncomment if you are using this.
    "allowSaveLayerFile": False,
    "excludeSourcesFromPolygonGeneration": [],
    "geometryAtCutoff": arcpy.nax.ServiceAreaPolygonCutoffGeometry.Rings,
    "geometryAtOverlap": arcpy.nax.ServiceAreaOverlapGeometry.Overlap,
    "ignoreInvalidLocations": True,
    "outputType": arcpy.nax.ServiceAreaOutputType.Polygons,
    "overrides": "",
    "polygonDetail": arcpy.nax.ServiceAreaPolygonDetail.High,
    # "searchSources": [],  # This parameter is very network specific. Only uncomment if you are using it.
    "searchTolerance": 500,
    "searchToleranceUnits": arcpy.nax.DistanceUnits.Meters,
    "timeOfDay": None,
    "timeZone": arcpy.nax.TimeZoneUsage.LocalTimeAtLocations,
    "travelDirection": arcpy.nax.TravelDirection.FromFacility
}
