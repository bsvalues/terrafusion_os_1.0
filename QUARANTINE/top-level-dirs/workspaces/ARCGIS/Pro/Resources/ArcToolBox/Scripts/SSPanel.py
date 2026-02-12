################### Imports ########################
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.da as DA
import arcpy.management as DM
from attr import has
import ErrorUtils as ERROR
import netCDF4 as NET
import numpy as NUM
import os as OS
import re as RE
import SSDataObject as SSDO
import SSPanelObject as SSPO
import SSUtilities as UTILS
import SSCubeUtilities as CUTILS
import SSTimeUtilities as TUTILS
import Stats as STATS
import time as TIME
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')
import datetime as DT
import pandas as PANDAS

class SSPanel(object):
    """
    Space-Time Cube API for Fixed Locations (Polygons or Points)

    INPUT:
        ncFile (file): NetCDF4 file
        mode {char}:NetCDF4 file I/O mode,
                        Reference cube use 'r'
                        Existed cube in analytics use 'a'
                        new cube use 'w'

    METHOD:
        getVarDimension(): Get variable dimensions: 1 or 2 or 3
        obtainValues(): Obtain all data from a cube variable
        obtainMask(): Obtain mask array from cube
        obtainTimeSeries(): Obtain time series from a cube variable
        obtainTrend(): Obtain trend from a cube variable
        obtainVariableList(): Obtain variable list stored in cube
        obtainTimeBreaks(): Obtain time breaks in aggregation schema
        createVariable(): Create 3D/2D variable to cube
        createMaskVariable(): Create 2D mask variable to cube
        createEstimateVariable(): Create 3D bool variable identify estimated location
                                  (count is 0 but mask is True)
        initialize(): Initialize cube netcdf4 file based on aggregation result
        append(): Append new aggregation variable to cube
        close(): Close cube file

    ATTRIBUTES:
        existed (bool): Flag for retrieving attributes
        path (str): Recording netCDF4 file path
        dataset (obj): Connection object to netCDF4 file
        hasAlignment (bool): Flag for cube having Alignment attribute
        alignment (str): Aggregation alignment in cube
        timeUnit (str): Time unit in cube
        timeSize (int): Time size in cube
        cellUnit (str): Cell unit in cube, based on projection
        cellSize (float): Cell size in cube
        version (str): Recording production version
        refTime (dt Obj): Reference time in cube, None if no reference time
        spatialReference (obj): ArcPy Spatial Reference Object
        extent (obj): ArcPy Extent Object
        firstStartTime (dt Obj): Start time in cube first time bin
        firstEndTime (dt Obj): End time in cube first time bin
        lastStartTime (dt Obj): Start time in cube last time bin
        lastEndTime (dt Obj): End time in cube last time bin
        numTime (int): Number of time slices in cube
        numLocations (int): number of fixed locations
        numObs (int): numTime x numLocations

    """
    def __init__(self, ncFile, mode = 'r', panelObj = None):

        #### Set Path/Mode ####
        self.path = ncFile
        self.mode = mode.lower()
        self.existed = False
        self.checkedSpatialRef = False
        self.isPanel = True
        self.messageInfo = []

        #### Overwrite If Panel Object Provided ####
        if isinstance(panelObj, SSPO.SSPanelObject) or isinstance(panelObj, SSPO.SSMDRasterPanelObject):
            self.mode = 'w'
            self.__initialize(panelObj)

        else:
            #### Three File Accessing Mode ####
            if self.mode not in ['r', 'a', 'w']:
                raise SystemExit()
            else:
                #### For Existing NetCDF4 File, Check If Cube ####
                if self.mode in ['r', 'a']:
                    
                    #### Validate Cube ####
                    self.__validate()

                    #### Get Dimension Info ####
                    self.__getDimInfo()

                    #### Get Shape Info ####
                    self.__getShapeInfo()

                    #### Extract Time Info ####
                    self.__getTimeInfo()

                    #### Get Min/Max Extent ####
                    self.__setMinMaxExtent()

                    #### Get Core Attributes ####
                    self.x = self.obtainValues('x')
                    self.y = self.obtainValues('y')
                    self.t = self.obtainValues('time')
                    self.location = self.obtainValues('location_ID')
                    self.time = self.obtainValues('time_step_ID')
                    self.locationIDField = self.dataset.location_id_field
                    self.locationLabel = self.obtainValues(self.locationIDField)
                    key = 'PREDICTION_BINARY_MASK'
                    self.hasEstimation = key in self.dataset.variables.keys()

                    #### Rate Variables ####
                    self.getRateVariableInfo()

    def __initialize(self, panelObj):
        #### Check Path Exists ####
        outPath, outName = OS.path.split(self.path)
        if not OS.path.exists(outPath):
            ARCPY.AddIDMessage("ERROR", 436, outPath)
            raise SystemExit()

        #### Initialize Cube ####
        try:
            self.dataset = NET.Dataset(self.path, self.mode)
        except:
            #### Not Writeable ####
            ARCPY.AddIDMessage("ERROR", 210, self.path)
            raise SystemExit()

        #### Cube Dimension Info ####
        self.__setDimInfo(panelObj)

        #### Cube Shape Info ####
        self.__setShapeInfo(panelObj)

        #### Set Time Info ####
        self.__setTimeInfo(panelObj)

        #### Write Dimensions ####
        self.__createDimensions(panelObj)

        #### Write Global Attributes ####
        self.__createAttributes(panelObj)

        #### Get Min/Max Extent ####
        self.__setMinMaxExtent()

        #### Time ID Step ####
        timeIDList = NUM.arange(0, len(panelObj.timeBreaks) - 1)
        timeIDValue = NUM.repeat(timeIDList, self.numLocations)
        timeIDValue = timeIDValue.reshape(self.numTime, self.numLocations)
        self.createVariable('time_step_ID', timeIDValue, dType = 'i4')
        self.time = timeIDValue

        #### Location ID ####
        locationID = NUM.arange(0, self.numLocations)
        locationVal = NUM.tile(locationID, self.numTime)
        locationVal = locationVal.reshape(self.numTime, self.numLocations)
        self.createVariable('location_ID', locationVal, dType = 'i4')
        self.location = locationVal

        #### Add Location ID Field ####
        self.locationIDField = panelObj.masterField
        self.dataset.location_id_field = panelObj.masterField
        locationIDs = panelObj.getMasterIDs()
        locationIDs = NUM.tile(locationIDs, self.numTime)
        locationIDs = locationIDs.reshape(self.numTime, self.numLocations)
        
        if type(locationIDs[0][0]) == NUM.int32:
            self.createVariable(panelObj.masterField, locationIDs, dType = 'i4')
        elif type(locationIDs[0][0]) == NUM.int64:
            self.createVariable(panelObj.masterField, locationIDs, dType = 'i8')
        else:
            lenCheck = NUM.vectorize(len)
            sizes = lenCheck(locationIDs[0])
            maxSize = sizes.max()
            self.createStringVariable("location_label", locationIDs[0], maxSize)
            locIds = NUM.tile(NUM.arange(len(locationIDs[0]), dtype= NUM.int32), (self.numTime,1))
            self.createVariable(panelObj.masterField, locIds, dType = 'i4')

        #### Set Description Row ####
        self.describeRows = []

        #### Mask Variable for Prediction ####
        self.hasEstimation = False
        if panelObj.predict:
            self.hasEstimation = True
            maskVal = panelObj.finalPredMask
            self.createEstimateMask('PREDICTION_BINARY_MASK', maskVal)

        #### Add Variables ####
        for fieldName in panelObj.fieldNames:
            self.createVariable(fieldName, panelObj.fields[fieldName].data)

        #### Flag for Creating is Done, Ready for Append or Close ####
        self.existed = True

        #### Add Empty Rate Attribute ####
        self.dataset.rate_info = ""
        self.getRateVariableInfo()

    def __getDimInfo(self):
        self.numLocations = int(self.dataset.variables['x'].size)
        self.numTime = int(self.dataset.variables['time'].size)
        self.numObs = int(self.numTime * self.numLocations)

    def __setDimInfo(self, panelObj):
        self.numLocations = panelObj.numLocations
        self.numTime = panelObj.numTime
        self.numObs = panelObj.numObs

        #### Assure Enough Time Bins ####
        if self.numTime < CUTILS.minNumTimeCube:
            ARCPY.AddIDMessage("ERROR", 110004)
            raise SystemExit()

    def __getShapeInfo(self):
        #### Shape Type ####
        self.aggShapeType = self.dataset.agg_shape_type
        self.isPolygon = self.aggShapeType.upper() == "POLYGON"

        #### Spatial Reference and Extent ####
        self.spatialReference = self.__getSpatialReference()
        self.extent = self.__getExtent()

        #### Coordinate Units ####
        self.geometryUnit = self.dataset.geometry_unit
        self.convertFactor = self.dataset.convert_factor 

    def __setShapeInfo(self, panelObj):

        #### Shape Type ####
        self.aggShapeType = panelObj.ssdo.shapeType
        self.dataset.agg_shape_type = self.aggShapeType
        self.isPolygon = self.aggShapeType.upper() == "POLYGON"

        #### Set Shape Info ####
        cubeSR = CUTILS.CubeSpatialRef(panelObj.ssdo.extent, 
                                     panelObj.ssdo.spatialRef)
        #### Spatial Reference Checked ###
        self.checkedSpatialRef = True

        self.extent = cubeSR.extent
        self.spatialReference = cubeSR.spatialRef
        self.distanceUnit = cubeSR.linearUnitName.upper()

        #### Projection Variable ####
        projection = self.dataset.createVariable('projection', 'i4',)
        cubeSR.createProjectionVariable(projection)
        self.isRotated = cubeSR.gridMapping == "rotated_pole"

        #### Geometry Units ####
        self.geometryUnit = panelObj.ssdo.distanceInfo.name
        self.convertFactor = panelObj.ssdo.distanceInfo.convertFactor
        self.dataset.geometry_unit = self.geometryUnit
        self.dataset.convert_factor = self.convertFactor

    def __getTimeInfo(self):
        #### Get Alignment Info ####
        self.hasAlignment = True
        self.alignment = self.dataset.alignment.upper()

        #### Set Is Start Time ? ####
        self.__assessAlignment()

        #### Time Unit/Size ####
        self.timeUnit = self.dataset.time_unit.upper()
        self.timeSize = int(self.dataset.time_size)
        self.timeStepLabel = self.dataset.time_step_label
        self.timeStepLabelLocale = TUTILS.prettyTime(self.timeStepLabel.lower(), localizeUnit=True)

        #### Reference Time ####
        refTimeStr = self.dataset.reference_time
        self.refTime = TUTILS.convert2DateTime(refTimeStr)

        #### Start End Time Bin Values ####
        firstStartStr = self.dataset.first_start_time
        firstEndStr = self.dataset.first_end_time
        lastStartStr = self.dataset.last_start_time
        lastEndStr = self.dataset.last_end_time
        self.firstStartTime = TUTILS.convert2DateTime(firstStartStr)
        self.firstEndTime = TUTILS.convert2DateTime(firstEndStr)
        self.lastStartTime = TUTILS.convert2DateTime(lastStartStr)
        self.lastEndTime = TUTILS.convert2DateTime(lastEndStr)
        if self.firstStartTime is None and self.firstEndTime is None:
            ARCPY.AddIDMessage("ERROR", 110003, self.path)
            raise SystemExit()

        ### Data Start/End Time ####
        self.dataMinTime = self.dataset.data_min_time
        self.dataMaxTime = self.dataset.data_max_time

        #### Get Bias Info ####
        self.startBias = self.dataset.start_bias
        self.endBias = self.dataset.end_bias

        #### Get Forecast Info ####
        if hasattr(self.dataset, 'is_forecast'):
            self.isForecast = self.dataset.is_forecast.upper() == "TRUE"
            self.beginForecastBin = int(self.dataset.begin_forecast_bin)

    def __setTimeInfo(self, panelObj):

        #### Set Alignment Info ####
        self.hasAlignment = True
        self.alignment = panelObj.timeAlignment.upper()

        #### Set Is Start Time ? ####
        self.__assessAlignment()

        #### Time Unit/Size/Label ####
        self.timeUnit = panelObj.timeUnit
        self.timeSize = panelObj.timeSize
        self.timeStepLabel = panelObj.timeStepLabel
        self.timeStepLabelLocale = TUTILS.prettyTime(self.timeStepLabel.lower(), localizeUnit=True)
        self.refTime = panelObj.refTime
        if self.refTime:
            refTimeStr = TUTILS.dateTime2String(self.refTime)
        else:
            refTimeStr = ''
        self.dataset.alignment = self.alignment
        self.dataset.reference_time = refTimeStr
        self.dataset.time_size = self.timeSize
        self.dataset.time_unit = self.timeUnit
        self.dataset.time_step_label = self.timeStepLabel

        #### Cube Time Related Info ####
        self.firstStartTime = panelObj.timeBreaks[0]
        self.firstEndTime = panelObj.timeBreaks[1]
        self.lastStartTime = panelObj.timeBreaks[-2]
        self.lastEndTime = panelObj.timeBreaks[-1]
        self.dataset.first_start_time = TUTILS.dateTime2String(self.firstStartTime)
        self.dataset.first_end_time = TUTILS.dateTime2String(self.firstEndTime)
        self.dataset.last_start_time = TUTILS.dateTime2String(self.lastStartTime)
        self.dataset.last_end_time = TUTILS.dateTime2String(self.lastEndTime)

        ### Data Start/End Time ####
        self.dataMinTime = panelObj.dataMinTime
        self.dataMaxTime = panelObj.dataMaxTime
        self.dataset.data_min_time = self.dataMinTime
        self.dataset.data_max_time = self.dataMaxTime

        #### Set Bias Info ####
        self.startBias = panelObj.startBias
        self.endBias = panelObj.endBias
        self.dataset.start_bias = self.startBias 
        self.dataset.end_bias = self.endBias

        #### Set Default Forecast Info ####
        self.isForecast = False
        self.beginForecastBin = None

    def __assessAlignment(self):
        #### Assess if Start/End Time ####
        if 'START' in self.alignment.upper():
            self.isStartTime = True 
        else:
            self.isStartTime = False

    def __createDimensions(self, panelObj):
        """
        Function to create dimension for cube

        INPUT:
            panelObj (obj): Instance of SSPanelObject Object

        """
        #### Create Dimension ####
        self.dataset.createDimension('time', self.numTime)
        self.dataset.createDimension('locations', self.numLocations)

        #### Create Dimension Variable ####
        time = self.dataset.createVariable('time', 'f8', ('time'))
        x = self.dataset.createVariable('x', 'f8', ('locations'))
        y = self.dataset.createVariable('y', 'f8', ('locations'))
        lat = self.dataset.createVariable('lat', 'f8', ('locations'))
        lon = self.dataset.createVariable('lon', 'f8', ('locations'))

        #### Time Variable ####
        timeArray = NUM.array(panelObj.timeBreaks, dtype = 'datetime64[s]')
        timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        timeBreakSec = NUM.array(timeBreakSec[:-1], dtype = float)
        firstStartStr = TUTILS.dateTime2String(self.firstStartTime)
        self.__createTimeVariable(time, firstStartStr, timeBreakSec)
        self.time = timeBreakSec

        #### Get Centroids ####
        centroids = panelObj.xyCoords

        #### X Variable ####
        self.x = centroids[:,0]
        self.__createLocationVariable(x, 'x', self.x)

        #### Y Variable ####
        self.y = centroids[:,1]
        self.__createLocationVariable(y, 'y', self.y)

        #### Project XY Coords to LonLat ####
        if len(centroids) > 1e7:
            lonlat = ARC._ss.change_projection_xy(centroids, self.spatialReference, self.spatialReference.GCS)
        else:
            #### Project XY Coords to LonLat ####
            lonlat = ARC._ss.xy_to_lonlat(centroids, self.spatialReference)

        lonValues = lonlat[:,0]
        latValues = lonlat[:,1]

        #### Lat Variable ####
        self.__createLocationVariable(lat, 'latitude', latValues)

        #### Lon Variable ####
        self.__createLocationVariable(lon, 'longitude', lonValues)

        #### Special Projection Case for Rotated Pole ####
        if self.isRotated:
            x.long_name = 'grid_longitude'
            x.standard_name = 'grid_longitude'
            y.long_name = 'grid_latitude'
            y.standard_name = 'grid_latitude'

        #### Add Polygon Info ####
        if self.isPolygon and panelObj.requireGeometry:
            #### Create Ragged Arrays ####
            polyBreaksVL = self.dataset.createVLType('i4', 'poly_breaks_vector')
            polyBreaks = self.dataset.createVariable('poly_breaks', polyBreaksVL, 
                                                        ('locations'))
            polyCoordsVL = self.dataset.createVLType('f8', 'poly_coords_vector')
            polyCoords = self.dataset.createVariable('poly_coords', polyCoordsVL, 
                                                        ('locations'))

            #### Create Temporary Arrays ####
            coords = NUM.empty(panelObj.numLocations, object)
            breaks = NUM.empty(panelObj.numLocations, object)

            #### Keep Track of Extent ####
            minX = minY = NUM.float64(1.7976931348623158e+308)
            maxX = maxY = NUM.float64(-1.7976931348623158e+308)

            for ind, feature in enumerate(panelObj.shapes):
                pointCount = 0
                polyInfo = []
                breakInfo = []

                for partNum, part in enumerate(feature):
                    for point in part:
                        if point:
                            polyInfo.append( (point.X, point.Y) )
                            pointCount += 1
                        else:
                            #### Interior Ring ####
                            breakInfo.append(pointCount)

                    breakInfo.append(pointCount)

                polyInfo = NUM.asarray(polyInfo, dtype = float)
                coords[ind] = polyInfo
                breakInfo = NUM.asarray(breakInfo, dtype = NUM.int32)
                breaks[ind] = breakInfo

                #### Update Extent Info ####
                minXTemp, minYTemp = polyInfo.min(0)
                maxXTemp, maxYTemp = polyInfo.max(0)
                minX = min(minX, minXTemp)
                minY = min(minY, minYTemp)
                maxX = max(maxX, maxXTemp)
                maxY = max(maxY, maxYTemp)

            #### Reset Extent ####
            extent = ARCPY.Extent(minX, minY, maxX, maxY)
            extent.spatialReference = panelObj.ssdo.spatialRef
            cubeSR = CUTILS.CubeSpatialRef(extent, panelObj.ssdo.spatialRef, 
                                           not self.checkedSpatialRef)
            self.extent = cubeSR.extent
            self.spatialReference = cubeSR.spatialRef

            #### Add to Dataset ####
            polyCoords[:] = coords
            polyBreaks[:] = breaks 

            #### Add Descriptive Attributes ####
            polyCoords.geom_type = "polygon"
            polyCoords.outer_ring_order = "anticlockwise"
            polyCoords.closure_convention = "last_node_equals_first" 

    def __createAttributes(self, panelObj):
        """
        Function to write global attributes to cube
        """

        #### Attribute for General Info ####
        self.version = ARCPY.GetInstallInfo()['Version']
        self.dataset.description = 'Space-Time Pattern Mining Panel Cube'
        self.dataset.history = 'Created by ' + DT.datetime.now().ctime()
        self.dataset.source = 'Space Time Pattern Mining Tools;'
        self.dataset.source += self.version
        self.dataset.feature_type = "timeSeries"

        if isinstance(panelObj, SSPO.SSPanelObject):
            self.dataset.sourceTool = "Panel"
        elif isinstance(panelObj, SSPO.SSMDRasterPanelObject):
            self.dataset.sourceTool = "Panel_MDRaster"

        #### Attribute for Spatial Info ####
        extentArray = [self.extent.XMin, self.extent.YMin,
                       self.extent.XMax, self.extent.YMax]
        extentArray = NUM.array(extentArray)
        self.dataset.extent = extentArray
        self.dataset.esri_pe_string = self.spatialReference.exportToString()
        self.dataset.projection_authority_code = self.spatialReference.PCSCode
        tmpSR = ARCPY.SpatialReference()
        tmpSR.loadFromString(self.dataset.esri_pe_string)
        self.dataset.raw_pe_string = tmpSR.exportToString()

    def __createTimeVariable(self, time, startTimeStr, value):
        """
        Function to create time variable and assign values

        INPUT:
            startTimeStr (str): dtString for start time of first time bin
            value (NUM Arr): 1D NumPy Array represents seconds

        OUTPUT:
            add time variable to cube

        """
        time.long_name = 'time'
        time.standard_name = 'time'
        time.units =  'seconds since '+ startTimeStr
        time.calendar = 'gregorian'
        time._CoordinateAxisType = 'Time'
        time._ChunkSize = self.timeSize
        time.type = 'dimension'
        time[:] = value

    def __createLocationVariable(self, var, name, value):
        """
        Function to add location variable: lat, lon, x, y

        INPUT:
            name (str): location variable name
            value (NUM Arr): 1D NumPy Array

        OUTPUT:
            location variable to cube
        """
        var.type = 'dimension'

        #### For Lat and Lon ####
        if name in ['latitude', 'longitude']:
            var.long_name = name + ' coordinate'
            var.standard_name = name
            if name == 'latitude':
                var.units = 'degrees_north'
            else:
                var.units = 'degrees_east'

        #### For X and Y ####
        elif name in ['x', 'y']:
            var.long_name = name + ' coordinate of projection'
            var.standard_name = 'projection_' + name + '_coordinate'
            var.units = self.distanceUnit

        var[:] = value

    def __setMinMaxExtent(self):
        lenX = self.extent.XMax - self.extent.XMin
        lenY = self.extent.YMax - self.extent.YMin
        self.minExtent, self.maxExtent = NUM.sort([lenX, lenY])

    def getInternalExtentTuple(self):
        extentArray = self.getInternalExtent()

        return tuple(extentArray)

    def getInternalExtent(self):
        extentArray = NUM.zeros((4,), dtype = float)
        xy = NUM.empty((self.numLocations, 2), dtype = float)
        xy[:,0] = self.x
        xy[:,1] = self.y
        xMin, yMin = xy.min(0)
        xMax, yMax = xy.max(0)
        extentArray[0:2] = xy.min(0)
        extentArray[2:] = xy.max(0)

        return extentArray

    def getExternalExtent(self):
        if not self.isPolygon:
            return self.getInternalExtent()
        else:
            extentArray = NUM.zeros((4,), dtype = float)
            extentArray[:] = self.dataset.extent
            return extentArray
    
    def getLocationTimeSeries(self, variable, location):
        outType = self.dataset.variables[variable].dtype
        output = NUM.zeros((self.numTime,), dtype = outType)
        output[:] = self.dataset.variables[variable][:,location]
        return output

    def getRateVariableInfo(self):
        self.rateVariables = {}
        try:
            for rateInfo in self.dataset.rate_info.split(";"):
                rateName, rateType = rateInfo.split(",")
                self.rateVariables[rateName] = rateType 
        except:
            pass

    def addRateVariable(self, rateName, rateType):
        if hasattr(self.dataset, 'rate_info'):
            rateInfo = self.dataset.rate_info
        else:
            rateInfo = ""
        if len(rateInfo):
            startToken = ";"
        else:
            startToken = ""
        self.rateVariables[rateName] = rateType 
        newRateInfo = startToken + rateName + "," + rateType
        rateInfo += newRateInfo
        self.dataset.rate_info = rateInfo

    def __validate(self):
        """
        Function to validate if the input netCDF4 file is Cube

        INPUT:
            mode (char): Only validate if using 'a' or 'r' in mode

        ATTRIBUTE:
            cube (object): Cube object (if validation pass)

        """
        try:
            cube = NET.Dataset(self.path, self.mode)
            validStr = 'Space-Time Pattern Mining Panel Cube'
            if cube.description == validStr:
                self.dataset = cube
                self.existed = True
        except:
            if 'cube' in locals():
                cube.close()
            ARCPY.AddIDMessage("ERROR", 110003, self.path)
            raise SystemExit()

    def __getSpatialReference(self):
        """
        Function to get cube spatial reference

        OUTPUT:
            spatialReference (obj): ArcPy SpatialReference Object

        """
        try:
            rawPeString = self.dataset.raw_pe_string
            peString = self.dataset.esri_pe_string
            spatialRef = ARCPY.SpatialReference()
            spatialRef.loadFromString(peString)
            if spatialRef.PCSName == '':
                spatialRef.loadFromString(rawPeString)
            return spatialRef
        except:
            return None

    def __getExtent(self):
        """
        Function to get cube extent

        OUTPUT:
            extent (obj): ArcPy Extent Object

        """
        try:
            extentArray = self.dataset.extent
            extent = ARCPY.Extent(extentArray[0], extentArray[1],
                                  extentArray[2], extentArray[3])
            extent.spatialReference = self.spatialReference
            return extent
        except:
            return None

    def getVarDimension(self, varName):
        """
        Function to get the number of dimensions for the variable

        INPUT:
            varName (str): Variable name in cube

        OUTPUT:
            dim (int): Number of dimensions the variable use

        """
        if varName in self.dataset.variables:
            return len(self.dataset.variables[varName].shape)
        else:
            return 0

    def obtainCoordsAndBreaks(self, location):
        """Returns the coordinates and part breaks for a given location.

        INPUT:
            location (int): index of a location

        RETURN:
            coords, breaks: list of coordinates and part breaks as a tuple.
        """

        coords = self.dataset.variables['poly_coords'][location]
        breaks = self.dataset.variables['poly_breaks'][location]
        numCoords = int(len(coords) / 2)

        return coords.reshape(numCoords, 2), breaks

    def obtainCoordsAndBreaksFlat(self, location):
        """Returns the coordinates and part breaks for a given location.

        INPUT:
            location (int): index of a location

        RETURN:
            coords, breaks: list of coordinates and part breaks as a tuple.
        """

        coords = self.dataset.variables['poly_coords'][location]
        breaks = self.dataset.variables['poly_breaks'][location]

        return coords, breaks

    def obtainCentroid(self, location):
        x = self.dataset.variables['x'][location]
        y = self.dataset.variables['y'][location]

        return x, y

    def obtainShape(self, location, useCentroids = False,
                    z = None):
        """Returns each geometry for a given location in the panel cube.
        
        INPUT:
            location (int): 0-based location index
            useCentroids {bool, False}: whether to export centroids for polygons.

        RETURN:
            shape (object): arcpy geometry object for given location
        """

        if not self.isPolygon or useCentroids:
            x = self.dataset.variables['x'][:][location]
            y = self.dataset.variables['y'][:][location]
            if 'z' in self.obtainVariableList():
                z = self.dataset.variables['z'][:][location]
                point = ARCPY.Point(x, y, z)
                return ARCPY.PointGeometry(point, self.spatialReference)
            else:
                point = ARCPY.Point(x, y)
                return ARCPY.PointGeometry(point, self.spatialReference)
        else:
            polyArray = ARCPY.Array()
            coords, breaks = self.obtainCoordsAndBreaks(location)
            numParts = len(breaks)
            if numParts == 1:
                for point in coords:
                    x, y = point
                    pointOut = ARCPY.Point(x, y)
                    polyArray.add(pointOut)
            else:
                breakList = [0] + list(breaks)
                c = 1
                for breakBeg in breakList[:-1]: 
                    breakEnd = breakList[c]
                    partCoords = coords[breakBeg:breakEnd]
                    partArray = ARCPY.Array()
                    for point in partCoords:
                        x, y = point
                        pointOut = ARCPY.Point(x, y)
                        partArray.add(pointOut)
                    polyArray.add(partArray)
                    c += 1

            return ARCPY.Polygon(polyArray, self.spatialReference)

    def obtainAllShapes(self, useCentroids = False, outputFC = None):
        """Returns each unique geometry in the panel cube.
        
        INPUT:
            useCentroids {bool, False}: whether to export centroids for polygons.
            outputFC (str): Output FC for in_memory feature
        RETURN:
            shapes (list): list of shapes for each unique location
            layerName (str): Name for in-memory geometry feature (used in subset)
        """
        if outputFC is not None:
            var = CUTILS.getBaseVar(self)[0][0]
            #### Candidate field on A Cube Variable ####
            #candFields = self.locationsWithData2D(outputFC, var)
            candFields, _ = self.getLocationFields()
            #### Get In Memory Geometries ####
            self.exportFeatures2D(outputFC, candidateFieldList = [candFields])
            #### Make Layer For the Subset Tool
            if outputFC is not None:
                layerName = r"{0}.lyr".format(outputFC)
                ARCPY.MakeFeatureLayer_management(outputFC, layerName)
            
            return layerName

        shapes = []
        for location in UTILS.ssRange(self.numLocations):
            shape = self.obtainShape(location, useCentroids = useCentroids)
            shapes.append(shape)

        return shapes

    def obtainValues(self, varName, flatten = False):
        """
        Function to obtain all values for the variable

        INPUT:
            varName (str): Variable name in cube
            flatten {bool}: Boolean to decide return shape, default is true

        OUTPUT:
            value (NUM Arr): NumPy Array of variable value

        """
        if varName in self.dataset.variables:
            if flatten:
                return self.dataset.variables[varName][:].ravel()
            else:
                return self.dataset.variables[varName][:] 
        else:
            ARCPY.AddIDMessage("ERROR", 728, varName)
            self.close()
            raise SystemExit()

    def obtainVariableMask(self, varName):
        """
        Function to obtain mask value in cube

        INPUT:
            varName (str): variable name in cube that needs a mask

        OUTPUT:
            value (NUM Arr): NumPy Array of mask value

        """
        ehsa = False
        loa = False

        if 'EMERGING_' in varName:
            varName = varName.split('EMERGING_')[1]
            maskName = varName + '_EHSAMASK'
            if maskName in self.dataset.variables:
                mask = NUM.array(self.dataset.variables[maskName][:], dtype = bool)
                return mask.ravel()

        if 'OUTLIER_' in varName:
            varName = varName.split('OUTLIER_')[1]
            maskName = varName + '_COAMASK'
            if maskName in self.dataset.variables:
                mask = NUM.array(self.dataset.variables[maskName][:], dtype = bool)
                return mask.ravel()

        return None

    def obtainMask(self, maskName):
        """
        Function to obtain mask value in cube

        INPUT:
            maskName (str): Mask name in cube

        OUTPUT:
            value (NUM Arr): NumPy Array of mask value

        """
        if maskName in self.dataset.variables:
            mask = NUM.array(self.dataset.variables[maskName][:], dtype = bool)
            return mask.ravel()

    def obtainTimeSeries(self, varName):
        """
        Function to obtain total counts/values in one time slice

        INPUT:
            varName (str): Variable name in cube

        OUTPUT:
            timeSeries (NUM Arr): 1D NumPy Array for time series

        """
        if varName in self.dataset.variables:
            if self.getVarDimension(varName) > 1:
                timeSeries = NUM.zeros((self.numTime,), float)
                NUM.seterr(over = "raise")
                try:
                    timeSeries[:] = self.dataset.variables[varName][:].sum(1)
                except:
                    pass
                NUM.seterr(over = "warn")
                return timeSeries[:]
            else:
                return None
        else:
            return None

    def obtainTrend(self, varName):
        """
        Function to obtain the time trend (mann-kendall) based on time series

        INPUT:
            varName (str): Variable in cube

        OUPUT:
            mkVal (NUM Arr): mann-kendall values based on time series
            mkPVal (NUM Arr): P values for mann-kendall values
        """
        numThreads = UTILS.getNumberOfThreadsDefault()
        if varName in self.dataset.variables:
            if self.getVarDimension(varName) > 1:
                timeSeries = self.obtainTimeSeries(varName)
                mkVal, mkPVal = ARC._ss.mann_kendall(timeSeries, 2, None, numThreads)
                return (mkVal, mkPVal)
            else:
                return (None, None)
        else:
            return (None, None)

    def checkVariable(self, varName):
        #### Ensure Analysis Variable Exists in the Cube ####
        vars = self.obtainVariableList(ignoreDimensionVar = True)
        upperVars = [i.upper() for i in vars]
        upperVarName = varName.upper()
        if upperVars.count(upperVarName):
            index = upperVars.index(upperVarName)
            return vars[index]
        else:
            ARCPY.AddIDMessage("ERROR", 110024, varName)
            raise SystemExit()

    def obtainVariableList(self, ignoreDimensionVar = False):
        """
        Function to obtain variable list in cube

        INPUT:
            ignoreDimensionVar {bool}: flag to ignore dimension variable,
                                       default is False

        OUPUT:
            varList (NUM Arr): NumPy Array of variables in cube
        """

        ignoreList = ['x', 'y', 'lat', 'lon', 'projection', 'time', 'locations',
                      'time_step_ID', 'location_ID']
        if self.isPolygon:
            ignoreList += ['poly_coords', 'poly_breaks']
        ignoreList.append(self.locationIDField)
        ignoreList = NUM.array(ignoreList)

        varList = NUM.array([var for var in self.dataset.variables])
        if not ignoreDimensionVar:
            return varList
        else:
            condition = NUM.invert(NUM.in1d(varList, ignoreList))
            return NUM.extract(condition, varList)

    def obtainVariableListByType(self, pluginType = "EHS"):
        """
        Function to obtain variable list in cube

        INPUT:
            pluginType {str: EHS}: EHS for Hot/Cold Spot, LOA for Local Outlier

        OUPUT:
            varList (NUM Arr): NumPy Array of variables that match pluginType
        """
        inVarNames = self.obtainVariableList()
        if pluginType == "EHS":
            checkFirst = "EMERGING"
            checkLast = "BIN"
            endBreak = -2
        else:
            checkFirst = "OUTLIER"
            checkLast = "TYPE"
            endBreak = -1

        baseVarNames = []
        for inputVar in inVarNames:
            splitName = inputVar.split("_")
            if splitName[0] == checkFirst and splitName[-1] == checkLast:
                baseVarNames.append("_".join(splitName[1:endBreak]))

        return NUM.unique(baseVarNames)

    def obtainTimeBreaks(self):
        """
        Function to obtain aggregation time breaks

        OUTPUT:
            timebreaks (list): List of time breaks
        """
        start = NUM.array(self.firstStartTime, dtype = 'datetime64[s]')
        timeValues = NUM.array(self.dataset.variables['time'][:],
                               dtype = 'timedelta64[s]')
        timeBreaks = (start + timeValues).tolist()
        timeBreaks.append(self.lastEndTime)
        return timeBreaks

    def createStringVariable(self, varName, varValue, maxSize):
        """
        Function to create new variable in cube

        INPUT:
            varName (str): New variable name
            varValue (NUM Arr): 2D/ 3D NumPy Arrays with variable values
            maxSize (int): Max String Size
        OUTPUT:
            new variable added to the cube

        """

        self.dataset.createDimension('labelDim', len(varValue))
        data = self.dataset.createVariable(varName, str, ('labelDim',))
        data[:] = varValue


    def createVariable(self, varName, varValue, dimType = 3, dType = 'f8',
                       maskName = None):
        """
        Function to create new variable in cube

        INPUT:
            varName (str): New variable name
            varValue (NUM Arr): 2D/ 3D NumPy Arrays with variable values
            dimType {int}: Variable dimensions, default is 3
            dType {str}: Variable dtype, default is 'f8'
            maskName {str}: Mask name associated with this variable

        OUTPUT:
            new variable added to the cube

        """

        if dimType == 1:
            dim = ('locations')
        else:
            dim = ('time', 'locations')

        var = self.dataset.createVariable(varName, dType, dim)
        var.long_name = varName
        var.standard_name = varName
        var.grid_mapping = 'projection'
        var.esri_pe_string = self.spatialReference.exportToString()
        if 'f' in dType:
            missingValue = -9999.
        else:
            missingValue = -9999
        var.missing_value = missingValue
        var.type = 'variable'
        if dimType == 1:
            var.coordinates = "lat lon"
        else:
            var.coordinates = "time lat lon"

        if maskName is not None:
            var.setncattr('mask', maskName)

        var[:] = varValue

    def createMaskVariable(self, maskName, maskValue, varName = None):
        """
        Function to create new mask in cube

        INPUT:
            maskName (str): New mask name
            maskValue (NUM Arr): 2D NumPy Arrays with mask values
            varName {str}: Variable name associated with this mask

        OUTPUT:
            new mask variable added to the cube

        """
        if maskName in self.dataset.variables:
            mask = self.dataset.variables[maskName]
        else:
            mask = self.dataset.createVariable(maskName, 'i', ('locations'))
            mask.long_name = maskName
            mask.standard_name = maskName
            mask.grid_mapping = 'projection'
            mask.esri_pe_string = self.spatialReference.exportToString()
            mask.type = 'mask'
            mask.coordinates = "lat lon"
            if varName is not None:
                mask.variable = varName

        mask[:] = maskValue

    def createEstimateMask(self, maskName, maskValue):
        """
        Function to create new mask in cube

        INPUT:
            maskName (str): New mask name
            maskValue (NUM Arr): 2D NumPy Arrays with mask values
            varName {str}: Variable name associated with this mask

        OUTPUT:
            new mask variable added to the cube

        """
        mask = self.dataset.createVariable(maskName, 'i', ('time', 'locations'))
        mask.long_name = maskName
        mask.standard_name = maskName
        mask.grid_mapping = 'projection'
        mask.esri_pe_string = self.spatialReference.exportToString()
        mask.type = 'mask'
        mask.coordinates = "lat lon"
        mask[:] = maskValue

    def createEstimateVariable(self, estimateName, estimateValue, varName = None):
        """
        Function to create new estimate variable in cube

        INPUT:
            estimateName (str): New estimate variable name
            estimateValue (NUM Arr): 3D NumPy Arrays with boolean values
            varName {str}: Variable name associated with this estimate variable

        OUTPUT:
            new mask variable added to the cube

        """
        if estimateName in self.dataset.variables:
            estimateVar = self.dataset.variables[estimateName]
        else:
            estimateVar = self.dataset.createVariable(estimateName, 'i', 
                                                      ('time', 'locations'))
            estimateVar.long_name = estimateName
            estimateVar.standard_name = estimateNam
            estimateVar.grid_mapping = 'projection'
            estimateVar.esri_pe_string = self.spatialReference.exportToString()
            estimateVar.type = 'estimate'
            estimateVar.coordinates = "time lat lon"
            if varName is not None:
                estimateVar.variable = varName

        estimateVar[:] = estimateValue.reshape(self.numTime, self.numLocations)

    def append(self, varName, varValue, maskName = None, 
               maskValue = None):
        """
        Function to apend variables to existing cube

        INPUT:
            varName (str): New or existed variable name
            varValue (NUM Arr): Variable values
            maskName (str): Mask name associated with the variable
            maskValue (NUM Arr): 2D NumPy Arrays for mask

        OUTPUT:
            update the value for variable/ mask or create new

        """
        if self.existed:

            #### Get In/Out Data Types ####
            outType = varValue.dtype
            dimType = len(varValue.shape)
            try:
                #### Determine Data Type Based on Value Type ####
                if outType == NUM.int32:
                    #### Int32 ####
                    dType = 'i4'
                    missingVal = -9999
                elif outType == NUM.int64:
                    #### Int64 ####
                    dType = 'i8'
                    missingVal = -9999
                else:
                    if outType.str.count("<U"):
                        #### String ####
                        dType = outType
                        missingVal = ""
                    else:
                        #### Float ####
                        dType = 'f8'
            except:
                dType = 'f8'

            #### Check if Mask Applied, Fill Masked Value ####
            if maskValue is not None:

                #### Determine Missing Value ####
                missingVal = -9999.

                #### Fill Masked Value to varValue ####
                tiledMask = NUM.tile(maskValue, self.numTime)
                tiledMask = tiledMask.reshape(self.numTime, self.numLocations)
                varValue[~tiledMask] = missingVal

                #### Detect if Mask Existed in Cube ####
                if maskName in self.dataset.variables:
                    mask = self.dataset.variables[maskName]
                    mask[:] = maskValue
                else:
                    self.createMaskVariable(maskName, maskValue, varName)

            #### Detect Variable Existed or not ####
            if varName in self.dataset.variables:
                var = self.dataset.variables[varName]
                var[:] = varValue
            else:
                #### Determine the Dimension for the Variable, 2D or 3D ####
                self.createVariable(varName, varValue, dimType = dimType,
                                    dType = dType, maskName = maskName)

    def close(self):
        """
        Function to close the cube after creation or analytics
        """
        try:
            if self.existed and self.dataset.isopen():
                self.dataset.close()
        except:
            pass

    def createForecastCubeFile(self, ncFile, forecastObject):
        #### Check Add Time ####
        addTime = forecastObject.addTime
        if addTime < 1:
            ARCPY.AddError("You must add at least one time period in order to create a pred cube.")
            raise SystemExit()

        #### Check Path Exists ####
        outPath, outName = OS.path.split(ncFile)
        if not OS.path.exists(outPath):
            ARCPY.AddIDMessage("ERROR", 436, outPath)
            raise SystemExit()

        #### Initialize Cube ####
        try:
            dataset = NET.Dataset(ncFile, 'w')
        except:
            #### Not Writeable ####
            ARCPY.AddIDMessage("ERROR", 210, ncFile)
            raise SystemExit()

        #### Copy Global Attributes ####
        dataset.setncatts(self.dataset.__dict__)

        #### Attribute for General Info ####
        version = ARCPY.GetInstallInfo()['Version']
        dataset.history = 'Created by ' + DT.datetime.now().ctime()
        dataset.source = 'Space Time Pattern Mining Tools;'
        dataset.source += version

        #### Copy X and Y ####
        dataset.createDimension('locations', self.numLocations)

        #### Copy Projection and XY Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon']
        for varName in vars2Copy:
            var = self.dataset.variables[varName]
            newVar = dataset.createVariable(varName, var.datatype, var.dimensions)
            dataset[varName][:] = self.dataset[varName][:]
            dataset[varName].setncatts(self.dataset[varName].__dict__)

        dataset.agg_shape_type = "POINT"
        if self.isPolygon:
            #### Create Ragged Arrays ####
            polyBreaksVL = dataset.createVLType('i4', 'poly_breaks_vector')
            polyBreaks = dataset.createVariable('poly_breaks', polyBreaksVL, 
                                                        ('locations'))
            polyCoordsVL = dataset.createVLType('f8', 'poly_coords_vector')
            polyCoords = dataset.createVariable('poly_coords', polyCoordsVL, 
                                                        ('locations'))
            dataset['poly_breaks'][:] = self.dataset['poly_breaks'][:]
            dataset['poly_coords'][:] = self.dataset['poly_coords'][:]
            dataset.agg_shape_type = "POLYGON"

        #### Copy and Optionally Add Time to T ####
        numTime = self.numTime + addTime 
        dataset.createDimension('time', numTime)

        #### Get Alignment Info ####
        if hasattr(self.dataset, 'alignment'):
            dataset.alignment = self.dataset.alignment
        else:
            dataset.alignment = "END"

        #### Get Forecast Times and Overwrite Last Time Info ####
        forecastTimes = TUTILS.getAllForecastTimes(self, addTime = addTime)
        dataset.last_start_time = TUTILS.dateTime2String(forecastTimes[-2])
        dataset.last_end_time = TUTILS.dateTime2String(forecastTimes[-1])

        #### Time ID Step ####
        timeIDList = NUM.arange(0, numTime)
        timeIDValue = NUM.repeat(timeIDList, self.numLocations)
        timeIDValue = timeIDValue.reshape(numTime, self.numLocations)
        CUTILS.createVariable(dataset, 'time_step_ID', timeIDValue, self.spatialReference,
                              dType = 'i4', isPanel = True)

        #### Get All Times and Create Time Variable ####
        timeArray = NUM.array(forecastTimes, dtype = 'datetime64[s]')
        timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        timeBreakSec = NUM.array(timeBreakSec[:-1], dtype = float)
        firstStartStr = TUTILS.dateTime2String(self.firstStartTime)
        time = dataset.createVariable('time', 'f8', ('time'))
        CUTILS.addTimeVariableInfo(time, self.timeSize, firstStartStr, timeBreakSec)

        #### Set Forecast Info ####
        dataset.is_forecast = "TRUE"
        dataset.begin_forecast_bin = str(self.numTime)        
        dataset.history = 'Created by ' + DT.datetime.now().ctime()
        if forecastObject.doValidation:
            dataset.has_validation = "TRUE"
            dataset.validation_size = str(forecastObject.validationSize)
        else:
            dataset.has_validation = "FALSE"
            dataset.validation_size = '0'

        dataset.json_method_str = forecastObject.jsonMethodStr
        dataset.forecast_type = str(forecastObject.forecastType)

        #### Append and Add Location ID ####
        locationIDs, locationLabels = self.getLocationFields()
        locationVals = NUM.tile(locationIDs.data, numTime)
        locationVals = locationVals.reshape(numTime,  self.numLocations)
        CUTILS.createVariable(dataset, 'location_ID', locationVals, self.spatialReference,
                              dType = 'i4', isPanel = True)

        #### Add Location Label ####
        locationStr = self.getLocationLabelStr()
        if locationStr is not None:
            #### Text Labels ####
            lenCheck = NUM.vectorize(len)
            sizes = lenCheck(locationStr.data)
            maxSize = sizes.max()
            CUTILS.createStringVariable(dataset, "location_label", NUM.asarray(locationStr.data, dtype=object), maxSize)

        #### Int Labels ####
        if locationLabels.type.upper() == 'BIGINTEGER':
            dType = 'i8'
        elif locationLabels.type.upper() == 'LONG':
            dType = 'i4'

        locationVals = NUM.tile(locationLabels.data, numTime)
        locationVals = locationVals.reshape(numTime,  self.numLocations)
        CUTILS.createVariable(dataset, self.locationIDField, locationVals, self.spatialReference,
                                dType = dType, isPanel = True)
        #### Close Dataset ####
        dataset.close()

    def copyForecastCubeFile(self, ncFile, forecastObject):

        #### Check Path Exists ####
        outPath, outName = OS.path.split(ncFile)
        if not OS.path.exists(outPath):
            ARCPY.AddIDMessage("ERROR", 436, outPath)
            raise SystemExit()

        #### Initialize Cube ####
        try:
            dataset = NET.Dataset(ncFile, 'w')
        except:
            #### Not Writeable ####
            ARCPY.AddIDMessage("ERROR", 210, ncFile)
            raise SystemExit()

        #### Copy Global Attributes ####
        dataset.setncatts(self.dataset.__dict__)

        #### Copy X, Y and Time ####
        dataset.createDimension('locations', self.numLocations)
        dataset.createDimension('time', self.numTime)

        #### Copy Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon', 'time_step_ID', 'time',
                     'location_ID', self.locationIDField]
        for varName in vars2Copy:
            var = self.dataset.variables[varName]
            newVar = dataset.createVariable(varName, var.datatype, var.dimensions)
            dataset[varName][:] = self.dataset[varName][:]
            dataset[varName].setncatts(self.dataset[varName].__dict__)

        dataset.agg_shape_type = "POINT"
        if self.isPolygon:
            #### Create Ragged Arrays ####
            polyBreaksVL = dataset.createVLType('i4', 'poly_breaks_vector')
            polyBreaks = dataset.createVariable('poly_breaks', polyBreaksVL, 
                                                        ('locations'))
            polyCoordsVL = dataset.createVLType('f8', 'poly_coords_vector')
            polyCoords = dataset.createVariable('poly_coords', polyCoordsVL, 
                                                        ('locations'))
            dataset['poly_breaks'][:] = self.dataset['poly_breaks'][:]
            dataset['poly_coords'][:] = self.dataset['poly_coords'][:]
            dataset.agg_shape_type = "POLYGON"

        #### Get Alignment Info ####
        if not hasattr(self.dataset, 'alignment'):
            dataset.alignment = "END"

        #### Set Init Info ####
        dataset.history = 'Created by ' + DT.datetime.now().ctime()
        dataset.json_method_str = forecastObject.jsonMethodStr
        dataset.forecast_type = forecastObject.forecastType

        #### Set Correct Validation Info ####
        if not forecastObject.doValidation:
            dataset.has_validation = "FALSE"
            dataset.validation_size = '0'

        #### Close Dataset ####
        dataset.close()

    ################ Reporting Methods ###############

    def getEstimatedInfo(self):
        if self.hasEstimation:
            mask = self.obtainMask('PREDICTION_BINARY_MASK')
            mask = mask.reshape(self.numTime, self.numLocations)
            estimatedObs = mask.sum(0)
            numEstimatedObs = estimatedObs.sum()
            percEstimatedObs = (numEstimatedObs / self.numObs) * 100.
            estimatedLocs = NUM.nonzero(estimatedObs)[0]
            numEstimatedLoc = len(estimatedLocs)
            percEstimatedLocs = (numEstimatedLoc / self.numLocations) * 100.

            res = (numEstimatedLoc, percEstimatedLocs, 
                   numEstimatedObs, percEstimatedObs)

            return res
        else:
            return None

    def generalCubeReport(self):
        """Initial Input Cube Details for Analysis Types."""

        ##### Cube Report ####
        header = ARCPY.GetIDMessage(84604)
        rows = []
        emptyRow = ["", ""]

        #### Time Step Interval ####
        rows.append([ ARCPY.GetIDMessage(84606), self.timeStepLabelLocale])
        rows.append(emptyRow)

        #### Agg Shape Type ####
        if self.isPolygon:
            outShapeType = ARCPY.GetIDMessage(84719)
        else:
            outShapeType = ARCPY.GetIDMessage(84720)
        rows.append([ ARCPY.GetIDMessage(84718), outShapeType])
        rows.append(emptyRow)

        #### Decoration for Time Extent Info ####
        if self.isStartTime:
            spanStr1 = ARCPY.GetIDMessage(84627)
            spanStr2 = ARCPY.GetIDMessage(84628)
            tAlign = ARCPY.GetIDMessage(84632)
        else:
            spanStr1 = ARCPY.GetIDMessage(84629)
            spanStr2 = ARCPY.GetIDMessage(84630)
            tAlign = ARCPY.GetIDMessage(84633)

        #### First Time Step Temporal Bias ####
        startBias = UTILS.formatPercentage(self.startBias, 2, multiplier=1)
        rows.append([ ARCPY.GetIDMessage(84634), startBias])
        
        #### First Time Step Interval ####
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84554), rowSpan=4), spanStr1])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.firstStartTime), align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.firstEndTime), align="right")])
        rows.append(emptyRow)

        #### Last Time Step Temporal Bias ####
        endBias = UTILS.formatPercentage(self.endBias, 2, multiplier=1)
        rows.append([ ARCPY.GetIDMessage(84635), endBias])

        #### Last Time Step Interval ####
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84555), rowSpan=4), spanStr1])
        rows.append([ "@@none",UTILS.buildTableCell(TUTILS.dateTime2String(self.lastStartTime), align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.lastEndTime), align="right")])
        rows.append(emptyRow)

        #### Number of Time Steps ####
        rows.append([ ARCPY.GetIDMessage(84603), self.numTime] )

        #### Number of Locations ####
        try:
            numAnalysisLocations = self.neighborInfo.numLocations
        except:
            numAnalysisLocations = self.numLocations

        rows.append([ ARCPY.GetIDMessage(84607), numAnalysisLocations ] )

        #### Number of Space Time Bins ####
        try:
            numAnalysisObs = self.neighborInfo.numObs
        except:
            numAnalysisObs = self.numObs

        rows.append([ ARCPY.GetIDMessage(84608), numAnalysisObs ] )

        #### End Line ####
        rows.append("EMPTY")

        #### Store Description Rows ####
        self.describeRows = rows

        #### End Cube Details Table ####
        ARCPY.AddMessage("")
        outputTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                            justify = ['left', 'right'],
                                            titleFillToken = "-",
                                            emptyFillToken = "-" , emphasizeHeadRow=False,
                                            force2Txt=False)
        outputTable += "\n"

        return outputTable

    def analysisReport(self, permutations = None):
        """General Analysis / Neighborhood Report for Cube."""
        header = ARCPY.GetIDMessage(84547)

        #### Neighborhood Info  ####
        rows = self.neighborInfo.returnSearchInfo()

        #### Spanning ####
        userTimeValue, userTimeUnit = self.dataset.time_step_label.split()
        spanTime = int(userTimeValue) * self.neighborInfo.timeOrder
        spanStr = UTILS.formatString("{0} {1}")
        spanInit = spanStr.format(spanTime, userTimeUnit)
        spanValue = TUTILS.prettyTime(spanInit, localizeUnit = True)
        spanning = ARCPY.GetIDMessage(84610).format(spanValue)
        if UTILS.couldExportHTMLMessage():
            rows[-1][1] += " " + spanning
        else:
            rows.append(["", spanning])

        #### Permutations ####
        if permutations is not None:
            rows.append( [ ARCPY.GetIDMessage(84672), permutations] )

        #### End Line ####
        rows.append("EMPTY")

        #### End Analysis Details ####
        outputTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                            justify = ['left', 'right'],
                                            titleFillToken = "-",
                                            emptyFillToken = "-", emphasizeHeadRow=False,
                                            force2Txt=False)
        outputTable += "\n"

        return outputTable

    def buildCubeReport(self, varNames, fileName = None, outputMessage = True, subType = None):
        """Summary for Create Space-Time Cube.

        INPUTS:
        fileName {str}: optional path to text file.
        """

        #### Prepare Dictionary for Table Export ####
        tableFields = ['rows', 'header', 'pad', 'justify', 
                       'titleFillToken', 'colPad', 'emphasizeHeadRow', 
                       'returnHTMLMsg', 'tableSize', 'isCount', 'isSumm']

        self.messageInfo = {field:[] for field in tableFields}

        ##### Informative Paragraph ####
        bullet = "-"
        indent = UTILS.formatString("{0} {1}")

        #### Define PCS String ####
        pcsName = self.spatialReference.PCSName.replace('_', ' ')

        #### Header For Entire Report ####
        header = ARCPY.GetIDMessage(84514)
        emptyRow = ["", ""]

        #### Location Part of Table ####
        rows = []

        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84625), rowSpan=2), self.dataMinTime])
        rows.append(["@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84626).format(self.dataMaxTime), align="right")])
        rows.append(emptyRow)

        #### Number of Time Steps ####
        rows.append([ ARCPY.GetIDMessage(84603), self.numTime] )

        #### Decoration for Time Extent Info ####
        if self.isStartTime:
            spanStr1 = ARCPY.GetIDMessage(84627)
            spanStr2 = ARCPY.GetIDMessage(84628)
            tAlign = ARCPY.GetIDMessage(84632)
        else:
            spanStr1 = ARCPY.GetIDMessage(84629)
            spanStr2 = ARCPY.GetIDMessage(84630)
            tAlign = ARCPY.GetIDMessage(84633)

        #### Time Part of the Table ####
        rows.append([ ARCPY.GetIDMessage(84606), self.timeStepLabelLocale])
        rows.append([ ARCPY.GetIDMessage(84631), tAlign])
        rows.append(emptyRow)

        #### First Time Step Temporal Bias ####
        startBias = UTILS.formatPercentage(self.startBias, 2, multiplier=1)
        rows.append([ ARCPY.GetIDMessage(84634), startBias])
        
        #### First Time Step Interval ####
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84554), rowSpan=4), spanStr1])
        rows.append([ "@@none", UTILS.buildTableCell(self.firstStartTime, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(self.firstEndTime, align="right")])
        rows.append(emptyRow)

        #### Last Time Step Temporal Bias ####
        endBias = UTILS.formatPercentage(self.endBias, 2, multiplier=1)
        rows.append([ ARCPY.GetIDMessage(84635), endBias])

        #### Last Time Step Interval ####
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84555), rowSpan=4), spanStr1])
        rows.append([ "@@none", UTILS.buildTableCell(self.lastStartTime, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(self.lastEndTime, align="right")])
        rows.append(emptyRow)

        #### Extent Table ####
        displayUnit = UTILS.distanceUnitInfo[self.geometryUnit][0].lower()
        if displayUnit in UTILS.localizableUnit:
            displayUnit = UTILS.localizableUnit[displayUnit].format("").strip()

        coordType = ARCPY.GetIDMessage(84520).format(displayUnit)
        xMinVal = LOCALE.format_string("%0.4f", self.extent.XMin)
        yMinVal = LOCALE.format_string("%0.4f", self.extent.YMin)
        xMaxVal = LOCALE.format_string("%0.4f", self.extent.XMax)
        yMaxVal = LOCALE.format_string("%0.4f", self.extent.YMax)

        rows.append([ARCPY.GetIDMessage(220528), pcsName])
        rows.append([ ARCPY.GetIDMessage(84519), coordType ])
        rows.append([ ARCPY.GetIDMessage(84521), xMinVal ])
        rows.append([ ARCPY.GetIDMessage(84522), yMinVal ])
        rows.append([ ARCPY.GetIDMessage(84523), xMaxVal ])
        rows.append([ ARCPY.GetIDMessage(84524), yMaxVal ])

        if not outputMessage:
            if "_FORECAST" in subType.upper():
                rows[0] = [UTILS.buildTableCell(ARCPY.GetIDMessage(220457), rowSpan=2), self.dataMinTime]
            
            self.messageInfo['rows'].append(rows)
            self.messageInfo['header'].append(header)
            self.messageInfo['pad'].append(1)
            self.messageInfo['justify'].append(['left', 'right'])
            self.messageInfo['titleFillToken'].append("-")
            self.messageInfo['colPad'].append(2)
            self.messageInfo['emphasizeHeadRow'].append(False)
            self.messageInfo['returnHTMLMsg'].append(True)
            self.messageInfo['tableSize'].append(None)
            self.messageInfo['isCount'].append(False)
            self.messageInfo['isSumm'].append(False)

        outputTable = [UTILS.outputTextTable(rows, header = header, pad = 1,
                                             justify = ['left', 'right'],
                                             titleFillToken = "-", colPad = 2,
                                             emphasizeHeadRow=False,
                                             returnHTMLMsg=True, force2Txt=False)]

        #### Estimated ####
        rows = []
        if self.hasEstimation:
            numLoc, percLoc, numObs, percObs = self.getEstimatedInfo()
            percLoc = LOCALE.format_string("%0.2f", percLoc)
            percObs = LOCALE.format_string("%0.2f", percObs)

            #### Locations ####
            rows.append([ ARCPY.GetIDMessage(84528), self.numLocations ])
            rows.append([ ARCPY.GetIDMessage(84724), percLoc ])
            indentTotal = indent.format(bullet, ARCPY.GetIDMessage(84638))
            rows.append([ indentTotal, numLoc ])

            #### Observations ####
            rows.append([ ARCPY.GetIDMessage(84723), self.numObs ])
            rows.append([ ARCPY.GetIDMessage(84725), percObs ])
            rows.append([ indentTotal, numObs ])

        else:
            rows.append([ ARCPY.GetIDMessage(84528), self.numLocations ])
            rows.append([ ARCPY.GetIDMessage(84723), self.numObs ])


        if not outputMessage:
            self.messageInfo['rows'][-1].extend(rows)

        outputTable += [UTILS.outputTextTable(rows, pad = 1,
                                              justify = ['left', 'right'],
                                              titleFillToken = " ", colPad = 8,
                                              emphasizeHeadRow=False,
                                              tableSize = None,
                                              returnHTMLMsg=True, force2Txt=False)]

        #### Overall Data Trend ####
        for varName in varNames:
            header = ARCPY.GetIDMessage(84536).format(UTILS.decodeString(varName))
            mkVal, mkPVal = self.obtainTrend(varName)
            direction, trendString = UTILS.getMannKendallDirStr(mkVal, mkPVal)
            direction = UTILS.returnAdjustedString(direction, 15, justify = 'right')
            rows = []
            rows.append( [ARCPY.GetIDMessage(84537), direction] )
            rows.append( [ARCPY.GetIDMessage(84538), LOCALE.format_string("%0.4f", mkVal)] )
            rows.append( [ARCPY.GetIDMessage(84539), LOCALE.format_string("%0.4f", mkPVal)] )

            timeSeries = self.obtainTimeSeries(varName)

            if not outputMessage:
                self.messageInfo['rows'].append(rows)
                self.messageInfo['header'].append(header)
                self.messageInfo['pad'].append(1)
                self.messageInfo['justify'].append(['left', 'right'])
                self.messageInfo['titleFillToken'].append("-")
                self.messageInfo['colPad'].append(24)
                self.messageInfo['emphasizeHeadRow'].append(False)
                self.messageInfo['returnHTMLMsg'].append(True)
                self.messageInfo['tableSize'].append("small")
                self.messageInfo['isCount'].append(False)
                self.messageInfo['isSumm'].append(False)

            outputTable += [UTILS.outputTextTable(rows, header = header, pad = 1,
                                                  justify = ['left', 'right'],
                                                  titleFillToken = "-", colPad = 24,
                                                  emphasizeHeadRow=False,
                                                  tableSize = None,
                                                  returnHTMLMsg=True, force2Txt=False)]

        if fileName:
            fo = UTILS.openFile(fileName, "w")
            UTILS.writeText(fo, outputTable)
            fo.close()
        else:
            for tb in outputTable:
                if outputMessage:
                    ARCPY.AddMessage(tb)

    def outlierReport(self, binData):
        lessT = self.numTime - 1.0
        numTime, numLocations = binData.shape

        #### Location Based Sums of Categories ####
        numAny = binData != 0
        numHH = (binData == 1).sum(0)
        numLL = (binData == 3).sum(0)
        bin2 = (binData == 2)
        bin4 = (binData == 4)
        numLH = bin2.sum(0)
        numHL = bin4.sum(0)
        numOut = numLH + numHL

        #### Time Based Sums of Categories
        timeLH = bin2.sum(1)
        timeHL = bin4.sum(1)

        #### Set Single and More Than One Cat ####
        typeData = NUM.zeros((numLocations,), dtype = NUM.int32)
        sumData = NUM.zeros((numLocations,4), dtype = bool)
        sumData[:,0] = numHH > 0
        sumData[:,1] = numLH > 0
        sumData[:,2] = numLL > 0
        sumData[:,3] = numHL > 0
        sumCats = sumData.sum(1)

        #### Single Cat ####
        onlyOneCat = sumCats == 1
        typeData[onlyOneCat] = sumData[onlyOneCat].argmax(1) + 1

        #### Multiple Cat ####
        moreThanOneCat = sumCats > 1
        typeData[moreThanOneCat] = 5

        #### Last Time Step Table ####
        lastDataLH = binData[-1] == 2
        lastDataHL = binData[-1] == 4
        sumLastLH = lastDataLH.sum()
        sumLastHL = lastDataHL.sum()
        sumLastOut = sumLastHL + sumLastLH
        rows = []
        header = ARCPY.GetIDMessage(84641)
        rows.append([ARCPY.GetIDMessage(84642), "{0}".format(sumLastOut)])
        rows.append([ARCPY.GetIDMessage(84643), "{0}".format(sumLastHL)])
        rows.append([ARCPY.GetIDMessage(84644), "{0}".format(sumLastLH)])

        #### End Line ####
        rows.append("EMPTY")

        lastTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                          justify = ['left', 'right'],
                                          titleFillToken = "-",
                                          emptyFillToken = "-")
        outputTable = "\n" + lastTable + "\n"

        #### Key Time Step Table ####
        rows = []
        header = ARCPY.GetIDMessage(84645)
        timeBreaks = self.obtainTimeBreaks()
        timeAll = timeHL + timeLH
        if self.isStartTime:
            secondChange = 'STARTTIME'
        else:
            secondChange = 'ENDTIME'

        #### First/Last ####
        firstLastInfo = TUTILS.getFirstLastTimeSteps(timeAll, timeBreaks, 
                                                     secondChange = secondChange)
        firstStartTime, firstEndTime, lastStartTime, lastEndTime = firstLastInfo

        #### First Outlier ####
        rows.append([ ARCPY.GetIDMessage(84646), firstStartTime])
        if firstStartTime != "None":
            rows.append([ "", ARCPY.GetIDMessage(84574).format(firstEndTime)])

        #### Last Outlier ####
        rows.append([ ARCPY.GetIDMessage(84647), lastStartTime])
        if lastStartTime != "None":
            rows.append([ "", ARCPY.GetIDMessage(84574).format(lastEndTime)])

        #### Most All Outliers ####
        mostAllInfo = TUTILS.getKeyTimeSteps(timeAll, timeBreaks, minimum = False, 
                                             secondChange = secondChange)
        mostOutTimeVal, mostOutStartTime, mostOutEndTime = mostAllInfo
        rows.append([ ARCPY.GetIDMessage(84648), mostOutTimeVal])
        rows.append([ "", mostOutStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(mostOutEndTime)])

        #### Least All Outliers ####
        leastAllInfo = TUTILS.getKeyTimeSteps(timeAll, timeBreaks, 
                                              secondChange = secondChange)
        leastOutTimeVal, leastOutStartTime, leastOutEndTime = leastAllInfo
        rows.append([ ARCPY.GetIDMessage(84649), leastOutTimeVal])
        rows.append([ "", leastOutStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(leastOutEndTime)])

        #### Most HL ####
        mostHLInfo = TUTILS.getKeyTimeSteps(timeHL, timeBreaks, minimum = False, 
                                            secondChange = secondChange)
        mostHLTimeVal, mostHLStartTime, mostHLEndTime = mostHLInfo
        rows.append([ ARCPY.GetIDMessage(84650), mostHLTimeVal])
        rows.append([ "", mostHLStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(mostHLEndTime)])

        #### Least HL ####
        leastHLInfo = TUTILS.getKeyTimeSteps(timeHL, timeBreaks, 
                                             secondChange = secondChange)
        leastHLTimeVal, leastHLStartTime, leastHLEndTime = leastHLInfo
        rows.append([ ARCPY.GetIDMessage(84651), leastHLTimeVal])
        rows.append([ "", leastHLStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(leastHLEndTime)])

        #### Most LH ####
        mostLHInfo = TUTILS.getKeyTimeSteps(timeLH, timeBreaks, minimum = False, 
                                            secondChange = secondChange)
        mostLHTimeVal, mostLHStartTime, mostLHEndTime = mostLHInfo
        rows.append([ ARCPY.GetIDMessage(84652), mostLHTimeVal])
        rows.append([ "", mostLHStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(mostLHEndTime)])

        #### Least LH ####
        leastLHInfo = TUTILS.getKeyTimeSteps(timeLH, timeBreaks, 
                                             secondChange = secondChange)
        leastLHTimeVal, leastLHStartTime, leastLHEndTime = leastLHInfo
        rows.append([ ARCPY.GetIDMessage(84653), leastLHTimeVal])
        rows.append([ "", leastLHStartTime])
        rows.append([ "", ARCPY.GetIDMessage(84574).format(leastLHEndTime)])

        #### End Line ####
        rows.append("EMPTY")

        keyTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                         justify = ['left', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-")
        outputTable += "\n" + keyTable + "\n"

        #### Location Summary Table ####
        rows = []
        header = ARCPY.GetIDMessage(84664)
        emptyRow = ["", "", ""]

        #### Category/Location Label ####
        rows.append([ ARCPY.GetIDMessage(84657), 
                      ARCPY.GetIDMessage(84671),
                      ARCPY.GetIDMessage(84673)])

        #### Calc Category Totals ####
        typeHHSum = (typeData == 1).sum()
        typeLHSum = (typeData == 2).sum()
        typeLLSum = (typeData == 3).sum()
        typeHLSum = (typeData == 4).sum()
        typeMixSum = (typeData == 5).sum()
        typeAllSum = typeHHSum + typeLHSum + typeLLSum + typeHLSum + typeMixSum
        typeNotSum = numLocations - typeAllSum
        n = numLocations * 1.0
        typeHHPerc = UTILS.formatValue((typeHHSum / n) * 100, "%0.2f")
        typeLHPerc = UTILS.formatValue((typeLHSum / n) * 100, "%0.2f")
        typeLLPerc = UTILS.formatValue((typeLLSum / n) * 100, "%0.2f")
        typeHLPerc = UTILS.formatValue((typeHLSum / n) * 100, "%0.2f")
        typeMixPerc = UTILS.formatValue((typeMixSum / n) * 100, "%0.2f")
        typeNotPerc = UTILS.formatValue((typeNotSum / n) * 100, "%0.2f")

        #### Add Cat Rows ####
        rows.append([ ARCPY.GetIDMessage(84670),  
                     "{0}".format(typeNotSum),
                      typeNotPerc ])
        rows.append([ ARCPY.GetIDMessage(84665),  
                      "{0}".format(typeHHSum),
                      typeHHPerc ])
        rows.append([ ARCPY.GetIDMessage(84666),  
                      "{0}".format(typeLHSum),
                      typeLHPerc ])
        rows.append([ ARCPY.GetIDMessage(84667),  
                      "{0}".format(typeLLSum),
                      typeLLPerc ])
        rows.append([ ARCPY.GetIDMessage(84668),  
                      "{0}".format(typeHLSum),
                      typeHLPerc ])
        rows.append([ ARCPY.GetIDMessage(84669),  
                      "{0}".format(typeMixSum),
                      typeMixPerc ])

        #### End Line ####
        rows.append("EMPTY")

        catTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                         justify = ['left', 'right', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-")
        outputTable += "\n" + catTable + "\n"

        #### Entire Cube ####
        rows = []
        header = ARCPY.GetIDMessage(84654)

        #### Locations w/ Outliers ####
        numWithOutliers = (numOut != 0).sum()
        strNumOutliers = ARCPY.GetIDMessage(84656).format(numWithOutliers, numLocations)
        rows.append([ARCPY.GetIDMessage(84655), "", strNumOutliers])

        #### Empty Row ####
        rows.append(emptyRow)

        #### Category/Bin Label ####
        rows.append([ ARCPY.GetIDMessage(84657),  ARCPY.GetIDMessage(84658), ARCPY.GetIDMessage(84674)])

        #### High/Low Outlier Bins ####
        nBins = numLocations * lessT
        sumHighOut = numHL.sum()
        sumLowOut = numLH.sum()
        percHighOut = UTILS.formatValue((sumHighOut / nBins) * 100., "%0.2f")
        percLowOut = UTILS.formatValue((sumLowOut / nBins) * 100., "%0.2f")
        rows.append([ ARCPY.GetIDMessage(84659), "{0}".format(sumHighOut), percHighOut])
        rows.append([ ARCPY.GetIDMessage(84660), "{0}".format(sumLowOut), percLowOut])
        
        #### High/Low Cluster Bins ####
        sumHighClust = numHH.sum()
        sumLowClust = numLL.sum()
        percHighClust = UTILS.formatValue((sumHighClust / nBins) * 100., "%0.2f")
        percLowClust = UTILS.formatValue((sumLowClust / nBins) * 100., "%0.2f")
        rows.append([ ARCPY.GetIDMessage(84661), "{0}".format(sumHighClust), percHighClust])
        rows.append([ ARCPY.GetIDMessage(84662), "{0}".format(sumLowClust), percLowClust])

        #### Not Significant ####
        sumNotSig = int(nBins) - (sumHighClust + sumLowOut + sumLowClust + sumHighOut)
        percNotSig = UTILS.formatValue((sumNotSig / nBins) * 100., "%0.2f")
        rows.append([ ARCPY.GetIDMessage(84663), "{0}".format(sumNotSig), percNotSig])

        #### End Line ####
        rows.append("EMPTY")

        cubeTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                          justify = ['left', 'right', 'right'],
                                          titleFillToken = "-",
                                          emptyFillToken = "-")
        outputTable += "\n" + cubeTable 

        return outputTable

    ################# Analysis Methods ###############
    def setNeighborInfo(self, neighborInfo):
        self.neighborInfo = neighborInfo

    def mannKendall(self, inputVarName, applyFDR = False,
                        analysisMask = None):
        """
        This method performs hotspot analysis on Mann Kendall
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            applyFDR (bool): applied False Discovery Rate, default is true

        OUTPUT:
            MKZSCORE (var): numpy array for the results of Mann Kendall Zscore
            MKPVALUE (var): numpy array for the results of Mann Kendall PValues
            MKBINS (var): numpy array for the results of Mann Kendall Bin
        """
        #### Ensure Analysis Variable Exists in the Cube ####
        inputVarName = self.checkVariable(inputVarName)

        #### Set up Analysis Mask and Output Name ####
        outputVarName = inputVarName + "_TREND"

        #### One-Dimensional (flattened) Masks ####
        useMask = analysisMask is not None
        if not useMask:
            analysisMask = NUM.ones(self.numLocations, dtype = bool)

        #### Create Output Arrays ####
        numLocations = int(analysisMask.sum())
        #y = NUM.empty((numLocations,), float)
        #mk_pv = NUM.empty((numLocations,), float)
        mk_bins = NUM.empty((numLocations,), float)

        #### Create Trend Progessor ####
        msg = ARCPY.GetIDMessage(84695)
        ARCPY.SetProgressor("step", msg, 0, numLocations, 1)
        numThreads = UTILS.getNumberOfThreadsDefault()

        #### Running Mann Kendall for Whole Cube ####
        tData = self.dataset.variables[inputVarName][:]
        y, mk_pv = ARC._ss.mann_kendall(tData, 2, None, numThreads)
        ARCPY.SetProgressorPosition()

        #### Create Results Progessor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007),
                            0, numLocations, 1)

        yMask = y[analysisMask]
        mkMask = mk_pv[analysisMask]
        if applyFDR:
            mkBins = STATS.fdrTransform(mkMask, yMask)
        else:
            mkBins = STATS.pValueBins(mkMask, yMask)

        mk_bins[analysisMask] = mkBins

        #### Add Mann-Kendall Variable to Existing Cube ####
        self.append(outputVarName + "_ZSCORE", y)
        self.append(outputVarName + "_PVALUE", mk_pv)
        self.append(outputVarName + "_BIN", mk_bins)

    def emergingHotSpots(self, inputVarName, neighborInfo, applyFDR = True, 
                         globalMethod = "ENTIRE_CUBE"):
        """
        This method performs emerging space time hot spot analysis
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            neighborInfo (object): neighborhood definition class
            applyFDR (bool): applied False Discovery Rate, default is true
            globalMethod {str, "ENTIRE_CUBE"}: "ENTIRE_CUBE", 
                                               "NEIGHBORHOOD_TIME_STEP",
                                               "INDIVIDUAL_TIME_STEP"

        OUTPUT:
            GIZSCORE (var): numpy array for the results of Gi Zscore
            GIZPVALUE (var): numpy array for the results of Gi PValue
            GIBINS (var): numpy array for the results of Gi Bin
            MKZSCORE (var): numpy array for the results of Mann Kendall Zscore
            MKPVALUE (var): numpy array for the results of Mann Kendall PValues
            MKBINS (var): numpy array for the results of Mann Kendall Bin
            CATEGORY (var): Emerging Category
        """

        #### Ensure Analysis Variable Exists in the Cube ####
        inputVarName = self.checkVariable(inputVarName)

        #### Create Output Var Name ####
        outputVarName = "EMERGING_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/Mask Variables ####
        if inputVarName in CUTILS.corePanelVarNames:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(self, "isForecast") and self.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        #### Retrieve Values from Cube ####
        inputVar = self.obtainValues(inputVarName, flatten = True) 

        #### Apply Global Average Window ####
        useWindow = globalMethod != "ENTIRE_CUBE"
        if useWindow:
            if globalMethod == "INDIVIDUAL_TIME_STEP":
                window = 0
            else:
                window = neighborInfo.timeOrder

        #### Set Stats ####
        self.setNeighborInfo(neighborInfo)

        #### Calculate Variance of Variable Values ####
        yVar = inputVar.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if self.numObs < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if inputVar.dtype != NUM.float64 and inputVar.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Create Hot Spot Progessor ####
        msg = ARCPY.GetIDMessage(84696)
        ARCPY.SetProgressor("default", msg)

        #### Create Panel Info Structure ####
        panelInfo = ARC._ss.PanelInfo(self.numTime, self.numLocations)

        #### Running Hotspot Analysis for Each Cell ####
        if useWindow:
            results = panelInfo.get_hotspots_window(inputVar, neighborInfo, window)
        else:
            results = panelInfo.get_hotspots(inputVar, neighborInfo)

        if results is None:
            #### No Window Variation ####
            raise SystemExit()

        gi, pv = results

        #### Apply Correction / Set Bins ####
        if applyFDR:
            giBins = STATS.fdrTransform(pv, gi)
        else:
            giBins = STATS.pValueBins(pv, gi)

        #### Create Emerging Progessor ####
        msg = ARCPY.GetIDMessage(110030)
        ARCPY.SetProgressor("default", msg)

        #### Do Emerging Hot-Spot Analysis ####
        emerge = panelInfo.get_emerging_hotspots(inputVar, gi, pv, giBins)
        emerging_bins, mk_z, mk_pv, mk_bins, bin_array = emerge

        #### Get Category Info ####
        cats = list(range(-8, 9))
        binCounter = {}
        for ind, cat in enumerate(cats):
            binCounter[cat] = bin_array[ind]

        #### Initial Cube Report ####
        outputTable = self.generalCubeReport()

        #### Analysis Details Table ####
        outputTable += self.analysisReport()

        #### Emerging Details Table ####
        outputTable += CUTILS.emergingReport(binCounter, self.numLocations)

        #### Print Entire Report ####
        ARCPY.AddMessage(outputTable)

        #### Write Resutls to Cube NetCDF File ####
        self.append(outputVarName + "_HS_ZSCORE", gi.reshape(self.numTime,
                                                             self.numLocations))
        self.append(outputVarName + "_HS_PVALUE", pv.reshape(self.numTime,
                                                             self.numLocations))
        self.append(outputVarName + "_HS_BIN", giBins.reshape(self.numTime,
                                                              self.numLocations))
        self.append(outputVarName + "_TREND_ZSCORE", mk_z)
        self.append(outputVarName + "_TREND_PVALUE", mk_pv)
        self.append(outputVarName + "_TREND_BIN", mk_bins)
        self.append(outputVarName + "_CATEGORY", emerging_bins)

    def clusterOutlier(self, inputVarName, neighborInfo,
                       permutations = 499, applyFDR = True,
                       globalMethod = "ENTIRE_CUBE"): 
        """
        This method performs space time cluster-outlier analysis (Local Moran's I)
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            neighborInfo (object): neighborhood definition class
            permutations (int): number of simulations for conditional randomziation
            applyFDR (bool): applied False Discovery Rate, default is true
            globalMethod {str, "ENTIRE_CUBE"}: "ENTIRE_CUBE", 
                                               "NEIGHBORHOOD_TIME_STEP",
                                               "INDIVIDUAL_TIME_STEP"

        OUTPUT:
            INDEX (var): numpy array for the results of Li
            PVALUE (var): numpy array for permutation p-value
            TYPE (var): numpy array for the results of outlier bin (Moran Scatter Quadrant)
        """

        #### Ensure Analysis Variable Exists in the Cube ####
        inputVarName = self.checkVariable(inputVarName)

        #### Create Output Var Name ####
        outputVarName = "OUTLIER_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/Mask Variables ####
        if inputVarName in CUTILS.corePanelVarNames:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(self, "isForecast") and self.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        #### Retrieve Values from Cube ####
        inputVar = self.obtainValues(inputVarName, flatten = True) 
        mask = NUM.ones(self.numObs, dtype = bool)

        #### Apply Global Average Window ####
        useWindow = globalMethod != "ENTIRE_CUBE"
        if useWindow:
            if globalMethod == "INDIVIDUAL_TIME_STEP":
                window = 0
            else:
                window = neighborInfo.timeOrder

        #### Set Stats ####
        self.setNeighborInfo(neighborInfo)

        #### Calculate Variance of Variable Values ####
        yVar = inputVar.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if self.numObs < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if inputVar.dtype != NUM.float64 and inputVar.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Create Panel Info Structure ####
        panelInfo = ARC._ss.PanelInfo(self.numTime, self.numLocations)

        #### Running Local Moran's I ####       
        randSeed = UTILS.getRandomSeed()
        if useWindow:
            results = panelInfo.get_cluster_outliers_window(inputVar, neighborInfo, window,
                                                            permutations = permutations,
                                                            random_seed = randSeed)
        else:
            results = panelInfo.get_cluster_outliers(inputVar, neighborInfo,
                                                     permutations = permutations,
                                                     random_seed = randSeed)

        if results is None:
            #### No Window Variation ####
            raise SystemExit()

        li, pv, li_bins, has_spatial_neighs, z_transform, spatial_lag = results

        #### Apply Correction / Set Bins ####
        if applyFDR:
            #### Add False to First TimeSlice ####
            mask[0:self.numLocations] = False
            liMask = li[mask]
            pvMask = pv[mask]

            #### Do FDR ####
            liBins = STATS.fdrTransform(pvMask, liMask)

            #### Remove Cluster-Outlier Type if not Significant at 95% via FDR #### 
            removeSignificance = abs(liBins) < 2
            mask_bins = li_bins[mask]
            mask_bins[removeSignificance] = 0
            li_bins[mask] = mask_bins

        ##### Initial Cube Report ####
        outputTable = self.generalCubeReport()

        #### Analysis Details Table ####
        outputTable += self.analysisReport(permutations = permutations)

        #### Cluster-Outlier Report ####
        outBins = li_bins.reshape(self.numTime, self.numLocations)
        timeBreaks = self.obtainTimeBreaks()
        outputTable += CUTILS.outlierReport(outBins[1:], timeBreaks, self.isStartTime)
        ARCPY.AddMessage(outputTable)

        #### Add Cluster-Outlier Variables to Existing Cube ####
        self.append(outputVarName + "_INDEX", li.reshape(self.numTime, 
                                                         self.numLocations))
        self.append(outputVarName + "_PVALUE", pv.reshape(self.numTime, 
                                                          self.numLocations))
        self.append(outputVarName + "_TYPE", outBins)
        self.append(outputVarName + "_HAS_SPATIAL_NEIGHBORS", has_spatial_neighs)
        self.append(outputVarName + "_ZTRAN", z_transform.reshape(self.numTime, 
                                                                  self.numLocations))
        self.append(outputVarName + "_LAG", spatial_lag.reshape(self.numTime, 
                                                                self.numLocations))

    def timeSeriesClustering(self, inputVarName, numClusters = None, 
                             dissimilarityMethod = "VALUE", 
                             clusterMethod = "K_MEDOIDS"):
        """
        This method performs emerging space time hot spot analysis
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            numClusters (int): number of resulting groups
            dissimilarityMethod {str, "VALUE"}: "VALUE", "SHAPE", "VALUE_AND_SHAPE",
                                                "COMPLEXITY"
            clusterMethod {str, "KMEDOIDS"}: "KMEDOIDS", "KMEANS"

        OUTPUT:
            GROUPS (var): numpy array for the results of time-series clustering
        """

        #### Runtime Error Checks ####
        valid = CUTILS.runtimeTimeSeriesChecks(numClusters, self.numLocations)
        if not valid:
            self.close()
            raise SystemExit()

        #### Ensure Analysis Variable Exists in the Cube ####
        inputVarName = self.checkVariable(inputVarName)

        #### Create Output Var Name ####
        outputVarName = "TSCLUST_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/Mask Variables ####
        if inputVarName in CUTILS.corePanelVarNames:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Retrieve Values from Cube ####
        inputVar = self.obtainValues(inputVarName, flatten = True) 

        #### Calculate Variance of Variable Values ####
        yVar = inputVar.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if self.numObs < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if inputVar.dtype != NUM.float64 and inputVar.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Create Hot Spot Progessor ####
        msg = ARCPY.GetIDMessage(84696)
        ARCPY.SetProgressor("default", msg)

        #### Create Panel Info Structure ####
        panelInfo = ARC._ss.PanelInfo(self.numTime, self.numLocations)

        #### Running Time-Series Distances ####
        if dissimilarityMethod == "VALUE":
            results = panelInfo.get_ts_value_dist(inputVar)
        elif dissimilarityMethod == "PROFILE":
            results = panelInfo.get_ts_cosine_dist(inputVar)
            #### Check for Flat Signal and Error Out ####
            nanInds = NUM.isnan(results[0])
            if NUM.any(nanInds):
                ARCPY.AddIDMessage("ERROR", 110215)
                raise SystemExit()

        elif dissimilarityMethod == "CORRELATION":
            results = panelInfo.get_ts_correlation_dist(inputVar)
        elif dissimilarityMethod == "VALUE_AND_CORRELATION":
            results = panelInfo.get_ts_corr_and_value_dist(inputVar)
        elif dissimilarityMethod == "COMPLEXITY":
            inputVar = self.obtainValues(inputVarName, flatten = False) 
            results = CUTILS.timeSeriesComplexity(inputVar)
        else:
            ARCPY.AddError("Dissim Method = {0} has not be coded yet!".format(dissimilarityMethod))
            raise SystemExit()

        if results is None:
            #### No Window Variation ####
            raise SystemExit()

        #### Set Distance Matrix ####
        if type(results) is tuple:
            results = results[0]
        distMat = results.reshape(self.numLocations, self.numLocations)

        #### Estimate Number of Groups ####
        if numClusters is None:
            #### Run Spectral Gap with Progress/Messages ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84763))
            numClusters, valid = STATS.spectralOptimalK(distMat)
            if valid:
                ARCPY.AddMessage("\n"+ARCPY.GetIDMessage(84808).format(numClusters))
            else:
                ARCPY.AddIDMessage("ERROR", 110191, numClusters)
                self.close()
                raise SystemExit()

        #### Set Attribute for Post Analysis Retrieval ####
        self.numClusters = numClusters

        #### Get Initial Seeds ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84259))
        randSeed = UTILS.getRandomSeed()
        seeds = ARC._ss.kmeans_plus_plus(distMat, numClusters, random_seed = randSeed)

        #### Run KMeans/KMedoids ####
        if clusterMethod == "K_MEDOIDS":
            locationClusters, centerIDs, iters = ARC._ss.py_kmedoids_solve(distMat, seeds)
        else:
            locationClusters, iters = ARC._ss.kmeans_solve_2(distMat, seeds)

        #### Deal with Possible Empty Clusters ####
        locationClusters, numUnique = STATS.remapClusters(locationClusters, self.numClusters)
        if numUnique != self.numClusters:
            ARCPY.AddIDMessage("WARNING", 110134, numUnique)
            self.numClusters = numUnique

        if self.numClusters < 2:
            ARCPY.AddIDMessage("ERROR", 110128, 2)
            raise SystemExit()

        #### Add One to Cluster IDs ####
        locationClusters = locationClusters + 1

        #### Create Cluster Centers ####
        centers = NUM.zeros((len(locationClusters,)), dtype = NUM.int32)
        centers[centerIDs] = 1

        ##### Initial Cube Report ####
        outputTable = self.generalCubeReport()

        #### Add Cluster-Outlier Variables to Existing Cube ####
        self.append(outputVarName + "_CLUSTER", locationClusters)
        self.append(outputVarName + "_CENTER", centers)
        numThreads = UTILS.getNumberOfThreadsDefault()

        #### Time-Series Trend Table ####
        self.setTimeSeriesOfClusters(inputVarName)
        mkVals = NUM.zeros((self.numClusters,), dtype = float)
        mkPVals = NUM.zeros((self.numClusters,), dtype = float)
        for ind in range(self.numClusters):
            timeSeries = self.meanPerCluster[ind] 
            mkVal, mkPVal = ARC._ss.mann_kendall(timeSeries, 2, None, numThreads )
            mkVals[ind] = mkVal
            mkPVals[ind] = mkPVal

        trendTable = CUTILS.timeSeriesTrendReport(mkVals, mkPVals)
        outputTable += "\n" + trendTable

        ARCPY.AddMessage(outputTable)

    def addOtherForecastVariables(self, forecastObject, listOtherVariables):
        if listOtherVariables is not None:
            for ind, inputVar in enumerate(listOtherVariables):
                baseData = forecastObject.otherPredictions[ind]
                self.append(inputVar, baseData) 

    def addForecastVariables(self, forecastObject, inputVar, listOtherVariables = None):

        #### Var and Mask Name Strings ####
        varNameStr = "FORECAST_" + inputVar + "_{0}"

        #### Append Variables ####
        mainVarNames = [inputVar, "FIT", "RMSE", "METHOD", "SEASON", "HIGH", "LOW"]
        mainData = [forecastObject.rawForecast, forecastObject.fitForecast, 
                    forecastObject.rmse, forecastObject.methodInts,
                    forecastObject.seasonInt, forecastObject.highIntervals,
                    forecastObject.lowIntervals]

        #### Add other variables ####
        if listOtherVariables is not None:
            self.addOtherForecastVariables(forecastObject,listOtherVariables)

        #### Append Validation Variables ####
        if forecastObject.doValidation:
            mainVarNames += ["VALIDRMSE"]
            mainData += [forecastObject.validationRMSE]

        #### Add Components for Holt Winters ####
        if forecastObject.forecastType == 1:
            mainVarNames += ["LEVELCOMP", "TRENDCOMP", "SEASONCOMP" ]
            mainData += [forecastObject.levelComponents, forecastObject.trendComponents,
                         forecastObject.seasonComponents]
        
        #### Add Curve Coefficients ####
        if forecastObject.forecastType == 3:
            mainVarNames += ["COEF{0}".format(i) for i in range(4)]
            mainData += [forecastObject.finalCoef[:,0], forecastObject.finalCoef[:,1],
                         forecastObject.finalCoef[:,2], forecastObject.finalCoef[:,3]]

        #### Add Outliers ####
        if forecastObject.outlierOption is not None:
            mainVarNames.append("OUTLIER")
            mainData.append(NUM.array(forecastObject.outliers, dtype = NUM.int32))

        for ind, varName in enumerate(mainVarNames):
            if ind:
                outputVarName = varNameStr.format(varName)
            else:
                outputVarName = varName
            self.append(outputVarName, mainData[ind])

    ################## Output Methods ################

    def getTimeSeriesOfClusters(self, varName):
        """Creates mean of time series based on given clusters.

        INPUTS:
        varName (str): name of variable
        """

        inputVar = self.obtainValues(varName, flatten = False).T
        clusters = self.obtainValues("TSCLUST_" + varName + "_CLUSTER")
        uniqueClusters = NUM.arange(1, clusters.max() + 1, dtype = NUM.int32)
        numClusters = len(uniqueClusters)
        meanPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        minPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        maxPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        for ind, cluster in enumerate(uniqueClusters):
            w = NUM.where(clusters == cluster)
            clusterData = inputVar[w]
            meanPerCluster[ind] = clusterData.mean(0)
            minPerCluster[ind] = clusterData.min(0)
            maxPerCluster[ind] = clusterData.max(0)

        return meanPerCluster, minPerCluster, maxPerCluster

    def setTimeSeriesOfClusters(self, varName):
        """Creates and sets mean of time series based on given clusters.

        INPUTS:
        varName (str): name of variable
        """

        tsInfo = self.getTimeSeriesOfClusters(varName)
        self.meanPerCluster = tsInfo[0]
        self.minPerCluster = tsInfo[1]
        self.maxPerCluster = tsInfo[2]
        self.tsClusterVar = varName

    def getOutputSpatialRef(self, outputFC):
        #### Read All the Necessary Info from Cube ####
        cubeSpatialRef = ARCPY.SpatialReference()
        cubeSpatialRef.loadFromString(self.dataset.raw_pe_string)
        outSpatialRef = UTILS.returnOutputSpatialRef(cubeSpatialRef,
                                                     outputFC = outputFC)

        #### Check if Two Projections are Identical ####
        if cubeSpatialRef.name == outSpatialRef.name:
            return cubeSpatialRef, cubeSpatialRef, True
        else:
            #### Test for Transformations ####
            canProj = UTILS.canProjectExtent(self.extent, outSpatialRef)
            if canProj:
                #### Warning for Different Spatial Ref ####
                ARCPY.AddIDMessage("WARNING", 110056, cubeSpatialRef.name,
                                                       outSpatialRef.name)
                return outSpatialRef, cubeSpatialRef, False
            else:
                #### Test Whether Going to Feature Dataset ####
                dirName = OS.path.dirname(outputFC)
                descDir = ARCPY.Describe(dirName)
                dirType = descDir.DataType
                if dirType == "FeatureDataset":
                    ARCPY.AddIDMessage("ERROR", 110060, cubeSpatialRef.name,
                                                         outSpatialRef.name)
                    self.close()
                    raise SystemExit()
                else:
                    explicitSpatialRef = ARCPY.SpatialReference(3857)
                    ARCPY.AddIDMessage("WARNING", 110061)
                    return explicitSpatialRef, cubeSpatialRef, False

    def exagDecision(self, scalePercent = .2):
        """
        Method to help make exaggration decision
        """

        #### ******* NOTE ******* ####
        #### Uncomment Try/Except for Larger Exaggeration ####
        #try:
        #    xy = NUM.zeros((self.numLocations,2), float)
        #    xy[:,0] = self.x
        #    xy[:,1] = self.y
        #    nn = UTILS.NearestNeighborInfo(xy, self.extent)
        #    info = nn.getNearestNeighborInfo()
        #    decision = scalePercent * float(info[0])
        #except:
        #    decision = scalePercent * (self.maxExtent / 100.)
        ###############################

        decision = scalePercent * (self.maxExtent / 100.)

        return decision

    def getLocationFields(self, varMask = None, isSubset = False, nSubsetLoc = None):

        #### Set Up Analysis Mask and Output Name ####
        useMask = varMask is not None

        #### Get Location Info ####
        if isSubset:
            if nSubsetLoc is not None:
                locations = NUM.arange(0, nSubsetLoc, 1)
            else:
                locations = NUM.arange(0, self.numLocations, 1)
            locationLabels = self.locationLabel[0][varMask]
            useMask = False
        else:
            locations = self.location[0]
            locationLabels = self.locationLabel[0]

        if useMask:
            locations = locations[varMask]
            locationLabels = locationLabels[varMask]

        #### Add Location Field ####
        locationField = SSDO.CandidateField("LOCATION", "LONG",
                                            data = locations,
                                            alias = "Location ID")

        #### Add Location Label Field ####
        if self.locationIDField.upper() in ["LOCATION", "SHAPE", "OBJECTID"]:
            locationLabel = self.locationIDField + "0"
        else:
            locationLabel = self.locationIDField

        if locationLabels.dtype == 'int32':
            outType = "LONG"
        else:
            outType = "BIGINTEGER"
        locationLabel = SSDO.CandidateField(locationLabel, outType,
                                            data = locationLabels,
                                            alias = self.locationIDField)

        return locationField, locationLabel

    def getLocationLabelStr(self, varMask = None):

        #### Set Up Analysis Mask and Output Name ####
        useMask = varMask is not None
        if "location_label" in self.dataset.variables:
            locationLabelStr = self.dataset.variables["location_label"][:]

            if useMask and  len(varMask) != len(locationLabelStr):
                ARCPY.AddIDMessage("WARNING", 110027)
                return None

            #### Get Location Info ####
            if useMask:
                locationLabelStr = locationLabelStr[varMask]
            
            checkSize = NUM.vectorize(len)
            sizes = checkSize(locationLabelStr)
            maxSize  = sizes.max()

            #### Add Location Field ####
            locationField = SSDO.CandidateField("LOC_LABEL", "TEXT",
                                                data =  NUM.array(locationLabelStr, dtype="U"+str(maxSize)),
                                                length = int(maxSize),
                                                alias = "Location Label")

            return locationField
        return None

    def trendFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(varName)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get Trend Field Names ####
        suffix = ['_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [varName + suff for suff in suffix]

        #### Get Trend Data ####
        mk_zData = self.obtainValues(varNames[0])[varMask]
        mk_pvData = self.obtainValues(varNames[1])[varMask]
        mk_binData = self.obtainValues(varNames[2])[varMask]

        alias = UTILS.formatString("Trend z-score ({0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_Z", "DOUBLE",
                                             data = mk_zData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend p-value ({0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_P", "DOUBLE",
                                             data = mk_pvData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend Bin ({0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_BIN", "LONG",
                                             data = mk_binData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def varOutputFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(varName)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Make Candidate Field ####
        data = self.obtainValues(varName)[varMask]
        if data.dtype == float:
            outType = "DOUBLE"
        else:
            outType = "LONG"
        validName = UTILS.getValidAggregateFieldName(varName, outPath)
        candidateField = SSDO.CandidateField(validName, outType,
                                             data = data,
                                             alias = varName)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def varOutputTimeFields2D(self, outputFC, varName, listTimeSteps):
        """ Get Each Time Step as a Field 
        INPUT:
            outputFC (str): Output Feature Class Path
            varName (str): Cube variable name
            listTimeSteps (list): Index time steps 
        RETURN:
            list: List Candidate Fields
        """
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(varName)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Make Candidate Field ####
        data = self.obtainValues(varName)

        if data.dtype == float:
            outType = "DOUBLE"
        else:
            outType = "LONG"

        startTimes, endTimes = self.getOutputTimeFieldInfo()


        for index in listTimeSteps:
            dataStep = data[index].ravel()
            varNameForecast = "FRCST_{0}".format(index)
            validName = UTILS.getValidAggregateFieldName(varNameForecast, outPath)
            candidateField = SSDO.CandidateField(varNameForecast, outType,
                                                 data = dataStep,
                                                 alias = "{0}/{1}".format(startTimes[index],endTimes[index]))
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def hotSpotTrendFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "EMERGING_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)
            
        #### Get All Output Var Names ####
        suffix = ['_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [prefix + suff for suff in suffix]

        #### Create Candidate Fields ####
        mk_zData = self.obtainValues(varNames[0])[varMask]
        mk_pvData = self.obtainValues(varNames[1])[varMask]
        mk_binData = self.obtainValues(varNames[2])[varMask]

        alias = UTILS.formatString("Trend z-score (Hot Spots of {0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_Z", "DOUBLE",
                                             data = mk_zData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend p-value (Hot Spots of {0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_P", "DOUBLE",
                                             data = mk_pvData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend Bin (Hot Spots of {0})").format(varName)
        candidateField = SSDO.CandidateField("TREND_BIN", "LONG",
                                             data = mk_binData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def clusterOutlierFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Get Emerging Prefix ####
        prefix = "OUTLIER_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)       

        #### Get All Output Var Names ####
        binVarName = prefix + '_TYPE'
        noSpatName = prefix + "_HAS_SPATIAL_NEIGHBORS"

        #### Get Data ####
        binData = self.obtainValues(binVarName).T[varMask].T
        data = self.obtainValues(varName).T[varMask].T
        noNeighData = self.obtainValues(noSpatName)[varMask]
        noNeighData = noNeighData == 0

        #### Remove First Time Slice ####
        binData = binData[1:]

        #### Base Data/Info ####
        T = self.numTime * 1.0
        lessT = T - 1.0

        #### Location Based Sums of Categories ####
        numAny = binData != 0
        numHH = (binData == 1).sum(0)
        numLL = (binData == 3).sum(0)
        bin2 = (binData == 2)
        bin4 = (binData == 4)
        numLH = bin2.sum(0)
        numHL = bin4.sum(0)
        numOut = numLH + numHL

        #### Percentages ####
        percOut = (numOut / lessT) * 100.
        percLL = (numLL / lessT) * 100.
        percLH = (numLH / lessT) * 100.
        percHH = (numHH / lessT) * 100.
        percHL = (numHL / lessT) * 100.

        #### Time Based Sums of Categories
        timeLH = bin2.sum(1)
        timeHL = bin4.sum(1)

        #### Set Single and More Than One Cat ####
        typeDataInd = NUM.zeros((numOutLocations,), dtype = NUM.int32)
        sumData = NUM.zeros((numOutLocations, 4), dtype = bool)
        sumData[:,0] = numHH > 0
        sumData[:,1] = numLH > 0
        sumData[:,2] = numLL > 0
        sumData[:,3] = numHL > 0
        sumCats = sumData.sum(1)

        #### Single Cat ####
        onlyOneCat = sumCats == 1
        typeDataInd[onlyOneCat] = sumData[onlyOneCat].argmax(1) + 1

        #### Multiple Cat ####
        moreThanOneCat = sumCats > 1
        typeDataInd[moreThanOneCat] = 5

        #### String Categories ####
        typeData = NUM.empty((numOutLocations,), dtype = '<U22')
        lastData = NUM.zeros((numOutLocations), dtype = '<U16')

        for i in UTILS.ssRange(numOutLocations):
            lastValue = binData[-1, i]
            if lastValue in [2,4]:
                lastData[i] = CUTILS.coLastDict[lastValue]
            typeData[i] = CUTILS.coTypeDict[typeDataInd[i]]

        #### Data Summary ####
        sumData = data.sum(0)
        minData = data.min(0)
        maxData = data.max(0)
        meanData = data.mean(0)
        stdData = data.std(0)
        medData = CUTILS.getPercentile(data, percValue = 50, axis = 0)

        #### Create Output Candidate Fields ####
        alias = UTILS.formatString("Number of Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("NUM_OUT", "LONG",
                                             data = numOut,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percentage of Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("PERC_OUT", "DOUBLE",
                                             data = percOut,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Number of Low Clusters {0}").format(varName)
        candidateField = SSDO.CandidateField("N_LOW_CLS", "LONG",
                                             data = numLL,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percentage of Low Clusters {0}").format(varName)
        candidateField = SSDO.CandidateField("P_LOW_CLS", "DOUBLE",
                                             data = percLL,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Number of Low Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("N_LOW_OUT", "LONG",
                                             data = numLH,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percentage of Low Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("P_LOW_OUT", "DOUBLE",
                                             data = percLH,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Number of High Clusters {0}").format(varName)
        candidateField = SSDO.CandidateField("N_HIGH_CLS", "LONG",
                                             data = numHH,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percentage of High Clusters {0}").format(varName)
        candidateField = SSDO.CandidateField("P_HIGH_CLS", "DOUBLE",
                                             data = percHH,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Number of High Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("N_HIGH_OUT", "LONG",
                                             data = numHL,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percentage of High Outliers {0}").format(varName)
        candidateField = SSDO.CandidateField("P_HIGH_OUT", "DOUBLE",
                                             data = percHL,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("No Spatial Neighbors {0}").format(varName)
        candidateField = SSDO.CandidateField("NO_SP_NBR", "LONG",
                                             data = noNeighData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Outlier in Most Recent Time Step {0}").format(varName)
        candidateField = SSDO.CandidateField("OUT_R_TIME", "TEXT",
                                             data = lastData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Cluster Outlier Type {0}").format(varName)
        candidateField = SSDO.CandidateField("CO_TYPE", "TEXT",
                                             data = typeData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        fieldPref = ["SUM", "MIN", "MAX", "MEAN", "STD", "MED"]
        fieldAlias = ["Sum {0}", "Min {0}", "Max {0}", "Mean {0}",
                      "Standard Deviation {0}", "Median {0}"]
        fieldData = [sumData, minData, maxData, meanData, stdData, medData]
        for ind, prefix in enumerate(fieldPref):
            alias = fieldAlias[ind].format(varName)
            fieldName = prefix + "_VALUE"
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE",
                                                 data = fieldData[ind],
                                                 alias = alias)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def emergingOutputFields2D(self, outputFC, varName):

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Get Emerging Prefix ####
        prefix = "EMERGING_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Set Number of Non-Masked Output ####
        numOutLocations = varMask.sum()

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get All Output Var Names ####
        suffix = ['_CATEGORY', '_PATTERN', '_HS_BIN',
                  '_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [prefix + suff for suff in suffix]

        #### Base Data/Info ####
        T = self.numTime * 1.0
        data = self.obtainValues(varName)
        allHSBinData = self.obtainValues(varNames[2])
        mk_zData = self.obtainValues(varNames[3])[varMask]
        mk_pvData = self.obtainValues(varNames[4])[varMask]
        mk_binData = self.obtainValues(varNames[5])[varMask]

        #### Category ####
        catData = self.obtainValues(varNames[0])
        candidateField = SSDO.CandidateField("CATEGORY", "LONG",
                                             data = catData[varMask],
                                             alias = "Category")
        candidateFieldList.append(candidateField)

        #### Calculate Pattern, Percent Hot/Cold, Trend and Stats ####
        patData = NUM.empty((numOutLocations,), dtype = '<U22')
        hotData = NUM.empty((numOutLocations,), dtype = float)
        coldData = NUM.empty((numOutLocations,), dtype = float)
        minData = NUM.empty((numOutLocations,), dtype = float)
        maxData = NUM.empty((numOutLocations,), dtype = float)
        sumData = NUM.empty((numOutLocations,), dtype = float)
        meanData = NUM.empty((numOutLocations,), dtype = float)
        stdData = NUM.empty((numOutLocations,), dtype = float)
        medData = NUM.empty((numOutLocations,), dtype = float)
        for ind in UTILS.ssRange(self.numLocations):
            patData[ind] = CUTILS.categoryDict[catData.item(ind)]
            binData = allHSBinData[:, ind]
            hotData[ind] = ((binData >= 1).sum() / T) * 100
            coldData[ind] = ((binData <= -1).sum() / T) * 100
            if varMask[ind]:
                baseData = data[:, ind]
                minData[ind] = baseData.min()
                maxData[ind] = baseData.max()
                sumData[ind] = baseData.sum()
                meanData[ind] = baseData.mean()
                stdData[ind] = baseData.std()
                medData[ind] = CUTILS.getPercentile(baseData, percValue = 50)
            else:
                minData[ind] = 0.0
                maxData[ind] = 0.0
                sumData[ind] = 0.0
                meanData[ind] = 0.0
                stdData[ind] = 0.0
                medData[ind] = 0.0

        #### Create Candidate Fields ####
        alias = UTILS.formatString("Pattern Type {0}").format(varName)
        candidateField = SSDO.CandidateField("PATTERN", "TEXT",
                                             data = patData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        candidateField = SSDO.CandidateField("PERC_HOT", "DOUBLE",
                                             data = hotData,
                                             alias = "Percent Significant Hot Spot")
        candidateFieldList.append(candidateField)

        candidateField = SSDO.CandidateField("PERC_COLD", "DOUBLE",
                                             data = coldData,
                                             alias = "Percent Significant Cold Spot")
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend z-score {0}").format(varName)
        candidateField = SSDO.CandidateField("TREND_Z", "DOUBLE",
                                             data = mk_zData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend p-value {0}").format(varName)
        candidateField = SSDO.CandidateField("TREND_P", "DOUBLE",
                                             data = mk_pvData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend bin {0}").format(varName)
        candidateField = SSDO.CandidateField("TREND_BIN", "DOUBLE",
                                             data = mk_binData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        fieldPref = ["SUM", "MIN", "MAX", "MEAN", "STD", "MED"]
        fieldAlias = ["Sum {0}", "Min {0}", "Max {0}", "Mean {0}",
                      "Standard Deviation {0}", "Median {0}"]
        fieldData = [sumData, minData, maxData, meanData, stdData, medData]
        for ind, prefix in enumerate(fieldPref):
            alias = fieldAlias[ind].format(varName)
            fieldName = prefix + "_VALUE"
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE",
                                                 data = fieldData[ind],
                                                 alias = alias)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def timeSeriesClusterFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "TSCLUST_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get All Output Var Names ####
        suffix = ['_CLUSTER', '_CENTER']
        varNames = [prefix + suff for suff in suffix]

        #### Create Candidate Fields ####
        clusterData = self.obtainValues(varNames[0])

        alias = UTILS.formatString("Time-Series Cluster ID").format(varName)
        candidateField = SSDO.CandidateField("CLUSTER_ID", "LONG",
                                             data = clusterData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        centerData = self.obtainValues(varNames[1])

        alias = UTILS.formatString("Time-Series Cluster Representative").format(varName)
        candidateField = SSDO.CandidateField("CENTER_REP", "LONG",
                                             data = centerData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def forecastOutputFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)
        isShp = UTILS.isShapeFile(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "FORECAST_" + varName 

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get All Output Var Names ####
        suffix = ['_HIGH', '_LOW', '_RMSE', '_SEASON', '_METHOD']
        hasValidation = False
        try:
            if self.dataset.has_validation == "TRUE":
                suffix.append("_VALIDRMSE")
                hasValidation = True
        except:
            pass

        varNames = [prefix + suff for suff in suffix]
        varNames = [varName] + varNames

        #### Create Time Strings ####
        startPredTime = int(self.dataset.begin_forecast_bin)
        timeIndList = list(range(startPredTime, self.numTime))
        startTimes, endTimes = self.getOutputTimeFieldInfo()
        if self.isStartTime:
            useTimes = startTimes
        else:
            useTimes = endTimes

        timeStr = []
        for predTime in range(startPredTime, self.numTime):
            timeStr.append(TUTILS.dateTime2String(useTimes[predTime]))

        #### Create Forecast Candidate Field ####
        data = self.obtainValues(varNames[0])
        for ind, predTime in enumerate(timeIndList):
            time = timeStr[ind]
            alias = "Forecast for {0} in {1}".format(varName, time)
            candidateField = SSDO.CandidateField("FCAST_{0}".format(ind+1), "DOUBLE",
                                                 data = data[predTime],
                                                 alias = alias)
            candidateFieldList.append(candidateField)

        #### Create High/Low Candidate Field ####
        highData = self.obtainValues(varNames[1])

        #### Check if All NULL ####
        allData = highData[startPredTime:, :].ravel()
        if NUM.isnan(allData).sum() != len(allData):
            lowData = self.obtainValues(varNames[2])

            for ind, predTime in enumerate(timeIndList):
                time = timeStr[ind]
                alias = "High Interval for {0} in {1}".format(varName, time)
                data = highData[predTime]
                if isShp:
                    data[NUM.isnan(data)] = UTILS.shpFileNull["DOUBLE"]
                candidateFieldH = SSDO.CandidateField("HIGH_{0}".format(ind+1), "DOUBLE",
                                                     data = data,
                                                     alias = alias,
                                                     checkNullValues = True)


                alias = "Low Interval for {0} in {1}".format(varName, time)
                data1 = lowData[predTime]
                if isShp:
                    data1[NUM.isnan(data1)] = UTILS.shpFileNull["DOUBLE"]
                candidateFieldL = SSDO.CandidateField("LOW_{0}".format(ind+1), "DOUBLE",
                                                     data = data1,
                                                     alias = alias,
                                                     checkNullValues = True)
                #### When all values are equals - No CI at all ####
                if not NUM.allclose(candidateFieldH.data,candidateFieldL.data):
                    candidateFieldList.append(candidateFieldH)
                    candidateFieldList.append(candidateFieldL)

        #### RMSE ####
        data = self.obtainValues(varNames[3])
        alias = "Forecast Root Mean Square Error"
        candidateField = SSDO.CandidateField("F_RMSE", "DOUBLE", data = data, alias = alias)
        candidateFieldList.append(candidateField)

        #### Validation RMSE ####
        if hasValidation:
            data = self.obtainValues(varNames[-1])
            if hasattr(self.dataset, 'validation_size'):
                vs = self.dataset.validation_size
                alias = "Validation Root Mean Square Error (Validation Steps: {0})".format(vs)
            else:
                alias = "Validation Root Mean Square Error"
            candidateField = SSDO.CandidateField("V_RMSE", "DOUBLE", data = data, alias = alias)
            candidateFieldList.append(candidateField)

        #### Get Methods ####
        import json as JSON
        stC = self.dataset.json_method_str
        if stC[-1] != "}":
            stC += "}"
        methodDict = JSON.loads(stC)
        data = self.obtainValues(varNames[5])
        methodArray = NUM.array([methodDict[str(i)] for i in data])
        maxSizeMethod = int(NUM.max(NUM.array([len(methodDict[str(i)]) for i in data])))

        #### Change Field Length When It Exceeds the Default Length ####
        if maxSizeMethod < 255:
            maxSizeMethod = None

        #### Seasons ####
        candidateFieldList += CUTILS.createSeasonFields(self, varNames[4], methodArray)

        #### Methods ####
        alias = "Forecast Method"
        candidateField = SSDO.CandidateField("METHOD", "TEXT", data = methodArray, alias = alias, length = maxSizeMethod)
        candidateFieldList.append(candidateField)

        #### Curve Fit Equation Field ####
        if hasattr(self.dataset, 'forecast_type'):
            forecastType = int(self.dataset.forecast_type)

            if forecastType == 3:
                suffix = [ '_COEF{0}'.format(i) for i in range(4) ]
                eqVarNames = [prefix + suff for suff in suffix]
                candidateFieldList += CUTILS.createCurveEquationField(self, eqVarNames, methodArray)

        #### Outliers ####
        if prefix + "_OUTLIER" in self.dataset.variables:
            outlierName = prefix + "_OUTLIER"
            data = self.obtainValues(outlierName).sum(0)
            alias = "Number of Model Fit Outliers"
            candidateField = SSDO.CandidateField("N_OUTLIERS", "LONG", data = data, alias = alias)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def estimatedBins2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields()
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = None)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get Estimated Results ####
        T = self.numTime * 1.0
        mask = self.obtainMask('PREDICTION_BINARY_MASK')
        if mask is None:
            sumData = NUM.zeros((self.numLocations,), dtype = NUM.int32)
            percData = NUM.zeros((self.numLocations,), dtype = float)
        else:
            mask = mask.reshape(self.numTime, self.numLocations)
            sumData = mask.sum(0)
            percData = (sumData / T) * 100.

        #### Create Candidate Fields ####
        alias = UTILS.formatString("Number of estimated bins ({0})").format(varName)
        candidateField = SSDO.CandidateField("SUM_EST", "LONG",
                                             data = sumData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Percent of estimated bins ({0})").format(varName)
        candidateField = SSDO.CandidateField("PERC_EST", "DOUBLE",
                                             data = percData,
                                             alias = alias)
        candidateFieldList.append(candidateField)
        return candidateFieldList

    def timeSeriesCorrelationFields2D(self, outputFC, varName):
        import SSTimeSeriesCorrelation as TSCORR

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        check_null = UTILS.isGDB(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        # varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "TSCORR_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        #### Get All Output Var Names ####
        varNames = [TSCORR.FN_abs_max_cor, TSCORR.FN_abs_max_lag,
                    TSCORR.FN_max_cor, TSCORR.FN_max_lag,
                    TSCORR.FN_min_cor, TSCORR.FN_min_lag]
        varNamesFull = [prefix + f"_{fn}" for fn in varNames]
        varAlias = [TSCORR.FA_abs_max_cor, TSCORR.FA_abs_max_lag,
                    TSCORR.FA_max_cor, TSCORR.FA_max_lag,
                    TSCORR.FA_min_cor, TSCORR.FA_min_lag]

        #### Create Candidate Fields ####

        for ind, varname in enumerate(varNamesFull):
            if not varname in self.dataset.variables:
                continue
            data = self.obtainValues(varname)[varMask]
            alias = varAlias[ind]
            dataType = "DOUBLE"
            if varname.endswith("LAG"):
                dataType = "LONG"
                candidateField = SSDO.CandidateField(varNames[ind], dataType,
                                                     data=data, alias=alias,
                                                     int_min_as_null=TSCORR.INT_NULL,
                                                     checkNullValues=check_null)
            else:
                candidateField = SSDO.CandidateField(varNames[ind], dataType,
                                                     data=data, alias=alias)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def getElementFields(self, tiledMask = None):
        elements = NUM.arange(self.numObs, dtype = NUM.int32)
        locations = self.location.ravel()
        locationLabels = self.locationLabel.ravel()

        if tiledMask is not None:
            elements = elements[tiledMask]
            locations = locations[tiledMask]
            locationLabels = locationLabels[tiledMask]

        #### Add Element Field ####
        elementField = SSDO.CandidateField("ELEMENT", "LONG",
                                           data = elements,
                                           alias = "Element")

        #### Add Location Field ####
        locationField = SSDO.CandidateField("LOCATION", "LONG",
                                            data = locations,
                                            alias = "Location ID")

        #### Add Location Label Field ####
        outLocation = self.locationIDField
        outAlias = outLocation
        if outLocation.upper() in ["LOCATION", "SHAPE", "OBJECTID"]:
            outLocation += "0"
            outAlias = "Input Location ID"

        if locationLabels.dtype == 'int32':
            outType = "LONG"
        else:
            outType = "BIGINTEGER"
        locationLabel = SSDO.CandidateField(outLocation, outType,
                                            data = locationLabels,
                                            alias = outAlias)

        return elementField, locationField, locationLabel

    def getElementLocationStr(self, tiledMask = None):
    
        #### Set Up Analysis Mask and Output Name ####
        if "location_label" in self.dataset.variables:
            locationLabelStr = self.dataset.variables["location_label"][:]
 
            checkSize = NUM.vectorize(len)
            sizes = checkSize(locationLabelStr)
            maxSize  = sizes.max()

 
            locationLabelStr3D = NUM.tile(locationLabelStr, (self.numTime,1)).ravel()

            if tiledMask is not None:
                locationLabelStr3D = locationLabelStr3D[tiledMask]

            #### Add Location Field ####
            locationField = SSDO.CandidateField("LOC_LABEL", "TEXT",
                                                data =  NUM.array(locationLabelStr3D, dtype="U"+str(maxSize)),
                                                length = int(maxSize),
                                                alias = "Location Label")

            return locationField

    def temporalAggregation3D(self, outputFC):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable("TEMPORAL_AGGREGATION_COUNT")

        #### Create Field Info ####
        candidateFieldList = []

        #### Get Variable Data ####
        data = self.obtainValues(varName)

        #### Assure 3-D Variable ####
        if len(data.shape) != 2:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = None)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = None)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        elementData = elementField.data

        #### Create Variable Candidate Field ####
        alias = "Temporal Aggregation Count"
        candidateField = SSDO.CandidateField("VALUE", "DOUBLE",
                                             data = data.ravel(),
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def createBase3DVariable(self, varName, tiledMask, varID = ""):
        #### Get Variable Data ####
        data = self.obtainValues(varName, flatten = True)[tiledMask]

        #### Set Output Type ####
        if data.dtype == float:
            outType = "DOUBLE"
        else:
            outType = "LONG"

        #### Create Variable Candidate Field ####
        outName = "VALUE{0}".format(varID)
        candidateField = SSDO.CandidateField(outName, outType,
                                             data = data,
                                             alias = varName)

        return candidateField

    def hotSpotResults3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "EMERGING_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            tiledMask = NUM.ones((self.numObs,), dtype = bool)
        else:
            tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)
        
        elementData = elementField.data

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        candidateFieldList.append(baseVar)

        #### Get All Output Var Names ####
        suffix = ['_HS_ZSCORE', '_HS_PVALUE', '_HS_BIN']
        varNames = [prefix + suff for suff in suffix]
        zData = self.obtainValues(varNames[0], flatten = True)[tiledMask]
        pvData = self.obtainValues(varNames[1], flatten = True)[tiledMask]
        binData = self.obtainValues(varNames[2], flatten = True)[tiledMask]

        #### Create Candidate Fields ####
        candidateFieldList += CUTILS.createHotSpot3DFields(varName, zData, 
                                                           pvData, binData)

        return candidateFieldList

    def localOutlierResults3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "OUTLIER_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            tiledMask = NUM.ones((self.numObs,), dtype = bool)
        else:
            tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)
        
        elementData = elementField.data

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        candidateFieldList.append(baseVar)

        #### Get All Output Var Names ####
        suffix = ['_INDEX', '_PVALUE', '_TYPE']
        varNames = [prefix + suff for suff in suffix]
        iData = self.obtainValues(varNames[0], flatten = True)[tiledMask]
        pvData = self.obtainValues(varNames[1], flatten = True)[tiledMask]
        binData = self.obtainValues(varNames[2], flatten = True)[tiledMask]

        #### New Spatial Lag Plot Variables ####
        lagSuffix = ['_ZTRAN', '_LAG']
        lagNames = [prefix + suff for suff in lagSuffix]
        varList = self.obtainVariableList()
        if lagNames[0] in varList:
            varNames += lagNames
            zData = self.obtainValues(varNames[3], flatten = True)[tiledMask]
            lagData = self.obtainValues(varNames[4], flatten = True)[tiledMask]

            #### Remove Masks for NaN Conversion ####
            if hasattr(zData, 'mask'):
                zData = zData.data

            if hasattr(lagData, 'mask'):
                lagData = lagData.data

            #### Change -5555 to NaN for Moran Chart ####
            n5555 = zData == -5555.
            zData[n5555] = NUM.nan
            lagData[n5555] = NUM.nan

        else:
            zData = None
            lagData = None

        #### Create Candidate Fields ####
        candidateFieldList += CUTILS.createLocalOutlier3DFields(varName, iData, pvData, 
                                                                binData, zData, lagData)

        return candidateFieldList

    def forecastResults3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "FORECAST_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            tiledMask = NUM.ones((self.numObs,), dtype = bool)
        else:
            tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)
        
        elementData = elementField.data

        #### Get All Output Var Names ####
        rawData = self.obtainValues(varName, flatten = True)[tiledMask]
        fitData = self.obtainValues(prefix + "_FIT", flatten = True)[tiledMask]
        highData = None
        lowData = None
        levelData = None
        trendData = None
        seasonData = None
        if hasattr(self.dataset, 'forecast_type'):
            forecastType = int(self.dataset.forecast_type)
            if forecastType <= 2:
                highData = self.obtainValues(prefix + "_HIGH", flatten = True)[tiledMask]
                lowData = self.obtainValues(prefix + "_LOW", flatten = True)[tiledMask]

            if forecastType == 1:
                if prefix + "_LEVELCOMP" in self.dataset.variables:
                    levelData = self.obtainValues(prefix + "_LEVELCOMP", flatten = True)[tiledMask]
                    trendData = self.obtainValues(prefix + "_TRENDCOMP", flatten = True)[tiledMask]
                    seasonData = self.obtainValues(prefix + "_SEASONCOMP", flatten = True)[tiledMask]

        #### Create Candidate Fields ####
        candidateFieldList += CUTILS.createForecast3DFields(varName, rawData, fitData, 
                                                            highData = highData, lowData = lowData,
                                                            levelData = levelData, trendData = trendData,
                                                            seasonData = seasonData)

        #### Outliers ####
        if prefix + "_OUTLIER" in self.dataset.variables:
            outlierName = prefix + "_OUTLIER"
            data = self.obtainValues(outlierName, flatten = True)[tiledMask]
            alias = "Model Fit Outliers"
            candidateField = SSDO.CandidateField("OUTLIER", "LONG", data = data, alias = alias)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def outlierResults3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "FORECAST_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            tiledMask = NUM.ones((self.numObs,), dtype = bool)
        else:
            tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)       
        
        elementData = elementField.data

        #### Get All Output Var Names ####
        rawData = self.obtainValues(varName, flatten = True)[tiledMask]
        fitData = self.obtainValues(prefix + "_FIT", flatten = True)[tiledMask]
        highData = None
        lowData = None
        levelData = None
        trendData = None
        seasonData = None
        if hasattr(self.dataset, 'forecast_type'):
            forecastType = int(self.dataset.forecast_type)
            if forecastType <= 2:
                highData = self.obtainValues(prefix + "_HIGH", flatten = True)[tiledMask]
                lowData = self.obtainValues(prefix + "_LOW", flatten = True)[tiledMask]

            if forecastType == 1:
                if prefix + "_LEVELCOMP" in self.dataset.variables:
                    levelData = self.obtainValues(prefix + "_LEVELCOMP", flatten = True)[tiledMask]
                    trendData = self.obtainValues(prefix + "_TRENDCOMP", flatten = True)[tiledMask]
                    seasonData = self.obtainValues(prefix + "_SEASONCOMP", flatten = True)[tiledMask]

        #### Create Candidate Fields ####
        candidateFieldList += CUTILS.createForecast3DFields(varName, rawData, fitData, 
                                                            highData = highData, lowData = lowData,
                                                            levelData = levelData, trendData = trendData,
                                                            seasonData = seasonData)

        #### Outliers ####
        if prefix + "_OUTLIER" in self.dataset.variables:
            outlierName = prefix + "_OUTLIER"
            data = self.obtainValues(outlierName, flatten = True)[tiledMask]
            alias = "Model Fit Outliers"
            candidateField = SSDO.CandidateField("OUTLIER", "LONG", data = data, alias = alias)
            candidateFieldList.append(candidateField)

            #### Get Residuals and Create TS Outlier Bins ####
            resData = rawData - fitData
            outlierBins = NUM.zeros(len(data), dtype = NUM.int32)
            outlierTypes = NUM.empty(len(data), dtype = 'U18')
            for ind, outlierBool in enumerate(data):
                if outlierBool == 1:
                    if resData[ind] > 0:
                        outlierBins[ind] = 1
                        outlierTypes[ind] = "Above Fitted Value"
                    else:
                        outlierBins[ind] = -1
                        outlierTypes[ind] = "Below Fitted Value"

            alias = "Time Series Outliers"
            candidateField = SSDO.CandidateField("TSO_BIN", "LONG", data = outlierBins, alias = alias)
            candidateFieldList.append(candidateField)

            alias = "Time Series Outlier Type"
            isNullable = UTILS.isShapeFile(outputFC) is False
            candidateField = SSDO.CandidateField("TSO_TYPE", "TEXT", data = outlierTypes, alias = alias,
                                                 checkNullValues = isNullable)
            candidateFieldList.append(candidateField)

        return candidateFieldList

    def changePointResults3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outputPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "CPD_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            tiledMask = NUM.ones((self.numObs,), dtype = bool)
        else:
            tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)   

        #### Add Analysis Variable ####
        data = self.obtainValues(varName)
        candidateField = SSDO.CandidateField("VALUE", "DOUBLE",
                                             data=data.ravel(),
                                             alias=varName)
        candidateFieldList.append(candidateField)

        #### Get All Output Var Names ####
        changePointData = self.obtainValues(prefix + "_ISCP")
        changePointData[changePointData < 0] = NUM.iinfo(changePointData.dtype).min
        candidateField = SSDO.CandidateField("CHPT_IND", "LONG",
                                             data=changePointData.ravel(),
                                             alias="Change Point Indicator",
                                             checkNullValues=True)
        candidateFieldList.append(candidateField)

        numTime, numLoc = data.shape
        """
        changeType = 0 -> mean
        changeType = 1 -> STANDARD_DEVIATION
        changeType = 2 -> slope
        changeType = 3 -> count
        """
        before = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        current = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        beforeIntercept = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        currentIntercept = NUM.zeros((numTime, numLoc), dtype=NUM.float64)

        chTypeNameStr = "CPD_" + varName + "_CHTYPE"
        if self.checkVariable(chTypeNameStr):
            changePointType = self.obtainValues(chTypeNameStr, flatten=False)[0]

            for loc in range(numLoc):
                timeSeriesData = data[:, loc]
                #if changePointType == 2:
                #    timeSeriesData = NUM.diff(timeSeriesData)
                lengthTimeSeries = len(timeSeriesData)
                CHPTData = changePointData[:, loc]
                CHPTData = CHPTData[CHPTData >= 0]
                if len(CHPTData) > 0:
                    nonZeroIndicesList = NUM.nonzero(CHPTData)[0]
                    n = len(nonZeroIndicesList)
                else:
                    n = 0
                currSegVal = 0.0
                prevSegVal = 0.0
                currSlope = 0.0
                prevSlope = 0.0
                currIntercept = 0.0
                prevIntercept = 0.0
                prevChangePointIdx = 0
                meanVal = NUM.mean(timeSeriesData)

                if n != 0:
                    for i in range(n):
                        currChangePointIdx = nonZeroIndicesList[i]
                        if changePointType == 1: # if it is STANDARD_DEVIATION
                            currSegVal = NUM.sum((timeSeriesData[prevChangePointIdx: currChangePointIdx] - meanVal) * (timeSeriesData[prevChangePointIdx: currChangePointIdx] - meanVal) )
                            currSegVal /= (currChangePointIdx - prevChangePointIdx + 1)
                            currSegVal = NUM.sqrt(currSegVal)
                        elif changePointType == 0 or changePointType == 3: # mean, count
                            currSegVal = NUM.mean(timeSeriesData[prevChangePointIdx: currChangePointIdx])
                        else: #slope
                            y = timeSeriesData[prevChangePointIdx: currChangePointIdx]
                            x = NUM.arange(prevChangePointIdx, currChangePointIdx)
                            currSlope, currIntercept = CUTILS.calculateFittedLine(x, y)

                        for t in range(prevChangePointIdx, currChangePointIdx):
                            if changePointType == 2:
                                current[t][loc] = currSlope
                                currentIntercept[t][loc] = currIntercept
                                if t != 0:
                                    if t == prevChangePointIdx:
                                        before[t][loc] = prevSlope
                                        beforeIntercept[t][loc] = prevIntercept
                                    else:
                                        before[t][loc] = currSlope
                                        beforeIntercept[t][loc] = currIntercept
                                else:
                                    before[t][loc] = NUM.nan
                                    beforeIntercept[t][loc] = NUM.nan
                            else:
                                current[t][loc] = currSegVal
                                if t != 0:
                                    if t == prevChangePointIdx:
                                        before[t][loc] = prevSegVal
                                    else:
                                        before[t][loc] = currSegVal
                                else:
                                    before[t][loc] = NUM.nan

                        if changePointType == 2:
                            prevSlope = currSlope
                            prevIntercept = currIntercept
                        else:
                            prevSegVal = currSegVal
                        prevChangePointIdx = currChangePointIdx
                    ### For the last Segment ####
                    if changePointType == 1: # if it is STANDARD_DEVIATION
                        #currSegVal = NUM.sqrt(NUM.var(timeSeriesData[prevChangePointIdx:]))
                        currSegVal = NUM.sum((timeSeriesData[prevChangePointIdx:] - meanVal) * (timeSeriesData[prevChangePointIdx:] - meanVal) )
                        currSegVal /= (len(timeSeriesData) - prevChangePointIdx + 1)
                        currSegVal = NUM.sqrt(currSegVal)
                    elif changePointType == 0 or changePointType == 3: # mean, count
                        currSegVal = NUM.mean(timeSeriesData[prevChangePointIdx:])
                    else:
                        # y = a + bx
                        y = timeSeriesData[prevChangePointIdx:]
                        x = NUM.arange(prevChangePointIdx, lengthTimeSeries)
                        currSlope, currIntercept = CUTILS.calculateFittedLine(x, y)

                    for t in range(prevChangePointIdx, lengthTimeSeries):
                        if changePointType == 2:
                            current[t][loc] = currSlope
                            currentIntercept[t][loc] = currIntercept
                            if t == prevChangePointIdx:
                                before[t][loc] = prevSlope
                                beforeIntercept[t][loc] = prevIntercept
                            else:
                                before[t][loc] = currSlope
                                beforeIntercept[t][loc] = currIntercept
                        else:
                            current[t][loc] = currSegVal
                            if t == prevChangePointIdx:
                                before[t][loc] = prevSegVal
                            else:
                                before[t][loc] = currSegVal
                else: # no change point detected
                    if changePointType == 1: # if it is STANDARD_DEVIATION
                        currSegVal = NUM.sqrt(NUM.var(timeSeriesData))
                    elif changePointType == 0 or changePointType == 3: # mean, count
                        currSegVal = NUM.mean(timeSeriesData)
                    else: #slope
                        # y = a + bx
                        x = NUM.arange(0, lengthTimeSeries)
                        currSlope, currIntercept =  CUTILS.calculateFittedLine(x, timeSeriesData)

                    for t in range(lengthTimeSeries):
                        if changePointType == 2:
                            if t == 0:
                                before[t][loc] = NUM.nan
                                beforeIntercept[t][loc] = NUM.nan
                            else:
                                before[t][loc] = currSlope
                                beforeIntercept[t][loc] = currIntercept
                            current[t][loc] = currSlope
                            currentIntercept[t][loc] = currIntercept
                        else:
                            if t == 0:
                                before[t][loc] = NUM.nan
                            else:
                                before[t][loc] = currSegVal
                            current[t][loc] = currSegVal

            if changePointType == 0:
                nameBefore = "MEAN_BEF"
                aliasBefore = "Mean Before"
                currName = "MEAN_CUR"
                currAlias = "Current Mean"
            elif changePointType == 1:
                nameBefore = "STDEV_BEF"
                aliasBefore = "Standard Deviation Before"
                currName = "STDEV_CUR"
                currAlias = "Current Standard Deviation"
            elif changePointType == 2:
                nameBefore = "SLOPE_BEF"
                aliasBefore = "Slope Before"
                currName = "SLOPE_CUR"
                currAlias = "Current Slope"
                nameBeforeIntercept = "INTRCP_BEF"
                aliasBeforeIntercept = "Intercept Before"
                currNameIntercept = "INTRCP_CUR"
                currAliasIntercept = "Current Intercept"
            else:
                nameBefore = "MEAN_BEF"
                aliasBefore = "Mean of Count Before"
                currName = "MEAN_CUR"
                currAlias = "Current Mean of Count"

            candidateField = SSDO.CandidateField(nameBefore, "DOUBLE",
                                                 data=before.ravel(),
                                                 alias=aliasBefore)
            candidateFieldList.append(candidateField)
            candidateField = SSDO.CandidateField(currName, "DOUBLE",
                                                 data=current.ravel(),
                                                 alias=currAlias)
            candidateFieldList.append(candidateField)
            if changePointType == 2:
                candidateField = SSDO.CandidateField(nameBeforeIntercept, "DOUBLE",
                                                     data=beforeIntercept.ravel(),
                                                     alias=aliasBeforeIntercept)
                candidateFieldList.append(candidateField)
                candidateField = SSDO.CandidateField(currNameIntercept, "DOUBLE",
                                                     data=currentIntercept.ravel(),
                                                     alias=currAliasIntercept)
                candidateFieldList.append(candidateField)

        return candidateFieldList

    def timeSeriesClusteringPlot3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "TSCLUST_" + varName

        #### Set Up Analysis Mask Based on Cluster Centers ####
        centerName = prefix + "_CENTER"
        varMask = NUM.array(self.obtainValues(centerName), dtype = bool)
        tiledMask = NUM.tile(varMask, self.numTime)

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = tiledMask)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = tiledMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        elementData = elementField.data

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        baseVar.name = "CLUST_MED"
        baseVar.alias = "Time-Series Cluster Medoid"
        candidateFieldList.append(baseVar)

        #### Add Averaged and Clustered Variables ####
        createTS = True
        if hasattr(self, 'tsClusterVar'):
            if self.tsClusterVar == varName:
                #### No Need to Re-Calculate if Run Via Tool ####
                meanPerCluster = self.meanPerCluster
                createTS = False
        if createTS:
            #### Must Re-Calculate ####
            tsInfo = self.getTimeSeriesOfClusters(varName)
            meanPerCluster = tsInfo[0]

        clustVar = prefix + '_CLUSTER'
        clusterData = self.obtainValues(clustVar)[varMask]
        clusterData = NUM.tile(clusterData, self.numTime)

        #### Remap Series in Correct Order ####
        remappedClusters = CUTILS.remapTimeSeriesMeans(clusterData, meanPerCluster, 
                                                       varMask.sum())

        #### Create Candidate Fields ####
        candidateField = SSDO.CandidateField("CLUST_MEAN", "DOUBLE",
                                             data = remappedClusters,
                                             alias = "Time-Series Cluster Average")
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Time-Series Cluster ID").format(varName)
        candidateField = SSDO.CandidateField("CLUSTER_ID", "LONG",
                                             data = clusterData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def varOutputFields3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Get Variable Data ####
        data = self.obtainValues(varName)

        #### Assure 3-D Variable ####
        if len(data.shape) != 2:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = None)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = None)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)      
        
        elementData = elementField.data

        #### Set Output Type ####
        if data.dtype == float:
            outType = "DOUBLE"
        else:
            outType = "LONG"

        #### Create Variable Candidate Field ####
        candidateField = SSDO.CandidateField("VALUE", outType,
                                             data = data.ravel(),
                                             alias = varName)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def estimatedBins3D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Element/Location Fields ####
        elementInfo = self.getElementFields(tiledMask = None)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)
        candidateFieldList.append(locationLabel)

        #### Add Location Strings ####
        locationStr = self.getElementLocationStr(tiledMask = None)
        if locationStr is not None:
            candidateFieldList.append(locationStr) 

        elementData = elementField.data

        #### Get Estimated Results ####
        mask = self.obtainMask('PREDICTION_BINARY_MASK')
        if mask is not None:
            data = mask.ravel()
        else:
            data = NUM.zeros((self.numObs,), dtype = bool)

        #### Create Estimated Field ####
        alias = UTILS.formatString("Estimated bins ({0})").format(varName)
        candidateField = SSDO.CandidateField("ESTIMATED", "LONG",
                                             data = data,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def getOutputTimeFieldInfo(self, exact = False):
        """Returns output start and end times."""

        s = DT.timedelta(seconds = 1)
        tMinus1 = self.numTime - 1
        timeSteps = self.time[:,0]
        startTimes = []
        endTimes = []
        for timeIndex in timeSteps:
            t = self.t[timeIndex]
            startDT = self.firstStartTime + DT.timedelta(seconds = t)
            if timeIndex == tMinus1:
                endDT = self.lastEndTime
            else:
                t1 = self.t[timeIndex + 1]
                endDT = self.firstStartTime + DT.timedelta(seconds = t1)
            if not exact:
                if self.isStartTime:
                    endDT = endDT - s
                else:
                    startDT = startDT + s

            startTimes.append(startDT)
            endTimes.append(endDT)

        return startTimes, endTimes
        
    def selectCubeLocations(self, cubeShapes, selectShapes, relationship):

        selectionMask = [False] * self.numLocations

        ARCPY.management.SelectLayerByLocation(cubeShapes, relationship, selectShapes, None, "NEW_SELECTION", "NOT_INVERT")

        with ARCPY.da.SearchCursor(cubeShapes, ["LOCATION"]) as cursor:
            for row in cursor:
                selectionMask[row[0]] = True

        return selectionMask

    def setOutputLocationIDs(self, locationField, threeD = False):
        if threeD:
            uniqueIDs = NUM.unique(locationField.data)
            self.outputLocationIDs = locationField.data[0:len(uniqueIDs)]
        else:
            self.outputLocationIDs = NUM.array(locationField.data)

    def exportFeatures3D(self, outputFC, candidateFieldList, useCentroids = False, outputPolygonType = 0):
        """
        Exports Space-Time Cube to Fishnet Grid Cells.
        INPUT:
            candidateFieldList (list): fieldName: SSDO.CandidateField
            outputFC (str): path of output feature class
            useCentroid (bool): output as centroids
            outputPolygonType (int) : 0/polygons, 1/PolygonZ, 2/Multipatch
        OUTPUT:
            2D fishnet feature class
        """

        #### Init and Output Progress ####
        ARCPY.env.overwriteOutput = True
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Validate Fields ####
        valid = False
        numFields = len(candidateFieldList)
        if numFields:
            valid = candidateFieldList[0].name == "ELEMENT"
            if valid:
                valid = False
                for field in candidateFieldList[1:]:
                    if field.name == "LOCATION":
                        self.setOutputLocationIDs(field, threeD = True)
                        valid = True
                        break

        if not valid:
            #### Variable Not in Cube ####
            ARCPY.AddIDMessage("ERROR", 240)
            self.close()
            raise SystemExit()

        #### Slow to Render Warning ####
        ARCPY.AddIDMessage("WARNING", 110044)

        #### Warning for Number of Elements ####
        elementField = candidateFieldList[0]
        elementData = elementField.data
        numElements = len(elementData)
        if numElements > 10000 and UTILS.inProApp():
            ARCPY.AddIDMessage("WARNING", 110054)

        #### Checking Env Settings ####
        if ARCPY.env.extent:
            oldExtent = ARCPY.env.extent
            ARCPY.env.extent = ""
        else:
            oldExtent = ""

        #### Get Output Spatial Ref ####
        outSpatialRef, cubeSpatialRef, isSame = self.getOutputSpatialRef(outputFC)

        if useCentroids:
            #### Create/Write Output Features ####
            if isSame:
                ARC._ss.panel_to_3D_features(self, outputFC, candidateFieldList)
            else:
                ARC._ss.panel_to_3D_features(self, outputFC, candidateFieldList,
                                            outSpatialRef)
        else:
            #### Create/Write Output Features ####
            if self.isPolygon:
                if isSame:
                    ARC._ss.panel_to_repeated_shapes(self, outputFC, candidateFieldList, outputPolygonType)
                else:
                    ARC._ss.panel_to_repeated_shapes(self, outputFC, candidateFieldList, outputPolygonType,
                                                     outSpatialRef)

        #### Set Environment Back ####
        if oldExtent:
            ARCPY.env.extent = oldExtent

    def exportTable3D(self, outputTable, candidateFieldList):
        """
        Exports Space-Time Cube Attributes w/o shape.
        INPUT:
            candidateFieldList (list): fieldName: SSDO.CandidateField
            outputTable (str): path of output table
        OUTPUT:
            3D Output Table: ELEMENT, LOCATION, and TIME_ID
        """

        #### Init and Output Progress ####
        ARCPY.env.overwriteOutput = True
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputTable)
        outPath, outName = OS.path.split(outputTable)

        #### Validate Fields ####
        valid = False
        numFields = len(candidateFieldList)
        if numFields:
            valid = candidateFieldList[0].name == "ELEMENT"
            if valid:
                valid = False
                for field in candidateFieldList[1:]:
                    if field.name == "LOCATION":
                        self.setOutputLocationIDs(field, threeD = True)
                        valid = True
                        break

        if not valid:
            #### Variable Not in Cube ####
            ARCPY.AddIDMessage("ERROR", 240)
            self.close()
            raise SystemExit()

        #### Warning for Number of Elements ####
        elementField = candidateFieldList[0]
        elementData = elementField.data
        numElements = len(elementData)
        if numElements > 10000 and UTILS.inProApp():
            ARCPY.AddIDMessage("WARNING", 110054)

        #### Create/Write Output Features ####
        ARC._ss.panel_to_3D_table(self, outputTable, candidateFieldList)

    def exportFeatures2D(self, outputFC, candidateFieldList):
        """
        Exports Space-Time Cube to Fishnet Grid Cells.
        INPUT:
            candidateFieldList (list): fieldName: SSDO.CandidateField
            outputFC (str): path of output feature class

        OUTPUT:
            2D fishnet feature class
        """

        #### Init and Output Progress ####
        ARCPY.env.overwriteOutput = True
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Validate Fields ####
        valid = False
        numFields = len(candidateFieldList)
        if numFields:
            valid = candidateFieldList[0].name == "LOCATION"
            if valid:
                self.setOutputLocationIDs(candidateFieldList[0])
        if not valid:
            #### Variable Not in Cube ####
            ARCPY.AddIDMessage("ERROR", 240)
            self.close()
            raise SystemExit()

        #### Checking Env Settings ####
        if ARCPY.env.extent:
            oldExtent = ARCPY.env.extent
            ARCPY.env.extent = ""
        else:
            oldExtent = ""

        #### Get Output Spatial Ref ####
        outSpatialRef, cubeSpatialRef, isSame = self.getOutputSpatialRef(outputFC)

        #### Create/Write Output Features ####
        if isSame:
            ARC._ss.panel_to_2D_features(self, outputFC, candidateFieldList)
        else:
            ARC._ss.panel_to_2D_features(self, outputFC, candidateFieldList,
                                        outSpatialRef)
        #### Set Environment Back ####
        if oldExtent:
            ARCPY.env.extent = oldExtent

    def addChangePointVariables(self, allChangePoints, inputVar, changeType):
        #### Var and Mask Name Strings ####
        varNameStr = "CPD_" + inputVar + "_ISCP"

        #### Add Changepoints ####
        self.append(varNameStr, allChangePoints)

        #### Add Change type ####
        changePointVec = NUM.full((self.numLocations, ), int(changeType), dtype=NUM.int32)
        changePointVecName = "CPD_" + inputVar + "_CHTYPE"
        self.append(changePointVecName, changePointVec)

    def changePointOutputFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)
        isShp = UTILS.isShapeFile(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "CPD_" + varName

        #### Set Up Analysis Mask and Output Name ####
        varMask = self.obtainVariableMask(prefix)
        useMask = varMask is not None
        if not useMask:
            varMask = NUM.ones((self.numLocations,), dtype = bool)

        #### Add Location Fields ####
        locationField, locationLabel = self.getLocationFields(varMask = varMask)
        candidateFieldList.append(locationField)

        #### Add Location Strings ####
        locationStr = self.getLocationLabelStr(varMask = varMask)
        if locationStr is not None:
            candidateFieldList.append(locationStr)
        else:
            candidateFieldList.append(locationLabel)

        suffix = ['_ISCP']
        varNames = [prefix + suff for suff in suffix]
        varNames = [varName] + varNames

        # Create Time Strings
        startTimes, endTimes = self.getOutputTimeFieldInfo()
        if self.isStartTime:
            useTimes = startTimes
        else:
            useTimes = endTimes

        data = self.obtainValues(varNames[1])
        numTime, numLoc = data.shape

        typeField = data.dtype
        numChangePoints = data.sum(axis=0)
        numChangePoints[numChangePoints < 0] = NUM.iinfo(typeField).min

        #### Add the Number of Change Points ####
        candidateField = SSDO.CandidateField("NUM_CHPT", "LONG",
                                             data=numChangePoints,
                                             alias="Number of Change Points",
                                             checkNullValues=True)
        candidateFieldList.append(candidateField)

        #### Add the First and last Change Point Time ####
        firstCPTime = NUM.empty((numLoc), dtype=object)
        lastCPTime = NUM.empty((numLoc), dtype=object)

        for loc in range(numLoc):
            if numChangePoints[loc] > 0:
                ### Get all non zero indices ###
                nonZeroIndicesList = NUM.nonzero(data[:, loc])
                
                ### First Change Point Time ###
                firstCPIndex = nonZeroIndicesList[0][0]
                firstCPTime[loc] = useTimes[firstCPIndex]

                ### Last Change Point Time ###
                lastCPIndex = nonZeroIndicesList[0][-1]
                lastCPTime[loc] = useTimes[lastCPIndex]

        candidateField = SSDO.CandidateField("FIRST_CHPT", "DATE",
                                             data=firstCPTime,
                                             alias="Date of First Change Point",
                                             checkNullValues=True,
                                             precision = 0)
        candidateFieldList.append(candidateField)

        candidateField = SSDO.CandidateField("LAST_CHPT", "DATE",
                                             data=lastCPTime,
                                             alias="Date of Last Change Point",
                                             checkNullValues=True,
                                             precision = 0)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def exportSummaryTable(self, outputTable, cubeSubType = None):
        '''
        Exports Cube Summary to Table
        '''
        #### Check Write Location ####
        tableName, _ = UTILS.returnTableName(outputTable)
        #### Check if DBF ####
        dbf = 0
        if ".dbf".upper() in tableName.upper():
            dbf = 1
        #### Parse the output Path ####
        outPath, outName = OS.path.split(tableName)

        if not ARCPY.Exists(outPath):
            #### Not Writeable ####
            ARCPY.AddIDMessage("ERROR", 210, outputTable)
            raise SystemExit()


        tableFields = ['MIN_X', 'MIN_Y', 'MAX_X', 'MAX_Y', 'NUM_TIME_STEPS', 'TIME_INTERVAL', 'TIME_ALIGNMENT',
                       'FIRST_TIME_BIAS_PERC', 'FIRST_START_TIME', 'FIRST_END_TIME', 'LAST_TIME_BIAS_PERC',
                       'LAST_START_TIME', 'LAST_END_TIME', 'NUM_LOCATION', 'NUM_OBSERVATION']

        tableFieldsShort = ['MIN_X', 'MIN_Y', 'MAX_X', 'MAX_Y', 'N_TIME_STP', 'T_INTERVAL', 'T_ALIGNMNT',
                            'FST_T_BIAS', 'FST_STRT_T', 'FST_END_T', 'LST_T_BIAS', 'LST_STAT_T', 'LST_END_T',
                            'N_LOCATION', 'N_OBS']

        idMessages = [84521, 84522, 84523, 84524, 220220, 220221, 220222, 220223, 220224, 220225, 220226,
                    220227, 220228, 220233, 220234]

        tableType = ['DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'LONG', 'TEXT', 'TEXT', 'DOUBLE', 'DATE','DATE', 
                    'DOUBLE', 'DATE', 'DATE', 'LONG', 'LONG']

        aliasDict = {k:v for k,v in zip(tableFields, idMessages)}
        
        extentArr = "[{0}, {1}, {2}, {3}]".format(LOCALE.format_string("%0.4f", self.extent.XMin),
                                                  LOCALE.format_string("%0.4f", self.extent.YMin),
                                                  LOCALE.format_string("%0.4f", self.extent.XMax),
                                                  LOCALE.format_string("%0.4f", self.extent.YMax))

        if hasattr(self.dataset, 'alignment'):
            alignment = self.dataset.alignment
            if alignment.upper() == "START_TIME":
                alignment = ARCPY.GetIDMessage(220465)
            elif alignment.upper() == "END_TIME":
                alignment = ARCPY.GetIDMessage(220466)
        else:
            alignment = "END"

        startBias = round(self.startBias, 2)
        endBias =  round(self.endBias, 2)

        totalBins = self.numLocations * self.numTime

        tableData = [self.extent.XMin, self.extent.YMin, self.extent.XMax, self.extent.YMax, self.numTime, 
                    self.timeStepLabelLocale, alignment, startBias, self.dataset.first_start_time , 
                    self.dataset.first_end_time, endBias, self.dataset.last_start_time, self.dataset.last_end_time,
                    self.numLocations, self.numObs]

        if cubeSubType is not None:
            if "FORECAST" in cubeSubType:
                numForecastCols = 4
                if dbf == 0:
                    tableFields.append('NUM_FORECAST')
                    tableFields.append('FIRST_FORECAST_START')
                    tableFields.append('FIRST_FORECAST_END')
                    tableFields.append('LAST_FORECAST_START')
                    tableFields.append('LAST_FORECAST_END')
                    if self.dataset.has_validation.upper() == "TRUE":
                        tableFields.append('VALIDATION_TIME_STEPS')

                elif dbf == 1:
                    tableFieldsShort.append('N_FORECAST')
                    tableFieldsShort.append('FST_FORC_S')
                    tableFieldsShort.append('FST_FORC_E')
                    tableFieldsShort.append('LST_FORC_S')
                    tableFieldsShort.append('LST_FORC_E')
                    if self.dataset.has_validation.upper() == "TRUE":
                        tableFieldsShort.append('V_TIME_STP')

                idMessages.append(220249)
                idMessages.append(220245)
                idMessages.append(220246)
                idMessages.append(220247)
                idMessages.append(220248)
                if self.dataset.has_validation.upper() == "TRUE":
                    idMessages.append(84981)

                tableType.append('LONG')
                _= [tableType.append('DATE') for i in range(numForecastCols)]
                tableType.append('LONG')

                ## Get Forecast Info
                startTimes, endTimes = self.getOutputTimeFieldInfo(exact=True)
                startBin = int(self.dataset.begin_forecast_bin)
                ## Number of Forecast Steps
                tableData.append(int(self.numTime - startBin))
                ## First Forecast Start Time
                tableData.append(TUTILS.dateTime2String(startTimes[startBin]))
                ## First Forecast End Time
                tableData.append(TUTILS.dateTime2String(endTimes[startBin]))
                ## Last Forecast Start Time
                tableData.append(TUTILS.dateTime2String(self.lastStartTime))
                ## Last Forecast End Time
                tableData.append(TUTILS.dateTime2String(self.lastEndTime))
                if self.dataset.has_validation.upper() == "TRUE":
                    ## Validation Size
                    tableData.append(int(self.dataset.validation_size))

        aliasDict = {k:v for k,v in zip(tableFields, idMessages)}

        fields = []
        entrySize = int(max([len(str(f)) for f in tableData]))

        if dbf == 1:
            tableFields = tableFieldsShort

        for fieldName, fieldType, fieldData in zip(tableFields, tableType, tableData):
            if dbf == 1:
                alias = None
            elif dbf == 0 :
                alias = ARCPY.GetIDMessage(aliasDict[fieldName])

            if fieldType.upper() == "TEXT":
                field = SSDO.CandidateField(name = fieldName,
                                            type = fieldType,
                                            data = NUM.array([str(fieldData)]),
                                            length = entrySize, 
                                            alias = alias)

            if fieldType.upper() == "LONG":
                field = SSDO.CandidateField(name = fieldName,
                                            type = fieldType,
                                            data = NUM.array([fieldData], dtype = NUM.int32),
                                            length = entrySize, 
                                            alias = alias)

            if fieldType.upper() == "DOUBLE":
                field = SSDO.CandidateField(name = fieldName,
                                            type = fieldType,
                                            data = NUM.array([fieldData], dtype = float),
                                            length = entrySize, 
                                            alias = alias)

            if fieldType.upper() == "DATE":
                field = SSDO.CandidateField(name = fieldName,
                                            type = fieldType,
                                            data = NUM.array([fieldData], dtype = 'datetime64[s]'),
                                            length = entrySize, 
                                            alias = alias,
                                            precision = 0)

            fields.append(field)

        ARC._ss.output_table_from_candidate_fields(tableName, 1, fields)

class SubsetPanel(object):
    def __init__(self, inputCubeFile, outputCubeFile, subsetStartTime = None,
                subsetEndTime = None, dropBinStart = None, dropBinEnd = None,
                extent = None, subsetFeature = None, spaceSubsetCube = None,
                rel = None):
        #### Set Common Inputs ####
        self.inputCubeFile = inputCubeFile
        self.outputCubeFile = outputCubeFile

        #### Set Time Subset Inputs ####
        self.subsetStartTime = subsetStartTime
        self.subsetEndTime = subsetEndTime
        self.dropBinStart = dropBinStart
        self.dropBinEnd = dropBinEnd

        #### Set Spatial Subset Inputs ####
        self.extent = extent
        self.subsetFeature = subsetFeature
        self.spaceSubsetCube = spaceSubsetCube
        self.rel = rel

        #### Read Parent Cube ####
        self.parentCube = SSPanel(self.inputCubeFile)
        self.parentDict = self.parentCube.dataset.__dict__

        #### Initialize Intermediate Variables ####
        self.dataset = None
        self.timeInd = [True] * self.parentCube.numTime
        self.newStartTimes = None
        self.newEndTimes = None
        self.numTime = None
        self.spatialAnalysisMask = NUM.tile(True, self.parentCube.numLocations)
        self.subsetCube = None

        #### Set Error Flags ####
        self.timeError = False
        self.spaceError = False

        #### Set the Type of Subsetting ####
        self.subsetType = ""
        if self.subsetStartTime is not None or self.subsetEndTime is not None:
            self.subsetType += "TIME"
        elif self.dropBinStart is not None or self.dropBinEnd is not None:
            self.subsetType += "TIME"

        if self.extent is not None:
            if len(self.subsetType) == 0:
                self.subsetType += "SPACE"
            else:
                self.subsetType += "_SPACE"
        elif self.subsetFeature is not None or self.spaceSubsetCube is not None:
            if len(self.subsetType) == 0:
                self.subsetType += "SPACE"
            else:
                self.subsetType += "_SPACE"

        #### Execute Subset Operations ####
        self.__initializeSubsetCube__()
        self.__setSubsetGlobals__()
        self.__setSubsetVersionInfo__()
        self.__setCubeGrid__()
        self.__setSubsetBaseVars__()

        self.subsetCube.close()
        #### Display the Subset Report ####
        self.subsetCube = CUTILS.subsetReport(self.outputCubeFile, self.inputCubeFile, self.subsetType)

    def __initializeSubsetCube__(self):
        #### Check Path Exists ####
        outPath, outName = OS.path.split(self.outputCubeFile)
        if not OS.path.exists(outPath):
            ARCPY.AddIDMessage("ERROR", 436, outPath)
            raise SystemExit()

        #### Initialize Cube ####
        try:
            self.dataset = NET.Dataset(self.outputCubeFile, 'w')

        except:
            #### Not Writeable ####
            ARCPY.AddIDMessage("ERROR", 210, self.outputCubeFile)
            raise SystemExit()

        #### Add Source Tool ####
        self.dataset.subsetType  = "SUBSET"
        #self.dataset.isSubset = "TRUE" ##OATODO: Point Logic Checks to this vars

    def __setSubsetGlobals__(self):
        #### Define New Time Extents After Subset ####
        cubeDict = self.parentDict
        startShift = 0
        self.subsetTimeDelta = None

        if "TIME" in self.subsetType.upper():
            self.timeInd, self.newStartTimes, self.newEndTimes = TUTILS.computeTimeSubsetID(self.parentCube,
                                                                                            self.subsetStartTime,
                                                                                            self.subsetEndTime,
                                                                                            self.dropBinStart,
                                                                                            self.dropBinEnd)

            cubeDict['first_start_time'] = TUTILS.dateTime2String(self.newStartTimes[0])
            cubeDict['first_end_time'] = TUTILS.dateTime2String(self.newEndTimes[0])
            cubeDict['last_start_time'] = TUTILS.dateTime2String(self.newStartTimes[-1])
            cubeDict['last_end_time'] = TUTILS.dateTime2String(self.newEndTimes[-1])
            cubeDict['data_min_time'] = TUTILS.dateTime2String(self.newStartTimes[0])
            cubeDict['data_max_time'] = TUTILS.dateTime2String(self.newEndTimes[-1])

            self.__checkForecastHorizon()
            cubeDict = self.parentDict
            
        startShift = [ind for ind, t in enumerate(self.timeInd) if t][0]
        #### Set Subset Dataset Globals ####
        self.dataset.setncatts(cubeDict)
        if hasattr(self.dataset, "begin_forecast_bin"):
            beginForecast = int(self.dataset.begin_forecast_bin)
            beginForecast -= startShift
            self.dataset.begin_forecast_bin = str(beginForecast)

        #### Update Time Bias ####
        if self.timeInd[0] is False:
            self.dataset.start_bias = 0
        if self.timeInd[-1] is False:
            self.dataset.end_bias = 0

        #### Copy Over Data Min/Max ####
        self.dataset.data_min_time = self.parentCube.dataMinTime
        self.dataset.data_max_time = self.parentCube.dataMaxTime

    def __setSubsetVersionInfo__(self):
        #### Attribute for General Info ####
        version = ARCPY.GetInstallInfo()['Version']
        self.dataset.history = 'Created by ' + DT.datetime.now().ctime()
        self.dataset.source = 'Space Time Pattern Mining Tools;'
        self.dataset.source += version

    def __setCubeGrid__(self):
        if "SPACE" in self.subsetType:
            self.spatialSubset()

        self.numLocations = sum(self.spatialAnalysisMask)
        if int(sum(self.spatialAnalysisMask)) == int(self.parentCube.numLocations):
            self.spaceError = True

        if self.numLocations == 0:
            ARCPY.AddIDMessage("ERROR", 110461)
            self.dataset.close()
            UTILS.passiveDelete(self.outputCubeFile)
            raise SystemExit()

        elif self.spaceError and self.subsetType == "SPACE":
            ARCPY.AddIDMessage("ERROR", 110481)
            self.dataset.close()
            raise SystemExit()


        #### Define Number of Locations Dimension ####
        self.dataset.createDimension('locations', self.numLocations)

        #### Copy Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon']

        for ind, varName in enumerate(vars2Copy):
            var = self.parentCube.dataset.variables[varName]
            newVar = self.dataset.createVariable(varName, var.datatype, var.dimensions)
            if ind > 0:
                self.dataset[varName][:] = self.parentCube.dataset[varName][:][self.spatialAnalysisMask]
            else:
                self.dataset[varName][:] = self.parentCube.dataset[varName][:]
            self.dataset[varName].setncatts(self.parentCube.dataset[varName].__dict__)
    
        self.dataset.agg_shape_type = "POINT"
        if self.parentCube.isPolygon:
            #### Create Ragged Arrays ####
            polyBreaksVL = self.dataset.createVLType('i4', 'poly_breaks_vector')
            polyBreaks = self.dataset.createVariable('poly_breaks', polyBreaksVL, 
                                                        ('locations'))
            polyCoordsVL = self.dataset.createVLType('f8', 'poly_coords_vector')
            polyCoords = self.dataset.createVariable('poly_coords', polyCoordsVL, 
                                                        ('locations'))
            self.dataset['poly_breaks'][:] = self.parentCube.dataset['poly_breaks'][:][self.spatialAnalysisMask]
            self.dataset['poly_coords'][:] = self.parentCube.dataset['poly_coords'][:][self.spatialAnalysisMask]
            self.dataset.agg_shape_type = "POLYGON" 
    
        #### Define Time Dimension ####
        self.numTime = sum(self.timeInd)
        if self.numTime == self.parentCube.numTime:
            self.timeError = True

        if self.timeError and self.subsetType.upper() == "TIME":
            ARCPY.AddIDMessage("ERROR", 110459)
            self.parentCube.close()
            self.dataset.close()
            UTILS.passiveDelete(self.outputCubeFile)
            raise SystemExit()

        elif self.subsetType.upper() == "TIME_SPACE":
            if self.spaceError and not self.timeError:
                ARCPY.AddIDMessage("WARNING", 110481)

            elif not self.spaceError and self.timeError:
                ARCPY.AddIDMessage("WARNING", 110459)

            elif self.spaceError and self.timeError:
                ARCPY.AddIDMessage("ERROR", 110459)
                ARCPY.AddIDMessage("ERROR", 110481)
                self.dataset.close()
                UTILS.passiveDelete(self.outputCubeFile)
                raise SystemExit()

        self.dataset.createDimension('time', self.numTime)

        #### Assure Enough Time Bins ####
        if self.numTime < CUTILS.minNumTimeCube:
            ARCPY.AddIDMessage("ERROR", 110004)
            self.dataset.close()
            UTILS.passiveDelete(self.outputCubeFile)
            raise SystemExit()

        #### Get Alignment Info ####
        if hasattr(self.parentCube.dataset, 'alignment'):
            self.dataset.alignment = self.parentCube.dataset.alignment
        else:
            self.dataset.alignment = "END"

        #### Time ID Step ####
        timeIDList = NUM.arange(0, self.numTime)
        timeIDValue = NUM.repeat(timeIDList, self.numLocations)
        timeIDValue = timeIDValue.reshape(self.numTime, self.numLocations)
        CUTILS.createVariable(self.dataset, 'time_step_ID', timeIDValue, self.parentCube.spatialReference,
                              dType = 'i4', isPanel = True)

        #### Get All Times and Create Time Variable ####
        time = self.dataset.createVariable('time', 'f8', ('time'))
        if "TIME" not in self.subsetType.upper():
            timeArray = NUM.array(self.parentCube.obtainTimeBreaks(), dtype = 'datetime64[s]')
            firstStartStr = TUTILS.dateTime2String(self.parentCube.firstStartTime)
            timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
            timeBreakSec = NUM.array(timeBreakSec[:-1], dtype = float)
            CUTILS.addTimeVariableInfo(time, self.parentCube.timeSize, firstStartStr, timeBreakSec)
        else:
            firstStartStr = TUTILS.dateTime2String(self.newStartTimes[0])
            timeBreakSec = TUTILS.getTimeBreakSeconds(self.newStartTimes, self.newEndTimes)
            CUTILS.addTimeVariableInfo(time, len(timeBreakSec), firstStartStr, timeBreakSec)

        #### Append and Add Location ID ####
        locationIDs, locationLabels = self.parentCube.getLocationFields(varMask = self.spatialAnalysisMask,
                                                            isSubset=True, nSubsetLoc = self.numLocations)
        locationVals = NUM.tile(locationIDs.data, self.numTime)
        locationVals = locationVals.reshape(self.numTime,  self.numLocations)
        CUTILS.createVariable(self.dataset, 'location_ID', locationVals, self.parentCube.spatialReference,
                              dType = 'i4', isPanel = True)

        #### Add Location Label ####
        locationStr = self.parentCube.getLocationLabelStr()
        if locationStr is not None:
            #### Text Labels ####
            lenCheck = NUM.vectorize(len)
            sizes = lenCheck(locationStr.data)
            maxSize = sizes.max()
            dataStr = NUM.asarray(locationStr.data, dtype=object)

            ### Apply Spatial Mask in the location string ###
            varMask = self.spatialAnalysisMask

            if varMask is not None:
                dataStr = dataStr[varMask]

            CUTILS.createStringVariable(self.dataset, "location_label", dataStr, maxSize)

        #### Int Labels ####
        if locationLabels.type.upper() == 'BIGINTEGER':
            dType = 'i8'
        elif locationLabels.type.upper() == 'LONG':
            dType = 'i4'

        locationVals = NUM.tile(locationLabels.data, self.numTime)
        locationVals = locationVals.reshape(self.numTime, self.numLocations)
        CUTILS.createVariable(self.dataset, self.parentCube.locationIDField, locationVals, 
                            self.parentCube.spatialReference, dType = dType, isPanel = True)

        #### Close Dataset ####
        self.dataset.close()

    def spatialSubset(self):
        #### Define Extent Polygon ####
        cubeShapes = self.parentCube.obtainAllShapes(outputFC = r"in_memory\input_geom")
        
        #### Subset wrt. Other Cube ####
        if self.spaceSubsetCube is not None:

            subsetShapes = self.spaceSubsetCube.obtainAllShapes(outputFC = r"in_memory\subset_geom")
            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                        selectShapes = subsetShapes,
                                                        relationship = self.rel)
            ARCPY.management.Delete(r"in_memory\input_geom")
            ARCPY.management.Delete(r"in_memory\subset_geom")
            if ARCPY.Exists(r"in_memory\input_geom.lyr"):
                    ARCPY.management.Delete(r"in_memory\input_geom.lyr")
            if ARCPY.Exists(r"in_memory\subset_geom.lyr"):
                ARCPY.management.Delete(r"in_memory\subset_geom.lyr")

        elif self.extent is not None:
            extentPoly = UTILS.extentPolygon(self.extent, backUpSR = self.parentCube.spatialReference)
            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                        selectShapes = extentPoly,
                                                        relationship = "INTERSECT")
            ARCPY.management.Delete(r"in_memory\input_geom")
            if ARCPY.Exists(r"in_memory\input_geom.lyr"):
                    ARCPY.management.Delete(r"in_memory\input_geom.lyr")

        #### Subset wrt. Feature ####
        elif self.subsetFeature is not None:
            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                selectShapes = self.subsetFeature,
                                                relationship = self.rel)
            ARCPY.management.Delete(r"in_memory\input_geom")
            if ARCPY.Exists(r"in_memory\input_geom.lyr"):
                    ARCPY.management.Delete(r"in_memory\input_geom.lyr")

        self.spatialAnalysisMask = maskInd

    def __setSubsetBaseVars__(self):
        self.subsetCube = SSPanel(self.outputCubeFile, 'a')
        ## Get Base Variables from Parent Cube ##
        baseVars, _ = CUTILS.getBaseVar(self.parentCube)
        for var in baseVars:
            data = self.parentCube.dataset[var][:][self.timeInd,:]
            data = data[:,self.spatialAnalysisMask]
            self.subsetCube.append(var, data)
            self.subsetCube.mannKendall(var)

        key = 'PREDICTION_BINARY_MASK'
        if key in self.parentCube.dataset.variables.keys():
            mask = self.parentCube.obtainMask('PREDICTION_BINARY_MASK')
            mask = mask.reshape(self.parentCube.numTime, self.parentCube.numLocations)
            mask = mask[self.timeInd,:]
            mask = mask[:,self.spatialAnalysisMask]
            self.subsetCube.append(key, mask)

        self.parentCube.close()
        self.subsetCube.close()

    def __checkForecastHorizon(self):
        if hasattr(self.parentCube.dataset, 'is_forecast'):
            forecastStartBin = int(self.parentCube.dataset.begin_forecast_bin)

            #### If Forecast Horizon is Gone Remove Forecast Keys ####
            if self.timeInd[forecastStartBin] == False:
                parentKeys = list(self.parentDict.keys())
                _ = [self.parentDict.pop(k) for k in parentKeys if 'forecast' in k or "validation" in k or "json_method_str" in k]