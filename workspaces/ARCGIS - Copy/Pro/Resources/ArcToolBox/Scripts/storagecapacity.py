import os
import sys
import math
import numpy
import arcpy
from arcpy.sa import *

def CreateAreaChart(cat_field, in_name, e_unit, a_unit):
    # add area chart
    chartName = r"Area Elevation Curve"
    chartTitle = in_name + u" - " + arcpy.GetIDMessage(10624)
    c = arcpy.Chart(chartName)
    c.type = 'line'
    c.name = chartName
    c.title = chartTitle
    c.xAxis.field = 'AREA'
    c.yAxis.field = 'ELEVATION'
    c.xAxis.title = 'Area (square {0})'.format(a_unit.lower())
    c.yAxis.title = 'Elevation ({0})'.format(e_unit.lower())
    c.legend.visible = True
    c.line.splitCategory = cat_field
    return c

def CreateVolChart(cat_field, in_name, e_unit, v_unit):
    chartName = r"Volume Elevation Curve"
    chartTitle = in_name + u" - " + arcpy.GetIDMessage(10625)
    d = arcpy.Chart(chartName)
    d.type = 'line'
    d.name = chartName
    d.title = chartTitle
    d.xAxis.field = 'VOLUME'
    d.yAxis.field = 'ELEVATION'
    d.xAxis.title = 'Volume (cubic {0})'.format(v_unit.lower())
    d.yAxis.title = 'Elevation ({0})'.format(e_unit.lower())
    d.legend.visible = True
    d.line.splitCategory = cat_field
    return d

def ConvertToMeter(u1): # get conversion factor
    uFactor = 1.0
    inUnit = u1.strip().lower()
    if inUnit in ["meters", "meter"]:
        uFactor = 1.0    
    elif inUnit in ["feet", "foot"]:
        uFactor = 0.3048
    elif inUnit in ["foot_us", "feet_us"]:
        uFactor = 0.3048006096012192
    elif inUnit in ["yards", "yard"]:
        uFactor = 0.91440
    elif inUnit in ["inches","inch"]:
        uFactor = 0.0254
    elif inUnit in ["centimeters", "centimeter"]:
        uFactor = 0.01    
    elif inUnit in ["decimeters", "decimeter"]:
        uFactor = 0.1
    elif inUnit in ["millimeters", "millimeter"]:
        uFactor = 0.001
    elif inUnit in ["kilometers", "kilometer"]:
        uFactor = 1000.0
    elif inUnit in ["miles","mile"]:
        uFactor = 1609.344
    elif inUnit in ["miles_us","mile_us"]:
        uFactor = 1609.3472186944
    elif inUnit in ["nauticalmiles", "nauticalmile", "nautical_mile", "nautical_miles"]:
        uFactor = 1852.0
    elif inUnit in ["points", "point"]:
        uFactor = 0.000352777778
    else:
        raise arcpy.ExecuteError()
    return uFactor

def GetGCSCellSize(inRasObj):
    a1 = inRasObj.extent.polygon.getArea("GEODESIC", "SQUAREMETERS")
    cCount = inRasObj.width * inRasObj.height
    cArea = a1 / cCount
    return math.sqrt(cArea)

def ProcessNullValues(inTble, inField):
    with arcpy.da.UpdateCursor(inTble, ["TmpArea", "TmpVol", inField]) as cur: 
        for row in cur:
            if (row[2] is None) and (row[0] == 0 or row[1] == 0):
                row[2] = 0
            elif (row[0] == -9999 or row[1] == -9999):
                row[2] = None
            cur.updateRow(row)
    
def SetProgress(totalSteps, i, j):
    arcpy.SetProgressor("step", "Calculate storage capacity...", 0, totalSteps * 3, 1)
    arcpy.SetProgressorLabel("Calculating storage capacity for increment {0}".format(i))
    arcpy.SetProgressorPosition(i * 3 + j)

def ZonalCapacityAsTable(inParamTable, inWaterLevelRas, inZones, inElevRas, analysisType, prjGeographic, cellFactor, cellSize, totalNumIncrements, currentLoop):
    elevTbl = arcpy.CreateUniqueName("strgt117d7ffff592", "memory") # "memory"
    out_zonal_sum = arcpy.CreateUniqueName("strgt3c6aa7798db1", "memory") # "memory"
    tempList = [out_zonal_sum]
    try:
        SetProgress(totalNumIncrements, currentLoop, 0)
        
        result_con = Con(Raster(inElevRas) <= inWaterLevelRas, inElevRas)
        out_minus = Minus(inWaterLevelRas, result_con)
        ##in_zone = Int(result_con * 0) + Raster(inZones) # make smaller zone

        # copy into new table       
        arcpy.management.CopyRows(inParamTable, elevTbl)
        
        # run ZSAT to get AREA and SUM
        arcpy.gp.ZonalStatisticsAsTable_sa(inZones, "Value", out_minus, out_zonal_sum, "DATA", "SUM")
        if analysisType.upper() in ["AREA", "AREA_VOLUME"]:
            arcpy.JoinField_management(elevTbl, "Value", out_zonal_sum, "Value", "AREA")      
            if prjGeographic: 
                arcpy.CalculateField_management(elevTbl, "AREA", "!AREA! * {0}".format(math.pow(cellFactor,2)), "PYTHON3", '', "DOUBLE")
        if analysisType.upper() in ["VOLUME", "AREA_VOLUME"]:    
            arcpy.JoinField_management(elevTbl, "Value", out_zonal_sum, "Value", "SUM")
            arcpy.CalculateField_management(elevTbl, "SUM", "!SUM! * {0}".format(math.pow(cellSize*cellFactor,2)), "PYTHON3", '', "DOUBLE")
                
        SetProgress(totalNumIncrements, currentLoop, 3)

        # clear scratch data
        for tmp in tempList:
            try:
                arcpy.Delete_management(tmp)                
            except:
                pass
    except:
        tempList.append(elevTbl) # delete elevTbl only under exception
        for tmp in tempList:
            try:
                arcpy.Delete_management(tmp)
            except:
                pass
        arcpy.AddError(arcpy.GetMessages(2))
        raise arcpy.ExecuteError("Error in iteration {0}.".format(currentLoop))      
        
    return elevTbl

def execute():
    arcpy.env.overwriteOutput = True        
    in_dem = arcpy.GetParameterAsText(0)
    out_table = arcpy.GetParameterAsText(1)
    in_zonedata = arcpy.GetParameterAsText(2)
    in_zonefield = arcpy.GetParameterAsText(3)
    analysis_type = arcpy.GetParameterAsText(4)    
    in_min = arcpy.GetParameterAsText(5)
    in_max = arcpy.GetParameterAsText(6)
    increm_type = arcpy.GetParameterAsText(7)
    in_increm = arcpy.GetParameterAsText(8)
    z_unit = arcpy.GetParameterAsText(9)
    out_chart = arcpy.GetParameterAsText(10)    

    # scratch data
    scratchZonalRaster = arcpy.CreateUniqueName("strgr7c48121aa717.tif", arcpy.env.scratchFolder)
    scratchStringTable = arcpy.CreateUniqueName("strgt06r10f3d4a89", 'memory')
    scratchOutTable = arcpy.CreateUniqueName("strgte454e872ccfc", arcpy.env.scratchGDB)
    scratchRngTable = arcpy.CreateUniqueName("strgt1bc8d94a0e45", 'memory')    
    resultTbls = []

    try:
        # environment preparation
        if not arcpy.env.outputCoordinateSystem:
            arcpy.env.outputCoordinateSystem = in_dem        

        if arcpy.env.cellSize in ["MAXOF", "MINOF", None]:
            arcpy.env.cellSize = in_dem

        if not arcpy.env.snapRaster:
            arcpy.env.snapRaster = in_dem
        ##########
        
        if not analysis_type:
            analysis_type = "AREA_VOLUME"

        if not in_increm:
            increm_type = "NUMBER_OF_INCREMENTS"
            in_increm = "10"

        envTestObj = ApplyEnvironment(in_dem) # temporary object to get environments
        in_cellSize = envTestObj.meanCellHeight        
        inSpRef = envTestObj.spatialReference
        
        prjIsGeographic = False
        xyUnit = "METER" # default
        xyFactor = 1.0
        
        if inSpRef:
            if not z_unit:
                if inSpRef.vcs: # if z_unit unspecified, it will be default to vcs
                    z_unit = inSpRef.vcs.linearUnitName                    
                else:
                    z_unit = "METER"
                    
            if inSpRef.type == "Geographic":
                prjIsGeographic = True           
                cellsizeGCS = GetGCSCellSize(Raster(in_dem)) # this is always in meter
                zMeter = ConvertToMeter(z_unit)
                xyFactor = (cellsizeGCS / in_cellSize) * (1.0 / zMeter) # this will convert decimal degrees to z unit
                xyUnit = z_unit
            elif inSpRef.type == "Projected":
                prjIsGeographic = False                
                xyUnit = inSpRef.linearUnitName
                xyMeter = ConvertToMeter(xyUnit)
                zMeter = ConvertToMeter(z_unit)
                xyFactor = xyMeter / zMeter            

        # describe in zone data, create zone_raster
        if in_zonedata:
            desc1 = arcpy.Describe(in_zonedata) 
            if desc1.datatype in ['FeatureClass', 'FeatureLayer']:
                zone_raster = scratchZonalRaster
                if not in_zonefield: # no input field
                    in_zonefield = desc1.OIDFieldName
                arcpy.SetProgressorLabel("Rasterizing input features")
                arcpy.FeatureToRaster_conversion(in_zonedata, in_zonefield, zone_raster, in_dem)
            elif desc1.datatype in ['RasterDataset', 'RasterLayer']:
                if not in_zonefield: # no input field
                    in_zonefield = "Value"
                    arcpy.management.CopyRaster(in_zonedata, scratchZonalRaster)
                    zone_raster = scratchZonalRaster
                else:
                    zone_raster = scratchZonalRaster
                    arcpy.SetProgressorLabel("Processing input zone raster...")
                    arcpy.gp.Lookup_sa(in_zonedata, in_zonefield, zone_raster)
        else:
            arcpy.SetProgressorLabel("Processing input zone raster")
            zone_raster = scratchZonalRaster
            ras1 = arcpy.sa.Int(in_dem) * 0 + 1
            arcpy.management.CopyRaster(ras1, zone_raster)

        # get zone field type
        zoneFldType = None
        if in_zonedata:
            zoneFld = arcpy.ListFields(in_zonedata, in_zonefield)[0]
            zoneFldType = zoneFld.type

        if zoneFldType == "String":
            arcpy.CopyRows_management(zone_raster, scratchStringTable)
            
        ############
        
        arcpy.AddMessage("Calculating storage capacity...")
 
        arcpy.SetProgressorLabel("Calculating input elevation statistics")
        # always need a range table
        res1 = arcpy.gp.ZonalStatisticsAsTable_sa(zone_raster, "Value", in_dem, scratchRngTable, "DATA", "MIN_MAX")
        arcpy.DeleteField_management(scratchRngTable, "AREA")
        # set up table fields
        arcpy.AddField_management(scratchRngTable, "InMin", "DOUBLE", None, None, None, 'InMin', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "InMax", "DOUBLE", None, None, None, 'InMax', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "InInterval", "DOUBLE", None, None, None, 'InInterval', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "InLoops", "LONG", None, None, None, 'InLoops', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "CrntElev", "DOUBLE", None, None, None, 'CrntElev', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "TmpArea", "DOUBLE", None, None, None, 'TmpArea', "NULLABLE", "NON_REQUIRED", '')
        arcpy.AddField_management(scratchRngTable, "TmpVol", "DOUBLE", None, None, None, 'TmpVol', "NULLABLE", "NON_REQUIRED", '')

        # prepare table fields and rasters for input Min, Max, etc
        if not in_min: # input is blank, InMin comes from raster stat
            arcpy.CalculateField_management(scratchRngTable, "InMin", "!MIN!", "PYTHON3", '', "DOUBLE")                      
        else:
            arcpy.CalculateField_management(scratchRngTable, "InMin", in_min, "PYTHON3", '', "DOUBLE")

        if not in_max:
            arcpy.CalculateField_management(scratchRngTable, "InMax", "!MAX!", "PYTHON3", '', "DOUBLE")                          
        else:
            arcpy.CalculateField_management(scratchRngTable, "InMax", in_max, "PYTHON3", '', "DOUBLE")
           
        # determine increments and steps, and related rasters
        if increm_type.upper() == "NUMBER_OF_INCREMENTS":
            loops = int(float(in_increm))
            arcpy.CalculateField_management(scratchRngTable, "InLoops", loops, "PYTHON3", '', "DOUBLE")
            arcpy.CalculateField_management(scratchRngTable, "InInterval", "(!InMax!-!InMin!)/!InLoops!", "PYTHON3", '', "DOUBLE")
            maxLoopC = loops
        elif increm_type.upper() == "VALUE_OF_INCREMENT":
            interval = float(in_increm)
            arcpy.CalculateField_management(scratchRngTable, "InInterval", interval, "PYTHON3", '', "DOUBLE")
            arcpy.CalculateField_management(scratchRngTable, "InLoops", "int(math.ceil((!InMax!-!InMin!) / !InInterval!))", "PYTHON3", '', "DOUBLE")
            # find max no. of loops
            maxLoopC = 0
            with arcpy.da.SearchCursor(scratchRngTable, "InLoops") as cur:
                for row in cur:
                    if row[0] > maxLoopC:
                        maxLoopC = row[0]
                        
        c = 0
        l = True
        while(c < maxLoopC + 1):
            # update table elevation
            with arcpy.da.UpdateCursor(scratchRngTable, ["MIN", "MAX", "InMin", "InMax", "InInterval", "InLoops", "CrntElev", "TmpArea", "TmpVol"]) as cur:
                 for row in cur:
                    row[6] = row[2] + row[4] * c # increase current elevation
                    if row[6] < row[0]: # below lowest elevation
                        row[7] = 0
                        row[8] = 0
                    elif row[6] - row[1] >= row[4]: # above water level more than one interval
                        row[7] = -9999
                        row[8] = -9999
                        if row[6] > row[3]: # current elevation cannot be more than user specified
                            row[6] = row[3]
                    else: # snap current elevation
                        if row[6] > row[1]: # current elevation cap at the highest elevation
                            row[6] = row[1]
                        if row[6] > row[3]: # current elevation cannot be more than user specified
                            row[6] = row[3]
                    cur.updateRow(row)

            # use lookup to generate stage elev raster
            try:
                arcpy.DeleteField_management(scratchZonalRaster, "CrntElev")
            except:
                pass
            arcpy.JoinField_management(scratchZonalRaster, "Value", scratchRngTable, "Value", "CrntElev")
            ##arcpy.gp.Lookup_sa(scratchZonalRaster, "CrntElev", scratchWaterLevelRaster)
            scratchWaterLevelRaster = arcpy.sa.Apply(scratchZonalRaster, "lookup", {"Field":"CrntElev"})
            
            # send table to calculate            
            res1 = ZonalCapacityAsTable(scratchRngTable, scratchWaterLevelRaster, scratchZonalRaster, in_dem, analysis_type, prjIsGeographic, xyFactor, in_cellSize, maxLoopC + 1, c)
            resultTbls.append(res1)
            c += 1
            
        # generate output table
        arcpy.AddMessage("Merge results...")
        arcpy.Merge_management(resultTbls, scratchOutTable)
        arcpy.ResetProgressor()

        # append string fields if applicable
        sortField = "OBJECTID"
        catField = ""
        if zoneFldType == "String":
            arcpy.JoinField_management(scratchOutTable, "Value", scratchStringTable, "Value", in_zonefield)
            arcpy.AlterField_management(scratchOutTable, "Value", "ZONE_CODE", "ZONE_CODE")
            sortField = "ZONE_CODE"
            catField = in_zonefield
        elif zoneFldType is not None: # rename Value fields to user input name
            if in_zonefield.lower() in ["objectid", "elevation", "area", "volume"]:
                in_zonefield = in_zonefield + "_1"
            arcpy.AlterField_management(scratchOutTable, "Value", in_zonefield, in_zonefield)
            sortField = in_zonefield
            catField = in_zonefield
        else:
            arcpy.AlterField_management(scratchOutTable, "Value", "ZONE_CODE", "ZONE_CODE")
            sortField = "ZONE_CODE"
            catField = "ZONE_CODE"
            
        # Elevation field
        arcpy.AlterField_management(scratchOutTable, "CrntElev", "ELEVATION", "ELEVATION")
        
        # Post processing
        if analysis_type.upper() in ["AREA", "AREA_VOLUME"]:
            # convert null to zero
            ##arcpy.AlterField_management(scratchOutTable, "AREA", "Area", "Area")
            ProcessNullValues(scratchOutTable, "AREA")
        if analysis_type.upper() in ["VOLUME", "AREA_VOLUME"]:
            # convert null to zero
            arcpy.AlterField_management(scratchOutTable, "SUM", "VOLUME", "VOLUME")
            ProcessNullValues(scratchOutTable, "VOLUME")

        # clear up scratch fields. commenting out this line allows debugging
        arcpy.DeleteField_management(scratchOutTable, ["COUNT", "MIN", "MAX", "InMin", "InMax", "InInterval", "InLoops", "TmpArea", "TmpVol"])

        # produce out table copying it
        arcpy.management.CopyRows(scratchOutTable, out_table)
        
        # clear scratch data
        for ras in [scratchZonalRaster, scratchStringTable, scratchOutTable, scratchRngTable]:
            try:
                arcpy.Delete_management(ras)
            except:
                pass

        for tbl in resultTbls:
            try:
                arcpy.Delete_management(tbl)
            except:
                pass

        # add chart to output table
        if out_chart:
            chartList = []
            # create charts    
            if analysis_type.upper() in ["AREA", "AREA_VOLUME"]:
                c = CreateAreaChart(catField, out_chart, z_unit, xyUnit)
                chartList.append(c)
            if analysis_type.upper() in ["VOLUME", "AREA_VOLUME"]:
                d = CreateVolChart(catField, out_chart, z_unit, z_unit)
                chartList.append(d)
            outTblParam = arcpy.GetParameterInfo()[1]
            outTblParam.charts = chartList
    except:
        # clear scratch data
        for ras in [scratchZonalRaster, scratchStringTable, scratchOutTable, scratchRngTable]:
            try:
                arcpy.Delete_management(ras)
            except:
                pass

        for tbl in resultTbls:
            try:
                arcpy.Delete_management(tbl)
            except:
                pass
                
        arcpy.AddError(arcpy.GetMessages(2))
        raise arcpy.ExecuteError()
    
if __name__ == '__main__':
    execute()
