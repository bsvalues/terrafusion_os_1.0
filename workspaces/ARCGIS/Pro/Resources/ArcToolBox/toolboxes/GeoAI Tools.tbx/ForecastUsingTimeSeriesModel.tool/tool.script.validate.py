import arcpy
import json
try:
    from fastai.data_block import get_files
    from pathlib import Path
    from zipfile import ZipFile
    import tempfile
except:
    pass
analysisMask = ["EMERGING", "OUTLIER_"]
def _get_emd_path(emd_path):
    emd_path = Path(emd_path)
    if emd_path.suffix == ".dlpk":
        temp_path = _temp_dlpk(emd_path)
        emd_path = Path(temp_path)
        # return cls.from_model(temp_path)

    if emd_path.suffix != ".emd":
        list_files = get_files(emd_path, extensions=[".emd"])
        assert len(list_files) == 1
        # return cls.from_model(list_files[0])
        emd_path = list_files[0]
    return emd_path


def _temp_dlpk(dlpk_path):
    with ZipFile(dlpk_path, "r") as zip_obj:
        temp_dir = tempfile.TemporaryDirectory().name
        zip_obj.extractall(temp_dir)
    return temp_dir

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

def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False 
    else:
        return changed

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

def checkIfForecastCube(dataset, param, throwError = False):
    if hasattr(dataset, 'is_forecast') and dataset.is_forecast.upper() == "TRUE":
        if throwError:
            param.setIDMessage("ERROR", 260358)
        else:
            param.setIDMessage("WARNING", 260359)

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

        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before 
        # standard validation.

        import netCDF4 as NET
        import os as OS
        if paramChanged(self.params[0]):    
            try:
                if self.params[0].value:
                    dataset2 = NET.Dataset(self.params[0].value.value, keepweakref=True)
                    var_names2 = getCoreCubeVariables(dataset2, removeAnalysis = True, removeSTD = False)
                    self.params[4].filters[0].list = list(var_names2)
            except:
                pass
        
        if self.params[0].value:
            try:
                if not self.params[4].altered:
                    dataset = NET.Dataset(self.params[0].value.value, keepweakref=True)
                    fields = list(getCoreCubeVariables(dataset, removeAnalysis = True, removeSTD = False))
                    if self.params[1].value:
                        if OS.path.exists(self.params[1].valueAsText):
                            emd_path = _get_emd_path(self.params[1].valueAsText)
                            f = open(emd_path)
                            json_info = json.load(f)
                            f.close()

                            train_feature_fields = json_info['categorical_variables'] + json_info['continuous_variables']
                            list_to_update = []
                            for cnt, par in enumerate(train_feature_fields):
                                pred_var = None
                                train_var = par
                                if train_var in fields:
                                    pred_var = train_var
                                list_to_update.append([pred_var,train_var])
                            self.params[4].value = list_to_update
            except:
                pass
        if self.params[6].value != "NONE":
            self.params[7].enabled = True
            self.params[8].enabled = True
        else:
            self.params[7].enabled = False
            self.params[8].enabled = False

        if self.params[7].enabled:
            if self.params[7].value is None:
                self.params[7].value = "90%"
                
        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.

        import netCDF4 as NET
        import os as OS
        import numpy as np
        throwCubeError = False
        
        if self.params[0].value:
            try:
                cubeStr = self.params[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    self.params[0].setIDMessage("ERROR", 260356)

                checkIfForecastCube(dataset, self.params[0], throwError=True)

                numTime = dataset.dimensions['time'].size
                if self.params[3].altered:
                    if self.params[3].value <= 0:
                        self.params[3].setIDMessage("ERROR",260362)
                    if self.params[3].value > int(numTime*0.5):
                        self.params[3].setIDMessage("ERROR",260366)
                
                if self.params[1].value:
                    if OS.path.exists(self.params[1].valueAsText):
                        emd_path = _get_emd_path(self.params[1].valueAsText)
                        f = open(emd_path)
                        json_info = json.load(f)
                        f.close()
                        if len(json_info["categorical_variables"] + json_info["continuous_variables"])>0:
                            if not np.isnan(dataset.variables[json_info['dependent_variable']][:]).any():
                                self.params[0].setIDMessage("WARNING", 260368)
                        else:
                            if np.isnan(dataset.variables[json_info['dependent_variable']][:]).any():
                                self.params[0].setIDMessage("ERROR", 260369)

                        if json_info["multistep"]==True:
                            if self.params[3].value>json_info['seq_len']//2:
                                self.params[3].setIDMessage("ERROR", 260374)

                dataset.close()

            except:
                #### Not a Cube ####
                if not self.params[0].isInputValueDerived():
                    throwCubeError = True

            if throwCubeError:
                cubeDir, cubeFile = OS.path.split(self.params[0].value.value)
                self.params[0].setIDMessage("ERROR", 260367, cubeFile)
        return

    def isLicensed(self):
        if (arcpy.ProductInfo() != "ArcInfo") :
            arcpy.AddIDMessage("ERROR", 180002)
            return False
        else:
            return True

    # def postExecute(self):
    #     # This method takes place after outputs are processed and
    #     # added to the display.
    # return