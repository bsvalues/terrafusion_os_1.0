try:
    import json
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
        self.params[6].filter.list = self.default_backbones
        self.params[15].controlCLSID = "{E5456E51-0C41-4797-9EE4-5269820C6F0E}"
        return

    def updateParameters(self):
        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before
        # standard validation.

        if self.params[4].value:
            model = self.params[4].valueAsText
            model = _get_emd_path(model)
            try:
                with open(model, "r") as f:
                    json_info = json.load(f)
            except FileNotFoundError:
                try:
                    json_info = json.loads(model)
                except json.decoder.JSONDecodeError:
                    pass

            pretrained_model = json_info["PretrainedModel"]
            self.params[6].value = pretrained_model
            self.params[6].filter.list = [pretrained_model]
            self.params[6].enabled = False
            if pretrained_model =="mistral":
                if not self.params[4].hasBeenValidated:
                    self.params[15].value = json_info.get("prompt", arcpy.GetIDMessage(260336))
                    self.params[10].value = 50
        else:
            self.params[6].enabled = True
            if self.params[6].value:
                if self.params[6].value not in self.default_backbones:
                    self.default_backbones.append(self.params[6].value)
                    self.params[6].filter.list = self.default_backbones
                else:
                    self.params[6].filter.list = self.default_backbones
            
            if self.params[6].value in ["mistral"]:
                if not self.params[6].hasBeenValidated:
                    self.params[15].value = arcpy.GetIDMessage(260336)
                    self.params[10].value = 50

        if self.params[6].value in ["mistral"]:
            # self.params[4].enabled = False
            self.params[5].enabled = False
            self.params[7].enabled = False
            self.params[9].enabled = False
            self.params[11].enabled = False
            self.params[12].enabled = False
            self.params[15].enabled = True
            self.params[8].enabled = False
        else:
            # self.params[4].enabled = True
            self.params[5].enabled = True
            self.params[7].enabled = True
            self.params[9].enabled = True
            self.params[11].enabled = True
            self.params[12].enabled = True
            self.params[15].enabled = False
            self.params[8].enabled = True

        

        if self.params[6].value in [
            "bert-base-cased",
            "roberta-base",
            "albert-base-v1",
            "xlnet-base-cased",
            "xlm-roberta-base",
            "distilroberta-base",
            "distilbert-base-cased",
        ]:
            if not self.params[6].hasBeenValidated:
                self.params[8].value = [["sequence_length", 512]]
                self.params[10].value = 10

        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        if self.params[4].value:
            if not HAS_DEPS:
                self.params[4].setIDMessage("ERROR", 260005)
            model = self.params[4].valueAsText
            model = _get_emd_path(model)
            try:
                with open(model, "r") as f:
                    json_info = json.load(f)
                    model_name = json_info["ModelName"]
                    if model_name not in ["TextClassifier"]:
                        self.params[4].setIDMessage("ERROR", 260059)
            except json.decoder.JSONDecodeError:
                self.params[4].setIDMessage("ERROR", 260022)
            except:
                pass

            if json_info.get("PretrainedModel", None) in ["mistral"]:
                if self.params[4].value:
                    self.params[4].setIDMessage("ERROR", 260345)

        if self.params[2].value and self.params[6].value in ["mistral"]:
            if self.params[2].value.rowCount > 1:
                self.params[2].setIDMessage("ERROR", 260346)

        if self.params[1].value:
            col1 = self.params[1].valueAsText
            col2 = self.params[2].valueAsText
            if col1 == col2:
                self.params[1].setIDMessage("ERROR", 260155)

        if self.params[2].value:
            col1 = self.params[1].valueAsText
            col2 = self.params[2].valueAsText
            if col1 == col2:
                self.params[2].setIDMessage("ERROR", 260155)

        if self.params[0].altered:
            if self.params[6].value not in ["mistral"]:
                try:
                    count = arcpy.GetCount_management(self.params[0].valueAsText)[0]
                    if int(count) <= 100:
                        self.params[0].setIDMessage("ERROR", 260147)
                except:
                    pass
            else:
                try:
                    count = arcpy.GetCount_management(self.params[0].valueAsText)[0]
                    if int(count) <= 20:
                        self.params[0].setIDMessage("ERROR", 260147)
                except:
                    pass

        if self.params[8].altered:
            supported_kwargs = ["sequence_length"]
            all_args = list(self.params[8].value)
            flag = True
            for arg in all_args:
                if not arg[0] in supported_kwargs:
                    self.params[8].setIDMessage("ERROR", 260157)
                if arg[0] == "sequence_length":
                    try:
                        if int(arg[1]) <= 0:
                            flag = False
                    except ValueError:
                        flag = False

            if not flag:
                self.params[8].setIDMessage("ERROR", 260157)

        if self.params[10].altered:
            validation_percentage = float(self.params[10].value)
            if self.params[6].value not in ["mistral"]:
                if (validation_percentage < 10) or (validation_percentage > 50):
                    self.params[10].setIDMessage("ERROR", 260124)
            else:
                if (validation_percentage < 50) or (validation_percentage > 90):
                    self.params[10].setIDMessage("ERROR", 260334)

        if self.params[7].altered:
            b_size = int(self.params[7].value)
            if b_size < 1:
                self.params[7].setIDMessage("ERROR", 260161)

        if self.params[5].altered:
            m_epochs = int(self.params[5].value)
            if m_epochs < 1:
                self.params[5].setIDMessage("ERROR", 260163)

        return

    # def isLicensed(self):
    # if arcpy.ProductInfo() != "ArcInfo":
    # arcpy.AddIDMessage("ERROR", 180002)
    # return True
