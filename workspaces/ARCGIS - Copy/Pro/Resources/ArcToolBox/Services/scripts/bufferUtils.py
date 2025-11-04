"""---------------------------------------------------------------------------
Name:              createbuffers.py
Purpose:           Buffering
Author:            Esri Inc.
Created:           2/13/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
import os
import arcpy
import time
import analysisutils
import locale
from conversionUtils import convertLengthtoSRUnits

distancefieldname = "BUFF_DIST"

def createBuffers(in_features, distances, field, units, dissolve_type, ring_type,
                  side_type, end_type, out_features, calcField):
    '''Creates buffer polygons around in_features to a specified
    distance. Note: distances must be a List,
    #if len(distances)=1 buffer will return fields always'''
    #arcpy.AddMessage(calcField)
    arcpy.env.overwriteOutput = True
    beginTime = time.time()
    #arcpy.AddMessage("createBuffers")

    # If in_memory, write to in_memory
    if os.path.dirname(out_features) == 'in_memory':
        arcpy.env.workspace = 'in_memory'
    else:
        arcpy.env.workspace = arcpy.env.scratchGDB

    #arcpy.AddMessage(arcpy.env.workspace)

    ## Prep of argumentsJ)
    if side_type:
        side_type = {
            'full': 'FULL',
            'left': 'LEFT',
            'right': 'RIGHT',
            'outside': 'OUTSIDE_ONLY'
            }[side_type]

    #arcpy.AddMessage(side_type)

    if end_type:
        end_type = end_type.upper()

    #arcpy.AddMessage(end_type)

    if dissolve_type:
        dissolve_type = {
            'none': 'NONE',
            'dissolve': 'ALL',
            'split': 'SPLIT'
            }[dissolve_type]

    #arcpy.AddMessage(dissolve_type)

    # Handle any potential invalid side types
    startTime = time.time()
    describe = arcpy.Describe(in_features)
    analysisutils.AddTimerMessage(beginTime, u"Describe {}".format(in_features))

    shapeType = describe.shapeType;
    #arcpy.AddMessage(shapeType)
    if shapeType == 'Point':
        side_type = 'FULL' # anything else is invalid
    elif shapeType == 'Polyline':
        if side_type == 'OUTSIDE_ONLY':
            side_type = 'FULL'
    elif shapeType == 'Polygon':
        if side_type in ['LEFT', 'RIGHT']:
            side_type = 'FULL'

    #arcpy.AddMessage(side_type)

    ## End prep of arguments

    # If Mercator, assign spatial reference environment to WGS (wkid 4326)
    # for geodesic buffering
    geodesic = 0
    spref = describe.spatialReference
    gcscode = spref.GCSCode
    #arcpy.AddMessage(spref.name + " " + str(spref.PCSCode) + " " + str(spref.GCSCode))
    if analysisutils.useGeodesic(spRef=spref):
        geodesic = 1
    
    if dissolve_type == "SPLIT":
        # This should apply to points only
        if len(distances) > 0:
            distance = distances[0]
        else:
            distance = 0
        #arcpy.AddMessage("sending to thiessen")
        thiessenBuffer(
            in_features,
            out_features,
            distance,
            field,
            units,
            geodesic,
            gcscode,
            calcField)

    elif field:
        distance = 0
        #arcpy.AddMessage("sending to singlebuffer")
        singleBuffer(
            in_features,
            out_features,
            distance,
            field,
            units,
            side_type,
            end_type,
            dissolve_type,
            geodesic,
            gcscode,
            calcField)
        #calcAreaField(out_features, units, gcscode)

    elif len(distances) == 1:
        #arcpy.AddMessage("sending to singlebuffer")
        distance = distances[0]
        singleBuffer(
            in_features,
            out_features,
            distance,
            field,
            units,
            side_type,
            end_type,
            dissolve_type,
            geodesic,
            gcscode,
            calcField)
        #if calcField:
            #calcAreaField(out_features, units, gcscode)

    elif ring_type == 'rings' and (not dissolve_type or dissolve_type == "NONE"):
        oidfieldname = describe.oidfieldname
        #arcpy.AddMessage("sending to ringbuffer")
        ringBuffer(
            in_features,
            out_features,
            distances,
            units,
            geodesic,
            oidfieldname,
            spref,
            calcField)

    else:
        #arcpy.AddMessage("sending to multibuffer")
        multiBuffer(
            in_features,
            out_features,
            distances,
            units,
            dissolve_type,
            ring_type,
            geodesic,
            gcscode,
            calcField)

    analysisutils.AddTimerMessage(beginTime, "createBuffers")

# End createBuffers


def calcDistanceField(feature_class, distance, units):
    """Check and add the distance back onto the intermediate feature class
    if missing"""

    startTime = time.time()
    #arcpy.AddMessage(distance)
    # Note, AddField is a non-op if the field already exists    
    fieldAlias = getFieldAlias(units)
    if not analysisutils.verifyFieldExists(feature_class, distancefieldname):
        arcpy.AddField_management(feature_class, distancefieldname, 'DOUBLE')
    arcpy.CalculateField_management(feature_class, distancefieldname, distance, 'PYTHON')
    arcpy.AlterField_management(feature_class, distancefieldname, new_field_alias=fieldAlias)

    startTime = analysisutils.AddTimerMessage(startTime, "CalcDistanceField")

# End calcDistanceField

def getFieldAlias(units):
    return "Buffer distance in {}".format(units)

def addLinearUnitsField(feature_class, field, units):

    startTime = time.time()

    out_features = arcpy.CreateScratchName('features_', workspace=arcpy.env.workspace)
    arcpy.CopyFeatures_management(feature_class, out_features)

    fieldName = 'LinearUnits'
    expression = u'"!{}!" + " " + "{}"'.format(field, units)
    arcpy.AddField_management(out_features, fieldName, 'TEXT')
    arcpy.CalculateField_management(out_features, fieldName, expression, 'PYTHON')

    analysisutils.AddTimerMessage(startTime, "AddLinearUnitsField")

    return out_features, fieldName

# End addLinearUnitsField


def singleBuffer(in_features, out_features, distance, field, units, side_type, end_type,
                 dissolve_type, geodesic, gcscode, calcField):

    startTime = time.time()

    # If there is units to apply, apply it
    if units.lower() not in [u'default', '', '#']:
        bufdistance = u"{} {}".format(distance, units)
    else:
        bufdistance = distance

    # Note: fields and distances should be mutually exclusive, if both are
    # specificed, field name trumps distance
    if field:
        in_features, bufdistance = addLinearUnitsField(in_features, field, units)

    if geodesic:
        method = "GEODESIC"
    else:
        method = "PLANAR"

    if side_type == "FULL" and end_type == "ROUND":
        arcpy.AddMessage("Create buffers with PairwiseBuffer_analysis.")
        arcpy.analysis.PairwiseBuffer(in_features, out_features, bufdistance, dissolve_type, method=method)
    else:
        arcpy.AddMessage("Create buffers with Buffer_analysis.")
        arcpy.analysis.Buffer(in_features, out_features, bufdistance, side_type, end_type,
                              dissolve_type, method=method)

    if field:
        if (not dissolve_type or dissolve_type == "NONE"):
            fields = u"{};{}".format(bufdistance, distancefieldname)
            arcpy.DeleteField_management(out_features, fields)
    elif calcField:
        #Single Buffer will calculate fields in units of spatial reference
        #Hence need to update it                   
        calcDistanceField(out_features, distance, units)
    analysisutils.AddTimerMessage(startTime, "SingleBuffer")

# End singleBuffer


def multiBuffer(in_features, out_features, distances, units, dissolve_type, ring_type, geodesic, gcscode, calcField):
    """Perform multiple buffers"""

    beginTime = time.time()

    buffer_list = []

    for i, distance in enumerate(distances):
        out_buf = arcpy.CreateScratchName('buffer_', workspace=arcpy.env.workspace)
        arcpy.AddMessage('out_buf: {}'.format(out_buf))
        singleBuffer(in_features, out_buf, distance, "", units, "", "", dissolve_type, geodesic, gcscode, calcField)
        buffer_list.append(out_buf)

    if ring_type == "rings" and dissolve_type == 'ALL':
        count = len(buffer_list)
        index = count - 1
        while index > 0:
            startTime = time.time()
            out_erase = arcpy.CreateScratchName('erase_', workspace=arcpy.env.workspace)
            arcpy.Erase_analysis(buffer_list[index], buffer_list[index - 1], out_erase)
            buffer_list[index] = out_erase
            index = index - 1
            analysisutils.AddTimerMessage(startTime, "Erase")

    # Sort to ensure smaller buffers are not hidden underneath
    startTime = time.time()
    buffer_list.sort(reverse=True)
    # arcpy.Merge_management(buffer_list, out_features, "NO_TEST")
    arcpy.CopyFeatures_management(buffer_list[0], out_features)
    if len(buffer_list) > 1:
        arcpy.Append_management(buffer_list[1::], out_features, "NO_TEST")
    analysisutils.AddTimerMessage(startTime, "Merge")

    #if calcField:
        #calcAreaField(out_features, units, gcscode)

    analysisutils.AddTimerMessage(beginTime, "MultiBuffer")

# End multiBuffer


def thiessenBuffer(in_features, out_features, distance, field, units, geodesic, gcscode, calcField):
    """Creates buffer/thiessen polygons around in_features to a specified
    distance."""

    startTime = time.time()

    tmp_buffer = arcpy.CreateScratchName(
        'buffer', workspace=arcpy.env.workspace)

    singleBuffer(in_features, tmp_buffer, distance, field, units, "", "", "ALL", geodesic, gcscode, calcField)

    tmp_thiessen = arcpy.CreateScratchName(
        'thiessen', workspace=arcpy.env.workspace)

    arcpy.CreateThiessenPolygons_analysis(
        in_features,
        tmp_thiessen,
        'ALL')

    arcpy.Intersect_analysis(
        [tmp_buffer, tmp_thiessen],
        out_features)

    #if calcField:
        #calcAreaField(out_features, units, gcscode)

    analysisutils.AddTimerMessage(startTime, "ThiessenBuffer")

# End thiessenBuffer


def getUnitsCode(units):

    units = units.lower()

    if units == "feet":
        unitsCode = 9002
    elif units == "yards":
        unitsCode = 109001
    elif units == "miles":
        unitsCode = 9035
    elif units == "nauticalmiles":
        unitsCode = 9030
    elif units == "kilometers":
        unitsCode = 9036
    else:
        unitsCode = 9001

    return unitsCode

# End getUnitsCode


def ringBuffer(in_features, out_features, distances, units, geodesic, oidfieldname, spref, calcField):

    beginTime = time.time()

    unitsCode = getUnitsCode(units)        
        
    outpath = os.path.dirname(out_features)
    outname = os.path.basename(out_features)
    
    origidfieldname = "ORIG_FID"    
    shapefieldname = "shape@"
    arcpy.CreateFeatureclass_management(outpath, outname, "POLYGON", "", "DISABLED", "DISABLED", spref)

    arcpy.AddField_management(out_features, origidfieldname, "LONG")
    arcpy.AddField_management(out_features, distancefieldname, "DOUBLE", field_alias=getFieldAlias(units))

    infields = [shapefieldname, oidfieldname]
    incursor = arcpy.da.SearchCursor(in_features, infields)

    outfields = [shapefieldname, origidfieldname, distancefieldname]
    outcursor = arcpy.da.InsertCursor(out_features, outfields)

    for row in incursor:
        previousBuffer = None
        feature = row[0]
        fid = row[1]
        for distance in distances:
            bufferDistance = locale.atof(str(distance))           
            currentBuffer = feature._arc_object.bufferex(bufferDistance, unitsCode, geodesic)            
            if previousBuffer is not None:
                ring = currentBuffer.difference(previousBuffer)
                outcursor.insertRow([ring, fid, bufferDistance])
            else:
                outcursor.insertRow([currentBuffer, fid, bufferDistance])

            previousBuffer = currentBuffer

    del incursor
    del outcursor   
    

    if calcField:
        #calcAreaField(out_features, units, gcscode)
        startTime = time.time()        
        arcpy.JoinField_management(out_features, origidfieldname, in_features, oidfieldname)
        analysisutils.AddTimerMessage(startTime, "JoinField")
    analysisutils.AddTimerMessage(beginTime, "RingBuffer")

# End ringBuffer

