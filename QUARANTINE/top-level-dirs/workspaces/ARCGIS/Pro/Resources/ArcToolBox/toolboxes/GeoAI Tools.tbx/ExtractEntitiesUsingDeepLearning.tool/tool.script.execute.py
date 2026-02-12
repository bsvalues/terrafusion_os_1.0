"""-------------------------------------------------------------------------
    Tool:               Extract Entities Using Deep Learning (GeoAI Tools)
    Source Name:        extractEntitiesUsingDeepLearning.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Input Folder
                        Output Feature Class
                        Model Definition
    Optional Arguments: Model Arguments
                        Batch Size
                        Location Zone
                        Locator
    Description:        Extract entities and locations (such as
                        addresses, place or person names, dates,
                        amounts of money, etc.) from text documents.
------------------------------------------------------------------------"""

# Import system modules
try:
    import os
    import sys
    import copy
    import json
    import torch, gc
    import arcpy
    import arcgis
    import random
    import string
    import numpy as np
    import pandas as pd
    from pathlib import Path
    from arcgis.features import FeatureSet
    from arcgis.learn.text import EntityRecognizer
    from arcgis.learn._utils.common import _get_emd_path
    import re
    import locale as LOCALE
    from collections import Counter

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


class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""

    pass


arcpy.env.overwriteOutput = True

# Define input parameters
input_folder = arcpy.GetParameterAsText(0)
output_feature_class = arcpy.GetParameterAsText(1)
model_definition = arcpy.GetParameterAsText(2)
arguments = arcpy.GetParameter(3)
batch_size = int(arcpy.GetParameterAsText(4))
address_suffix = arcpy.GetParameterAsText(5)
locator = arcpy.GetParameterAsText(6)
text_column = arcpy.GetParameterAsText(7)


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


def validate_arguments(model_definition):
    desc = arcpy.Describe(input_folder)
    if desc.dataType in ["Folder"]:
        if not (os.path.exists(input_folder) and os.path.isdir(input_folder)):
            arcpy.AddIDMessage("ERROR", 260009, str(input_folder))
            exit()
    else:
        if text_column == "":
            arcpy.AddIDMessage("ERROR", 728, "''")
            exit()
        if desc.dataType in [
            "TableView",
            "TextFile",
            "Table",
            "ShapeFile",
            "FeatureLayer",
            "FeatureClass",
        ]:
            pass
        else:
            arcpy.AddIDMessage("ERROR", 260014)
            exit()
    emd_path = _get_emd_path(model_definition)
    with open(emd_path) as f:
        emd = json.load(f)
    if "AddressTag" in emd and len(emd["AddressTag"]) != 0:
        address_tag = emd["AddressTag"]
    elif "address_tag" in emd and len(emd["address_tag"]) != 0:
        address_tag = emd["address_tag"]
    else:
        address_tag = None
    model_type = emd.get("ModelName", "TransformerEntityRecognizer")
    if emd["ModelType"] != "Transformer":
        model_type = "llm"
    if model_type == "llm" and address_tag is not None:
        address_tag = address_tag.lower()
    return address_tag, model_type, emd


def featureset_merge(list_of_featureset, input_features_len):
    # Fetch the first feature set to extract the fields
    temp_fields = list_of_featureset[0].fields
    temp_fields = [
        i
        for i in temp_fields
        if i["name"] != list_of_featureset[0]._object_id_field_name
    ]
    temp_geom = list_of_featureset[0].geometry_type
    temp_features = []
    total_features = 0
    for i in list_of_featureset:
        for feature in i:
            feature = feature.as_dict
            del feature["attributes"][list_of_featureset[0]._object_id_field_name]
            temp_features.append(feature)
            total_features += 1
    if total_features != input_features_len:
        arcpy.AddIDMessage("WARNING", 260340)
    return FeatureSet.from_dict(
        {"geometry": temp_geom, "features": temp_features, "fields": temp_fields}
    )


def get_text_list(file_encoding="utf-8"):
    text_list, file_names = [], []
    desc = arcpy.Describe(input_folder)
    if desc.dataType in ["Folder"]:
        item_names = os.listdir(input_folder)
        for filename in item_names:
            file_path = os.path.join(input_folder, filename)
            ext = os.path.splitext(filename)[-1].lower().replace(".", "")
            if ext == "txt":
                with open(file_path, "r", encoding=file_encoding, errors="ignore") as f:
                    text_list.append(f.read())
                    file_names.append(file_path)
    else:
        if text_column == "":
            arcpy.AddIDMessage("ERROR", 728, "''")
            exit()
        with arcpy.da.SearchCursor(input_folder, text_column) as cursor:
            for row in cursor:
                text_list.append(row[0])
                file_names.append("NA")

    return text_list, file_names


def get_results(model, text_list, batch_size, model_type):
    results, headers = [], []
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    num = LOCALE.format_string("%d", len(text_list))
    arcpy.AddIDMessage("INFORMATIVE", 260043, str(num))
    for i in range(0, len(text_list), batch_size):
        item_list = text_list[i : i + batch_size]
        result = model.extract_entities(item_list, drop=False, batch_size=batch_size)
        if i == 0:
            headers = list(result.columns.values)
        result = result.values.tolist()
        results.extend(result)
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260040))
    arcpy.SetProgressorPosition(100)
    headers = [head.replace(" ", "_") for head in headers]
    result_df = pd.DataFrame(
        results, columns=headers
    )
    if "Filename" in headers:
        headers.remove("Filename")
    if "TEXT" in result_df.columns:
        result_df = result_df[["TEXT"] + sorted(headers) + ["Filename"]]
    else:
        result_df = result_df[["Text"] + sorted(headers) + ["Filename"]]
    return result_df


def get_results_extension(model, text_list, batch_size, file_names):
    # fname_check_number = Counter(file_names).get("NA") > 1 if Counter(file_names).get("NA") > 1 else False
    fname_check_number = False
    arcpy.SetProgressor("step", arcpy.GetIDMessage(260132))
    arg_dict = {}
    for arg_index in range(arcpy.GetParameter(3).rowCount):
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
    geocoding_field = (
        return_config["address_tag"] if return_config.get("address_tag", None) else None
    )
    predictions = []
    for i in range(0, len(text_list), batch_size):
        item_list = text_list[i : i + batch_size]
        if fname_check_number:
            results = model.extract_entities(
                item_list, batch_size=batch_size, input_field="input_str"
            )
        else:
            results = model.extract_entities(
                item_list, batch_size=batch_size, input_field=text_column
            )
        percentage_completed = float(i / len(text_list)) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
        predictions.append(results)
    # Merge the feature set
    results = featureset_merge(predictions, len(text_list))
    return results, geocoding_field


def separate_locations(results_df, location_tag):
    entities_list = []
    column_names = list(results_df.columns.values)
    if location_tag in column_names:
        pass
    elif "LOC" in column_names:
        location_tag = "LOC"
    else:
        arcpy.AddIDMessage("ERROR", 260010, str(column_names))
        exit()
    getattr(results_df, location_tag).fillna("", inplace=True)
    for index, row in results_df.iterrows():
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        location_index = column_names.index(location_tag)
        loc_value = getattr(row, location_tag)
        locations = [x.strip() for x in loc_value.split(",")]
        orig_row = row.tolist()
        for location in locations:
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()
            copy_row = copy.deepcopy(orig_row)
            if location:
                location = (
                    location + f", {address_suffix}" if address_suffix else location
                )
            copy_row[location_index] = location
            entities_list.append(copy_row)
    return pd.DataFrame(entities_list, columns=column_names), location_tag


def format_filenames(file_names, dataframe):
    i, file_column = 0, [file_names[0]]
    df_rows = dataframe["Filename"].values.tolist()
    prev_value = df_rows[0]
    for item in df_rows[1:]:
        if item != prev_value:
            i += 1
        prev_value = item
        file_column.append(file_names[i])
    assert len(file_column) == len(df_rows)
    return file_column


def geocode_locations(csv_file_path, locator, location_column):
    if locator == "":
        return None, False, ""
    address_field = f"'Single Line Input' {location_column} VISIBLE NONE"
    try:
        tables = arcpy.ListTables()
        head, tail = os.path.split(output_feature_class)
        for table in tables:
            if table == tail:
                arcpy.Delete_management(table)
        tmp_table_name = "".join(random.choices(string.ascii_lowercase, k=7))
        tmp_table = os.path.join(head, tmp_table_name)
        csv_file_path = csv_file_path.spatial.to_table(tmp_table)
        return (
            arcpy.geocoding.GeocodeAddresses(
                csv_file_path,
                locator,
                address_field,
                output_feature_class,
                "STATIC",
                None,
                "ADDRESS_LOCATION",
                None,
                "ALL",
            ),
            True,
            tmp_table_name,
        )
    except Exception as e:
        return None, True, ""


def run_inference():
    try:
        if not HAS_DEPS:
            _raise_conda_import_error()
            exit()
        model = None
        set_device_params()
        global model_definition
        if model_definition.endswith(".dlpk_remote"):
            desc = arcpy.env.workspace
            item_id = os.path.basename(model_definition).split(".")[0]
            gis = GIS("home")

            online_model = gis.content.get(item_id)
            filepath = os.path.join(desc, online_model.name)
            model_definition = filepath

        location_tag, model_type, emd = validate_arguments(model_definition)
        IS_INFERENCE_FUNCTION_SUPPORTED = False
        version = emd.get("ArcGISLearnVersion", None)
        if version is not None:
            major_version = int(version.split(".")[0])
            minor_version = int(version.split(".")[1])
            if minor_version >= 4 and major_version >= 2:
                IS_INFERENCE_FUNCTION_SUPPORTED = True

        IS_INFERENCE_FUNCTION = False
        if "InferenceFunction" in emd:
            IS_INFERENCE_FUNCTION = True

        arcpy.AddIDMessage("INFORMATIVE", 260044, str(input_folder))
        text_list, file_names = get_text_list()
        if len(text_list) == 0:
            arcpy.AddIDMessage("ERROR", 260011)
            exit()
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        try:
            if IS_INFERENCE_FUNCTION and IS_INFERENCE_FUNCTION_SUPPORTED:
                try:
                    model_kwargs = {"device": arcpy.env.processorType}
                    model = EntityRecognizer.from_model(
                        model_definition, **model_kwargs
                    )
                except:
                    arcpy.AddIDMessage("ERROR", 260341, "loading")
                    exit()
            else:
                model = EntityRecognizer.from_model(model_definition)
        except Exception as e:
            if "Mistral model is not installed" in str(e):
                arcpy.AddIDMessage("ERROR", 260333)
                exit()
            else:
                arcpy.AddIDMessage("ERROR", 260164)
                exit()

        if not IS_INFERENCE_FUNCTION:
            results_df = get_results(model, text_list, batch_size, model_type)
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()
            if location_tag is None or locator == "":
                arcpy.AddIDMessage("INFORMATIVE", 260045)
                results_df["Filename"] = format_filenames(file_names, results_df)
                results_df.spatial.to_table(output_feature_class)
            else:
                is_geocoded = True
                try:
                    results_df, location_tag = separate_locations(
                        results_df, location_tag
                    )
                except Exception as e:
                    arcpy.AddIDMessage("INFORMATIVE", 260046, str(e))
                    arcpy.AddIDMessage("INFORMATIVE", 260012)
                    is_geocoded = False
                results_df["Filename"] = format_filenames(file_names, results_df)
                try:
                    if is_geocoded:
                        arcpy.AddIDMessage("INFORMATIVE", 260047)

                        resp, flag, tmp_table_name = geocode_locations(
                            results_df, locator, location_tag
                        )
                        if flag:
                            arcpy.Delete_management(tmp_table_name)
                        else:
                            results_df.spatial.to_table(output_feature_class)
                            is_geocoded = False
                except Exception as e:
                    arcpy.AddIDMessage("INFORMATIVE", 260048)
                    arcpy.AddIDMessage("WARNING", 5)
                    is_geocoded = False
                if is_geocoded is False:
                    try:
                        results_df.spatial.to_table(output_feature_class)
                    except Exception as e:
                        arcpy.AddIDMessage("INFORMATIVE", 260041, str(e))
                        arcpy.AddIDMessage("ERROR", 260049)
                        exit()

        else:
            try:
                results_df, location_tag = get_results_extension(
                    model, text_list, batch_size, file_names
                )
            except:
                arcpy.AddIDMessage("ERROR", 260341, "performing inference")
                exit()
            if isinstance(results_df, FeatureSet):
                # This will only be possible in inference function
                gdb_path = Path(arcpy.env.workspace)
                arcpy.Delete_management(output_feature_class)
                if location_tag is None or locator == "":
                    arcpy.AddIDMessage("INFORMATIVE", 260045)
                    out_table = results_df.sdf.spatial.to_table(
                        gdb_path / Path("nn" + str(random.randint(0, sys.maxsize)))
                    )
                    # write the result
                    obj_path = arcpy.management.CopyRows(
                        out_table, output_feature_class
                    )
                    arcpy.Delete_management(out_table)
                    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260140))

                else:
                    is_geocoded = True
                    try:
                        results_df, location_tag = separate_locations(
                            results_df.sdf, location_tag.lower()
                        )
                    except Exception as e:
                        arcpy.AddIDMessage("INFORMATIVE", 260046, str(e))
                        arcpy.AddIDMessage("INFORMATIVE", 260012)
                        is_geocoded = False
                    try:
                        if is_geocoded:
                            arcpy.AddIDMessage("INFORMATIVE", 260047)

                            resp, flag, tmp_table_name = geocode_locations(
                                results_df, locator, location_tag.lower()
                            )
                            if flag:
                                arcpy.Delete_management(tmp_table_name)
                            else:
                                results_df.spatial.to_table(output_feature_class)
                                is_geocoded = False
                    except Exception as e:
                        arcpy.AddIDMessage("INFORMATIVE", 260048)
                        arcpy.AddIDMessage("WARNING", 5)
                        is_geocoded = False

                    if is_geocoded is False:
                        try:
                            if isinstance(results_df, FeatureSet):
                                out_table = results_df.sdf.spatial.to_table(
                                    gdb_path
                                    / Path("nn" + str(random.randint(0, sys.maxsize)))
                                )
                                # write the result
                                obj_path = arcpy.management.CopyRows(
                                    out_table, output_feature_class
                                )
                                arcpy.Delete_management(out_table)
                                arcpy.SetProgressorLabel(arcpy.GetIDMessage(260140))
                            else:
                                results_df.spatial.to_table(output_feature_class)

                        except Exception as e:
                            arcpy.AddIDMessage("INFORMATIVE", 260041, str(e))
                            arcpy.AddIDMessage("ERROR", 260049)
                            exit()
        arcpy.AddIDMessage("INFORMATIVE", 260040)
    except Exception as e:
        if "out of memory" in str(e):
            arcpy.AddIDMessage("ERROR", 260004)
            exit()
        else:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
    finally:
        del model
        gc.collect()
        torch.cuda.empty_cache()


if __name__ == "__main__":
    run_inference()
