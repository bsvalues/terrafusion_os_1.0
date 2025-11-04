
import SSCubeUtilities as CUTILS
import os
import pandas as pd
import numpy as np
import SSUtilities as UTILS
import arcpy as ARCPY
import numpy as NUM
from TimeSeriesUtilities import AICube, AIPanel, calculate_fit_forecast, calculate_fit_forecast_multiv, AIModel
try:
    from arcgis.learn import TimeSeriesModel, prepare_tabulardata
    import torch
    from sklearn.model_selection import train_test_split
    import sklearn.metrics as metrics
    HAS_DEPS = True
except:
    HAS_DEPS = False

def _raise_conda_import_error():
    ARCPY.AddIDMessage("ERROR", 260005)
    exit(260005)

if not HAS_DEPS:
    _raise_conda_import_error()

in_data = ARCPY.GetParameterAsText(0)
out_model = ARCPY.GetParameterAsText(1)
analysis_variable = ARCPY.GetParameterAsText(2)
model_type = ARCPY.GetParameterAsText(7)
sequence_length = ARCPY.GetParameter(3)
explanatory_variables = ARCPY.GetParameterAsText(4)
max_epochs = ARCPY.GetParameter(5)
batch_size = ARCPY.GetParameter(8)
arguments = ARCPY.GetParameterAsText(9)
validation_timesteps = ARCPY.GetParameter(6)
early_stopping = ARCPY.GetParameterAsText(10)
out_features = ARCPY.GetParameterAsText(11)
out_cube = ARCPY.GetParameterAsText(12)
multistep = ARCPY.GetParameterAsText(13)

def forecast_df(ts_model, df_test, test_size, n_predictions, multistep=False):
    sdf_forecasted = ts_model.predict(df_test, prediction_type='dataframe', number_of_predictions=n_predictions)
    if multistep == False:
        sdf_forecasted = sdf_forecasted.tail(test_size)
    else:
        sdf_forecasted = sdf_forecasted.loc[df_test.shape[0]:df_test.shape[0]+test_size-1]
    sdf_forecasted = sdf_forecasted[[f'{analysis_variable}_results']]
    return sdf_forecasted

def data_fit(df_loc_all, analysis_variable, batch_size, other_variables, out_model, test_size, sequence_length, model_type, args_dict, location_var='location', early_stopping=True, multistep='false', validation_timesteps=2):
    random_ctl(seed)
    data = prepare_tabulardata(df_loc_all, f"{analysis_variable}", batch_size=batch_size, explanatory_variables=other_variables, working_dir=out_model, random_split=False, val_split_pct=validation_timesteps)
    if test_size:
        data._test_size = test_size
    random_ctl(seed)
    ts_model = TimeSeriesModel(data, seq_len=sequence_length, model_arch=model_type, location_var=location_var, multistep=multistep, **args_dict)
    ts_model.fit(max_epochs, checkpoint=False, early_stopping=early_stopping)
    saved_model_path = ts_model.save(out_model, save_optimizer=True)
    return ts_model

def process_explanatory_vars(expl_vars):
    var_tuples = []
    var_list = []
    var_names = expl_vars.split(';')
    for var in var_names:
        var_name = var.split(' ')[0]
        cat_type = var.split(' ')[1]
        var_list.append(var_name)
        if cat_type == 'true':
            var_tuples.append((var_name, True))
        else:
            var_tuples.append((var_name, False))
    return var_list, var_tuples

def create_kwargs(s):
    kwargs = {}
    if s == '' or s == None:
        return kwargs
    for item in s.split(';'):
        key, value = item.split()
        if value.isdigit():
            value = int(value)
        elif ',' in value:
            value = list(map(int, value.split(',')))
        kwargs[key] = value
    return kwargs

def stack_df(df_train, num_locations, var_names=False, dfs_other=False):
    df2 = pd.DataFrame()
    if var_names:
        df3 = pd.DataFrame(columns = ["location"] + [analysis_variable] + var_names)
    else:
        df3 = pd.DataFrame(columns = ["location", f"{analysis_variable}"])
        
    for location in range(num_locations):
        df2[f"{analysis_variable}"] = df_train[[location]]
        df2['location'] = location
        if dfs_other:
            for i in range(len(dfs_other)):
                col_name = f"{var_names[i]}"
                df2[col_name] = dfs_other[i][[location]]
        df3 = pd.concat([df3, df2])
    return df3

def random_ctl(use_seed=0):
    import random
    seed = use_seed if use_seed else random.randint(1,1000000)
    
    # python RNG
    random.seed(seed)

    # pytorch RNGs
    torch.manual_seed(seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(seed)
    if use_seed:
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark     = False

    # numpy RNG
    np.random.seed(seed)

    return seed

def create_seed():
    import time as TIME
    #### Get Seed ####
    maxSeedValue = 1000000
    seed = UTILS.getRandomSeed()
    if seed == 0:
        NUM.random.seed(int(TIME.time()))
        seed = int(NUM.random.randint(maxSeedValue))
    return seed

seed = create_seed()

def train_model(out_model, explanatory_variables, out_cube=None, early_stopping='false', multistep='false'):
    model_kwargs = create_kwargs(arguments)

    if explanatory_variables is None or explanatory_variables == '':
        var_names = []
    else:
        var_names, var_tuples = process_explanatory_vars(explanatory_variables)

    if len(var_names)>0:
        cube, raw_data, analysisMask, isPanelCube, otherData, xy, locIds, clustData, locations = CUTILS.initializeMultivariateForecastTool(in_data, analysis_variable, var_names)
    else:
        cube, raw_data, analysisMask, isPanelCube = CUTILS.initializeForecastTool(in_data, analysis_variable)
        if not isPanelCube:
            mask = cube.obtainVariableMask(analysis_variable)
            maskFlat = mask.ravel()
            locations = NUM.arange(cube.sizeSlice, dtype = NUM.int32)
            locations = locations[maskFlat]

    test_size = validation_timesteps

    if multistep == 'true':
        multistep = True
    else:
        multistep = False

    model_name = os.path.basename(out_model)
    ts_model_emd = os.path.join(out_model, model_name+'.emd')

    df = pd.DataFrame(raw_data)
    dfs_other_nosplit = []
    
    if early_stopping == 'true':
        early_stopping = True
    else:
        early_stopping = False
    if len(var_names)>0:    
        for df_other in otherData:
            dfs_other_nosplit.append(pd.DataFrame(df_other))
        dfs_other = []
        dfs_other_test = []
        if test_size:
            random_ctl(seed)
            df_train, df_test = train_test_split(df, test_size=test_size, shuffle=False)
            for df_other in otherData:
                random_ctl(seed)
                df_other_train, df_other_test = (train_test_split(pd.DataFrame(df_other), test_size=test_size, shuffle=False))
                dfs_other.append(pd.DataFrame(df_other_train))
                dfs_other_test.append(pd.DataFrame(df_other_test))
        else:
            df_train = df
            for df_other in otherData:
                dfs_other.append(pd.DataFrame(df_other))

        forecast_time = df_train.shape[0] + test_size
        num_locations = df_train.shape[1]
        vrmse = np.ones(num_locations)

        df_fit = stack_df(df, num_locations, var_names, dfs_other_nosplit)
        df3 = stack_df(df_train, num_locations, var_names, dfs_other)
        
        multiv_explanatory_vars = var_tuples + ['location']
        
        ts_model = data_fit(df_fit, analysis_variable, batch_size, multiv_explanatory_vars, out_model, test_size, sequence_length, model_type, model_kwargs, location_var='location', early_stopping=True, multistep=multistep, validation_timesteps=validation_timesteps)

        fit_forecast, frmse = calculate_fit_forecast_multiv(df3, ts_model, forecast_time-test_size, num_locations, sequence_length, analysis_variable, multistep)

        if test_size:
            df_test_valid = pd.DataFrame(columns = [analysis_variable] + var_names)
            zero_mat = NUM.zeros((test_size, num_locations), dtype = float)
            fit_forecast = np.append(fit_forecast, zero_mat, axis=0)
            for location in range(num_locations):
                df2_orig = df3[df3['location']==location]
                df2_valid = df2_orig.copy()
                
                df_test_valid[analysis_variable] = df_test[[location]]
                
                if multistep == False:
                    for i in range(len(dfs_other)):
                        col_name = f"{var_names[i]}"
                        df_test_valid[col_name] = dfs_other_test[i][[location]]
                    df2_valid = pd.concat([df2_valid, df_test_valid])
                    df2_valid[f"{analysis_variable}"].iloc[-test_size:] = np.nan 

                df2_valid = df2_valid.drop('location', axis=1)

                sdf_forecasted = forecast_df(ts_model, df2_valid, test_size,  None, multistep)
                fit_forecast[-test_size:, location] = sdf_forecasted[f'{analysis_variable}_results'].copy()
                sdf_forecasted['actual'] = df_test_valid[f"{analysis_variable}"]

                mse_train = metrics.mean_squared_error(sdf_forecasted['actual'], sdf_forecasted[f'{analysis_variable}_results'])
                vrmse[location] = round(np.sqrt(mse_train), 4)
    else:
        if test_size:
            random_ctl(seed)
            df_train, df_test = train_test_split(df, test_size=test_size, shuffle=False)
        else:
            df_train = df

        forecast_time = df_train.shape[0] + test_size
        num_locations = df_train.shape[1]
        vrmse = np.ones(num_locations)

        df_fit = stack_df(df, num_locations)
        df3 = stack_df(df_train, num_locations)
        
        other_variables = ['location']
        random_ctl(seed)
        ts_model = data_fit(df_fit, analysis_variable, batch_size, other_variables, out_model, test_size, sequence_length, model_type, model_kwargs, location_var='location', early_stopping=True, multistep=multistep, validation_timesteps=validation_timesteps)
        
        random_ctl(seed)
        fit_forecast, frmse = calculate_fit_forecast(df, ts_model, forecast_time, num_locations, sequence_length, analysis_variable)

        df2_test = pd.DataFrame()
        
        if test_size:
            for location in range(num_locations):
                
                df2_test[f"{analysis_variable}"] = df_test[[location]]
                df3_pred = df3[df3['location']==location]
                df3_pred = df3_pred.drop('location', axis=1)

                sdf_forecasted = forecast_df(ts_model, df3_pred, test_size, test_size)
                fit_forecast[-test_size:, location] = sdf_forecasted[f'{analysis_variable}_results'].copy()
                sdf_forecasted['actual'] = df2_test.head(test_size)[f"{analysis_variable}"]

                mse_train = metrics.mean_squared_error(sdf_forecasted['actual'], sdf_forecasted[f'{analysis_variable}_results'])
                vrmse[location] = round(np.sqrt(mse_train), 4)

    if test_size:
        tempForecastCube = False
        v_vrmse = vrmse
        if out_cube == '' or out_cube == None:
            out_cube = UTILS.returnScratchName("FORECAST_CUBE","TEXT", extension= "nc")
            tempForecastCube = True

        raw_data[-test_size:] = fit_forecast[-test_size:]

        vrmse = np.ma.core.MaskedArray(vrmse)

        fit_forecast = np.ma.core.MaskedArray(fit_forecast)

        ai_model = AIModel(raw_data, test_size, test_size, model_type, sequence_length, frmse, raw_data, fit_forecast, vrmse)

        ai_model.outliers = NUM.zeros((forecast_time, ai_model.numLocations), dtype = bool)
        
        cube.numTime = cube.numTime - test_size

        cube.createForecastCubeFile(out_cube, ai_model)
        ai_model.highIntervals = NUM.ones((forecast_time, num_locations), dtype = float) * NUM.nan
        ai_model.lowIntervals = NUM.ones((forecast_time, num_locations), dtype = float) * NUM.nan

        if len(var_names)>0:
            ai_model.otherPredictions = otherData

        if len(var_names)>0:
            listOtherVariables = var_names
        else:
            listOtherVariables = None

        forecastCube = None
        if not cube.isPanel:
            forecastCube = AICube(out_cube, 'a')
            forecastCube.addForecastVariables(ai_model, analysis_variable, analysisMask, listOtherVariables)
            cube.numTime = cube.cubeInfo.num_time
        else:
            forecastCube = AIPanel(out_cube, 'a')
            forecastCube.addForecastVariables(ai_model, analysis_variable, listOtherVariables)

        forecastCube.mannKendall(analysis_variable)
        if listOtherVariables is not None:
            for ind, varName in enumerate(listOtherVariables):
                forecastCube.mannKendall(varName)

        reportTables = CUTILS.forecastAnalysisReport(cube, forecastCube, ai_model, analysis_variable)
        ARCPY.AddMessage(reportTables)

        if out_features:
            outputFC = out_features
            candidateFields = forecastCube.forecastOutputFields2D_ai(outputFC, analysis_variable)

            theme="FORECAST_RESULTS"
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
            cube.close()
            addTime = test_size
            fieldName = "FCAST_{0}".format(addTime)

            fieldAlias = fieldName
            for f in result["fieldsInfo"]:
                if f["name"] == fieldName:
                    fieldAlias = f["alias"]
                    break
            symbolStr = CUTILS.generateForecatingSymbology(data_lyr, fieldName, fieldAlias, shapeType)
            if symbolStr is not None:
                ARCPY.gp.SetParameterSymbology(11, symbolStr)
        if tempForecastCube:
            try:
                os.remove(out_cube)
            except:
                pass

if __name__ == '__main__':
    train_model(out_model, explanatory_variables, out_cube, early_stopping, multistep)
