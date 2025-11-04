try:
    import glob, os, json
    from pathlib import Path
    from zipfile import ZipFile
    import tempfile
    from fastai.data_block import get_files
    import arcpy

    HAS_DEPS = True
except:
    HAS_DEPS = False


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


class ToolValidator:
    # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # set self.params for use in other function
        self.default_backbones = [
            "bert-base-cased",
            "roberta-base",
            "albert-base-v1",
            "xlnet-base-cased",
            "xlm-roberta-base",
            "distilroberta-base",
            "distilbert-base-cased",
            "mistral",
        ]
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties.
        # This gets called when the tool is opened.
        # self.params[12].value = ""
        self.params[5].filter.list = self.default_backbones
        self.params[13].controlCLSID = "{E5456E51-0C41-4797-9EE4-5269820C6F0E}"
        return

    def updateParameters(self):
        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before
        # standard validation.

        if self.params[0].value and not self.params[0].hasBeenValidated:
            filepath = str(self.params[0].value)
            desc = arcpy.Describe(filepath)
            if desc.dataType in ["Folder"]:
                self.params[12].enabled = False
            else:
                self.params[12].enabled = True
                df = arcpy.ListFields(filepath, field_type="String")
                self.params[12].value = str(df[0].name)

        if self.params[2].value:
            model = self.params[2].valueAsText
            model = _get_emd_path(model)
            try:
                with open(model, "r") as f:
                    json_info = json.load(f)
            except FileNotFoundError:
                try:
                    json_info = json.loads(model)
                except json.decoder.JSONDecodeError:
                    pass

            model_name = json_info["ModelName"]
            if model_name == "_SpacyEntityRecognizer":
                pretrained_model = "spacy"
            else:
                pretrained_model = json_info["PretrainedModel"]
            self.params[5].value = pretrained_model
            self.params[5].filter.list = [pretrained_model]
            self.params[5].enabled = False
            if pretrained_model =="mistral":
                if not self.params[2].hasBeenValidated:
                    self.params[13].value = json_info.get("prompt", arcpy.GetIDMessage(260335))
                    self.params[9].value = 50
        else:
            self.params[5].enabled = True
            if self.params[5].value:
                if self.params[5].value not in self.default_backbones:
                    self.default_backbones.append(self.params[5].value)
                    self.params[5].filter.list = self.default_backbones
                else:
                    self.params[5].filter.list = self.default_backbones

            if self.params[5].value in ["mistral"]:
                if not self.params[5].hasBeenValidated:
                    self.params[13].value = arcpy.GetIDMessage(260335)
                    self.params[9].value = 50

        if self.params[5].value in ["mistral"]:
            # self.params[2].enabled = True
            self.params[4].enabled = False
            self.params[6].enabled = True
            self.params[7].enabled = False
            self.params[8].enabled = False
            self.params[10].enabled = False
            self.params[11].enabled = False
            self.params[13].enabled = True
        else:
            # self.params[2].enabled = True
            self.params[4].enabled = True
            self.params[6].enabled = True
            self.params[7].enabled = True
            self.params[8].enabled = True
            self.params[10].enabled = True
            self.params[11].enabled = True
            self.params[13].enabled = False

        if self.params[5].value in [
            "bert-base-cased",
            "roberta-base",
            "albert-base-v1",
            "xlnet-base-cased",
            "xlm-roberta-base",
            "distilroberta-base",
            "distilbert-base-cased",
        ]:
            if not self.params[5].hasBeenValidated:
                self.params[7].value = [["sequence_length", 512]]
                self.params[9].value = 10
        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        if self.params[0].value:
            filepath = str(self.params[0].value)
            desc = arcpy.Describe(filepath)
            # TableView, FeatureLayer
            if desc.dataType in [
                "TableView",
                "Table",
                "TableView",
                "Table",
                "FeatureLayer",
                "FeatureClass",
            ]:
                pass
            elif desc.dataType in ["Folder"]:
                is_csv = glob.glob(os.path.join(filepath, "*.csv"))
                is_json = glob.glob(os.path.join(filepath, "*.json"))
                if len(is_json) > 0:
                    pass
                elif len(is_csv) > 1:
                    is_tag = os.path.isfile(os.path.join(filepath, "tags.csv"))
                    is_token = os.path.isfile(os.path.join(filepath, "tokens.csv"))
                    if is_tag and is_token:
                        pass
                    else:
                        self.params[0].setIDMessage("ERROR", 260014)
                else:
                    self.params[0].setIDMessage("ERROR", 260014)
            else:
                self.params[0].setIDMessage("ERROR", 260014)

        if self.params[2].value:
            if not HAS_DEPS:
                self.params[2].setIDMessage("ERROR", 260005)
            model = self.params[2].valueAsText
            model = _get_emd_path(model)
            try:
                with open(model, "r") as f:
                    json_info = json.load(f)
                    model_name = json_info["ModelName"]
                    if model_name not in [
                        "TransformerEntityRecognizer",
                        "_TransformerEntityRecognizer",
                        "_LlmEntityRecognizer",
                    ]:
                        self.params[2].setIDMessage("ERROR", 260050)

            except json.decoder.JSONDecodeError:
                self.params[2].setIDMessage("ERROR", 260022)
            except:
                pass

            if json_info.get("PretrainedModel", None) in ["mistral"]:
                if self.params[2].value:
                    self.params[2].setIDMessage("ERROR", 260345)

        if self.params[7].altered:
            supported_kwargs = ["sequence_length"]
            all_args = list(self.params[7].value)
            flag = True
            for arg in all_args:
                if not arg[0] in supported_kwargs:
                    self.params[7].setIDMessage("ERROR", 260157)
                if arg[0] == "sequence_length":
                    try:
                        if int(arg[1]) <= 0:
                            flag = False
                    except ValueError:
                        flag = False

            if not flag:
                self.params[7].setIDMessage("ERROR", 260157)

        if self.params[9].altered:
            validation_percentage = float(self.params[9].value)
            if self.params[5].value not in ["mistral"]:
                if (validation_percentage < 10) or (validation_percentage > 50):
                    self.params[9].setIDMessage("ERROR", 260124)
            else:
                if (validation_percentage < 50) or (validation_percentage > 90):
                    self.params[10].setIDMessage("ERROR", 260334)

        if self.params[6].altered:
            b_size = int(self.params[6].value)
            if b_size < 1:
                self.params[6].setIDMessage("ERROR", 260161)

        if self.params[4].altered:
            m_epochs = int(self.params[4].value)
            if m_epochs < 1:
                self.params[4].setIDMessage("ERROR", 260163)

        return

    # def isLicensed(self):
    # if arcpy.ProductInfo() != "ArcInfo":
    # arcpy.AddIDMessage("ERROR", 180002)
    # return True
