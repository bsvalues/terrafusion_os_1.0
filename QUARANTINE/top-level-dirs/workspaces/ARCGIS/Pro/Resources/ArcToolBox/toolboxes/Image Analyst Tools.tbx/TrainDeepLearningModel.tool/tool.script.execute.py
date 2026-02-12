import os, json, shutil, gc, time
from zipfile import ZipFile

try:
    import torch
    HAS_TORCH = True
except Exception as e:
    HAS_TORCH = False

import arcpy
import numpy
from arcgisscripting import arcio
from rapathutils import swizzle_path

import arcgis
from arcgis.learn import prepare_data
import fastai.vision.transform 
from fastai.vision.transform import rotate, brightness, contrast, zoom, crop

class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""
    pass

if arcpy.env.processorType == "GPU" and torch.cuda.is_available() and arcpy.env.gpuId:
    # use specific gpu if gpuId is specified, use all available gpus if no gpuID is specified
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
    arcgis.env._gpuid = arcpy.env.gpuId
    torch.cuda.set_device(arcpy.env.gpuId)
elif not arcpy.env.processorType:
    # use all available gpus if processor type is not specified(default), gpuID is ignored in this case
    arcgis.env._processorType = "GPU"
else:
    arcgis.env._processorType = arcpy.env.processorType

try:
    from fastai.callback import Callback
    HAS_FASTAI = True
except Exception as e:
    HAS_FASTAI = False

import warnings
from fastprogress import fastprogress

arcpy.env.autoCancelling = False
fastprogress.NO_BAR = True
warnings.filterwarnings("ignore")

S_SSD = "SSD"
S_UNET = "UNET"
S_FC = "FEATURE_CLASSIFIER"
S_PSP = "PSPNET"
S_RETINA = "RETINANET"
S_MRCNN = "MASKRCNN"
S_YOLO = "YOLOV3"
S_DL = "DEEPLAB"
S_FRCNN = "FASTERRCNN"
S_BDCN = "BDCN_EDGEDETECTOR"
S_HED = "HED_EDGEDETECTOR"
S_MTRR = "MULTITASK_ROADEXTRACTOR"
S_P2P = "PIX2PIX"
S_CGAN = "CYCLEGAN"
S_SR = "SUPERRESOLUTION"
S_CD = "CHANGEDETECTOR"
S_IC = "IMAGECAPTIONER"
S_CONNECT = "CONNECTNET"
S_SM = "SIAMMASK"
S_MMD = "MMDETECTION"
S_MMS = "MMSEGMENTATION"
S_DSORT = "DEEPSORT"
S_P2PHD = "PIX2PIXHD"
S_MDL = "MAXDEEPLAB"
S_DETREG = "DETREG"
S_PSETAE = "PSETAE"
S_SAMLORA = "SAMLORA"
S_CLIMAX = "CLIMAX"

MODEL_TO_MODELCLASS = {
    S_SSD: "SingleShotDetector",
    S_UNET: "UnetClassifier",
    S_FC: "FeatureClassifier",
    S_PSP: "PSPNetClassifier",
    S_RETINA: "RetinaNet",
    S_MRCNN: "MaskRCNN",
    S_YOLO: "YOLOv3",
    S_DL: "DeepLab",
    S_FRCNN: "FasterRCNN",
    S_BDCN: "BDCNEdgeDetector",
    S_HED: "HEDEdgeDetector",
    S_MTRR: "MultiTaskRoadExtractor",
    S_P2P: "Pix2Pix",
    S_CGAN: "CycleGAN",
    S_SR: "SuperResolution",
    S_CD: "ChangeDetector",
    S_IC: "ImageCaptioner",
    S_CONNECT: "ConnectNet",
    S_SM: "SiamMask",
    S_MMD: "MMDetection",
    S_MMS: "MMSegmentation",
    S_DSORT: "DeepSort",
    S_P2PHD: "Pix2PixHD",
    S_MDL: "MaXDeepLab",
    S_DETREG: "DETReg",
    S_PSETAE: "PSETAE",
    S_SAMLORA: "SamLoRA",
    S_CLIMAX: "ClimaX"
}

# written out metrics during training
MODEL_TO_METRICS = {
    S_SSD: ["average_precision"],
    S_UNET: ["accuracy", "Dice"],
    S_FC: ["accuracy"],
    S_PSP: ["accuracy", "Dice"],
    S_RETINA: ["average_precision"],
    S_MRCNN: ["average_precision"],
    S_YOLO: ["average_precision"],
    S_DL: ["accuracy", "Dice"],
    S_FRCNN: ["average_precision"],
    S_BDCN: ["accuracy", "f1_score"],
    S_HED: ["accuracy", "f1_score"],
    S_MTRR: ["accuracy", "MIoU", "Dice"],
    S_P2P: ["gen_loss","l1_loss", "D_loss"],
    S_CGAN: ["id_loss","gen_loss","cyc_loss","D_A_loss","D_B_loss"],
    S_SR: ["pixel_loss"],
    S_CD: ["precision","recall", "f1_score"],
    S_IC: ["accuracy", "bleu"],
    S_CONNECT: ["accuracy", "MIoU", "Dice"],
    S_SM: ["mIOU"],
    S_MMD: ["average_precision"],
    S_MMS: ["accuracy", "Dice"],
    S_DSORT: ["accuracy"],
    S_P2PHD: ["gen_loss", "disc_fake_loss", "disc_real_loss","feat_loss", "l1_loss"],
    S_MDL: [""],
    S_DETREG: [""],
    S_PSETAE: ["miou"],
    S_SAMLORA: ["accuracy", "Dice"],
    S_CLIMAX: [""]
}

class ProgressCallback(Callback):

    def __init__(self, model, model_type, dataset_type, max_epochs, saved_folder, **kwargs):
        super().__init__()
        self.model = model
        self.model_type = model_type
        self.dataset_type = dataset_type
        self.max_epochs = max_epochs
        self.saved_folder = saved_folder
        self.train_result_folder = os.path.join(self.saved_folder, "ModelCharacteristics")
        self.train_log_file = os.path.join(self.train_result_folder, "training_validation_loss.json")
        self.epoch_begin_time = 0
        self.epoch_end_time = 0
        self.epoch_time = "00:00:00"
        if self.model_type == S_FC and self.dataset_type == "MultiLabeled_Tiles":
            MODEL_TO_METRICS[S_FC] = ["accuracy", "multi_label_fbeta"]

    def on_train_begin(self, **kwargs):
        arcpy.AddMessage(
            "Learning Rate - {}".format(str(self.model._learning_rate)))
        arcpy.SetProgressor("step", "Training....")

        message_string = "{:<10} {:<20} {:<20} ".format("epoch","training loss","validation loss")
        for metric_name in MODEL_TO_METRICS.get(self.model_type, []):
            message_string += "{:<20} ".format(metric_name)
        message_string += "{:<20} ".format("time")

        train_log_data = {"training_validation_loss_per_epoch":[]}
        if not os.path.exists(self.saved_folder):
            os.makedirs(self.saved_folder)
        if not os.path.exists(self.train_result_folder):
            os.makedirs(self.train_result_folder)
        
        with open(self.train_log_file,'w') as f:
            json.dump(train_log_data, f, indent=4)
        f.close()

        arcpy.AddMessage(message_string)

    def on_epoch_begin(self, **kwargs):
        arcpy.SetProgressorLabel("Epoch {}".format(kwargs.get("epoch") + 1))
        percentage_completed = float(
            kwargs.get("epoch") / self.max_epochs) * 100
        self.epoch_begin_time = time.time()
        arcpy.SetProgressorPosition(int(percentage_completed))

    def on_epoch_end(self, **kwargs):
        epoch = kwargs.get("epoch", "NA")
        last_loss = kwargs.get("smooth_loss", "NA")
        last_metrics = kwargs.get("last_metrics", [])
        self.epoch_end_time = time.time()
        self.epoch_time = time.strftime("%H:%M:%S", time.gmtime(self.epoch_end_time - self.epoch_begin_time))

        if not last_metrics:
            val_loss = "NA"
        elif not last_metrics[0]:
            val_loss = "NA"
            last_metrics = []
        else:
            val_loss = last_metrics[0]
            last_metrics = last_metrics[1:]
        message_string = "{:<10} {:<20} {:<20} ".format(epoch,last_loss,val_loss)
        train_val_loss_per_epoch = {"epoch":epoch, "training_loss": str(last_loss.item()), "validation_loss": str(val_loss)}

        metrics_names = MODEL_TO_METRICS.get(self.model_type, [])
        for idx, metric in enumerate(last_metrics):
            if torch.is_tensor(metric) or isinstance(metric,numpy.ndarray):
                metric = metric.item()
            message_string += "{:<20} ".format(metric)
            train_val_loss_per_epoch[metrics_names[idx]] = metric

        message_string += "{:<20} ".format(self.epoch_time)
        train_val_loss_per_epoch["time"] = self.epoch_time

        with open(self.train_log_file) as f:
            train_log_data = json.load(f)
            train_log_data["training_validation_loss_per_epoch"].append(train_val_loss_per_epoch)
        with open(self.train_log_file, 'w') as f:
            json.dump(train_log_data, f, indent=4)
        f.close()

        arcpy.AddMessage(message_string)
        if arcpy.env.isCancelled:
            raise CustomCancelException("Tool has been cancelled")


def execute():
    if not HAS_FASTAI:
        arcpy.AddError("Fast.ai library is not installed. Install deep learning frameworks for ArcGIS Pro at https://pro.arcgis.com/en/pro-app/latest/help/analysis/deep-learning/install-deep-learning-frameworks.htm") 
    
    if not HAS_TORCH:
        arcpy.AddError("PyTorch library is not installed. Install deep learning frameworks for ArcGIS Pro at https://pro.arcgis.com/en/pro-app/latest/help/analysis/deep-learning/install-deep-learning-frameworks.htm") 

    """The source code of the tool."""
    # for optional parameter(not selected from a list of predefined values), a default value(could be None) should be given if it is not specified in UI, to avoid 'value not found' error happenning later
    in_folders = [swizzle_path(i.value) for i in arcpy.GetParameter(0)]
    out_folder = swizzle_path(arcpy.GetParameterAsText(1))
    max_epochs = int(arcpy.GetParameterAsText(2)) if arcpy.GetParameterAsText(2) else 20
    model_type = arcpy.GetParameterAsText(3)
    batch_size = int(arcpy.GetParameterAsText(4)) if arcpy.GetParameterAsText(4) else None
    arguments = arcpy.GetParameter(5) if arcpy.GetParameter(5) else None
    learning_rate = float(abs(arcpy.GetParameter(6))) if arcpy.GetParameter(
        6) else None
    backbone_model = arcpy.GetParameterAsText(7)
    pretrained_model = swizzle_path(arcpy.GetParameterAsText(8)) if arcpy.GetParameterAsText(
        8) else None
    validation_percentage = (
                float(arcpy.GetParameter(9)) / 100) if arcpy.GetParameter(
        9) else None
    stop_training = arcpy.GetParameter(10)
    freeze = arcpy.GetParameter(12)
    augmentation = arcpy.GetParameterAsText(13)
    augmentation_parameters = arcpy.GetParameter(14)
    chip_size = int(arcpy.GetParameterAsText(15)) if arcpy.GetParameterAsText(15) else None
    resize_to = eval(arcpy.GetParameterAsText(16)) if arcpy.GetParameterAsText(16) else None
    weight_init_scheme = arcpy.GetParameterAsText(17)
    monitor_value = arcpy.GetParameterAsText(18)

    # multiple input folders processing
    in_folders_transferred = []
    for index, in_folder in enumerate(in_folders):
        if in_folder.find(".acs") > -1:
            # Cloud Store support
            # 1. The input is a acs connection file path
            arcpy.AddMessage("Transferring data to local storage for training...")
            [acs, acs_in_folder] = in_folder.split(".acs\\")
            acs_root = acs + ".acs"
            stage_folder = os.path.join(arcpy.env.scratchFolder, os.path.basename(in_folder))
            arcio(acs_root).copytree(acs_in_folder, os.path.dirname(stage_folder), {'SYNC_STRATEGY': 'OVERWRITE', 'RECURSIVE': 'YES'})
            in_folders[index] = stage_folder
            in_folders_transferred.append(True)
            arcpy.AddMessage("Finished transferring data to local storage for training.")
        else:
            in_folders_transferred.append(False)

    if len(in_folders)<=1: 
        # prepare_data() accepts the input folder path string if only one input folder exists, it does not support a list of only one input folder path
        in_folders = in_folders[0]
        stats_file = os.path.join(in_folders, "esri_accumulated_stats.json")
        transforms_file = os.path.join(in_folders, "transforms.json")
    else:
        # multiple input folders processing, use the first input folder's stats file
        stats_file = os.path.join(in_folders[0], "esri_accumulated_stats.json")
        transforms_file = os.path.join(in_folders[0], "transforms.json")

    if os.path.exists(stats_file):
        with open(stats_file, 'r') as f:
            stats = json.load(f)
            dataset_type = stats["MetaDataMode"]
        f.close()
    else:
        dataset_type = None

    # Output folder needs to be staged as well if final result goes to cloud store
    transfer_output = False
    original_out_folder = out_folder

    if out_folder.find(".acs") > -1:
        transfer_output = True
        out_folder = os.path.join(arcpy.env.scratchFolder, os.path.basename(out_folder))

    # Get model parameters and prepare_data parameters
    kwargs = {}
    prepare_data_kwargs = {}
    if batch_size:
        prepare_data_kwargs["batch_size"] = batch_size
    if chip_size:
        prepare_data_kwargs["chip_size"] = chip_size
    if resize_to:
        prepare_data_kwargs["resize_to"] = resize_to

    if arguments:
        if model_type != S_IC:
            for arg_index in range(arguments.rowCount):
                arg_pair = arguments.getRow(arg_index).split("'")
                arg_pair_copy = []
                for each in arg_pair:
                    each = each.strip()
                    if each:
                        arg_pair_copy.append(each)
                arg_pair = arg_pair_copy
                if len(arg_pair) == 2:
                    if arg_pair[0] in ["chip_size", "resize_to", "downsample_factor", "n_masks", "min_points", "forecast_timesteps", "hrs_each_step"]: # for int parameters used in prepare_data()
                        prepare_data_kwargs[arg_pair[0]] = eval(arg_pair[1])
                    elif  arg_pair[0] in ["timesteps_of_interest", "channels_of_interest"]: # for list parameters used in prepare_data()
                        prepare_data_kwargs[arg_pair[0]] = list(eval(arg_pair[1]))
                    elif arg_pair[0] in ["grids", "zooms", "ratios", "ignore_classes", "pyramid_sizes", "scales", "mlp1", "mlp2", "mlp3", "mlp4", "channel_mults"]: # for list parameters used as kwargs
                        if isinstance(eval(arg_pair[1]), (int, float)):
                            kwargs[arg_pair[0]] = [eval(arg_pair[1])]
                        elif isinstance(eval(arg_pair[1]), list):
                            if arg_pair[0] == "ratios" and model_type == S_SSD and not isinstance(eval(arg_pair[1])[0],list): #special case for ssd's ratios parameter
                                kwargs[arg_pair[0]] = [eval(arg_pair[1])]
                            else:
                                kwargs[arg_pair[0]] = eval(arg_pair[1])
                        else: # parameter value is a list without "[]"
                            kwargs[arg_pair[0]] = list(eval(arg_pair[1]))
                    elif arg_pair[0] in ["mtl_model", "attention_type", "model", "pooling", "schedule", "backend", "dice_loss_average", "gen_network", "norm"] or (arg_pair[0] == "model_weight" and arg_pair[1] != "False"): # for string parameters used as kwargs
                        kwargs[arg_pair[0]] = str(arg_pair[1])
                    elif arg_pair[0] == "monitor":
                        monitor_value = str(arg_pair[1])
                    else:
                        kwargs[arg_pair[0]] = eval(arg_pair[1])
        else:
            decoder_params_pair = arguments.getRow(0)
            kwargs["decoder_params"] = eval(decoder_params_pair[decoder_params_pair.find('{'):decoder_params_pair.find('}')+1])
            if arguments.rowCount == 3:
                chip_size_pair = arguments.getRow(1).split()
                if chip_size_pair[0] == "chip_size":
                    prepare_data_kwargs["chip_size"] = eval(chip_size_pair[1])
                monitor_pair = arguments.getRow(2).split()
                if monitor_pair[0] == "monitor":
                    monitor_value = str(monitor_pair[1])
    
    # Get data augmentation parameter values, used as transforms
    if augmentation == "CUSTOM":
        transforms = []
        for aug_index in range(augmentation_parameters.rowCount):
            aug_pair = augmentation_parameters.getRow(aug_index).split("'") # augmentation_parameters.getRow(aug_index) = "'rotate' '30.0; 0.5'", aug_pair = ['', 'rotate', ' ', '30.0; 0.5', ''], then aug_pair = ['rotate','30.0; 0.5']
            aug_pair_copy = []
            for each in aug_pair:
                each = each.strip()
                if each:
                    aug_pair_copy.append(each)
            aug_pair = aug_pair_copy
            if len(aug_pair) == 2:
                if aug_pair[0] == "rotate":
                    aug_values = aug_pair[1].split(";")
                    transforms.append(rotate(degrees=eval(aug_values[0]), p=eval(aug_values[1])))
                if aug_pair[0] == "brightness":
                    aug_values = aug_pair[1].split(";")
                    transforms.append(brightness(change=eval(aug_values[0]), p=eval(aug_values[1])))
                if aug_pair[0] == "contrast":
                    aug_values = aug_pair[1].split(";")
                    transforms.append(contrast(scale=eval(aug_values[0]), p=eval(aug_values[1])))               
                if aug_pair[0] == "zoom":
                    aug_values = aug_pair[1].split(";")
                    transforms.append(zoom(scale=eval(aug_values[0]), p=eval(aug_values[1])))
                if aug_pair[0] == "crop":
                    aug_values = aug_pair[1].split(";")
                    transforms.append(crop(size=eval(aug_values[0]), p=eval(aug_values[1]), row_pct=eval(aug_values[2]), col_pct=eval(aug_values[3])))
        train_tfms = transforms
        val_tfms = transforms
        tfms = (train_tfms, val_tfms)
    elif augmentation == "NONE":
        tfms = False
    elif augmentation == "DEFAULT":
        tfms = None
    elif augmentation == "FILE":
        with open(transforms_file, 'r') as af:
            transforms_file_items = json.load(af)
        af.close() 

        tuple_value_transforms = ["change", "scale", "row_pct", "col_pct", "k", "magnitude", "degrees", "direction", "n_holes", "length"] # transforms which might have tuple values
        train_tfms = []
        val_tfms = []

        for train_tf in transforms_file_items["Training"].keys():
            try:
                train_tf_func = getattr(fastai.vision.transform, train_tf)
            except AttributeError as e:
                arcpy.AddError(str(e))
            train_tf_params = transforms_file_items["Training"][train_tf]
            for param in train_tf_params:
                if param in tuple_value_transforms and isinstance(train_tf_params[param], str): # transforms which might have tuple values
                    train_tf_params[param] = eval(train_tf_params[param]) 
            train_tfms.append(train_tf_func(**train_tf_params))
        
        for val_tf in transforms_file_items["Validation"].keys():
            try:
                val_tf_func = getattr(fastai.vision.transform, val_tf)
            except AttributeError as e:
                arcpy.AddError(str(e))
            val_tf_params = transforms_file_items["Validation"][val_tf]
            for param in val_tf_params:
                if param in tuple_value_transforms and isinstance(val_tf_params[param], str): # transforms which might have tuple values
                    val_tf_params[param] = eval(val_tf_params[param])
            val_tfms.append(val_tf_func(**val_tf_params))

        tfms = (train_tfms, val_tfms)
    else:
        tfms = None

    # All monitor metric values are lowercases except for SiamMask's mIOU
    if model_type == S_SM and monitor_value == "MIOU":
        monitor_value = "mIOU"
    elif model_type == S_CD and monitor_value == "f1_score":
        monitor_value = "f1"
    else:
        monitor_value = monitor_value.lower()

    # All backbone names are lowercases except for Darknet53
    if backbone_model == "DARKNET53":
        kwargs["backbone"] = "DarkNet53"
    elif backbone_model == "SR3":
        kwargs["backbone"] = "SR3"
    elif backbone_model == "SR3_UVIT":
        kwargs["backbone"] = "SR3_UViT"
    elif backbone_model != "":
        kwargs["backbone"] = backbone_model.lower()

    # Detreg uses a fixed learning rate 2e-5
    if model_type == S_DETREG:
        learning_rate = 2e-5

    # Prepare Data
    if validation_percentage:
        prepare_data_kwargs["val_split_pct"] = validation_percentage

    if not dataset_type:
        if model_type in [S_CGAN, S_P2P]:
            prepare_data_kwargs["dataset_type"] = MODEL_TO_MODELCLASS[model_type]
        elif model_type == S_SR:
            prepare_data_kwargs["dataset_type"] = "superres"
        elif model_type == S_CD:
            prepare_data_kwargs["dataset_type"] = "ChangeDetection"
        elif model_type == S_IC:
            prepare_data_kwargs["dataset_type"] = "ImageCaptioning"
        elif model_type in [S_SSD, S_RETINA, S_YOLO, S_FRCNN, S_MMD]:
            if isinstance(in_folders, str):
                labels_folder = os.path.join(in_folders, "labels")
            else:
                labels_folder = os.path.join(in_folders[0], "labels")
            for label_file in os.listdir(labels_folder):
                if label_file.endswith(".xml") and not label_file.endswith(".tif.aux.xml"):
                    prepare_data_kwargs["dataset_type"] = "PASCAL_VOC_rectangles"
                    break
                if label_file.endswith(".txt"): 
                    prepare_data_kwargs["dataset_type"] = "KITTI_rectangles"
                    break
        elif model_type == S_DETREG:
            prepare_data_kwargs["dataset_type"] = "PASCAL_VOC_rectangles"
    elif dataset_type in ["Imagenet"]:
        prepare_data_kwargs["dataset_type"] = "Imagenet"
    
    if model_type == S_SM:
        prepare_data_kwargs["dataset_type"] = "ObjectTracking"

    if model_type == S_DSORT:
        prepare_data_kwargs["resize_to"] = (128, 64)

    if model_type == S_PSETAE:
        prepare_data_kwargs["dataset_type"] = "PSETAE"

    # Specify the scheme in which the weights are initialized for the layer. This only applies when data is multispectral and a pretrained model is specified
    if weight_init_scheme == "RANDOM":
        arcgis.env.type_init_tail_parameters = "random"
    elif weight_init_scheme == "RED_BAND":
        arcgis.env.type_init_tail_parameters = "red_band"
    elif weight_init_scheme == "ALL_RANDOM":
        arcgis.env.type_init_tail_parameters = "all_random"

    estimate_batch_size_tried = False
    breakwhile = False
    while not breakwhile:
        try:
            data_bunch = prepare_data(in_folders, working_dir=out_folder, transforms = tfms, **prepare_data_kwargs)

            if not pretrained_model:
                # Create Training Model Object
                training_model = getattr(arcgis.learn, MODEL_TO_MODELCLASS[model_type])
                training_model_object = training_model(data_bunch, **kwargs)
            else:
                # Use pretrained_model parameters to override user provided parameters if there is any
                if pretrained_model.endswith(".dlpk"):
                    with ZipFile(pretrained_model, 'r') as f:
                        tmp_pretrained_model = os.path.join(out_folder, "tmp_pretrained_model")
                        f.extractall(tmp_pretrained_model)
                        pretrained_model_emd = os.path.basename(pretrained_model).replace(".dlpk", ".emd")
                        pretrained_model_path = os.path.join(tmp_pretrained_model, pretrained_model_emd)
                else:
                    pretrained_model_path = pretrained_model
                with open(pretrained_model_path, 'r') as pt_in:
                    pt = json.load(pt_in)
                pt_in.close()
                training_model = getattr(arcgis.learn, pt["ModelName"])
                training_model_object = training_model.from_model(pretrained_model_path, data_bunch)
                
                # find model_type based on pt["ModelName"]
                for key in MODEL_TO_MODELCLASS:
                    if MODEL_TO_MODELCLASS[key] == pt["ModelName"]:
                        model_type = key
                        break

            # If Freeze option is unchecked, the layers in the backbone is also updated
            if not freeze:
                training_model_object.unfreeze()

            training_model_object.fit(
                epochs=max_epochs,
                lr=learning_rate,
                early_stopping=stop_training,
                monitor = monitor_value,
                callbacks=[ProgressCallback(training_model_object, model_type, dataset_type, max_epochs, out_folder)]
            )

            if hasattr(training_model_object, "_model_metrics") and training_model_object._model_metrics != {}:
                arcpy.AddMessage(training_model_object._model_metrics)
            if model_type == S_RETINA or model_type == S_YOLO:
                arcpy.AddMessage("Detection threshold: 0.5, IOU(Intersection Over Union) threshold: 0.1")
            elif model_type == S_SSD:
                arcpy.AddMessage("Detection threshold: 0.2, IOU(Intersection Over Union) threshold: 0.1")
            if hasattr(training_model_object, "per_class_metrics") and training_model_object.per_class_metrics() is not None:
                arcpy.AddMessage(training_model_object.per_class_metrics())

            arcpy.SetProgressorPosition(100)
            arcpy.SetProgressorLabel("Training Completed")
            arcpy.ResetProgressor()

            # delete temporary extracted pretrained model folder and temporary checkpoints folder if existed
            tmp_checkpoints = os.path.join(out_folder, "models")
            try:
                if os.path.exists(tmp_checkpoints):
                    shutil.rmtree(tmp_checkpoints)
            except NameError:
                pass

            try:
                if os.path.exists(tmp_pretrained_model):
                    shutil.rmtree(tmp_pretrained_model)
            except NameError:
                pass

            # Save object
            if model_type == S_SM:
                framework = "torchscript"
                training_model_object.save(out_folder, framework=framework, save_inference_file=False)
            else:
                training_model_object.save(out_folder, save_inference_file=False)

            # Tool's derived output value
            arcpy.SetParameterAsText(11, os.path.join(original_out_folder, os.path.basename(original_out_folder) + ".dlpk"))

            breakwhile = True
     
        except Exception as e:
            exception = str(e)
            # encounters out of memory error
            if "out of memory" in exception:
                # estimate batch has been called and used, break
                if estimate_batch_size_tried:
                    arcpy.AddError("Error: " + exception + ". Estimate Batch Size function still can not estimate a suitable batch size. Training was not successful. Please manually specify a smaller batch size and run again.")
                    breakwhile = True
                else:
                    try:
                        from arcgis.learn._utils.evaluate_batchsize import estimate_batch_size
                        arcpy.AddMessage("Out of GPU memory with batch size: {0}. A smaller, suitable batch size will be estimated and used.".format(prepare_data_kwargs["batch_size"]))
                        
                        # GPU memory release
                        gc.collect()
                        torch.cuda.empty_cache()
                        
                        # reestimate a new batch size and go back to train again
                        try:
                            estimated_batch_size = estimate_batch_size(training_model_object, mode = "train").recommended_batchsize
                            arcpy.AddMessage("The estimated batch size is: {0}".format(estimated_batch_size))
                            prepare_data_kwargs["batch_size"] = estimated_batch_size
                            estimate_batch_size_tried = True
                        except Exception as e:
                            exception = str(e)
                            if "unsupported model" in exception:
                                arcpy.AddError("Error: " + exception + ". Estimate Batch Size function does not support this model type. Training was not successful. Please manually specify a smaller batch size and run again.")
                            else:
                                arcpy.AddError("Error: " + exception + ". Estimate Batch Size function encounters that error. Training was not successful. Please manually specify a smaller batch size and run again.")
                            breakwhile = True
                    except ImportError:
                        arcpy.AddError("Error:" + exception + ".No estimate_batch_size function is found under arcgis.learn, so the tool can not estimate a new suitable batch size. Training was not successful. Please manually specify a smaller batch size and run again")
                        breakwhile = True
            else:
                arcpy.AddError("Error:" + exception + ".Training was not successful.")
                breakwhile = True

    # Transfer output if the target output folder is a cloud store, then delete local temp output folder
    if transfer_output and os.path.exists(out_folder):
        arcpy.AddMessage("Transferring model result to data store...")
        [acs, acs_out_folder] = original_out_folder.split(".acs\\")
        acs_root = acs + ".acs"
        arcio(acs_root).copytree(out_folder, os.path.dirname(acs_out_folder), {'SYNC_STRATEGY': 'OVERWRITE', 'RECURSIVE': 'YES'}) 
        arcpy.AddMessage("Finished Transferring model result to data store.")
        # delete the local temp folder which contains the saved trained model
        shutil.rmtree(out_folder)

    # delete the local temp input folder which contains the copy of input training data from cloud
    if isinstance(in_folders, str):
        in_folders = [in_folders]
    for index, in_folder in enumerate(in_folders):
        if in_folders_transferred[index] and os.path.exists(in_folder):
            shutil.rmtree(in_folder)
                
    # delete unused objects
    try:
        del data_bunch
    except NameError:
        pass

    try:
        del training_model_object
    except NameError:
        pass
            
    # GPU memory release
    gc.collect()
    torch.cuda.empty_cache()
        
if __name__ == '__main__':
    execute()
