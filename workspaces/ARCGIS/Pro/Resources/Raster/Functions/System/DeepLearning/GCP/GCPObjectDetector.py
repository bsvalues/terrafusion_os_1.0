'''
Copyright 2018 Esri

Licensed under the Apache License, Version 2.0 (the "License");

you may not use this file except in compliance with the License.

You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software

distributed under the License is distributed on an "AS IS" BASIS,

WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and

limitations under the License.
'''

import sys, os, importlib
import json

prf_root_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.append(prf_root_dir)

# Helper functions for writing python raster functions
import prf_utils
from fields import fields

import numpy as np
import math

# Only for PyTorch,  check if PyTorch is installed or not
try:
    import torch
    import torchvision
    from torchvision import transforms
    HAS_PYTORCH = True

except Exception as e:
    HAS_PYTORCH = False

import arcpy

from PIL import Image
from itertools import product

import numpy as np
import os

# FRCNN constants
FRCNN_CONF_THRESH = 0.5
FRCNN_CROP_SIZE = 200

# need change, for testing
SKIP_FRCNN = True

features = {
    'displayFieldName': '',
    'fieldAliases': {
        'FID': 'OID',
        'Classname': 'Classname',
        'Classvalue': 'Classvalue',
        'Value': 'Value',
        'Confidence': 'Confidence'
    },
    'geometryType': 'esriGeometryPoint',
    'fields': [
        {
            'name': 'OID',
            'type': 'esriFieldTypeOID',
            'alias': 'OID'
        },
        {
            'name': 'Classname',
            'type': 'esriFieldTypeString',
            'alias': 'Classname'
        },
        {
            'name': 'Classvalue',
            'type': 'esriFieldTypeInteger',
            'alias': 'Classvalue'
        },
        {
            'name': 'Value',
            'type': 'esriFieldTypeInteger',
            'alias': 'Value'
        },
        {
            'name': 'Confidence',
            'type': 'esriFieldTypeDouble',
            'alias': 'Confidence'
        }
    ],
    'features': []
}

# For Object Detection and Object Classification. Geometry Type accepted in ArcGIS Pro
class GeometryType:
    Point = 1
    Multipoint = 2
    Polyline = 3
    Polygon = 4


class GCPObjectDetector:
    def __init__(self):
        self.name = 'Ground Control Point Detector'
        self.description = 'This python raster function applies deep learning model to detect GCP in imagery'

    def initialize(self, **kwargs):
        '''
        This method is called first when inference starts. What it does is: loading the model emd file into inference GP tool, setting correct processor type(GPU or CPU), etc.
        '''

        # Read esri model definition (emd) file, and its content is stored in self.json_info for later access in this python raster function
        if 'model' not in kwargs:
            return

        model = kwargs['model'] # kwargs['model'] is the emd file
        model_as_file = True

        try:
            with open(model, 'r') as f:
                self.json_info = json.load(f)
        except FileNotFoundError:
            try:
                self.json_info = json.loads(model)
                model_as_file = False
            except json.decoder.JSONDecodeError:
                raise Exception("Invalid model argument")

        # Add current folder to the system path
        sys.path.append(os.path.dirname(__file__))

        framework = self.json_info['Framework']
        if 'ModelConfiguration' in self.json_info:
            if isinstance(self.json_info['ModelConfiguration'], str):
                ChildModelDetector = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration'])), 'ChildObjectDetector')
            else:
                ChildModelDetector = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration']['Name'])), 'ChildObjectDetector')
        else:
            raise Exception("Invalid model configuration")

        # Set processor type to be GPU or CPU
        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        device = None
        if 'device' in kwargs:
            device = kwargs['device']
            if device == -2:
                device = prf_utils.get_available_device()

        if device is not None:
            if device >= 0:
                os.environ['CUDA_VISIBLE_DEVICES'] = str(device)

                # Only for PyTorch
                # Set processor type to be GPU in PyTorch
                if not HAS_PYTORCH:
                    raise Exception("PyTorch is not installed. Install it using 'conda install deep-learning-essentials -y'")
                torch.cuda.set_device(device)
                self.device = torch.device("cuda")
                arcpy.env.processorType = "GPU"
                arcpy.env.gpuId = str(device)
            else:
                os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
                self.device = torch.device("cpu")
                arcpy.env.processorType = "CPU"

        # self.model_path stores the actual DL model file path from its emd file's 'ModelFile' attribute value and self.model_is_loaded flags for loading status for current DL model file
        model_path_retinanet = self.json_info['RetinaNetModelFile']
        emd_path_retinanet = self.json_info['RetinaNetEMD']
        if model_as_file and not os.path.isabs(model_path_retinanet):
            model_path_retinanet = os.path.abspath(os.path.join(os.path.dirname(model), model_path_retinanet))
        if model_as_file and not os.path.isabs(emd_path_retinanet):
            emd_path_retinanet = os.path.abspath(os.path.join(os.path.dirname(model), emd_path_retinanet))

        model_path_frcnn = self.json_info['FRCNNModelFile']
        if model_as_file and not os.path.isabs(model_path_frcnn):
            model_path_frcnn = os.path.abspath(os.path.join(os.path.dirname(model), model_path_frcnn))

        self.model_path_retinanet = model_path_retinanet
        self.emd_path_retinanet = emd_path_retinanet
        self.model_path_frcnn = model_path_frcnn
        self.model_is_loaded = False
        
        self.retinanet_child_object_detector = ChildModelDetector()
        with open(self.emd_path_retinanet, "r") as f:
            self.retinanet_child_object_detector.json_info = json.load(f)

    def load_model(self):
        import arcgis
        from arcgis.learn.models import RetinaNet
        
        # The following is the model loading code for the in-house RetinaNet model implemented in PyTorch.
        if not HAS_PYTORCH:
            raise Exception('PyTorch(version 1.1.0 or above) libraries are not installed. Install PyTorch using "conda install pytorch=1.1.0 ".')
        if arcpy.env.processorType == "GPU" and torch.cuda.is_available():
            self.retinanet_child_object_detector.device = torch.device("cuda")
            arcgis.env._processorType = "GPU"
        else:
            self.retinanet_child_object_detector.device = torch.device("cpu")
            arcgis.env._processorType = "CPU"
            
        self.retinanet_child_object_detector.retinanet = RetinaNet.from_model(emd_path=self.emd_path_retinanet)
        self.retinanet_child_object_detector._learnmodel = self.retinanet_child_object_detector.retinanet
        self.retinanet_child_object_detector.retinanet.learn.model = self.retinanet_child_object_detector.retinanet.learn.model.to(self.device)
        self.retinanet_child_object_detector.retinanet.learn.model.eval()
        
        # need change
        # self.model_frcnn = load_torch_model(self.model_frcnn, self.model_path_frcnn)
        # self.model_frcnn.eval()

    def getParameterInfo(self):
        '''
        This method is called after initialize() and provides information on each input parameter expected by the raster function. This method must be defined for the class to be recognized as a valid raster function. The first three parameters are mandatory as they define the input raster, emd, and device.
        After emd file or deep learning model package (dlpk) file is specified in inference GP tool, all the parameters (except raster, model and device) along with their default values, will be populated in the tool. Their default values are defined in this method or read from emd information through self.json_info.

        Tip: you can access emd information through self.json_info.
        '''
        required_parameters = [
            {
                'name': 'raster',
                'dataType': 'raster',
                'required': True,
                'displayName': 'Raster',
                'description': 'Input Raster'
            },
            {
                'name': 'model',
                'dataType': 'string',
                'required': True,
                'displayName': 'Input Model Definition (EMD) File',
                'description': 'Input model definition (EMD) JSON file'
            },
            {
                'name': 'device',
                'dataType': 'numeric',
                'required': False,
                'displayName': 'Device ID',
                'description': 'Device ID'
            }
        ]

        required_parameters.extend(
            [
                {
                    "name": "padding",
                    "dataType": "numeric",
                    "value": 0
                    if "Padding" not in self.json_info
                    else int(self.json_info["Padding"]),
                    "required": False,
                    "displayName": "Padding",
                    "description": "Padding",
                },
                {
                    "name": "threshold_retinanet",
                    "dataType": "numeric",
                    "value": 0.5 
                    if "Threshold_RETINANET" not in self.json_info
                    else float(self.json_info["Threshold_RETINANET"]),
                    "required": False,
                    "displayName": "Confidence Score Threshold [0.0, 1.0] for RetinaNet",
                    "description": "Confidence score threshold value [0.0, 1.0] for RetinaNet",
                },                {
                    "name": "threshold_frcnn",
                    "dataType": "numeric",
                    "value": 0.5 
                    if "Threshold_FRCNN" not in self.json_info
                    else float(self.json_info["Threshold_FRCNN"]),
                    "required": False,
                    "displayName": "Confidence Score Threshold [0.0, 1.0] for FRCNN",
                    "description": "Confidence score threshold value [0.0, 1.0] for FRCNN",
                },
                {
                    "name": "nms_overlap",
                    "dataType": "numeric",
                    "value": 0.1,
                    "required": False,
                    "displayName": "NMS Overlap",
                    "description": "Maximum allowed overlap within each chip",
                },
                {
                    "name": "batch_size",
                    "dataType": "numeric",
                    "required": False,
                    "value": 64 
                    if "BatchSize" not in self.json_info
                    else int(self.json_info["BatchSize"]),
                    "displayName": "Batch Size",
                    "description": "Batch Size",
                },
                {
                    "name": "exclude_pad_detections",
                    "dataType": "string",
                    "required": False,
                    "domain": ("True", "False"),
                    "value": "True",
                    "displayName": "Filter Outer Padding Detections",
                    "description": "Filter detections which are outside the specified padding",
                },
                {
                    "name": "test_time_augmentation",
                    "dataType": "string",
                    "required": False,
                    "value": "False"
                    if "test_time_augmentation" not in self.json_info
                    else str(self.json_info["test_time_augmentation"]),
                    "displayName": "Perform test time augmentation while predicting",
                    "description": "If True, will merge predictions from flipped and rotated images.",
                }
            ]       
        )

        return required_parameters

    def getConfiguration(self, **scalars):
        '''
        This method is used to set the properties/keys like padding, batch size, tile size, input bands, (detection) threshold and many more. This method, if defined, manages how the output raster is constructed. Decisions in this method may be based on the user-updated values of one or more scalar (non-raster) parameters. This method is invoked after .getParameterInfo() but before .updateRasterInfo() by which time all rasters will have been loaded.

        The scalars value contains all the parameter values that can be accessed by the parameter name. Some of the recognized properties/keys and their descriptions are listed here
        https://github.com/Esri/raster-functions/wiki/PythonRasterFunction#getConfiguration
        The full list of supported properties/keys is: padding,fixedTileSize, tx,ty,CropSizeFixed,batch_size,extractBands,dataRange,inheritProperties,invalidateProperties,resampling,BlackenAroundFeature,keyMetadata,compositeRasters,samplingFactor,_noUpdatePixels,resamplingType,supportsBandSelection, maskUpdated, byRef

        Remember to save the parameter values here as self.PARAMETER_NAME if you want to use the parameter values in other methods.

        '''
        if "padding" in scalars:
            self.padding = int(scalars["padding"])
        elif "Padding" in self.json_info:
            self.padding = int(self.json_info["Padding"])
        else:
            self.padding = int(scalars.get("padding", self.json_info["ImageHeight"] // 4))
        
        self.nms_overlap = float(
            scalars.get("nms_overlap", 0.1)
        )  ## Default 0.1 NMS Overlap.
        
        # The following is an example of how to save the parameter values here as self.PARAMETER_NAME if you want to use the parameter values in other methods.
        if "threshold_retinanet" in scalars:
            self.thres_retinanet = float(scalars["threshold_retinanet"])
        elif "Threshold_RetinaNet" in self.json_info:
            self.thres_retinanet = float(self.json_info["Threshold_RetinaNet"])
        else:
            self.thres_retinanet = 0.5
            
        if "threshold_frcnn" in scalars:
            self.thres_frcnn = float(scalars["threshold_frcnn"])
        elif "Threshold_FRCNN" in self.json_info:
            self.thres_frcnn = float(self.json_info["Threshold_FRCNN"])
        else:
            self.thres_frcnn = 0.5
            
        if "batch_size" in scalars:
            self.batch_size = int(scalars["batch_size"])
        elif "BatchSize" in self.json_info:
            self.batch_size = int(self.json_info["BatchSize"])
        else:
            self.batch_size = (int(math.sqrt(int(scalars.get("batch_size", 64)))) ** 2)
            
        self.filter_outer_padding_detections = scalars.get(
            "exclude_pad_detections", "True"
        ).lower() in [
            "true",
            "1",
            "t",
            "y",
            "yes",
        ] 
        
        self.rectangle_height, self.rectangle_width = prf_utils.calculate_rectangle_size_from_batch_size(self.batch_size)
        
        # ImageHeight and ImageWidth information which is passed through the getConfiguration method, ensures that ArcGIS delivers the pixel blocks of the correct size
        # ty, tx are tile sizes in x and y axis
        ty, tx = prf_utils.get_tile_size(self.json_info['ImageHeight'], self.json_info['ImageWidth'], self.padding, self.rectangle_height, self.rectangle_width)
        self.fixedTileSize = 1 
        self.ty = ty
        self.tx = tx

        configuration = self.retinanet_child_object_detector.getConfiguration(**scalars)
        self.retinanet_child_object_detector.thres = self.thres_retinanet
        if "DataRange" in self.json_info:
            configuration["dataRange"] = tuple(self.json_info["DataRange"])
        configuration["inheritProperties"] = 2 | 4 | 8
        configuration["inputMask"] = True

        self.use_tta = scalars.get("test_time_augmentation", "false").lower() in [
            "true",
            "1",
            "t",
            "y",
            "yes",
        ]
        self.nms_overlap = configuration["nms_overlap"]
        self.scalars = scalars

        return configuration

    def getFields(self):
        '''
        Use this method to return the JSON string fields of the output feature class. Fields are defined in fields.py or you can customize it to suit your own needs.
        '''
        return json.dumps(fields)

    def getGeometryType(self):
        '''
        Use this method if you use the Detect Objects Using Deep Learning tool and you want to declare the feature geometry type of the output detected objects. Typically, the output is a polygon feature class if the model is to draw bounding boxes around objects.
        '''
        return GeometryType.Point

    def vectorize(self, **pixelBlocks):
        '''
        Use this method if you use the Detect Objects Using Deep Learning tool. This method returns a dictionary in which the "output_vectors" property is a string of features in image space in JSON format. A typical workflow is below:

        1.Obtain the input image from pixelBlocks and transform to the shape of the model's input.
        2.Run the deep learning model on the input image tile. 
        3.Post-process the model's output as necessary. 
        4.Generate a feature JSON object, wrap it as a string in a dictionary and return the dictionary.
        '''
        # Each pixelBlocks is cropped from the input raster with a shape of (tx+2*padding) by (ty+2*padding)
        raster_mask = pixelBlocks['raster_mask']
        raster_pixels = pixelBlocks['raster_pixels']
        # Set pixel values in invalid areas to 0
        raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks['raster_pixels'] = raster_pixels

        # Call the deep learning framework specific load_model() defined previously to load the model file
        if not self.model_is_loaded:
            self.load_model()
            self.model_is_loaded = True

        # Call the deep learning framework specific inference code to run inference on your own model
        try:
            if not SKIP_FRCNN:
                detections_xs, detections_ys, detections_scores, detections_classes = self.inference(**pixelBlocks)
            else:
                polygon_list, scores, classes = self.inference(**pixelBlocks)
        except RuntimeError as e:
            if 'out of memory' in str(e):
                # arcpy.AddError('Runtime Error: ran out of GPU memory, please try a smaller batch size')
                raise RuntimeError("Ran out of GPU memory, please try a smaller batch size")
                return None
            else:
                # arcpy.AddError('Runtime Error:" + str(e) + "Inferencing was not successful.')
                raise RuntimeError("Inferencing was not successful.")
                return None

        features['features'] = []

        # Obtain label class name and value dictionary from emd file
        clsvalue_index_dict = {int(class_info['Value']): index for index, class_info in enumerate(self.json_info['Classes'])}

        for i in range(len(polygon_list)):
            center_x = int((polygon_list[i][0][1]+polygon_list[i][2][1])/2.0)
            center_y = int((polygon_list[i][0][0]+polygon_list[i][2][0])/2.0)

            rings = [[]]
            for j in range(polygon_list[i].shape[0]):
                rings[0].append(
                    [
                        polygon_list[i][j][1],  
                        polygon_list[i][j][0]   
                    ]
                )

            cls_idx = clsvalue_index_dict.get(int(classes[i]), -1)
            if cls_idx == -1:
                raise Exception("Detected object's class not found in emd file. Please check again.")


            features['features'].append({
                'attributes': {
                    'OID': i + 1,
                    'Classname': self.json_info['Classes'][cls_idx]['Name'],
                    'Classvalue': self.json_info['Classes'][cls_idx]['Value'],
                    'Value': self.json_info['Classes'][cls_idx]['Value'],
                    'Confidence': scores[i]
                },
                'geometry': {
                    'x': center_x,
                    'y': center_y
                }
            })
        # Wrap the json object as a string in dictionary, this is the final output of the entire python raster function
        return {'output_vectors': json.dumps(features)}

    def inference(self, **pixelBlocks):
        '''
        Fill this method to write your own inference python code and to inference your own model, and return bounding boxes, scores and classes. 
        Expected results format is described in the returns as below.

        :param batch: numpy array with shape (B, D, H, W), B is batch size, H, W is specified and equal to ImageHeight and ImageWidth in the emd file and D is the number of bands and equal to the length of ExtractBands in the emd.
        :param scalars: inference parameters, accessed by the parameter name, i.e. self.thres=float(scalars['threshold']). If you want to have more inference parameters, add it to the list of the previous getParameterInfo method.
        :return: 
          1. bounding boxes: python list representing bounding boxes whose length is equal to B, each element is [N,4] numpy array representing [ymin, xmin, ymax, xmax] with respect to the upper left corner of the image tile.
          2. scores: python list representing the score of each bounding box whose length is equal to B, each element is a [N,] numpy array
          3. classes: python list representing the class of each bounding box whose length is equal to B, each element is [N,] numpy array and its dype is np.uint8
        '''

        retinanet_detections_bounding_boxes, retinanet_detections_scores, retinanet_detections_classes  = self.retinanet_inference(**pixelBlocks)

        xs, ys, scores, classes = [], [], [], []
        
        if not SKIP_FRCNN:
            if self.fixedTileSize == 1:
                fixed_tile_size = True
            else:
                fixed_tile_size = False

            batch, batch_height, batch_width = \
                prf_utils.tile_to_batch(pixelBlocks['raster_pixels'],
                                        self.json_info['ImageHeight'],
                                        self.json_info['ImageWidth'],
                                        self.padding,
                                        fixed_tile_size=fixed_tile_size)
            
            for index in range(batch.shape[0]):
                if retinanet_detections_bounding_boxes[index] != []:
                    # for each image in batch, only highest confidence detection should be picked to decide center_x, center_y
                    keep_detection_index = np.argmax(retinanet_detections_scores[index])
                    box = retinanet_detections_bounding_boxes[index][keep_detection_index]
                    center_x = (box[0] + box[2]) / 2
                    center_y = (box[1] + box[3]) / 2

                    frcnn_crop_box = get_frcnn_crop( # use radius to find a crop defined by x-radius and y-radius, unless it near corner
                            round(center_x),
                            round(center_y),
                            self.json_info['ImageWidth'],
                            self.json_info['ImageHeight']
                        )

                    retinanet_detection_box = ( # retinanet_detection_box has detection box coordinates
                            round(box[0]),
                            round(box[1]),
                            round(box[2]),
                            round(box[3])
                        )
                    (col1, row1, col2 ,row2) = frcnn_crop_box
                    img_crop = batch[index][row1:row2+1,col1:col2+1,:] # H W D?
                    offset = {'x': col1, 'y': row1}  # crop up left corner coordinates in full_img co system
                    frcnn_detection = frcnn_inference(self.model_frcnn, img_crop, offset, retinanet_detection_box)
                    # need change, make it as a batch indexed array
                    if frcnn_detection:
                        if frcnn_detection['score'] > self.thres_frcnn:
                            xs.append(frcnn_detection['x'])
                            ys.append(frcnn_detection['y'])
                            scores.append(frcnn_detection['score'])
                            classes.append(frcnn_detection['label'])

        if not SKIP_FRCNN:
            return xs, ys, scores, classes
        else:
            return retinanet_detections_bounding_boxes, retinanet_detections_scores, retinanet_detections_classes

    def retinanet_inference(self, **pixelBlocks):
        import torch
        from fastai.vision.transform import dihedral_affine, rotate
        from fastai.vision import Image

        input_image = pixelBlocks["raster_pixels"].astype(np.float32)

        tile_size = input_image.shape[1]
        pad = self.retinanet_child_object_detector.padding

        allboxes = torch.empty(0,4)
        allclasses = []
        allscores = torch.empty(0)

        boxes_list, scores_list, labels_list = [], [], []
        transforms = [0]

        if self.use_tta:
            if self.json_info["ImageSpaceUsed"] == "MAP_SPACE":
                transforms = list(range(8))
            else:
                transforms = [
                    0,
                    2,
                ]  # no vertical flips for pixel space (oriented imagery)

        for k in transforms:
            out = dihedral_affine(Image(torch.tensor(input_image.copy() / 256.0)), k)
            pixelBlocksCopy = pixelBlocks.copy()
            pixelBlocksCopy["raster_pixels"] = (out.data * 256).numpy()
            polygons, scores, classes = self.detect_objects(**pixelBlocksCopy)

            bboxes = self.get_img_bbox(tile_size, polygons, scores, classes)
            if bboxes is not None:
                fixed_img_bboxes = dihedral_affine(bboxes, k)
                if k == 5 or k == 6:
                    fixed_img_bboxes = rotate(fixed_img_bboxes, 180)

                allboxes = torch.cat([allboxes, (fixed_img_bboxes.data[0]+1) / 2.0])
                allclasses = allclasses + fixed_img_bboxes.data[1].tolist()
                allscores = np.concatenate([allscores, torch.tensor(scores) * 0.01])

                boxes_list.append((fixed_img_bboxes.data[0] + 1) / 2.0)
                scores_list.append(torch.tensor(scores) * 0.01)  # normalize to [0,1]
                labels_list.append(fixed_img_bboxes.data[1].tolist())

        try:
            from ensemble_boxes import weighted_boxes_fusion

            iou_thr = self.nms_overlap
            skip_box_thr = 0.0001

            boxes, scores, labels = weighted_boxes_fusion(
                boxes_list,
                scores_list,
                labels_list,
                iou_thr=iou_thr,
                skip_box_thr=skip_box_thr,
            )
        except:
            import warnings

            warnings.warn("Unable to perform weighted boxes fusion... use NMS")
            boxes, scores, labels = np.array(allboxes), allscores, np.array(allclasses)

        bboxes = boxes * tile_size - pad
        polygons = self.convert_bounding_boxes_to_coord_list(bboxes)

            
        return polygons, np.array(scores * 100).astype(float), labels.astype(int)

    def get_img_bbox(self, tile_size, polygons, scores, classes):
        from fastai.vision import ImageBBox

        pad = self.retinanet_child_object_detector.padding
        bboxes = []
        for i, polygon in enumerate(polygons):
            x1, y1 = np.around(polygon).astype(int)[0]
            x2, y2 = np.around(polygon).astype(int)[2]
            bboxes.append([x1 + pad, y1 + pad, x2 + pad, y2 + pad])
        n = len(bboxes)
        if n > 0:
            return ImageBBox.create(
                tile_size,
                tile_size,
                bboxes,
                labels=classes,
                classes=["Background"] + [x["Name"] for x in self.json_info["Classes"]],
            )
        else:
            return None

    def convert_bounding_boxes_to_coord_list(self, bounding_boxes):
        """
        convert bounding box numpy array to python list of point arrays
        :param bounding_boxes: numpy array of shape [n, 4]
        :return: python array of point numpy arrays, each point array is in shape [4,2]
        """
        num_bounding_boxes = bounding_boxes.shape[0]
        bounding_box_coord_list = []
        for i in range(num_bounding_boxes):
            coord_array = np.empty(shape=(4, 2), dtype=float)
            coord_array[0][0] = bounding_boxes[i][0]
            coord_array[0][1] = bounding_boxes[i][1]

            coord_array[1][0] = bounding_boxes[i][0]
            coord_array[1][1] = bounding_boxes[i][3]

            coord_array[2][0] = bounding_boxes[i][2]
            coord_array[2][1] = bounding_boxes[i][3]

            coord_array[3][0] = bounding_boxes[i][2]
            coord_array[3][1] = bounding_boxes[i][1]

            bounding_box_coord_list.append(coord_array)

        return bounding_box_coord_list

    def detect_objects(self, **pixelBlocks):
        polygon_list, scores, classes = self.retinanet_child_object_detector.vectorize(
            **pixelBlocks
        )

        padding = self.retinanet_child_object_detector.padding
        keep_polygon = []
        keep_scores = []
        keep_classes = []

        chip_sz = self.json_info["ImageHeight"]

        for idx, polygon in enumerate(polygon_list):
            centroid = polygon.mean(0)
            i, j = int(centroid[0]) // chip_sz, int(centroid[1]) // chip_sz
            x, y = int(centroid[0]) % chip_sz, int(centroid[1]) % chip_sz

            x1, y1 = polygon[0]
            x2, y2 = polygon[2]

            # fix polygon by removing padded regions
            polygon[:, 0] = polygon[:, 0] - (2 * i + 1) * padding
            polygon[:, 1] = polygon[:, 1] - (2 * j + 1) * padding

            X1, Y1, X2, Y2 = (
                i * chip_sz,
                j * chip_sz,
                (i + 1) * chip_sz,
                (j + 1) * chip_sz,
            )
            t = 2.0  # within 2 pixels of edge

            # if centroid not in center, reduce confidence
            # so box can be filtered out during NMS
            if (
                x < padding
                or x > chip_sz - padding
                or y < padding
                and y > chip_sz - padding
            ):

                scores[idx] = (self.retinanet_child_object_detector.thres * 100) + scores[idx] * 0.01

            # if not excluded due to touching edge of tile
            if not (
                self.retinanet_child_object_detector.filter_outer_padding_detections
                and any(
                    [
                        abs(X1 - x1) < t,
                        abs(X2 - x2) < t,
                        abs(Y1 - y1) < t,
                        abs(Y2 - y2) < t,
                    ]
                )
            ):  # touches edge
                keep_polygon.append(polygon)
                keep_scores.append(scores[idx])
                keep_classes.append(classes[idx])

        return keep_polygon, keep_scores, keep_classes        

    def get_frcnn_crop(x, y, img_width, img_height): 
        def get_crop_dims(p, size):
            radius = round(FRCNN_CROP_SIZE / 2)
            if p - radius < 0:
                p1 = 0
                p2 = FRCNN_CROP_SIZE
            elif p + radius > size:
                p1 = size - FRCNN_CROP_SIZE
                p2 = size
            else:
                p1 = p - radius
                p2 = p + radius

            return p1, p2
    
        x1, x2 = get_crop_dims(x, img_width)
        y1, y2 = get_crop_dims(y, img_height)

        return (x1, y1, x2, y2)

    def frcnn_inference(frcnn_model, img, offset, box, transform = True):
        img_np = np.asarray(img, dtype='float32')
        img_np /= 255.
        img_np = np.transpose(img_np, [2, 0, 1])

        t = transforms.Compose([
            transforms.ToTensor()
        ])
        if transform:
            img_np = t(img_np)
        input = [img_np]
        out = model(input)
        scores = out[0]['scores'].cpu().detach().numpy()

        if scores.size > 0:
            index = np.argmax(scores)
            if scores[index] > FRCNN_CONF_THRESH:
                center = out[0]['centers'][index].cpu().detach().numpy()
                label = out[0]['labels'][index].cpu().detach().numpy()
                return {
                    'score':float(scores[index]),
                    'x':round(float(center[0])) + offset['x'],
                    'y':round(float(center[1])) + offset['y'],
                    'label':int(label),
                    'box':box,
                }
        return None

    def load_torch_model(m, p):
        sd = torch.load(p, map_location=torch.device('cpu'))
        m.load_state_dict(sd)
        return m