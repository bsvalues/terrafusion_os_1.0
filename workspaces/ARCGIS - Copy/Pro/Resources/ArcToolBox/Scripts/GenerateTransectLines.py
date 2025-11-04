"""-------------------------------------------------------------------------
    Tool:               Generate Transects Along Lines (Data Management Tools)
    Source Name:        GenerateTransectLines.py
    Author:             Esri, Inc.
    Usage:              arcpy.GenerateTransectsAlongLines_management(
                                                  in_features,
                                                  out_feature_class,
                                                  interval,
                                                  transect_length,
                                                  end_points)
    Required Arguments: in_features
                        out_feature_class
                        interval
                        transect_length
    Optional Arguments:
                        end_points
    Description:        Generates regularly spaced transect lines of a 
                        specified width.
------------------------------------------------------------------------"""
import arcpy
import os
import math
from collections import namedtuple
from generatepointsfromlines import convert_units
from generatepointsfromlines import get_distance_and_units


def GenerateTransectLines(in_features, out_feature_class, interval, transect_width, end_points=False):
    desc = arcpy.Describe(in_features)
    sr = desc.spatialReference
    # epsilon
    e = (sr.xyTolerance)*2

    # Create out_feature_class
    arcpy.CreateFeatureclass_management(
        os.path.dirname(out_feature_class),
        os.path.basename(out_feature_class),
        geometry_type="POLYLINE",
        spatial_reference=sr)

    if getattr(desc, "hasOID64", False):
        try:
            arcpy.management.MigrateObjectIDTo64Bit(out_feature_class)
        except Exception as e:
            pass

    arcpy.AddField_management(out_feature_class, "ORIG_FID", "BIGINTEGER" if getattr(desc, "hasOID64", False) else "LONG")

    # Get the distance and units
    width, wUnits = get_distance_and_units(transect_width)
    interval, iUnits = get_distance_and_units(interval)
    spatial_info = namedtuple('spatial_info', 'spatialReference extent')
    sp_info = spatial_info(spatialReference=sr, extent=desc.extent)

    widthConverted = width * convert_units(wUnits, sp_info)
    intervalConverted = interval * convert_units(iUnits, sp_info)

    out_fc_is_empty = True
    
    with arcpy.da.SearchCursor(in_features, ["SHAPE@", "OID@"]) as scur:
        with arcpy.da.InsertCursor(out_feature_class, ["SHAPE@", "ORIG_FID"]) as icur:
            for row in scur:
                line = row[0]
                lineID = row[1]
                # Skip Null geometry
                if line:

                    # Progress bar
                    arcpy.SetProgressor("STEP", "", 0, round(line.length/intervalConverted), 1)

                    # If the input is polygons, get the polygon boundary
                    if line.type.lower() == 'polygon':
                        line = line.boundary()

                    # Make a straight line segment
                    curLength = intervalConverted
                    while curLength < line.length:
                        out_fc_is_empty = False
                        newPoint = line.positionAlongLine(curLength)
                        MakeTransectLine(newPoint.firstPoint, 
                                         curLength, 
                                         widthConverted, 
                                         e,
                                         line, 
                                         icur, 
                                         lineID, 
                                         sr, 
                                         "middle")
                        curLength += intervalConverted
                        arcpy.SetProgressorPosition()
                    if end_points:
                        out_fc_is_empty = False
                        MakeTransectLine(line.firstPoint, 
                                         0, 
                                         widthConverted, 
                                         e, 
                                         line, 
                                         icur, 
                                         lineID, 
                                         sr, 
                                         "start")
                        MakeTransectLine(line.lastPoint, 
                                         0, 
                                         widthConverted, 
                                         e, 
                                         line, 
                                         icur, 
                                         lineID, 
                                         sr, 
                                         "end")


    if out_fc_is_empty:
        arcpy.AddIDMessage('WARNING', 117)

                           
def MakeTransectLine(newPoint, curLength, widthConverted, e, line, icur, lineID, sr, type):
    if type == "middle":
        seg = line.segmentAlongLine(curLength-e, curLength)
    elif type == "start":
        seg = line.segmentAlongLine(0, e)
    elif type == "end":
        seg = line.segmentAlongLine(line.length-e, line.length)     
    # Calculate the angle and distance from origin for transects
    changeY = seg.lastPoint.Y - seg.firstPoint.Y
    changeX = seg.lastPoint.X - seg.firstPoint.X    
    slope = changeY / changeX if changeX else 90
    slopeAngle = math.atan(slope)
    dx = (widthConverted / 2) * math.cos(slopeAngle)
    dy = (widthConverted / 2) * math.sin(slopeAngle)
    # Make the transect line and insert it
    lineArray = arcpy.Array(
        [arcpy.Point(newPoint.X + dy, newPoint.Y - dx),
         arcpy.Point(newPoint.X - dy, newPoint.Y + dx)])
    transectLine = arcpy.Polyline(lineArray, sr)
    icur.insertRow([transectLine, lineID])                        
                        
# run the script
if __name__ == '__main__':
    # Get Parameters
    in_features = arcpy.GetParameterAsText(0)
    out_feature_class = arcpy.GetParameterAsText(1)
    interval = arcpy.GetParameterAsText(2)
    transect_width = arcpy.GetParameterAsText(3)
    end_points = arcpy.GetParameter(4)

    # Run the main script
    GenerateTransectLines(in_features, out_feature_class, interval,
                          transect_width, end_points)
