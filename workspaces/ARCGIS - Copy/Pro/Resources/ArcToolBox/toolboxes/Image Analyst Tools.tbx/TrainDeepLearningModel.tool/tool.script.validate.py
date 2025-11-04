import arcpy
import os, json
import warnings
from rapathutils import swizzle_path

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

DATA_TO_MODEL = {
    "PASCAL_VOC_rectangles": [S_SSD, S_RETINA, S_YOLO, S_FRCNN, S_MMD, S_DETREG],
    "KITTI_rectangles": [S_SSD, S_RETINA, S_YOLO, S_FRCNN, S_MMD],
    "RCNN_Masks": [S_MRCNN, S_SM, S_PSETAE],
    "Classified_Tiles": [S_UNET, S_PSP, S_DL, S_BDCN, S_HED, S_MTRR, S_CD, S_CONNECT, S_MMS, S_SAMLORA],
    "Labeled_Tiles": [S_FC],
    "Imagenet": [S_FC, S_DSORT],
    "MultiLabeled_Tiles": [S_FC, S_IC],
    "Export_Tiles": [S_P2P, S_CGAN, S_SR, S_P2PHD, S_CLIMAX],
    "CycleGAN": [S_CGAN],
    "superres": [S_SR],
    "ChangeDetection": [S_CD],
    "Panoptic_Segmentation": [S_MDL]
}

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

MODEL_TO_BACKBONE = {
    S_SSD: "RESNET34",
    S_UNET: "RESNET34",
    S_FC: "RESNET34",
    S_PSP: "RESNET50",
    S_RETINA: "RESNET50",
    S_MRCNN: "RESNET50",
    S_YOLO: "DARKNET53",
    S_DL: "RESNET101",
    S_FRCNN: "RESNET50",
    S_BDCN: "VGG19",
    S_HED: "VGG19",
    S_MTRR: "RESNET34",
    S_P2P: "",
    S_CGAN: "",
    S_SR: "RESNET34",
    S_CD: "RESNET18",
    S_IC: "RESNET34",
    S_CONNECT: "RESNET34",
    S_SM: "RESNET50",
    S_MMD: "",
    S_MMS: "",
    S_DSORT: "REID_V2",
    S_P2PHD: "",
    S_MDL: "",
    S_DETREG: "RESNET50",
    S_PSETAE: "",
    S_SAMLORA: "VIT_B",
    S_CLIMAX: "5.625deg"
}

AUGMENTATION_TO_PARAMS = [
    ["rotate", "30.0;0.5"], 
    ["brightness", "(0.4,0.6);1.0"],
    ["contrast", "(0.75,1.5);1.0"],
    ["zoom", "(1.0,1.2);1.0"],
    ["crop", "224;1.0;(0,1);(0,1)"]
]

MODEL_TO_PARAMS = {
    S_SSD: [["grids", ""], ["zooms", "1.0"], ["ratios", "[1.0, 1.0]"], ["drop", "0.3"],["bias", "-0.4"],
                           ["focal_loss", "False"],["location_loss_factor", ""],["backend", "pytorch"]],
    S_UNET: [["class_balancing", "False"], ["mixup", "False"], ["focal_loss", "False"],
                       ["ignore_classes", ""], ["dice_loss_fraction", "0"], ["dice_loss_average", "micro"]],
    S_FC: [["mixup", "False"], ["oversample", "False"], ["backend", "pytorch"]],
    S_PSP: [["class_balancing", "False"], ["mixup", "False"], ["focal_loss", "False"], ["ignore_classes", ""],
                         ["use_unet", "True"], ["pyramid_sizes", "1, 2, 3, 6"], ["unet_aux_loss", "False"], ["pointrend", "False"],
                         ["dice_loss_fraction", "0"], ["dice_loss_average", "micro"], ["keep_dilation", "False"]],
    S_RETINA: [["scales", "1, 0.7937005259840998, 0.6299605249474366"], ["ratios", "0.5, 1, 2"]],
    S_MRCNN: [["rpn_pre_nms_top_n_train", "2000"], ["rpn_pre_nms_top_n_test", "1000"], ["rpn_post_nms_top_n_train", "2000"], ["rpn_post_nms_top_n_test", "1000"], 
                 ["rpn_nms_thresh", "0.7"], ["rpn_fg_iou_thresh", "0.7"], ["rpn_bg_iou_thresh", "0.3"], ["rpn_batch_size_per_image", "256"], 
                 ["rpn_positive_fraction", "0.5"], ["box_score_thresh", "0.05"], ["box_nms_thresh", "0.5"], ["box_detections_per_img", "100"], 
                 ["box_fg_iou_thresh", "0.5"], ["box_bg_iou_thresh", "0.5"], ["box_batch_size_per_image", "512"], ["box_positive_fraction", "0.25"]],
    S_YOLO: [],
    S_DL: [["class_balancing", "False"], ["mixup", "False"], ["focal_loss", "False"], ["ignore_classes", ""],
                ["pointrend", "False"], ["dice_loss_fraction", "0"], ["dice_loss_average", "micro"], ["keep_dilation", "False"]],
    S_FRCNN: [["rpn_pre_nms_top_n_train", "2000"], ["rpn_pre_nms_top_n_test", "1000"], ["rpn_post_nms_top_n_train", "2000"], ["rpn_post_nms_top_n_test", "1000"], 
                   ["rpn_nms_thresh", "0.7"], ["rpn_fg_iou_thresh", "0.7"], ["rpn_bg_iou_thresh", "0.3"], ["rpn_batch_size_per_image", "256"], 
                   ["rpn_positive_fraction", "0.5"], ["box_score_thresh", "0.05"], ["box_nms_thresh", "0.5"], ["box_detections_per_img", "100"], 
                   ["box_fg_iou_thresh", "0.5"], ["box_bg_iou_thresh", "0.5"], ["box_batch_size_per_image", "512"], ["box_positive_fraction", "0.25"]],
    S_BDCN: [],
    S_HED: [],
    S_MTRR: [["mtl_model", "hourglass"], ["gaussian_thresh", "0.76"], ["orient_bin_size", "20"], ["orient_theta", "8"]],
    S_P2P: [["perceptual_loss", "False"]],
    S_CGAN: [["gen_blocks", "9"], ["lsgan", "True"]],
    S_SR: [["downsample_factor", "4"]],
    S_CD: [["attention_type", "PAM"]],
    S_IC: [["decoder_params", "{'embed_size':100, 'hidden_size':100, 'attention_size':100, 'teacher_forcing':1, 'dropout':0.1, 'pretrained_emb':False}"]],
    S_CONNECT: [["mtl_model", "hourglass"], ["gaussian_thresh", "0.76"], ["orient_bin_size", "20"], ["orient_theta", "8"]],
    S_SM: [],
    S_MMD: [["model", "cascade_rcnn"], ["model_weight", "False"]],
    S_MMS: [["model", "mask2former"], ["model_weight", "False"], ["class_balancing", "False"], ["ignore_classes", ""], ["seq_len", "1"]],
    S_DSORT: [],
    S_P2PHD: [["n_gen_filters", "64"],["gen_network", "local"],["n_downsample_global", "4"],["n_blocks_global", "9"],["n_local_enhancers", "1"],
                  ["n_blocks_local", "3"],["norm", "instance"],["lsgan", "True"],["n_dscr_filters", "64"],["n_layers_dscr", "3"],
                  ["n_dscr", "2"],["feat_loss", "True"],["vgg_loss", "True"],["lambda_feat", "10"],["lambda_l1", "100"]],
    S_MDL: [["n_masks", "30"]],
    S_DETREG: [],
    S_PSETAE:[["mlp1", "32, 64"], ["pooling", "mean"], ["mlp2", "128, 128"], ["n_head", "4"], ["d_k", "32"], 
              ["dropout", "0.2"], ["T", "1000"], ["mlp4", "64, 32"], ["min_points", ""], ["timesteps_of_interest", ""],
              ["channels_of_interest", ""]],
    "SR3_SuperResolution":[["inner_channel", "64"], ["norm_groups", "32"], ["channel_mults", "1, 2, 4, 4, 8, 8"], ["attn_res", "16"],
                           ["res_blocks", "3"],["dropout", "0"], ["schedule", "linear"], ["n_timestep", "1000"], 
                           ["linear_start", "1e-06"], ["linear_end", "1e-02"]],
    "SR3_UViT_SuperResolution":[["patch_size", "16"], ["embed_dim", "768"], ["depth", "17"], 
                                ["num_heads", "12"], ["mlp_ratio", "4.0"],["qkv_bias", "False"]],
    S_SAMLORA:[["class_balancing", "False"], ["ignore_classes", ""]],
    S_CLIMAX:[["forecast_timesteps", "1"], ["hrs_each_step", "1"], ["patch_size", "2"], ["embed_dim", "1024"], 
              ["depth", "8"], ["num_heads", "16"], ["mlp_ratio", "4.0"], ["decoder_depth", "2"], 
              ["drop_path", "0.1"], ["drop_rate", "0.1"], ["parallel_patch_embed", "True"]]
}

MODEL_TO_BS = {
    S_SSD: 64,
    S_UNET: 8,
    S_FC: 64,
    S_PSP: 8,
    S_RETINA: 16,
    S_MRCNN: 4,
    S_YOLO: 16,
    S_DL: 8,
    S_FRCNN: 4,
    S_BDCN: 8,
    S_HED: 8,
    S_MTRR: 8,
    S_P2P: 2,
    S_CGAN: 2,
    S_SR: 2,
    S_CD: 2,
    S_IC: 2,
    S_CONNECT: 8,
    S_MMD: 4,
    S_MMS: 4,
    S_DSORT: 16,
    S_P2PHD: 2,
    S_MDL: 4,
    S_DETREG: 2,
    S_PSETAE: 128,
    S_SAMLORA: 8,
    S_CLIMAX: 4
}

DATA_MULTIFOLDER_SUPPORTED = {
     "PASCAL_VOC_rectangles",
     "RCNN_Masks",
     "Classified_Tiles",
     "Labeled_Tiles",
     "MultiLabeled_Tiles"
}

MODEL_CHIPSIZE_UNSUPPORTED = {S_SR, S_P2P, S_CGAN, S_SM}

DATA_RESIZETO_SUPPORTED = {
    "PASCAL_VOC_rectangles",  
    "Labeled_Tiles", 
    "superres",
    "Imagenet"
}

MMDETECTION_MODELS = {
    "atss", "carafe", "cascade_rcnn", "cascade_rpn", "dcn", "detectors", "dino", "double_heads", "dynamic_rcnn",
    "empirical_attention", "fcos", "foveabox", "fsaf", "ghm", "hrnet", "libra_rcnn","nas_fcos", "pafpn",
    "pisa", "regnet", "reppoints", "res2net", "sabl", "vfnet"
}

MMSEGMENTATION_MODELS = {
    "ann", "apcnet", "ccnet", "cgnet", "deeplabv3", "deeplabv3plus", "dmnet", "dnlnet", "emanet",
    "fastscnn", "fcn", "gcnet", "hrnet", "mask2former", "mobilenet_v2", "nonlocal_net", "ocrnet", 
    "prithvi100m", "psanet", "pspnet", "resnest", "sem_fpn", "unet", "upernet"
}

class ToolValidator(object):
    """Class for validating a tool's parameters and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        if self.params[0].value:
            in_folders =  [swizzle_path(i.value) for i in self.params[0].values]

            # set default output folder location under arcpy.env.workspace
            training_data_name = os.path.basename(in_folders[0])
            if arcpy.env.workspace:
                default_output_folder = os.path.join(os.path.dirname(arcpy.env.workspace), "models", training_data_name+"_DLmodel")
                default_output_folder_copy = default_output_folder
                copy = 1
                while os.path.exists(default_output_folder):
                    default_output_folder = default_output_folder_copy + "_" + str(copy)
                    copy += 1

                if not self.params[1].value:
                    self.params[1].value = default_output_folder
                    
            dataset_type = None
            stats_file_open = None
            numbands = 3
            tile_size = 40000 # just a big number, will change afterwards
            tilesizes_list = []
            have_supported_backbones = False
            special_model_list = False
            
            for in_folder_index in range(len(in_folders)):
                stats_file = os.path.join(in_folders[in_folder_index], "esri_accumulated_stats.json")
                if stats_file.find(".acs") > -1: # cloud storage acs input
                    from arcgisscripting import arcio, arciofileopen
                    [acs, acs_stats] = stats_file.split(".acs\\")
                    acs_root = acs + ".acs"
                    if arcio(acs_root).exists(acs_stats):
                        stats_file_open = arciofileopen(stats_file, 'r')
                else:
                    if os.path.exists(stats_file):
                        stats_file_open = open(stats_file, 'r')
                    else:
                        for root, d_names, f_names in os.walk(in_folders[in_folder_index]):
                            if os.path.realpath(root) == in_folders[in_folder_index] and "annotations.json" in f_names: # handle special annotations.json for Image Captioner model type
                                special_model_list = True
                                self.params[3].filter.list = [S_IC]
                                self.params[3].value = S_IC
                                break
                            elif os.path.realpath(root) == in_folders[in_folder_index] and "images" in d_names and "labels" in d_names: # handle external esri data for training object detection
                                labels_folder = os.path.join(root, "labels")
                                for label_file in os.listdir(labels_folder):
                                    if label_file.endswith(".xml") and not label_file.endswith(".tif.aux.xml"):
                                        dataset_type = "PASCAL_VOC_rectangles"
                                        break
                                    if label_file.endswith(".txt"):
                                        dataset_type = "KITTI_rectangles"
                                        break
                                break
                            elif os.path.realpath(root) == os.path.join(in_folders[in_folder_index], "A") and "esri_accumulated_stats.json" in f_names: # handle special A and B subfolders for "Export_Tiles" data formet and CycleGAN model type
                                stats_file = os.path.join(root, "esri_accumulated_stats.json")
                                special_model_list = True
                                self.params[3].filter.list = [S_CGAN]
                                self.params[3].value = S_CGAN
                                stats_file_open = open(stats_file, 'r')
                                break
                            elif "esri_accumulated_stats.json" in f_names and "esri_model_definition.emd" in f_names:  # handle ClimaX dataset and other cases
                                stats_file = os.path.join(root, "esri_accumulated_stats.json")
                                stats_file_open = open(stats_file, 'r')
                                emd_file = os.path.join(root, "esri_model_definition.emd")
                                emd_file_open = open(emd_file, 'r')
                                stats = json.load(stats_file_open)
                                emd = json.load(emd_file_open)
                                if stats.get("MetaDataMode") == "Export_Tiles" and emd.get("IsMultidimensional"): # handle ClimaX dataset
                                    emd_file_open.close()
                                    stats_file_open.close()
                                    special_model_list = True
                                    self.params[3].filter.list = [S_CLIMAX]
                                    self.params[3].value = S_CLIMAX
                                    stats_file_open = open(stats_file, 'r')
                                    break
                                else:
                                    emd_file_open.close()
                                    stats_file_open.close()
                                    stats_file_open = open(stats_file, 'r')
                                    break

                if stats_file_open:
                    stats = json.load(stats_file_open)
                    dataset_type = stats["MetaDataMode"]
                    numbands = stats["NumBands"]
                    tile_size_x = stats["TileSizeX"]
                    tile_size_y = stats["TileSizeY"]
                    tilesizes_list.append(tile_size_x)
                    tilesizes_list.append(tile_size_y)                    
                    tile_size_smaller = tile_size_x if tile_size_x < tile_size_y else tile_size_y
                    tile_size = tile_size_smaller if tile_size_smaller < tile_size else tile_size
                    stats_file_open.close()

                if in_folder_index == 0:
                    # use first input folder's info to determine default model type, resize_to, Weight Initialization Scheme enabling
                    # set default model type based on dataset type
                    if not special_model_list and dataset_type:
                        self.params[3].filter.list = DATA_TO_MODEL.get(dataset_type, [])
                    if not self.params[3].value:
                        self.params[3].value = self.params[3].filter.list[0]
                
                    # resize_to works only for "PASCAL_VOC_rectangles", "Labelled_Tiles", "superres" and "Imagenet"
                    if dataset_type in DATA_RESIZETO_SUPPORTED:
                        self.params[16].enabled = True
                        
                    # Weight Initialization Scheme only appears when a pre-trained model exists and input data is multispectral
                    if numbands > 3:
                        self.params[17].enabled = True
                        if not self.params[17].value:
                            self.params[17].value = "RANDOM"
                    else:
                        self.params[17].enabled = False

        if self.params[3].value:
            try:
                import arcgis.learn
                modelclass = MODEL_TO_MODELCLASS.get(self.params[3].value)
                
                training_model = getattr(arcgis.learn, modelclass)

                # generate supported backbone list for this model type
                if hasattr(training_model, "_supported_backbones"):
                    have_supported_backbones = True
                    backbone_list = training_model._supported_backbones()
                    self.params[7].filter.list = list(map(str.upper, backbone_list))
                    if not self.params[7].value:
                        self.params[7].value = MODEL_TO_BACKBONE.get(self.params[3].value)
                else:
                    self.params[7].enabled = False
                    self.params[7].value = ""

                # if current parameter table is empty, or the populated parameter values are the default ones, when a new model type is selected, the tool should update the populated parameter values as the newly selected model type's default ones. If users have changed parameter values, they will not be updated anymore.
                if not self.params[5].value or self.params[5].values in MODEL_TO_PARAMS.values():
                    # special case for SR3 backbone SuperResolution
                    if self.params[7].value == "SR3" and self.params[3].value == S_SR:
                        self.params[5].values = MODEL_TO_PARAMS["SR3_SuperResolution"]
                    elif self.params[7].value == "SR3_UVIT" and self.params[3].value == S_SR:
                        self.params[5].values = MODEL_TO_PARAMS["SR3_UViT_SuperResolution"]
                    else:
                        self.params[5].values = MODEL_TO_PARAMS[self.params[3].value]

                try:
                    tilesizes_list
                except NameError:
                    tilesizes_list = []
                    
                # chip_size is not supported for SuperResolution, SiamMask, Pix2Pix and CycleGAN
                if self.params[3].value not in MODEL_CHIPSIZE_UNSUPPORTED:
                    self.params[15].enabled = True
                    if not self.params[15].value or self.params[15].value in tilesizes_list:
                        if not tilesizes_list:
                            self.params[15].value = 224
                        else:
                            self.params[15].value = tile_size

                # resize_to is not supported for Deep Sort
                if self.params[3].value != S_DSORT:
                    self.params[16].enabled = True
            
                # generate supported monitor metric list for this model type
                if hasattr(training_model, "_available_metrics"):
                    monitor_metric_list = training_model._available_metrics()
                    if "f1" in monitor_metric_list:
                        monitor_metric_list[monitor_metric_list.index("f1")] = "f1_score"
                    # for Feature Classifier with MultiLabeled_Tiles dataset type there is another monitor metric: multi_label_fbeta
                    if self.params[3].value == S_FC and dataset_type == "MultiLabeled_Tiles":
                        monitor_metric_list.append("multi_label_fbeta")
                else:
                    monitor_metric_list = ["valid_loss"]
                self.params[18].filter.list = list(map(str.upper, monitor_metric_list))
            except ModuleNotFoundError:
                pass

        if not self.params[4].altered:
            if self.params[3].value in MODEL_TO_BS:
                self.params[4].value = MODEL_TO_BS.get(self.params[3].value)

        if self.params[4].value:
            if self.params[4].value <= 1:
                self.params[4].value = 1
            elif not isinstance(self.params[4].value, int):
                self.params[4].value = int(abs(round(self.params[4].value)))

        if self.params[6].value:
            self.params[6].value = abs(float(self.params[6].value))

        if self.params[9].value:
            if self.params[9].value < 0:
                self.params[9].value = 0
            if self.params[9].value > 100:
                self.params[9].value = 100

        if self.params[8].value:
            self.params[3].enabled = False
            self.params[3].value = ""
            self.params[5].enabled = False
            self.params[5].values = []
            self.params[7].enabled = False
            self.params[7].value = ""
        else:
            self.params[3].enabled = True
            self.params[5].enabled = True
            if have_supported_backbones:
                self.params[7].enabled = True
            
        # augmentation options
        self.params[14].enabled = True if self.params[13].value in ["CUSTOM"] else False

        # update augmentation values, use chip_size if it exists
        if self.params[14].enabled and (not self.params[14].value):
            self.params[14].values = AUGMENTATION_TO_PARAMS

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        validate_output_folder = False
        if self.params[0].value:
            try:
                import arcgis.learn
            except ModuleNotFoundError:
                self.params[0].setIDMessage("ERROR", 3772)
            if self.params[1].valueAsText:
                validate_output_folder = True

        if validate_output_folder or self.params[1].value:
            if os.path.exists(self.params[1].valueAsText) and os.listdir(self.params[1].valueAsText):
                self.params[1].setIDMessage("ERROR", 3610)

        if self.params[0].value:
            dataset_types = []
            numbands_list = []
            tilesizes_list = []
            in_folders =  [swizzle_path(i.value) for i in self.params[0].values]

            for in_folder in in_folders:
                stats_file = os.path.join(in_folder, "esri_accumulated_stats.json")
                dataset_type = None
                numbands = None
                stats_file_open = None

                if stats_file.find(".acs") > -1: # cloud storage acs input
                    from arcgisscripting import arcio, arciofileopen
                    [acs, acs_stats] = stats_file.split(".acs\\")
                    acs_root = acs + ".acs"
                    if arcio(acs_root).exists(acs_stats):
                        stats_file_open = arciofileopen(stats_file, 'r')
                else:
                    if os.path.exists(stats_file):
                        stats_file_open = open(stats_file, 'r')
                    else:
                        input_not_supported = True
                        for root, d_names, f_names in os.walk(in_folder):
                            if os.path.realpath(root) == in_folder and "annotations.json" in f_names: # handle special annotations.json for Image Captioner model type
                                input_not_supported = False
                                break
                            elif os.path.realpath(root) == in_folder and "images" in d_names and "labels" in d_names: # handle external esri data for training object detection
                                labels_folder = os.path.join(root, "labels")
                                labels_supported = False
                                for label_file in os.listdir(labels_folder):
                                    if (label_file.endswith(".xml") and not label_file.endswith(".tif.aux.xml")):
                                        dataset_type = "PASCAL_VOC_rectangles"
                                        import xml.etree.ElementTree as ET
                                        tree = ET.parse(os.path.join(labels_folder, label_file))
                                        root = tree.getroot()
                                        numbands = int(root.find("./size/depth").text)
                                        labels_supported = True
                                        break
                                    elif label_file.endswith(".txt"):
                                        dataset_type = "KITTI_rectangles"
                                        numbands = 3
                                        labels_supported = True
                                        break                                       
                                if not labels_supported:
                                    self.params[0].setErrorMessage("This training data was not created in Esri format, and the label file format is not supported")
                                input_not_supported = False
                                break
                            elif os.path.realpath(root) == os.path.join(in_folder, "A") and "esri_accumulated_stats.json" in f_names: # handle special A and B subfolders for "Export_Tiles" data formet and CycleGAN model type
                                stats_file = os.path.join(root, "esri_accumulated_stats.json")
                                stats_file_open = open(stats_file, 'r')
                                input_not_supported = False
                                break
                            elif "esri_accumulated_stats.json" in f_names and "esri_model_definition.emd" in f_names:  # handle ClimaX dataset and other cases
                                stats_file = os.path.join(root, "esri_accumulated_stats.json")
                                stats_file_open = open(stats_file, 'r')
                                emd_file = os.path.join(root, "esri_model_definition.emd")
                                emd_file_open = open(emd_file, 'r')
                                stats = json.load(stats_file_open)
                                emd = json.load(emd_file_open)
                                if stats.get("MetaDataMode") == "Export_Tiles" and emd.get("IsMultidimensional"): # handle ClimaX dataset
                                    emd_file_open.close()
                                    stats_file_open.close()
                                    stats_file_open = open(stats_file, 'r')
                                    input_not_supported = False
                                    break
                                else:
                                    emd_file_open.close()
                                    stats_file_open.close()
                                    stats_file_open = open(stats_file, 'r')
                                    input_not_supported = False
                                    break
                        if input_not_supported:
                            self.params[0].setErrorMessage("The input training data folder contains unsupported subdirectories. Please check.")

                if stats_file_open:
                    stats = json.load(stats_file_open)
                    dataset_type = stats["MetaDataMode"]
                    numbands = stats["NumBands"]
                    tile_size_x = stats["TileSizeX"]
                    tile_size_y = stats["TileSizeY"]
                    tilesizes_list.append(tile_size_x)
                    tilesizes_list.append(tile_size_y)
                    stats_file_open.close()
                dataset_types.append(dataset_type)
                numbands_list.append(numbands)

            if len(dataset_types) > 1:
                if None in dataset_types or (not all(dataset_types[0] == type for type in dataset_types)):
                    self.params[0].setErrorMessage("The MetaDataMode of all input training data folders must match")
                if None in numbands_list or (not all(numbands_list[0] == nb for nb in numbands_list)):
                    self.params[0].setErrorMessage("The NumBands of all input training data folders must match")
                for dataset_type in dataset_types:
                    if dataset_type not in DATA_MULTIFOLDER_SUPPORTED:
                        self.params[0].setErrorMessage("For multi folder training, only the following metadatamodes are supported : PASCAL_VOC_rectangles, RCNN_Masks, Classified_Tiles, Labeled_Tiles, MultiLabeled_Tiles")

            # validate chip_size
            if self.params[15].value:
                if not isinstance(self.params[15].value, int):
                    self.params[15].setErrorMessage("Invalid parameter. chip_size should be int. For example, 224")
                if tilesizes_list and self.params[15].value > min(tilesizes_list):
                    self.params[15].setErrorMessage("Invalid parameter. chip_size should be no more than the smallest x- or y- tile size of all input folders' images")

        if self.params[2].value:
            if not isinstance(self.params[2].value, int):
                self.params[2].setErrorMessage("Invalid Parameter")

        # validate model arguments
        if self.params[5].values:
            for name_value_pair in self.params[5].values:
                if name_value_pair[1]:
                    param_name = name_value_pair[0]
                    try:
                        param_value = eval(name_value_pair[1])
                    except NameError:
                        param_value = name_value_pair[1]

                    if self.params[3].value == S_SSD:
                        if param_name in ["grids", "zooms", "ratios"] and not isinstance(param_value, (list,int,float,tuple,type(None))):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SSD, grids, zooms, ratios should be list. For example, grids:1,2,4 zooms:1,2 ratios:[1,2],[2,1]")
                        if param_name in ["drop", "location_loss_factor"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SSD, drop and location_loss_factor should be float between 0.0 and 1.0. For example, drop: 0.3")
                        if param_name in ["bias"] and not (isinstance(param_value, (int, float))):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SSD, bias should be float between 0.0 and 1.0. For example, bias: -0.4")
                        if param_name in ["focal_loss"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SSD, focal_loss should be boolean. For example, focal_loss: False")
                        if param_name in ["backend"] and not (param_value in ["pytorch", "tensorflow"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SSD, backend should be either pytorch or tensorflow. For example, backend: pytorch")
                            
                    if self.params[3].value == S_UNET:
                        if param_name in ["class_balancing", "mixup", "focal_loss"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For UNet, class_balancing, mixup, focal_loss should be boolean. For example, class_balancing: False")
                        if param_name in ["ignore_classes"] and not isinstance(param_value, (list,int,tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For UNet, ignore_classes should be list. For example, ignore_classes: 1,2")
                        if param_name in ["dice_loss_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For UNet, dice_loss_fraction should be float between 0.0 and 1.0. For example, dice_loss_fraction: 0.1")
                        if param_name in ["dice_loss_average"] and not (param_value in ["micro", "macro"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For UNet, dice_loss_average should be either micro or macro. For example, dice_loss_average: micro")

                    if self.params[3].value == S_FC:
                        if param_name in ["mixup", "oversample"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Feature Classifier,  mixup, oversample should be boolean. For example, mixup: False")
                        if param_name in ["backend"] and not (param_value in ["pytorch", "tensorflow"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Feature Classifier, backend should be either pytorch or tensorflow. For example, backend: pytorch")

                    if self.params[3].value == S_PSP:
                        # in "if param_name in param_list and ...", if param_list contains more than 4 items, typing arguments inside during calling arcpy.ia.TrainDeepLearningModel() will crash Pro.
                        if param_name in ["use_unet", "unet_aux_loss", "class_balancing", "mixup"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSPNet, use_unet, unet_aux_loss, class_balancing, mixup should be boolean. unet_aux_loss is applicable only if use_unet is True. For example, use_unet:True unet_aux_loss:False class_balancing:False mixup:False")
                        if param_name in ["focal_loss", "pointrend", "keep_dilation"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSPNet, focal_loss, pointrend, keep_dilation should be boolean. For example, focal_loss:False pointrend:False keep_dilation:False")
                        if param_name in ["pyramid_sizes", "ignore_classes"] and not isinstance(param_value, (list,int,tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSPNet, pyramid_sizes, ignore_classes should be list. For example, ignore_classes: 1,2")
                        if param_name in ["dice_loss_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSPNet, dice_loss_fraction should be float between 0.0 and 1.0. For example, dice_loss_fraction: 0.1")
                        if param_name in ["dice_loss_average"] and not (param_value in ["micro", "macro"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSPNet, dice_loss_average should be either micro or macro. For example, dice_loss_average: micro")

                    if self.params[3].value == S_RETINA:
                        if param_name in ["scales", "ratios"] and not isinstance(param_value, (list,int,float,tuple, type(None))):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For RetinaNet, scales, ratios should be list. For example, scales: 1, 0.7, 1.3, ratios: 0.5, 1, 2")
                            
                    if self.params[3].value == S_MRCNN:
                        if param_name in ["rpn_nms_thresh", "rpn_fg_iou_thresh", "rpn_bg_iou_thresh", "rpn_positive_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MaskRCNN, rpn_nms_thresh, rpn_fg_iou_thresh, rpn_bg_iou_thresh, rpn_positive_fraction should be float between 0.0 and 1.0. For example, rpn_nms_thresh:0.7 rpn_fg_iou_thresh:0.7 rpn_bg_iou_thresh:0.3 rpn_positive_fraction:0.5")
                        if param_name in ["box_score_thresh", "box_nms_thresh", "box_fg_iou_thresh", "box_bg_iou_thresh"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MaskRCNN, box_score_thresh, box_nms_thresh, box_fg_iou_thresh, box_bg_iou_thresh should be float between 0.0 and 1.0. For example, box_score_thresh:0.05 box_nms_thresh:0.5 box_fg_iou_thresh:0.5 box_bg_iou_thresh:0.5")
                        if param_name in ["box_positive_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MaskRCNN, box_positive_fraction should be float between 0.0 and 1.0. For example, box_positive_fraction:0.25 ")
                            
                    if self.params[3].value == S_DL:
                        if param_name in ["class_balancing", "mixup", "focal_loss", "pointrend"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For DeepLab, class_balancing, mixup, focal_loss, pointrend should be boolean. For example, class_balancing:False mixup:False focal_loss:False pointrend:False")
                        if param_name in ["keep_dilation"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For DeepLab, keep_dilation should be boolean. For example, keep_dilation:False")
                        if param_name in ["ignore_classes"] and not isinstance(param_value, (list,int,tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For DeepLab, ignore_classes should be list. For example, ignore_classes: 1, 2")
                        if param_name in ["dice_loss_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For DeepLab, dice_loss_fraction should be float between 0.0 and 1.0. For example, dice_loss_fraction: 0.1")
                        if param_name in ["dice_loss_average"] and not (param_value in ["micro", "macro"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For DeepLab, dice_loss_average should be either micro or macro. For example, dice_loss_average: micro")

                    if self.params[3].value == S_FRCNN:
                        if param_name in ["rpn_nms_thresh", "rpn_fg_iou_thresh", "rpn_bg_iou_thresh", "rpn_positive_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For FasterRCNN, rpn_nms_thresh, rpn_fg_iou_thresh, rpn_bg_iou_thresh, rpn_positive_fraction should be float between 0.0 and 1.0. For example, rpn_nms_thresh:0.7 rpn_fg_iou_thresh:0.7 rpn_bg_iou_thresh:0.3 rpn_positive_fraction:0.5")
                        if param_name in ["box_score_thresh", "box_nms_thresh", "box_fg_iou_thresh", "box_bg_iou_thresh"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For FasterRCNN, box_score_thresh, box_nms_thresh, box_fg_iou_thresh, box_bg_iou_thresh should be float between 0.0 and 1.0. For example, box_score_thresh:0.05 box_nms_thresh:0.5 box_fg_iou_thresh:0.5 box_bg_iou_thresh:0.5")
                        if param_name in ["box_positive_fraction"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For FasterRCNN, box_positive_fraction should be float between 0.0 and 1.0. For example, box_positive_fraction:0.25 ")

                    if self.params[3].value == S_MTRR:
                        if param_name in ["gaussian_thresh"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Multi Task Road Extractor, gaussian_thresh should be float between 0.0 and 1.0. For example, gaussian_thresh:0.76")
                        if param_name in ["mtl_model"] and not (param_value in ["hourglass", "linknet"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Multi Task Road Extractor, mtl_model should be either hourglass or linknet. For example, mtl_model:hourglass")
                        if param_name in ["orient_bin_size"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Multi Task Road Extractor, orient_bin_size should be int. For example, orient_bin_size:20")
                        if param_name in ["orient_theta"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Multi Task Road Extractor, orient_theta should be int. For example, orient_theta:8")

                    if self.params[3].value == S_P2P:
                        if param_name in ["perceptual_loss"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2Pix, perceptual_loss should be boolean. For example, perceptual_loss: False")

                    if self.params[3].value == S_CGAN:
                        if param_name in ["gen_blocks"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For CycleGAN, gen_blocks should be int. For example, gen_blocks:9")
                        if param_name in ["lsgan"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For CycleGAN, lsgan should be boolean. For example, lsgan: True")

                    if self.params[3].value == S_SR:
                        if self.params[7].value == "SR3":
                            if param_name in ["inner_channel", "norm_groups", "attn_res"] and not isinstance(param_value, int):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3 backbone, inner_channel, norm_groups, attn_res should be int. For example, inner_channel:64 norm_groups:32 attn_res:16")
                            if param_name in ["res_blocks", "dropout", "n_timestep"] and not isinstance(param_value, int):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3 backbone, res_blocks, dropout, n_timestep should be int. For example, res_blocks:3 dropout:0 n_timestep:1000")
                            if param_name in ["channel_mults"] and not isinstance(param_value, (list,int,tuple)):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3 backbone, channel_mults should be list. For example, channel_mults: 1,2,4,4,8,8")
                            if param_name in ["schedule"] and not (param_value in ["linear", "warmup10", "warmup50", "const", "jsd", "cosine"]):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3 backbone, schedule should be one of these values: linear, warmup10, warmup50, const, jsd, cosine. For example, schedule: linear")
                            if param_name in ["linear_start", "linear_end"] and not isinstance(param_value, float):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3 backbone, linear_start, linear_end should be float. For example, linear_start:1e-06 linear_end:1e-02")
                        elif self.params[7].value == "SR3_UVIT":
                            if param_name in ["patch_size", "embed_dim", "depth", "num_heads"] and not isinstance(param_value, int):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3_UViT backbone, patch_size, embed_dim, depth, num_heads should be int. For example, patch_size:16 embed_dim:768 depth:17 num_heads:12")
                            if param_name in ["mlp_ratio"] and not (isinstance(param_value, (int, float))):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3_UViT backbone, mlp_ratio should be float. For example, mlp_ratio:4.0")
                            if param_name in ["qkv_bias"] and not isinstance(param_value, bool):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution with SR3_UViT backbone, qkv_bias should be boolean. For example, qkv_bias: False")
                        else:
                            if param_name in ["downsample_factor"] and not isinstance(param_value, int):
                                self.params[5].setErrorMessage(
                                    "Invalid parameter. For SuperResolution, downsample_factor should be int. For example, downsample_factor:4")

                    if self.params[3].value == S_CD:
                        if param_name in ["attention_type"] and not (param_value in ["PAM", "BAM"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Change Detector, attention_type should be either PAM or BAM. For example, mtl_model:PAM")

                    if self.params[3].value == S_IC:
                        if param_name in ["decoder_params"] and not isinstance(param_value, dict):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Image Captioner, decoder_params should be a dictionary. The keys of the dictionary are 'embed_size', 'hidden_size', 'attention_size','teacher_forcing', 'dropout' and 'pretrained_embeddings'.")

                    if self.params[3].value == S_CONNECT:
                        if param_name in ["gaussian_thresh"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ConnectNet, gaussian_thresh should be float between 0.0 and 1.0. For example, gaussian_thresh:0.76")
                        if param_name in ["mtl_model"] and not (param_value in ["hourglass", "linknet"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ConnectNet, mtl_model should be either hourglass or linknet. For example, mtl_model:hourglass")
                        if param_name in ["orient_bin_size", "orient_theta"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ConnectNet, orient_bin_size, orient_theta should be int. For example, orient_bin_size:20 orient_theta:8")

                    if self.params[3].value == S_MMD:
                        if param_name in ["model"] and not (param_value in MMDETECTION_MODELS or os.path.exists(param_value)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMDetection, model could be one of the supported model names:" + str(MMDETECTION_MODELS) + " or could be path to the configuration file from MMDetection repository"+ \
                                   "https://github.com/open-mmlab/mmdetection/tree/master/configs .For example, model:vfnet, model: C:\\vfnet_r101_fpn_1x_coco.py \
                                   .Remember to use double backslashes \\ instead of single \ in the path.")
                        if param_name in ["model_weight"] and not (not param_value or os.path.exists(param_value)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMDetection, model_weight should be False or path of the model weight from MMDetection repository"+ \
                                   "https://github.com/open-mmlab/mmdetection/tree/master/configs .For example, model_weight:False, model_weight: C:\\vfnet_r50_fpn_1x_coco_20201027-38db6f58.pth \
                                   .Remember to use double backslashes \\ instead of single \ in the path.")

                    if self.params[3].value == S_MMS:
                        if param_name in ["model"] and not (param_value in MMSEGMENTATION_MODELS or os.path.exists(param_value)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMSegmentation, model could be one of the supported model names:" + str(MMSEGMENTATION_MODELS) + " or could be path to the configuration file from MMSegmentation repository"+ \
                                   "https://github.com/open-mmlab/mmsegmentation/tree/master/configs .For example, model:mask2former, model: C:\\deeplabv3plus_r101-d16-mg124_512x1024_40k_cityscapes.py \
                                   .Remember to use double backslashes \\ instead of single \ in the path.")
                        if param_name in ["model_weight"] and not (not param_value or os.path.exists(param_value)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMSegmentation, model_weight should be False or path of the model weight from MMSegmentation repository"+ \
                                   "https://github.com/open-mmlab/mmsegmentation/tree/master/configs .For example, model_weight:False, model_weight: C:\\deeplabv3plus_r101-d16-mg124_512x1024_40k_cityscapes_20200908_005644-cf9ce186.pth \
                                   .Remember to use double backslashes \\ instead of single \ in the path.")
                        if param_name in ["class_balancing"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMSegmentation, class_balancing should be boolean. For example, class_balancing: False")
                        if param_name in ["ignore_classes"] and not isinstance(param_value, (list,int,tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMSegmentation, ignore_classes should be list. For example, ignore_classes: 1,2")
                        if param_name in ["seq_len"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MMSegmentation, seq_len should be int. For example, seq_len:1")
                    
                    if self.params[3].value == S_P2PHD:
                        if param_name in ["n_gen_filters", "n_downsample_global", "n_blocks_global", "n_local_enhancers"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, n_gen_filters, n_downsample_global, n_blocks_global, n_local_enhancers should be int. For example, n_gen_filters:64 n_downsample_global:4 n_blocks_global:9 n_local_enhancers:1")
                        if param_name in ["n_blocks_local", "n_dscr_filters", "n_layers_dscr", "n_dscr"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, n_blocks_local, n_dscr_filters, n_layers_dscr, n_dscr should be int. For example, n_blocks_local:3 n_dscr_filters:64 n_layers_dscr:3 n_dscr:2")                            
                        if param_name in ["lambda_feat", "lambda_l1"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, lambda_feat, lambda_l1 should be int. For example, lambda_feat:10 lambda_l1:100")  
                        if param_name in ["gen_network"] and not (param_value in ["global", "local"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, gen_network should be one of these values: global, local. For example, gen_network:local")
                        if param_name in ["norm"] and not (param_value in ["instance", "batch"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, norm should be one of these values: instance, batch. For example, norm:instance")
                        if param_name in ["lsgan", "feat_loss", "vgg_loss"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For Pix2PixHD, lsgan, feat_loss, vgg_loss should be boolean. For example, lsgan:True feat_loss:True vgg_loss:True")

                    if self.params[3].value == S_MDL:
                        if param_name in ["n_masks"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For MaXDeepLab, n_masks should be int. For example, n_masks:30")
                            
                    if self.params[3].value == S_PSETAE:
                        if param_name in ["mlp1", "mlp2", "mlp4"] and not (isinstance(param_value, (list, tuple))):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSETAE, mlp1, mlp2, mlp4 should be list of integers. For example, mlp1: 32, 64, mlp2: 128, 128, mlp4: 64, 32")
                        if param_name in ["pooling"] and not (param_value in ["mean", "std", "max", "min"]):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSETAE, pooling should be one of these values: mean, std, max, min. For example, pooling:mean")
                        if param_name in ["n_head", "d_k", "T", "min_points"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSETAE, n_head, d_k, T, min_points should be int. For example, n_head:4 d_k:32 T:1000 min_points:64")
                        if param_name in ["dropout"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSETAE, dropout should be float between 0.0 and 1.0. For example, dropout:0.2")
                        if param_name in ["timesteps_of_interest", "channels_of_interest"] and not isinstance(param_value, (list, int, tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For PSETAE, timesteps_of_interest, channels_of_interest should be list of integers. For example, timesteps_of_interest: 0,1,2 channels_of_interest: 0,1,2")

                    if self.params[3].value == S_SAMLORA:
                        if param_name in ["class_balancing"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SamLoRA, class_balancing should be boolean. For example, class_balancing: True")
                        if param_name in ["ignore_classes"] and not isinstance(param_value, (list,int,tuple)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For SamLoRA, ignore_classes should be list. For example, ignore_classes: 1, 2")

                    if self.params[3].value == S_CLIMAX:
                        if param_name in ["forecast_timesteps", "hrs_each_step", "patch_size", "embed_dim"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ClimaX, forecast_timesteps, hrs_each_step, patch_size, embed_dim should be int. For example, forecast_timesteps:1 hrs_each_step:1 patch_size:2  embed_dim:1024")
                        if param_name in ["depth", "num_heads", "decoder_depth"] and not isinstance(param_value, int):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ClimaX, depth, num_heads, decoder_depth should be int. For example, depth:8 num_heads:16 decoder_depth:2")
                        if param_name in ["mlp_ratio"] and not isinstance(param_value, (int, float)):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ClimaX, mlp_ratio should be int or float. For example, mlp_ratio:4.0")
                        if param_name in ["drop_path", "drop_rate"] and not (isinstance(param_value, (int, float)) and param_value <= 1.0 and param_value >= 0.0):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ClimaX, drop_path, drop_rate should be should be float between 0.0 and 1.0. For example, drop_path:0.1 drop_rate:0.1")
                        if param_name in ["parallel_patch_embed"] and not isinstance(param_value, bool):
                            self.params[5].setErrorMessage(
                                "Invalid parameter. For ClimaX, parallel_patch_embed should be boolean. For example, parallel_patch_embed: True")
        # validate resize_to values
        if self.params[16].value:
            try:
                resize_to = eval(self.params[16].value)
                if not ((isinstance(resize_to, int) and resize_to > 0) or (isinstance(resize_to, tuple) and len(resize_to) == 2 and resize_to[0] > 0 and resize_to[1] > 0)):
                    self.params[16].setErrorMessage("Invalid parameter. resize_to should be either one positive integer or two positive integers, separated by a comma. For example: 224 or 224,256. If one integer, it represents both resized height and weight. If two integers, they represent resized height and weight, respectively")
            except Exception:
                self.params[16].setErrorMessage("Invalid parameter. resize_to should be either one positive integer or two positive integers, separated by a comma. For example: 224 or 224,256. If one integer, it represents both resized height and weight. If two integers, they represent resized height and weight, respectively")

        # validation augmentation custom file
        if self.params[13].value in ["FILE"] and not os.path.isfile(os.path.join(in_folders[0], "transforms.json")):
            self.params[13].setErrorMessage("Invalid parameter. The current input training data folder does not have transforms.json file, which should contain the transforms.")

        return
