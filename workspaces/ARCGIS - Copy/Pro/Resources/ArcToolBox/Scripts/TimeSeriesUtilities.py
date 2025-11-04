import arcpy as ARCPY
import os as OS
import SSUtilities as UTILS
import json as JSON
import SSTimeUtilities as TUTILS
import numpy as NUM
import SSCubeUtilities as CUTILS
import SSPanel as PANEL
import SSCube as CUBE
import ErrorUtils as ERROR
import SSDataObject as SSDO
import pandas as pd
import sklearn.metrics as metrics
import numpy as np
import json

ai_label2ForecastType = {"inceptiontime": 100, "rescnn": 101,"resnet": 102, "fcn": 103, "lstm": 104, "timeseriestransformer": 105}
ai_forecastType2Label = {100: ARCPY.GetIDMessage(260351), 101: ARCPY.GetIDMessage(260353),
                      102: ARCPY.GetIDMessage(260352), 103: ARCPY.GetIDMessage(260354), 
                      104: ARCPY.GetIDMessage(260355), 105: ARCPY.GetIDMessage(260373)}

def calculate_fit_forecast_multiv(df,ts_model, forecast_time, num_locations, seq_len, analysis_variable, multistep):
    fit_forecast = NUM.zeros((forecast_time, num_locations), dtype = float)
    frmse = NUM.zeros(num_locations)

    from tqdm import tqdm
    for location in tqdm(range(num_locations)):
        df_raw = df[df['location']==location]
        df_raw = df_raw.drop('location', axis=1)
        fit_forecast_arr = NUM.array(df_raw[f'{analysis_variable}'].iloc[:seq_len])
        
        for i in range(df_raw.shape[0]-seq_len):
            if multistep == False:
                df_seqlen = df_raw.iloc[i:i+seq_len+1].copy()
                df_seqlen.reset_index(drop=True, inplace=True)
                df_seqlen[f'{analysis_variable}'].iloc[-1] = NUM.nan
                prediction = ts_model.predict(df_seqlen, prediction_type='dataframe')
            else:
                df_seqlen = df_raw.iloc[i:i+seq_len].copy()
                df_seqlen.reset_index(drop=True, inplace=True)
                prediction = ts_model.predict(df_seqlen, prediction_type='dataframe')[:seq_len+1]
                prediction = prediction[:seq_len+1]
                
            
            fit_forecast_arr = NUM.append(fit_forecast_arr, prediction[f"{analysis_variable}_results"].iloc[-1])
        
        fmse = metrics.mean_squared_error(df_raw[f'{analysis_variable}'], fit_forecast_arr)
        frmse[location] = round(NUM.sqrt(fmse), 4)
        fit_forecast[:, location] = fit_forecast_arr
        
    return fit_forecast, frmse

def calculate_fit_forecast(df,ts_model, forecast_time, num_locations, seq_len, analysis_variable):
    fit_forecast = NUM.zeros((forecast_time, num_locations), dtype = float)
    frmse = NUM.zeros(num_locations)
    from tqdm import tqdm
    for location in tqdm(range(num_locations)):
        df_seqlen = pd.DataFrame()
        df_seqlen[f"{analysis_variable}"] = df[[location]]
        df_pred_arr = NUM.array(df_seqlen[f"{analysis_variable}"])
        fit_forecast_df = pd.DataFrame(columns=[f"{analysis_variable}"], index=range(forecast_time))
        fit_forecast_df[f"{analysis_variable}"].iloc[0:seq_len] = df_pred_arr[0:seq_len]
        i = 0
        for i in range(df.shape[0]-seq_len):
            input_arr = df_pred_arr[i:i+seq_len]
            df_seqlen = pd.DataFrame(input_arr, columns=[f"{analysis_variable}"])
            prediction = ts_model.predict(df_seqlen, prediction_type='dataframe', number_of_predictions=1)
            fit_forecast_df[f"{analysis_variable}"].iloc[i+seq_len] = prediction[f"{analysis_variable}_results"].iloc[seq_len]
        fmse = metrics.mean_squared_error(df[[location]], fit_forecast_df[f"{analysis_variable}"])
        frmse[location] = round(NUM.sqrt(fmse), 4)
        fit_forecast[:, location] = NUM.array(fit_forecast_df[f"{analysis_variable}"])
    return fit_forecast, frmse

def regenGeneralCubeReport(cube, varName):
    import SSCube as CUBE

    if isinstance(cube, CUBE.SSCube):
        if varName is None:
            for v in cube.dataset.variables:
                if v.endswith("_FIT"):
                    varName = v.split("FORECAST_")[-1].split("_FIT")[0]
                    break

        analysisMask = cube.obtainVariableMask(varName)
        cube.cubeInfo.reset_search_info(mask=analysisMask)
        tiledMask = NUM.tile(analysisMask, cube.cubeInfo.num_time)
        tiledMask = tiledMask.reshape(cube.cubeInfo.num_time, cube.numRows, cube.numCols)

        #### Retrieve Values from Cube ####
        fillZeros = varName[-6:] == '_ZEROS'
        y = cube.obtainValues(varName, flatten=False,
                                    fillZeros=fillZeros) * 1.0

        #### One-Dimensional (flattened) Masks ####
        tiledMask = tiledMask.ravel()
        y = y.ravel()
        #### Set Stats ####
        cube.setStats(y, tiledMask)

    return cube.generalCubeReport()
class AIPanel(PANEL.SSPanel):

    def forecastOutputFields2D_ai(self, outputFC, varName):
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


class AIModel():
    def __init__(self, data, addTime, validationSize, model_type, sequence_length, frmse, rawForecast, fitForecast, validationRMSE, outlierOption=None, outlierConfidence='90%', outlierTestSize=None):
        
        UTILS.assignClassAttr(self, locals())
        self.jsonMethodStr = json.dumps({"0": f"Time Series AI; model_type:{model_type}; sequence_length: {sequence_length}"})
        self.forecastType = ai_label2ForecastType[model_type.lower()]        
        self.numTime, self.numLocations = data.shape
        
        self.forecastTime = self.numTime + self.addTime
        # self.highIntervals = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * NUM.nan
        # self.lowIntervals = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * NUM.nan

        
        self.sequence_length = np.array([sequence_length]*self.numLocations)
        if validationSize:
            self.doValidation = True
            self.validationRMSE = validationRMSE
        else:
            self.validationSize = 0

        self.rmse = frmse
        self.methodInts = np.zeros(self.numLocations, dtype = np.int32)
        self.seasonInt = NUM.ones(self.numLocations, dtype = NUM.int32) * -1
        if self.outlierOption is not None:
            if self.outlierConfidence in CUTILS.confidenceStr2Alpha:
                self.outlierAlpha = CUTILS.confidenceStr2Alpha[self.outlierConfidence]
            else:
                self.outlieralpha = .1

            if self.outlierTestSize is None:
                self.outlierTestSize =  max(1, int(self.numTime * .05))

    def report(self, cube=None, varName=None, print=False):
        self.table = CUTILS.createForecastReport(self, cube=cube, varName=varName)
        return self.table

class AICube(CUBE.SSCube):
    def forecastOutputFields2D_ai(self, outputFC, varName):
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
