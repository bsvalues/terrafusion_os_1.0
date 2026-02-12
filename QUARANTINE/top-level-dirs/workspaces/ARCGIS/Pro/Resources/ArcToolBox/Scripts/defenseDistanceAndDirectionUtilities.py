'''
==================================================
Copyright 2016-2019 Esri
==================================================
defenseDistanceAndDirectionUtilities.py
--------------------------------------------------
requirements: ArcGIS Pro
author: ArcGIS Solutions
company: Esri
==================================================
description: Utilities to create range ring features
==================================================
'''
import os
import sys

import arcpy

try:
    from . import defenseHelper
except ImportError:
    import defenseHelper

acceptableDistanceUnits = ['METERS', 'KILOMETERS',
                           'MILES', 'NAUTICAL_MILES',
                           'FEET', 'US_SURVEY_FEET']

srDefault = arcpy.SpatialReference(54032) # World_Azimuthal_Equidistant

def rangeRingsFromList(centerFC, rangeList, distanceUnits, numRadials, outputRingFeatures, 
                       outputRadialFeatures, sr):
    ''' Make range ring features from a center, and list of distances '''
    try:

        if (centerFC is None) or (rangeList is None) or (len(rangeList) == 0) \
            or (outputRingFeatures == None) :
            arcpy.AddIDMessage("ERROR", 200256) # Bad parameters supplied to rangeRingsFromList
            return [None, None]

        if not sr:
            sr = srDefault
            msg = r"Using default spatial reference: " + str(srDefault.name)
            arcpy.AddIDMessage("WARNING", 200254, str(srDefault.name)) # Using default spatial reference:
            # print(msg)

        rm = RingMaker(centerFC, rangeList, distanceUnits, sr)

        # Create Rings...
        numCenterPoints = arcpy.GetCount_management(centerFC).getOutput(0)

        if int(numCenterPoints) < 1:
            arcpy.AddIDMessage("ERROR", 200257) # At least one input center point is required
            return [None, None]

        numRingsPerCenter = len(rangeList)
        totalNumRings = int(numCenterPoints) * int(numRingsPerCenter)
        totalNumRadials = int(numCenterPoints) * int(numRadials)
        arcpy.AddMessage(arcpy.GetIDMessage(200252).format(str(totalNumRings), str(numRingsPerCenter), str(numCenterPoints))) # Making rings " + str(totalNumRings) + " (" + str(numRingsPerCenter) + " for " + str(numCenterPoints) + " centers)...
        rm.makeRingsFromDistances()
        outRings = rm.saveRingsAsFeatures(outputRingFeatures)

        # Create Radials...
        arcpy.AddMessage(arcpy.GetIDMessage(200253).format(str(totalNumRadials), str(numRadials), str(numCenterPoints))) # Making radials " + str(totalNumRadials) + " (" + str(numRadials) + " for " + str(numCenterPoints) + " centers)...
        if (outputRadialFeatures is not None) and (numRadials > 0):
            rm.makeRadials(numRadials)
            outRadials = rm.saveRadialsAsFeatures(outputRadialFeatures)
        else:
            outRadials = None
            if (numRadials < 0):
                arcpy.AddIDMessage("ERROR", 200255) # Number of radials must be positive

        return [outRings, outRadials]

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
        return None

def rangeRingsFromMinMax(centerFC, rangeMin, rangeMax, distanceUnits, numRadials, outputRingFeatures, outputRadialFeatures, sr):
    ''' Make range ring features from only two distances, a minimum and a maximum '''
    if (rangeMin < 0.0) or (rangeMax <= 0.0) or (rangeMin > rangeMax):
        arcpy.AddIDMessage("ERROR", 200258) # Range parameters are not valid
        return [None, None]

    rangeList = [min(rangeMin, rangeMax), max(rangeMin, rangeMax)]
    return rangeRingsFromList(centerFC, rangeList, distanceUnits, numRadials, outputRingFeatures, outputRadialFeatures, sr)

def rangeRingsFromInterval(centerFC, numRings, distBetween, distanceUnits, numRadials, outputRingFeatures, outputRadialFeatures, sr):

    ''' Classic range rings from number of rings, and distance between rings  '''
    if distBetween <= 0.0:
        arcpy.AddIDMessage("ERROR", 200259) # Distance between rings must be > 0

        return [None, None]

    rangeList = [x * distBetween for x in range(1, numRings + 1)]
    return rangeRingsFromList(centerFC, rangeList, distanceUnits, numRadials, outputRingFeatures, outputRadialFeatures, sr)

class RingMaker:
    '''
    Core class for making range rings.
    '''

    def __init__(self, center, inputRangeList, distanceUnits, sr):
        ''' initialize rings '''

        self.deleteme = []

        # project center to sr, and keep it as a list of PointGeometries object
        originalGeom = arcpy.CopyFeatures_management(center, arcpy.Geometry())
        newGeom = []
        for g in originalGeom:
            newGeom.append(g.projectAs(sr))
        self.center = newGeom

        self.rangeList = self._sortList(inputRangeList)
        if distanceUnits == None or distanceUnits == "#" or distanceUnits == "":
            self.distanceUnits = sr.linearUnitName
        else:
            self.distanceUnits = distanceUnits

        if not sr == None or not sr == "#" or not sr == "":
            self.sr = sr
        else:
            self.sr = srDefault

        self.ringFeatures = None
        self.radialFeatures = None
        self.ringCount = len(self.rangeList)
        self.ringMin = min(self.rangeList)
        self.ringMax = max(self.rangeList)

    def __del__(self):
        ''' clean up temp datasets '''
        defenseHelper.removeDatasetList(self.deleteme)

    def _sortList(self, listToSort):
        ''' sort list of distances '''
        if len(listToSort) == 0:
            print("Empty distance list")
            return None
        return sorted(listToSort)

    def _addFieldsToTable(self, tab, fields):
        ''' add fields from dictionary: {'<fieldname>':'type'} '''
        for f in list(fields.keys()):
            arcpy.AddField_management(tab, f, fields[f])
        return tab

    def _makeTempTable(self, name, fields):
        ''' make a temporary, memory table '''
        tab = arcpy.CreateUniqueName(name, "memory")
        arcpy.CreateTable_management(os.path.dirname(tab),
                                     os.path.basename(tab))
        self.deleteme.append(tab)
        if fields:
            newtab = self._addFieldsToTable(tab, fields)
        else:
            print("no fields to add")
            newtab = tab
        return newtab

    def makeRingsFromDistances(self):
        ''' make geodesic rings from distance list '''
        # make a table for TableToEllipse
        fields = {'x':'DOUBLE', 'y':'DOUBLE', 'Range':'DOUBLE'}
        inTable = self._makeTempTable("ringTable", fields)
        self.deleteme.append(inTable)
        with arcpy.da.InsertCursor(inTable, ['x', 'y', 'Range']) as cursor:            
            for i in self.center: # Note: self.center is a list of PointGeometry
                pt = i.firstPoint
                for r in self.rangeList:
                    cursor.insertRow([pt.X, pt.Y, r * 2])

        outFeatures = arcpy.CreateUniqueName("outRings", "memory")
        self.deleteme.append(outFeatures)
        arcpy.TableToEllipse_management(inTable, outFeatures,
                                        'x', 'y', 'Range', 'Range',
                                        self.distanceUnits,
                                        '#', '#', '#', self.sr)

        self.ringFeatures = outFeatures
        arcpy.CalculateField_management(outFeatures, "Range", '!Range! / 2.0', 'PYTHON_9.3')

        return outFeatures

    def makeRadials(self, numRadials):
        ''' make geodesic radials from number of radials '''
        segmentAngle = 360.0/float(numRadials)
        segmentAngleList = []
        a = 0.0
        while a < 360.0:
            segmentAngleList.append(a)
            a += segmentAngle

        fields = {'x':'DOUBLE', 'y':'DOUBLE', 'Bearing':'DOUBLE', 'Range':'DOUBLE'}
        tab = self._makeTempTable("radTable", fields)
        self.deleteme.append(tab)
        with arcpy.da.InsertCursor(tab, ['x', 'y', 'Bearing', 'Range']) as cursor:
            for i in self.center:
                pt = i.firstPoint
                for r in segmentAngleList:
                    cursor.insertRow([pt.X, pt.Y, r, self.ringMax])
        outRadialFeatures = arcpy.CreateUniqueName("outRadials", "memory")
        self.deleteme.append(outRadialFeatures)
        arcpy.BearingDistanceToLine_management(tab, outRadialFeatures, 'x', 'y',
                                               'Range', self.distanceUnits, 'Bearing', "DEGREES",
                                               "GEODESIC", "#", self.sr)
        self.radialFeatures = outRadialFeatures

        return outRadialFeatures

    def saveRingsAsFeatures(self, outputFeatureClass):
        ''' save rings to featureclass '''
        arcpy.CopyFeatures_management(self.ringFeatures, outputFeatureClass)
        return outputFeatureClass

    def saveRadialsAsFeatures(self, outputFeatureClass):
        ''' save radials to featureclass '''
        arcpy.CopyFeatures_management(self.radialFeatures, outputFeatureClass)
        return outputFeatureClass

def rangeRingsFromFeatures(
                inputFeatures,
                outputRangeRings,
                inputMinimumRangeField,
                inputMaximumRangeField,
                inputNumberOfRingsField,
                inputDistanceBetweenField,
                distanceUnit,
                isMinMax):
    try:

        # START: Initial Error CHECKS 
        if not arcpy.Exists(inputFeatures):
            arcpy.AddIDMessage("ERROR", 200830, str(inputFeatures)) # Dataset does not exist:
            return

        inputPointsCount = int(arcpy.GetCount_management(inputFeatures).getOutput(0))
        if inputPointsCount == 0 :
            arcpy.AddIDMessage("ERROR", 200827, str(inputFeatures)) # No features in input feature set
            return

        # Check required input fields exist
        checkFields = [field.name for field in arcpy.ListFields(inputFeatures)]
        if isMinMax :
            if not ((inputMinimumRangeField in checkFields) and (inputMaximumRangeField in checkFields)):
                arcpy.AddIDMessage("ERROR", 11) # Required fields missing
                return
        else: 
            if not ((inputNumberOfRingsField in checkFields) and (inputDistanceBetweenField in checkFields)):
                arcpy.AddIDMessage("ERROR", 11) # Required fields missing
                return
        # END CHECKS

        deleteme = [] 
        scratchWS = 'memory'

        featureSR = arcpy.Describe(inputFeatures).spatialReference
        if featureSR is None:
            featureSR = srDefault

        rangeTable = arcpy.CreateUniqueName("rangeTable", scratchWS)
        deleteme.append(rangeTable)
        arcpy.CreateTable_management(os.path.dirname(rangeTable),
                                     os.path.basename(rangeTable))
        rangeFields = {'x':'DOUBLE', 'y':'DOUBLE', 'Range':'DOUBLE'}
        for f in list(rangeFields.keys()):
            arcpy.AddField_management(rangeTable, f, rangeFields[f])

        if isMinMax:
            inFields = ['SHAPE@XY', inputMinimumRangeField, inputMaximumRangeField]
        else:
            inFields = ['SHAPE@XY', inputNumberOfRingsField, inputDistanceBetweenField]

        outFields = ['x', 'y', 'Range']
        nullValuesSkipped = False

        # get the attributes from the input points and copy to output 
        with arcpy.da.SearchCursor(inputFeatures, inFields) as inCursor, \
             arcpy.da.InsertCursor(rangeTable, outFields) as outCursor:
            for row in inCursor:

                if row[0] is None:
                    nullValuesSkipped = True
                    continue

                centerX  = row[0][0]
                centerY  = row[0][1]
                range1   = row[1]
                range2   = row[2]

                if centerX is None or centerY is None or range1 is None or range2 is None:
                    nullValuesSkipped = True
                    continue

                if (range1 < 0) or (range2 < 0) :
                    arcpy.AddWarning(arcpy.GetIDMessage(963) + 
                                 ', ' + str(range1) + ', ' + str(range2))
                    continue

                # Now create range ring table from these values
                if isMinMax: # Min, Max Rings
                    outCursor.insertRow([centerX, centerY, range1 * 2])
                    outCursor.insertRow([centerX, centerY, range2 * 2])
                else: # From Number of Rings, Intervals
                    numberOfRings   = range1 # TODO: may need to check numberOfRings is not excessive
                    distanceBetween = range2
                    totalRange = distanceBetween
                    for i in range(0, numberOfRings):
                        outCursor.insertRow([centerX, centerY, totalRange * 2])
                        totalRange += distanceBetween

        if nullValuesSkipped :
            arcpy.AddIDMessage("WARNING", 3108) # Null fields skipped

        outFeatures = arcpy.CreateUniqueName("outRings", scratchWS)
        deleteme.append(outFeatures)
        arcpy.TableToEllipse_management(rangeTable, outFeatures,
                                        'x', 'y', 'Range', 'Range',
                                        distanceUnit,
                                        '#', '#', '#', featureSR)

        arcpy.CalculateField_management(outFeatures, "Range", '!Range! / 2.0', 'PYTHON_9.3')
        arcpy.CopyFeatures_management(outFeatures, outputRangeRings)

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def rangeRadialsFromFeatures(
                inputFeatures,
                outputRadialFeatures,
                inputNumberOfRadialsField,
                inputMinimumRangeField,
                inputMaximumRangeField,
                inputNumberOfRingsField,
                inputDistanceBetweenField,
                distanceUnit,
                isMinMax):
    try:

        # Check required input fields exist
        checkFields = [field.name for field in arcpy.ListFields(inputFeatures)]
        if not (inputNumberOfRadialsField in checkFields):
            arcpy.AddIDMessage("ERROR", 11) # Required fields missing
            return

        deleteme = [] 
        scratchWS = 'memory'

        featureSR = arcpy.Describe(inputFeatures).spatialReference
        if featureSR is None:
            featureSR = srDefault

        radialTable = arcpy.CreateUniqueName("radialTable", scratchWS)
        deleteme.append(radialTable)
        arcpy.CreateTable_management(os.path.dirname(radialTable),
                                     os.path.basename(radialTable))
        radialFields = {'x':'DOUBLE', 'y':'DOUBLE', 'Bearing':'DOUBLE', 'Range':'DOUBLE'}
        for f in list(radialFields.keys()):
            arcpy.AddField_management(radialTable, f, radialFields[f])

        if isMinMax:
            inFields = ['SHAPE@XY', inputNumberOfRadialsField, inputMinimumRangeField, inputMaximumRangeField]
        else:
            inFields = ['SHAPE@XY', inputNumberOfRadialsField, inputNumberOfRingsField, inputDistanceBetweenField]

        outFields = ['x', 'y', 'Bearing', 'Range']
        nullValuesSkipped = False

        # get the attributes from the input points and copy to output 
        with arcpy.da.SearchCursor(inputFeatures, inFields) as inCursor, \
             arcpy.da.InsertCursor(radialTable, outFields) as outCursor:
            for row in inCursor:

                if row[0] is None:
                    nullValuesSkipped = True
                    continue

                centerX  = row[0][0]
                centerY  = row[0][1]
                numberOfRadials = row[1]
                range1   = row[2]
                range2   = row[3]

                if centerX is None or centerY is None or numberOfRadials is None or \
                    range1 is None or range2 is None:
                    nullValuesSkipped = True
                    continue

                if (range1 < 0) or (range2 < 0) or (numberOfRadials < 1):
                    arcpy.AddWarning(arcpy.GetIDMessage(963) + 
                                 ', ' + str(range1) + ', ' + str(range2) + 
                                 ', ' + str(numberOfRadials))
                    continue

                if isMinMax:
                    ringMax = max(range1, range2)
                else: 
                    ringMax = range1 * range2 # interval * number of rings

                ''' make geodesic radials from number of radials '''
                segmentAngle = 360.0/float(numberOfRadials)
                segmentAngleList = []
                a = 0.0
                while a < 360.0:
                    segmentAngleList.append(a)
                    a += segmentAngle

                for r in segmentAngleList:
                    outCursor.insertRow([centerX, centerY, r, ringMax])

        outRadialFeaturesBDTL = arcpy.CreateUniqueName("outRadials", scratchWS)
        deleteme.append(outRadialFeaturesBDTL)
        arcpy.BearingDistanceToLine_management(radialTable, outRadialFeaturesBDTL, 'x', 'y',
                                               'Range', distanceUnit, 'Bearing', "DEGREES",
                                               "GEODESIC", "#", featureSR)

        arcpy.CopyFeatures_management(outRadialFeaturesBDTL, outputRadialFeatures)

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        pass
        # defenseHelper.removeDatasetList(deleteme)
