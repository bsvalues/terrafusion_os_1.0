"""-------------------------------------------------------------------------
    Tool:               Transform Text Using Deep Learning (GeoAI Tools)
    Source Name:        transformTextUsingDeepLearning.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Input Table
                        Input Text Field
                        Model Definition
    Optional Arguments: Output Field
                        Model Arguments
                        Minimum Sequence Length
                        Maximum Sequence Length
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
    import pandas as pd
    from pathlib import Path
    from arcgis.gis import GIS
    from arcgis.features import FeatureLayer
    from arcgis.learn.text import SequenceToSequence
    from arcgis.learn._utils.common import _get_emd_path
    import re, os
    import locale as LOCALE

    LOCALE.setlocale(LOCALE.LC_ALL, "")
    gc.collect()
    torch.cuda.empty_cache()
    from arcgis import GIS

    HAS_DEPS = True
    from arcgis.features import FeatureSet
except Exception as e:
    HAS_DEPS = False


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit()


if not HAS_DEPS:
    _raise_conda_import_error()


class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""

    pass


# Define input parameters
IS_ONLINE_LAYER = False
input_feature = arcpy.GetParameterAsText(0)
text_column = arcpy.GetParameterAsText(1)
model_definition = arcpy.GetParameterAsText(2)
output_field = arcpy.GetParameterAsText(3)
output_field = output_field.strip()
output_field = re.sub("[^0-9a-zA-Z_]+", "_", output_field)
batch_size = int(arcpy.GetParameterAsText(5))
min_length = int(arcpy.GetParameterAsText(6))
max_length = int(arcpy.GetParameterAsText(7))

gis = GIS("home")


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
    # if cuda-enabled GPU is not available, the tool uses CPU when the user specify processor type to be CPU or not specify anything
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


def read_file(path):
    global IS_ONLINE_LAYER
    data_type = arcpy.Describe(path).dataType
    catalog_path = arcpy.Describe(path).catalogPath
    sdf = None
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
                table_data = []
                oid_name = arcpy.Describe(path).OIDFieldName
                oid_list = []
                with arcpy.da.SearchCursor(
                    input_feature, [oid_name, text_column]
                ) as cursor:
                    for row in cursor:
                        table_data.append(row[1])
                        oid_list.append(row[0])
            else:
                arcpy.AddIDMessage("ERROR", 260013)
                exit()
        except RuntimeError as e:
            if "Cannot find field" in str(e):
                arcpy.AddIDMessage("ERROR", 1486)
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
    return data_type, table_data, oid_list


def validate_arguments():
    global model_definition
    emd_path = _get_emd_path(model_definition)
    with open(emd_path) as f:
        emd = json.load(f)
    model_type = emd.get("ModelName", "SequenceToSequence")
    inference_func_flag = emd.get("InferenceFunction", None)
    if not inference_func_flag:
        if model_type != "SequenceToSequence":
            arcpy.AddIDMessage("ERROR", 260064)
            exit()
    return emd


def predict(model, text_list, batch_size):
    predictions = []
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    num = LOCALE.format_string("%d", len(text_list))
    arcpy.AddIDMessage("INFORMATIVE", 260043, str(num))
    for i in range(0, len(text_list), batch_size):
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        item_list = text_list[i : i + batch_size]
        results = model.predict(
            item_list,
            batch_size=batch_size,
            show_progress=False,
            min_length=min_length,
            max_length=max_length,
        )
        predictions.extend([x[1].strip() for x in results])
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260040))
    arcpy.SetProgressorPosition(100)
    return predictions


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


def predict_extension(model, text_list, batch_size, oid_list):
    arg_dict = {}
    arguments = arcpy.GetParameter(4)
    for arg_index in range(arcpy.GetParameter(4).rowCount):
        arg_pair = arguments.getRow(arg_index).split("'")
        for each in arg_pair:
            if not each.strip():
                arg_pair.remove(each)
        key, val = [x.replace("'", "") for x in arg_pair]
        arg_dict[key] = val

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
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    num = LOCALE.format_string("%d", len(text_list))
    arcpy.AddIDMessage("INFORMATIVE", 260043, str(num))

    for i in range(0, len(text_list), batch_size):
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        item_list = text_list[i : i + batch_size]
        results = model.predict(
            item_list,
            batch_size=batch_size,
            show_progress=False,
            min_length=10,
            max_length=512,
            input_field=text_column,
        )
        predictions.append(results)
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
    predictions = featureset_merge(predictions, text_list, oid_list)
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260040))
    arcpy.SetProgressorPosition(100)
    return predictions


def run_inference():
    try:
        if not HAS_DEPS:
            _raise_conda_import_error()
        model = None
        dsc_in = None
        set_device_params()
        global model_definition
        if model_definition.endswith(".dlpk_remote"):
            desc = arcpy.env.workspace
            item_id = os.path.basename(model_definition).split(".")[0]
            gis = GIS("home")
            online_model = gis.content.get(item_id)
            filepath = os.path.join(desc, online_model.name)
            model_definition = filepath
        emd = validate_arguments()
        IS_INFERENCE_FUNCTION = False
        if "InferenceFunction" in emd:
            IS_INFERENCE_FUNCTION = True
        arcpy.AddIDMessage("INFORMATIVE", 260038, str(input_feature))
        dsc_in = arcpy.Describe(input_feature)
        inFields = [field.name.lower() for field in dsc_in.Fields]

        if not IS_INFERENCE_FUNCTION:
            if output_field.lower() in inFields:
                arcpy.AddIDMessage("WARNING", 260003, str(output_field))
                try:
                    arcpy.management.DeleteField(input_feature, output_field)
                except:
                    arcpy.AddIDMessage("ERROR", 499)
                    exit()
                    return
            try:
                arcpy.management.AddField(input_feature, output_field, "TEXT")
            except:
                arcpy.AddIDMessage("ERROR", 499)
                exit()
                return
        try:
            data_type, table_data, oid_list = read_file(dsc_in.catalogPath)
        except Exception as e:
            raise CustomCancelException(e)
            exit()

        arcpy.AddIDMessage("INFORMATIVE", 260039)
        try:
            if IS_INFERENCE_FUNCTION:
                try:
                    model_kwargs = {"device": arcpy.env.processorType}
                    model = SequenceToSequence.from_model(
                        model_definition, **model_kwargs
                    )
                except:
                    arcpy.AddIDMessage("ERROR", 260341, "loading")
                    exit()
            else:
                model = SequenceToSequence.from_model(model_definition)
        except Exception as e:
            if "Mistral model is not installed" in str(e):
                arcpy.AddIDMessage("ERROR", 260333)
                exit()
            else:
                arcpy.AddIDMessage("ERROR", 260165)
                exit()
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        # text_list = getattr(data_frame, text_column).values.tolist()
        text_list = table_data
        if not IS_INFERENCE_FUNCTION:
            predictions = predict(model, text_list, batch_size)
        else:
            try:
                predictions = predict_extension(model, text_list, batch_size, oid_list)
            except:
                arcpy.AddIDMessage("ERROR", 260341, "performing inference")
                exit()
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
            arcpy.SetProgressor("step", arcpy.GetIDMessage(260139))
            total_rows = int(arcpy.GetCount_management(input_feature)[0])
            counter = 1
            try:
                with arcpy.da.UpdateCursor(
                    input_feature, [text_column, output_field]
                ) as ucur:
                    for i, row in enumerate(ucur):
                        if arcpy.env.isCancelled:
                            arcpy.AddIDMessage("ERROR", 571)
                            exit()
                        try:
                            row[1] = predictions[i]
                            ucur.updateRow(row)
                        except:
                            row[1] = row[0]
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
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(260140))
            arcpy.SetParameterAsText(8, input_feature)
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
