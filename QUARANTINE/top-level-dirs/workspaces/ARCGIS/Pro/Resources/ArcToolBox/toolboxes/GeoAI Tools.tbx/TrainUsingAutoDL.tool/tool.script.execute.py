"""-------------------------------------------------------------------------
    Tool:               Train Using AutoDL (GeoAI Tools)
    Source Name:        tainUsingAutoDL.py
    Version:            ArcGIS Pro 3.1
    Author:             Esri, Inc.
    Usage:              
    Required model_arguments:   Input Training Data
                                Output Model
    Optional model_arguments: Pretrained Model
                                Total Time Limit (Hours)
                                AutoDL Mode
                                Neural Networks
                                Save Evaluated Models
    Description:        AutoMate the process of training and evaluating deep learning models.          
------------------------------------------------------------------------"""
# Import system modules
try:
    import arcgis
    import SSUtilities as UTILS
    from fastai.callback import Callback
    import warnings
    import torch, gc, re, os, json, time
    import arcgis as ag
    from fastai.data_block import get_files
    from pathlib import Path
    from zipfile import ZipFile
    import tempfile
    import arcpy
    from arcgis.learn import AutoDL, prepare_data
    from io import StringIO
    import sys
    import matplotlib
    from arcgis import GIS
    matplotlib.use('Agg')
    arcpy.env.autoCancelling = False
    import locale as LOCALE
    LOCALE.setlocale(LOCALE.LC_ALL, '')
    warnings.filterwarnings("ignore")
    HAS_DEPS = True
    gc.collect()
    torch.cuda.empty_cache()
except Exception as e:
    HAS_DEPS = False


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit()

if not HAS_DEPS:
    _raise_conda_import_error()
    exit()


# if cuda-enabled GPU is available, the tool uses GPU when the user specify processor type to be GPU or not specify anything
if torch.cuda.is_available() and (not arcpy.env.processorType or arcpy.env.processorType == "GPU"):
    arcpy.env.processorType = "GPU"
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
    if not arcpy.env.gpuId:
        arcpy.env.gpuId = 0
    os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
    arcgis.env._gpuid = arcpy.env.gpuId
    torch.cuda.set_device(arcpy.env.gpuId)
    arcpy.AddIDMessage("INFORMATIVE", 260036)
else:
    arcpy.AddIDMessage("ERROR", 260325)
    exit()

def format_message(results):
    res = re.findall(r"\d+\.\d+", results)
    final_str = ""
    for num in res:
        num = LOCALE.format_string("%0.8f", float(num))
        final_str += str(num)+"\t\t"
    return final_str.strip()

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

class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""
    pass

class RedirectedStdout:
    def __init__(self):
        self._stdout = None
        self._string_io = None

    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._string_io = StringIO()
        return self

    def __exit__(self, type, value, traceback):
        sys.stdout = self._stdout

    def __str__(self):
        return self._string_io.getvalue()


class TrainTimeOut(Exception):
    """Raised when the input value is too small"""
    pass

class ProgressCallback(Callback):
    def __init__(self, model, max_epochs, show_accuracy=True, is_mm_model=False, **kwargs):
        super().__init__()
        self.model = model
        self.max_epochs = max_epochs
        self.show_accuracy = show_accuracy
        self.is_mm = is_mm_model
        self.total_time_limit = kwargs["time"]
        self.start_time = time.time()
        self.execution_time = 0
        self.end_time = 0

    def on_train_begin(self, **kwargs):
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        arcpy.SetProgressor("step", arcpy.GetIDMessage(260133))
        t_loss = arcpy.GetIDMessage(260134)
        v_loss = arcpy.GetIDMessage(260135)
        accuracy_msg = arcpy.GetIDMessage(260136)
        message_string = f"{t_loss}\t\t{v_loss}"
        if self.show_accuracy:
            message_string = message_string + f"\t\t{accuracy_msg}"
        arcpy.AddMessage(message_string)

    def on_epoch_begin(self, **kwargs):
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        epoch_msg = arcpy.GetIDMessage(260137)
        arcpy.SetProgressorLabel("{} {}".format(epoch_msg, kwargs.get("epoch") + 1))
        percentage_completed = float(kwargs.get("epoch") / self.max_epochs) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))

    def on_epoch_end(self, **kwargs):
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        last_loss = kwargs.get("last_loss", "NA")
        last_metrics = kwargs.get("last_metrics", [])
        message_string = f"{last_loss}\t{last_metrics[0]}"
        self.end_time = time.time()
        self.execution_time = self.end_time - self.start_time
        if self.show_accuracy:
            if self.is_mm:
                accuracy = "0.0"
            else:
                accuracy = last_metrics[1] if len(last_metrics) > 1 else "NA"
            message_string = message_string + f"\t\t{accuracy}"
        local_message_string = format_message(message_string)
        arcpy.AddMessage(local_message_string)
        if self.execution_time > self.total_time_limit:
            raise TrainTimeOut(arcpy.GetIDMessage(260323))



def ScriptTool(input_training_data, pretrained_model, 
    output_model, total_time_limit,
    autodl_mode, networks, save_evalated_models):
    try:
        init_log = ""
        time_taken = float(total_time_limit) * 60 * 60
        ## Prepare data
        try:
            data_path = str(input_training_data)
            emd_path = _get_emd_path(data_path)
            f = open(emd_path)
            data = json.load(f)
            f.close()
            _chip_size = data["ImageHeight"]
        except FileNotFoundError:
            arcpy.AddIDMessage("ERROR", 732, "Input Training Data",str(input_training_data))
            exit()
        except:
            _chip_size = 224
        data = prepare_data(input_training_data, batch_size=None, chip_size=_chip_size)
        data_mode = data._dataset_type
        dataset_type = None
        if data_mode in ["RCNN_Masks"]:
            dataset_type = "object_detection"
            all_networks = ["MaskRCNN"]
        elif data_mode in ["PASCAL_VOC_rectangles", "KITTI_rectangles"]:
            dataset_type = "object_detection"
            all_networks = ["SingleShotDetector", "RetinaNet", "FasterRCNN", "YOLOv3", "DETReg" ,"ATSS",
                            "CARAFE", "CascadeRCNN", "CascadeRPN", "DCN", 'DynamicRCNN', 'EmpiricalAttention', 'FCOS', 'FoveaBox',
                            'FSAF', 'GHM', 'LibraRCNN', 'PaFPN',
                            'Res2Net', 'SABL', 'VFNet']
        elif data_mode in ["Classified_Tiles"]:
            dataset_type = "pixel_classification"
            all_networks = ["DeepLab", "UnetClassifier", "PSPNetClassifier",
                                "ANN", "APCNet", "CCNet", "CGNet", "HRNet", 'DeepLabV3Plus',
                                'DMNet', 'DNLNet', 'FastSCNN', 'FCN', 'GCNet', 'MobileNetV2',
                                'NonLocalNet','OCRNet', 'PSANet', 'SemFPN', 'UperNet']
        else:
            arcpy.AddIDMessage("ERROR", 260303)

        if pretrained_model== "":
            ## Selected Networks
            selected_networks = networks.split(";")
            if ("" in selected_networks) and (len(selected_networks) == 1):
                selected_networks = all_networks

            #autodl mode
            autodl_mode = autodl_mode.lower()
            if save_evalated_models == "true":
                save_evalated_models = True
            else:
                save_evalated_models = False

            try:
                total_time_limit = float(total_time_limit) - 0.2
                with RedirectedStdout() as out:
                    dl = AutoDL(data, total_time_limit=float(total_time_limit), network=selected_networks, mode=autodl_mode,
                        verbose=True, save_evaluated_models=save_evalated_models, output_folder=output_model)
                    init_log = str(out)

            except Exception as e:
                arcpy.AddIDMessage("ERROR", 260041, str(e))
                exit()

            all_nums = re.findall(r"[\d]+[.,\d]+|[\d]*[.][\d]+|[\d]+", init_log)
            arcpy.AddIDMessage("INFORMATIVE", 260320, LOCALE.format_string("%0.2f", float(all_nums[0])+ 0.2))
            arcpy.AddIDMessage("INFORMATIVE", 260321, LOCALE.format_string("%d", float(all_nums[1])))
            arcpy.AddIDMessage("INFORMATIVE", 260322, LOCALE.format_string("%d", float(all_nums[2])),LOCALE.format_string("%0.2f", float(all_nums[3])))
            arcpy.AddIDMessage("INFORMATIVE", 260312)

            ## fit the model
            try:
                dl.fit()
            except Exception as e:
                if "out of memory" in str(e):
                    arcpy.AddIDMessage("ERROR", 260004)
                    exit()
                if "unexpected EOF" in str(e):
                    arcpy.AddIDMessage("ERROR", 260330)
                arcpy.AddIDMessage("ERROR", 260314, str(e))
                del dl
                gc.collect()
                torch.cuda.empty_cache()
                exit()
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()

            ## score
            try:
                score = dl.score()
                score_list = score.values.tolist()
                justify_list = []
                for score in score_list:
                    score[1] = LOCALE.format_string("%0.3f", float(score[1]))
                    score[2] = LOCALE.format_string("%0.3f", float(score[2]))
                    score[3] = LOCALE.format_string("%0.5f", float(score[3]))
                    if dataset_type == "pixel_classification":
                        score[4] = LOCALE.format_string("%0.3f", float(score[4]))
                        score[5] = LOCALE.format_string("%0.7f", float(score[5]))
                    else:
                        score[4] = LOCALE.format_string("%0.7f", float(score[4]))

                if dataset_type == "pixel_classification":
                    justify_list = ["left", "right", "right", "right", "right", "right", "right", "right"]
                    all_cols_name = [str(arcpy.GetIDMessage(260400)),
                                str(arcpy.GetIDMessage(260401)),
                                str(arcpy.GetIDMessage(260402)),
                                str(arcpy.GetIDMessage(260403)),
                                str(arcpy.GetIDMessage(260407)),
                                str(arcpy.GetIDMessage(260404)),
                                str(arcpy.GetIDMessage(260405)),
                                str(arcpy.GetIDMessage(260406))]
                    score_list.insert(0, all_cols_name)
                else:
                    justify_list = ["left", "right", "right", "right", "right", "right", "right"]
                    all_cols_name = [str(arcpy.GetIDMessage(260400)),
                                str(arcpy.GetIDMessage(260401)),
                                str(arcpy.GetIDMessage(260402)),
                                str(arcpy.GetIDMessage(260403)),
                                str(arcpy.GetIDMessage(260404)),
                                str(arcpy.GetIDMessage(260405)),
                                str(arcpy.GetIDMessage(260406))]
                    score_list.insert(0, all_cols_name)
                
                outputReport = UTILS.outputTextTable(score_list,
                                                    justify = justify_list, pad = 1, colPad = 3,
                                                    titleFillToken = "-", force2Txt=False)


                if (len(score_list) - 1) < len(selected_networks):
                    arcpy.AddIDMessage("INFORMATIVE", 260315)
                
                dl.report()
                report_path = os.path.join(output_model, "README.html")    
                link = UTILS.outputParagraph([UTILS.buildHyperlink(str(report_path))])
                arcpy.AddIDMessage("INFORMATIVE", 260316)
                del dl
            except Exception as e:
                arcpy.AddMessage(str(e))

        else:
            try:
                _show_accuracy = True
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
                lr_val = None
                is_mm = False

                emd_path = os.path.join(pretrained_model)
                emd_path = _get_emd_path(emd_path)
                

                f = open(emd_path)
                info = json.load(f)
                model_name = info["ModelName"]
                f.close()
                modeltype = info["ModelType"]
                if "ModelFileConfigurationClass" in list(info.keys()):
                    modelconfig = info["ModelFileConfigurationClass"]
                    if modelconfig in ["MMDetectionConfig", "MMSegmentationConfig"]:
                        mm_model = info["Kwargs"]["model"]
                        is_mm = True
                else:
                    is_mm = False

                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()

                data_obj = prepare_data(input_training_data, batch_size=4)
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()

                if is_mm:
                    imagery_model = getattr(ag.learn, model_name)(data_obj, model=mm_model)
                    model_name = mm_model
                    _show_accuracy = False 
                else:
                    imagery_model = getattr(ag.learn, model_name)(data_obj)
                imagery_model.from_model(pretrained_model)
                if lr_val is None:
                    lr_val = imagery_model.lr_find(allow_plot=False)

                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()

                is_audl_model = False
                for m in all_networks:
                    if model_name.replace("_","").lower() == m.lower():
                        model_name = m
                        is_audl_model = True
                        break
                if not is_audl_model:
                    arcpy.AddIDMessage("ERROR", 260317)


                with RedirectedStdout() as out:
                    dl = AutoDL(data_obj, total_time_limit=float(total_time_limit), network=[model_name], verbose= False)
                    autodl_message = str(out)
                
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
                all_nums = re.findall(r"[\d]+[.,\d]+|[\d]*[.][\d]+|[\d]+", autodl_message)
                arcpy.AddIDMessage("INFORMATIVE", 260318, all_nums[-1])

                max_epochs = int(((20 * float(total_time_limit)) // float(all_nums[-1])) + 1)
                arcpy.AddIDMessage("INFORMATIVE", 260319, str(int(max_epochs)))

                try:
                    imagery_model.fit(epochs=max_epochs, lr=lr_val,checkpoint=False, early_stopping=True, callbacks=[
                                ProgressCallback(
                                    imagery_model,
                                    max_epochs,
                                    show_accuracy=_show_accuracy,
                                    checkpoint=False,
                                    time = time_taken,
                                    is_mm_model = is_mm
                                )
                            ])
                except TrainTimeOut as e:
                    arcpy.AddIDMessage("ERROR", 260314, str(e))
                except Exception as e:
                   if "unexpected EOF" in str(e):
                       arcpy.AddIDMessage("ERROR", 260330)
                   arcpy.AddIDMessage("ERROR", 260314, str(e))
                arcpy.AddIDMessage("INFORMATIVE", 260065, str(output_model))

                imagery_model.save(output_model)
                arcpy.AddIDMessage("INFORMATIVE", 260056)
                del dl
                del imagery_model
            except RuntimeError as e:
                if "out of memory" in str(e):
                    arcpy.AddIDMessage("ERROR", 260004)
                if "loading state_dict" in str(e):
                    arcpy.AddIDMessage("ERROR", 260327)
                else:
                    arcpy.AddIDMessage("ERROR", 260041, str(e))
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 260041, str(e))
        gc.collect()
        torch.cuda.empty_cache()
        exit()
    finally:
        gc.collect()
        torch.cuda.empty_cache()
        exit()

    return

# This is used to execute code if the file was run but not imported
if __name__ == '__main__':

    # Tool parameter accessed with GetParameter or GetParameterAsText
    input_training_data = arcpy.GetParameterAsText(0)
    pretrained_model = arcpy.GetParameterAsText(2)
    if pretrained_model.endswith(".dlpk_remote"):
            desc = arcpy.env.workspace
            item_id = os.path.basename(pretrained_model).split(".")[0]
            gis = GIS(
                "home"
            )
            online_model = gis.content.get(item_id)
            filepath = os.path.join(desc, online_model.name)
            pretrained_model = filepath
    output_model = arcpy.GetParameterAsText(1)
    total_time_limit = arcpy.GetParameter(3)
    autodl_mode = arcpy.GetParameterAsText(4)
    networks = arcpy.GetParameterAsText(5)
    save_evalated_models = arcpy.GetParameterAsText(6)
    
    ScriptTool(input_training_data, pretrained_model, 
        output_model, total_time_limit, 
        autodl_mode, networks, save_evalated_models)
    
    # Update derived parameter values using arcpy.SetParameter() or arcpy.SetParameterAsText()