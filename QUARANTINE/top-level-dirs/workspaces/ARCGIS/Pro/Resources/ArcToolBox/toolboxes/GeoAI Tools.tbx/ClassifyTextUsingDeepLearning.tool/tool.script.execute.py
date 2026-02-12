"""-------------------------------------------------------------------------
    Tool:               Classify Text Using Deep Learning (GeoAI Tools)
    Source Name:        classifyTextUsingDeepLearning.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Input Table
                        Input Text Field
                        Model Definition
    Optional Arguments: Output Field
                        Model Arguments
                        Explain Option
    Description:        Analyze the text and categorize it into
                        one of several classes.
------------------------------------------------------------------------"""

# Import system modules
try:
    import os
    import sys
    import json
    import torch, gc, re
    import arcpy
    import arcgis
    import random
    import numpy as np
    import pandas as pd
    from arcgis.gis import GIS
    from arcgis.features import FeatureSet
    from collections import OrderedDict
    from pathlib import Path
    from arcgis.features import FeatureLayer
    from arcgis.learn.text import TextClassifier, ZeroShotClassifier
    from arcgis.learn._utils.common import _get_emd_path
    import locale as LOCALE

    LOCALE.setlocale(LOCALE.LC_ALL, "")
    gc.collect()
    torch.cuda.empty_cache()
    HAS_DEPS = True
    from arcgis import GIS
except Exception as e:
    HAS_DEPS = False


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit()


if not HAS_DEPS:
    _raise_conda_import_error()

multilabel_map = {"false": False, "true": True}
is_multilabel_problem = False
labels_columns = []
dtype_map = {
    "esriFieldTypeSmallInteger": "SHORT",
    "esriFieldTypeInteger": "LONG",
    "esriFieldTypeSingle": "FLOAT",
    "esriFieldTypeDouble": "FLOAT",
    "esriFieldTypeFloat": "FLOAT",
    "esriFieldTypeString": "TEXT",
    "esriFieldTypeDate": "DATE",
    "esriFieldTypeOID": "LONG",
    "esriFieldTypeGeometry": object,
    "esriFieldTypeBlob": "BLOB",
    "esriFieldTypeRaster": "RASTER",
    "esriFieldTypeGUID": "GUID",
    "esriFieldTypeGlobalID": "GUID",
    "esriFieldTypeTimeOnly": "TIMEONLY",
    "esriFieldTypeDateOnly": "DATEONLY",
    "esriFieldTypeTimestampOffset": "TIMESTAMPOFFSET",
}

gis = GIS("home")


class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""

    pass


# Number of token to be shown in the plor
NO_TOKEN = 10

# Define input parameters
global get_explain
IS_ONLINE_LAYER = False
input_feature = arcpy.GetParameterAsText(0)
text_column = arcpy.GetParameterAsText(1)
model_definition = arcpy.GetParameterAsText(2)
output_field = arcpy.GetParameterAsText(3)
output_field = output_field.strip()
output_field = re.sub("[^0-9a-zA-Z_]+", "_", output_field)
model_arguments = arcpy.GetParameter(4)
get_explain = arcpy.GetParameter(6)
batch_size = int(arcpy.GetParameter(7))
if batch_size == 0 or batch_size == None:
    batch_size = 4

arg_dict = {
    "candidate_labels": "",
    "multi_label_classification": "False",
    "threshold": "0",
}


for arg_index in range(model_arguments.rowCount):
    arg_pair = model_arguments.getRow(arg_index).split("'")
    for each in arg_pair:
        if not each.strip():
            arg_pair.remove(each)
    key, val = [x.replace("'", "") for x in arg_pair]
    arg_dict[key] = val

threshold_pred = float(LOCALE.atof(arg_dict.get("confidence_threshold", "0.25")))
threshold = float(arg_dict.get("threshold", "0"))
candidate_labels = arg_dict.get("candidate_labels", "")

multilabel_classification = multilabel_map[
    arg_dict.get("multi_label_classification", "False").lower()
]

if arcpy.env.isCancelled:
    arcpy.AddIDMessage("ERROR", 571)
    exit()


def set_device_params():
    # if cuda-enabled GPU is available, the tool uses GPU when the user specify processor type to be GPU or not specify anything
    if torch.cuda.is_available() and (
        not arcpy.env.processorType or arcpy.env.processorType == "GPU"
    ):
        arcpy.env.processorType = "GPU"
        arcgis.env._processorType = arcpy.env.processorType
        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        if not arcpy.env.gpuId:
            arcpy.env.gpuId = 0
        os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
        arcgis.env._gpuid = arcpy.env.gpuId
        torch.cuda.set_device(arcpy.env.gpuId)
        arcpy.AddIDMessage("INFORMATIVE", 260036)
    # if cuda-enabled GPU is available, the tool uses CPU when the user specify processor type to be CPU
    elif torch.cuda.is_available() and arcpy.env.processorType == "CPU":
        arcpy.env.processorType = "CPU"
        arcgis.env._processorType = arcpy.env.processorType
        os.environ["CUDA_VISIBLE_DEVICES"] = ""
        arcpy.AddIDMessage("INFORMATIVE", 260035)
    # if cuda-enabled GPU is not available, the tool uses CPU when the user specify processor type to be CPU or not
    # specify anything
    elif not torch.cuda.is_available() and (
        not arcpy.env.processorType or arcpy.env.processorType == "CPU"
    ):
        arcpy.env.processorType = "CPU"
        arcgis.env._processorType = arcpy.env.processorType
        os.environ["CUDA_VISIBLE_DEVICES"] = ""
        arcpy.AddIDMessage("INFORMATIVE", 260035)
    else:
        arcpy.AddIDMessage("ERROR", 260006)
        exit()


def validate_arguments():
    global is_multilabel_problem, labels_columns, model_definition
    emd_path = _get_emd_path(model_definition)
    with open(emd_path) as f:
        emd = json.load(f)
    model_type = emd.get("ModelName", "TextClassifier")
    if model_type == "TextClassifier":
        if emd["ModelType"] == "Transformer":
            if "InferenceFunction" not in emd:
                is_multilabel_problem = emd["IsMultilabelClassificationProblem"]
                labels_columns = emd["LabelColumns"]
            if is_multilabel_problem != multilabel_classification:
                arcpy.AddIDMessage("WARNING", 260001)
        else:
            model_type = "llm"
    if model_type == "ZeroShotClassifier":
        if candidate_labels == "":
            arcpy.AddIDMessage("ERROR", 260002)
            exit()
        elif "," not in candidate_labels:
            arcpy.AddIDMessage("WARNING", 260008)
        labels_columns = candidate_labels.split(",")
    return model_type, emd


def get_class_labels(item, multilabel_classification, thresh):
    labels, scores = item["labels"], item["scores"]
    if not multilabel_classification:
        index = np.argmax(scores)
        return labels[index], scores[index]
    else:
        categories = [x for x, y in zip(labels, scores) if y > thresh]
        return str(",".join(categories))


def html_generator(shap_values, labels, sublabel, base_values):
    template = """<html>
      <head>
        <meta charset = "utf-8">
        <script>
          var data = @@data,
              g_popupTheme = 1,
              rp = "file:///" + g_resourceFolder + "/";
            var st = document.createElement("script"); 
            st.type = "text/javascript";
            st.src = rp + "ArcToolbox/Scripts/Images/textClassifier.js";
            document.head.appendChild(st);
        </script>
      </head>
      <body></body>
      </html>"""
    all_dict = {}
    shap_values = shap_values[np.newaxis, :, :]
    base_values = base_values[np.newaxis, :]
    tlist = []
    for idx2, label in enumerate(labels):
        # select only top-10 contributing items. The array is reversed because numpy return ascending order result.
        top_idx = np.argsort(np.abs(shap_values[:, :, idx2][0]))[::-1][:NO_TOKEN]
        for idx in top_idx:
            temp = {
                "label": label,
                "slabel_v": round(shap_values[:, idx, idx2][0], 4),
                "slabel_n": sublabel[idx],
                "base_v": round((shap_values.sum(axis=1)[0] + base_values)[0][idx2], 4),
            }
            tlist.append(temp)

    template = template.replace("@@data", str(tlist))
    return template


def popup_management(html_data):
    # setting output field for output_field as "html_popup"
    arcpy.AddIDMessage("INFORMATIVE", 260038, input_feature)
    dsc_in = arcpy.Describe(input_feature)
    # Check whether the field is already present. if it is already present
    # the issue a warning and process.
    inFields = [field.name.lower() for field in dsc_in.Fields]
    if "html_popup".lower() in inFields:
        arcpy.AddIDMessage("WARNING", 260003, str("html_popup"))
        try:
            arcpy.management.DeleteField(input_feature, "html_popup")
        except:
            arcpy.AddIDMessage("ERROR", 499)
            exit()
    # Try adding the field
    max_len = max(map(len, html_data))

    try:
        arcpy.management.AddField(
            input_feature, "html_popup", "TEXT", field_length=int(max_len * 1.1)
        )
    except:
        arcpy.AddIDMessage("ERROR", 499)
        exit()

    with arcpy.da.UpdateCursor(input_feature, [text_column, "html_popup"]) as cur:
        idx = 0
        for row in cur:
            item = row[0]
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()
            if item is not None:
                row[1] = html_data[idx]
                idx += 1
            elif item is None:
                row[1] = None
                idx += 1
            cur.updateRow(row)


def featureset_merge(list_of_featureset, input_features, oid_list):
    # Fetch the first feature set to extract the fields
    pseudo_oid = "oid_extension"
    temp_fields = list_of_featureset[0].fields
    temp_fields = [
        i
        for i in temp_fields
        if i["name"] != list_of_featureset[0]._object_id_field_name
    ]
    temp_fields.append({"name": pseudo_oid, "type": "esriFieldTypeInteger"})

    temp_geom = list_of_featureset[0].geometry_type
    temp_features = []
    total_features = 0
    idx = 0
    for i in list_of_featureset:
        for feature in i:
            feature = feature.as_dict
            del feature["attributes"][list_of_featureset[0]._object_id_field_name]
            feature["attributes"][pseudo_oid] = oid_list[idx]
            idx += 1
            temp_features.append(feature)
            total_features += 1

    if total_features != len(input_features):
        arcpy.AddIDMessage("WARNING", 260340)
    return FeatureSet.from_dict(
        {"geometry": temp_geom, "features": temp_features, "fields": temp_fields}
    )


def predict_model_extension(
    model, text_list, batch_size, explain_val, oid_list
) -> FeatureSet:
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    kwargs = {}
    kwargs["batch_size"] = batch_size
    kwargs.update(arg_dict)
    return_config = model.inference_model.getConfiguration(**kwargs)
    batch_size = (
        return_config["batch_size"]
        if return_config.get("batch_size", None)
        else batch_size
    )
    predictions = []
    for i in range(0, len(text_list), batch_size):
        item_list = text_list[i : i + batch_size]
        results = model.predict(
            item_list,
            batch_size=batch_size,
            show_progress=False,
            thresh=threshold_pred,
            explain=explain_val,
            input_field=text_column,
        )
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
        predictions.append(results)
    # Merge the feature set
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260040))
    arcpy.SetProgressorPosition(100)
    results = featureset_merge(predictions, text_list, oid_list)
    return results


def predict(model, text_list, batch_size, explain_val, model_type):
    predictions = []
    if explain_val:
        shap_vals_values = []
        shap_vals_output_names = []
        shap_vals_feature_names = []
        shap_vals_base_values = []
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    num = LOCALE.format_string("%d", len(text_list))
    for i in range(0, len(text_list), batch_size):
        item_list = text_list[i : i + batch_size]
        results = model.predict(
            item_list,
            batch_size=batch_size,
            show_progress=False,
            thresh=threshold_pred,
            explain=explain_val,
        )
        if model_type == "llm":
            results = [tuple(list(res) + [1]) for res in results]
        predictions.extend(results)
        if explain_val:
            shap_vals_values.extend(list(model.shap_values.values))
            shap_vals_output_names.extend(list(model.shap_values.output_names))
            shap_vals_feature_names.extend(list(model.shap_values.feature_names))
            shap_vals_base_values.extend(list(model.shap_values.base_values))
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260040))
    arcpy.SetProgressorPosition(100)
    if explain_val:
        return (
            predictions,
            shap_vals_values,
            list(OrderedDict.fromkeys(shap_vals_output_names)),
            shap_vals_feature_names,
            shap_vals_base_values,
        )
    return predictions


def read_file(path):
    global IS_ONLINE_LAYER
    data_type = arcpy.Describe(path).dataType
    catalog_path = arcpy.Describe(path).catalogPath
    sdf = None
    table_data = []
    if "http:" in catalog_path or "https:" in catalog_path:
        IS_ONLINE_LAYER = True
        try:
            all_data = arcpy.da.TableToNumPyArray(
                str(input_feature), field_names=[text_column]
            )
            sdf = pd.DataFrame(data=all_data, columns=[text_column])
            table_data = getattr(sdf, text_column).values.tolist()
            oid_list = getattr(sdf, "index").values.tolist()
            return data_type, table_data, oid_list
        except:
            arcpy.AddIDMessage("ERROR", 260013)
            exit()
    else:
        try:
            if data_type in [
                "TableView",
                "Table",
                "ShapeFile",
                "FeatureLayer",
                "FeatureClass",
            ]:
                oid_name = arcpy.Describe(path).OIDFieldName
                oid_list = []
                with arcpy.da.SearchCursor(
                    input_feature, [oid_name, text_column]
                ) as cursor:
                    for row in cursor:
                        table_data.append(row[1])
                        oid_list.append(row[0])
                return data_type, table_data, oid_list
            else:
                arcpy.AddIDMessage("ERROR", 260013)
                exit()
        except RuntimeError as e:
            if "Cannot find field" in str(e):
                arcpy.AddIDMessage("ERROR", 1486)
                exit()
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()


def _merge_feature_set_with_table_layer(
    input_feature, result_feature, result_feature_output_field, oid_list
):
    dsc_input = arcpy.Describe(input_feature)
    inFields = [
        field.name.lower()
        for field in dsc_input.Fields
        if field.name != dsc_input.OIDFieldName
    ]
    if output_field.lower() in inFields:
        arcpy.AddIDMessage("WARNING", 260003, str(output_field))
        try:
            arcpy.management.DeleteField(input_feature, output_field)
        except:
            arcpy.AddIDMessage("ERROR", 499)
            exit()
            return

    # add a column for join
    arcpy.management.AddField(input_feature, "oid_existing", "LONG")
    dsc_output = arcpy.Describe(result_feature)
    result_inFields = [
        field.name.lower()
        for field in dsc_output.Fields
        if field.name != dsc_output.OIDFieldName
    ]
    # common fields
    common_fields = set(inFields).intersection(set(result_inFields))
    # delete the common fields
    if len(common_fields):
        arcpy.management.DeleteField(input_feature, list(common_fields))

    if IS_ONLINE_LAYER:
        catalogue_path = dsc_input.catalogPath

        # Add OID in the input
        input_feature_layer_for_edit = FeatureLayer(catalogue_path)
        input_featureset = input_feature_layer_for_edit.query()
        temp = []
        for idx, i in enumerate(input_featureset.value["features"]):
            i["attributes"]["oid_existing"] = oid_list[idx]
            temp.append(i)
        # Push the updates
        input_feature_layer_for_edit.edit_features(updates=temp)

        # Apply the join
        arcpy.management.JoinField(
            input_feature, "oid_existing", result_feature, "oid_extension"
        )

        # Rename the column
        result_feature_dtype = [
            field.type
            for field in dsc_output.Fields
            if field.name == result_feature_output_field.lower()
        ]
        arcpy.management.AddField(input_feature, output_field, result_feature_dtype[0])
        input_feature_layer_for_edit = FeatureLayer(catalogue_path)
        input_featureset = input_feature_layer_for_edit.query()
        temp = []
        for i in input_featureset.value["features"]:
            i["attributes"][output_field] = i["attributes"][
                result_feature_output_field.lower()
            ]
            temp.append(i)
        # Push the final updates
        input_feature_layer_for_edit.edit_features(updates=temp)
    else:
        cur = arcpy.UpdateCursor(input_feature)
        for idx, row in enumerate(cur):
            row.setValue("oid_existing", oid_list[idx])
            cur.updateRow(row)
        arcpy.management.JoinField(
            input_feature, "oid_existing", result_feature, "oid_extension"
        )
        # delete the multiple columns
        arcpy.management.AlterField(
            input_feature,
            result_feature_output_field.lower(),
            output_field,
            output_field,
        )
    arcpy.management.DeleteField(
        input_feature,
        ["oid_extension", "oid_existing", result_feature_output_field.lower()],
    )


def run_inference():
    try:
        if not HAS_DEPS:
            _raise_conda_import_error()
        model = None
        dsc_in = None
        global model_definition, get_explain
        if get_explain:
            all_generated_html = []
        set_device_params()

        if model_definition.endswith(".dlpk_remote"):
            desc = arcpy.env.workspace
            item_id = os.path.basename(model_definition).split(".")[0]
            gis = GIS("home")
            online_model = gis.content.get(item_id)
            filepath = os.path.join(desc, online_model.name)
            model_definition = filepath
        model_type, emd = validate_arguments()
        IS_INFERENCE_FUNCTION = False
        if "InferenceFunction" in emd:
            IS_INFERENCE_FUNCTION = True

        arcpy.AddIDMessage("INFORMATIVE", 260038, str(input_feature))
        dsc_in = arcpy.Describe(input_feature)
        inFields = [field.name.lower() for field in dsc_in.Fields]
        labels_columns_conf = []
        if not IS_INFERENCE_FUNCTION:
            if output_field.lower() in inFields:
                arcpy.AddIDMessage("WARNING", 260003, str(output_field))
                try:
                    arcpy.management.DeleteField(input_feature, output_field)
                    # if get_explain:
                    #     arcpy.management.DeleteField(input_feature, "html_popup")
                except:
                    arcpy.AddIDMessage("ERROR", 499)
                    exit()
                    return
            try:
                arcpy.management.AddField(input_feature, output_field, "TEXT")
                if is_multilabel_problem:
                    for lc in labels_columns:
                        arcpy.management.AddField(
                            input_feature, str(lc) + "_confidence", "DOUBLE"
                        )
                        labels_columns_conf.append(str(lc) + "_confidence")
                else:
                    if "prediction_confidence" in inFields:
                        arcpy.AddIDMessage(
                            "WARNING", 260003, str("prediction_confidence")
                        )
                        arcpy.management.DeleteField(
                            input_feature, "prediction_confidence"
                        )
                    arcpy.management.AddField(
                        input_feature, "prediction_confidence", "TEXT"
                    )

            except:
                arcpy.AddIDMessage("ERROR", 499)
                exit()
                return
        try:
            data_type, text_list, oid_list = read_file(dsc_in.catalogPath)
        except Exception as e:
            raise CustomCancelException(e)
            exit()
        arcpy.AddIDMessage("INFORMATIVE", 260039)
        if model_type == "TextClassifier" or model_type == "llm":
            try:
                if IS_INFERENCE_FUNCTION:
                    try:
                        model_args = {}
                        model_args["device"] = arcpy.env.processorType
                        model = TextClassifier.from_model(
                            model_definition, **model_args
                        )
                    except:
                        arcpy.AddIDMessage("ERROR", 260341, "loading")
                        exit()
                else:
                    model = TextClassifier.from_model(model_definition)
            except Exception as e:
                if "Mistral model is not installed" in str(e):
                    arcpy.AddIDMessage("ERROR", 260333)
                    exit()
                else:
                    arcpy.AddIDMessage("ERROR", 260165)
                    exit()
        else:
            if model_definition != "":
                model = ZeroShotClassifier.from_model(model_definition)
            else:
                model = ZeroShotClassifier()

        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        # text_list = getattr(data_frame, text_column).values.tolist()
        arcpy.AddIDMessage("INFORMATIVE", 260043, str(len(text_list)))
        if isinstance(model, TextClassifier):
            if get_explain:
                try:
                    filter_index = []
                    filter_text = []
                    filter_counter = 0
                    import copy

                    cpy_text_list = copy.deepcopy(text_list)
                    for ind, text in enumerate(text_list):
                        if len(text.split(" ")) <= 2:
                            filter_index.append(ind)
                            filter_text.append(text_list[ind])
                            del cpy_text_list[ind - filter_counter]
                            filter_counter += 1
                    (
                        predictions,
                        shap_vals_values,
                        shap_vals_output_names,
                        shap_vals_feature_names,
                        shap_vals_base_values,
                    ) = predict(model, cpy_text_list, batch_size, True, model_type)
                    if len(filter_index) > 0:
                        filtered_predictions = predict(
                            model, filter_text, batch_size, False, model_type
                        )
                        for indx, pred, txt in zip(
                            filter_index, filtered_predictions, filter_text
                        ):
                            text_list.insert(indx, txt)
                            predictions.insert(indx, pred)
                            shap_vals_values.insert(indx, "None")
                            shap_vals_feature_names.insert(indx, "None")
                            shap_vals_base_values.insert(indx, "None")
                except Exception as e:
                    if "zero-size array to reduction operation" in str(e):
                        arcpy.AddIDMessage("WARNING", 260328)
                        get_explain = False
                        for indx, txt in zip(filter_index, filter_text):
                            text_list.insert(indx, txt)
                        predictions = predict(
                            model, text_list, batch_size, False, model_type
                        )
                    else:
                        arcpy.AddIDMessage("ERROR", 260041, str(e))
                        exit()
            else:
                if IS_INFERENCE_FUNCTION:
                    try:
                        predictions = predict_model_extension(
                            model, text_list, batch_size, False, oid_list
                        )
                    except:
                        arcpy.AddIDMessage("ERROR", 260341, "performing inference")
                        exit()
                else:
                    predictions = predict(
                        model, text_list, batch_size, False, model_type
                    )

        else:
            pass

        if isinstance(predictions, FeatureSet):
            # This will only be possible in inference function
            gdb_path = Path(arcpy.env.workspace)
            fname = str(random.randint(0, sys.maxsize))
            arcpy.Delete_management(fname)
            out_table = predictions.sdf.spatial.to_table(
                os.path.join(gdb_path, "file" + fname)
            )
            try:
                _merge_feature_set_with_table_layer(
                    input_feature, out_table, emd["OutputField"], oid_list
                )
            except:
                arcpy.AddIDMessage("ERROR", 260341, "adding output to input feature")
                exit()
            arcpy.Delete_management("file" + fname)
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(260140))
            arcpy.AddIDMessage("INFORMATIVE", 260040)
        else:
            additional_columns = [text_column, output_field]
            if not is_multilabel_problem:
                additional_columns.extend(["prediction_confidence"])
            else:
                additional_columns.extend(labels_columns_conf)

            arcpy.SetProgressor("step", arcpy.GetIDMessage(260139))
            total_rows = int(arcpy.GetCount_management(input_feature)[0])
            counter = 1

            try:
                with arcpy.da.UpdateCursor(input_feature, additional_columns) as ucur:
                    for i, row in enumerate(ucur):
                        if arcpy.env.isCancelled:
                            arcpy.AddIDMessage("ERROR", 571)
                            exit()
                        try:
                            add_html = True
                            if isinstance(model, TextClassifier):
                                if is_multilabel_problem:
                                    result = predictions[i]

                                    if isinstance(result[1], str):
                                        row[1] = result[1].replace(";", "; ")
                                        accuracy = result[-1]
                                    else:
                                        row[1] = "NA"
                                        accuracy = result[-1]
                                else:
                                    result = predictions[i]
                                    row[1] = result[1]
                                    if len(result[1]) > 0:
                                        accuracy = result[-1]
                                    else:
                                        accuracy = 0
                                        row[1] = "NA"

                                if isinstance(accuracy, list):
                                    for i, cols in enumerate(labels_columns_conf):
                                        row[i + 2] = accuracy[i]

                                else:
                                    row[2] = str(round(accuracy, 2))
                                if get_explain:
                                    try:
                                        if shap_vals_values[counter - 1] == "None":
                                            all_generated_html.append("None")
                                        else:
                                            all_generated_html.append(
                                                html_generator(
                                                    shap_vals_values[counter - 1],
                                                    shap_vals_output_names,
                                                    shap_vals_feature_names[
                                                        counter - 1
                                                    ],
                                                    shap_vals_base_values[counter - 1],
                                                )
                                            )
                                        add_html = True
                                    except Exception as e:
                                        add_html = False
                                        exit()

                                ucur.updateRow(row)
                            else:
                                result = model.predict(
                                    text_list[i], candidate_labels, show_progress=False
                                )
                                prediction, confscore = get_class_labels(
                                    result[0], False, threshold
                                )
                                row[1] = prediction
                                row[2] = str(round(confscore, 2))
                                ucur.updateRow(row)
                        except Exception as e:
                            row[1] = "NA"
                            ucur.updateRow(row)
                        if arcpy.env.isCancelled:
                            arcpy.AddIDMessage("ERROR", 571)
                            exit()
                        percentage_completed = float(counter / total_rows) * 100
                        arcpy.SetProgressorPosition(int(percentage_completed))
                        counter += 1
            except TypeError as e:
                if "cannot update join table" in str(e):
                    arcpy.AddIDMessage("ERROR", 1486)
                    exit()
            except Exception as e:
                arcpy.AddIDMessage("ERROR", 260041, str(e))
                exit()

            # to add the field in the cursor. Another loop is initialized because max length is not available till now.
            try:
                if get_explain and add_html and len(all_generated_html):
                    popup_management(all_generated_html)
            except:
                arcpy.AddIDMessage("WARNING", 260331)
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(260140))
            arcpy.SetParameterAsText(5, input_feature)
            arcpy.AddIDMessage("INFORMATIVE", 260040)
    except Exception as e:
        if "out of memory" in str(e):
            arcpy.AddIDMessage("ERROR", 260004)
            exit()
        else:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
    finally:
        del dsc_in
        del model
        gc.collect()
        torch.cuda.empty_cache()


if __name__ == "__main__":
    run_inference()
