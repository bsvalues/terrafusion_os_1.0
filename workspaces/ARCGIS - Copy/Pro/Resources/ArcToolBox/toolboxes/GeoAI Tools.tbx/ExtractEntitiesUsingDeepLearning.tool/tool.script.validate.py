try:
    import os
    import json
    from pathlib import Path
    from zipfile import ZipFile
    import tempfile, os
    from arcgis import GIS
    from fastai.data_block import get_files
    from pathlib import Path
    from typing import Dict
    import arcpy
    from importlib.util import spec_from_loader, module_from_spec
    from importlib.machinery import SourceFileLoader

    HAS_DEPS = True
except:
    HAS_DEPS = False


def _decide_path_dlpk(json_obj: Dict) -> bool:
    install_dir = Path(arcpy.GetInstallInfo()["InstallDir"])
    # form the resource dir
    resource_folder = install_dir / r"Resources\ArcToolBox\Scripts"
    return arcpy.Exists(resource_folder / json_obj["InferenceFunction"])


def _get_inference_function_details(emd: Dict, emd_path: str | Path):
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


def _temp_dlpk(dlpk_path):
    with ZipFile(dlpk_path, "r") as zip_obj:
        temp_dir = tempfile.TemporaryDirectory().name
        zip_obj.extractall(temp_dir)
    return temp_dir


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
        if self.params[0].value and not self.params[0].hasBeenValidated:
            filepath = str(self.params[0].value)
            desc = arcpy.Describe(filepath)
            if desc.dataType in ["Folder"]:
                self.params[7].enabled = False
            else:
                self.params[7].enabled = True
                df = arcpy.ListFields(filepath, field_type="String")
                self.params[7].value = str(df[0].name)

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
                model_type = json_info.get("ModelType", None)
                self.params[3].enabled = True
                if model_type in ["llm"]:
                    self.params[3].enabled = False
                inference_function, inference_function_full_path = (
                    _get_inference_function_details(json_info, model)
                )

                if inference_function:
                    if not self.params[2].hasBeenValidated:
                        # Do the shallow loading
                        loaded_model, valid, check_load_flag = _loader(
                            inference_function_full_path,
                        )
                        if valid:
                            loaded_model = loaded_model(**json_info)
                            # Add the parameters to the table
                            params = loaded_model.getParameterInfo()
                            # convert it to dict to preserve the updated value
                            temp_dict = {}
                            for i in params:
                                temp_dict[i["name"]] = i.get("value", "")

                            self.params[3].value = []
                            for k, v in temp_dict.items():
                                if not self.params[3].value:
                                    self.params[3].value = [[k, v]]
                                else:
                                    self.params[3].value += [[k, v]]
        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        IS_INFERENCE = False
        if self.params[0].value:
            filepath = str(self.params[0].value)
            desc = arcpy.Describe(filepath)
            if desc.dataType not in [
                "TableView",
                "Table",
                "Folder",
                "FeatureLayer",
                "FeatureClass",
            ]:
                self.params[0].setIDMessage("ERROR", 260014)

        if self.params[1].value:
            file = self.params[1].valueAsText
            if ".gdb" not in file:
                self.params[1].setIDMessage("ERROR", 260141)

        if self.params[2].value:
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
                        model_name = json_info.get("ModelName", None)
                        # Add a check for inference function.
                        inference_function, inference_function_full_path = (
                            _get_inference_function_details(json_info, model)
                        )
                        if inference_function:
                            if not _decide_path_dlpk(json_info):
                                IS_INFERENCE = True
                                self.params[2].setIDMessage("WARNING", 260338)
                            loaded_model, valid, check_load_flag = _loader(
                                inference_function_full_path
                            )

                            if not check_load_flag:
                                self.params[2].setIDMessage("ERROR", 260342)
                                exit()

                            if not valid:
                                self.params[4].setIDMessage("ERROR", 260339)
                                exit()

                        elif model_name not in [
                            "TransformerEntityRecognizer",
                            "_TransformerEntityRecognizer",
                            "_LlmEntityRecognizer",
                        ]:
                            self.params[2].setIDMessage("ERROR", 260050)
                except json.decoder.JSONDecodeError:
                    self.params[2].setIDMessage("ERROR", 260022)
                except:
                    pass
        if self.params[3].altered and not IS_INFERENCE:
            supported_kwargs = ["sequence_length"]
            all_args = list(self.params[3].value)
            flag = True
            for arg in all_args:
                if not arg[0] in supported_kwargs:
                    self.params[3].setIDMessage("ERROR", 260157)
                if arg[0] == "sequence_length":
                    try:
                        if int(arg[1]) <= 0:
                            flag = False
                    except ValueError:
                        flag = False

            if not flag:
                self.params[3].setIDMessage("ERROR", 260157)

        if self.params[4].altered:
            b_size = int(self.params[4].value)
            if b_size < 1:
                self.params[4].setIDMessage("ERROR", 260161)

        return

    # def isLicensed(self):
    # if arcpy.ProductInfo() != "ArcInfo":
    # arcpy.AddIDMessage("ERROR", 180002)
    # return True
