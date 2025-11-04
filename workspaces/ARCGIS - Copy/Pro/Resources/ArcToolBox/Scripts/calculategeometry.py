"""-------------------------------------------------------------------------
    Tool:               Calculate Geometry (Data Management Tools)
    Source Name:        calculategeometry.py
    Version:            ArcGIS Pro 2.2
    Author:             Esri, Inc.
    Usage:              arcpy.CalculateGeometryAttributes_management(
                                                  in_features,
                                                  geometry_property,
                                                  {length_unit},
                                                  {area_unit},
                                                  {coordinate_system},
                                                  {coordinate_format})
    Required Arguments: Input Features
                        Geometry Property
    Optional Arguments: Length Unit
                        Area Unit
                        Coordinate System
                        Coordinate Format
    Description:        Calculates geometry properties into existing fields.
    Updated:            ArcGIS Pro 3.4
------------------------------------------------------------------------"""
import arcpy
import math
from AddGeometryAttributes import AddGeometryAttributes

def CalculateGeometry(fc, properties, lUnit, aUnit, cs, cformat):
    #Add Geometry Attributes module sets up geometry calculations
    aga = AddGeometryAttributes(fc, "", lUnit, aUnit, cs)

    #Variable declarations
    dsc_in = arcpy.Describe(fc)
    fields, geomProps = zip(*properties)
    wkspc = aga.GetWorkspace(fc)
    if wkspc == "featureservice":
        wkspc = dsc_in.path

    # Checks joins
    usingJoinTableField = False
    inputIsJoined = False
    if hasattr(fc, "connectionProperties"):
        cp = fc.connectionProperties
        # Joined layers have source and destination
        if cp:
            if 'source' in cp:
                if 'destination' in cp:
                    inputIsJoined = True
                    # Make a copy of the input layer
                    arcpy.management.MakeFeatureLayer(fc, "__mfl")
                    # If the layer does not have a selection
                    if not dsc_in.FIDSet:
                        # Select all records to match inner join
                        arcpy.management.SelectLayerByAttribute("__mfl")
                    # Remove the join from the copy
                    arcpy.management.RemoveJoin("__mfl")
                    # Check if one of the input fields is qualified with the join table
                    for field in fields:
                        if "." in field:
                            if field.split(".")[0].lower() != dsc_in.baseName.lower():
                                usingJoinTableField = True
                    # Work with the layer with removed join from here
                    fields = [f.split(".")[1] if f.find(".")>-1 else f for f in fields]
                    properties = list(zip(fields, geomProps))
                    fc = "__mfl"
                    dsc_in = arcpy.Describe(fc)

    # Error if one of the input fields comes from a join table
    if usingJoinTableField:
        arcpy.AddIDMessage("ERROR", 1486)
        raise quit()
    
    # Add fields if necessary
    inFields = [field.name.lower() for field in dsc_in.Fields]
    # Is selected field editable? gp1914, required ok tho gp5590
    badFields = [field.name.lower() for field in dsc_in.Fields if not field.editable]
    addFields = []
    for property in properties:
        # Find the fields to add
        if property[0].lower() in badFields:
            arcpy.AddIDMessage("ERROR", 130091, property[0])
            raise quit()
        if property[0].lower() not in inFields:
            # Based on the geometry property set the field type
            if property[1].lower().find("_count")>-1:
                fieldType = "LONG"
            elif property[1].lower().find("_notation")>-1:
                fieldType = "TEXT"
            elif (property[1].lower().find("x")>-1 or property[1].lower().find("y")>-1) and cformat.lower() not in ["dd", "same_as_input"]:
                fieldType = "TEXT"
            else:
                fieldType = "DOUBLE"
            addFields.append([property[0], fieldType])
    if addFields:
        try:
            arcpy.management.AddFields(fc, addFields)
        except arcpy.ExecuteError:
            if inputIsJoined:
                arcpy.AddIDMessage("ERROR", 50)
            else:
                arcpy.AddError(arcpy.GetMessages(2))
            quit()

    # Warn and exit if input is empty
    inCount = int(arcpy.GetCount_management(fc).getOutput(0))
    if not inCount:
    # Input is empty so warn and exit
        arcpy.AddIDMessage("WARNING", 2960, fc)
        quit()
        
    # All supported geometry operations as dictionary
    geomCalcs, point_x_calcs, point_y_calcs, point_coord_notation_calcs = GetCalcsDict()

    # Check if a transformation is necessary
    trans = arcpy.env.geographicTransformations or ""
    insr = dsc_in.spatialReference
    # if output coordinate system is set and is different than the input coordinate system
    if cs and (cs.name != insr.name):
        translist = arcpy.ListTransformations(insr, cs, dsc_in.extent)
        transbad = False
        if trans: # if the gp env is set
            # raise a warning if specified transformation is bad
            if not trans in translist:
                arcpy.AddIDMessage("WARNING", 365)
                # pick an OK transformation
                transbad = True
        else:
            #check for a map transformation and use it like normal GP tools do
            try:
                usemaptrans = False
                maptranslist = arcpy.mp.ArcGISProject("current").activeMap.transformations["2D"]
                for maptrans in maptranslist:
                    if maptrans in translist:
                        trans = maptrans
                        usemaptrans = True
                        break
            except:
                pass
            if not usemaptrans:
                #pick an OK transformation if one isn't set in gp env or map
                transbad = True
        if transbad:
            # take the first OK transformation and warn about it
            trans = translist[0] if translist else ""
        # manual string replace as AddIDMessage only supports 2 formats
        arcpy.AddMessage(arcpy.GetIDMessage(3729).replace("%1", trans)
                                                    .replace("%2", str(fc))
                                                    .replace("%3", insr.name)
                                                    .replace("%4", cs.name)
                                                    )

    # Progress bar
    arcpy.SetProgressor("STEP", arcpy.GetIDMessage(86174), 0, inCount, 1)
    rowGood = False
    edit = False
    # Loop through data with search cursor to get the geometry, and update cursor to calculate fields
    with arcpy.da.SearchCursor(fc, ["SHAPE@", "OID@"], spatial_reference=cs, datum_transformation=trans) as scur:
        srow = next(scur)
        with arcpy.da.UpdateCursor(fc, ["OID@"] + list(fields)) as ucur:
            ucur._enable_simplify = False #do not simplify geometries when writing the row
            # Use an edit session only if required
            editor = arcpy.da.Editor(wkspc)
            edit = True if editor.isEditing else edit
            try:
                flds = ucur.fields # This fails if an edit session is required for UpdateCursor
            except:
                edit = True
            # Data with attr rule requires Edit session
            if hasattr(dsc_in, "attributeRules"):
                edit = True if dsc_in.attributeRules else edit
            if edit or wkspc.endswith(".geodatabase"): # mobile gdb is faster using edit session
                ucur.reset()
                multiuser = True if dsc_in.isVersioned else False
                editor.startEditing(True, multiuser)
                editor.startOperation()
                edit = True
            if not cs:
                cs = insr # set inside cursor for use without affecting cursor

            # Get field indexes in the update cursor
            fidxes = [ucur.fields.index(cprop[0]) for cprop in properties]
            for row in ucur:
                geom = srow[0]
                # Check null geometry
                if geom:
                    # Loop through each field calculation
                    for calcProp, idx in zip(properties, fidxes):
                        geomValue = eval(geomCalcs[calcProp[1].upper()])
                        # Check it is not null according to math
                        if geomValue == 0 or geomValue:
                            itsNull = False
                            try:
                                if math.isnan(geomValue):
                                    arcpy.AddIDMessage("WARNING", 635, row[1])
                                    itsNull = True
                            except:
                                continue
                            finally:
                                if not itsNull:
                                    # Write the value to the input field and update row
                                    row[idx] = geomValue
                                    rowGood = True
                    if rowGood:
                        ucur.updateRow(row)
                # Keep track of null geometries
                else:
                    arcpy.AddIDMessage("WARNING", 635, srow[1])
                arcpy.SetProgressorPosition()
                rowGood = False
                try:
                   srow = next(scur)
                except StopIteration:
                    pass

    if edit:
        try:
            editor.stopOperation()
            editor.stopEditing(True)
            del editor
        except:
            arcpy.AddIDMessage("WARNING", 160096) # field length
            arcpy.AddIDMessage("WARNING", 1086) # rows are null
            try:
                editor.stopEditing(True)
            except:
                arcpy.AddIDMessage("WARNING", 316, str(fc))
            del editor

    del dsc_in
    return

def GetCalcsDict():
    # All possible calcs
    geomCalcs = {"POINT_X":"ConvertPointXY(geom, point_x_calcs[cformat.lower()])",
                "POINT_Y":"ConvertPointXY(geom, point_y_calcs[cformat.lower()])",
                "POINT_COORD_NOTATION":"ConvertPointXY(geom, point_coord_notation_calcs[cformat.lower()])",
                "POINT_Z":"geom.firstPoint.Z",
                "POINT_M":"geom.firstPoint.M",
                "PART_COUNT":"geom.partCount",
                "CURVE_COUNT":"aga.curveCount(geom)",
                "CENTROID_X":"ConvertGeometryXY(geom, 'trueCentroid', point_x_calcs[cformat.lower()], cs)",
                "CENTROID_Y":"ConvertGeometryXY(geom, 'trueCentroid', point_y_calcs[cformat.lower()], cs)",
                "CENTROID_Z":"geom.trueCentroid.Z",
                "CENTROID_M":"geom.trueCentroid.M",
                "INSIDE_X":"ConvertGeometryXY(geom, 'centroid', point_x_calcs[cformat.lower()], cs)",
                "INSIDE_Y":"ConvertGeometryXY(geom, 'centroid', point_y_calcs[cformat.lower()], cs)",
                "INSIDE_Z":"geom.centroid.Z",
                "INSIDE_M":"geom.centroid.M",
                "EXTENT_MIN_X":"ConvertExtentXY(geom, 'XMin', point_x_calcs[cformat.lower()], cs)",
                "EXTENT_MIN_Y":"ConvertExtentXY(geom, 'YMin', point_y_calcs[cformat.lower()], cs)",
                "EXTENT_MIN_Z":"geom.extent.ZMin",
                "EXTENT_MAX_X":"ConvertExtentXY(geom, 'XMax', point_x_calcs[cformat.lower()], cs)",
                "EXTENT_MAX_Y":"ConvertExtentXY(geom, 'YMax', point_y_calcs[cformat.lower()], cs)",
                "EXTENT_MAX_Z":"geom.extent.ZMax",
                "LINE_START_X":"ConvertGeometryXY(geom, 'firstPoint', point_x_calcs[cformat.lower()], cs)",
                "LINE_START_Y":"ConvertGeometryXY(geom, 'firstPoint', point_y_calcs[cformat.lower()], cs)",
                "LINE_START_Z":"geom.firstPoint.Z",
                "LINE_START_M":"geom.firstPoint.M",
                "LINE_END_X":"ConvertGeometryXY(geom, 'lastPoint', point_x_calcs[cformat.lower()], cs)",
                "LINE_END_Y":"ConvertGeometryXY(geom, 'lastPoint', point_y_calcs[cformat.lower()], cs)",
                "LINE_END_Z":"geom.lastPoint.Z",
                "LINE_END_M":"geom.lastPoint.M",
                "LINE_BEARING":"aga.LineBearing(geom.firstPoint.X,geom.firstPoint.Y,geom.lastPoint.X,geom.lastPoint.Y)",
                "LENGTH":"geom.getLength('PLANAR', transformUnitStr(lUnit, 'length'))",
                "LENGTH_3D":"aga.ConvertFromMeters('LINEAR',geom.length3D,lUnit,aga.srMetersPerUnit)",
                "LENGTH_GEODESIC":"geom.getLength('PRESERVE_SHAPE', transformUnitStr(lUnit, 'length'))",
                "POINT_COUNT":"geom.pointCount",
                "PERIMETER_LENGTH":"geom.getLength('PLANAR', transformUnitStr(lUnit, 'length'))",
                "PERIMETER_LENGTH_GEODESIC":"geom.getLength('PRESERVE_SHAPE', transformUnitStr(lUnit, 'length'))",
                "AREA":"geom.getArea('PLANAR', transformUnitStr(aUnit, 'area'))",
                "AREA_GEODESIC":"geom.getArea('PRESERVE_SHAPE', transformUnitStr(aUnit, 'area'))",
                "HOLE_COUNT":"aga.HoleCount(geom)"}

    # POINT_X calcs
    point_x_calcs = {"same_as_input":  """global coordstr\ncoordstr = geom.firstPoint.X""",
                     "dd":             """coordlist = geom.toCoordString("dd").split(" ")\nglobal coordstr\ncoordstr = float(coordlist[1][-1].replace("E","").replace("W", "-") + coordlist[1][:-1])""",
                     "dms_dir_last":   """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2))+'"', coordlist[5][-1]])""",
                     "dms_dir_first":  """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[5][-1] + coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2))+'"'])""",
                     "dms_pos_neg":    """coordlist = geom.toCoordString("dms").split(" ")\new = "+" if coordlist[-1][-1].lower() == "e" else "-"\nglobal coordstr\ncoordstr = " ".join([ew + coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2)) + '"'])""",
                     "dms_packed":     """coordlist = geom.toCoordString("dms").split(" ")\new = "+" if coordlist[-1][-1].lower() == "e" else "-"\nglobal coordstr\ncoordstr = ew + coordlist[3] + "." + coordlist[4] + str(round(float(coordlist[5][:-1]),2)).replace(".", "")""",
                     "ddm_dir_last":   """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'", coordlist[3][-1]])""",
                     "ddm_dir_first":  """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[3][-1] + coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'"])""",
                     "ddm_pos_neg":    """coordlist = geom.toCoordString("ddm").split(" ")\new = "+" if coordlist[3][-1].lower() == "e" else "-"\nglobal coordstr\ncoordstr = " ".join([ew + coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'"])""",
                    }
    # POINT_Y calcs
    point_y_calcs = {"same_as_input":  """global coordstr\ncoordstr = geom.firstPoint.Y""",
                     "dd":             """coordlist = geom.toCoordString("dd").split(" ")\nglobal coordstr\ncoordstr = float(coordlist[0][-1].replace("N","").replace("S", "-") + coordlist[0][:-1])""",
                     "dms_dir_last":   """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"', coordlist[2][-1]])""",
                     "dms_dir_first":  """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[2][-1] + coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"'])""",
                     "dms_pos_neg":    """coordlist = geom.toCoordString("dms").split(" ")\nns = "+" if coordlist[2][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = " ".join([ns + coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"'])""",
                     "dms_packed":     """coordlist = geom.toCoordString("dms").split(" ")\nns = "+" if coordlist[2][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = ns + coordlist[0] + "." + coordlist[1] + str(round(float(coordlist[2][:-1]),2)).replace(".", "")""",
                     "ddm_dir_last":   """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'", coordlist[1][-1]])""",
                     "ddm_dir_first":  """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[1][-1] + coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'"])""",
                     "ddm_pos_neg":    """coordlist = geom.toCoordString("ddm").split(" ")\nns = "+" if coordlist[1][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = " ".join([ns + coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'"])""",
                    }
    # POINT_COORD_NOTATION calcs
    point_coord_notation_calcs = {"same_as_input":  """global coordstr\ncoordstr = '{0} {1}'.format(geom.firstPoint.X, geom.firstPoint.Y)""",
                                  "dd":             """coordlist = geom.toCoordString("dd").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[1][-1].replace("E","").replace("W", "-") + coordlist[1][:-1], coordlist[0][-1].replace("N","").replace("S", "-") + coordlist[0][:-1]])""",
                                  "dms_dir_last":   """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2))+'"', coordlist[5][-1], coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"', coordlist[2][-1]])""",
                                  "dms_dir_first":  """coordlist = geom.toCoordString("dms").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[5][-1] + coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2))+'"', coordlist[2][-1] + coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"'])""",
                                  "dms_pos_neg":    """coordlist = geom.toCoordString("dms").split(" ")\new = "+" if coordlist[-1][-1].lower() == "e" else "-"\nns = "+" if coordlist[2][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = " ".join([ew + coordlist[3] + u'\N{DEGREE SIGN}', coordlist[4] + "'", str(round(float(coordlist[5][:-1]),2)) + '"', ns + coordlist[0] + u'\N{DEGREE SIGN}', coordlist[1] + "'", str(round(float(coordlist[2][:-1]),2)) + '"'])""",
                                  "dms_packed":     """coordlist = geom.toCoordString("dms").split(" ")\new = "+" if coordlist[-1][-1].lower() == "e" else "-"\nns = "+" if coordlist[2][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = ew + coordlist[3] + "." + coordlist[4] + str(round(float(coordlist[5][:-1]),2)).replace(".", "") + " " + ns + coordlist[0] + "." + coordlist[1] + str(round(float(coordlist[2][:-1]),2)).replace(".", "")""",
                                  "ddm_dir_last":   """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'", coordlist[3][-1], coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'", coordlist[1][-1]])""",
                                  "ddm_dir_first":  """coordlist = geom.toCoordString("ddm").split(" ")\nglobal coordstr\ncoordstr = " ".join([coordlist[3][-1] + coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'", coordlist[1][-1] + coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'"])""",
                                  "ddm_pos_neg":    """coordlist = geom.toCoordString("ddm").split(" ")\new = "+" if coordlist[3][-1].lower() == "e" else "-"\nns = "+" if coordlist[1][-1].lower() == "n" else "-"\nglobal coordstr\ncoordstr = " ".join([ew + coordlist[2] + u'\N{DEGREE SIGN}', str(round(float(coordlist[3][:-1]),3)) + "'", ns + coordlist[0] + u'\N{DEGREE SIGN}', str(round(float(coordlist[1][:-1]),3)) + "'"])""",
                                  "gars":           """global coordstr\ncoordstr = geom.toCoordString("gars")""",
                                  "georef":         """global coordstr\nfullstr = geom.toCoordString("georef")\ncoordstr = fullstr[0:-16] + fullstr[-16:-11] + fullstr[-8:-3]""",
                                  "mgrs":           """global coordstr\nfullstr = geom.toCoordString("mgrs")\ncoordstr = fullstr[0:-16] + fullstr[-16:-11] + fullstr[-8:-3]""",
                                  "usng":           """global coordstr\nfullstr = geom.toCoordString("usng").split(" ")\ncoordstr = fullstr[0] + " " + fullstr[1] + " " + fullstr[2][:5] + " " + fullstr[3][:5]""",
                                  "utm":            """global coordstr\ncoordstr = geom.toCoordString("utm")""",
                                  "utmns":          """global coordstr\ncoordstr = geom.toCoordString("utmns")""",
                                  }
    return geomCalcs, point_x_calcs, point_y_calcs, point_coord_notation_calcs

# Getting coordinates from point geometry objects - base
def ConvertPointXY(geom, execstr):
    exec(execstr)
    return coordstr

# Getting coordinates from polyline and polygon geometry objects
def ConvertGeometryXY(geom, type, execstr, cs):
    execstr = execstr.replace("firstPoint", type)
    execstr = execstr.replace("geom", f"arcpy.PointGeometry(geom.{type}, cs)")
    exec(execstr)
    return coordstr

# Getting coordinates from extent objects
def ConvertExtentXY(geom, type, execstr, cs):
    if type in ["XMin", "YMax"]:
        execstr = execstr.replace("geom", f"arcpy.PointGeometry(arcpy.Point(geom.extent.XMin, geom.extent.YMax), cs)")
    elif type in ["XMax", "YMin"]:
        execstr = execstr.replace("geom", f"arcpy.PointGeometry(arcpy.Point(geom.extent.XMax, geom.extent.YMin), cs)")
    exec(execstr)
    return coordstr

# Changes unit strings so they are ready to use in arcpy geometry functions
def transformUnitStr(unit, type):
    if type == "length":
        unit = unit.lower().replace("_", "").replace("us", "")
    elif type == "area":
        unit = unit.lower().replace("_", "").replace("int", "")
    return unit

# run the script
if __name__ == '__main__':
    # Get Parameters
    fc = arcpy.GetParameter(0)
    # If the parameter value is a layer object we want to use it, else the layer name
    if hasattr(fc, "dataSource") and not fc.dataSource:
        fc = arcpy.GetParameterAsText(0)
    properties = [p.split(" ") for p in arcpy.GetParameterAsText(1).split(";")]
    lUnit = arcpy.GetParameterAsText(2)
    aUnit = arcpy.GetParameterAsText(3)
    cs = arcpy.GetParameterAsText(4)
    if cs:
        sref = arcpy.SpatialReference()
        sref.loadFromString(cs)
        cs = sref
    else:
        cs = arcpy.env.outputCoordinateSystem
    cformat = arcpy.GetParameterAsText(6) or "SAME_AS_INPUT"

    # Not supporting square nautical miles, better and more accurate results in exchange GP4516
    if aUnit:
        if aUnit.lower().find("nautical") > -1:
            arcpy.AddIDMessage("ERROR", 798)
            raise quit()

    # Run the main script
    CalculateGeometry(fc, properties, lUnit, aUnit, cs, cformat)
    arcpy.SetParameter(5, fc)
