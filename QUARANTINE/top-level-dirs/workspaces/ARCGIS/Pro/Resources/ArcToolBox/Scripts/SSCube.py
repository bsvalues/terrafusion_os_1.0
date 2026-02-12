"""
Source Name:   SSCube.py
Version:       ArcGIS Pro
Author:        Environmental Systems Research Institute Inc.
Description:   Python tool to create/ analyze spatial and temporal pattern of
               a 3-D space time cube in netCDF4 format.
"""

################### Imports ########################
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.da as DA
import arcpy.management as DM
import ErrorUtils as ERROR
import netCDF4 as NET
import numpy as NUM
import os as OS
import re as RE
import SSDataObject as SSDO
import SSCubeObject as SSCO
import SSUtilities as UTILS
import SSCubeUtilities as CUTILS
import SSTimeUtilities as TUTILS
import WeightsUtilities as WU
import Stats as STATS
import time as TIME
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')
import datetime as DT


class SSCube(object):
    """
    Space-Time Cube API for Gridded Data (Cells or Hexagons)

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
    def __init__(self, ncFile, mode = 'r', cubeObj = None):

        #### Set Path/Mode ####
        self.path = ncFile
        self.mode = mode.lower()
        self.isPanel = False
        self.messageInfo = []
        self.outputTable = []

        #### Overwrite If Panel Object Provided ####
        if isinstance(cubeObj, SSCO.SSCubeObject) or isinstance(cubeObj, SSCO.SSMDRasterCubeObject):
            self.mode = 'w'
            self.__initialize(cubeObj)

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

                    #### Get Grid Dimensions ####
                    self.__getGridDimensions()

                    #### Get Min/Max Extent ####
                    self.__setMinMaxExtent()

                    #### Get Core Attributes ####
                    self.x = self.obtainValues('x')
                    self.y = self.obtainValues('y')
                    self.t = self.obtainValues('time')
                    self.time = self.obtainValues('time_step_ID')

                    #### Set CubeInfo Class ####
                    self.__setCubeInfo()

                    #### Rate Variables ####
                    self.getRateVariableInfo()

                    #### Read From NetCDF ####
                    self.cubeObj = None

    def __initialize(self, cubeObj):
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

        #### Check Type of Cube ####
        self.fromRaster = False
        if hasattr(cubeObj, "fromRaster"):
            self.fromRaster = True

        #### Cube Dimension Info ####
        self.__setDimInfo(cubeObj)

        #### Cube Shape Info ####
        self.__setShapeInfo(cubeObj)

        #### Set Time Info ####
        self.__setTimeInfo(cubeObj)

        #### Set Grid Dimensions ####
        self.__setGridDimensions(cubeObj)

        #### Write Dimensions ####
        self.__createDimensions(cubeObj)

        #### Write Global Attributes ####
        self.__createAttributes(cubeObj)

        #### Get Min/Max Extent ####
        self.__setMinMaxExtent()

        #### Time ID Step ####
        timeIDList = NUM.arange(0, len(cubeObj.timeBreaks) - 1)
        timeIDValue = NUM.repeat(timeIDList, self.numLocations)
        timeIDValue = timeIDValue.reshape(self.numTime, self.numRows, self.numCols)
        self.createVariable('time_step_ID', timeIDValue, dType = 'i4')
        self.time = self.obtainValues('time_step_ID')
        self.t = self.obtainValues('time')

        #### Location ID ####
        locationID = NUM.arange(0, self.numLocations)
        locationVal = NUM.tile(locationID, self.numTime)
        locationVal = locationVal.reshape(self.numTime, self.numRows, self.numCols)
        self.createVariable('location_ID', locationVal, dType = 'i4')

        #### Set Description Row ####
        self.describeRows = []

        #### Add Variables ####
        for fieldName in cubeObj.fieldNames:
            variable = cubeObj.fields[fieldName]
            if fieldName == "COUNT":
                maskName = "PROCESSING_BINARY_MASK"
                self.createVariable(fieldName, variable.data,
                                    dType = 'f8', maskName = maskName)
                self.createMaskVariable(maskName, variable.mask, fieldName)
            else:
                #### Assure Not All False Mask ####
                if variable.mask.sum() == 0:
                    ARCPY.AddIDMessage("ERROR", 110064, fieldName)
                    raise SystemExit()

                maskName = fieldName + "_MASK"
                self.append(fieldName, variable.data, maskName = maskName, 
                            maskValue = variable.mask)
            
        #### Set CubeInfo Class ####
        self.__setCubeInfo()

        #### Add Empty Rate Attribute ####
        self.dataset.rate_info = ""
        self.getRateVariableInfo()

        #### Created From SSCubeObject ####
        self.cubeObj = cubeObj

    def __setCubeInfo(self):
        self.cubeInfo = ARC._ss.CubeInfo(self.numRows, self.numCols, self.numTime, 
                                         self.cellSize, use_hexagons = self.isHexagon)

    def __getDimInfo(self):
        self.numCols = int(self.dataset.variables['x'].size)
        self.numRows = int(self.dataset.variables['y'].size)
        self.numTime = int(self.dataset.variables['time'].size)
        self.sizeSlice = int(self.numRows * self.numCols)
        self.numLocations = int(self.numRows * self.numCols)
        self.numObs = int(self.numTime * self.numLocations)

    def __setDimInfo(self, cubeObj):
        self.numCols = cubeObj.numCols
        self.numRows = cubeObj.numRows
        self.numTime = cubeObj.numTime
        self.sizeSlice = int(self.numRows * self.numCols)
        self.numLocations = self.sizeSlice
        self.numObs = int(self.numTime * self.numLocations)

        #### Assure Enough Time Bins ####
        if self.numTime < CUTILS.minNumTimeCube:
            ARCPY.AddIDMessage("ERROR", 110004)
            raise SystemExit()

        #### Error Memory Issue ####
        if self.numObs >= 2000000000.:
            ARCPY.AddIDMessage("ERROR", 110005)
            raise SystemExit()

    def __getShapeInfo(self):
        #### Shape Type ####
        try:
            self.aggShapeType = self.dataset.agg_shape_type
        except:
            self.aggShapeType = "FISHNET_GRID"
        self.isHexagon = self.aggShapeType.upper() != "FISHNET_GRID"
        self.isPolygon = True

        #### Spatial Reference and Extent ####
        self.spatialReference = self.__getSpatialReference()
        self.extent = self.__getExtent()

        #### Geometry Units ####
        distanceInfo = UTILS.DistanceInfo(self.spatialReference)
        self.geometryUnit = distanceInfo.name
        self.convertFactor = distanceInfo.convertFactor

    def __setShapeInfo(self, cubeObj):

        #### Shape Type ####
        self.aggShapeType = cubeObj.aggShapeType
        self.dataset.agg_shape_type = self.aggShapeType
        self.isHexagon = self.aggShapeType.upper() != "FISHNET_GRID"
        self.isPolygon = True

        #### Set Shape Info ####
        cubeSR = CUTILS.CubeSpatialRef(cubeObj.extent, 
                                        cubeObj.ssdo.spatialRef)

        self.extent = cubeSR.extent
        self.spatialReference = cubeSR.spatialRef
        self.distanceUnit = cubeSR.linearUnitName.upper()

        #### Projection Variable ####
        projection = self.dataset.createVariable('projection', 'i4',)
        cubeSR.createProjectionVariable(projection)
        self.isRotated = cubeSR.gridMapping == "rotated_pole"

        #### Geometry Units ####
        self.geometryUnit = cubeObj.ssdo.distanceInfo.name
        self.convertFactor = cubeObj.ssdo.distanceInfo.convertFactor
        self.dataset.geometry_unit = self.geometryUnit
        self.dataset.convert_factor = self.convertFactor

    def __getGridDimensions(self):
        #### Get Cell/User Cell Size ####
        self.cellUnit = self.dataset.cell_unit.upper()
        self.cellSize = self.dataset.cell_size
        self.userCellUnit = self.dataset.user_cell_unit.upper()
        try:
            self.userCellSize = UTILS.strToFloat(self.dataset.user_cell_size)
        except:
            self.userCellSize = self.dataset.user_cell_size

        #### Get Scale and Additions ####
        if self.isHexagon:
            self.distanceInterval = self.cellSize * CUTILS.hexScale
            self.userDistanceInterval = self.userCellSize * CUTILS.hexScale
            xScale = 1.5
            xAdd = self.cellSize * .5
            xUserAdd = self.userCellSize * .5
        else:
            xScale = 1.0
            xAdd = 0.0
            xUserAdd = 0.0
            self.distanceInterval = self.cellSize 
            self.userDistanceInterval = self.userCellSize 
        self.userDistanceIntervalStr = self.getUserDistanceIntervalStr()

        #### Set Extra Info ####
        self.__setGridExtraInfo(xScale, xAdd, xUserAdd)

    def __setGridDimensions(self, cubeObj):
        #### Set Cell/User Cell Size ####
        self.cellUnit = cubeObj.cellUnit.upper()
        self.cellSize = cubeObj.cellSize
        self.userCellUnit = cubeObj.userCellUnit.upper()
        self.userCellSize = cubeObj.userCellSize
        self.dataset.user_cell_unit = self.userCellUnit
        self.dataset.cell_unit = self.cellUnit
        self.dataset.user_cell_size = self.userCellSize
        self.dataset.cell_size = self.cellSize

        #### Set Scale and Additions ####
        self.distanceInterval = cubeObj.distanceInterval
        self.userDistanceInterval = cubeObj.userDistanceInterval
        if self.isHexagon:
            xScale = 1.5
            xAdd = self.cellSize * .5
            xUserAdd = self.userCellSize * .5
        else:
            xScale = 1.0
            xAdd = 0.0
            xUserAdd = 0.0
        self.userDistanceIntervalStr = self.getUserDistanceIntervalStr()

        #### Set Extra Info ####
        self.__setGridExtraInfo(xScale, xAdd, xUserAdd)

    def __setGridExtraInfo(self, xScale, xAdd, xUserAdd):
        #### X Length ####
        self.cellWidth = self.cellSize * xScale
        self.userCellWidth = self.userCellSize * xScale
        self.gridWidth = (self.numCols * self.cellWidth) + xAdd
        self.userGridWidth = (self.numCols * self.userCellWidth) + xUserAdd

        #### Add Sliver ####
        self.cellWidth += xAdd
        self.userCellWidth += xUserAdd

        #### Y Length ####
        self.cellHeight = self.distanceInterval
        self.userCellHeight = self.userDistanceInterval
        self.gridHeight = self.numRows * self.distanceInterval
        self.userGridHeight = self.numRows * self.userDistanceInterval

        #### Area ####
        if self.isHexagon:
            areaScale = ((3.0 * CUTILS.hexScale) / 2.0) 
            self.cellArea = areaScale * float(self.cellSize)**2.0
            self.userCellArea = areaScale * float(self.userCellSize)**2.0
        else:
            self.cellArea = float(self.cellSize)**2
            self.userCellArea = float(self.userCellSize)**2.0
        self.gridArea = self.cellArea * float(self.sizeSlice)
        self.userGridArea = self.userCellArea * self.sizeSlice

    def __getTimeInfo(self):
        #### Get Alignment Info ####
        if hasattr(self.dataset, 'alignment'):
            self.hasAlignment = True
            self.alignment = self.dataset.alignment.upper()
        else:
            self.hasAlignment = False
            self.alignment = 'END'

        #### Set Is Start Time ? ####
        self.__assessAlignment()

        #### Time Unit/Size ####
        self.timeUnit = self.dataset.time_unit.upper()
        if self.timeUnit[-1] != "S":
            self.timeUnit += "S"
        self.timeSize = int(self.dataset.time_size)
        self.timeStepLabel = self.dataset.time_step_label
        self.timeStepLabelLocale = TUTILS.prettyTime(self.timeStepLabel.lower(), localizeUnit=True)
        self.refTime = ''

        #### Start End Time Bin Values ####
        try:
            firstStartStr = self.dataset.first_start_time
            firstEndStr = self.dataset.first_end_time
            lastStartStr = self.dataset.last_start_time
            lastEndStr = self.dataset.last_end_time
            #### Reference Time ####
            refTimeStr = self.dataset.reference_time
            self.refTime = TUTILS.convert2DateTime(refTimeStr)
        except:
            firstStartStr = self.dataset.start_time
            firstEndStr = self.dataset.end_start_time
            lastStartStr = self.dataset.end_time
            lastEndStr = self.dataset.end_end_time
        self.firstStartTime = TUTILS.convert2DateTime(firstStartStr)
        self.firstEndTime = TUTILS.convert2DateTime(firstEndStr)
        self.lastStartTime = TUTILS.convert2DateTime(lastStartStr)
        self.lastEndTime = TUTILS.convert2DateTime(lastEndStr)
        if self.firstStartTime is None and self.firstEndTime is None:
            ARCPY.AddIDMessage("ERROR", 110003, self.path)
            raise SystemExit()

        ### Data Start/End Time ####
        try:
            self.dataMinTime = self.dataset.data_min_time
            self.dataMaxTime = self.dataset.data_max_time
        except:
            self.dataMinTime = None
            self.dataMaxTime = None

        #### Get Bias Info ####
        try:
            self.startBias = self.dataset.start_bias
            self.endBias = self.dataset.end_bias
        except:
            self.startBias = ARCPY.GetIDMessage(84499) 
            self.endBias = ARCPY.GetIDMessage(84499)

        #### Get Forecast Info ####
        if hasattr(self.dataset, 'is_forecast'):
            self.isForecast = self.dataset.is_forecast.upper() == "TRUE"
            self.beginForecastBin = int(self.dataset.begin_forecast_bin)

    def __setTimeInfo(self, cubeObj):

        #### Set Alignment Info ####
        self.hasAlignment = True
        self.alignment = cubeObj.timeAlignment.upper()

        #### Set Is Start Time ? ####
        self.__assessAlignment()

        #### Time Unit/Size/Label ####
        self.timeUnit = cubeObj.timeUnit
        self.timeSize = cubeObj.timeSize
        self.timeStepLabel = cubeObj.timeStepLabel
        self.timeStepLabelLocale = TUTILS.prettyTime(self.timeStepLabel.lower(), localizeUnit=True)
        self.refTime = cubeObj.refTime
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
        self.firstStartTime = cubeObj.timeBreaks[0]
        self.firstEndTime = cubeObj.timeBreaks[1]
        self.lastStartTime = cubeObj.timeBreaks[-2]
        self.lastEndTime = cubeObj.timeBreaks[-1]
        self.dataset.first_start_time = TUTILS.dateTime2String(self.firstStartTime)
        self.dataset.first_end_time = TUTILS.dateTime2String(self.firstEndTime)
        self.dataset.last_start_time = TUTILS.dateTime2String(self.lastStartTime)
        self.dataset.last_end_time = TUTILS.dateTime2String(self.lastEndTime)

        ### Data Start/End Time ####
        self.dataMinTime = cubeObj.dataMinTime
        self.dataMaxTime = cubeObj.dataMaxTime
        self.dataset.data_min_time = self.dataMinTime
        self.dataset.data_max_time = self.dataMaxTime

        #### Set Bias Info ####
        self.startBias = cubeObj.startBias
        self.endBias = cubeObj.endBias
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

    def __createDimensions(self, cubeObj):
        """
        Function to create dimension for cube

        INPUT:
            cubeObj (obj): Instance of SSPanelObject Object

        """
        #### Create Dimension ####
        self.dataset.createDimension('time', self.numTime)
        self.dataset.createDimension('x', self.numCols)
        self.dataset.createDimension('y', self.numRows)

        #### Create Dimension Variable ####
        time = self.dataset.createVariable('time', 'f8', ('time'))
        x = self.dataset.createVariable('x', 'f8', ('x'))
        y = self.dataset.createVariable('y', 'f8', ('y'))
        lat = self.dataset.createVariable('lat', 'f8', ('y', 'x'))
        lon = self.dataset.createVariable('lon', 'f8', ('y', 'x'))

        #### Time Variable ####
        timeArray = NUM.array(cubeObj.timeBreaks, dtype = 'datetime64[s]')
        timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        timeBreakSec = NUM.array(timeBreakSec[:-1], dtype = float)
        firstStartStr = TUTILS.dateTime2String(self.firstStartTime)
        self.__createTimeVariable(time, firstStartStr, timeBreakSec)

        #### Get Centroids ####
        centroids = cubeObj.agg.return_centroids()
        allXValues = centroids[:,0].reshape(self.numRows, self.numCols)
        allYValues = centroids[:,1].reshape(self.numRows, self.numCols)

        #### X Variable ####
        self.x = allXValues[0]
        self.__createLocationVariable(x, 'x', self.x)

        #### Y Variable ####
        self.y = allYValues[:,0]
        self.__createLocationVariable(y, 'y', self.y)

        if len(centroids) > 1e7:
            lonlat = ARC._ss.change_projection_xy(centroids, self.spatialReference, self.spatialReference.GCS)
        else:
            #### Project XY Coords to LonLat ####
            lonlat = ARC._ss.xy_to_lonlat(centroids, self.spatialReference)

        lonValues = lonlat[:,0].reshape(self.numRows, self.numCols)
        latValues = lonlat[:,1].reshape(self.numRows, self.numCols)

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

    def __createAttributes(self, cubeObj):
        """
        Function to write global attributes to cube
        """

        #### Attribute for General Info ####
        self.version = ARCPY.GetInstallInfo()['Version']
        self.dataset.description = 'Space-Time Pattern Mining Cube'
        self.dataset.history = 'Created by ' + DT.datetime.now().ctime()
        self.dataset.source = 'Space Time Pattern Mining Tools;'
        self.dataset.source += self.version
        self.dataset.featureType = "timeSeries"

        if isinstance(cubeObj, SSCO.SSCubeObject):
            self.dataset.sourceTool = "Cube"
        elif isinstance(cubeObj, SSCO.SSMDRasterCubeObject):
            self.dataset.sourceTool = "Cube_MDRaster"

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

    def getUserDistanceIntervalStr(self):
        roundValue = float(round(self.userDistanceInterval))
        if UTILS.compareFloat(roundValue, self.userDistanceInterval):
            value = roundValue
        else:
            value = self.userDistanceInterval

        return UTILS.prettyUnits(value, self.userCellUnit, formatStr = "%0.2f")

    def __setMinMaxExtent(self):
        lenX = self.extent.XMax - self.extent.XMin
        lenY = self.extent.YMax - self.extent.YMin
        self.minExtent, self.maxExtent = NUM.sort([lenX, lenY])

    def getInternalExtent(self):
        extentArray = NUM.zeros((4,), dtype = float)
        extentArray[:] = self.dataset.extent
        if self.aggShapeType == "HEXAGON_GRID":
            xAdd = self.cellSize * .5
            yAdd = self.cellHeight * .5
            diffArray = NUM.array([0.0, yAdd, -xAdd, 0.0], dtype = float)
            extentArray = extentArray + diffArray

        return extentArray

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
            validStr = 'Space-Time Pattern Mining Cube'
            if cube.description == validStr:
                self.dataset = cube
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
            
            try:
                spatialRef = ARCPY.SpatialReference()
                spatialRef.loadFromString(peString)
            except:
                extentArray = self.dataset.extent
                extent = ARCPY.Extent(extentArray[0], extentArray[1],extentArray[2], extentArray[3])
                spatialRef = ARCPY.SpatialReference()
                spatialRef.loadFromString(rawPeString)
                cubeSR = CUTILS.CubeSpatialRef(extent, spatialRef, displayCVMessage = False)
                projectionTemp = cubeSR.createProjectionVariable()
                try:
                    spatialRef = ARCPY.SpatialReference()
                    spatialRef.loadFromString(projectionTemp.esri_pe_string)
                except:
                    return None
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

    def obtainCentroid(self, row, col):
        x = self.x[col]
        y = self.y[row]

        return x, y

    def obtainValues(self, varName, flatten = True, fillZeros = False):
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
                values = self.dataset.variables[varName][:].ravel()
            else:
                values = self.dataset.variables[varName][:] 
            if fillZeros:
                return CUTILS.fillWithZeros(values)
            else:
                return values
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

        tool = False
        prefix = varName.split("_")[0]

        #### Decide if Tool Driven Mask ####
        if prefix == 'EMERGING':
            varName = varName.split('EMERGING_')[1]
            maskName = varName + '_EHSAMASK'
            if maskName in self.dataset.variables:
                tool = True

        if prefix == 'OUTLIER':
            varName = varName.split('OUTLIER_')[1]
            maskName = varName + '_COAMASK'
            if maskName in self.dataset.variables:
                tool = True

        if prefix == 'TSCLUST':
            varName = varName.split('TSCLUST_')[1]
            maskName = varName + '_TSCMASK'
            if maskName in self.dataset.variables:
                tool = True

        if prefix == 'FORECAST':
            varName = varName.split('FORECAST_')[1]
            maskName = varName + '_FORECASTMASK'
            if maskName in self.dataset.variables:
                tool = True

        if prefix == 'CPD':
            varName = varName.split('CPD_')[1]
            maskName = varName + '_CPDMASK'
            if maskName in self.dataset.variables:
                tool = True

        if prefix == 'TSCORR':
            varName = varName.split('TSCORR_')[1]
            maskName = varName + '_TSCORRMASK'
            if maskName in self.dataset.variables:
                tool = True

        if not tool :
            if varName in self.dataset.variables:
                if varName == "COUNT":
                    maskName = "PROCESSING_BINARY_MASK"
                else:
                    maskName = varName + "_MASK"
            else:
                return None

        mask = NUM.array(self.dataset.variables[maskName][:], dtype = bool)
        return mask.ravel()

    def obtainMask(self, maskName, flatten = True):
        """
        Function to obtain mask value in cube

        INPUT:
            maskName (str): Mask name in cube
            flatten {bool}: Boolean to decide return shape, default is true

        OUTPUT:
            value (NUM Arr): NumPy Array of mask value

        """
        if maskName in self.dataset.variables:
            mask = NUM.array(self.dataset.variables[maskName][:], dtype = bool)
            if flatten:
                return mask.ravel()
            else:
                return mask

    def obtainTimeSeries(self, varName):
        """
        Function to obtain total counts/values in one time slice

        INPUT:
            varName (str): Variable name in cube

        OUTPUT:
            timeSeries (NUM Arr): 1D NumPy Array for time series

        """
        if varName in self.dataset.variables:
            if self.getVarDimension(varName) > 2:
                timeSeries = NUM.zeros((self.numTime,), float)
                timeSeries[:] = self.dataset.variables[varName][:].sum(-1).sum(1)
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
            if self.getVarDimension(varName) > 2:
                timeSeries = self.obtainTimeSeries(varName)
                mkVal, mkPVal = ARC._ss.mann_kendall(timeSeries, 2, None, numThreads )
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
        ignoreList = NUM.array(['x', 'y', 'lat', 'lon', 'projection', 'time'])
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
        if dimType == 2:
            dim = ('y', 'x')
        else:
            dim = ('time', 'y', 'x')

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
        if dimType == 2:
            var.coordinates = "lat lon"
        else:
            var.coordinates = "time lat lon"

        if maskName is not None:
            var.setncattr('mask',maskName)

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
            mask = self.dataset.createVariable(maskName, 'i', 
                                               ('y', 'x'))
            mask.long_name = maskName
            mask.standard_name = maskName
            mask.grid_mapping = 'projection'
            mask.esri_pe_string = self.spatialReference.exportToString()
            mask.type = 'mask'
            mask.coordinates = "lat lon"
            if varName is not None:
                mask.variable = varName

        mask[:] = maskValue.reshape(self.numRows, self.numCols)

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
                                                      ('time', 'y', 'x'))
            estimateVar.long_name = estimateName
            estimateVar.standard_name = estimateName
            estimateVar.grid_mapping = 'projection'
            estimateVar.esri_pe_string = self.spatialReference.exportToString()
            estimateVar.type = 'estimate'
            estimateVar.coordinates = "time lat lon"
            if varName is not None:
                estimateVar.variable = varName

        estimateVar[:] = estimateValue.reshape(self.numTime, self.numRows, self.numCols)

    def getExcludedIndex(self, varName):
        """
        Function to return exluded location index

        INPUT:
            varNam {str}: Variable name in cube

        OUTPUT:
            a list of NumPy array containing Excluded Location Index
        """
        countMask = self.obtainVariableMask("COUNT")

        #### If CountMask is None COUNT does not exist ###
        #### Only possible in a cube from  MD raster ####
        if countMask is None:
            varMask = self.obtainVariableMask(varName)
            return NUM.nonzero( (~varMask))[0]

        varMask = self.obtainVariableMask(varName)
        return NUM.nonzero((countMask) & (~varMask))[0]

    def append(self, varName, varValue, maskName = None, maskValue = None, 
               estimated = True):
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

        #### Make Robust to Any Shape ####
        varValue = varValue.ravel()
        outType = varValue.dtype
        if len(varValue) == self.numLocations:
            varValue = varValue.reshape(self.numRows, self.numCols)
        elif len(varValue) == self.numObs:
            varValue = varValue.reshape(self.numTime, self.numRows, self.numCols)
        else:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        dimType = len(varValue.shape)

        #### Determine Missing Value ####
        missingVal = -9999.
        try:
            #### Determine Data Type Based on Value Type ####
            if outType == NUM.int32:
                #### Int32 ####
                dType = 'i4'
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

            #### Fill Masked Value to varValue ####
            tiledMask = NUM.tile(maskValue.ravel(), self.numTime)
            tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols)
            varValue[~tiledMask] = missingVal

            #### Robust to Shape ####
            maskValue = maskValue.reshape(self.numRows, self.numCols)

            #### Detect if Mask Existed in Cube ####
            if maskName in self.dataset.variables:
                mask = self.dataset.variables[maskName]
                mask[:] = maskValue
            else:
                self.createMaskVariable(maskName, maskValue, varName)

            #### Detect if Created Estimate Variable ####
            if (estimated) and (dimType == 3) and not self.fromRaster:
                estimateName = varName + '_ESTIMATED'

                #### Extract 3D Zero-Count Mask ####
                count3DMask = self.dataset.variables['COUNT'][:] == 0

                #### Intersect: Count Mask is 0 and Tiled Mask is True ###
                estimateValue = count3DMask * tiledMask
                estimateValue = estimateValue.reshape(self.numTime, self.numRows, 
                                                        self.numCols)

                #### Rewrite/ Create Estimate Variable ####
                if estimateName in self.dataset.variables:
                    estimateVar = self.dataset.variables[estimateName]
                    estimateVar[:] = estimateValue
                else:
                    self.createEstimateVariable(estimateName, estimateValue, 
                                                varName)

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
            if self.dataset.isopen():
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
        dataset.createDimension('x', len(self.dataset.dimensions['x']))
        dataset.createDimension('y', len(self.dataset.dimensions['y']))

        #### Copy Projection and XY Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon']
        invDim = False
        for varName in vars2Copy:
            var = self.dataset.variables[varName]
            dimensions = var.dimensions

            if varName in ['lat', 'lon']:
                ### OlD cube ###
                if len(var.dimensions) == 1:
                    dataset.createDimension(varName, len(self.dataset[varName][:]))
                    invDim = True

            newVar = dataset.createVariable(varName, var.datatype, dimensions)

            dataset[varName][:] = self.dataset[varName][:]
            dataset[varName].setncatts(self.dataset[varName].__dict__)

        if invDim:
            ARCPY.AddIDMessage("WARNING", 110031)

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
        timeIDValue = timeIDValue.reshape(numTime, self.numRows, self.numCols)
        CUTILS.createVariable(dataset, 'time_step_ID', timeIDValue, self.spatialReference,
                              dType = 'i4')

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
        locationID = NUM.arange(0, self.numLocations)
        locationVal = NUM.tile(locationID, numTime)
        locationVal = locationVal.reshape(numTime, self.numRows, self.numCols)
        CUTILS.createVariable(dataset, 'location_ID', locationVal, self.spatialReference,
                              dType = 'i4')

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
        dataset.createDimension('x', len(self.dataset.dimensions['x']))
        dataset.createDimension('y', len(self.dataset.dimensions['y']))
        dataset.createDimension('time', self.numTime)

        #### Copy Projection and XY Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon', 'time_step_ID', 'time', 'location_ID']
        invDim = False

        for varName in vars2Copy:
            var = self.dataset.variables[varName]

            if varName in ['lat', 'lon']:
                ### OlD cube ###
                if len(var.dimensions) == 1:
                    dataset.createDimension(varName, len(self.dataset[varName][:]))
                    invDim = True            

            newVar = dataset.createVariable(varName, var.datatype, var.dimensions)
            dataset[varName][:] = self.dataset[varName][:]
            dataset[varName].setncatts(self.dataset[varName].__dict__)

        if invDim:
            ARCPY.AddIDMessage("WARNING", 110031)

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

    def setStats(self, y, mask):
        """Set Statistics and Masked Data Array for Current Analysis.
        INPUTS:
        y (array): data to analyze
        mask (array): tiled mask array for analysis

        RETURN:
        yMasked (array): all unmasked values
        """

        yMasked = y[mask]
        self.numAnalysisBins = int(mask.sum())
        self.nonZeroBins = (yMasked != 0).sum()
        self.percentNonZeroBins = (self.nonZeroBins / self.numAnalysisBins) * 100
        self.numAnalysisLocations = int(mask[0:self.cubeInfo.size_slice].sum())

        return yMasked

    def generalCubeReport(self):
        """Initial Input Cube Details for Analysis Types."""

        ##### Cube Report ####
        header = ARCPY.GetIDMessage(84604)
        rows = []
        emptyRow = ["", ""]

        #### Distance Interval ####
        distanceInterval = self.getUserDistanceIntervalStr()
        rows.append([ ARCPY.GetIDMessage(84605), distanceInterval] )

        #### Time Step Interval ####
        rows.append([ ARCPY.GetIDMessage(84606), self.timeStepLabelLocale])
        rows.append(emptyRow)

        #### Agg Shape Type ####
        if self.isHexagon:
            outShapeType = ARCPY.GetIDMessage(220643)
        else:
            outShapeType = ARCPY.GetIDMessage(220644)
        rows.append([ ARCPY.GetIDMessage(84692), outShapeType])
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
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.firstStartTime),
                                                     align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.firstEndTime),
                                                    align="right")])
        rows.append(emptyRow)

        #### Last Time Step Temporal Bias ####
        endBias = UTILS.formatPercentage(self.endBias, 2, multiplier=1)
        rows.append([ ARCPY.GetIDMessage(84635), endBias])

        #### Last Time Step Interval ####
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84555), rowSpan=4), spanStr1])
        rows.append([ "@@none",UTILS.buildTableCell(TUTILS.dateTime2String(self.lastStartTime),
                                                   align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(self.lastEndTime),
                                                    align="right")])
        rows.append(emptyRow)

        #### Number of Time Steps ####
        rows.append([ ARCPY.GetIDMessage(84603), self.numTime] )

        #### Number of Locations ####
        rows.append([ ARCPY.GetIDMessage(84607), self.numAnalysisLocations ] )

        #### Number of Space Time Bins ####
        rows.append([ ARCPY.GetIDMessage(84608), self.numAnalysisBins ] )

        #### % non-zero ####
        percVal = LOCALE.format_string("%0.2f", self.percentNonZeroBins)
        percStr = ARCPY.GetIDMessage(84612).format(percVal)
        rows.append([ ARCPY.GetIDMessage(84609), percStr ] )

        #### End Line ####
        rows.append("EMPTY")

        #### Store Description Rows ####
        self.describeRows = rows

        #### End Cube Details Table ####
        ARCPY.AddMessage("")
        outputTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                            justify = ['left', 'right'],
                                            titleFillToken = "-",
                                            emptyFillToken = "-", emphasizeHeadRow=False,
                                            force2Txt=False)
        outputTable += "\n"

        return outputTable

    def analysisReport(self, permutations = None):
        """General Analysis / Neighborhood Report for Cube."""
        header = ARCPY.GetIDMessage(84547)

        #### Neighborhood Info  ####
        if self.neighborInfo is not None:
            rows = self.neighborInfo.returnSearchInfo()
        else:
            rows = []

            #### Neighborhood Distance ####
            rows.append( [ ARCPY.GetIDMessage(84549), self.printThreshold ] )

        #### Neighborhood Time Step Intervals ####
        rows.append( [ ARCPY.GetIDMessage(84550), str(self.cubeInfo.time_order)] )

        #### Spanning ####
        userTimeValue, userTimeUnit = self.dataset.time_step_label.split()
        spanTime = int(userTimeValue) * self.cubeInfo.time_order
        spanStr = UTILS.formatString("{0} {1}")
        spanInit = spanStr.format(spanTime, userTimeUnit)
        spanValue = TUTILS.prettyTime(spanInit)
        spanning = ARCPY.GetIDMessage(84610).format(spanValue.lower())
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

        #### Avoid Use Count When Input is a MDRaster ####
        defaultVar = "COUNT"

        #### Check From Raster for Old Cubes ####
        if hasattr(self, 'fromRaster'):
            if self.fromRaster:
                defaultVar = varNames[0]
        elif hasattr(self, "isForecast") and self.isForecast:
            defaultVar = varNames[0]
        elif subType.upper() == 'CPD':
            defaultVar = varNames[0]
        elif subType.upper() == 'MDR' or 'SUBSET' in subType.upper():
            defaultVar = varNames[0]
        elif subType.upper() == 'OLD_MDR':
            defaultVar = varNames[0]

        #### Prepare Dictionary for Table Export ####
        tableFields = ['rows', 'header', 'pad', 'justify', 
                       'titleFillToken', 'colPad', 'emphasizeHeadRow', 
                       'returnHTMLMsg', 'tableSize', 'isCount', 'isSumm']
        
        self.messageInfo = {field:[] for field in tableFields}

        #### Summary Stats for Count ####
        counts = self.obtainValues(defaultVar, flatten = True)
        numPoints = int(counts.sum())
        mask = self.obtainVariableMask(defaultVar)
        totalBins = self.numLocations * self.numTime
        nonZeroBinCount = NUM.count_nonzero(counts)
        if subType is not None:
            if hasattr(counts, 'mask'):
                if counts.mask is not False and subType.upper() == "SUBSET":
                    nonZeroBinCount = NUM.count_nonzero(counts.data[~counts.mask])
        numDataLocations = mask.sum()
        totalDataLocations = numDataLocations * self.numTime
        dataProp = (1.0 * numDataLocations) / self.numLocations
        totalProp = (1.0 * nonZeroBinCount) / totalBins
        localProp = (1.0 * nonZeroBinCount) / totalDataLocations
        timeSeries = self.obtainTimeSeries(defaultVar)
        nonZeroTimes = NUM.count_nonzero(timeSeries)
        timeProp = (1.0 * nonZeroTimes) / self.numTime
        numThreads = UTILS.getNumberOfThreadsDefault()
        pcsName = self.spatialReference.PCSName.replace('_', ' ')
        totalBinsInit = totalBins
        binRatio = totalDataLocations/totalBinsInit

        mkValCount, mkPValCount = ARC._ss.mann_kendall(timeSeries,2, None, numThreads )

        ##### Informative Paragraph ####
        bullet = "-"
        indent = UTILS.formatString("{0} {1}")
        dataPerc = LOCALE.format_string("%0.2f", dataProp * 100.0)
        localPerc = LOCALE.format_string("%0.2f", localProp * 100.0)
        binPercInit = LOCALE.format_string("%0.2f", binRatio * 100.0)
        formatStr = "%0.2f"
        
        #### Edge [CellSize] ####
        cellSize = UTILS.prettyUnits(self.userCellSize, self.userCellUnit,
                                     formatStr = formatStr, localizeUnit=True)

        #### X Length ####
        cellWidth =  UTILS.prettyUnits(self.userCellWidth, self.userCellUnit,
                                       formatStr = formatStr, localizeUnit=True)

        xLength = UTILS.prettyUnits(self.userGridWidth, self.userCellUnit,
                                    formatStr = formatStr, localizeUnit=True)

        #### Y Length ####
        cellHeight =  UTILS.prettyUnits(self.userCellHeight, self.userCellUnit,
                                        formatStr = formatStr, localizeUnit=True)

        yLength = UTILS.prettyUnits(self.userGridHeight, self.userCellUnit,
                                    formatStr = formatStr, localizeUnit=True)

        #### Area ####
        cellArea = UTILS.prettyUnits(self.userCellArea, self.userCellUnit, 
                                     area = True, formatStr = formatStr, localizeUnit=True)

        #### Time Info ####
        tTotal = self.numTime * self.timeSize
        totalTimeLabel = TUTILS.prettyTime(indent.format(tTotal, self.timeUnit), localizeUnit=True)
        timePerc = LOCALE.format_string("%0.2f", (timeProp * 100))
        timePercStr = ARCPY.GetIDMessage(84535).format(timePerc)

        #### Trend Info ####
        direction, trendString = UTILS.getMannKendallDirStr(mkValCount, mkPValCount)

        #### Par Info ####
        if self.isHexagon:
            messID = 84693
            parValues = (numPoints, self.numLocations, self.numTime, 
                         cellHeight.lower(), cellWidth.lower(), cellSize.lower(), 
                         cellArea.lower(), xLength.lower(), yLength.lower(),
                         self.timeStepLabelLocale,
                         totalTimeLabel.lower(),
                         numDataLocations, dataPerc, totalDataLocations,
                         nonZeroBinCount, localPerc, trendString)
        else:
            messID = 84540
            parValues = (numPoints, self.numLocations, self.numTime,
                         cellSize.lower(), xLength.lower(), yLength.lower(),
                         self.timeStepLabelLocale,
                         totalTimeLabel.lower(),
                         numDataLocations, dataPerc, totalDataLocations, 
                         nonZeroBinCount, localPerc, trendString)

        outputTable = [UTILS.outputParagraph(ARCPY.GetIDMessage(messID).format(*parValues), returnHTMLMsg=True, force2Txt=False)]

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
        displayUnit = UTILS.distanceUnitInfo[self.cellUnit][0].lower()
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
        rows.append([ ARCPY.GetIDMessage(84526), self.numRows ])
        rows.append([ ARCPY.GetIDMessage(84527), self.numCols ])
        rows.append([ ARCPY.GetIDMessage(84620), totalBins ])

        if not outputMessage:
            if "_FORECAST" in subType.upper():
                rows[0] = [UTILS.buildTableCell(ARCPY.GetIDMessage(220457), rowSpan=2), self.dataMinTime]

            #### For Describe Change to User Cell Unit ####
            displayUnitDesc = UTILS.distanceUnitInfo[self.cellUnit][0].lower()
            if displayUnitDesc in UTILS.localizableUnit:
                displayUnitDesc = UTILS.localizableUnit[displayUnitDesc].format("").strip()

            coordTypeDesc = ARCPY.GetIDMessage(84520).format(displayUnitDesc)
            rows[-8] = [ ARCPY.GetIDMessage(84519), coordTypeDesc]

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

        outputTable += [UTILS.outputTextTable(rows, header = header, pad = 1,
                                              justify = ['left', 'right'],
                                              titleFillToken = "-", colPad = 2,
                                              emphasizeHeadRow=False,
                                              tableSize = None,
                                              returnHTMLMsg=True, force2Txt=False)]

        #### Summary Fields ####
        if len(varNames) > 0:
            countBool = counts < 1

            for varName in varNames:
                if varName == "COUNT":
                    rows = []
                    
                    header = varName
                    numLocs = UTILS.returnAdjustedString(str(self.numLocations), 
                                                         7, justify = 'right')
                    dataLocs = UTILS.returnAdjustedString(str(numDataLocations), 
                                                          7, justify = 'right')
                    rows.append([ ARCPY.GetIDMessage(84573), str(numLocs) ])
                    rows.append([ ARCPY.GetIDMessage(84530), str(dataLocs) ])
                    indentBins = indent.format(bullet, ARCPY.GetIDMessage(84618))
                    strAllDataLocs = str(totalDataLocations)
                    allDataLocs = UTILS.returnAdjustedString(strAllDataLocs, 7, 
                                                             justify = 'right')
                    rows.append([ indentBins, allDataLocs ])
                    indentSparse = indent.format(bullet, ARCPY.GetIDMessage(84619))
                    localPerc = UTILS.returnAdjustedString(localPerc, 7, 
                                                           justify = 'right')
                    rows.append([ indentSparse, localPerc ])

                    if not outputMessage:
                        describeRows = []
                        dataLocsDesc = UTILS.returnAdjustedString("{0} ({1}%)".format(numDataLocations, 
                                                                                      dataPerc),
                                                                 10, justify = 'center')
                        numLocsDesc = UTILS.returnAdjustedString(str(self.numLocations),  10, justify = 'center')
                        allDataLocs = UTILS.returnAdjustedString(strAllDataLocs, 10, justify = 'center')
                        localPercDesc = UTILS.returnAdjustedString('{0}%'.format(localPerc), 7, 
                                                                   justify = 'center')
                        allDataLocsDesc = UTILS.returnAdjustedString("{0} ({1}%)".format(strAllDataLocs, 
                                                                                         binPercInit), 
                                                                     10, justify = 'center')
                        
                        describeRows.append(["", ARCPY.GetIDMessage(220449), 
                                         ARCPY.GetIDMessage(220452), ARCPY.GetIDMessage(220453)])

                        describeRows.append([ARCPY.GetIDMessage(220467), str(numLocs), str(dataLocsDesc), ""])
                        describeRows.append([ARCPY.GetIDMessage(220468), str(totalBinsInit), allDataLocsDesc, 
                                             "{0} ({1})".format(nonZeroBinCount, localPercDesc)])
                        
                        self.messageInfo['rows'].append(describeRows)
                        self.messageInfo['header'].append(header)
                        self.messageInfo['pad'].append(1)
                        self.messageInfo['justify'].append(["left"]*4)
                        self.messageInfo['titleFillToken'].append("-")
                        self.messageInfo['colPad'].append(2)
                        self.messageInfo['emphasizeHeadRow'].append(True)
                        self.messageInfo['returnHTMLMsg'].append(True)
                        self.messageInfo['tableSize'].append("small")
                        self.messageInfo['isCount'].append(True)
                        self.messageInfo['isSumm'].append(False)

                    outputTable += [UTILS.outputTextTable(rows, header = header,
                                                          pad = 1,
                                                          justify = ['left', 'right']*2,
                                                          titleFillToken = "-",
                                                          emptyFillToken = "-",
                                                          colPad = 14,
                                                          boldCols = 0,
                                                          tableSize = None,
                                                          returnHTMLMsg=True, force2Txt=False)]
                else:
                    totalLocs = self.obtainVariableMask(varName).sum()
                    totalBins = totalLocs * self.numTime
                    aggData = self.obtainValues(varName, flatten = True)
                    aggData = NUM.ma.array(aggData)                    
                    fillBinsBool = countBool & (~aggData.recordmask)
                    totalFillBins = fillBinsBool.sum()
                    fillLocBool = fillBinsBool.reshape(self.numTime,
                                                       self.numRows,
                                                       self.numCols)
                    totalFillLocs = (fillLocBool.sum(0) > 0).sum()
                    unfillLoc = len(self.getExcludedIndex(varName))
                    unfillLocPerc = (unfillLoc / self.numLocations) * 100
                    unfillPerc = LOCALE.format_string("%0.2f", unfillLocPerc)
                    unfillPerc = UTILS.returnAdjustedString(unfillPerc, 7, 
                                                            justify = 'right')
                    unfillBins = '{0} ({1}%)'.format(unfillLoc, unfillPerc)
                    rows = []

                    header = ARCPY.GetIDMessage(84636).format(UTILS.decodeString(varName))

                    #### Locations Excluded due to Unfilled Bins ####
                    rows.append([ ARCPY.GetIDMessage(84640), unfillBins ])
                    indentTotal = indent.format(bullet, ARCPY.GetIDMessage(84638))
                    rows.append([ indentTotal, unfillLoc ])

                    #### Total Number of Locations ####
                    rows.append( [ ARCPY.GetIDMessage(84573), totalLocs ] )
                    indentBins = indent.format(bullet, ARCPY.GetIDMessage(84618))
                    rows.append([ indentBins, totalBins ])

                    #### Estimated Bins and Locations ####
                    if totalLocs == 0:
                        locPerc = binPerc = 0
                    else:    
                        locPerc =  (totalFillLocs / totalLocs) * 100
                        binPerc = (totalFillBins / totalBins) * 100
                    
                    fillLocs = UTILS.formatPercentage(locPerc, 2, multiplier=1)
                    fillBins = UTILS.formatPercentage(binPerc, 2, multiplier=1)
                    fillLocs = UTILS.returnAdjustedString(fillLocs, 7, 
                                                          justify = 'right')
                    fillBins = UTILS.returnAdjustedString(fillBins, 7, 
                                                          justify = 'right')

                    rows.append([ ARCPY.GetIDMessage(84639), fillLocs ])
                    rows.append([ indentTotal, totalFillLocs ])
                    rows.append([ ARCPY.GetIDMessage(84637), fillBins ])
                    rows.append([ indentTotal, totalFillBins ])

                    if not outputMessage:
                        describeRows = []        
                        describeRows.append([ "", ARCPY.GetIDMessage(220449), 
                                         ARCPY.GetIDMessage(220450), ARCPY.GetIDMessage(220451)])

                        describeRows.append([ARCPY.GetIDMessage(220447), totalLocs, 
                                             str(totalFillLocs) + ' ({0})'.format(fillLocs), unfillBins])
                        describeRows.append([ARCPY.GetIDMessage(220448), totalBins, 
                                             str(totalFillBins) + ' ({0})'.format(fillBins), '-'])
                        
                        self.messageInfo['rows'].append(describeRows)
                        self.messageInfo['header'].append(header)
                        self.messageInfo['pad'].append(1)
                        self.messageInfo['justify'].append(['left', 'right']*2)
                        self.messageInfo['titleFillToken'].append("-")
                        self.messageInfo['colPad'].append(2)
                        self.messageInfo['emphasizeHeadRow'].append(True)
                        self.messageInfo['returnHTMLMsg'].append(True)
                        self.messageInfo['tableSize'].append("small")
                        self.messageInfo['isCount'].append(False)
                        self.messageInfo['isSumm'].append(True)

                    outputTable += [UTILS.outputTextTable(rows, header = header,
                                                          pad = 1,
                                                          justify = ['left', 'right'],
                                                          titleFillToken = "-",
                                                          colPad = 2,
                                                          tableSize = None,
                                                          returnHTMLMsg=True, force2Txt=False)]

        numThreads = UTILS.getNumberOfThreadsDefault()
        #### Overall Data Trend ####
        for varName in varNames:
            header = ARCPY.GetIDMessage(84536).format(UTILS.decodeString(varName))
            if varName != 'COUNT':
                timeSeries = self.obtainTimeSeries(varName)
                mkVal, mkPVal = ARC._ss.mann_kendall(timeSeries, 2, None, numThreads )
                direction, trendString = UTILS.getMannKendallDirStr(mkVal, mkPVal) 

            else:
                mkVal = mkValCount
                mkPVal = mkPValCount
            direction = UTILS.returnAdjustedString(direction, 15, justify = 'right')
            rows = []
            rows.append( [ARCPY.GetIDMessage(84537), direction] )
            rows.append( [ARCPY.GetIDMessage(84538), LOCALE.format_string("%0.4f", mkVal)] )
            rows.append( [ARCPY.GetIDMessage(84539), LOCALE.format_string("%0.4f", mkPVal)] )

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
            self.outputTable = outputTable
        if fileName:
            fo = UTILS.openFile(fileName, "w")
            UTILS.writeText(fo, outputTable)
            fo.close()
        else:
            for tb in outputTable:
                if outputMessage:
                    ARCPY.AddMessage(tb)

    ################# Analysis Methods ###############

    def getAnalysisMask(self, varName, polygonFC = None):
        """
        This method convert polygon mask to mask array for cube variable
        INPUT:
            maskFC (str): polygon mask path

        """
        if polygonFC is None:
            return self.obtainVariableMask(varName).ravel()
        else:
            x_min = self.extent.XMin
            y_max = self.extent.YMax
            analysisMask = self.cubeInfo.get_polygon_mask(polygonFC, x_min, y_max,
                                                          self.spatialReference)
            sumMask = analysisMask.sum()
            if not sumMask:
                ARCPY.AddIDMessage("ERROR", 110033)
                self.close()
                raise SystemExit()

            return analysisMask.ravel()

    def __checkThreshold(self, threshold, throwMessages = True):
        #### Ensure Searching Distance Is Less Than 75% of Max Extent ####
        maxDist = self.maxExtent * .75
        if threshold > maxDist:
            maxDistPrint = LOCALE.format_string("%d", maxDist)
            displayUnit = UTILS.getDisplayUnit(self.geometryUnit)
            if throwMessages:
                ARCPY.AddIDMessage("WARNING", 110018, maxDistPrint,
                                   displayUnit.lower())
            return maxDist, False
        elif threshold < self.distanceInterval:
            if throwMessages:
                ARCPY.AddIDMessage("WARNING", 110019)
            return threshold, True
        else:
            return threshold, False

    def setNeighborInfo(self, spaceConcept = "FIXED_DISTANCE",
                        threshold = None, timeOrder = 1, 
                        analysisMask = None, includeSelf = False, 
                        backwardsOnly = True, numNeighs = None):

        #### If KNN Search Use KDTree ####
        if spaceConcept == "K_NEAREST_NEIGHBORS":
            self.neighborInfo = WU.SciPyNeighborSearch(self, spaceConcept = spaceConcept,
                                                       numNeighs = numNeighs,
                                                       timeOrder = timeOrder,
                                                       analysisMask = analysisMask)
        else:
            self.neighborInfo = None

            #### Create Count and Summary Variable Analysis Mask ####
            centroids = self.cubeInfo.return_centroids(self.extent.XMin,
                                                       self.extent.YMax)
            if centroids is None:
                ARCPY.AddIDMessage("ERROR", 110033)
                self.close()
                raise SystemExit()
        
            #### Set Analysis Mask ####
            if analysisMask is None:
                analysisMask = self.obtainVariableMask('COUNT')

            #### Distance Based Messages Disabled when Single Row/Col ####
            throwMessages = self.numLocations != 1

            #### Set up Distance Threshold ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84614))
            useDefaultDistance = False
            if threshold is None:
                useDefaultDistance = True
            else:
                hasSearchSize = False
                if UTILS.isNumeric(threshold):
                    searchSize = float(threshold)
                    searchUnit = self.cellUnit
                    threshold = "{0} {1}".format(searchSize, searchUnit)
                    hasSearchSize = True
                else:
                    searchSize, searchUnit = threshold.split(" ")
                    if searchUnit.upper() not in CUTILS.supportDist:
                        ARCPY.AddIDMessage("ERROR", 110017, searchUnit)
                        self.close()
                        raise SystemExit()

                    if searchSize != '':
                        try:
                            searchSize = UTILS.strToFloat(searchSize)
                            hasSearchSize = True
                        except:
                            useDefaultDistance = True
                            ARCPY.AddIDMessage("WARNING", 110016)

                if hasSearchSize and not useDefaultDistance:
                    #### Adjust Search Distance Based on Cube Projection Unit ####
                    searchUnit = UTILS.returnSpaceUnit(searchUnit.upper())
                    searchStr, searchFactor = UTILS.distanceUnitInfo[searchUnit]
                    cubeStr, cubeFactor = UTILS.distanceUnitInfo[self.cellUnit.upper()]
                    searchDistBase = (searchSize * searchFactor) / cubeFactor
                    checkThreshold = self.__checkThreshold(searchDistBase, 
                                                           throwMessages = throwMessages)
                    searchDistBase, useDefaultDistance = checkThreshold

                else:
                    useDefaultDistance = True

            ### Default Searching Distance ####
            if useDefaultDistance:
                #### Get Default Distance ####
                xyCoords = centroids[analysisMask]
                searchDistBase = STATS.spatialBandwidth(xyCoords)

                #### Convert Distance to Cube CellUnit Type ####
                convertValue = UTILS.convertProjectedDistance(self.cellUnit,
                                                              self.userCellUnit,
                                                              searchDistBase)
                if convertValue < self.userCellHeight:
                    convertValue = self.userCellHeight
                    searchDistBase = UTILS.convertProjectedDistance(self.userCellUnit,
                                                                    self.cellUnit,
                                                                    convertValue)

                userUnitName, userUnitConvert = UTILS.distanceUnitInfo[self.userCellUnit]
                self.printThreshold = UTILS.prettyUnits(convertValue,
                                                        userUnitName)

                info = self.printThreshold.split()
                distance = info[0]
                displayUnit = info[1]
                if len(info) > 2:
                    displayUnit = displayUnit + " " + info[2]
            
                if throwMessages:
                    ARCPY.AddIDMessage("WARNING", 110020, distance, displayUnit)
            else:
                threshold = UTILS.quickLinearUnitPrint(threshold)
                info = threshold.split(" ")
                searchSize = info[0]
                searchUnit = info[1]
                if len(info) > 2:
                    searchUnit = searchUnit + " " + info[2]

                floatSize = UTILS.strToFloat(searchSize)
                displayUnit = searchUnit
                self.printThreshold = threshold

            self.printThreshold = self.printThreshold.lower()
            self.displayUnit = displayUnit

            #### Default Time Order ####
            notInt = type(timeOrder) != int
            tBool = timeOrder == 0 or timeOrder is None or notInt
            if tBool:
                if notInt and timeOrder is not None:
                    ARCPY.AddIDMessage("WARNING", 110022)
                timeOrder = 1
                ARCPY.AddIDMessage("WARNING", 110021)

            #### Ensure Input Temporal Interval Is Less Than 75% Max Temporal Extent ####
            maxTime = int(self.numTime * 0.75)
            if timeOrder > maxTime:
                ARCPY.AddIDMessage("WARNING", 110023, str(maxTime))
                timeOrder = maxTime

            #### Reset Cube Info ####
            self.cubeInfo.reset_search_info(mask = analysisMask,
                                            space_threshold = searchDistBase,
                                            time_order = timeOrder,
                                            include_self = includeSelf,
                                            backwards_only = backwardsOnly,
                                            time_lag_only = False)

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
        if analysisMask is None:
            analysisMask = self.obtainVariableMask(inputVarName)

        #### Create Output Arrays ####
        y = NUM.empty((self.numLocations,), float)
        mk_pv = NUM.empty((self.numLocations,), float)
        mk_bins = NUM.zeros((self.numLocations,), NUM.int32)

        #### Create Trend Progessor ####
        msg = ARCPY.GetIDMessage(84695)
        ARCPY.SetProgressor("step", msg, 0, self.numLocations, 1)

        #### Running Mann Kendall for Whole Cube ####
        dataValues = self.dataset.variables[inputVarName]
        y, mk_pv = self.__processMannKendall(analysisMask, dataValues, y, mk_pv)

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

    def __processMannKendall(self, analysisMask, data, y, mk_pv):
        """
        This method calculate Mann Kendall 
        """
        numThreads = UTILS.getNumberOfThreadsDefault()
        propotionValidLocations = analysisMask.sum() / len(analysisMask)

        if propotionValidLocations == 1:
            dataValues = data[:].reshape(self.numTime, self.numLocations)
            return ARC._ss.mann_kendall(dataValues.data.copy(), 2, None, numThreads)
        else:
            dataValues = data[:].reshape(self.numTime, self.numLocations)
            validIds = NUM.where(analysisMask == True)[0]
            yValues, pValues = ARC._ss.mann_kendall(dataValues[:,validIds].data.copy(), 2, None, numThreads)
            y[validIds] = yValues
            mk_pv[validIds] = pValues
            nullIds = NUM.where(analysisMask == False)[0]

            if len(nullIds):
                y[nullIds] = -9999.
                mk_pv[nullIds] = -9999.  

            return y, mk_pv

    def emergingHotSpots(self, inputVarName, applyFDR = True, analysisMask = None,
                         globalMethod = "ENTIRE_CUBE"):
        """
        This method performs emerging space time hot spot analysis
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            applyFDR (bool): applied False Discovery Rate, default is true
            analysisMask {array, None}: boolean array for mask
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

        #### Set up Analysis Mask and Output Name ####
        outputVarName = "EMERGING_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/ Mask Variables ####
        if inputVarName in CUTILS.coreCubeVarNames or "BINARY_MASK" in inputVarName:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(self, "isForecast") and self.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        #### Assign Analysis Mask ####
        polyMask = analysisMask is not None
        maskName = inputVarName + '_EHSAMASK'
        if not polyMask:
            analysisMask = self.obtainVariableMask(inputVarName)
            self.cubeInfo.reset_search_info(mask = analysisMask)
        tiledMask = NUM.tile(analysisMask, self.cubeInfo.num_time)
        tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols)

        #### Apply Global Average Window ####
        useWindow = globalMethod != "ENTIRE_CUBE"
        if useWindow:
            if globalMethod == "INDIVIDUAL_TIME_STEP":
                window = 0
            else:
                window = self.cubeInfo.time_order

        #### Assure Include Self ####
        if not self.cubeInfo.include_self:
            self.cubeInfo.reset_search_info(include_self = True)

        #### Assess Which Locations Have Data for Each Time Period ####
        numCells = self.cubeInfo.num_cells
        numTime = self.cubeInfo.num_time
        allTimeData = tiledMask.sum(0).ravel() == numTime

        #### One-Dimensional (flattened) Masks ####
        tiledMask = tiledMask.ravel()

        #### Retrieve Values from Cube ####
        fillZeros = inputVarName[-6:] == '_ZEROS' 
        y = self.obtainValues(inputVarName, flatten = True,
                              fillZeros = fillZeros) * 1.0

        #### Set Stats ####
        yMasked = self.setStats(y, tiledMask)

        #### Calculate Variance of Variable Values ####
        yVar = yMasked.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if len(yMasked) < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if y.dtype != NUM.float64 and y.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Create Hot Spot Progessor ####
        msg = ARCPY.GetIDMessage(84696)
        ARCPY.SetProgressor("default", msg)

        #### Decide Grid-Based or KNN Calculation ####
        if self.neighborInfo is None:

            #### Running Hotspot Analysis for Each Cell ####
            if useWindow:
                results = self.cubeInfo.get_hotspots_window(y, window)
            else:
                results = self.cubeInfo.get_hotspots(y)

            if results is None:
                #### No Window Variation ####
                raise SystemExit()

            gi, pv = results
            gi_bins = NUM.zeros((numCells,), NUM.int32)

            #### Get Unmasked Values ####
            giMask = gi[tiledMask]
            pvMask = pv[tiledMask]

            #### Apply Correction / Set Bins ####
            if applyFDR:
                giBins = STATS.fdrTransform(pvMask, giMask)
            else:
                giBins = STATS.pValueBins(pvMask, giMask)
            gi_bins[tiledMask] = giBins

            #### Create Emerging Progessor ####
            msg = ARCPY.GetIDMessage(110030)
            sizeSlice = self.cubeInfo.size_slice
            ARCPY.SetProgressor("default", msg)

            #### Do Emerging Hot-Spot Analysis ####
            emerge = self.cubeInfo.get_emerging_hotspots(y, gi, pv, gi_bins)
            emerging_bins, mk_z, mk_pv, mk_bins, bin_array = emerge

        else:

            #### Create Panel Info Structure ####
            numLocations = analysisMask.sum()
            panelInfo = ARC._ss.PanelInfo(self.numTime, numLocations)

            #### Running Hotspot Analysis for Each Cell ####
            inputVar = y[tiledMask]
            if useWindow:
                results = panelInfo.get_hotspots_window(inputVar, self.neighborInfo,
                                                       window)
            else:
                results = panelInfo.get_hotspots(inputVar, self.neighborInfo)

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

            gi = CUTILS.expandMaskedResult(gi, tiledMask)
            pv = CUTILS.expandMaskedResult(pv, tiledMask)
            gi_bins = CUTILS.expandMaskedResult(giBins, tiledMask)
            emerging_bins = CUTILS.expandMaskedResult(emerging_bins, analysisMask)
            mk_z = CUTILS.expandMaskedResult(mk_z, analysisMask)
            mk_pv = CUTILS.expandMaskedResult(mk_pv, analysisMask)
            mk_bins = CUTILS.expandMaskedResult(mk_bins, analysisMask)

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
        numLocations = int(analysisMask.sum())
        outputTable += CUTILS.emergingReport(binCounter, numLocations)

        #### Print Entire Report ####
        ARCPY.AddMessage(outputTable)

        #### Write Resutls to Cube NetCDF File ####
        self.append(outputVarName + "_HS_ZSCORE", gi)
        self.append(outputVarName + "_HS_PVALUE", pv)
        self.append(outputVarName + "_HS_BIN", gi_bins)
        self.append(outputVarName + "_TREND_ZSCORE", mk_z)
        self.append(outputVarName + "_TREND_PVALUE", mk_pv)
        self.append(outputVarName + "_TREND_BIN", mk_bins)
        self.append(outputVarName + "_CATEGORY", emerging_bins)

        self.createMaskVariable(maskName, analysisMask,
                                varName = outputVarName)

    def clusterOutlier(self, inputVarName, permutations = 499, applyFDR = True,
                       analysisMask = None, globalMethod = "ENTIRE_CUBE"):
        """
        This method performs space time cluster-outlier analysis (Local Moran's I)
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            permutations (int): number of simulations for conditional randomziation
            applyFDR (bool): applied False Discovery Rate, default is true
            analysisMask {array, None}: boolean array for mask
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

        #### Set up Analysis Mask and Output Name ####
        outputVarName = "OUTLIER_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/ Mask Variables ####
        if inputVarName in CUTILS.coreCubeVarNames or "BINARY_MASK" in inputVarName:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(self, "isForecast") and self.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        #### Assign Analysis Mask ####
        polyMask = analysisMask is not None
        maskName = inputVarName + '_COAMASK'
        if not polyMask:
            analysisMask = self.obtainVariableMask(inputVarName)
            self.cubeInfo.reset_search_info(mask = analysisMask)
        tiledMask = NUM.tile(analysisMask, self.cubeInfo.num_time)
        tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols)
        numLocations = int(analysisMask.sum())

        #### Apply Global Average Window ####
        useWindow = globalMethod != "ENTIRE_CUBE"
        if useWindow:
            if globalMethod == "INDIVIDUAL_TIME_STEP":
                window = 0
            else:
                window = self.cubeInfo.time_order

        #### Assess Which Locations Have Data for Each Time Period ####
        numCells = self.cubeInfo.num_cells
        numTime = self.cubeInfo.num_time
        allTimeData = tiledMask.sum(0).ravel() == numTime

        #### One-Dimensional (flattened) Masks ####
        tiledMask = tiledMask.ravel()

        #### Retrieve Values from Cube ####
        fillZeros = inputVarName[-6:] == '_ZEROS' 
        y = self.obtainValues(inputVarName, flatten = True,
                              fillZeros = fillZeros) * 1.0

        #### Set Stats ####
        yMasked = self.setStats(y, tiledMask)

        #### Calculate Variance of Variable Values ####
        yVar = yMasked.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if len(yMasked) < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if y.dtype != NUM.float64 and y.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Running Local Moran's I ####       
        randSeed = UTILS.getRandomSeed()
        numThreads = UTILS.getNumberOfThreadsDefault()

        #### Decide Grid-Based or KNN Calculation ####
        if self.neighborInfo is None:
            
            #### Grid Based ####
            if useWindow:
                results = self.cubeInfo.get_cluster_outliers_window(y, window, 
                                                                    permutations = permutations,
                                                                    random_seed = randSeed,
                                                                    num_threads = numThreads)
            else:
                results = self.cubeInfo.get_cluster_outliers(y, permutations = permutations,
                                                             random_seed = randSeed,
                                                             num_threads = numThreads)

            if results is None:
                #### No Window Variation ####
                raise SystemExit()

            li, pv, li_bins, has_spatial_neighs, z_transform, spatial_lag = results

        else:

            #### Create Panel Info Structure ####
            numLocations = analysisMask.sum()
            panelInfo = ARC._ss.PanelInfo(self.numTime, numLocations)

            #### Running Hotspot Analysis for Each Cell ####
            inputVar = y[tiledMask]

            if useWindow:
                results = panelInfo.get_cluster_outliers_window(inputVar, self.neighborInfo,
                                                                window,
                                                                permutations = permutations,
                                                                random_seed = randSeed)
            else:
                results = panelInfo.get_cluster_outliers(inputVar, self.neighborInfo,
                                                         permutations = permutations,
                                                         random_seed = randSeed)

            if results is None:
                #### No Window Variation ####
                raise SystemExit()

            li, pv, li_bins, has_spatial_neighs, z_transform, spatial_lag = results

            li = CUTILS.expandMaskedResult(li, tiledMask)
            pv = CUTILS.expandMaskedResult(pv, tiledMask)
            li_bins = CUTILS.expandMaskedResult(li_bins, tiledMask)
            has_spatial_neighs = CUTILS.expandMaskedResult(has_spatial_neighs, analysisMask)
            z_transform = CUTILS.expandMaskedResult(z_transform, tiledMask)
            spatial_lag = CUTILS.expandMaskedResult(spatial_lag, tiledMask)

        #### Apply Correction / Set Bins ####
        if applyFDR:
            #### Add False to First Time Slice ####
            tiledMask[0:self.cubeInfo.size_slice] = False
            liMask = li[tiledMask]
            pvMask = pv[tiledMask]

            #### Do FDR ####
            liBins = STATS.fdrTransform(pvMask, liMask)

            #### Remove Cluster-Outlier Type if not Significant at 95% via FDR #### 
            removeSignificance = abs(liBins) < 2
            mask_bins = li_bins[tiledMask]
            mask_bins[removeSignificance] = 0
            li_bins[tiledMask] = mask_bins

        ##### Initial Cube Report ####
        outputTable = self.generalCubeReport()

        #### Analysis Details Table ####
        outputTable += self.analysisReport(permutations = permutations)

        #### Cluster-Outlier Report ####
        maskBins = li_bins[tiledMask]
        outBins = maskBins.reshape(self.numTime - 1, numLocations)
        timeBreaks = self.obtainTimeBreaks()
        outputTable += CUTILS.outlierReport(outBins, timeBreaks,
                                            self.isStartTime)
        ARCPY.AddMessage(outputTable)

        #### Add Cluster-Outlier Variables to Existing Cube ####
        self.append(outputVarName + "_INDEX", li)
        self.append(outputVarName + "_PVALUE", pv)
        self.append(outputVarName + "_TYPE", li_bins)
        self.append(outputVarName + "_HAS_SPATIAL_NEIGHBORS", has_spatial_neighs)
        self.append(outputVarName + "_ZTRAN", z_transform)
        self.append(outputVarName + "_LAG", spatial_lag)
        
        self.createMaskVariable(maskName, analysisMask, varName = outputVarName)

    def timeSeriesClustering(self, inputVarName, numClusters = None, analysisMask = None, 
                             dissimilarityMethod = "VALUE", 
                             clusterMethod = "K_MEDOIDS"):
        """
        This method performs space time cluster-outlier analysis (Local Moran's I)
        INPUT:
            inputVarName (str): input cube variable name (e.g. counts)
            numClusters (int): number of resulting groups
            analysisMask {array, None}: boolean array for mask
            dissimilarityMethod {str, "VALUE"}: "VALUE", "SHAPE", "VALUE_AND_SHAPE",
                                                "COMPLEXITY"
            clusterMethod {str, "KMEDOIDS"}: "KMEDOIDS", "KMEANS"

        OUTPUT:
            GROUPS (var): numpy array for the results of time-series clustering
        """

        #### Runtime Error Checks ####
        valid = CUTILS.runtimeTimeSeriesChecks(numClusters, self.sizeSlice)
        if not valid:
            self.close()
            raise SystemExit()

        #### Ensure Analysis Variable Exists in the Cube ####
        inputVarName = self.checkVariable(inputVarName)

        #### Set up Analysis Mask and Output Name ####
        outputVarName = "TSCLUST_" + inputVarName

        #### Ensure Analysis Variable Is Not Dimension/ Mask Variables ####
        if inputVarName in CUTILS.coreCubeVarNames or "BINARY_MASK" in inputVarName:
            ARCPY.AddIDMessage("ERROR", 110027)
            self.close()
            raise SystemExit()

        #### Assign Analysis Mask ####
        polyMask = analysisMask is not None
        maskName = inputVarName + '_TSCMASK'
        if not polyMask:
            analysisMask = self.obtainVariableMask(inputVarName)
            self.cubeInfo.reset_search_info(mask = analysisMask)
        tiledMask = NUM.tile(analysisMask, self.cubeInfo.num_time)
        tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols)
        numLocations = int(analysisMask.sum())

        #### Assess Which Locations Have Data for Each Time Period ####
        numCells = self.cubeInfo.num_cells
        numTime = self.cubeInfo.num_time
        allTimeData = tiledMask.sum(0).ravel() == numTime

        #### One-Dimensional (flattened) Masks ####
        tiledMask = tiledMask.ravel()

        #### Retrieve Values from Cube ####
        fillZeros = inputVarName[-6:] == '_ZEROS' 
        y = self.obtainValues(inputVarName, flatten = True,
                              fillZeros = fillZeros) * 1.0

        #### Set Stats ####
        yMasked = self.setStats(y, tiledMask)

        #### Calculate Variance of Variable Values ####
        yVar = yMasked.var()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 1575)
            self.close()
            raise SystemExit()
        
        #### Ensure Cube Has at Least 30 Elements ####
        if len(yMasked) < 30:
            ARCPY.AddIDMessage("ERROR", 110028)
            self.close()
            raise SystemExit()
        
        #### Ensure Analysis Variable Is Numeric ####
        if y.dtype != NUM.float64 and y.dtype != NUM.int32:
            ARCPY.AddIDMessage("ERROR", 110029)
            self.close()
            raise SystemExit()

        #### Remove Empty Locations ####
        inputVar = y[tiledMask]

        #### Running Time-Series Distances ####
        if dissimilarityMethod == "VALUE":
            results = self.cubeInfo.get_ts_value_dist(y)
        elif dissimilarityMethod == "PROFILE":
            results = self.cubeInfo.get_ts_cosine_dist(y)
            #### Check for Flat Signal and Error Out ####
            nanInds = NUM.isnan(results[0])
            if NUM.any(nanInds):
                ARCPY.AddIDMessage("ERROR", 110215)
                raise SystemExit()

        elif dissimilarityMethod == "CORRELATION":
            results = self.cubeInfo.get_ts_correlation_dist(y)
        elif dissimilarityMethod == "VALUE_AND_CORRELATION":
            results = self.cubeInfo.get_ts_corr_and_value_dist(y)
        elif dissimilarityMethod == "COMPLEXITY":
            yMat = self.obtainValues(inputVarName, flatten = False,
                                     fillZeros = fillZeros) * 1.0
            results = CUTILS.timeSeriesComplexity(yMat, analysisMask)
        else:
            ARCPY.AddError("Dissim Method = {0} has not be coded yet!".format(dissimilarityMethod))
            raise SystemExit()

        if results is None:
            #### No Window Variation ####
            raise SystemExit()

        #### Unpack Time-Series Distance Results ####
        distances, locations = results

        #### Set Distance Matrix ####
        n = len(locations)
        distMat = distances.reshape(n,n)

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
        baseCenters = NUM.zeros((len(locationClusters,)), dtype = NUM.int32)
        baseCenters[centerIDs] = 1

        #### Expand Results ####
        clusters = NUM.zeros(self.sizeSlice, NUM.int32)
        clusters[analysisMask] = locationClusters 
        centers = NUM.zeros(self.sizeSlice, NUM.int32)
        centers[analysisMask] = baseCenters 

        #### Add Cluster-Outlier Variables to Existing Cube ####
        self.append(outputVarName + "_CLUSTER", clusters)
        self.append(outputVarName + "_CENTER", centers)
        
        self.createMaskVariable(maskName, analysisMask, varName = outputVarName)

        ##### Initial Cube Report ####
        outputTable = self.generalCubeReport()
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

    def addOtherForecastVariables(self, forecastObject, analysisMask, listOtherVariables, tiledMask):
        if listOtherVariables is not None:
            for ind, inputVar in enumerate(listOtherVariables):
                maskNameStr = inputVar + "_{0}"

                if inputVar == "COUNT":
                    initMaskName = 'PROCESSING_BINARY_MASK'
                else:
                    initMaskName = maskNameStr.format("MASK")
                baseData = forecastObject.otherPredictions[ind]

                if NUM.ndim(baseData) == 1:
                    baseData = CUTILS.expandMaskedResult(baseData, analysisMask)
                    #### Add Variable in the New Cube ####
                    self.append(inputVar, baseData)
                else:
                    baseData = CUTILS.expandMaskedResult(forecastObject.otherPredictions[ind].ravel(), tiledMask)
                
                    #### Add Variable in the New Cube ####
                    self.append(inputVar, baseData,
                                maskName = initMaskName, maskValue = analysisMask, estimated = False)

    def addForecastVariables(self, forecastObject, inputVar, analysisMask, listOtherVariables = None ):

        #### Var and Mask Name Strings ####
        varNameStr = "FORECAST_" + inputVar + "_{0}"
        maskNameStr = inputVar + "_{0}"
        toolMaskVarNameStr = "FORECAST_" + inputVar

        if inputVar == "COUNT":
            initMaskName = 'PROCESSING_BINARY_MASK'
        else:
            initMaskName = maskNameStr.format("MASK")
        maskName = maskNameStr.format("FORECASTMASK")

        #### Create Tiled Mask ####
        tiledMask = NUM.tile(analysisMask, self.numTime)
        tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols).ravel()

        #### Append Variables ####
        mainVarNames = [inputVar, "FIT", "RMSE", "METHOD", "SEASON", "HIGH", "LOW"]
        mainData = [forecastObject.rawForecast, forecastObject.fitForecast, 
                    forecastObject.rmse, forecastObject.methodInts,
                    forecastObject.seasonInt, forecastObject.highIntervals,
                    forecastObject.lowIntervals]

        #### Add other variables ####          
        if listOtherVariables is not None:
            self.addOtherForecastVariables(forecastObject, analysisMask, listOtherVariables, tiledMask)

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
                maskNameOut = maskName
                outputVarName = varNameStr.format(varName)
            else:
                maskNameOut = initMaskName
                outputVarName = varName
            baseData = mainData[ind]
            if NUM.ndim(baseData) == 1:
                baseData = CUTILS.expandMaskedResult(baseData, analysisMask)
                #### Add Variable in the New Cube ####
                self.append(outputVarName, baseData)
            else:
                baseData = CUTILS.expandMaskedResult(mainData[ind].ravel(), tiledMask)
            
                #### Add Variable in the New Cube ####
                self.append(outputVarName, baseData,
                            maskName = maskNameOut, maskValue = analysisMask, estimated = False)

        #### Add Tool Mask ####
        self.createMaskVariable(maskName, analysisMask, varName = toolMaskVarNameStr)

    ################## Output Methods ################

    def getTimeSeriesOfClusters(self, varName):
        """Creates mean of time series based on given time-series clusters.

        INPUTS:
        varName (str): name of variable
        """

        inputVar = self.obtainValues(varName, flatten = False)
        clusters = self.obtainValues("TSCLUST_" + varName + "_CLUSTER", flatten = False)
        uniqueClusters = NUM.arange(1, clusters.max() + 1, dtype = NUM.int32)
        numClusters = len(uniqueClusters)
        meanPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        minPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        maxPerCluster = NUM.zeros((numClusters, self.numTime), dtype = float)
        for ind, cluster in enumerate(uniqueClusters):
            w = clusters == cluster
            clusterData = inputVar[:,w]
            meanPerCluster[ind] = clusterData.mean(1)
            minPerCluster[ind] = clusterData.min(1)
            maxPerCluster[ind] = clusterData.max(1)

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
                    explicitSpatialRef.create()
                    ARCPY.AddIDMessage("WARNING", 110061)
                    return explicitSpatialRef, cubeSpatialRef, False

    def exagDecision(self, scalePercent = .2):
        """
        Method to help make exaggration decision
        """
        return scalePercent * self.cellSize

    def getLocationField(self, analysisMask = None):
        locations = NUM.arange(self.sizeSlice, dtype = NUM.int32)
        if analysisMask is not None:
            locations = locations[analysisMask]

        return  SSDO.CandidateField("LOCATION", "LONG",
                                    data = locations,
                                    alias = "Location ID")

    def locationsWithData2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(varName)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Create Candidate Fields ####
        data = NUM.ones((len(locationField.data),), NUM.int32)

        alias = UTILS.formatString("Locations with data ({0})").format(varName)
        candidateField = SSDO.CandidateField("LOC_W_DATA", "LONG",
                                             data = data,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        return candidateFieldList

    def trendFields2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Create Field Info ####
        candidateFieldList = []

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(varName)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get Trend Field Names ####
        suffix = ['_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [varName + suff for suff in suffix]

        #### Get Trend Data ####
        mk_zData = self.obtainValues(varNames[0])[analysisMask]
        mk_pvData = self.obtainValues(varNames[1])[analysisMask]
        mk_binData = self.obtainValues(varNames[2])[analysisMask]

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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(varName)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Make Candidate Field ####
        data = self.obtainValues(varName)[analysisMask]
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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(prefix)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get All Output Var Names ####
        suffix = ['_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [prefix + suff for suff in suffix]

        #### Create Candidate Fields ####
        mk_zData = self.obtainValues(varNames[0])[analysisMask]
        mk_pvData = self.obtainValues(varNames[1])[analysisMask]
        mk_binData = self.obtainValues(varNames[2])[analysisMask]

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
        analysisMask = self.obtainVariableMask(prefix)
        varMask = self.obtainVariableMask(varName)

        #### Set Number of Non-Masked Output ####
        numOutLocations = analysisMask.sum()

        #### Add Location Field ####
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get All Output Var Names ####
        binVarName = prefix + '_TYPE'
        noSpatName = prefix + "_HAS_SPATIAL_NEIGHBORS"

        #### Get Data ####
        binData = self.obtainValues(binVarName)
        binData = binData.reshape(self.numTime, self.numLocations)
        binData = binData.T[analysisMask].T
        data = self.obtainValues(varName)
        data = data.reshape(self.numTime, self.numLocations)
        data = data.T[analysisMask].T
        #dataWithMasked = NUM.ma.getdata(data).copy()
        #data = dataWithMasked[dataWithMasked != data.fill_value]

        noNeighData = self.obtainValues(noSpatName, flatten = True)[analysisMask]
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

        #### Percentile Function removes mask ####
        medData = CUTILS.getPercentile(data, percValue = 50, axis = 0)

        if CUTILS.isMasked(data):
            minData.fill_value = -9999.
            maxData.fill_value = -9999.
            minData = CUTILS.fillWithZeros(minData)
            maxData = CUTILS.fillWithZeros(maxData)
            medData[medData == -9999.] = 0

        #### Replace Added Zeros Min/Max ####
        if varName[-6:] == '_ZEROS':
            zeroSum = sumData == 0
            if CUTILS.isMasked(zeroSum):
                zeroSum.fill_value = -9999.
                zeroSum = CUTILS.fillWithZeros(zeroSum)

            minData[zeroSum] = 0
            maxData[zeroSum] = 0

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
        analysisMask = self.obtainVariableMask(prefix)
        varMask = self.obtainVariableMask(varName)

        #### Set Number of Non-Masked Output ####
        numOutLocations = analysisMask.sum()

        #### Add Location Field ####
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get All Output Var Names ####
        suffix = ['_CATEGORY', '_PATTERN', '_HS_BIN',
                  '_TREND_ZSCORE', '_TREND_PVALUE',
                  '_TREND_BIN']
        varNames = [prefix + suff for suff in suffix]

        #### Base Data/Info ####
        T = self.numTime * 1.0
        data = self.obtainValues(varName).reshape(self.numTime, self.numLocations)
        allHSBinData = self.obtainValues(varNames[2]).reshape(self.numTime, 
                                                              self.numLocations)
        mk_zData = self.obtainValues(varNames[3], flatten = True)[analysisMask]
        mk_pvData = self.obtainValues(varNames[4], flatten = True)[analysisMask]
        mk_binData = self.obtainValues(varNames[5], flatten = True)[analysisMask]

        #### Category ####
        catData = self.obtainValues(varNames[0], flatten = True)
        candidateField = SSDO.CandidateField("CATEGORY", "LONG",
                                             data = catData[analysisMask],
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
        for ind, location in enumerate(locationField.data):
            patData[ind] = CUTILS.categoryDict[catData.item(location)]
            binData = allHSBinData[:, location]
            hotData[ind] = ((binData >= 1).sum() / T) * 100
            coldData[ind] = ((binData <= -1).sum() / T) * 100
            if varMask[location]:
                baseData = data[:, location]
                minData[ind] = baseData.min()
                maxData[ind] = baseData.max()
                sumData[ind] = baseData.sum()
                meanData[ind] = baseData.mean()
                try:
                    stdData[ind] = baseData.std()
                except:
                    stdData[ind] = 0.0
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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(prefix)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get All Output Var Names ####
        suffix = ['_CLUSTER', '_CENTER']
        varNames = [prefix + suff for suff in suffix]

        #### Create Candidate Fields ####
        clusterData = self.obtainValues(varNames[0])[analysisMask]

        alias = UTILS.formatString("Time-Series Cluster ID").format(varName)
        candidateField = SSDO.CandidateField("CLUSTER_ID", "LONG",
                                             data = clusterData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        centerData = self.obtainValues(varNames[1])[analysisMask]

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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(prefix)
        validIds = NUM.where(analysisMask.ravel())[0]
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

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
        var = self.obtainValues(varNames[0])
        data = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]
        for ind, predTime in enumerate(timeIndList):
            time = timeStr[ind]
            alias = "Forecast for {0} in {1}".format(varName, time)
            candidateField = SSDO.CandidateField("FCAST_{0}".format(ind+1), "DOUBLE",
                                                 data = data[predTime],
                                                 alias = alias)
            candidateFieldList.append(candidateField)

        #### Create High/Low Candidate Field ####
        var = self.obtainValues(varNames[1])
        highData = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]

        #### Check if All NULL ####
        allData = highData[startPredTime:, :].ravel()
        if NUM.isnan(allData).sum() != len(allData):
            var = self.obtainValues(varNames[2])
            lowData = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]

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
        data = self.obtainValues(varNames[3])[analysisMask]
        alias = "Forecast Root Mean Square Error"
        candidateField = SSDO.CandidateField("F_RMSE", "DOUBLE", data = data, alias = alias)
        candidateFieldList.append(candidateField)

        #### Validation RMSE ####
        if hasValidation:
            data = self.obtainValues(varNames[-1])[analysisMask]
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
        data = self.obtainValues(varNames[5])[analysisMask]
        methodArray = NUM.array([methodDict[str(i)] for i in data])
        maxSizeMethod = int(NUM.max(NUM.array([len(methodDict[str(i)]) for i in data])))

        #### Change Field Length When It Exceeds the Default Length ####
        if maxSizeMethod < 255:
            maxSizeMethod = None

        #### Seasons ####
        candidateFieldList += CUTILS.createSeasonFields(self, varNames[4], methodArray, 
                                                        analysisMask = analysisMask)

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
                candidateFieldList += CUTILS.createCurveEquationField(self, eqVarNames, methodArray,
                                                                      analysisMask = analysisMask)

        #### Outliers ####
        if prefix + "_OUTLIER" in self.dataset.variables:
            outlierName = prefix + "_OUTLIER"
            var = self.obtainValues(outlierName)
            data = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]
            data = data.sum(0)
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

        #### Get Variable Mask ####
        analysisMask = self.obtainVariableMask(varName)

        #### Add Location Field ####
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)
        locationData = locationField.data

        #### Get Estimated Data ####
        estimatedVarName = varName + "_ESTIMATED"
        data = self.obtainValues(estimatedVarName, flatten = False)

        #### Calc Sum Data ####
        T = self.numTime * 1.0
        numLocations = len(locationData)
        sumData = NUM.empty((numLocations,), dtype = NUM.int32)
        percData = NUM.empty((numLocations,), dtype = float)
        for ind, location in enumerate(locationData):
            row = (location % self.sizeSlice) // self.numCols
            col = (location % self.sizeSlice) % self.numCols
            baseData = data[:, row, col]
            sumDataVal = baseData.sum()
            sumData[ind] = sumDataVal
            percData[ind] = sumDataVal / T

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

    def excludedLocations2D(self, outputFC, varName):
        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Get Excluded Indices ####
        excludedInd = self.getExcludedIndex(varName)
        locationField = SSDO.CandidateField("LOCATION", "LONG",
                                            data = excludedInd,
                                            alias = "Location ID")
        candidateFieldList.append(locationField)

        #### Create Candidate Fields ####
        numLocations = len(excludedInd)
        excludedData = NUM.ones((numLocations,), NUM.int32)
        alias = UTILS.formatString("Locations excluded from analysis ({0})").format(varName)
        candidateField = SSDO.CandidateField("EXCLUDED", "LONG",
                                             data = excludedData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        #### Warn About Empty Output ####
        if numLocations == 0:
            ARCPY.AddIDMessage("WARNING", 110063)

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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(prefix)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

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
            data = self.obtainValues(varname)[analysisMask]
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
        locations = NUM.tile(NUM.arange(self.numLocations), self.numTime)
        if tiledMask is not None:
            elements = elements[tiledMask]
            locations = locations[tiledMask]

        #### Add Element Field ####
        elementField = SSDO.CandidateField("ELEMENT", "LONG",
                                           data = elements,
                                           alias = "Element")

        #### Add Location Field ####
        locationField = SSDO.CandidateField("LOCATION", "LONG",
                                            data = locations,
                                            alias = "Location ID")

        return elementField, locationField

    def createBase3DVariable(self, varName, tiledMask = None, varID = ""):
        #### Get Variable Data ####
        fillZeros = varName[-6:] == '_ZEROS'
        data = self.obtainValues(varName, flatten = True,
                                 fillZeros = fillZeros)
        if tiledMask is not None:
            data = data[tiledMask]

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

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(prefix)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

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

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(prefix)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

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

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(prefix)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

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

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(prefix)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

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
        outPath, outName = OS.path.split(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        varName = self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask Name / Prefix ####
        prefix = "CPD_" + varName

        #### Get Mask Name / Prefix ####
        mask = self.obtainVariableMask(prefix)
        tiledMask = NUM.tile(mask, self.numTime)
        validIds = NUM.where(mask.ravel())[0]

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Analysis Variable ####
        #analysisVar = self.obtainValues(varName)
        #analysisVar = analysisVar.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]
        var = self.obtainValues(varName)
        data = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]

        candidateField = SSDO.CandidateField("VALUE", "DOUBLE",
                                             data=data.ravel(),
                                             alias=varName)
        candidateFieldList.append(candidateField)


        #### Add Change Point Indicator Field ####
        changePointData = self.obtainValues(prefix + "_ISCP", flatten=True)
        candidateField = SSDO.CandidateField("CHPT_IND", "LONG",
                                             data=changePointData[tiledMask],
                                             alias="Change Point Indicator")
        candidateFieldList.append(candidateField)

        var = self.obtainValues(varName)
        data = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]
        changePointData = changePointData.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]

        numTime, numLoc = data.shape
        before = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        current = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        beforeIntercept = NUM.zeros((numTime, numLoc), dtype=NUM.float64)
        currentIntercept = NUM.zeros((numTime, numLoc), dtype=NUM.float64)

        chTypeNameStr = "CPD_" + varName + "_CHTYPE"
        if self.checkVariable(chTypeNameStr):
            var = self.obtainValues(chTypeNameStr)
            changePointType = var.ravel()[0]

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
                prevChangePointIdx = 0
                currSlope = 0.0
                prevSlope = 0.0
                currIntercept = 0.0
                prevIntercept = 0.0
                meanVal = NUM.mean(timeSeriesData)
                ### If There Exists a Change Point ####
                if n != 0:
                    for i in range(n):
                        currChangePointIdx = nonZeroIndicesList[i]
                        if changePointType == 1: # Variance
                            #currSegVal = NUM.sqrt(NUM.var(timeSeriesData[prevChangePointIdx: currChangePointIdx]))
                            currSegVal = NUM.sum((timeSeriesData[prevChangePointIdx: currChangePointIdx] - meanVal) * (timeSeriesData[prevChangePointIdx: currChangePointIdx] - meanVal) )
                            currSegVal /= (currChangePointIdx - prevChangePointIdx + 1)
                            currSegVal = NUM.sqrt(currSegVal)
                        elif changePointType == 0 or changePointType == 3:
                            currSegVal = NUM.mean(timeSeriesData[prevChangePointIdx: currChangePointIdx])
                        else:
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
                    #### For the Last Segment ####
                    if changePointType == 1:
                        #currSegVal = NUM.sqrt(NUM.var(timeSeriesData[prevChangePointIdx:]))
                        currSegVal = NUM.sum((timeSeriesData[prevChangePointIdx:] - meanVal) * (timeSeriesData[prevChangePointIdx:] - meanVal) )
                        currSegVal /= (len(timeSeriesData) - prevChangePointIdx + 1)
                        currSegVal = NUM.sqrt(currSegVal)
                    elif changePointType == 0 or changePointType == 3:
                        currSegVal = NUM.mean(timeSeriesData[prevChangePointIdx:])
                    else:
                        y = timeSeriesData[prevChangePointIdx:]
                        x = NUM.arange(prevChangePointIdx, lengthTimeSeries)
                        currSlope, currIntercept = CUTILS.calculateFittedLine(x, y)
                    
                    for t in range(prevChangePointIdx, lengthTimeSeries):
                        if changePointType == "2":
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
                    if changePointType == 1: # STANDARD_DEVIATION
                        currSegVal = NUM.sqrt(NUM.var(timeSeriesData))
                    elif changePointType == 0 or changePointType == 3: #MEAN or COUNT
                        currSegVal = NUM.mean(timeSeriesData)
                    else: #SLOPE
                        x = NUM.arange(0, lengthTimeSeries)
                        currSlope, currIntercept = CUTILS.calculateFittedLine(x, timeSeriesData)

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

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        baseVar.name = "CLUST_MED"
        baseVar.alias = "Time-Series Cluster Medoid"
        candidateFieldList.append(baseVar)

        #### Add Averaged Variable ####
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

        #### Create Field Info ####
        candidateFieldList = []

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(varName)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        candidateFieldList.append(baseVar)

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

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(varName)
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)
        #### Make Candidate Field ####
        data = self.obtainValues(varName, flatten = False)

        if data.dtype == float:
            outType = "DOUBLE"
        else:
            outType = "LONG"

        mask2D = analysisMask.reshape(self.numRows, self.numCols)

        startTimes, endTimes = self.getOutputTimeFieldInfo()
        for index in listTimeSteps:
            dataStep = data[index][mask2D].ravel()
            varNameForecast = "FRCST_{0}".format(index)
            validName = UTILS.getValidAggregateFieldName(varNameForecast, outPath)
            candidateField = SSDO.CandidateField(varNameForecast, outType,
                                                 data = dataStep,
                                                 alias = "{0}/{1}".format(startTimes[index],endTimes[index]))
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

        #### Get Variable Mask ####
        mask = self.obtainVariableMask(varName)
        tiledMask = NUM.tile(mask, self.numTime)

        #### Add Element Field ####
        elementField, locationField = self.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)

        #### Add Base Variable ####
        baseVar = self.createBase3DVariable(varName, tiledMask)
        candidateFieldList.append(baseVar)

        #### Get Estimated Data ####
        estimatedVarName = varName + "_ESTIMATED"
        data = self.obtainValues(estimatedVarName)[tiledMask]

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
        timeSteps = NUM.arange(self.numTime, dtype = NUM.int32)
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

    def obtainAllShapes(self, var = None, useCentroids = False, outputFC = None):
        """Returns each geometry for a every location in the cube.
        """
        if outputFC is not None:
            outFC = outputFC
        else:
            outFC = r"in_memory\cube_geom"
        #### Get Var for Spatial Geometries ####
        if var is None:
            var = CUTILS.getBaseVar(self)[0][0]
        #### Candidate field on A Cube Variable ####
        candFields = self.locationsWithData2D(outFC, var)
        #### Get In Memory Geometries ####
        self.exportFeatures2D(outputFC, candidateFieldList = candFields)
        #### Make Layer For the Subset Tool
        if outputFC is not None:
            layerName = r"{0}.lyr".format(outputFC)
            ARCPY.MakeFeatureLayer_management(outputFC, layerName)

            return layerName

        cubeShapes = []

        if useCentroids:
            
            for s in ARCPY.da.SearchCursor(outputFC, ["SHAPE@"]):
                point = ARCPY.PointGeometry(s[0].centroid, self.spatialReference)
                cubeShapes.append(point)
            
        else:
            cubeShapes = [s[0] for s in ARCPY.da.SearchCursor(outputFC, ["SHAPE@"])]

        ARCPY.Delete_management(outputFC)
        return cubeShapes

    def setOutputLocationIDs(self, locationField, threeD = False):
        if threeD:
            uniqueIDs = NUM.unique(locationField.data)
            self.outputLocationIDs = locationField.data[0:len(uniqueIDs)]
        else:
            self.outputLocationIDs = NUM.array(locationField.data)

    def exportFeatures3D(self, outputFC, candidateFieldList):
        """
        Method for export cube variables to feature class (2D and 3D)

        INPUT:
            varName(str): variable in cube
            outputFC(str): valid output feature class path

        OUTPUT:
            2D or 3D point feature class with fields: ELEMENT and TIME_ID
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

        #### Ignore Environment Extent ####
        oldExtent = ""
        if ARCPY.env.extent:
            oldExtent = ARCPY.env.extent
            ARCPY.env.extent = ""

        #### Get Output Spatial Ref ####
        outSpatialRef, cubeSpatialRef, isSame = self.getOutputSpatialRef(outputFC)

        #### Create/Write Output Features ####
        if isSame:
            ARC._ss.cube_to_3D_features(self, outputFC, candidateFieldList)
        else:
            ARC._ss.cube_to_3D_features(self, outputFC, candidateFieldList,
                                        outSpatialRef)

        #### Set Environment Back ####
        if oldExtent:
            ARCPY.env.extent = oldExtent

    def exportTable3D(self, outputTable, candidateFieldList):
        """
        Method for export cube variables to feature class (2D and 3D)

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
        ARC._ss.cube_to_3D_table(self, outputTable, candidateFieldList)

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
            ARC._ss.cube_to_2D_features(self, outputFC, candidateFieldList)
        else:
            ARC._ss.cube_to_2D_features(self, outputFC, candidateFieldList,
                                        outSpatialRef)

        #### Set Environment Back ####
        if oldExtent:
            ARCPY.env.extent = oldExtent

    def addChangePointVariables(self, allChangePoints, inputVar, analysisMask, changeType):
        """
        Append change points to the cube.
        """
        #### Var and Mask Name Strings ####
        varNameStr = "CPD_" + inputVar + "_ISCP"
        maskNameStr = inputVar + "_{0}"
        toolMaskVarNameStr = "CP_" + inputVar

        if inputVar == "COUNT":
            initMaskName = 'PROCESSING_BINARY_MASK'
        else:
            initMaskName = maskNameStr.format("MASK")
        maskName = maskNameStr.format("CPDMASK")

        #### Create Tiled Mask ####
        tiledMask = NUM.tile(analysisMask, self.numTime)
        tiledMask = tiledMask.reshape(self.numTime, self.numRows, self.numCols).ravel()

        maskNameOut = initMaskName
        outputVarName = varNameStr
        baseData = CUTILS.expandMaskedResult(allChangePoints.ravel(), tiledMask)
        self.append(outputVarName, baseData,
                    maskName=maskNameOut, maskValue=analysisMask, estimated=False)
        self.createMaskVariable(maskName, analysisMask, varName=toolMaskVarNameStr)

        #### Add ChangeType ####
        changeTypeVec = NUM.full(int(self.numRows * self.numCols), int(changeType), dtype=NUM.int32)

        changeTypeVecName = "CPD_" + inputVar + "_CHTYPE"
        self.append(changeTypeVecName, changeTypeVec)

        tiledMask = tiledMask.ravel()
        y = self.obtainValues(inputVar, flatten=True) * 1.0
        self.setStats(y, tiledMask)

    def changePointOutputFields2D(self, outputFC, varName):
        #### Ensure Ouput Path is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)
        isShp = UTILS.isShapeFile(outputFC)

        #### Ensure Analysis Variable Exists in the Cube ####
        self.checkVariable(varName)

        #### Create Field Info ####
        candidateFieldList = []

        #### Create Mask name / Prefix ####
        prefix = "CPD_" + varName

        #### Add Location Field ####
        analysisMask = self.obtainVariableMask(prefix)
        validIds = NUM.where(analysisMask.ravel())[0]
        locationField = self.getLocationField(analysisMask)
        candidateFieldList.append(locationField)

        #### Get All Output Varnames ####
        suffix = ['_ISCP']
        varNames = [prefix + suff for suff in suffix]
        varNames = [varName] + varNames

        #### Create Time Strings ####
        startTimes, endTimes = self.getOutputTimeFieldInfo()
        if self.isStartTime:
            useTimes = startTimes
        else:
            useTimes = endTimes

        #### Add the Number of Change Points ####
        var = self.obtainValues(varNames[1])
        data = var.reshape(self.numTime, (self.numCols * self.numRows))[:, validIds]

        numTime, numLoc = data.shape
        numChangePoints = data.sum(axis=0)
        typeField = data.dtype
        numChangePoints[numChangePoints < 0] = NUM.iinfo(typeField).min
        candidateField = SSDO.CandidateField("NUM_CHPT", "LONG",
                                             data=numChangePoints,
                                             alias="Number of Change Points",
                                             checkNullValues=True)
        candidateFieldList.append(candidateField)

        #### Add the First Change Point ####
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
        tableName, dbf = UTILS.returnTableName(outputTable)
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
                       'LAST_START_TIME', 'LAST_END_TIME', 'ROWS', 'COLUMNS', 'TOTAL_BINS', 'LOCATION_AT_LEAST_ONE_PNT']

        tableFieldsShort = ['MIN_X', 'MIN_Y', 'MAX_X', 'MAX_Y', 'N_TIME_STP', 'T_INTERVAL', 'T_ALIGNMNT',
                            'FST_T_BIAS', 'FST_STRT_T', 'FST_END_T', 'LST_T_BIAS', 'LST_STAT_T', 'LST_END_T', 'ROWS', 'COLUMNS',
                            'TOTAL_BINS', 'LOC_ONE_PT']

        idMessages = [84521, 84522, 84523, 84524, 220220, 220221, 220222, 220223, 220224, 220225, 220226,
                      220227, 220228, 220229, 220230, 220231, 220232]

        tableType = ['DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'LONG', 'TEXT', 'TEXT',
                     'DOUBLE', 'DATE', 'DATE', 'DOUBLE',
                     'DATE', 'DATE', 'LONG', 'LONG',
                     'LONG', 'LONG']

        if hasattr(self.dataset, 'alignment'):
            alignment = self.dataset.alignment
            if alignment.upper() == "START_TIME":
                alignment = ARCPY.GetIDMessage(220465)
            elif alignment.upper() == "END_TIME":
                alignment = ARCPY.GetIDMessage(220466)
        else:
            alignment = "END"

        startBias = round(self.startBias, 2)
        endBias = round(self.endBias, 2)

        totalBins = self.numLocations * self.numTime

        tableData = [self.extent.XMin, self.extent.YMin, self.extent.XMax, self.extent.YMax, self.numTime, 
                    self.timeStepLabelLocale, alignment, startBias, self.dataset.first_start_time , 
                    self.dataset.first_end_time, endBias, self.dataset.last_start_time, self.dataset.last_end_time, 
                    self.numRows, self.numCols, totalBins, self.numAnalysisLocations]

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
                startTimes, endTimes = self.getOutputTimeFieldInfo(exact = True)
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

class SubsetCube(object):
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
        self.parentCube = SSCube(self.inputCubeFile)
        self.parentDict = self.parentCube.dataset.__dict__

        #### Initialize Intermediate Variables ####
        self.dataset = None
        self.timeInd = [True] * self.parentCube.numTime
        self.newStartTimes = None
        self.newEndTimes = None
        self.numTime = None
        self.spatialAnalysisMask = None
        self.subsetCube = None

        #### Set Error Flags ####
        self.timeError = False
        self.spaceError = []

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

        #### Display the Subset Report ####
        self.descCube = CUTILS.subsetReport(self.outputCubeFile, self.inputCubeFile, self.subsetType)

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
            
        if self.timeInd[0] is False:
            self.dataset.start_bias = 0
        if self.timeInd[-1] is False:
            self.dataset.end_bias = 0

        #### Copy Over Data Min/Max ####
        if self.parentCube.dataMinTime is not None:
            self.dataset.data_min_time = self.parentCube.dataMinTime
        if self.parentCube.dataMaxTime is not None:
            self.dataset.data_max_time = self.parentCube.dataMaxTime

    def __setSubsetVersionInfo__(self):
        #### Attribute for General Info ####
        version = ARCPY.GetInstallInfo()['Version']
        self.dataset.history = 'Created by ' + DT.datetime.now().ctime()
        self.dataset.source = 'Space Time Pattern Mining Tools;'
        self.dataset.source += version

    def __setCubeGrid__(self):
        #### Copy X and Y ####
        xDim = len(self.parentCube.dataset.dimensions['x'])
        yDim = len(self.parentCube.dataset.dimensions['y'])
        self.dataset.createDimension('x', xDim)
        self.dataset.createDimension('y', yDim)

        #### Flag for Old Cubes with Invalid Dimensions ####
        invDim = False

        #### Copy Projection and XY Variables ####
        vars2Copy = ['projection', 'x', 'y', 'lat', 'lon']
        for varName in vars2Copy:
            var = self.parentCube.dataset.variables[varName]

            if varName in ['lat', 'lon']:
                #### Handle Old Cubes ####
                if len(var.dimensions) == 1:
                    self.dataset.createDimension(varName, len(self.parentCube.dataset[varName][:]))
                    invDim = True

            newVar = self.dataset.createVariable(varName, var.datatype, var.dimensions)
            self.dataset[varName][:] = self.parentCube.dataset[varName][:]
            self.dataset[varName].setncatts(self.parentCube.dataset[varName].__dict__)

        #### Runtime Warning for Old Cubes with Invalid Dimensions ####
        if invDim:
            ARCPY.AddIDMessage("WARNING", 110031)
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
        timeIDValue = NUM.repeat(timeIDList, self.parentCube.numLocations)
        timeIDValue = timeIDValue.reshape(self.numTime, self.parentCube.numRows, self.parentCube.numCols)
        CUTILS.createVariable(self.dataset, 'time_step_ID', timeIDValue, self.parentCube.spatialReference,
                                dType = 'i4')

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
        locationID = NUM.arange(0, self.parentCube.numLocations)
        locationVal = NUM.tile(locationID, self.numTime)
        locationVal = locationVal.reshape(self.numTime, self.parentCube.numRows, self.parentCube.numCols)
        CUTILS.createVariable(self.dataset, 'location_ID', locationVal, self.parentCube.spatialReference,
                              dType = 'i4')

        #### Close Dataset ####
        self.dataset.close()

    def spatialSubset(self, var):
        #### Subset wrt. Other Cube ####
        #### Get Spatial Subset Mask ####
        if self.spaceSubsetCube is not None:
            #### Get Parent Cube Shapes ####
            useCentroids = not self.parentCube.isPolygon
            cubeShapes = self.parentCube.obtainAllShapes(var = var, outputFC = r"in_memory\input_geom")

            useCentroids = not self.spaceSubsetCube.isPolygon
            subsetShapes = self.spaceSubsetCube.obtainAllShapes(outputFC = r"in_memory\subset_geom")

            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                selectShapes = subsetShapes,
                                                relationship = self.rel)

            ARCPY.management.Delete(r"in_memory\input_geom")
            ARCPY.management.Delete(r"in_memory\subset_geom")
            
            layerInput = r"{0}.lyr".format(r"in_memory\input_geom")
            if ARCPY.Exists(layerInput):
                ARCPY.management.Delete(layerInput)
            layerSubset = r"{0}.lyr".format(r"in_memory\subset_geom")
            if ARCPY.Exists(layerSubset):
                ARCPY.management.Delete(layerSubset)

        #### Subset wrt. Extent ####
        elif self.extent is not None:
            #### Get Extent Polygon ####
            extentPoly = UTILS.extentPolygon(self.extent, backUpSR = self.parentCube.spatialReference)
            #### Get Parent Cube Shapes ####
            cubeShapes = self.parentCube.obtainAllShapes(var = var, outputFC = r"in_memory\input_geom")

            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                selectShapes = extentPoly,
                                                relationship = "INTERSECT")
            ARCPY.management.Delete(r"in_memory\input_geom")
            
        #### Subset wrt. Feature ####
        elif self.subsetFeature is not None:
            #### Get Parent Cube Shapes ####
            cubeShapes = self.parentCube.obtainAllShapes(var = var, outputFC = r"in_memory\input_geom")
            maskInd = self.parentCube.selectCubeLocations(cubeShapes = cubeShapes,
                                                selectShapes = self.subsetFeature,
                                                relationship = self.rel)
            ARCPY.management.Delete(r"in_memory\input_geom")

        self.spatialAnalysisMask = NUM.array(maskInd)

    def __setSubsetBaseVars__(self):
        #### Add Base Variables ####
        self.subsetCube = SSCube(self.outputCubeFile, 'a')
        #### Get Base Variables from Parent Cube ####
        baseVars, _ = CUTILS.getBaseVar(self.parentCube)
        ############### TIME LOGIC ########################
        for var in baseVars:
            #### Get Base Variable ####
            data = self.parentCube.dataset[var][:][self.timeInd,:,:]
            data = data.reshape(self.numTime, (self.parentCube.numCols * self.parentCube.numRows))
            
            #### Get Mask Variable ####
            analysisMask = self.parentCube.obtainVariableMask(var)
            validIds = NUM.where(analysisMask.ravel())[0]

            if "SPACE" in self.subsetType:
                self.spatialSubset(var)
            
                if int(sum(analysisMask)) == int(sum(self.spatialAnalysisMask)):
                    self.spaceError.append(True)
                else:
                    self.spaceError.append(False)
                analysisMask = self.spatialAnalysisMask
                validIds = NUM.where(analysisMask.ravel())[0]
               
                #### Handle Empty Spatial Subset ####
                if len(validIds) == 0:
                    ARCPY.AddIDMessage("ERROR", 110461)
                    self.subsetCube.close()
                    UTILS.passiveDelete(self.outputCubeFile)
                    raise SystemExit()
            
            data = data[:, validIds]
            ## Define Mask Variable
            if var == "COUNT":
                maskName = 'PROCESSING_BINARY_MASK'
            else:
                maskName = var + "_MASK"

            #### Create Tiled Mask ####
            tiledMask = NUM.tile(analysisMask, self.numTime)
            tiledMask = tiledMask.reshape(self.numTime, self.parentCube.numRows, self.parentCube.numCols)
            tiledMask = tiledMask.ravel()
            if NUM.ndim(data) == 1:
                data = CUTILS.expandMaskedResult(data, analysisMask)
                #### Add Variable in the New Cube ####
                self.subsetCube.append(var, data)
            else:
                data = CUTILS.expandMaskedResult(data.ravel(), tiledMask)
                #### Add Variable in the New Cube ####
                self.subsetCube.append(var, data, maskName = maskName, maskValue = analysisMask, estimated = False)

            self.subsetCube.createMaskVariable(maskName, analysisMask, varName = maskName)
            self.subsetCube.mannKendall(var)

        if len(self.spaceError) > 0:
            self.spaceError = all(self.spaceError)
        else:
            self.spaceError = False

        if self.spaceError and self.subsetType.upper() == "SPACE":
            ARCPY.AddIDMessage("ERROR", 110481)
            self.subsetCube.close()
            UTILS.passiveDelete(self.outputCubeFile)
            raise SystemExit()

        if self.subsetType.upper() == "TIME_SPACE":
            if self.spaceError and not self.timeError:
                ARCPY.AddIDMessage("WARNING", 110481)

                self.parentCube.close()
                self.subsetCube.close()
            elif not self.spaceError and self.timeError:
                ARCPY.AddIDMessage("WARNING", 110459)
                self.parentCube.close()
                self.subsetCube.close()
            elif self.spaceError and self.timeError:
                ARCPY.AddIDMessage("ERROR", 110459)
                ARCPY.AddIDMessage("ERROR", 110481)
                self.subsetCube.close()
                self.parentCube.close()
                UTILS.passiveDelete(self.outputCubeFile)
                raise SystemExit()
            else:
                self.parentCube.close()
                self.subsetCube.close()

        else:
            self.parentCube.close()
            self.subsetCube.close()

        

    def __checkForecastHorizon(self):
        if hasattr(self.parentCube.dataset, 'is_forecast'):
            forecastStartBin = int(self.parentCube.dataset.begin_forecast_bin)

            #### If Forecast Horizon is Gone Remove Forecast Keys ####
            if self.timeInd[forecastStartBin] == False:
                parentKeys = list(self.parentDict.keys())
                _ = [self.parentDict.pop(k) for k in parentKeys if 'forecast' in k or "validation" in k or "json_method_str" in k]
