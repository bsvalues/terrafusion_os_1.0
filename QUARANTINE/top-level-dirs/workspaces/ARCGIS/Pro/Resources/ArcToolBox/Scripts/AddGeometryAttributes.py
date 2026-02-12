"""-------------------------------------------------------------------------
    Tool:               Add Geometry Attributes (Data Management Tools)
    Source Name:        AddGeometryAttributes.py
    Version Added:      ArcGIS 10.2.1
    Author:             Esri, Inc.
    Usage:              arcpy.AddGeometryAttributes_management(
                                                  Input_Features,
                                                  Geometry_Properties,
                                                  {Length_Unit},
                                                  {Area_Unit},
                                                  {Coordinate_System})
    Required Arguments: Input Features
                        Geometry Properties
    Optional Arguments: Length Unit
                        Area Unit
                        Coordinate System
    Description:        Adds attribute fields to the input features containing
                        measurements and coordinate properties of the feature
                        geometries (for example, length or area).
    Updated:            Not yet.
------------------------------------------------------------------------"""
from __future__ import print_function, unicode_literals, absolute_import
import arcpy
import numpy
import math
import os

class AddGeometryAttributes(object):
    def __init__(self, fc, geomProperties, lUnit, aUnit, cs):
        desc = arcpy.Describe(fc)
        self.hasZ = desc.hasZ
        self.hasM = desc.hasM

        if cs:
            if isinstance(cs, arcpy.SpatialReference):
                sr = cs
            else:
                sr = arcpy.SpatialReference()
                sr.loadFromString(cs)
            try:
                self.srMetersPerUnit = sr.metersPerUnit
            except:
                self.srMetersPerUnit = 1
        else:
            try:
                self.srMetersPerUnit = desc.spatialReference.metersPerUnit
            except:
                self.srMetersPerUnit = 1

        self.srMetersPerUnit = self.srMetersPerUnit

        self.shapeDict = {"POINT": 1,
                          "MULTIPOINT": 1.5,
                          "POLYLINE": 2,
                          "POLYGON": 3,
                          "MULTIPATCH": 4, }

        self.shapeDim = self.shapeDict[str(desc.shapeType).upper()]
        self.hasNulls = False
        self.updateCursorFields = None

    def execute(self):
        fields = self.CreateOutputFields(fc, geomProperties)

        arcpy.SetProgressor("STEP", arcpy.GetIDMessage(86174), 0,
                            int(arcpy.GetCount_management(fc).getOutput(0)), 1)

        # Calculate geometry properties into new fields
        wkspc = self.GetWorkspace(fc)
        # start edit session if ws is NOT: sde, fservice, .sqlite, .geodatabase
        #  but do start session if the data is versioned (applies to sde)
        edit_op = (not any(x in wkspc for x in [".sde",
                                                "<WorkspaceFactory>SDE",
                                                "featureservice",
                                                ".sqlite",
                                                ".geodatabase",
                                                ".gpkg"]) or
                              arcpy.Describe(fc).isVersioned)

        if edit_op:
            edit = arcpy.da.Editor(wkspc)
            edit.startEditing()
            edit.startOperation()

        with arcpy.da.UpdateCursor(fc, fields + ["SHAPE@"], "", cs) as ucur:
            self.updateCursorFields = ucur.fields
            for row in ucur:
                geom = row[self.updateCursorFields.index("SHAPE@")]
                if geom:
                    row = self.ShapeCalc(row, geom, geomProperties)
                    ucur.updateRow(row)
                else:
                    self.hasNulls = True
                arcpy.SetProgressorPosition()

        if edit_op:
            edit.stopOperation()
            edit.stopEditing(True)
            del edit

        if self.hasNulls:
            arcpy.AddIDMessage("WARNING", 957)
            
    def ShapeCalc(self, row, geom, geomProperties):
        if self.shapeDim == 1:
            if "POINT_X_Y_Z_M" in geomProperties:
                row = self.Update(row, "POINT_X", geom.firstPoint.X)
                row = self.Update(row, "POINT_Y", geom.firstPoint.Y)
                if self.hasZ:
                    row = self.Update(row, "POINT_Z", geom.firstPoint.Z)
                if self.hasM:
                    row = self.Update(row, "POINT_M", geom.firstPoint.M)

        if self.shapeDim > 1:
            if "PART_COUNT" in geomProperties:
                row = self.Update(row, "PART_COUNT", geom.partCount)

            if "CURVE_COUNT" in geomProperties:
                row = self.Update(row, "CURVE_COUNT", self.curveCount(geom))

            if "CENTROID" in geomProperties:
                row = self.Update(row, "CENTROID_X", geom.trueCentroid.X)
                row = self.Update(row, "CENTROID_Y", geom.trueCentroid.Y)

                if self.hasZ:
                    row = self.Update(row, "CENTROID_Z", geom.trueCentroid.Z)

                if self.hasM:
                    row = self.Update(row, "CENTROID_M", geom.trueCentroid.M)

            if "EXTENT" in geomProperties:
                row = self.Update(row, "EXT_MIN_X", geom.extent.XMin)
                row = self.Update(row, "EXT_MIN_Y", geom.extent.YMin)
                row = self.Update(row, "EXT_MAX_X", geom.extent.XMax)
                row = self.Update(row, "EXT_MAX_Y", geom.extent.YMax)

        if self.shapeDim >= 2:
            midPoint = None  # Added to address Coverity CID 278244
            if "POINT_COUNT" in geomProperties:
                row = self.Update(row, "PNT_COUNT", geom.pointCount)

            if "LINE_START_MID_END" in geomProperties:
                row = self.Update(row, "START_X", geom.firstPoint.X)
                row = self.Update(row, "START_Y", geom.firstPoint.Y)
                if self.shapeDim == 2:
                    midPoint = geom.positionAlongLine(0.5,
                                                      True).firstPoint
                else:
                    line = arcpy.Polyline(geom.getPart(0), "#",
                                          self.hasZ, self.hasM)
                    if line.length > 0:
                        midPoint = line.positionAlongLine(0.5,
                                                          True).firstPoint
                    else:
                        self.hasNulls = True
                    del line

                if midPoint:  # Added to address Coverity CID 278244
                    row = self.Update(row, "MID_X", midPoint.X)
                    row = self.Update(row, "MID_Y", midPoint.Y)
                    row = self.Update(row, "END_X", geom.lastPoint.X)
                    row = self.Update(row, "END_Y", geom.lastPoint.Y)
                    if self.hasZ:
                        row = self.Update(row, "START_Z", geom.firstPoint.Z)
                        row = self.Update(row, "MID_Z", midPoint.Z)
                        row = self.Update(row, "END_Z", geom.lastPoint.Z)
                    if self.hasM:
                        row = self.Update(row, "START_M", geom.firstPoint.M)
                        row = self.Update(row, "MID_M", midPoint.M)
                        row = self.Update(row, "END_M", geom.lastPoint.M)
                    del midPoint

            if "CENTROID_INSIDE" in geomProperties:
                row = self.Update(row, "INSIDE_X", geom.centroid.X)
                row = self.Update(row, "INSIDE_Y", geom.centroid.Y)
                if self.hasZ:
                    row = self.Update(row, "INSIDE_Z", geom.centroid.Z)
                if self.hasM:
                    row = self.Update(row, "INSIDE_M", geom.centroid.M)

        if self.shapeDim == 2:
            if "LINE_BEARING" in geomProperties:
                row = self.Update(row, "BEARING", self.LineBearing(geom.firstPoint.X,
                                                                   geom.firstPoint.Y,
                                                                   geom.lastPoint.X,
                                                                   geom.lastPoint.Y))

            if "LENGTH" in geomProperties:
                row = self.Update(row, "LENGTH", self.ConvertFromMeters("LINEAR",
                                                   geom.length,
                                                   lUnit,
                                                   self.srMetersPerUnit))

            if "LENGTH_3D" in geomProperties:
                row = self.Update(row, "LENGTH_3D", self.ConvertFromMeters("LINEAR",
                                                      geom.length3D,
                                                      lUnit,
                                                      self.srMetersPerUnit))

            if "LENGTH_GEODESIC" in geomProperties:
                row = self.Update(row, "LENGTH_GEO", self.ConvertFromMeters("LINEAR",
                                                       geom.getLength("PRESERVE_SHAPE"),
                                                       lUnit,
                                                       self.srMetersPerUnit))

        if self.shapeDim == 3:
            if "PERIMETER_LENGTH" in geomProperties:
                row = self.Update(row, "PERIMETER", self.ConvertFromMeters("LINEAR",
                                                      geom.length,
                                                      lUnit,
                                                      self.srMetersPerUnit))

            if "AREA" in geomProperties:
                row = self.Update(row, "POLY_AREA", self.ConvertFromMeters("AREA",
                                                      geom.area,
                                                      aUnit,
                                                      self.srMetersPerUnit))

            if "AREA_GEODESIC" in geomProperties:
                row = self.Update(row, "AREA_GEO", self.ConvertFromMeters("AREA",
                                                     geom.getArea("PRESERVE_SHAPE"),
                                                     aUnit,
                                                     self.srMetersPerUnit))

            if "PERIMETER_LENGTH_GEODESIC" in geomProperties:
                row = self.Update(row, "PERIM_GEO", self.ConvertFromMeters("LINEAR",
                                                      geom.getLength("PRESERVE_SHAPE"),
                                                      lUnit,
                                                      self.srMetersPerUnit))

        return row

    def curveCount(self, geom):
        import json

        i = 0
        jsonGeom = json.loads(geom.JSON)
        if "curveRings" in jsonGeom.keys():
            curveRings = str(jsonGeom["curveRings"][0])
            i = curveRings.count("b':") + curveRings.count("a':") + curveRings.count("c':")
        elif "curvePaths" in jsonGeom.keys():
            curvePaths = str(jsonGeom["curvePaths"][0])
            i = curvePaths.count("b':") + curvePaths.count("a':") + curvePaths.count("c':")
        
        return i
        
    def LineBearing(self, x1, y1, x2, y2):
        import math
        bearing = (90 - math.degrees(math.atan2(y2 - y1,x2 - x1))) % 360.0
        return bearing
      
    def HoleCount(self, geom):
        holeCount = 0
        try:
            for part in geom:
                for pnt in part:
                    if not pnt:
                        holeCount+=1
        except:
            pass
        return holeCount
    
    def CreateOutputFields(self, fc, geomProperties):
        propDict = {"POINT_X_Y_Z_M": ["POINT_X",
                                      "POINT_Y",
                                      "POINT_Z",
                                      "POINT_M"],
                    "PART_COUNT": ["PART_COUNT"],
                    "CURVE_COUNT": ["CURVE_COUNT"],
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

        if not self.hasZ:
            propDict["POINT_X_Y_Z_M"].remove("POINT_Z")
            propDict["CENTROID"].remove("CENTROID_Z")
            propDict["CENTROID_INSIDE"].remove("INSIDE_Z")
            propDict["LINE_START_MID_END"].remove("START_Z")
            propDict["LINE_START_MID_END"].remove("MID_Z")
            propDict["LINE_START_MID_END"].remove("END_Z")

        if not self.hasM:
            propDict["POINT_X_Y_Z_M"].remove("POINT_M")
            propDict["CENTROID"].remove("CENTROID_M")
            propDict["CENTROID_INSIDE"].remove("INSIDE_M")
            propDict["LINE_START_MID_END"].remove("START_M")
            propDict["LINE_START_MID_END"].remove("MID_M")
            propDict["LINE_START_MID_END"].remove("END_M")
    
        addList = []
        geomPropertiesList = []
        currentFields = [field.name for field in arcpy.ListFields(fc)]
        for prop in geomProperties:
            for field in propDict[prop.upper()]:
                geomPropertiesList.append(field)
                if field not in currentFields:
                    addList.append(field)
                else:
                    arcpy.AddIDMessage("WARNING", 1097, field)
    
        if addList:
            arcpy.AddFields_management(fc, [[field, "DOUBLE"] for field in addList])
               
        return geomPropertiesList
      
    def ConvertFromMeters(self, type, value, unit, metersPerUnit):
        if not unit:
            return value

        else:
            # these match gp/issues/5839#issuecomment-3312933
            distanceUnitInfo = {"METERS": 1.0,
                                "FEET_US": 0.3048006096012192,
                                "FEET_INT": 0.3048,
                                "NAUTICAL_MILES": 1853.248,
                                "NAUTICAL_MILES_INT": 1852.0,
                                "MILES_US": 1609.347218694437,
                                "MILES_INT": 1609.344,
                                "KILOMETERS": 1000.0,
                                "YARDS": 0.9144018288036576,
                                "YARDS_INT": 0.9144, 
                                }
    
            areaUnitInfo = {"ACRES": 4046.8564224,
                            "ACRES_US": 4046.872609874252,
                            "HECTARES": 10000.0,
                            "SQUARE_METERS": 1.0,
                            "SQUARE_FEET_US": 0.0929034116132748,
                            "SQUARE_FEET_INT": 0.09290304,
                            "SQUARE_NAUTICAL_MILES": 3429904.0,
                            "SQUARE_NAUTICAL_MILES_US": 3434528.149504, 
                            "SQUARE_MILES_US": 2589998.47031952,
                            "SQUARE_MILES_INT": 2589988.110336,
                            "SQUARE_KILOMETERS": 1000000.0,
                            "SQUARE_YARDS": 0.83612736, 
                            "SQUARE_YARDS_US": 0.8361307045194735,
                            }

            if type == "LINEAR":
                return (value * metersPerUnit) / distanceUnitInfo[unit]

            if type == "AREA":
                return (value * math.pow(metersPerUnit, 2)) / areaUnitInfo[unit]
    
    def Update(self, row, field, value):
        if value:
            if not math.isnan(value):
                row[self.updateCursorFields.index(field)] = value
        elif value == 0:
            row[self.updateCursorFields.index(field)] = 0
        return row

    def GetWorkspace(self, infc):
        workspace = arcpy.Describe(infc).path
        workspace_desc = arcpy.Describe(workspace)
        if workspace.startswith("http"):
            return "featureservice"
        elif workspace_desc.datatype.lower() == "featuredataset":
            return workspace_desc.path
        else:
            return workspace

# run the script
if __name__ == '__main__':
    # Get Parameters
    fc = arcpy.GetParameterAsText(0)
    if arcpy.GetParameterAsText(1).find(";") > -1:
        geomProperties = arcpy.GetParameterAsText(1).upper().split(";")
    else:
        geomProperties = [arcpy.GetParameterAsText(1).upper()]
    lUnit = arcpy.GetParameterAsText(2)
    aUnit = arcpy.GetParameterAsText(3)
    cs = arcpy.GetParameterAsText(4)
    if not cs:
        cs = arcpy.env.outputCoordinateSystem

    # Run the main script
    addGeomAtts = AddGeometryAttributes(fc, geomProperties, lUnit, aUnit, cs)
    addGeomAtts.execute()