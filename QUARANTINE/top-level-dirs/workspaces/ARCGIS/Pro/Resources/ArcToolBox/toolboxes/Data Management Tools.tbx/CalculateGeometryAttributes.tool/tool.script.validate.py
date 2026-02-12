import arcpy

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        self.params[2].enabled = False
        self.params[3].enabled = False
        self.params[6].enabled = False

        self.params[0].displayOrder = 0
        self.params[1].displayOrder = 1
        self.params[2].displayOrder = 2
        self.params[3].displayOrder = 3
        self.params[6].displayOrder = 4
        self.params[4].displayOrder = 5

        self.params[5].parameterDependencies = [0]
        self.params[5].schema.clone = True

        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if self.params[0].value: #and not self.params[0].hasBeenValidated: #Comment out since depends on CS param
            try:
                desc = arcpy.Describe(self.params[0].value)
                shapeType = desc.shapeType
                sr = desc.spatialReference
                if self.params[4].value:
                    sr = arcpy.SpatialReference(text=self.params[4].value.value.split("\x00")[0])
                gcsOrMercator = (sr.type == "Geographic" or
                                ("WEB_MERCATOR" in sr.PCSName.upper()))

                # define some easy to update lists of properties
                centroids = ["CENTROID_X", "CENTROID_Y", "CENTROID_Z",
                             "CENTROID_M"]
                extents = ["EXTENT_MIN_X", "EXTENT_MIN_Y", "EXTENT_MIN_Z",
                           "EXTENT_MAX_X", "EXTENT_MAX_Y", "EXTENT_MAX_Z"]
                lengths = ["LENGTH", "LENGTH_GEODESIC", "LENGTH_3D"]
                linestartend = ["LINE_START_X", "LINE_START_Y", "LINE_START_Z",
                                "LINE_START_M", "LINE_END_X", "LINE_END_Y",
                                "LINE_END_Z", "LINE_END_M"]
                insides = ["INSIDE_X", "INSIDE_Y", "INSIDE_Z", "INSIDE_M"]

                # check geometry types to define the property list
                if shapeType.upper() == "POINT":
                    propList = ["POINT_X", "POINT_Y", "POINT_Z", "POINT_M",
                                "POINT_COORD_NOTATION"]
                elif shapeType.upper() == "MULTIPOINT":
                    propList = centroids + ["PART_COUNT"] + extents
                elif shapeType.upper() == "POLYLINE":
                    propList = lengths + ["LINE_BEARING", "PART_COUNT",
                                          "POINT_COUNT",
                                          "CURVE_COUNT"] + linestartend + centroids + insides + extents
                elif shapeType.upper() == "POLYGON":
                    propList = ["AREA", "AREA_GEODESIC", "PERIMETER_LENGTH",
                                "PERIMETER_LENGTH_GEODESIC", "PART_COUNT",
                                "POINT_COUNT", "HOLE_COUNT",
                                "CURVE_COUNT"] + centroids + insides + extents
                elif shapeType.upper() == "MULTIPATCH":
                    propList = ["AREA", "PART_COUNT",
                                "POINT_COUNT"] + centroids + insides + extents

                # Remove 3d/Z properties if the data is not Z-aware
                if not desc.hasZ:
                    for propZ in ["POINT_Z", "CENTROID_Z", "INSIDE_Z",
                                  "LINE_START_Z", "LINE_END_Z", "LENGTH_3D",
                                  "EXTENT_MIN_Z", "EXTENT_MAX_Z"]:
                        try:
                            propList.remove(propZ)
                        except:
                            pass
                # Remove M properties if the data is not M-aware
                if not desc.hasM:
                    for propM in ["POINT_M", "CENTROID_M", "INSIDE_M",
                                  "LINE_START_M", "LINE_END_M"]:
                        try:
                            propList.remove(propM)
                        except:
                            pass
                # Remove Euclidean measurements if the data is GCS/Mercator
                if gcsOrMercator and not self.params[4].value:
                    for propGCS in ["LENGTH", "AREA", "PERIMETER_LENGTH"]:
                        try:
                            propList.remove(propGCS)
                        except:
                            pass
                # Remove Geodesic options if the data SR is Unknown
                if sr.name.upper() == "UNKNOWN":
                    for propUk in ["LENGTH_GEODESIC", "AREA_GEODESIC",
                                   "PERIMETER_LENGTH_GEODESIC"]:
                        try:
                            propList.remove(propUk)
                        except:
                            pass
                self.params[1].filters[1].list = propList
            except:
                pass

        # Check for length or area to enable unit parameters
        if self.params[1].value and not self.params[1].hasBeenValidated:
            fields, geomProps = zip(*self.params[1].value)
            if any("LENGTH" in s for s in geomProps):
                self.params[2].enabled = True
            else:
                self.params[2].enabled = False
            if any("AREA" in s for s in geomProps):
                self.params[3].enabled = True
            else:
                self.params[3].enabled = False
            if any("POINT_X" in s for s in geomProps) or any(
                    "POINT_Y" in s for s in geomProps) or any(
                    "POINT_COORD_NOTATION" in s for s in geomProps) or any(
                    "CENTROID_X" in s for s in geomProps) or any(
                    "CENTROID_Y" in s for s in geomProps) or any(
                    "INSIDE_X" in s for s in geomProps) or any(
                    "INSIDE_Y" in s for s in geomProps) or any(
                    "LINE_START_X" in s for s in geomProps) or any(
                    "LINE_START_Y" in s for s in geomProps) or any(
                    "LINE_END_X" in s for s in geomProps) or any(
                    "LINE_END_Y" in s for s in geomProps) or any(
                    "EXTENT_MIN_X" in s for s in geomProps) or any(
                    "EXTENT_MAX_X" in s for s in geomProps) or any(
                    "EXTENT_MIN_Y" in s for s in geomProps) or any(
                    "EXTENT_MAX_Y" in s for s in geomProps):
                self.params[6].enabled = True
                if "POINT_COORD_NOTATION" not in geomProps:
                    self.params[6].filter.list = ["SAME_AS_INPUT", "DD",
                                                  "DMS_DIR_LAST",
                                                  "DMS_DIR_FIRST",
                                                  "DMS_POS_NEG", "DMS_PACKED",
                                                  "DDM_DIR_LAST",
                                                  "DDM_DIR_FIRST",
                                                  "DDM_POS_NEG"]
                else:
                    self.params[6].filter.list = ["SAME_AS_INPUT", "DD",
                                                  "DMS_DIR_LAST",
                                                  "DMS_DIR_FIRST",
                                                  "DMS_POS_NEG", "DMS_PACKED",
                                                  "DDM_DIR_LAST",
                                                  "DDM_DIR_FIRST",
                                                  "DDM_POS_NEG", "GARS",
                                                  "GEOREF", "MGRS", "USNG",
                                                  "UTM", "UTMNS"]
            else:
                self.params[6].enabled = False

            # set additional fields schema
            newFields = []
            inFields = [descField.name.lower() for descField in arcpy.Describe(self.params[0].value).fields]
            for f in fields:
                if str(f).lower() not in inFields:
                    newField = arcpy.Field()
                    newField.name = str(f)
                    newField.aliasName = str(f)
                    newField.type = "DOUBLE"
                    newFields.append(newField)

            self.params[5].schema.fieldsRule = "FirstDependency"
            self.params[5].schema.additionalFields = newFields

        # Comment out in 2.9 for GP5201 to support dms with other coordsys
        # if self.params[6].value and not self.params[6].hasBeenValidated:
            # if self.params[6].value.lower() != "same_as_input":
                # self.params[4].enabled = False
                # self.params[4].value = ""
            # else:
                # self.params[4].enabled = True

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        if self.params[1].value: #and not self.params[1].hasBeenValidated: 
            fields, geomProps = zip(*self.params[1].value)
            # Check for blank Property and new field name
            if self.params[1].hasError():
                # add warning for blank property
                if str(self.params[1].message).find("800") > -1:
                    if '' in geomProps:
                        self.params[1].setWarningMessage(str(arcpy.GetIDMessage(130039)).replace("%s", arcpy.GetIDMessage(120358)))
                # new field name
                elif str(self.params[1].message).find("728") > -1:
                    self.params[1].clearMessage()           
            # Check for blank fields
            for field in fields:
                if field.value == "":
                    self.params[1].setWarningMessage(str(arcpy.GetIDMessage(130039)).replace("%s", arcpy.GetIDMessage(220308)))
                    break
            
            # Check for text field if using coordinate notation           
            if self.params[0].value:
                try:
                    stringfields = [f.name.lower() for f in
                                  arcpy.ListFields(self.params[0].value, "",
                                                   "String")]
                    allfields = [f.name.lower() for f in
                                  arcpy.ListFields(self.params[0].value)]
                    for row in self.params[1].value:
                        if row[1].upper() == "POINT_COORD_NOTATION" or \
                                self.params[6].value.lower() not in [
                                        "same_as_input", "dd"]:
                            if row[1].upper() in ["POINT_X", "POINT_Y",
                                                  "POINT_COORD_NOTATION",
                                                  "CENTROID_X", "CENTROID_Y",
                                                  "INSIDE_X", "INSIDE_Y",
                                                  "LINE_START_X",
                                                  "LINE_START_Y", "LINE_END_X",
                                                  "LINE_END_Y"]:
                                # if the field exists and is not a string, error
                                if str(row[0].value).lower() in allfields:
                                    if str(row[0].value).lower() not in stringfields:
                                        self.params[1].setIDMessage("ERROR", 306,
                                                                    str(row[0].value))
                                        break
                except:
                    pass
        return
