try:
    import os
    import json
    import locale as LOCALE

    LOCALE.setlocale(LOCALE.LC_ALL, "")
    from zipfile import ZipFile
    from pathlib import Path
    import tempfile, os
    from arcgis import GIS
    from fastai.data_block import get_files
    from arcgis.features import FeatureSet
    from pathlib import Path
    from typing import Dict
    from arcgis.learn.text import TextClassifier
    from importlib.util import spec_from_loader, module_from_spec
    from importlib.machinery import SourceFileLoader
    import arcpy

    HAS_DEPS = True
except:
    HAS_DEPS = False


def _get_inference_function_details(emd: dict, emd_path: str | Path):
    """
    This can act as helper function to check whether the inference function is dependent on the inference function or no.
    If it is dependent then the caller module can call it.
    """
    inference_function = emd.get("InferenceFunction", None)
    # generate full path for inference function. Since it will load from Resource folder so commenting this out

    inference_function_full_path = ""
    # generate full path for inference function
    base_path = os.path.dirname(emd_path)
    if inference_function:
        inference_function_full_path = os.path.join(base_path, inference_function)

    return inference_function, inference_function_full_path


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


def _get_hosted_dlpk(model):
    try:
        desc = arcpy.env.workspace
        model_definition = model
        item_id = os.path.basename(model_definition).split(".")[0]
        gis = GIS("home")
        online_model = gis.content.get(item_id)
        path = os.path.join(desc, online_model.name)
        if not os.path.isfile(path):
            online_model.download(save_path=desc, file_name=online_model.name)

        return True, model_definition
    except Exception as e:
        return False, e


def _decide_path_dlpk(json_obj: Dict) -> bool:
    install_dir = Path(arcpy.GetInstallInfo()["InstallDir"])
    # form the resource dir
    resource_folder = install_dir / r"Resources\ArcToolBox\Scripts"
    return arcpy.Exists(resource_folder / json_obj["InferenceFunction"])


def isReadOnly(input):
    formatReadOnly = [".CSV", ".SHP"]
    isContained = False
    path = input
    try:
        d = arcpy.Describe(input)
        path = d.CatalogPath.upper()
        for ext in formatReadOnly:
            if ext in path:
                isContained = True
                break

        if (
            d.dataType in ["FeatureLayer", "TableView", "FeatureClass"]
            and ".NC" in path
        ):
            isContained = True
    except:
        pass
    return isContained


def _loader(inference_function_full_path):
    is_valid = False
    check_load_flag = True
    try:
        load_class_name = os.path.basename(inference_function_full_path).split(".")[0]
        spec = spec_from_loader(
            load_class_name,
            SourceFileLoader(load_class_name, inference_function_full_path),
        )
        loaded_model = module_from_spec(spec)
        spec.loader.exec_module(loaded_model)
        loaded_model = getattr(loaded_model, load_class_name)
    except FileNotFoundError:
        check_load_flag = False

    if check_load_flag:
        # validate all the functions
        required_functions = [
            "getParameterInfo",
            "initialize",
            "getConfiguration",
            "predict",
        ]
        check_function_list = []
        for i in required_functions:
            check_function_list.append(hasattr(loaded_model, i))

        if len(check_function_list) == 4:
            is_valid = all(check_function_list)

    return loaded_model, is_valid, check_load_flag


class ToolValidator:
    # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # set self.params for use in other function
        self.default_values = [["candidate_labels", "positive,negative"]]
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties.
        # This gets called when the tool is opened.
        self.params[1].parameterDependencies = [0]
        return

    def updateParameters(self):
        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before
        # standard validation.
        params = []

        if self.params[2].altered and os.path.exists(self.params[2].valueAsText):
            model = self.params[2].valueAsText
            if model.endswith(".dlpk_remote"):
                pass
            else:
                model = _get_emd_path(model)
                try:
                    with open(model, "r") as f:
                        json_info = json.load(f)
                except FileNotFoundError:
                    try:
                        json_info = json.loads(model)
                    except json.decoder.JSONDecodeError:
                        pass

                model_name = json_info.get("ModelName", "TextClassifier")
                model_type = json_info.get("ModelType", None)

                if model_type in ["llm"]:
                    self.params[6].enabled = False
                    self.params[4].enabled = False
                else:
                    self.params[6].enabled = True
                    self.params[4].enabled = True

                if model_name in ["ZeroShotClassifier", "TextClassifier"]:
                    if model_name == "ZeroShotClassifier":
                        self.params[4].value = self.default_values
                        return
                    inference_function, inference_function_full_path = (
                        _get_inference_function_details(json_info, model)
                    )
                    if inference_function:
                        self.params[6].enabled = False
                        stored_value_dict = {}
                        if self.params[4].value:
                            for k, v in self.params[4].value:
                                stored_value_dict[k] = v

                        self.params[4].value = []
                        loaded_model, valid, check_load_flag = _loader(
                            inference_function_full_path
                        )

                        if valid:
                            loaded_model = loaded_model(**json_info)
                            # Add the parameters to the table
                            params = loaded_model.getParameterInfo()
                            temp_dict = {}
                            for i in params:
                                if i["name"] in stored_value_dict:
                                    temp_dict[i["name"]] = stored_value_dict[i["name"]]
                                else:
                                    temp_dict[i["name"]] = str(i.get("value", ""))

                            for k, v in temp_dict.items():
                                if not self.params[4].value:
                                    self.params[4].value = [[k, v]]
                                else:
                                    self.params[4].value += [[k, v]]

                    else:
                        self.params[3].enabled = True
                        is_multilabel_problem = json_info[
                            "IsMultilabelClassificationProblem"
                        ]

                        if (
                            is_multilabel_problem
                            and not self.params[4].altered
                            and model_type != "llm"
                        ):
                            self.params[4].value = [
                                ["sequence_length", "512"],
                                ["confidence_threshold", json_info["Threshold"]],
                            ]
                            params.append(
                                [
                                    "multi_label_classification",
                                    str(is_multilabel_problem),
                                ]
                            )
                            params.append(["threshold", json_info["Threshold"]])
                        elif (
                            not is_multilabel_problem
                            and not self.params[4].altered
                            and model_type != "llm"
                        ):
                            self.params[4].value = [["sequence_length", "512"]]
                        elif (
                            is_multilabel_problem
                            and self.params[4].altered
                            and model_type != "llm"
                        ):
                            len_param_4 = list(self.params[4].value)
                            if len(len_param_4) > 1:
                                self.params[4].value = [
                                    ["sequence_length", self.params[4].value[0][1]],
                                    [
                                        "confidence_threshold",
                                        self.params[4].value[1][1],
                                    ],
                                ]
                            else:
                                self.params[4].value = [
                                    ["sequence_length", "512"],
                                    ["confidence_threshold", json_info["Threshold"]],
                                ]
                        elif (
                            not is_multilabel_problem
                            and self.params[4].altered
                            and model_type != "llm"
                        ):
                            try:
                                val = int(self.params[4].value[0][1])
                            except:
                                val = 512

                            self.params[4].value = [["sequence_length", val]]

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        inference_function = None
        self.params[0].setIDMessage("WARNING", 230001, arcpy.GetIDMessage(260131))
        if self.params[0].value:
            file = self.params[0].valueAsText
            if isReadOnly(file):
                self.params[0].setIDMessage("ERROR", 499)

        if self.params[2].altered:
            model = self.params[2].valueAsText
            if not HAS_DEPS:
                self.params[2].setIDMessage("ERROR", 260005)
            if model.endswith(".dlpk_remote"):
                success, model = _get_hosted_dlpk(model)
                if not success:
                    self.params[2].setIDMessage(
                        "ERROR",
                        732,
                        self.params[2].displayName,
                        self.params[2].valueAsText,
                    )
            else:
                model = _get_emd_path(model)
                try:
                    with open(model, "r") as f:
                        json_info = json.load(f)
                    # Add a check for inference function.
                    inference_function, inference_function_full_path = (
                        _get_inference_function_details(json_info, model)
                    )
                    if inference_function:
                        # Check whether other mandatory keys are present or not
                        mandatory_keys = ["ModelType", "OutputField"]
                        if not all(
                            [True if i in json_info else False for i in mandatory_keys]
                        ):
                            self.params[2].setIDMessage("ERROR", 260343)
                            exit()

                        if json_info["ModelType"] != "TextClassifier":
                            self.params[2].setIDMessage("ERROR", 260343)
                            exit()

                        if not _decide_path_dlpk(json_info):
                            self.params[2].setIDMessage("WARNING", 260338)

                        loaded_model, valid, check_load_flag = _loader(
                            inference_function_full_path
                        )

                        if not check_load_flag:
                            self.params[2].setIDMessage("ERROR", 260342)
                            exit()

                        if not valid:
                            self.params[4].setIDMessage("ERROR", 260339)
                    else:
                        model_name = json_info.get("ModelName", "TextClassifier")
                        if model_name not in ["ZeroShotClassifier", "TextClassifier"]:
                            self.params[2].setIDMessage("ERROR", 260042)

                except json.decoder.JSONDecodeError:
                    self.params[2].setIDMessage("ERROR", 260022)
                except:
                    pass

        if self.params[2].altered:
            if os.path.exists(self.params[2].valueAsText):
                model = self.params[2].valueAsText
                if model.endswith(".dlpk_remote"):
                    pass
                else:
                    model = _get_emd_path(model)
                    try:
                        with open(model, "r") as f:
                            json_info = json.load(f)
                    except FileNotFoundError:
                        try:
                            json_info = json.loads(model)
                        except json.decoder.JSONDecodeError:
                            pass

                    model_name = json_info.get("ModelName", "TextClassifier")
                    if model_name in ["ZeroShotClassifier", "TextClassifier"]:
                        if model_name == "ZeroShotClassifier":
                            self.params[4].value = self.default_values
                            return
                        inference_function, inference_function_full_path = (
                            _get_inference_function_details(json_info, model)
                        )

        if self.params[4].altered and (inference_function is None):
            supported_kwargs = ["sequence_length", "confidence_threshold"]
            all_args = list(self.params[4].value)
            flag = True
            for arg in all_args:
                if not arg[0] in supported_kwargs:
                    self.params[4].setIDMessage("ERROR", 260302)
                if arg[0] == "sequence_length":
                    try:
                        if int(arg[1]) <= 0:
                            flag = False
                    except ValueError:
                        flag = False
                if arg[0] == "confidence_threshold":
                    try:
                        if (
                            float(LOCALE.atof(arg[1])) <= 0
                            or float(LOCALE.atof(arg[1])) >= 1
                        ):
                            flag = False
                    except ValueError:
                        flag = False

            if not flag:
                self.params[4].setIDMessage("ERROR", 260302)

        if self.params[3].altered:
            col_name = str(self.params[3].value)
            if col_name[0].isdigit():
                self.params[3].setIDMessage("ERROR", 310)

        if self.params[7].altered:
            batch_size = int(self.params[7].value)
            if batch_size < 1:
                self.params[7].setIDMessage("ERROR", 260161)
        return

    # def isLicensed(self):
    # if arcpy.ProductInfo() != "ArcInfo":
    # arcpy.AddIDMessage("ERROR", 180002)
    # return True
