import arcpy


class ToolValidator(object):
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if self.params[0].value and not self.params[0].hasBeenValidated:
            try:
                desc = arcpy.Describe(self.params[0].value)
                shapeType = desc.shapeType
                sr = desc.spatialReference
                gcsOrMercator = False if not sr.GCSName and sr.PCSName.upper().find(
                    "MERCATOR") == -1 else True

                if shapeType.upper() == "POINT":
                    self.params[1].filter.list = ["POINT_X_Y_Z_M"]
                elif shapeType.upper() == "MULTIPOINT":
                    self.params[1].filter.list = ["CENTROID", "PART_COUNT",
                                                  "EXTENT"]
                elif shapeType.upper() == "POLYLINE":
                    if desc.hasZ:
                        lineList = ["LENGTH", "LENGTH_GEODESIC", "LENGTH_3D",
                                    "LINE_START_MID_END", "CENTROID",
                                    "CENTROID_INSIDE", "PART_COUNT",
                                    "POINT_COUNT", "LINE_BEARING", "EXTENT"]
                    else:
                        lineList = ["LENGTH", "LENGTH_GEODESIC",
                                    "LINE_START_MID_END", "CENTROID",
                                    "CENTROID_INSIDE", "PART_COUNT",
                                    "POINT_COUNT", "LINE_BEARING", "EXTENT"]
                    self.params[1].filter.list = lineList
                    if gcsOrMercator:
                        lineList.remove("LENGTH")
                        if desc.hasZ:
                            lineList.remove("LENGTH_3D")
                        self.params[1].filter.list = lineList
                elif shapeType.upper() == "POLYGON":
                    polyList = ["AREA", "AREA_GEODESIC", "PERIMETER_LENGTH",
                                "PERIMETER_LENGTH_GEODESIC", "CENTROID",
                                "CENTROID_INSIDE", "LINE_START_MID_END",
                                "PART_COUNT", "POINT_COUNT", "EXTENT"]
                    self.params[1].filter.list = polyList
                    if gcsOrMercator:
                        polyList.remove("AREA")
                        polyList.remove("PERIMETER_LENGTH")
                        self.params[1].filter.list = polyList
            except:
                pass

        if self.params[1].value:
            self.params[5].parameterDependencies = [0]
            self.params[5].schema.clone = True
            newFields = []
            propDict = {"POINT_X_Y_Z_M": ["POINT_X",
                                          "POINT_Y",
                                          "POINT_Z",
                                          "POINT_M"],
                        "PART_COUNT": ["PART_COUNT"],
                        "CENTROID": ["CENTROID_X",
                                     "CENTROID_Y",
                                     "CENTROID_Z",
                                     "CENTROID_M"],
                        "EXTENT": ["EXT_MIN_X",
                                   "EXT_MIN_Y",
                                   "EXT_MAX_X",
                                   "EXT_MAX_Y"],
                        "POINT_COUNT": ["PNT_COUNT"],
                        "LINE_START_MID_END": ["START_X",
                                               "START_Y",
                                               "START_Z",
                                               "START_M",
                                               "MID_X",
                                               "MID_Y",
                                               "MID_Z",
                                               "MID_M",
                                               "END_X",
                                               "END_Y",
                                               "END_Z",
                                               "END_M"],
                        "LINE_BEARING": ["BEARING"],
                        "CENTROID_INSIDE": ["INSIDE_X",
                                            "INSIDE_Y",
                                            "INSIDE_Z",
                                            "INSIDE_M"],
                        "LENGTH": ["LENGTH"],
                        "PERIMETER_LENGTH": ["PERIMETER"],
                        "AREA": ["POLY_AREA"],
                        "LENGTH_GEODESIC": ["LENGTH_GEO"],
                        "AREA_GEODESIC": ["AREA_GEO"],
                        "LENGTH_3D": ["LENGTH_3D"],
                        "PERIMETER_LENGTH_GEODESIC": ["PERIM_GEO"],
                        }
            for prop in str(self.params[1].value).split(";"):
                if prop in propDict.keys():
                    for field in propDict[prop]:
                        newField = arcpy.Field()
                        newField.type, newField.name, newField.alias = "DOUBLE", field, field
                        newFields.append(newField)
            self.params[5].schema.additionalFields = newFields
        return

    def updateMessages(self):
        """ Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
