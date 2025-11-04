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
import locale
import traceback
import sys
import uuid
import DefenseUtilities
from arcpy.sa import *

# Setting file name for error messaging
THIS_FILE_NAME = 'GenerateTopographicContours.py'

# Setting to overwrite output
arcpy.env.overwriteOutput = 1


# Trace function to get errors and exceptions that may occur during execution
def trace():
    tbinfo = traceback.format_tb(sys.exc_info()[2])[0]
    line = tbinfo.split(', ')[1]
    synerror = traceback.format_exc().splitlines()[-1]
    return line, THIS_FILE_NAME, synerror


# Checks out necessary extensions
def checkoutextensions(extlist):
    try:
        for ext in extlist:
            if DefenseUtilities.licenselevel() == 'Server':
                if arcpy.CheckExtension(ext) != 'Available':
                    arcpy.AddIDMessage('ERROR', 616, str(ext))
                    raise Exception()
            else:
                check = arcpy.CheckExtension(ext)
                if check == 'Available':
                    checkout = arcpy.CheckOutExtension(ext)
                    if checkout != 'CheckedOut':
                        arcpy.AddIDMessage('ERROR', 616, str(ext))
                        raise Exception()
                else:
                    arcpy.AddIDMessage('ERROR', 616, str(ext))
                    raise Exception()
    except Exception as e:
        arcpy.AddIDMessage('ERROR', 824)
        raise Exception()


# Setting necessary default values based on scale parameter
def getdefaultvalues(scale):
    if scale == '1:5,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '125 Meters', 5, 25, 1, 0.075, '20 Meters', '15 Meters', '.5 Meters', 3
    elif scale == '1:10,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '125 Meters', 5, 25, 1, 0.075, '40 Meters', '30 Meters', '1 Meters', 3
    elif scale == '1:12,500':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '250 Meters', 5, 25, 1, 0.075, '40 Meters', '30 Meters', '1.25 Meters', 3
    elif scale == '1:25,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '250 Meters', 10, 50, 1, 0.15, '75 Meters', '50 Meters', '2.5 Meters', 5
    elif scale == '1:50,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '500 Meters', 20, 100, 1, 0.3, '150 Meters', '50 Meters', '7.5 Meters', 5
    elif scale == '1:100,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '500 Meters', 40, 200, 1, 0.3, '300 Meters', '100 Meters', '10 Meters', 5
    elif scale == '1:250,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '750 Meters', 328, 1645, 3.28084, 0.6, '1000 Feet', '500 Feet', '25 Meters', 6
    elif scale == '1:500,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '750 Meters', 500, 2500, 3.28084, 0.6, '1000 Feet', '500 Feet', '50 Meters', 6
    elif scale == '1:1,000,000':
        buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect = '1 Kilometers', 1000, 5000, 3.28084, 0.6, '1000 Feet', '500 Feet', '100 Meters', 6
    else:
        arcpy.AddIDMessage('ERROR', 120010, '1:5,000 | 1:10,000 | 1:12,500 | 1:25,000 | 1:50,000 | 1:100,000  | 1:250,000 | 1:500,000 | 1:1,000,000')
        raise Exception()
    return buffer_distance, interval, index, z, raster_tol, min_length, smooth, point_thin, fs_rect


# Getting the spatial reference of the input rasters
def getrasterspatial(rasters):
    spatial_reference = None
    for raster in rasters.split(';'):
        sr = arcpy.Describe(raster).spatialReference
        if spatial_reference is None:
            spatial_reference = sr
        else:
            if sr.name != spatial_reference.name:
                arcpy.AddIDMessage('ERROR', 160310)
                raise Exception()
    return spatial_reference


# Getting information from the rasters
def getrastercell(rasterlist):
    currx, curry, currbndcnt, currpixel, rasterprops = None, None, None, None, None
    cellsizex, no_data = '', ''
    for raster in rasterlist.split(';'):
        raster = f"{raster.strip(';')}"
        cellsizex = arcpy.management.GetRasterProperties(raster, 'CELLSIZEX').getOutput(0)
        cellsizey = arcpy.management.GetRasterProperties(raster, 'CELLSIZEY').getOutput(0)
        bndcnt = arcpy.management.GetRasterProperties(raster, 'BANDCOUNT').getOutput(0)
        pixel = arcpy.management.GetRasterProperties(raster, 'VALUETYPE').getOutput(0)
        if currx is not None and curry is not None and currbndcnt is not None and currpixel is not None:
            if currx != cellsizex or curry != cellsizey or currbndcnt != bndcnt or currpixel != pixel:
                arcpy.AddIDMessage('ERROR', 45036, str(raster))
                raise Exception()
        currx = cellsizex
        curry = cellsizey
        currbndcnt = bndcnt
        currpixel = pixel
        rasterprops = DefenseUtilities.GetRasterProperties([raster])
    spatialreference = getrasterspatial(rasterlist)
    return rasterprops, cellsizex, spatialreference


# Getting verticies of AOI feature to pass into raster function extent
def getgeometry(aoi_layer):
    try:
        desc = arcpy.Describe(aoi_layer)
        extent_list = str(desc.extent).split(' ')[:4]
        return {'xmin': locale.atof(str(extent_list[0])), 'ymin': locale.atof(str(extent_list[1])),
                'xmax': locale.atof(str(extent_list[2])), 'ymax': locale.atof(str(extent_list[3]))}
    except Exception as e:
        arcpy.AddIDMessage('ERROR', 160120)
        raise Exception()


# Determining if the field has a valid value
def validfields(fields):
    valid = True
    for field in fields:
        if field == '':
            valid = False
        elif field == '#':
            valid = False
        elif field is None:
            valid = False
    return valid


# Cleans up in_memory feature classes that are not the current contours
def cleanmemory(clean_list, contours):
    for item in clean_list:
        if item != contours:
            arcpy.management.Delete(item)
            clean_list.remove(item)
    return clean_list


# Determine if unit conversion is needed for determining small features
def determineunits(linear_unit, contour_lines):
    length_units = (linear_unit.split(' '))[1].upper()

    # Determine if geographic coordinate system
    spatial_ref = arcpy.Describe(contour_lines).spatialReference
    if spatial_ref.name == spatial_ref.GCS.name:
        data_units = spatial_ref.angularUnitName.upper()
        if data_units == 'DEGREES':
            data_units = 'DECIMALDEGREES'
    else:
        data_units = spatial_ref.linearUnitName.upper()

    # Valid data length types supported by geometry object
    supported_units = ('CENTIMETERS', 'DECIMETERS', 'FEET', 'INCHES', 'KILOMETERS', 'METERS', 'MILES', 'MILLIMETERS',
                       'NAUTICALMILES', 'YARDS')
    if data_units == length_units:
        unit_type = 'SAME'
    elif length_units in supported_units:
        unit_type = 'SUPPORTED'
    else:
        unit_type = 'UNSUPPORTED'
    return unit_type, length_units


# Remove loops that touch contour line with same contour value
def removeloops(contours, min_length, min_len_type, min_len_units, contour_field):
    # Determine which contours touch others
    cleanup = []
    delete_ids = []
    cont_diss = contours
    contours_layer = arcpy.MakeFeatureLayer_management(contours, 'CONTOURS_LAYER')
    point_intersect = arcpy.analysis.PairwiseIntersect(contours_layer, 'in_memory/intersectPoint', output_type='POINT')
    if int(arcpy.management.GetCount(point_intersect)[0]) > 0:

        # Select contours that have intersections
        test_contours = arcpy.management.MakeFeatureLayer(contours, 'tempContLyr')
        arcpy.management.SelectLayerByLocation(test_contours, 'INTERSECT', point_intersect)

        # Dissolve contours to remove end to end connections.
        cont_diss = arcpy.management.Dissolve(test_contours, 'in_memory/DissolveTest', [contour_field], '',
                                              'SINGLE_PART', 'UNSPLIT_LINES')

        # Determine which contours touch others
        near_tab = arcpy.analysis.GenerateNearTable(cont_diss, cont_diss, 'in_memory/touching', '0 Meters',
                                                    closest='ALL')

        # Get the contour value and geometry for each contour
        contour_val_dict = {}
        with arcpy.da.SearchCursor(cont_diss, ['OID@', contour_field, 'SHAPE@']) as cursor:
            for row in cursor:
                contour_val_dict[row[0]] = [row[1], row[2]]

        # Build dictionary of which lines touch each other
        contour_near_dict = {}
        with arcpy.da.SearchCursor(near_tab, ['IN_FID', 'NEAR_FID']) as cursor:
            for row in cursor:
                if row[0] in contour_near_dict:
                    near_vals = contour_near_dict[row[0]]
                    near_vals.append(row[1])
                    contour_near_dict[row[0]] = near_vals
                else:
                    contour_near_dict[row[0]] = [row[1]]

        # Remove shorter if line is closed and touches. Set minimum length to 10X specified value.
        # If not min length was deleting some features that need to remain.
        del_len = min_length * 10
        with arcpy.da.UpdateCursor(cont_diss, ['OID@', contour_field, 'SHAPE@']) as cursor:
            for row in cursor:
                deleted = False
                # If closed loop
                if min_len_type == 'SAME' or min_len_type == 'SUPPORTED':
                    if min_len_type == 'SAME':
                        contour_len = row[2].length
                    else:
                        contour_len = row[2].getLength('GEODESIC', min_len_units)
                else:
                    contour_len = 0
                if contour_len < del_len:
                    if not row[2].firstPoint.disjoint(row[2].lastPoint):
                        # Get touching features
                        if row[0] in contour_near_dict:
                            compares = contour_near_dict[row[0]]
                            for compare_id in compares:
                                # If the feature being compared has not already been deleted
                                if compare_id not in delete_ids and not deleted:
                                    if compare_id in contour_val_dict:
                                        compare_value, compare_geo = contour_val_dict[compare_id]
                                        # If same contour value
                                        if compare_value == row[1]:
                                            # Does the compare feature not closed
                                            if compare_geo.firstPoint.disjoint(compare_geo.lastPoint):
                                                delete_ids.append(row[0])
                                                deleted = True
                                            else:
                                                # Both closed loops, which is smaller
                                                if row[2].length < compare_geo.length:
                                                    delete_ids.append(row[0])
                                                    deleted = True
                    if deleted:
                        cursor.deleteRow()

        # Creating a field mapping from dissolve contours to test contours
        field_mapping = arcpy.FieldMappings()
        field_mapping.addTable(cont_diss)
        field_mapping.addTable(test_contours)
        out_field_to_map = field_mapping.findFieldMapIndex(contour_field)
        field_map = field_mapping.getFieldMap(out_field_to_map)
        field_map.addInputField(test_contours, contour_field)
        field_mapping.replaceFieldMap(out_field_to_map, field_map)

        # Combine result with all the lines that do not have intersections
        arcpy.management.SelectLayerByAttribute(test_contours, 'SWITCH_SELECTION')
        arcpy.management.Append(test_contours, cont_diss, 'NO_TEST', field_mapping)
        cleanup.append(near_tab)
        cleanup.append(test_contours)
    cleanup.append(point_intersect)
    cleanmemory(cleanup, cont_diss)
    return cont_diss


# Adding a rounding function for JOG contours
def jog_round(cont_val):
    round_val = cont_val + (locale.atof(str(5 - cont_val))) % 5
    if round_val in [1640, 3280, 4265, 4920, 5905, 6560, 7545, 8200, 8530, 9185, 9840, 10170, 10825, 11480, 11810,
                     12465, 12795, 13120, 13450, 14105, 14435, 14760, 15090, 15745, 16075, 16400, 16730, 17060,  17385,
                     17715, 18040, 18370, 18700, 19025, 19355, 19685, 20010, 20340, 20665, 20995, 21650, 21980, 22305,
                     22635]:
        round_val = round_val + 5
    elif round_val in [19680, 21320, 22960]:
        round_val = round_val + 10
    return round_val


# Function to read raster extent and build a polygon
def build_raster_polygon(in_raster):
    in_raster = in_raster.split(';')
    temp_feat = os.path.join(arcpy.env.scratchGDB, 'temp_poly')
    extent_feat = os.path.join(arcpy.env.scratchGDB, 'extent_poly')
    arcpy.management.CreateFeatureclass(arcpy.env.scratchGDB, 'extent_poly', 'POLYGON')
    for raster in in_raster:
        # Getting extent of raster
        raster_obj = arcpy.sa.Raster(raster)
        raster_extent = raster_obj.extent
        extent_poly = raster_extent.polygon
        arcpy.management.CopyFeatures(extent_poly, temp_feat)
        arcpy.management.Append(temp_feat, extent_feat, 'NO_TEST', '', '')
    return extent_feat


# Getting the minimum value of the raster and seeing if it is divisible by the contour interval, if so change
# zero_contour to 'true'
def raster_min_value(in_raster, contour_interval, include_zero):
    raster = arcpy.Raster(in_raster)
    raster_min = raster.minimum
    if raster_min < 0:
        if raster_min + contour_interval < 0:
            arcpy.AddWarning('Including zero contour in output due to negative elevation in raster')
            include_zero = 'true'
    return include_zero


# Main function
def main():
    try:
        # Checking license level and checking out foundation and spatial
        if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'Standard' or \
                DefenseUtilities.licenselevel() == 'None':
            DefenseUtilities.LicenseException("This tool requires an Advanced License to run this tool.")
        checkoutextensions(['foundation', 'spatial'])

        # Setting parameters
        input_rasters = arcpy.GetParameterAsText(0)
        area_of_interest = arcpy.GetParameterAsText(1)
        out_contour_features = arcpy.GetParameterAsText(2)
        height_field = arcpy.GetParameterAsText(3)
        contour_subtype = arcpy.GetParameterAsText(4)
        scale = arcpy.GetParameterAsText(5)
        resample_raster = arcpy.GetParameterAsText(6)
        contour_interval = arcpy.GetParameterAsText(7)
        base_contour = arcpy.GetParameterAsText(8)
        z_factor = arcpy.GetParameterAsText(9)
        zero_contour = arcpy.GetParameterAsText(10)
        code_field = arcpy.GetParameterAsText(11)
        index_interval = arcpy.GetParameterAsText(12)
        index_code = arcpy.GetParameterAsText(13)
        intermediate_code = arcpy.GetParameterAsText(14)
        depression_code = arcpy.GetParameterAsText(15)
        depression_intermediate_code = arcpy.GetParameterAsText(16)
        raster_tolerance = arcpy.GetParameterAsText(17)
        if raster_tolerance is not None and raster_tolerance != '' and raster_tolerance != ' ':
            raster_tolerance = locale.atof(str(raster_tolerance))
        contour_minimum_length = arcpy.GetParameterAsText(18)
        contour_smooth_tolerance = arcpy.GetParameterAsText(19)
        supplemental_contours = arcpy.GetParameterAsText(20)
        half_auxiliary_code = arcpy.GetParameterAsText(21)
        quarter_auxiliary_code = arcpy.GetParameterAsText(22)
        depression_auxiliary_code = arcpy.GetParameterAsText(23)

        clean_list = []

        with arcpy.EnvManager(extent="Default"):
            # Checking AOI feature for selection
            desc = arcpy.Describe(area_of_interest)
            selection = str(desc.fidset.split(';'))
            if selection == "['']" or len(selection.split(',')) > 1:
                arcpy.AddIDMessage('ERROR', 90052)
                raise Exception()

            orig_rasters = input_rasters
            lst_rasters = input_rasters.split(';')
            for index, raster in enumerate(lst_rasters):
                raster = raster.strip("'")
                lst_rasters[index] = raster
                    
            input_rasters = ';'.join(lst_rasters)

            # Setting default scale value if none set
            if scale is None or scale == '' or scale == ' ':
                scale = '1:50,000'

            # Getting default values based on scale parameter
            buffer_distance, scale_interval, scale_index, scale_z, scale_raster_tol, min_length, smooth, point_thin, \
                fs_rect = getdefaultvalues(scale)
            if not validfields([contour_interval]):
                contour_interval = scale_interval
            if not validfields([index_interval]):
                index_interval = scale_index
            if not validfields([z_factor]):
                z_factor = scale_z
            if not validfields([raster_tolerance]):
                raster_tolerance = locale.atof(str(scale_raster_tol))
            if not validfields([contour_minimum_length]):
                contour_minimum_length = min_length
            if not validfields([contour_smooth_tolerance]):
                contour_smooth_tolerance = smooth
            if not validfields([fs_rect]):
                fs_rect = int(fs_rect)

            # Building raster extent features
            raster_extent_feat = build_raster_polygon(input_rasters)

            # Mosaic input rasters
            rasterprops, rastercellsizex, spatial_ref = getrastercell(input_rasters)
            if len(input_rasters.split(';')) > 1:
                arcpy.management.MosaicToNewRaster(input_rasters, arcpy.env.scratchGDB, 'mosaic_raster', spatial_ref,
                                                   rasterprops.pixelType, '#', rasterprops.bands, 'MEAN', 'FIRST')
                input_rasters = os.path.join(arcpy.env.scratchGDB, 'mosaic_raster')

            # Setting variables for raster function, output raster
            uid = uuid.uuid4()
            output_raster = os.path.join(arcpy.env.scratchFolder, f'{uid}.tif')

            # Buffering the AOI and getting geometry of buffered AOI to use as the extent of the clip
            arcpy.analysis.Buffer(area_of_interest, r'in_memory/buffered_AOI', '1.5 KILOMETERS', 'FULL', 'FLAT', 'ALL',
                                  '#', 'PLANAR')

            bufferedAOILayer = 'Buffer_AOI'
            arcpy.management.MakeFeatureLayer(r'in_memory/buffered_AOI', bufferedAOILayer)
            arcpy.management.SelectLayerByAttribute(bufferedAOILayer, 'NEW_SELECTION')

            # Checking area of interest and raster to make sure that they are coincident
            buffer_extent = arcpy.Describe(bufferedAOILayer).extent
            raster_extent = arcpy.Describe(input_rasters).extent
            disjoint = raster_extent.disjoint(buffer_extent)
            if disjoint:
                arcpy.AddIDMessage('ERROR', 110204)
                raise Exception()

            # Limiting buffer AOI to extent of raster
            clip_poly = os.path.join(arcpy.env.scratchGDB, 'clip_poly')
            null_clip_poly = os.path.join(arcpy.env.scratchGDB, 'null_clip_poly')
            arcpy.management.MakeFeatureLayer(raster_extent_feat, 'raster_extent_feat')
            arcpy.analysis.Clip(bufferedAOILayer, 'raster_extent_feat', clip_poly)
            arcpy.management.MakeFeatureLayer(clip_poly, 'Clip_AOI')
            aoi_geo = getgeometry('Clip_AOI')

            # Clipping raster to AOI for NoData check
            arcpy.management.Clip(in_raster=input_rasters,
                                  rectangle=f"{aoi_geo['xmin']} {aoi_geo['ymin']} {aoi_geo['xmax']} {aoi_geo['ymax']}",
                                  out_raster=os.path.join(arcpy.env.scratchGDB, 'clip1'), nodata_value='-32767',
                                  clipping_geometry='NONE', maintain_clipping_extent='NO_MAINTAIN_EXTENT')
            null_poly1 = arcpy.conversion.RasterToPolygon(IsNull(os.path.join(arcpy.env.scratchGDB, 'clip1')),
                                                          os.path.join(arcpy.env.scratchGDB, 'null_poly1'),
                                                          'NO_SIMPLIFY', 'Value', 'SINGLE_OUTER_PART', None)
            arcpy.management.MakeFeatureLayer(null_poly1, 'null_poly1')
            arcpy.management.SelectLayerByAttribute('null_poly1', 'NEW_SELECTION', "gridcode = 1", None)
            desc = arcpy.Describe('null_poly1')
            selection = str(desc.fidset.split(';'))
            if selection == "['']" or len(selection.split(',')) > 0:
                arcpy.management.DeleteFeatures('null_poly1')
            arcpy.analysis.Clip('Clip_AOI', 'null_poly1', null_clip_poly)
            arcpy.management.MakeFeatureLayer(null_clip_poly, 'Null_Clip_AOI')
            aoi_geo = getgeometry('Null_Clip_AOI')

            input_rasters = arcpy.management.Clip(in_raster=input_rasters,
                                                  rectangle=f"{aoi_geo['xmin']} {aoi_geo['ymin']} {aoi_geo['xmax']} {aoi_geo['ymax']}",
                                                  out_raster=os.path.join(arcpy.env.scratchGDB, 'clip'),
                                                  nodata_value='-32767',
                                                  clipping_geometry='NONE',
                                                  maintain_clipping_extent='NO_MAINTAIN_EXTENT')
            # ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            # Attempting to remove NoData edge from raster and creating nodata polys
            nodata_clip = Con(IsNull(input_rasters), 1, 0)
            nodata_polys = arcpy.conversion.RasterToPolygon(nodata_clip, r'in_memory/nodata_poly')
            input_rasters = Con(IsNull(input_rasters), input_rasters,
                                FocalStatistics(input_rasters, NbrRectangle(fs_rect, fs_rect, "CELL"), "MEAN", "DATA"))
            # ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            
            contour_interval = int(contour_interval)
            original_contour_interval = int(contour_interval)

            if supplemental_contours == "HALF_AUXILIARY":
                contour_interval /= 2
            elif supplemental_contours == "QUARTER_AUXILIARY":
                contour_interval /= 4

            # Setting argument string
            path_to_rasters = arcpy.Describe(input_rasters).catalogPath
            # **********************************************************************************************************
            # Forcing resampling in flat areas
            raster = arcpy.Raster(path_to_rasters)
            if resample_raster == 'false':
                if scale in ['1:5,000', '1:10,000', '1:12,500', '1:25,000', '1:50,000', '1:100,000']:
                    if (raster.maximum - raster.minimum) < (contour_interval * 10):
                        resample_raster = 'true'
                elif scale in ['1:250,000', '1:500,000', '1:1,000,000']:
                    if (raster.maximum - raster.minimum) < (contour_interval * 5):
                        resample_raster = 'true'
                if resample_raster == 'true':
                    arcpy.AddWarning('Resampling raster due to low variance in elevation values')
                    path_to_rasters = arcpy.Describe(raster).catalogPath
            # **********************************************************************************************************
            if resample_raster == 'true':
                arcpy.AddIDMessage('INFORMATIVE', 10344, str(raster_tolerance))
                if raster_tolerance > 0:
                    rastercellsizex = format(locale.atof(rastercellsizex)/4, '.20f')
                    resampled = arcpy.management.Resample(path_to_rasters, output_raster, rastercellsizex, 'CUBIC')
                    raster_obj = arcpy.Raster(resampled)
                    output_raster = arcpy.ia.Contour(raster_obj, raster_tolerance, 'smooth surface only',
                                                     0, 0, contour_interval, 0, locale.atof(str(z_factor)))
                else:
                    output_raster = arcpy.ia.Contour(path_to_rasters, raster_tolerance, 'smooth surface only',
                                                     0, 0, contour_interval, 0, locale.atof(str(z_factor)))
            else:
                output_raster = arcpy.ia.Contour(path_to_rasters, raster_tolerance, 'smooth surface only',
                                                 0, 0, contour_interval, 0, locale.atof(str(z_factor)))
            output_raster.save(os.path.join(arcpy.env.scratchGDB, 'contourraster'))

            # Checking to make sure that clipped raster is not all 0
            arcpy.management.CalculateStatistics(output_raster, 1, 1, '', 'OVERWRITE', '')
            raster_min = arcpy.management.GetRasterProperties(output_raster, 'MINIMUM').getOutput(0)
            raster_max = arcpy.management.GetRasterProperties(output_raster, 'MAXIMUM').getOutput(0)
            if raster_min == 0 and raster_max == 0:
                arcpy.AddIDMessage('ERROR', 110204)
                raise Exception()

            # Creating contours on the smooth raster surface
            inprocess_contours = arcpy.sa.Contour(output_raster, r'in_memory/temp_contours', contour_interval,
                                                  base_contour)

            # Removing any stacking contours out of bounds of AOI
            arcpy.analysis.Buffer(area_of_interest, r'in_memory/clip_buffer', buffer_distance, 'FULL', 'FLAT', 'ALL',
                                  '#', 'PLANAR')
            inprocess_contours = arcpy.analysis.Clip(inprocess_contours, r'in_memory/clip_buffer',
                                                     r'in_memory/temp_clip_contours')
            # ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            # Removing contour parts that fill outside raster
            arcpy.management.MakeFeatureLayer(nodata_polys, 'NoData_Polys')
            arcpy.management.SelectLayerByAttribute('NoData_Polys', 'NEW_SELECTION', "gridcode = 0")
            desc = arcpy.Describe('NoData_Polys')
            selection = str(desc.fidset.split(';'))
            if selection == "['']" or len(selection.split(',')) > 0:
                inprocess_contours = arcpy.analysis.Clip(inprocess_contours, 'NoData_Polys',
                                                         r'in_memory/temp_ras_clip_contours')
            # ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            # Creating a cartographic partition feature class and setting the cartographic partition environment variable
            arcpy.cartography.CreateCartographicPartitions(inprocess_contours, r'in_memory/partitions', '5000')
            arcpy.env.cartographicPartitions = r'in_memory/partitions'

            # Cleanup contour lines
            arcpy.AddIDMessage('INFORMATIVE', 86055)
            clean_list.append(inprocess_contours)
            contour_field = 'CONTOUR'

            # Determine units for smooth and minimum length
            min_length = locale.atof(str(contour_minimum_length.split(' ')[0]))
            if min_length and float(min_length) > 0:
                min_len_type, min_len_units = determineunits(contour_minimum_length, inprocess_contours)
            else:
                min_length = 0
                min_len_type = 'NONE'

            if min_len_type not in ('SAME', 'SUPPORTED', 'NONE'):
                arcpy.AddIDMessage('WARNING', 30045)
                min_length = 0

            tolerance = locale.atof(str(contour_smooth_tolerance.split(' ')[0]))

            # Remove vertices first
            arcpy.edit.Generalize(inprocess_contours, point_thin)

            # Repair geometry
            arcpy.management.RepairGeometry(inprocess_contours, 'DELETE_NULL', 'OGC')

            # Remove the 0 contour.  If minimum length is defined, also remove small closed loops
            # Adding check to see if we should override the zero_contour parameter
            if zero_contour == 'false':
                zero_contour = raster_min_value(output_raster, contour_interval, zero_contour)

            if zero_contour == 'false':
                with arcpy.da.UpdateCursor(inprocess_contours, [contour_field, 'SHAPE@']) as cur:
                    for row in cur:
                        if row[0] == 0:
                            cur.deleteRow()
                        elif row[1] is not None and min_length > 0:
                            if not row[1].firstPoint.disjoint(row[1].lastPoint):
                                if min_len_type == 'SAME':
                                    contour_len = row[1].length
                                else:
                                    contour_len = row[1].getLength('GEODESIC', min_len_units)
                                if contour_len < min_length:
                                    cur.deleteRow()

            # Fix multipart contours produces better result when removing loops
            uid = str(uuid.uuid4()).replace('-', '')
            inprocess_contours = arcpy.management.MultipartToSinglepart(inprocess_contours,
                                                                        f'{arcpy.env.scratchGDB}/c{uid}')
            clean_list.append(inprocess_contours)

            # Remove self intersections - faster with fewer vertices.  Run before smooth.
            inprocess_contours = removeloops(inprocess_contours, min_length, min_len_type, min_len_units, contour_field)
            clean_list.append(inprocess_contours)

            # Remove short lines
            if min_length > 0:
                if zero_contour != 'false':
                    with arcpy.da.UpdateCursor(inprocess_contours, ['SHAPE@']) as cur:
                        for row in cur:
                            if min_len_type == 'SAME':
                                contour_len = row[0].length
                            else:
                                contour_len = row[0].getLength('GEODESIC', min_len_units)
                            if contour_len < min_length:
                                if not row[0].firstPoint.disjoint(row[0].lastPoint):
                                    cur.deleteRow()

                # Run remove small lines - i.e. delete dangles
                # this will remove any remaining small lines that do not help create a larger contour
                arcpy.topographic.RemoveSmallLines(inprocess_contours, contour_minimum_length, recursive='RECURSIVE',
                                                   split_input_lines='NO_SPLIT')

            clean_list = cleanmemory(clean_list, inprocess_contours)

            # Simplify line - bend simplify to remove cutbacks and some stair steps
            if tolerance != '' and tolerance > 0:
                inprocess_contours = arcpy.cartography.SimplifyLine(inprocess_contours, r'in_memory/simpcont',
                                                                    'BEND_SIMPLIFY', contour_smooth_tolerance)
                clean_list.append(inprocess_contours)
                inprocess_contours = arcpy.Dice_management(inprocess_contours, 'in_memory/diced', 250)
                clean_list.append(inprocess_contours)
                inprocess_contours = arcpy.SmoothLine_cartography(inprocess_contours, r'in_memory/smooth_contours',
                                                                  'PAEK', contour_smooth_tolerance)
            clean_list = cleanmemory(clean_list, inprocess_contours)
            clean_list.append(inprocess_contours)

            # Repairing any geometry issues and dissolving multipart features to singlepart features
            inprocess_contours = arcpy.management.RepairGeometry(inprocess_contours, 'DELETE_NULL')
            inprocess_contours = arcpy.management.Dissolve(inprocess_contours, r'in_memory/dissolve', 'Contour', None,
                                                           'SINGLE_PART', 'UNSPLIT_LINES')

            # Conversion for JOG contours
            if min_len_units == 'FEET' and scale == '1:250,000' and str(locale.atof(str(z_factor))) == '3.28084':
                with arcpy.da.UpdateCursor(inprocess_contours, [contour_field, 'SHAPE@']) as cur:
                    for row in cur:
                        row[0] = jog_round(int(row[0]))
                        cur.updateRow(row)

            # Creating and setting field mapping from temp contour feature class to output feature class
            field_mapping = arcpy.FieldMappings()
            field_mapping.addTable(out_contour_features)
            field_mapping.addTable(inprocess_contours)
            out_field_to_map = field_mapping.findFieldMapIndex(height_field)
            field_map = field_mapping.getFieldMap(out_field_to_map)
            field_map.addInputField(inprocess_contours, 'Contour')
            field_mapping.replaceFieldMap(out_field_to_map, field_map)

            # Appending temp contour features into output feature class
            arcpy.AddIDMessage('INFORMATIVE', 86183)
            
            desc = arcpy.Describe(out_contour_features)
            with arcpy.da.Editor(desc.workspace.catalogPath) as edit:
                arcpy.management.Append(inprocess_contours, out_contour_features, 'NO_TEST', field_mapping,
                                        contour_subtype)

            # Coding contours
            runidentify = validfields([code_field, index_code, intermediate_code, depression_code,
                                       depression_intermediate_code])
            if runidentify:
                hqc_field = arcpy.ListFields(out_contour_features, code_field)
                if len(hqc_field) > 0:
                    arcpy.topographic.IdentifyContours(out_contour_features, orig_rasters, height_field, code_field,
                                                       index_interval, index_code, intermediate_code, depression_code,
                                                       depression_intermediate_code, '', bufferedAOILayer, z_factor,
                                                       contour_interval=int(original_contour_interval),
                                                       supplemental_contours=supplemental_contours,
                                                       half_auxiliary_code=half_auxiliary_code,
                                                       quarter_auxiliary_code=quarter_auxiliary_code,
                                                       depression_auxiliary_code=depression_auxiliary_code,
                                                       base_contour=base_contour)
                    arcpy.management.SelectLayerByAttribute(out_contour_features, 'CLEAR_SELECTION')

            # Checking for ESC and calculating
            esc_field = arcpy.ListFields(out_contour_features, 'ESC')
            if len(esc_field) > 0:
                try:
                    arcpy.management.SelectLayerByAttribute(out_contour_features, 'NEW_SELECTION', 'ESC = 0')
                    arcpy.management.SelectLayerByAttribute(out_contour_features, 'ADD_TO_SELECTION', 'ESC = -999999')
                    arcpy.management.CalculateField(out_contour_features, 'ESC', '1', 'PYTHON3', '', 'TEXT',
                                                    'NO_ENFORCE_DOMAINS')
                except Exception as e:
                    arcpy.AddWarning(f'{e}')
                finally:
                    arcpy.management.SelectLayerByAttribute(out_contour_features, 'CLEAR_SELECTION')
                    
            # Setting output to out_contours feature class
            arcpy.SetParameter(20, out_contour_features)
    except Exception as e:
        line, file, err = trace()
        arcpy.AddError(f'There was an error on line {line} of {file}\n{err}\n{e}')
    finally:
        cleanmemory(clean_list, None)
        delete_temp = ['mosaic_raster', 'clip', 'clip1', 'clip_poly', 'conditional', 'extent_poly', 'null',
                       'null_poly', 'null_poly1', 'null_clip_poly', 'resample', 'temp_poly', 'null_buffer_poly',
                       'contourraster', 'initialraster', 'naturalraster', 'raster_pnts']
        for dt in delete_temp:
            try:
                arcpy.management.Delete(os.path.join(arcpy.env.scratchGDB, dt))
            except Exception as e:
                arcpy.AddWarning(f'{e}')
        try:
            os.remove(os.path.join(arcpy.env.scratchFolder, f'{uid}.tif'))
        except Exception as e:
            pass


# Execute main
if __name__ == '__main__':
    main()
