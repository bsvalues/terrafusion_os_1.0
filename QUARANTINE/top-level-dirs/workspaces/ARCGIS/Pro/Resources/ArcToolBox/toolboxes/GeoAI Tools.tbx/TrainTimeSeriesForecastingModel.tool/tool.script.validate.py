def checkIfForecastCube(dataset, param, throwError = False):
    # True for error and false for warning.
    if hasattr(dataset, 'is_forecast') and dataset.is_forecast.upper() == "TRUE":
        if throwError:
            param.setIDMessage("ERROR", 260358)
        else:
            param.setIDMessage("WARNING", 260359)

analysisMask = ["EMERGING", "OUTLIER_"]
def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False 
    else:
        return changed

def getCoreCubeVariables(dataset, removeAnalysis = False, removeSTD = False):
    varNames = []

    #### Set Analysis Mask ####
    if removeAnalysis:
        m = analysisMask
    else:
        m = []

    #### Get Core Variables ####
    for varName in dataset.variables:
        if varName[-10:] == '_TREND_BIN' and varName[0:8] not in m:
            varNames.append(varName[:-10])

    #### Remove STD Rates ####
    if removeSTD:
        try:
            rateInfo = dataset.rate_info
            rateInfo = rateInfo.split(";")
            for rate in rateInfo:
                rateName, rateType = rate.split(",")
                if rateType == "EMPIRICAL_BAYES_STANDARDIZED":
                    if rateName in varNames:
                        varNames.remove(rateName)
        except:
            pass
        
    return varNames

def isCube(dataset, checkFields = False):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining'
    if checkFields:
        try:
            cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
            #### Check if All Base Variables Exist ####
            if validStr in dataset.description:
                cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
                varCheck = [var in dataset.variables.keys() for var in cubeVars]
                valid = all(varCheck)
                if valid: return True
                else: return False
            else:
                return False
        except:
            return False
    else:
        try:
            if validStr in dataset.description:
                return True
            else:
                return False
        except:
            return False

def isPanel(dataset, checkFields = False):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining Panel Cube'
    if checkFields:
        try:
            if validStr in dataset.description:
                cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
                varCheck = [var in dataset.variables.keys() for var in cubeVars]
                valid = all(varCheck)
                if valid: return True
                else: return False
            else:
                return False
        except:
            return False
    else:
        try:
            if validStr in dataset.description:
                return True
            else:
                return False
        except:
            return False

def isPro():
    """Return boolean indicating whether script is running in PRO
    """
    arcInfo = arcpy.GetInstallInfo()
    productName = arcInfo['ProductName'].upper() 
    isPro = False
    if productName in ["ARCGISPRO", "ARCGISALLSOURCE"]:
        isPro = True
    if productName == "SERVER":
        pathEnvPro = OS.path.join(arcInfo['InstallDir'], r"bin/Python/envs")
        if OS.path.isdir(pathEnvPro):
            isPro = True
    return isPro
class ToolValidator:
  # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # set self.params for use in other function
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties. 
        # This gets called when the tool is opened.
        return

    def updateParameters(self):

        import sys as SYS
        import netCDF4 as NET
        import SSTimeUtilities as TUTILS
        import os as OS

        
        if self.params[0].value:
            try:
                dataset = NET.Dataset(self.params[0].value.value, keepweakref=True)
                var_names = getCoreCubeVariables(dataset, removeAnalysis = True, removeSTD = False)
                var_names = list(var_names)
                numTime = dataset.dimensions['time'].size

                if self.params[0].altered:
                    if self.params[0].value:
                        
                        self.params[2].filter.list = var_names
                        
                        self.params[4].filters[0].list = var_names

                if self.params[2].altered:

                    var_names.remove(self.params[2].value)
                    self.params[4].filters[0].list = var_names  
                    
                if self.params[4].altered:
                    for row in self.params[4].values:
                        # if row[0] in var_names:
                        #     var_names.remove(row[0])
                        if row == ['', True]:
                            self.params[4].values.remove(row)
                    # self.params[4].filters[0].list = var_names
                
                if self.params[6].value is None:
                    self.params[6].value = int(0.1*numTime)
                    
                if self.params[4].values:
                    self.params[13].enabled = True
                else:
                    self.params[13].enabled = False
            except:            
                pass
        if self.params[1].value:
            head_tail = OS.path.split(str(self.params[1].value))
            self.params[14].value = OS.path.join(str(self.params[1].value), str(head_tail[-1])+".dlpk")
                    

        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before 
        # standard validation.

        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        
        import netCDF4 as NET
        import os as OS
        import numpy as NUM

        throwCubeError = False
        if self.params[0].value:
            try:
                cubeStr = self.params[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)
                var_names = getCoreCubeVariables(dataset, removeAnalysis = True, removeSTD = False)

                if not cubeBool and fileExists:
                    throwCubeError = True
                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    self.params[0].setIDMessage("ERROR", 260356)

                checkIfForecastCube(dataset, self.params[0], throwError=True)

                for cb_var in var_names:
                    if NUM.isnan(dataset.variables[cb_var][:]).any():
                        self.params[0].setIDMessage("ERROR", 260377)

                if paramChanged(self.params[2]):
                    if self.params[2].value not in dataset.variables:
                        self.params[2].setIDMessage("ERROR", 260357, self.params[2].value)
                
                numTime = dataset.dimensions['time'].size
                if self.params[6].altered:
                    if self.params[6].value > numTime*0.25:
                        self.params[6].setIDMessage("ERROR",260360)
                    if self.params[6].value<numTime*0.05:
                        self.params[6].setIDMessage("WARNING",260376)

                if self.params[3].altered:
                    if self.params[3].value > 0:
                        try:      
                            if self.params[3].value > numTime-1-self.params[6].value:
                                self.params[3].setIDMessage("ERROR",260361)
                        except:
                            pass
                    else:
                        self.params[3].setIDMessage("ERROR",260362)                

                if self.params[4].altered:
                    used_vars = []
                    if self.params[4].value:
                        for row in self.params[4].values:
                            if row[0] in used_vars:
                                self.params[4].setIDMessage("ERROR", 260370, row[0])
                            else:
                                used_vars.append(row[0])
                                if dataset.variables[row[0]][:].dtype == NUM.float64 and row[1]==True:
                                    self.params[4].setIDMessage("WARNING", 260372, row[0])

                dataset.close()

            except:
                #### Not a Cube ####
                if not self.params[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(self.params[0].value.value)
            self.params[0].setIDMessage("ERROR", 260367, cubeFile)
        
        # if arcpy.Exists(self.params[0].value):
        #     fileExists = True
        #     check_char1 = str(arcpy.Describe(self.params[0].value).catalogPath)
        #     chars1 = set('# $-`')
        #     if any((c in chars1) for c in check_char1):
        #         self.params[0].setIDMessage("WARNING", 260245)
        # else:
        #     self.params[0].setIDMessage("ERROR", 260244)
        
        if self.params[5].altered:
            if self.params[5].value <= 0:
                self.params[5].setIDMessage("ERROR",260362)
        
        # if self.params[8].altered:
        #     if self.params[8].value < 2:
        #         self.params[8].setIDMessage("ERROR",260363)

        if self.params[11].value:
            if self.params[6].value is None or self.params[6].value <=0:
                self.params[11].setIDMessage("ERROR",260364)

        # if self.params[12].value:
        #     if self.params[6].value is None or self.params[6].value <=0:
        #         self.params[12].setIDMessage("ERROR",260365)
        if self.params[7].value=='LSTM':
            # if self.params[4].values:
            #     self.params[7].setIDMessage("ERROR",260365)
            if self.params[3].value <= 1:
                self.params[7].setIDMessage("ERROR", 260363)

        if self.params[13].value==True:
            if self.params[3].value>=(numTime-self.params[6].value)//1.5:
                self.params[3].setIDMessage("ERROR", 260375)
            if self.params[6].value>self.params[3].value//2:
                self.params[6].setIDMessage("ERROR", 260374)
        return
        

    def isLicensed(self):
        if (arcpy.ProductInfo() != "ArcInfo") :
            arcpy.AddIDMessage("ERROR", 180002)
            return False
        else:
            return True