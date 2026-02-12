import os
import arcpy

##infeatures = arcpy.GetParameterAsText(0)
##linearunit = arcpy.GetParameterAsText(1).split(' ')
##outfeatures = arcpy.GetParameterAsText(2)
##maxDistance = arcpy.GetParameterAsText(3)


def getconversionfactor(splitUnits, maxDistanceUnits):
    factor = 1
    if splitUnits == "Meters":
        if maxDistanceUnits == "Kilometers":
            factor = 1000.0
        elif maxDistanceUnits == "Feet":
            factor = 0.3048
        elif maxDistanceUnits == "Yards":
            factor = 0.9144
        elif maxDistanceUnits == "Miles":
            factor = 1609.344
    elif splitUnits == "Kilometers":
        if maxDistanceUnits == "Meters":
            factor = 0.001
        elif maxDistanceUnits == "Feet":
            factor = 0.0003048
        elif maxDistanceUnits == "Yards":
            factor =  0.0009144
        elif maxDistanceUnits == "Miles":
            factor = 1.609344
    elif splitUnits == "Feet":
        if maxDistanceUnits == "Meters":
            factor = 3.28084
        elif maxDistanceUnits == "Kilometers":
            factor = 3280.8399
        elif maxDistanceUnits == "Yards":
            factor = 3.0
        elif maxDistanceUnits == "Miles":
            factor = 5280.0
    elif splitUnits == "Yards":
        if maxDistanceUnits == "Meters":
            factor = 1.093613
        elif maxDistanceUnits == "Kilometers":
            factor = 1093.6133
        elif maxDistanceUnits == "Feet":
            factor = .3333333
        elif maxDistanceUnits == "Miles":
            factor =  1760.0
    elif splitUnits == "Miles":
        if maxDistanceUnits == "Meters":
            factor =  .000621371
        elif maxDistanceUnits == "Kilometers":
            factor =  0.621371
        elif maxDistanceUnits == "Feet":
            factor = .000189394
        elif maxDistanceUnits == "Yards":
            factor = 0.000568182
    return factor


def splitLines(infeatures, splitDistance, splitUnits, outfeatures, maxDistance, maxDistanceUnits, maxOnly):

    outpath = os.path.dirname(outfeatures)
    outname = os.path.basename(outfeatures)

    if splitUnits != maxDistanceUnits and maxDistance > 0:
        factor = getconversionfactor(splitUnits, maxDistanceUnits)
        maxDistance = maxDistance * factor
        maxDistanceUnits = splitUnits

        arcpy.AddMessage("Max Distance: {} {}".format(maxDistance, factor))

    arcpy.env.overwriteOutput = True

    origidfieldname = "PourPtID" #"ORIG_FID"
    fromdistancefieldname = "FromDistance"
    aliasFrom = "From Distance {}".format(splitUnits)
    todistancefieldname = "ToDistance"
    aliasTo = "To Distance {}".format(splitUnits)
    totalLength = "TotalDistance"
    aliasTotal = "Total Distance {}".format(splitUnits)
    shapefieldname = "shape@"
    analysisLength = "AnalysisLength"
    aliasLength = "Length {}".format(splitUnits)

    descfeatures = arcpy.Describe(infeatures)
    sr = descfeatures.spatialReference

    arcpy.CreateFeatureclass_management(outpath, outname, "POLYLINE", "", "DISABLED", "DISABLED", sr)
    arcpy.AddField_management(outfeatures, origidfieldname, "LONG")
    if not maxOnly:
        arcpy.AddField_management(outfeatures, fromdistancefieldname, "DOUBLE", field_alias = aliasFrom)
        arcpy.AddField_management(outfeatures, todistancefieldname, "DOUBLE", field_alias = aliasTo)
        arcpy.AddField_management(outfeatures, totalLength, "DOUBLE", field_alias = aliasTotal)
        outfields = [shapefieldname, origidfieldname, fromdistancefieldname, todistancefieldname, totalLength, analysisLength]
    else:
        outfields = [shapefieldname, origidfieldname, analysisLength]
    arcpy.AddField_management(outfeatures, analysisLength, "DOUBLE", field_alias = aliasLength)

    oidfieldname = "PourPtID" # descfeatures.oidFieldName  #

    infields = [shapefieldname, origidfieldname]

    incursor = arcpy.da.SearchCursor(infeatures, infields)
    outcursor = arcpy.da.InsertCursor(outfeatures, outfields)

    for row in incursor:
        line = row[0]
        fid = row[1]
        length = line.getLength("PRESERVE_SHAPE", splitUnits)
        if maxDistance > 0 and maxDistance < length:
            maxlength = maxDistance
        else:
            maxlength = length

        fromDistance = 0
        toDistance = splitDistance
        while toDistance < maxlength:
            fromvalue = fromDistance/length
            tovalue = toDistance/length
            newline = line.segmentAlongLine(fromvalue, tovalue, True)
            outcursor.insertRow([newline, fid, fromDistance, toDistance, maxlength, splitDistance])
            fromDistance = fromDistance + splitDistance
            toDistance = toDistance + splitDistance

        fromvalue = fromDistance/length
        tovalue = maxlength/length
        newline = line.segmentAlongLine(fromvalue, tovalue, True)
        finalSplit =  maxlength - fromDistance
        if maxOnly:
            outcursor.insertRow([newline, fid, maxlength])
        else:
            finalSplit =  maxlength - fromDistance
            outcursor.insertRow([newline, fid, fromDistance, maxlength, maxlength, finalSplit])

    del incursor
    del outcursor

     # Join fields Description and DataResolution
    arcpy.management.JoinField(outfeatures, origidfieldname, infeatures, oidfieldname, ["Description", "DataResolution"])
