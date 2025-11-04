# coding: utf-8
"""
Tool Name:  Standard Distance
Source Name: StandardDistance.py
Version: ArcGIS 10.1
Author: ESRI

This tool measures the degree to which features are concentrated or 
dispersed around the mean center in an input feature class.
May be based on an optional weight (to get the
standard distance of businesses weighted by employees, for example) or
may optionally be grouped into cases.  The standard distance is a useful
statistic; it provides a single summary measure of feature distributions
around any given point (similar to the way a standard deviation measures
the distribution of data values around the statistical mean).
"""

################### Imports ########################
import os as OS
import sys as SYS
import collections as COLL
import numpy as NUM
import math as MATH
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import locale as LOCALE
import arcgisscripting as ARC 
LOCALE.setlocale(LOCALE.LC_ALL, '')

circleDict = {"1_STANDARD_DEVIATION": 1.0, 
              "2_STANDARD_DEVIATIONS": 2.0,
              "3_STANDARD_DEVIATIONS": 3.0}
              
################ Layers #################
layers = ["StandardDistance", "StandardDistance_3D"]

################ Output Field Names #################
sdFieldNames = ["CenterX", "CenterY", "StdDist"]

circTypes = {"1_STANDARD_DEVIATION":1, "2_STANDARD_DEVIATIONS":2,
                          "3_STANDARD_DEVIATIONS":3}

#### Threshold for 2D cases with Z enabled  #########
zThresholdSemi3DCases = 0.001

def execute(parameters, messages):

    inputFC = UTILS.getTextParameter(0, parameters)
    outputFC = UTILS.getTextParameter(1, parameters)
    stdDeviations = UTILS.getTextParameter(2, parameters).upper().replace(" ", "_")  
    weightField = UTILS.getTextParameter(3, parameters, fieldName = True)
    caseField = UTILS.getTextParameter(4, parameters, fieldName = True)           

    fieldList = []
    if weightField:
        fieldList.append(weightField)
    if caseField:
        fieldList.append(caseField)

    stdDeviations = circTypes[stdDeviations]

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                useChordal = False)

    #### Populate SSDO with Data ####
    ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 2, 
                    requireGeometry = ssdo.complexFeature) 

    #### Run Analysis ####
    sd = StandardDistance(ssdo, weightField = weightField,
                          caseField = caseField, 
                          stdDeviations = stdDeviations)
    
    #### Create Output ####
    sd.createOutput(outputFC, parameters)

class StandardDistance(object):
    """This tool identifies the geographic center (or the center of
    concentration) for a set of features and calculates a circle with a
    based on the given standard deviations. 

    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightField {str, None}: name of weight field
    caseField {str, None} name of case field
    stdDeviations {float, 1.0}: number of standard devs around center

    ATTRIBUTES:
    meanCenter (dict): [case field value] = mean center (1)
    sd (dict): [case field value] = standard distance (1)
    badCases (list): list of cases that were unsuccessful.
    ssdo (class): instance of SSDataObject
    uniqueCases (array): sorted list of all cases for print/output

    METHODS:
    createOutput: creates a feature class with standard distances.
    report: reports results as a printed message or to a file

    NOTES:
    (1)  The key for the mean center dicts is "ALL" if no case field is
         provided
    """

    def __init__(self, ssdo, weightField = None, caseField = None, 
                 stdDeviations = 1.0):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords= self.ssdo.zCoords
        self.caseField = caseField
        self.applyZ = self.ssdo.zFlag != "DISABLED"
        self.isGCS = self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"

        if self.ssdo.hasZ and self.applyZ:

            evalDim = 3
            minimumPoints = 3
            zData = self.zCoords

            if not ssdo.distanceInfo.xyzUnitsEqual:
                ARCPY.AddIDMessage("ERROR", 110083)
                raise SystemExit()
        else:
            evalDim = 2
            minimumPoints = 2

        #### Use 3D in PRO ####
        self.isPRO = UTILS.isPRO()
        if not self.isPRO:
            evalDim = 2
            
        #### Check Coordinates ####
        if (self.ssdo.spatialRef.type == 'Geographic' and evalDim == 3):
            ARCPY.AddIDMessage("ERROR", 1022)
            raise SystemExit()

        #### Honoring Z Environment ####
        self.addZthreshold= False;
        if self.ssdo.defaultZ != 0.0 and evalDim == 2 and self.isPRO:
            evalDim = 3
            minimumPoints = 2
            zData = NUM.ones((self.ssdo.numObs,)) *  self.ssdo.defaultZ
            self.addZthreshold = True;


        #### Verify Weights ####
        if weightField:
            self.weights = self.ssdo.fields[weightField].returnDouble()

            #### Report Negative Weights ####
            lessThanZero = NUM.where(self.weights < 0.0)
            if len(lessThanZero[0]):
                self.weights[lessThanZero] = 0.0
                ARCPY.AddIDMessage("Warning", 941)

            #### Verify Weight Sum ####
            self.weightSum = self.weights.sum()
            if not self.weightSum > 0.0: 
                ARCPY.AddIDMessage("ERROR", 898)
                raise SystemExit()
        else:
            self.weights = NUM.ones((self.ssdo.numObs,))

        #### Set Case Field ####
        if caseField:
            caseType = ssdo.allFields[caseField].type.upper()
            self.caseIsString = caseType == "STRING"
            self.caseVals = self.ssdo.fields[caseField].data
            cases = NUM.unique(self.caseVals)
            if self.caseIsString:
                self.uniqueCases = cases[NUM.where(cases != "")]
            else:
                self.uniqueCases = cases
        else:
            self.caseIsString = False
            self.caseVals = NUM.ones((self.ssdo.numObs, ), int)
            self.uniqueCases = [1]

        #### Set Result Dict ####
        meanCenter = COLL.defaultdict(NUM.array)
        sd = COLL.defaultdict(float)

        #### Keep Track of Bad Cases ####
        badCases = []
        badCaseInd = []

        #### Angular mean ####
        self.gcsAngmean={}

        #### Calculate Mean Center and Standard Distance ####
        for ind, case in enumerate(self.uniqueCases):
            indices = NUM.where(self.caseVals == case)
            numFeatures = len(indices[0])
            xy = self.xyCoords[indices]
            w = self.weights[indices]
            w.shape = numFeatures, 1
            weightSum = w.sum()

            if self.isGCS:
                meanAz = UTILS.meanCenterAngular(xy.T[0])
                self.gcsAngmean[case] = meanAz
                xTemp = xy.T[0] - meanAz
                xy.T[0] = UTILS.normalize(xTemp)

            if (weightSum != 0.0) and (numFeatures >  minimumPoints):
                xyz = NUM.zeros((xy.shape[0], xy.shape[1]+1))
                xyz[:,:-1] = xy
                if (evalDim == 3):
                    z = zData[indices]
                    xyz[:,2] = z

                xyWeighted = w * xyz

                #### Mean Center ####
                centers = xyWeighted.sum(0) / weightSum
                meanCenter[case] = centers
                devXY = xyz - centers
                sigXY = (w * devXY**2.0).sum(0) / weightSum 
                sdVal = (MATH.sqrt(sigXY.sum())) * stdDeviations

                sd[case] = sdVal
            else:
                badCases.append(case)
                badCaseInd.append(ind)
                
        #### Report Bad Cases ####
        nCases = len(self.uniqueCases)
        nBadCases = len(badCases) 
        badCases.sort()
        if nBadCases:
            self.uniqueCases = NUM.delete(self.uniqueCases, badCaseInd)
            cBool = self.caseIsString
            if not self.caseIsString:
                badCases = [UTILS.caseValue2Print(i, cBool) for i in badCases]
            ERROR.reportBadCases(nCases, nBadCases, badCases, 
                                 label = caseField)   
        
        #### Set Attributes ####
        self.meanCenter = meanCenter
        self.sd = sd
        self.badCases = badCases
        self.caseField = caseField
        self.stdDeviations = stdDeviations
        self.weightField = weightField
        self.evalDim =evalDim

    def report(self, fileName = None):
        """Reports the Standard Distance results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results
        """

        header = ARCPY.GetIDMessage(84224)
        if (self.evalDim == 2):
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84211),
                       ARCPY.GetIDMessage(84212), ARCPY.GetIDMessage(84225),
                       ARCPY.GetIDMessage(84226)]
        else:
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84211),
                       ARCPY.GetIDMessage(84212), ARCPY.GetIDMessage(84675),
                       ARCPY.GetIDMessage(84225), ARCPY.GetIDMessage(84226)]

        results = [columns]
        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)
            if self.evalDim == 2:
                meanX, meanY = self.meanCenter[case]
                rowResult = [ strCase, LOCALE.format_string("%0.6f", meanX),
                              LOCALE.format_string("%0.6f", meanY),
                              LOCALE.format_string("%0.6f", self.sd[case]),
                              LOCALE.format_string("%0.1f", self.stdDeviations) ]
                results.append(rowResult)
            else:
                meanX, meanY, meanZ = self.meanCenter[case]
                rowResult = [ strCase, LOCALE.format_string("%0.6f", meanX),
                              LOCALE.format_string("%0.6f", meanY),
                              LOCALE.format_string("%0.6f", meanZ),
                              LOCALE.format_string("%0.6f", self.sd[case]),
                              LOCALE.format_string("%0.1f", self.stdDeviations) ]
                results.append(rowResult)


        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def createOutput(self, outputFC, parameters = None):
        """Creates an Output Feature Class with the Standard Distances.

        INPUTS:
        outputFC (str): path to the output feature class
        """

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        caseField = self.caseField

        #### Increase Extent if not Projected ####
        if ssdo.spatialRefType != "Projected":
            sdValues = self.sd.values()
            if len(sdValues):
                maxRadius = max(sdValues)
                largerExtent = UTILS.increaseExtentByConstant(ssdo.extent, 
                                                    constant = maxRadius)
                largerExtent = [ LOCALE.str(i) for i in largerExtent ]
                ARCPY.env.XYDomain = " ".join(largerExtent)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)
        if self.evalDim == 2:
            ssdo.newFieldTypeChecker.createFeatureClass(outputFC, "POLYGON", ssdo.mFlag, 
                                                        ssdo.zFlag, ssdo.spatialRefString)

            #### Add Fields to Output FC ####
            dataFieldNames = UTILS.getFieldNames(sdFieldNames, outPath)
            shapeFieldNames = ["SHAPE@"]
            for fieldName in dataFieldNames:
                UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")

            if caseField:
                fcCaseField = ssdo.allFields[caseField]
                validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
                caseType = UTILS.convertType[fcCaseField.type]

                if caseType == "TEXT" and fcCaseField.length > 255:
                    UTILS.addEmptyField(outputFC, validCaseName, caseType, length = fcCaseField.length)
                else:
                    UTILS.addEmptyField(outputFC, validCaseName, caseType)

                dataFieldNames.append(validCaseName)
                if UTILS.migrateDatePrecisionField(fcCaseField, ssdo.newFieldTypeChecker.outFlags):
                    DM.MigrateDateFieldToHighPrecision(outputFC, date_fields = validCaseName)

            #### Write Output ####
            badCaseRadians = []
            allFieldNames = shapeFieldNames + dataFieldNames
            rows = DA.InsertCursor(outputFC, allFieldNames)
            for ind, case in enumerate(self.uniqueCases):

                #### Get Results ####
                xVal, yVal, ZVal = self.meanCenter[case]
                radius = self.sd[case]

                #### Create Empty Polygon Geomretry ####
                poly = ARCPY.Array()

                #### Check for Valid Radius ####
                radiusZero = UTILS.compareFloat(0.0, radius, rTol = .0000001)
                radiusNan = NUM.isnan(radius)
                radiusBool = radiusZero + radiusNan
                if radiusBool:
                    badRadian = 6
                    badCase = UTILS.caseValue2Print(case, self.caseIsString)
                    badCaseRadians.append(badCase)
                else:
                    badRadian = 0

                    #### Calculate a Point For Each ####
                    #### Degree in Circle Polygon ####
                    xs = []
                    ys = []
                    goodInfo = True
                    for degree in NUM.arange(0, 360):  
                        try:
                            radians = NUM.pi / 180.0 * degree
                            pntX = xVal + (radius * NUM.cos(radians))
                            pntY = yVal + (radius * NUM.sin(radians))
                            xs.append(pntX)
                            ys.append(pntY)
                        except:
                            badRadian += 1
                            if badRadian == 6:
                                badCase = UTILS.caseValue2Print(case, 
                                                   self.caseIsString)
                                badCaseRadians.append(badCase)
                                goodInfo = False
                                break

                    if goodInfo:
                        if self.isGCS:
                            az = self.gcsAngmean[case]
                            xs = [ v+az for v in xs]
                            xs = UTILS.getAzmth(NUM.array(xs))
                        poly = ARCPY.Array([ARCPY.Point(pntX, pntY, ssdo.defaultZ) for pntX, pntY in zip(xs,ys)])

                if badRadian < 6:
                    #### Create and Populate New Feature ####
                    poly = ARCPY.Polygon(poly, None, True)
                    rowResult = [poly, xVal, yVal, radius]

                    if caseField:
                        caseValue = self.uniqueCases.item(ind)
                        rowResult.append(caseValue)
                    try:
                        rows.insertRow(rowResult)
                    except:
                        break


            #### Report Bad Cases Due to Geometry (coincident pts) ####
            nBadRadians = len(badCaseRadians)
            if nBadRadians:
                if caseField:
                    badCaseRadians = " ".join(badCaseRadians)
                    ARCPY.AddIDMessage("WARNING", 1011, caseField,
                                    badCaseRadians)
                else:
                    ARCPY.AddIDMessage("ERROR", 978)
                    raise SystemExit()

            #### Return Extent to Normal if not Projected ####
            if ssdo.spatialRefType != "Projected":
                ARCPY.env.XYDomain = None

            #### Clean Up ####
            del rows

        else:
            self.createSphere(outputFC)

        #### Set Attribute ####
        self.outputFC = outputFC

        #### Set the Default Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters
        
        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            if self.isPRO:
                if self.evalDim == 3:
                    renderLayerFile = layers[1] + '.lyrx'
                else:
                    renderLayerFile = layers[0] + '.lyr'
            else:
                if self.evalDim == 3:
                    renderLayerFile = layers[1] + '.lyr'
                else:
                    renderLayerFile = layers[0] + '.lyr'
                
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

    def increaseDomainProjection(self):
        """ Increase Domain Extent """

        points = []
        for ind, case in enumerate(self.uniqueCases):
            radiusZero = UTILS.compareFloat(0.0, self.sd[case], rTol = .0000001)
            radiusNan = NUM.isnan(self.sd[case])
            radiusBool =radiusZero + radiusNan
            if not radiusBool:
                meanX, meanY, meanZ = self.meanCenter[case]
                radius = self.sd[case]
                zRadius = radius
                #### Add Threshold to Honor Z Environment ####
                if self.addZthreshold:
                    zRadius = zThresholdSemi3DCases

                points.append([meanX - radius, meanY - radius, meanZ - zRadius])
                points.append([meanX + radius, meanY + radius, meanZ + zRadius])

        if not len(points):
            return False

        self.initialDomain = UTILS.getXYZProjectionDomain(self.ssdo.spatialRef)
        nPoints = NUM.array(points)
        projectionChange = UTILS.extentDomain3D(self.ssdo.spatialRef,
                                                nPoints, self.initialDomain)
        return projectionChange



    def createSphere(self, outputFC, resolutionSphere = 10):
        """Create spheres  using  data from a std distance instance
    
        INPUT:
        outputFC {string}: output feature class
        stdDistInfo  {obj}: StandardDistance instance
        resolutionSphere {int}: resolution sphere
        """

        isGDB = not UTILS.isShapeFile(outputFC)
        badCaseRadians = []
        outPath, outName = OS.path.split(outputFC)

        self.projDomainChanged = False
        ### Check Geodatabase Domain And Update Projection From Environment ####
        if isGDB:
            xyzEnvironmentDomain = UTILS.getDomainGeodatabase()
            ### Increase Domain ###
            if self.increaseDomainProjection():
                xyzProjectionDomain = UTILS.getXYZProjectionDomain(self.ssdo.spatialRef)
                self.projDomainChanged = not (self.initialDomain == xyzProjectionDomain)

        #### Check M Enabled ####
        mFlag = 0
        if (self.ssdo.mFlag == "ENABLED"):
            mFlag = 1

        try:
            ##### Create a Sphere Instance ####
            sphere = ARC._ss.Ellipsoid(outputFC, self.ssdo.spatialRef, mFlag, 1)
        except:
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()

        radiusList = {}
 
        for ind, case in enumerate(self.uniqueCases):
            radiusZero = UTILS.compareFloat(0.0, self.sd[case], rTol = .0000001)
            radiusNan = NUM.isnan(self.sd[case])
            radiusBool = radiusZero + radiusNan
            if radiusBool:
                badCase = UTILS.caseValue2Print(case, self.caseIsString)
                badCaseRadians.append(badCase)
                continue

            #### Get Each Case Data ####
            meanX, meanY, meanZ = self.meanCenter[case]
            radius = self.sd[case]
            radiusList[ind] = radius
            zRadius = radius
       
            #### Add Threshold to Honor Z Environment ####
            if self.addZthreshold:
                zRadius = zThresholdSemi3DCases

            #### Create a Cloud of Points Representing Standard Sphere ####
            datx = UTILS.createCloudEllipsoid(radius, radius, zRadius, resolutionSphere,
                                                             meanX, meanY, meanZ)
            #### Return to GCS origin ####
            if self.isGCS:
                datx.T[0] += self.gcsAngmean[case]
                datx.T[0] = UTILS.getAzmth(datx.T[0])

            points = NUM.round(datx, 12)

            #### Dateline Correction ####
            if self.isGCS:
                meanX = self.gcsAngmean[case]

            sphereData = NUM.array([meanX, meanY, meanZ, radius])
            sphere.add_ellipsoid_points( NUM.asfarray(points, dtype = NUM.float64), sphereData, ind)

        del sphere

        #### Report Bad Cases Due to Geometry (coincident pts) ####
        nBadRadians = len(badCaseRadians)
        if nBadRadians:
            if self.caseField:
                badCaseRadians = " ".join(badCaseRadians)
                ARCPY.AddIDMessage("WARNING", 1011, self.caseField, badCaseRadians)
            else:
                ARCPY.AddIDMessage("ERROR", 978)
                raise SystemExit()

        if self.projDomainChanged:
            ARCPY.AddIDMessage("WARNING", 110082)


        #### Introduce Information of Each Case ####
        if self.caseField:
            fcCaseField = self.ssdo.allFields[self.caseField]
            validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
            caseType = UTILS.convertType[fcCaseField.type]

            if caseType == "TEXT" and fcCaseField.length > 255:
                UTILS.addEmptyField(outputFC, validCaseName, caseType, length = fcCaseField.length)
            else:
                UTILS.addEmptyField(outputFC, validCaseName, caseType)

            if UTILS.migrateDatePrecisionField(fcCaseField, self.ssdo.newFieldTypeChecker.outFlags):
                DM.MigrateDateFieldToHighPrecision(outputFC, date_fields = validCaseName)
            with ARCPY.da.UpdateCursor(outputFC,["CaseId",validCaseName]) as cursor:
                for row in cursor:
                     caseValue = self.uniqueCases.item(row[0])
                     row[1] = caseValue
                     cursor.updateRow(row)

        ## Remove Field CaseId ####
        ARCPY.DeleteField_management(outputFC,["CaseId"])

