try:
    import os, json
    from pathlib import Path
    from zipfile import ZipFile
    import tempfile
    from fastai.data_block import get_files
    import arcpy
    from arcgis import GIS
except:
    pass


def _get_hosted_dlpk(model):
    try:
        desc = arcpy.env.workspace
        model_definition = model
        item_id = os.path.basename(model_definition).split(".")[0]
        gis = GIS(
            "home"
        )
        online_model = gis.content.get(item_id)
        path = os.path.join(desc, online_model.name)
        if not os.path.isfile(path):
            online_model.download(save_path = desc, file_name=online_model.name)
        
        return True, model_definition
    except Exception as e:
        return False, e

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
        self.params = arcpy.GetParameterInfo()
        self.objectDetection = ["PASCAL_VOC_rectangles", "KITTI_rectangles", "RCNN_Masks"]
        self.pixelClassification = ["Classified_Tiles"]
        self.all_supported_models = [
            "DeepLab", "UnetClassifier", "PSPNetClassifier",
            "ANN", "APCNet", "CCNet", "CGNet", "HRNet", 'DeepLabV3Plus', 'DMNet',
            'DNLNet', 'EMANet', 'FastSCNN', 'FCN', 'GCNet', 'MobileNetV2',
            'NonLocalNet', 'OCRNet', 'PSANet', 'SemFPN', 'UperNet',
            "SingleShotDetector", "MaskRCNN", "DETReg", "RetinaNet", "FasterRCNN", "YOLOv3",
            "ATSS", "CARAFE", "CascadeRPN", "CascadeRCNN", "DCN", 
            'DynamicRCNN', 'EmpiricalAttention', 'FCOS', 'FoveaBox', 'FSAF', 'GHM',
            'LibraRCNN', 'PaFPN', 'Res2Net', 'SABL', 'VFNet'
        ]
        # self.selected_networks = []

    def initializeParameters(self):
        # Customize parameter properties. 
        # This gets called when the tool is opened.
            
        return

    def updateParameters(self):
        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before 
        # standard validation.
        self.params[4].enabled = True
        self.params[5].enabled = True
        self.params[6].enabled = True
        
        if self.params[0].value:
            data_path = str(self.params[0].value)
            emd_path = os.path.join(data_path, "esri_model_definition.emd")
            try:
                f = open(emd_path)
                data = json.load(f)
                f.close()
                data_mode = data["MetaDataMode"]
                if data_mode in ["RCNN_Masks"]:
                    self.selected_networks = [
                        "MaskRCNN"]
                elif data_mode in ["PASCAL_VOC_rectangles", "KITTI_rectangles"]:
                    self.selected_networks = [
                        "SingleShotDetector", "RetinaNet", "FasterRCNN", "YOLOv3","DETReg" ,"ATSS",
                        "CARAFE", "CascadeRCNN", "CascadeRPN", "DCN",
                     'DynamicRCNN', 'EmpiricalAttention', 'FCOS', 'FoveaBox',
                        'FSAF', 'GHM', 'LibraRCNN', 'PaFPN', 
                        'Res2Net', 'SABL', 'VFNet']
                elif data_mode in ["Classified_Tiles"]:
                    self.selected_networks = [
                        "DeepLab", "UnetClassifier", "PSPNetClassifier",
                        "ANN", "APCNet", "CCNet", "CGNet", "HRNet", 'DeepLabV3Plus',
                        'DMNet', 'DNLNet', 'FastSCNN', 'FCN', 'GCNet', 'MobileNetV2',
                        'NonLocalNet','OCRNet', 'PSANet', 'SemFPN', 'UperNet']

                if data_mode not in ["PASCAL_VOC_rectangles", "KITTI_rectangles", "Classified_Tiles", "RCNN_Masks"]:
                    self.params[0].setIDMessage("ERROR", 260303)
                    return
                self.params[5].filter.list = self.selected_networks
            except FileNotFoundError:
                self.params[0].setIDMessage("ERROR", 732, "Input Training Data",str(self.params[0].value))
                return
            except KeyError:
                self.params[0].setErrorMessage("ERROR", 260303)
                return

    
        if self.params[2].value:
            if len(str(self.params[2].value)) > 0:
                self.params[4].enabled = False
                self.params[5].enabled = False
                self.params[6].enabled = False

        if self.params[1].value:
            head_tail = os.path.split(str(self.params[1].value))
            self.params[7].value = os.path.join(str(self.params[1].value), str(head_tail[-1])+".dlpk")

            
        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.
        if self.params[0].altered:
            try:
                data_path = str(self.params[0].value)
                emd_path = os.path.join(data_path, "esri_model_definition.emd")
                f = open(emd_path)
                data = json.load(f)
                data_mode = data["MetaDataMode"]
                if data_mode not in ["PASCAL_VOC_rectangles", "KITTI_rectangles", "Classified_Tiles", "RCNN_Masks"]:
                    self.params[0].setIDMessage("ERROR", 260303)    
            except FileNotFoundError:
                self.params[0].setIDMessage("ERROR", 732, "Input Training Data",str(self.params[0].value))
            except KeyError:
                self.params[0].setErrorMessage("ERROR", 260303)
            except Exception as e:
                self.params[0].setIDMessage("ERROR", 732, "Input Training Data",str(self.params[0].value))
            

        if self.params[2].altered:
            model = self.params[2].valueAsText
            if model.endswith(".dlpk_remote"):
                success, model = _get_hosted_dlpk(model)
                if not success:
                    self.params[2].setIDMessage('ERROR', 732, self.params[2].displayName, self.params[2].valueAsText)
            else:
                emd_path = _get_emd_path(model)
                try:
                    f = open(emd_path)
                    json_info = json.load(f)
                    f.close()
                    model_name = json_info["ModelName"]
                    if model_name not in self.all_supported_models:
                        if model_name not in ["MMDetection", "MMSegmentation"]:
                            self.params[2].setIDMessage("ERROR",260306, str(model_name))
                
                except json.decoder.JSONDecodeError:
                    self.params[2].setIDMessage("ERROR", 260307)

        if self.params[1].altered:
            output_name = self.params[1].valueAsText
            input_name = self.params[0].valueAsText
            if input_name == output_name:
                self.params[1].setIDMessage("ERROR", 260329)

        if self.params[3].altered:
            # hrs = float(self.params[3].value)
            hrs = float(self.params[3].value)
            if hrs < 0.5:
                self.params[3].setIDMessage("ERROR", 260308)

        if self.params[4].altered:
            mode = self.params[4].valueAsText
            if mode not in ["BASIC", "ADVANCED"]:
                self.params[4].setIDMessage("ERROR", 260309)

        if self.params[5].altered:
            algos_text = self.params[5].valueAsText
            algos = algos_text.split(";")
            # self.params[5].setErrorMessage(str(algos))
            for algo in algos:
                if algo not in self.all_supported_models:
                    self.params[5].setIDMessage("ERROR", 260310)

            if (algos.count(algos[-1]) > 1):
                self.params[5].setIDMessage("ERROR",260311 ,str(algos[-1]))

        return


    def isLicensed(self):
        # set tool isLicensed.
        if (arcpy.ProductInfo() != "ArcInfo") or (arcpy.CheckExtension("ImageAnalyst") != 'Available'):
            arcpy.AddIDMessage("ERROR", 180002)
            return False
        else:
            return True

    # def postExecute(self):
    #     # This method takes place after outputs are processed and
    #     # added to the display.
    # return