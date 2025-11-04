# ----------------------------------------------------------------------------------------------------------------------
# COPYRIGHT 2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
# ----------------------------------------------------------------------------------------------------------------------
# Importing necessary modules
import arcpy
import os
from arcpy.sa import *


# Getting divisor based on extent of feature
def get_divisor(xdiff, ydiff):
    divisor = 250
    largest_diff = 0
    if xdiff > ydiff:
        largest_diff = xdiff
    else:
        largest_diff = ydiff
    if 0 <= largest_diff <= 10:
        divisor = 250
    elif 10 < largest_diff <= 20:
        divisor = 300
    elif 20 < largest_diff <= 40:
        divisor = 350
    elif 40 < largest_diff <= 60:
        divisor = 400
    elif 60 < largest_diff <= 80:
        divisor = 450
    elif 80 < largest_diff <= 100:
        divisor = 550
    elif 100 < largest_diff <= 150:
        divisor = 600
    elif 150 < largest_diff <= 200:
        divisor = 650
    elif 200 < largest_diff <= 250:
        divisor = 700
    elif 250 < largest_diff <= 300:
        divisor = 800
    elif 300 < largest_diff:
        divisor = 1000
    return largest_diff, divisor


# Main function for creating Isogonic lines
def isogonic_lines():
    # Getting parameters
    extent_features = arcpy.GetParameterAsText(0)
    altitude = arcpy.GetParameterAsText(1)
    date = arcpy.GetParameterAsText(2)
    interval = arcpy.GetParameterAsText(3)
    base = arcpy.GetParameterAsText(4)
    isogonic_features = arcpy.GetParameterAsText(5)
    out_field = arcpy.GetParameterAsText(6)
    subtype = arcpy.GetParameterAsText(7)
    annual_drift = arcpy.GetParameterAsText(8).lower() == 'true'
    annual_drift_field = arcpy.GetParameterAsText(9)
    
    # Setting environment options and getting scratch workspace
    arcpy.env.overwriteOutput = True
    scratch = arcpy.env.scratchGDB
    delList = []
    
    # Getting spatial reference of isogonic_features and projecting extent features
    sr = arcpy.Describe(isogonic_features).spatialReference
    arcpy.management.Project(extent_features, os.path.join(scratch, 'proj_extent_feats'), sr)
    delList.append(os.path.join(scratch, 'proj_extent_feats'))
    
    # Calculating cell size based on extent
    arcpy.management.MinimumBoundingGeometry(os.path.join(scratch, 'proj_extent_feats'), os.path.join(scratch, 'bounding_geo'), "ENVELOPE", "NONE", None, "NO_MBG_FIELDS")
    desc = arcpy.Describe(os.path.join(scratch, 'bounding_geo'))
    delList.append(os.path.join(scratch, 'bounding_geo'))
    extent = desc.Extent
    x = extent.XMax - extent.XMin
    y = extent.YMax - extent.YMin
    diff, div = get_divisor(x, y)
    calculatedValue = diff / div
 
    # Creating constant raster and converting to points to calculate magnetic elements
    constantRaster = CreateConstantRaster(1.1, 'FLOAT', calculatedValue, extent)
    arcpy.conversion.RasterToPoint(constantRaster, os.path.join(scratch, 'magnetic_points'), 'VALUE')
    arcpy.topographic.CalculateMagneticComponents(os.path.join(scratch, 'magnetic_points'), altitude, date, 'DECLINATION grid_code')
    delList.append(os.path.join(scratch, 'magnetic_points'))
    
    # Converting points to raster and creating contours from raster
    arcpy.conversion.PointToRaster(os.path.join(scratch, 'magnetic_points'), 'grid_code', os.path.join(scratch, 'point_raster'), 'MEAN', '', calculatedValue)
    arcpy.sa.Contour(os.path.join(scratch, 'point_raster'), os.path.join(scratch, 'contours'), interval, base, 1)
    delList.append(os.path.join(scratch, 'point_raster'))
    delList.append(os.path.join(scratch, 'contours'))

    # Determining if we need to calculate annual drift
    if annual_drift:
        # Getting center point of isogonic lines and creating a point for calculating annual drift
        arcpy.management.GeneratePointsAlongLines(os.path.join(scratch, 'contours'), os.path.join(scratch, 'annual_drift'), 'PERCENTAGE', Percentage=50)
        arcpy.management.AddField(os.path.join(scratch, 'annual_drift'), 'drift', 'DOUBLE')
        arcpy.management.AddField(os.path.join(scratch, 'contours'), 'drift', 'DOUBLE')
        arcpy.topographic.CalculateMagneticComponents(os.path.join(scratch, 'annual_drift'), altitude, date, 'ANNUAL_DRIFT drift')
        drift_dict = {}
        with arcpy.da.SearchCursor(os.path.join(scratch, 'annual_drift'), ['ORIG_FID', 'drift']) as cursor:
            for row in cursor:
                drift_dict[row[0]] = row[1]
        with arcpy.da.UpdateCursor(os.path.join(scratch, 'contours'), ['ObjectID', 'drift']) as cursor:
            for row in cursor:
                row[1] = drift_dict[row[0]]
                cursor.updateRow(row)
        
    # Mapping contours into isogonic_features
    field_mapping = arcpy.FieldMappings()
    field_mapping.addTable(isogonic_features)
    field_mapping.addTable(os.path.join(scratch, 'contours'))
    out_field_to_map = field_mapping.findFieldMapIndex(out_field)
    field_map = field_mapping.getFieldMap(out_field_to_map)
    field_map.addInputField(os.path.join(scratch, 'contours'), 'Contour')
    field_mapping.replaceFieldMap(out_field_to_map, field_map)
    if annual_drift:
        drift_field_to_map = field_mapping.findFieldMapIndex(annual_drift_field)
        drift_map = field_mapping.getFieldMap(drift_field_to_map)
        drift_map.addInputField(os.path.join(scratch, 'contours'), 'drift')
        field_mapping.addFieldMap(drift_map)
    
    # Appending features into isogonic_features
    desc = arcpy.Describe(isogonic_features)
    with arcpy.da.Editor(desc.workspace.catalogPath) as edit:
        arcpy.management.Append(os.path.join(scratch, 'contours'), isogonic_features, 'NO_TEST', field_mapping, subtype)
        
    # Deleting temporary features features created during execution
    for d in delList:
        try:
            arcpy.management.Delete(d)
        except Exception as e:
            arcpy.AddMessage(f'Could not delete temporary features {d}')
    arcpy.SetParameter(10, isogonic_features)
    return


if __name__ == "__main__":
    isogonic_lines()
    