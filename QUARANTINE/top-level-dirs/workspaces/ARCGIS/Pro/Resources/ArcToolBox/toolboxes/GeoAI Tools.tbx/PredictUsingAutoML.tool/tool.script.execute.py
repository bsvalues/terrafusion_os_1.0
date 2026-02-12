"""-------------------------------------------------------------------------
    Tool:               Predict Using AutoML (GeoAI Tools)
    Source Name:        PredictUsingAutoML.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Model Definition
                        Prediction Type
                        Input Prediction Features
    Optional Arguments: Explanatory Rasters
                        Distance Features
                        Output Prediction Features
                        Output Prediction Surface
                        Match Explanatory Variables
                        Match Distance Variables
                        Match Explanatory Rasters
                        Get explanations for every prediction
    Description:        Get prediction from the trained AutoML
                        model on a new dataset.
    Updated:            28-10-2022
------------------------------------------------------------------------"""

try:
    import arcpy
    import arcgis.learn
    from arcgis.gis import GIS
    from arcgis.features import FeatureLayer
    from arcgis.raster import Raster
    from arcgis.learn import prepare_tabulardata, AutoML
    import os
    import re
    import copy
    import time
    import pandas as pd
    import SSUtilities as UTILS
    import os as OS
    import arcpy as ARCPY
    import numpy as NUM
    from SSForest import genColor, getJenkBreaks
    import tempfile
    from arcpy import da

    HAS_DEPS = True
except Exception as e:
    HAS_DEPS = False


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit(260005)


if not HAS_DEPS:
    _raise_conda_import_error()

gis = None
trained_model_path = arcpy.GetParameterAsText(0)
prediction_type = arcpy.GetParameterAsText(1)
input_prediction_features = arcpy.GetParameter(2)
input_prediction_features_text = arcpy.GetParameterAsText(2)
explanatory_rasters = arcpy.GetParameter(3)
distance_layers = arcpy.GetParameter(4)
output_prediction_feature = arcpy.GetParameterAsText(5)
output_raster_path = arcpy.GetParameterAsText(6)
match_explanatory_variables = arcpy.GetParameter(7)
match_dist_variables = arcpy.GetParameter(8)
match_explanatory_rasters = arcpy.GetParameter(9)
get_prediction_explanation = arcpy.GetParameter(10)

prediction_type = prediction_type.lower()
desc = arcpy.Describe(input_prediction_features)
data_type = desc.dataType
data_source = desc.catalogPath
try:
    shapeType = desc.shapeType
except:
    shapeType = None
# if explanatory_rasters:
#    if arcpy.CheckExtension("Spatial") != "Available":
#        arcpy.AddIDMessage("ERROR", 180002)

layer = 0
if data_type in ['FeatureClass', 'ShapeFile']:
    input_prediction_features = (input_prediction_features, 'gptool')

if (data_type in ['FeatureLayer']) and not (data_source.find('https')==0):
    input_prediction_features = (input_prediction_features, 'gptool')

if ((data_source.find('https') == 0) and (data_type != 'TableView')):
    input_prediction_features = FeatureLayer(data_source)
    layer = 1

features = []
for r in range(len(distance_layers)):
    features.append(distance_layers[r])


def get_raster_data(explanatoryRasters):
    raster_list = []
    for i in range(len(explanatoryRasters)):
        raster = explanatoryRasters[i]
        desc = arcpy.sa.Raster(str(raster))
        try:
            if desc.spatialReference.type.upper() == "UNKNOWN":
                arcpy.AddIDMessage("ERROR", 2132)
                exit()
        except:
            pass
        path = desc.path
        path_all = os.path.normpath(path + "\\" + desc.name)
        raster_arcgis = Raster(path_all)
        raster_var = raster_arcgis
        raster_list.append(raster_var)
    return raster_list


rasters = []
rasters = get_raster_data(explanatory_rasters)


def check_folder_exists(output_raster_path):
    exists = os.path.isdir(output_raster_path)
    if exists:
        if len(os.listdir(output_raster_path)) > 0:
            timestr = time.strftime("%Y%m%d-%H%M%S")
            new_folder = 'Predicted_Raster_' + timestr
            output_raster_path = os.path.join(output_raster_path, new_folder)
            return output_raster_path
    else:
        os.mkdir(output_raster_path)
        return output_raster_path


def create_match_field_dictionary(match_explanatory_variables, match_dist_variables, match_explanatory_rasters):
    match_field_names = {}
    for i in range(0, match_explanatory_variables.rowCount):
        src = match_explanatory_variables.getValue(i, 0)
        dest = match_explanatory_variables.getValue(i, 1).replace(" ", "_")
        if str(src) == "":
            return None
        match_field_names[src] = dest
    for i in range(0, match_dist_variables.rowCount):
        src_dist = match_dist_variables.getValue(i, 0)
        dest_dist = match_dist_variables.getValue(i, 1)
        match_field_names[src_dist] = dest_dist
    for i in range(0, match_explanatory_rasters.rowCount):
        try:
            src_ras = match_explanatory_rasters.getValue(i, 0).split("/")[-1]
            src_ras = src_ras.split("\\")[-1]
        except:
            src_ras = match_explanatory_rasters.getValue(i, 0)
        try:
            desc = arcpy.sa.Raster(str(src_ras))
            ras_name = desc.name
        except:
            ras_name = src_ras
        try:
            dest_ras = match_explanatory_rasters.getValue(i, 1).split("/")[-1]
            dest_ras = dest_ras.split("\\")[-1]
        except:
            dest_ras = match_explanatory_rasters.getValue(i, 1)
        match_field_names[ras_name] = dest_ras
    if not match_field_names:
        return None

    return match_field_names


def returnRasterPath(rasterParam):
    #### Add "tif" to Rasters in Folders ####
    # path = rasterParam.valueAsText
    if rasterParam:
        in_mem = rasterParam.startswith("in_memory") or rasterParam.startswith("memory")
        if not UTILS.isGDB(rasterParam) and not in_mem:
            outPath, outName = os.path.split(rasterParam)
            if "." not in outName:
                rasterParam += ".tif"
    return rasterParam


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
    regcolors = ["237,248,251", "178,226,226", "102,194,164", "44,162,95", "0,109,44"]

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
    viewOthers = None
    #### Check Template Layer ####
    if isClass:
        uniqueValues = NUM.unique(data)
        if shapeType == "Polygon":
            layerFileTemplate = "AutoMLPolygonClassification.lyrx"
            typeSymbolLocation = 344
            heading = 347
            fieldN = 337
            removeLines = 358
            viewOthers = 350
        if shapeType == "Point":
            layerFileTemplate = "AutoMLPointClassification.lyrx"
            typeSymbolLocation = 397
            heading = 400
            fieldN = 390
            removeLines = 411
            viewOthers = 403

        colors = genColor(len(uniqueValues))
    else:
        minV, uniqueValues = getJenkBreaks(data, 5)
        uniqueValues = NUM.round(uniqueValues, 4)
        if shapeType == "Polygon":
            layerFileTemplate = "AutoMLPolygonRegression.lyrx"
            typeSymbolLocation = 263
            heading = 306
            minBreak = 296
            fieldN = 295
            removeLines = 397

        if shapeType == "Point":
            layerFileTemplate = "AutoMLPointRegression.lyrx"
            typeSymbolLocation = 265
            heading = 308
            minBreak = 298
            fieldN = 297
            removeLines = 503
        colors = regcolors

    pathLayer = OS.path.join(UTILS.pathLayers, layerFileTemplate)
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

    head = lines[heading].replace("NAME_FIELD", headingName)  # +"("+msg+")")
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
                newValue = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit=minDec,
                                                                              returnFormatStr=True))
            else:
                strLI = UTILS.formatValue(prev, UTILS.getPerfectFormatDecimal(prev, decimals, minDeciamlLimit=minDec,
                                                                              returnFormatStr=True))
                strUI = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit=minDec,
                                                                           returnFormatStr=True))
                newValue = fr"{strLI} - {strUI}"

            prev = i + eps
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
        iniText[i] = ""

    for i in NUM.arange(removeLines, len(iniText), 1):
        iniText[i] = ""

    info = " ".join(iniText)

    #### Return JSON CIM ####
    return "JSONCIMDEF=" + info.strip()

def html_chart_generate(pred, ):
    # Logic to add HTML templates
    template = """<html>
      <head>
        <meta charset = "utf-8">
        <script>
          var fields = @@fields,
              values = @@values,
              labels = @@labels,
              g_popupTheme = 1,
              rp = "file:///" + g_resourceFolder + "/";
            var st = document.createElement("script"); 
            st.type = "text/javascript";
            st.src = rp + "ArcToolbox/Scripts/Images/describePlot.js";
            document.head.appendChild(st);
        </script>
      </head>
      <body></body>
      </html>"""

    # Change the base variables. Var and values
    _imp_columns = [i for i in pred.columns if i.endswith('imp')]
    sliced_val = pred[_imp_columns]
    html_list = []
    imp_columns = ['_'.join(i.rsplit("_")[:-1]) for i in _imp_columns]
    k = len(imp_columns)
    if len(imp_columns) > 10:
        k = 10

    for i in range(len(sliced_val)):
        val = sliced_val.iloc[i].to_list()
        val = [round(i, 4) * 100 for i in val]
        temp_columns, temp_value = zip(*sorted(zip(imp_columns, val), key=lambda t: t[1]))
        # Add logic to select top-10 fields to avoid clutter in ArcGIS

        labels = {'original': list(temp_columns[-k:])}
        temp = template.replace("@@fields", str(list(temp_columns[-k:]))
                                ).replace("@@values", str(list(temp_value[-k:]))
                                          ).replace('@@labels', str(labels))
        html_list.append(copy.deepcopy(temp))
    pred['chart_preview'] = html_list
    return pred

def check_images_needed(trained_model_path):
    try:
        import zipfile
        import json
        from zipfile import ZipFile
        with ZipFile(str(trained_model_path)) as zf:
            for file in zf.namelist():
                if file.endswith('.emd'):  # optional filtering by filetype
                    with zf.open(file) as f:
                        data = json.loads(f.read())
        if "image_variables" in data:
            return True
        else:
            return False
    except:
        return False

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
        except:
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
        msg = arcpy.GetIDMessage(260277)
        arcpy.AddWarning(msg)
    return list_of_paths

def get_saved_images_path(input_prediction_features):
    paths = []
    if layer == 1:
        paths = download_attachment_from_layer(input_prediction_features)
    else:
        paths = download_attachment_from_feature(input_prediction_features[0])
    return paths

def predict_model(output_raster_path):
    image_attach_check = check_images_needed(trained_model_path)
    if image_attach_check:
        image_list = get_saved_images_path(input_prediction_features)
    output_raster_path = returnRasterPath(output_raster_path)
    match_field_names = create_match_field_dictionary(match_explanatory_variables, match_dist_variables,
                                                      match_explanatory_rasters)
    try:
        AutoML_class_obj = AutoML.from_model(trained_model_path)
    except:
        arcpy.AddIDMessage("ERROR", 260205)
        exit()
    out_prediction_type = 'raster' if prediction_type == 'predict_raster' else 'dataframe'
    try:
        if image_attach_check:
            pred = AutoML_class_obj.predict(input_features=input_prediction_features, explanatory_rasters=rasters,
                                            distance_features=features, output_layer_name=output_prediction_feature,
                                            prediction_type=out_prediction_type, output_raster_path=output_raster_path,
                                            match_field_names=match_field_names, gis=gis,
                                            get_local_explanations=get_prediction_explanation,image_attach_list=image_list)
        else:
            pred = AutoML_class_obj.predict(input_features=input_prediction_features, explanatory_rasters=rasters,
                                            distance_features=features, output_layer_name=output_prediction_feature,
                                            prediction_type=out_prediction_type, output_raster_path=output_raster_path,
                                            match_field_names=match_field_names, gis=gis,
                                            get_local_explanations=get_prediction_explanation)
    except:
        arcpy.AddIDMessage("ERROR", 260204)
        exit()

    try:
        import shap
        if get_prediction_explanation and out_prediction_type == 'dataframe':
            pred = html_chart_generate(pred)
    except:
        arcpy.AddIDMessage("WARNING", 260240)

    if not output_raster_path:
        if data_type in ["TableView", "TextFile"]:
            pred.spatial.to_table(output_prediction_feature)
        else:
            ret = pred.spatial.to_featureclass(output_prediction_feature, sanitize_columns=True)

            #### Apply JSON CIM ####
            try:
                isClass = AutoML_class_obj._data._is_classification or type(pred['prediction_results'].values[0]) == str
                ARCPY.gp.SetParameterSymbology(5, get_layer_def(
                    pred['prediction_results'].values,
                    isClass,
                    'prediction_results'
                ))
            except:
                pass

    else:
        arcpy.AddIDMessage("INFORMATIVE", 260032, str(output_raster_path))


if __name__ == "__main__":
    predict_model(output_raster_path)
