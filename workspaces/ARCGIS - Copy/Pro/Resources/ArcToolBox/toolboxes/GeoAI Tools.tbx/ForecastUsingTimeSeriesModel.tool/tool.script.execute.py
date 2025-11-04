import SSCubeUtilities as CUTILS
from TimeSeriesUtilities import AICube, AIPanel, calculate_fit_forecast, AIModel, calculate_fit_forecast_multiv

from arcgis.learn import TimeSeriesModel
from arcgis.learn._utils.common import _get_emd_path
import pandas as pd
import numpy as np
import json
import arcpy as ARCPY
import os
import SSUtilities as UTILS
import SSTimeSeries as TS

import numpy as NUM

from sklearn.model_selection import train_test_split
import sklearn.metrics as metrics

try:
    import torch
    HAS_DEPS = True
except:
    HAS_DEPS = False

def _raise_conda_import_error():
    ARCPY.AddIDMessage("ERROR", 260005)
    exit(260005)

if not HAS_DEPS:
    _raise_conda_import_error()

in_data = ARCPY.GetParameterAsText(0)
in_model_definition = ARCPY.GetParameterAsText(1)
output_features = ARCPY.GetParameterAsText(2)
output_space_time_cube = ARCPY.GetParameterAsText(5)
number_of_timesteps_to_forecast = ARCPY.GetParameter(3)
match_explanatory_variables = ARCPY.GetParameterAsText(4)
outlier_option = ARCPY.GetParameterAsText(6)
level_of_confidence = ARCPY.GetParameterAsText(7)
maximum_number_of_outliers = ARCPY.GetParameter(8)

def prepare_loc_df(df, dfs_other, analysis_variable, var_names, num_locations, number_of_timesteps_to_forecast):
    df2 = pd.DataFrame()
    df3 = pd.DataFrame(columns = ["location"] + [analysis_variable] + var_names)
    f_ts = df.shape[0] - number_of_timesteps_to_forecast
    for location in range(num_locations):
        df2[f"{analysis_variable}"] = df[[location]]
        df2['location'] = location
        for i in range(len(dfs_other)):
            col_name = f"{var_names[i]}"
            df2[col_name] = dfs_other[i][[location]]
        df3 = pd.concat([df3, df2.iloc[0:f_ts]])
    return df3

def calculate_validation(df, ts_model, num_locations, validation_size, analysis_variable):
    vrmse = np.ones(num_locations)
    df_train, df_test = train_test_split(df, test_size=validation_size, shuffle=False)
    df_county_test = pd.DataFrame()
    df_county_train = pd.DataFrame()
    
    for county in range(num_locations):
        df_county_test[f"{analysis_variable}"] = df_test[[county]]
        df_county_train[f"{analysis_variable}"] = df_train[[county]]

        sdf_forecasted = ts_model.predict(df_county_train, prediction_type='dataframe', number_of_predictions=validation_size)
        sdf_forecasted = sdf_forecasted.tail(validation_size)
        sdf_forecasted = sdf_forecasted[[f'{analysis_variable}_results']]
        sdf_forecasted['actual'] = df_county_test.head(validation_size)[f"{analysis_variable}"]

        mse_valid = metrics.mean_squared_error(sdf_forecasted['actual'], sdf_forecasted[f'{analysis_variable}_results'])
        vrmse[county] = round(np.sqrt(mse_valid), 4)
    return vrmse

def calculate_validation_multivariate(df, ts_model, num_locations, validation_size, number_of_timesteps_to_forecast, analysis_variable, otherData, dfs_other, var_names):
    vrmse = np.ones(num_locations)
    df_valid, df_forecast = train_test_split(df, test_size=number_of_timesteps_to_forecast, shuffle=False)
    dfs_other_test = []
    for df_other_test in otherData:
        pd_df_other_test = pd.DataFrame(df_other_test)
        df_other_valid, df_other_forecast = train_test_split(pd_df_other_test, test_size=number_of_timesteps_to_forecast, shuffle=False)
        dfs_other_test.append(df_other_valid)
    df_county_test = pd.DataFrame()
    for county in range(num_locations):
        df_county_test[f"{analysis_variable}"] = df_valid[[county]]
        for i in range(len(dfs_other)):
            col_name = f"{var_names[i]}"
            df_county_test[col_name] = dfs_other_test[i][[county]]
        df_county_test_orig = df_county_test.copy()
        df_county_test[f"{analysis_variable}"].iloc[-validation_size:] = np.nan
        sdf_forecasted_valid = ts_model.predict(df_county_test, prediction_type='dataframe')
        sdf_forecasted_valid = sdf_forecasted_valid.tail(validation_size)
        sdf_forecasted_valid = sdf_forecasted_valid[[f'{analysis_variable}_results']]
        sdf_forecasted_valid['actual'] = df_county_test_orig.tail(validation_size)[f"{analysis_variable}"]
        mse_valid = metrics.mean_squared_error(sdf_forecasted_valid['actual'], sdf_forecasted_valid[f'{analysis_variable}_results'])
        vrmse[county] = round(np.sqrt(mse_valid), 4)
    return vrmse

def valid_multistep(df, dfs_other, ts_model, analysis_variable, var_names, num_locations, validation_size):
    df_loc_concat = prepare_loc_df(df, dfs_other, analysis_variable, var_names, num_locations, 0)
    vrmse = np.ones(num_locations)
    for i in range(num_locations):
        df_valid, df_orig = train_test_split(df_loc_concat[df_loc_concat['location']==i], test_size=validation_size, shuffle=False)
        sdf_forecasted_valid = ts_model.predict(df_valid, prediction_type='dataframe')
        sdf_forecasted_valid_res = sdf_forecasted_valid.loc[df_valid.shape[0]:df_valid.shape[0]+validation_size-1][[f'{analysis_variable}_results']]
        mse_valid = metrics.mean_squared_error(df_orig[f'{analysis_variable}'], sdf_forecasted_valid_res[f'{analysis_variable}_results'])
        vrmse[i] = mse_valid
    return vrmse

def forecast_ts(in_model_definition, number_of_timesteps_to_forecast, outlier_option, level_of_confidence, maximum_number_of_outliers):
    emd_path = _get_emd_path(in_model_definition)
    with open(emd_path) as f:
        emd = json.load(f)
    analysis_variable = emd["dependent_variable"]
    var_names = match_explanatory_variables.split(';')
    var_names = list(map(lambda x: x.replace(' #',''),var_names))
    if emd['categorical_variables'] or emd['continuous_variables']:
        var_names = emd['categorical_variables'] + emd['continuous_variables']
    if var_names == ['']:
        var_names = []

    # var_names = []
    if len(var_names)>0:
        cube, raw_data, analysisMask, isPanelCube, otherData, xy, locIds, clustData, locations = CUTILS.initializeMultivariateForecastTool(in_data, analysis_variable, var_names)
    else:
        cube, raw_data, analysisMask, isPanelCube = CUTILS.initializeForecastTool(in_data, analysis_variable)
        if not isPanelCube:
            mask = cube.obtainVariableMask(analysis_variable)
            maskFlat = mask.ravel()
            locations = NUM.arange(cube.sizeSlice, dtype = NUM.int32)
            locations = locations[maskFlat]

    multistep = emd['multistep']
    count_nan = np.sum(np.isnan(raw_data[:,0]))
    if count_nan !=0 and multistep==True:
        raw_data = raw_data[:-count_nan]
        for i in range(len(otherData)):
            otherData[i] = otherData[i][:-count_nan]
        cube.numTime = cube.numTime - count_nan
    
    orig_Data = raw_data.copy()
    df = pd.DataFrame(raw_data)
    forecast_time = df.shape[0]
    num_locations = df.shape[1]
    df2 = pd.DataFrame()
    sequence_length = emd['seq_len']

    if len(var_names)>0:
        dfs_other = []
        for df_other in otherData:
            dfs_other.append(pd.DataFrame(df_other))

        ts_model = TimeSeriesModel.from_model(in_model_definition)
        validation_size = ts_model._data._test_size

        number_of_timesteps_to_forecast = number_of_timesteps_to_forecast

        if validation_size is not None:
            if multistep == False:
                vrmse = calculate_validation_multivariate(df, ts_model, num_locations, validation_size, number_of_timesteps_to_forecast, analysis_variable, otherData, dfs_other, var_names)
            else:
                vrmse = valid_multistep(df, dfs_other, ts_model, analysis_variable, var_names, num_locations, validation_size)

        if multistep == False:
            df_loc_concat = prepare_loc_df(df, dfs_other, analysis_variable, var_names, num_locations, number_of_timesteps_to_forecast)
            fit_forecast, frmse = calculate_fit_forecast_multiv(df_loc_concat, ts_model, forecast_time-number_of_timesteps_to_forecast, num_locations, sequence_length, analysis_variable, multistep)
        else:
            df_loc_concat = prepare_loc_df(df, dfs_other, analysis_variable, var_names, num_locations, 0)
            fit_forecast, frmse = calculate_fit_forecast_multiv(df_loc_concat, ts_model, forecast_time, num_locations, sequence_length, analysis_variable, multistep)
        forecasted_locations = np.empty((number_of_timesteps_to_forecast, num_locations))
        forecasted_locations[:] = np.nan
        for county in range(num_locations):
            df2[f"{analysis_variable}"] = df[[county]]

            for i in range(len(dfs_other)):
                col_name = f"{var_names[i]}"
                df2[col_name] = dfs_other[i][[county]]

            if multistep == False:
                sdf_forecasted = ts_model.predict(df2, prediction_type='dataframe')
            else:
                sdf_forecasted = ts_model.predict(df2, prediction_type='dataframe').loc[df2.shape[0]:df2.shape[0]+number_of_timesteps_to_forecast]

            forecasted_locations[-number_of_timesteps_to_forecast:, county] = sdf_forecasted[f'{analysis_variable}_results'].tail(number_of_timesteps_to_forecast)

        fit_forecast = np.append(fit_forecast, forecasted_locations, axis = 0)

        if multistep == False:
            raw_data[-number_of_timesteps_to_forecast:] = fit_forecast[-number_of_timesteps_to_forecast:]
        else:    
            raw_data = np.append(raw_data,fit_forecast[-number_of_timesteps_to_forecast:], axis = 0)
            for i in range(len(dfs_other)):
                otherData[i] = np.append(otherData[i], forecasted_locations, axis=0)

    else:
        ts_model = TimeSeriesModel.from_model(in_model_definition)
        validation_size = ts_model._data._test_size
        
        if validation_size:
            vrmse = calculate_validation(df, ts_model, num_locations, validation_size, analysis_variable)
        
        number_of_timesteps_to_forecast = number_of_timesteps_to_forecast
        fit_forecast, frmse = calculate_fit_forecast(df, ts_model, forecast_time, num_locations, sequence_length, analysis_variable)
        forecasted_locations = np.empty((number_of_timesteps_to_forecast, num_locations))
        forecasted_locations[:] = NUM.nan
        for county in range(num_locations):
            df2[f"{analysis_variable}"] = df[[county]]
            sdf_forecasted = ts_model.predict(df2, prediction_type='dataframe', number_of_predictions=number_of_timesteps_to_forecast)
            forecasted_locations[:, county] = sdf_forecasted[f'{analysis_variable}_results'][-number_of_timesteps_to_forecast:]
        fit_forecast = np.append(fit_forecast, forecasted_locations, axis = 0)
        raw_data = np.append(raw_data,fit_forecast[-number_of_timesteps_to_forecast:], axis = 0)
    fit_forecast = np.ma.core.MaskedArray(fit_forecast)

    if len(var_names)>0 and multistep==False:
        cube.numTime = cube.numTime - number_of_timesteps_to_forecast
    else:
        pass

    if outlier_option == "NONE":
        outlier_option = None

    if level_of_confidence is None:
        level_of_confidence = "90%"

    ai_model = AIModel(orig_Data, number_of_timesteps_to_forecast, validation_size, emd['model_arch'], emd['seq_len'], frmse, raw_data, fit_forecast, vrmse, outlier_option, level_of_confidence, maximum_number_of_outliers)

    if ai_model.outlierOption is not None and len(var_names)>0 and multistep==False:
        ai_model.forecastTime = ai_model.numTime
    if ai_model.outlierOption is not None:
        ai_model.tsOutliers = TS.TSOutliers(ai_model, alpha = ai_model.outlierAlpha, testSize = ai_model.outlierTestSize)
        ai_model.outliers = ai_model.tsOutliers.outliers
    else:
        ai_model.outliers = NUM.zeros((forecast_time, ai_model.numLocations), dtype = bool)

    tempForecastCube = False
    # output_space_time_cube = None # removing output cube
    if output_space_time_cube == '' or output_space_time_cube == None:
        cube_out = UTILS.returnScratchName("FORECAST_CUBE","TEXT", extension= "nc")
        tempForecastCube = True
    else:
        cube_out = output_space_time_cube
    cube.createForecastCubeFile(cube_out, ai_model)

    if len(var_names)>0 and multistep==False:
        ai_model.highIntervals = np.ones((forecast_time, num_locations), dtype = float) * np.nan
        ai_model.lowIntervals = np.ones((forecast_time, num_locations), dtype = float) * np.nan
    else:
        ai_model.highIntervals = np.ones((forecast_time+number_of_timesteps_to_forecast, num_locations), dtype = float) * np.nan
        ai_model.lowIntervals = np.ones((forecast_time+number_of_timesteps_to_forecast, num_locations), dtype = float) * np.nan

    if len(var_names)>0:
        ai_model.otherPredictions = otherData
    if len(var_names)>0:
        listOtherVariables = var_names
    else:
        listOtherVariables = None

    forecastCube = None
    if not cube.isPanel:
        forecastCube = AICube(cube_out, 'a')
        forecastCube.addForecastVariables(ai_model, analysis_variable, analysisMask, listOtherVariables)
        cube.numTime = cube.cubeInfo.num_time
    else:
        forecastCube = AIPanel(cube_out, 'a')
        forecastCube.addForecastVariables(ai_model, analysis_variable, listOtherVariables)

    forecastCube.mannKendall(analysis_variable)
    if listOtherVariables is not None:
        for ind, varName in enumerate(listOtherVariables):
            forecastCube.mannKendall(varName)

    reportTables = CUTILS.forecastAnalysisReport(cube, forecastCube, ai_model, analysis_variable)
    cube.close()

    outputFC = output_features
    candidateFields = forecastCube.forecastOutputFields2D_ai(outputFC, analysis_variable)

    theme="TIME_SERIES_OUTLIER_RESULTS"
    popupFieldThreshold = 5e6
    if forecast_time * num_locations <= popupFieldThreshold:
        chartField = CUTILS.generateCubePopupChartField(forecastCube, analysis_variable, theme=theme)
        candidateFields.append(chartField)
        CUTILS.AdjustFieldLength(candidateFields)
        forecastCube.exportFeatures2D(outputFC, candidateFields) 
    forecastCube.close()

    fieldsInfo = [{"name": f.name, "alias": f.name} for f in candidateFields]
    result = {"fieldsInfo": fieldsInfo}
    data_lyr = ai_model.rawForecast[-1]

    shapeType = "Point"
    if cube.isPolygon:
        shapeType = "Polygon"

    addTime = number_of_timesteps_to_forecast
    fieldName = "FCAST_{0}".format(addTime)

    fieldAlias = fieldName
    for f in result["fieldsInfo"]:
        if f["name"] == fieldName:
            fieldAlias = f["alias"]
            break
    symbolStr = CUTILS.generateForecatingSymbology(data_lyr, fieldName, fieldAlias, shapeType)
    if symbolStr is not None:
        ARCPY.gp.SetParameterSymbology(2, symbolStr)
    if tempForecastCube:
        try:    
            os.remove(cube_out)
        except:
            pass

if __name__ == '__main__':
    forecast_ts(in_model_definition, number_of_timesteps_to_forecast, outlier_option, level_of_confidence, maximum_number_of_outliers)