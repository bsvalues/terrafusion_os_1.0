"""-------------------------------------------------------------------------
    Tool:               Train Using AutoML (GeoAI Tools)
    Source Name:        TrainUsingAutoML.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Input Feature
                        Output Model
                        Variable to Predict
                        Treat Variable as Categorical
                        Explanatory Training Variables
    Optional Arguments: Explanatory Training Distance Features
                        Explanatory Training Rasters
                        Total Time Limit (Minutes)
                        AutoML Mode
                        Algorithms
                        Validation Percentage
                        Output Report
                        Output Importance
                        Output Feature Class
                        Enable Image Attachments
    Description:        Train and identify best model for the
                        given dataset using AutoML.
    Updated:            02-06-2023
------------------------------------------------------------------------"""

try:
    import arcpy
    import os, json
    import arcgis
    from arcgis.gis import GIS
    from arcgis.features import FeatureLayer
    from arcgis.raster import Raster
    from arcgis.learn import prepare_tabulardata,AutoML
    import SSUtilities as UTILS
    import pandas as pd
    import os
    import SSDataObject as SSDO
    import time
    import arcgisscripting as ARC
    from pathlib import Path
    import ntpath
    import shutil
    import sys
    from contextlib import redirect_stdout
    import locale as locale
    locale.setlocale(locale.LC_ALL, '')
    import numpy as np
    import os as OS
    import arcpy as ARCPY
    import numpy as NUM
    from SSForest import genColor, getJenkBreaks
    import tempfile
    from arcpy import da
    import re

    HAS_DEPS = True
except Exception as e:
    HAS_DEPS = False


listTable = []
listTable2 = []
headTable = ['Name','Model Type','Metric Type','Metric Value','Train Time']
headTable1 = ['Performance of the evaluated models']
headtable2 = ['Additional metrices for the best model']
headtable3 = ['Logloss','AUC','f1','Accuracy','Precision','Recall','mcc']


in_features = arcpy.GetParameter(0)
model_save_path = arcpy.GetParameterAsText(1)
variable_predict = arcpy.GetParameterAsText(2)
treat_variable_as_categorical = arcpy.GetParameterAsText(3)
explanatory_variables = arcpy.GetParameter(4)
distance_features = arcpy.GetParameter(5)
explanatory_rasters = arcpy.GetParameter(6)
total_time_limit = arcpy.GetParameterAsText(7)
auto_ml_mode = arcpy.GetParameterAsText(8)
algorithms = arcpy.GetParameter(9)
val_percent = arcpy.GetParameter(10)
out_report = arcpy.GetParameterAsText(11)
table_name = arcpy.GetParameterAsText(12)
out_feature_class = arcpy.GetParameterAsText(13)
include_attachments = arcpy.GetParameterAsText(14)
sensitive_features_input = arcpy.GetParameter(15)
fairness_metric = arcpy.GetParameterAsText(16)


desc = arcpy.Describe(in_features)
data_type = desc.dataType
try:
    shapeType = desc.shapeType
except:
    shapeType = None
try:
    data_source = desc.catalogPath
except:
    data_source = in_features


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit(260005)

if not HAS_DEPS:
    _raise_conda_import_error()

gis=GIS("pro")

if data_type in ['FeatureClass','ShapeFile']:
    in_features = (in_features,'gptool')

if (data_type in ['FeatureLayer']) and not (data_source.find('https')==0):
    in_features = (in_features, 'gptool')

layer = 0
if ((data_source.find('https') == 0) and (data_type != 'TableView')):
    #data_source = r'https://services5.arcgis.com/cuQhNeNcUrgLmYGD/ArcGIS/rest/services/2020_Disaster_Photos_Puerto_Rico/FeatureServer\0'
    in_features = FeatureLayer(data_source)
    layer = 1

models=[]
model_tool = []
model_map = {'RANDOM TREES':'Random Trees','EXTRA TREE':'Extra Trees','LIGHT GBM':'LightGBM','DECISION TREE':'Decision Tree',
             'XGBOOST':'Xgboost','LINEAR':'Linear','RANDOM FOREST':'Random Trees', 'CATBOOST':'CatBoost'}
for r in range(len(algorithms)):
    model_tool.append(algorithms[r])
    models.append(model_map[algorithms[r]])

features=[]
for r in range(len(distance_features)):
    features.append(distance_features[r])

if len(models)==0:
    models=['Linear', 'Decision Tree', 'Random Trees','Extra Trees', 'LightGBM', 'Xgboost','CatBoost']

def validate_parameters():
	pass

def renameFile(currentAttachmentPath, newAttachmentPath):
    #Rename file - ensure new attachment path does not exist already
    if not os.path.exists(newAttachmentPath):
        os.rename(currentAttachmentPath, newAttachmentPath)
        #logger.info('{} being renamed as {}'.format(currentAttachmentPath, newAttachmentPath))
    else:
        #logger.warning('Not able to rename {} as {} because file already exists. Removing {}'.format(currentAttachmentPath, newAttachmentPath, currentAttachmentPath))
        os.remove(currentAttachmentPath)

def createFolder(folderPath):
    if not os.path.exists(folderPath):
        try:
            os.makedirs(folderPath)
        except OSError as e:
            arcpy.AddIDMessage("ERROR", 2132)#Change id - Todo

def download_attachment_from_feature(feature):
    desc = arcpy.Describe(feature)
    inTable = desc.name + '__ATTACH'
    list_of_paths = []
    fileLocation = tempfile.gettempdir()
    with da.SearchCursor(feature, ["OBJECTID"]) as cursor:
        rows = {row[0] for row in cursor}

    feature_row_count = len(rows)
    with da.SearchCursor(inTable, ['DATA', 'ATT_NAME', 'ATTACHMENTID']) as cursor:
        for item in cursor:
            attachment = item[0]
            filenum = "ATT" + str(item[2]) + "_"
            filename = filenum + str(item[1])
            open(fileLocation + os.sep + filename, 'wb').write(attachment.tobytes())
            list_of_paths.append(fileLocation + os.sep + filename)
            del item
            del filenum
            del filename
            del attachment
    if feature_row_count != len(list_of_paths):
        arcpy.AddIDMessage("ERROR", 260276)
        exit()
    return list_of_paths

def download_attachment_from_layer(featureLayer):
    list_of_paths = []
    if featureLayer.properties.hasAttachments:
        featureLayerName = '{}-{}'.format(str(0), re.sub(r'[^A-Za-z0-9]+', '', featureLayer.properties.name))
        temp_dir = tempfile.gettempdir()
        AttachmentStorage = 'GroupedFolder'
        downloadCounter = 0
        nonDownloadCounter = 0
        downloadSizeCounter = 0
        emptyAttachments = 0
        featureObjectIds = featureLayer.query(where='1=1', return_ids_only=True)
        #SaveAttachmentsTo = temp_dir
        featureLayerFolder = temp_dir
        featureObjectIds['objectIds'].sort()
        #featureLayerFolder = SaveAttachmentsTo + r'\\' + featureLayerName
        #createFolder(featureLayerFolder.name)
        for j in range(len(featureObjectIds['objectIds'])):
            currentObjectId = featureObjectIds['objectIds'][j]
            currentObjectIdAttachments = featureLayer.attachments.get_list(oid=currentObjectId)
            if len(currentObjectIdAttachments) > 0:
                for k in range(len(currentObjectIdAttachments)):
                    attachmentId = currentObjectIdAttachments[k]['id']
                    attachmentName = currentObjectIdAttachments[k]['name']
                    attachmentSize = currentObjectIdAttachments[k]['size']
                    if AttachmentStorage == 'IndividualFolder':
                        currentFolder = featureLayerFolder.name + r'\\' + str(currentObjectId)
                        createFolder(currentFolder)
                        fileName = '{}-{}'.format(attachmentId, attachmentName)
                        newAttachmentPath = '{}\\{}'.format(currentFolder, fileName)
                        list_of_paths.append(newAttachmentPath)
                        if not os.path.isfile(newAttachmentPath):
                            currentAttachmentPath = featureLayer.attachments.download \
                                (oid=currentObjectId, attachment_id=attachmentId, save_path=currentFolder.name)
                            renameFile(currentAttachmentPath, newAttachmentPath)
                            downloadCounter += 1
                            downloadSizeCounter += attachmentSize
                        else:
                            nonDownloadCounter += 1
                    elif AttachmentStorage == 'GroupedFolder':
                        fileName = '{}{}'.format(currentObjectId, '.jpg')
                        newAttachmentPath = '{}\\{}'.format(featureLayerFolder, fileName)
                        list_of_paths.append(newAttachmentPath)
                        if not os.path.isfile(newAttachmentPath):
                            currentAttachmentPath = featureLayer.attachments.download \
                                (oid=currentObjectId, attachment_id=attachmentId, save_path=featureLayerFolder)
                            renameFile(currentAttachmentPath[0], newAttachmentPath)
                            downloadCounter += 1
                            downloadSizeCounter += attachmentSize
                        else:
                            nonDownloadCounter += 1
            else:
                arcpy.AddIDMessage("ERROR", 260277)
                exit()
    else:
        msg = arcpy.GetIDMessage(517)
        arcpy.AddWarning(msg)
    return list_of_paths

def get_raster_data(explanatory_rasters):
    raster_list = []
    for i in range(0, explanatory_rasters.rowCount):
        wkt = 0
        raster = explanatory_rasters.getValue(i,0)
        raster_cat = explanatory_rasters.getValue(i,1)
        desc = arcpy.sa.Raster(raster)
        path = desc.path
        path_all = os.path.normpath(path +"\\"+ desc.name)
        raster_arcgis=Raster(path_all)
        if desc.spatialReference.type.upper() == "UNKNOWN":
            arcpy.AddIDMessage("ERROR", 2132)
            exit()
        try:
            wkt = raster_arcgis.extent['spatialReference']['wkid']
            if wkt is None:
                msg = arcpy.GetIDMessage(517)
                arcpy.AddWarning(msg)
        except:
            msg = arcpy.GetIDMessage(517)
            arcpy.AddWarning(msg)

        if not raster_cat or raster_cat == 'false':
            raster_var = raster_arcgis
        else:
            raster_var = (raster_arcgis, True)

        raster_list.append(raster_var)
    return raster_list

def get_leaderboard(AutoML_class_obj):
        localised_list = []
        list_of_ids = [260118, 260113, 260119, 260120, 260121, 260111]
        for id in list_of_ids:
            localised_list.append(arcpy.GetIDMessage(id))
        if sensitive_features_input.rowCount > 0:
            localised_list.append('is_fair')
        listTable.append(localised_list)

        leader_board_df = AutoML_class_obj._model.get_leaderboard()#.sort_values(by=['metric_value'])
        leader_board_df = leader_board_df.round(3)
        leader_board_df.insert(loc=0, column="Best model", value="")
        leader_board_df.loc[
            leader_board_df.name == AutoML_class_obj._model._best_model.get_name(), "Best model"
        ] = leader_board_df.name
        headTable_out = arcpy.GetIDMessage(260206)

        for index, row in enumerate(leader_board_df.values.tolist()):
            row_locale = []
            #if index == 0:
            #    msg = arcpy.GetIDMessage(260027)
            #    row[0] = row[0] + ' (' + msg + ')'
            for x in row[:6]:
                if isinstance(x, float):
                    row_locale.append(locale.format_string("%0.3f", x))
                else:
                    if x == 'Random Forest':
                        row_locale.append('Random Trees')
                    else:
                        row_locale.append(x)
            #listTable.append(row[:5])
            if sensitive_features_input.rowCount>0:
                row_locale.append(row[-1])
            listTable.append(row_locale)
        outputReport = UTILS.outputTextTable(listTable, header = headTable_out,
                                         justify = ["left", "right", "right", "right", "right","right"], pad = 1, colPad = 3,
                                         titleFillToken = "-", force2Txt=False)
        return outputReport

def get_additional_metrics(AutoML_class_obj):
    num_cols = len(AutoML_class_obj._model._best_model._additional_metrics['max_metrics'].columns)
    if num_cols == 7:
        listTable2.append(['logloss','auc','f1','accuracy','precision','recall','mcc'])
        additional_metrics = AutoML_class_obj._model._best_model._additional_metrics['max_metrics'].head(1)
    elif num_cols == 4:
        listTable2.append(['precision', 'recall', 'f1-score', 'support'])
        additional_metrics = AutoML_class_obj._model._best_model._additional_metrics['max_metrics']
    else:
        if str(treat_variable_as_categorical) == 'true':
            arcpy.AddIDMessage("WARNING", 260146)
        msg1 = arcpy.GetIDMessage(260030)
        msg2 = arcpy.GetIDMessage(260031)
        listTable2.append([msg1, msg2])
        additional_metrics = AutoML_class_obj._model._best_model._additional_metrics['max_metrics']
    additional_metrics = additional_metrics.round(3)
    for row in additional_metrics.values.tolist():
        row_locale = []
        for x in row:
            if isinstance(x, float):
                row_locale.append(locale.format_string("%0.3f", x))
            else:
                row_locale.append(x)
        # listTable.append(row[:5])
        listTable2.append(row_locale)
        #listTable2.append(row)
    header = arcpy.GetIDMessage(260026)
    outputReport2 = UTILS.outputTextTable(listTable2, header = [header],
                                         justify = ["left", "right", "right", "right", "right","right","right"], pad = 1, colPad = 3,
                                         titleFillToken = "-", force2Txt=False)
    return outputReport2

def get_feature_importance_table(AutoML_class_obj):
    if ((AutoML_class_obj._model._best_model._name=='Ensemble') or (AutoML_class_obj._model._best_model._name=='Ensemble_Stacked')):
        path = os.path.abspath(os.path.join(AutoML_class_obj._model._get_results_path(),AutoML_class_obj._model._best_model.selected_models[0]['model']._name))
    else:
        path = os.path.abspath(os.path.join(AutoML_class_obj._model._get_results_path(),AutoML_class_obj._model._best_model._name))
    csv_path = os.path.join(path,'learner_fold_0_shap_importance.csv')
    fields = []
    data = UTILS.DataContainer(None)
    fields = []
    if Path(csv_path).is_file():
        shap_importance = pd.read_csv(csv_path)
        msg1 = arcpy.GetIDMessage(260028)
        msg2 = arcpy.GetIDMessage(260029)
        field = SSDO.CandidateField(name = msg1,type = "TEXT",data = shap_importance['feature'].values)
        impField = SSDO.CandidateField(name = msg2,type = "DOUBLE",data = shap_importance['shap_importance'].values)
    else:
        csv_path = os.path.join(path,'learner_fold_0_importance.csv')
        shap_importance = pd.read_csv(csv_path)
        field = SSDO.CandidateField(name = "VARIABLES",type = "TEXT",data = shap_importance['feature'].values)
        impField = SSDO.CandidateField(name = "IMPORTANCE",type = "DOUBLE",data = shap_importance['mean_importance'].values)
    fields.append(field)
    fields.append(impField)
    outputDiagnostic, dbf = UTILS.returnTableName(table_name)
    if Path(csv_path).is_file():
        try:
            ARC._ss.output_table_from_candidate_fields(outputDiagnostic, len(shap_importance['shap_importance'].values),fields)
        except:
            csv_path = os.path.join(path, 'learner_fold_0_importance.csv')
            shap_importance = pd.read_csv(csv_path)
            ARC._ss.output_table_from_candidate_fields(outputDiagnostic, len(shap_importance['mean_importance'].values),
                                                       fields)

    else:
        try:
            ARC._ss.output_table_from_candidate_fields(outputDiagnostic, len(shap_importance['mean_importance'].values),fields)
        except:
            csv_path = os.path.join(path, 'learner_fold_0_shap_importance.csv.csv')
            shap_importance = pd.read_csv(csv_path)
            ARC._ss.output_table_from_candidate_fields(outputDiagnostic, len(shap_importance['shap_importance'].values),
                                                       fields)
    return

def get_expl_variable_list(explanatory_variables):
    exp_var = []
    for i in range(0, explanatory_variables.rowCount):
        var = explanatory_variables.getValue(i,0)
        cat = explanatory_variables.getValue(i,1)
        if var in ["OID", "FID", "SHAPE", "OBJECTID", "SHAPE_LENG", "SHAPE_AREA"]:
            break
        if cat=='true':
            var = (var,True)
        exp_var.append(var)
    exp_var = list(set(exp_var))
    if include_attachments=='true':
        exp_var.append(('Images','image'))
    return exp_var

def get_senitive_features(sensitive_features):
    sensitive_feat = []
    grp = []
    for i in range(0, sensitive_features.rowCount):
        var = sensitive_features.getValue(i,0)
        underprivileged_grp = sensitive_features.getValue(i,1)
        grp.append({var:underprivileged_grp})
        sensitive_feat.append(var)
    return sensitive_feat,grp


def check_folder_exists(model_save_path):

    exists = os.path.isdir(os.path.dirname(model_save_path))
    basename = os.path.basename(os.path.splitext(model_save_path)[0])
    if exists:
        if len(os.listdir(os.path.dirname(model_save_path)))>0:
            new_folder = basename
            model_save_path = os.path.join(os.path.dirname(model_save_path),new_folder)
            if (os.path.isdir(model_save_path)):
                shutil.rmtree(model_save_path)
            return model_save_path
        else:
            return os.path.dirname(model_save_path)
    else:
        return os.path.dirname(model_save_path)

def validate_data(data):
    if hasattr(data,'_dataframe'):
        number_of_records_train = data._dataframe.shape[0]
        number_of_predictors = data._dataframe.shape[1]
        if len(data._dataframe) == 0:
            arcpy.AddIDMessage("ERROR", 260200)
            return False
        try:
            if len(data._dataframe) < 25:
                arcpy.AddIDMessage("ERROR", 260125)
                return False
        except:
            pass
        try:
            num_unique_dependent = np.unique(data._dataframe[variable_predict].values, return_counts=False)
            if len(num_unique_dependent) > 200 and len(num_unique_dependent) > int(0.5 * data._dataframe[variable_predict].values.shape[0]):
                if (str(treat_variable_as_categorical) == 'true' and not isinstance(data._dataframe[variable_predict][0],str)):
                    arcpy.AddIDMessage("WARNING", 260146)
        except:
            return True
        try:
            if data._dataframe.columns[data._dataframe.isna().all()].tolist():
                arcpy.AddIDMessage("ERROR", 260149)
                return False
        except:
            return True
        if number_of_predictors < 2:
            arcpy.AddIDMessage("ERROR", 737)
            return False
        if ((len(models)==1) and (models[0] == 'Linear') and ((number_of_records_train > 10000) or (number_of_predictors > 1000))):
            arcpy.AddIDMessage("ERROR", 260019)
            return False
    else:
        arcpy.AddIDMessage("ERROR", 902)
        return False
    return True

def copy_dlpk_to_parent(src_path,dest_path,delete=True):
    import shutil
    if os.path.isdir(dest_path):
        shutil.rmtree(dest_path)
    shutil.copyfile(src_path, dest_path)
    if delete:
        shutil.rmtree(os.path.dirname(src_path))

def get_ml_task(data,treat_variable_as_categorical):
    num_unique_dependent = np.unique(data._dataframe[variable_predict].values, return_counts=False)
    if len(num_unique_dependent) == 2 and str(treat_variable_as_categorical) == 'true':
        return 'binary_classification'
    elif (len(num_unique_dependent) > 2 and str(treat_variable_as_categorical) == 'true') and \
            (not isinstance(data._dataframe[variable_predict][0],float)) and (not isinstance(data._dataframe[variable_predict][0],np.int32)):
        if len(num_unique_dependent) > 200 and len(num_unique_dependent) > int(0.5 * data._dataframe[variable_predict].shape[0]):
            return 'text'
        else:
            return 'multiclass_classification'
    elif isinstance(data._dataframe[variable_predict][0], float) or isinstance(data._dataframe[variable_predict][0], np.int32):
        if str(treat_variable_as_categorical) == 'false':
            #arcpy.AddIDMessage("WARNING", 260146)
            return "regression"
        else:
            return 'auto'
    else:
        return 'auto'

def check_class_imbalance(model):
    if model._model._get_ml_task() != 'regression':
        total_rows = model._data._dataframe[model._data._dependent_variable].value_counts().sum()
        val_cnts = model._data._dataframe[model._data._dependent_variable].value_counts()
        if len(val_cnts[val_cnts/total_rows < 0.01]) > 0:
            return True
        else:
            return False
    else:
        return False


def get_layer_def(
        data,
        isClass,
        headingName
    ):
    """
    Use a template layer to generate a customized layer.
    The default symbol is described in a line 'decribeSymbolType',
    this position should be known from the template layer.
    """

    global shapeType
    msg = ARCPY.GetIDMessage(84338)
    regcolors = ["237,248,251","178,226,226","102,194,164","44,162,95","0,109,44"]

    layerFileTemplate = None
    valueUnique = None
    uniqueValues = None
    typeSymbolLocation = None
    heading = None
    colors = None
    minV = None
    minBreak = None
    fieldN = None
    removeLines = None
    colorStroke = None
    viewOthers =  None
    #### Check Template Layer ####
    if isClass:
        uniqueValues = NUM.unique(data)
        if shapeType == "Polygon":
            layerFileTemplate = "RFPolygonClassification.lyrx"
            typeSymbolLocation = 323
            heading = 326
            fieldN = 316
            removeLines = 337
            viewOthers = 329
        if shapeType == "Point":
            layerFileTemplate = "RFPointClassification.lyrx"
            typeSymbolLocation = 376
            heading = 379
            fieldN = 369
            removeLines = 390
            viewOthers = 382

        colors = genColor(len(uniqueValues))
    else:
        minV, uniqueValues = getJenkBreaks(data, 5)
        uniqueValues = NUM.round(uniqueValues,4)
        if shapeType == "Polygon":
            layerFileTemplate = "RFPolygonRegression.lyrx"
            typeSymbolLocation = 263
            heading = 306
            minBreak = 296
            fieldN = 295
            removeLines = 397

        if shapeType == "Point":
            layerFileTemplate = "RFPointRegression.lyrx"
            typeSymbolLocation = 265
            heading = 308
            minBreak = 298
            fieldN = 297
            removeLines = 503
        colors = regcolors

    pathLayer =  OS.path.join(UTILS.pathLayers, layerFileTemplate)
    lines = []

    if OS.path.isfile(pathLayer):
        f = open(pathLayer, 'r')
        lines = f.readlines()
        f.close()
    else:
        return

    if viewOthers is not None:
        lines[viewOthers] = lines[viewOthers].replace("true", "false")

    decribeSymbolType = lines[typeSymbolLocation]

    head = lines[heading].replace("NAME_FIELD", headingName) #+"("+msg+")")
    lines[heading] = head
    lines[fieldN] = lines[fieldN].replace("PREDICTED", headingName)
    newElem = []

    if minBreak is not None:
        minBreakV = lines[minBreak].replace("4", str(minV))
        lines[minBreak] = minBreakV

    if type(uniqueValues) == NUM.float64 or type(uniqueValues) == NUM.int32:
        uniqueValues = NUM.array([uniqueValues])

    #### Generate New Elements in the Template Replacing Values ####
    prev = minV
    decimals = 4
    eps = 1e-4
    minDec = 1

    try:
        if uniqueValues.dtype == NUM.int32:
            decimals = 0
            eps = 1
            minDec = 0
    except:
        pass

    for id, i in enumerate(uniqueValues):
        ele = decribeSymbolType.replace("150,150,150", colors[id])

        if colorStroke is not None:
            ele = ele.replace("110,110,110", colorStroke[id])

        if isinstance(i, str) or isClass:
            ele = ele.replace("99999", str(i))
        else:
            newValue = ""
            if NUM.allclose(prev, i):
                newValue = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit = minDec, returnFormatStr=True))
            else:
                strLI = UTILS.formatValue(prev, UTILS.getPerfectFormatDecimal(prev, decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                strUI = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                newValue = fr"{strLI} - {strUI}"

            prev = i+eps
            ele = ele.replace("\\u226499999", newValue)
            ele = ele.replace("99999", str(i))

        ele = ele.replace("CATEGORY", str(i))

        if str(type(i)).startswith('U'):
            ele = ele.replace('"VALUE2CHANGE"', str(i))
        else:
            ele = ele.replace('VALUE2CHANGE', str(i))

        if valueUnique is not None:
            ele = ele.replace("VALUETOSEARCH", str(valueUnique[id]))

        newElem.append(ele)

    replac = ",".join(newElem)
    lines[typeSymbolLocation] = replac
    iniText = lines[0:typeSymbolLocation]
    endText = lines[typeSymbolLocation:len(lines)]
    iniText += endText;
    #### Avoid to Use Previous Layer ####
    startLayerCIM = 9

    #### Remove CIM extra Lines ####
    for i in NUM.arange(8):
        iniText[i]= ""

    for i in NUM.arange(removeLines, len(iniText), 1):
        iniText[i]= ""

    info = " ".join(iniText)

    #### Return JSON CIM ####
    return "JSONCIMDEF="+info.strip()

def train_model(model_save_path):
    raster_list = None
    if auto_ml_mode.lower().title() == 'Advanced' and data_type != 'TableView':
        cell_sizes = [3, 4, 5, 6, 7]
    else:
        cell_sizes = []
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260224))
    arcpy.SetProgressorPosition(10)
    if include_attachments=='true':
        if layer == 1:
            paths = download_attachment_from_layer(in_features)
        else:
            paths = download_attachment_from_feature(in_features[0])
    if explanatory_rasters.rowCount>0:
        raster_list = get_raster_data(explanatory_rasters)
        exp_var = get_expl_variable_list(explanatory_variables)
        try:
            data = prepare_tabulardata(in_features, variable_predict, explanatory_variables=exp_var, distance_features=features,
                                       explanatory_rasters = raster_list,val_split_pct=0.1,working_dir=model_save_path,cell_sizes=cell_sizes)
        except:
            arcpy.AddIDMessage("ERROR", 260203)
            exit()
    else:
        exp_var = get_expl_variable_list(explanatory_variables)
        #try:
        if include_attachments=='true':
            data = prepare_tabulardata(in_features, variable_predict, explanatory_variables=exp_var,
                                       distance_features=features,
                                       val_split_pct=0.1, working_dir=model_save_path, cell_sizes=cell_sizes,image_attach_list=paths)
        else:
            data = prepare_tabulardata(in_features, variable_predict, explanatory_variables=exp_var,distance_features=features,
                                       val_split_pct=0.1,working_dir=model_save_path,cell_sizes=cell_sizes)
        #except:
        #    arcpy.AddIDMessage("ERROR", 260203)
        #    exit()
    ret = validate_data(data)
    if not ret:
        exit()
    try:
        ml_task = get_ml_task(data,treat_variable_as_categorical)
    except:
        ml_task = 'auto'

    try:
        if sensitive_features_input:
            sensitive_features, underprivileged_group = get_senitive_features(sensitive_features_input)
            fairness_metric = arcpy.GetParameterAsText(16)
            fairness_metric = fairness_metric.lower()
            if fairness_metric == 'group_loss_ratio':
                fairness_metric = "auto"
            AutoML_class_obj = AutoML(data=data, mode=auto_ml_mode.lower().title(),
                                      total_time_limit=int(float(total_time_limit)), algorithms=models, ml_task=ml_task,
                                      sensitive_variables=sensitive_features,fairness_metric=fairness_metric,
                                      unprivileged_groups= underprivileged_group)
        else:
            AutoML_class_obj = AutoML(data=data,mode=auto_ml_mode.lower().title(),total_time_limit=int(float(total_time_limit)),
                                  algorithms=models,ml_task=ml_task)
    except:
        arcpy.AddIDMessage("ERROR", 260203)
        exit()

    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260225))
    arcpy.SetProgressorPosition(50)
    with redirect_stdout(None):
        AutoML_class_obj.fit()
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260226))
    arcpy.SetProgressorPosition(80)
    if table_name:
        try:
            get_feature_importance_table(AutoML_class_obj)
        except:
            arcpy.AddIDMessage("WARNING", 260156)

    if out_report:
        try:
            AutoML_class_obj.report()
            error_rep = False
        except ImportError:
            error_rep = False
        except:
            error_rep = True
            arcpy.AddIDMessage("WARNING", 260223)
        model_save_path_act = check_folder_exists(str(out_report))
        basename = os.path.basename(str(out_report))
        AutoML_class_obj.save(model_save_path_act)
        for file in os.listdir(model_save_path_act):
            if file.endswith(".dlpk"):
                src_path = os.path.abspath(os.path.join(model_save_path_act,file))
            if file.endswith("README.html"):
                report_final_name = os.path.join(model_save_path_act, basename)
                try:
                    os.remove(os.path.join(model_save_path_act,basename))
                except OSError:
                    pass
                os.rename(os.path.join(model_save_path_act,file), os.path.join(model_save_path_act,basename))
        try:
            shutil.copyfile(os.path.join(model_save_path_act,basename), str(out_report))
        except:
            pass
        dest_path = os.path.abspath(model_save_path)
        copy_dlpk_to_parent(src_path,dest_path,False)
    else:
        model_save_path_act = check_folder_exists(str(model_save_path))
        AutoML_class_obj.save(model_save_path_act)
        for file in os.listdir(model_save_path_act):
            if file.endswith(".dlpk"):
                src_path = os.path.abspath(os.path.join(model_save_path_act,file))
        dest_path = os.path.abspath(model_save_path)
        copy_dlpk_to_parent(src_path,dest_path)

    try:
        is_imbalanced = check_class_imbalance(AutoML_class_obj)
        if is_imbalanced:
            arcpy.AddIDMessage("WARNING", 260228)
    except:
        pass

    msg = arcpy.GetIDMessage(260024)
    msg_2 = msg + " {0}"
    arcpy.AddMessage(msg_2.format(model_save_path))
    outputReport = get_leaderboard(AutoML_class_obj)
    outputReport2 = get_additional_metrics(AutoML_class_obj)
    arcpy.AddMessage(outputReport + outputReport2)

    if out_report and not error_rep:
        msg = arcpy.GetIDMessage(260025)
        msg_2 = msg + " {0}"
        try:
            arcpy.AddMessage(msg)
            link = UTILS.outputParagraph([UTILS.buildHyperlink(str(out_report))])
        except:
            pass

    if out_feature_class:
        try:
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(260227))
            arcpy.SetProgressorPosition(80)
            AutoML_class_obj_pred = AutoML.from_model(model_save_path)
            if include_attachments=='true':
                pred = AutoML_class_obj_pred.predict(input_features=in_features, explanatory_rasters=raster_list,
                                                     distance_features=features,
                                                     output_layer_name='prediction_on_train_data',
                                                     prediction_type='dataframe',
                                                     output_raster_path=None, match_field_names=None, gis=gis,
                                                     cell_sizes=cell_sizes, image_attach_list=paths)
            else:
                pred = AutoML_class_obj_pred.predict(input_features=in_features, explanatory_rasters=raster_list,
                                                     distance_features=features,
                                                     output_layer_name='prediction_on_train_data',
                                                     prediction_type='dataframe',
                                                     output_raster_path=None, match_field_names=None, gis=gis,
                                                     cell_sizes=cell_sizes)
        except:
            arcpy.AddIDMessage("ERROR", 260204)
            exit()
        output_feature_class = out_feature_class
        if not (UTILS.isInMemory(str(out_feature_class)) or str(out_feature_class).endswith('.shp')):
            # Case when outputFC is a filegeodabase feature class

            out_path = Path(out_feature_class)
            fgdb = out_path.parent.absolute()
            fc_name = ntpath.basename(out_path)
            output_feature_class = os.path.join(fgdb, fc_name)

        output_is_shapefile = False
        try:
            fc = pred.spatial.to_featureclass(output_feature_class, sanitize_columns=True)
            output_is_shapefile = True
        except:
            try:
                fc = pred.spatial.to_table(output_feature_class)
                arcpy.AddIDMessage("WARNING", 260033)
            except:
                arcpy.AddIDMessage("WARNING", 354)
                #exit()

        if output_is_shapefile:
            #### Apply JSON CIM ####
            try:
                isClass = AutoML_class_obj._data._is_classification or type(pred['prediction_results'].values[0])==str
                ARCPY.gp.SetParameterSymbology(13, get_layer_def(
                    pred['prediction_results'].values,
                    isClass,
                    'prediction_results'
                ))
            except:
                pass

if __name__ == "__main__":
    train_model(model_save_path)
