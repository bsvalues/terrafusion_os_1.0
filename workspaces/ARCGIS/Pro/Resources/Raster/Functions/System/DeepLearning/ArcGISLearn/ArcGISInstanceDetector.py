import sys, os, importlib
import json

sys.path.append(os.path.dirname(__file__))

import arcpy
import numpy as np
import math

from arcpy.ia.util import get_available_device

def get_centroid(polygon):
    polygon = np.array(polygon)
    return [polygon[:, 0].mean(), polygon[:, 1].mean()]        

def check_centroid_in_center(centroid, start_x, start_y, chip_sz, padding):
    return ((centroid[1] >= (start_y + padding)) and  \
                (centroid[1] <= (start_y + (chip_sz - padding))) and \
                (centroid[0] >= (start_x + padding)) and \
                (centroid[0] <= (start_x + (chip_sz - padding))))

def find_i_j(centroid, n_rows, n_cols, chip_sz, padding, filter_detections):
    for i in range(n_rows):
        for j in range(n_cols):
            start_x = i * chip_sz
            start_y = j * chip_sz

            if (centroid[1] > (start_y)) and (centroid[1] < (start_y + (chip_sz))) and (centroid[0] > (start_x)) and (centroid[0] < (start_x + (chip_sz))):
                in_center = check_centroid_in_center(centroid, start_x, start_y, chip_sz, padding)
                if filter_detections:
                    if in_center: 
                        return i, j, in_center
                else:
                    return i, j, in_center
    return None        

features = {
    'displayFieldName': '',
    'fieldAliases': {
        'FID': 'FID',
        'Class': 'Class',
        'Confidence': 'Confidence'
    },
    'geometryType': 'esriGeometryPolygon',
    'fields': [
        {
            'name': 'FID',
            'type': 'esriFieldTypeOID',
            'alias': 'FID'
        },
        {
            'name': 'Class',
            'type': 'esriFieldTypeString',
            'alias': 'Class'
        },
        {
            'name': 'Confidence',
            'type': 'esriFieldTypeDouble',
            'alias': 'Confidence'
        }
    ],
    'features': []
}

fields = {
    'fields': [
        {
            'name': 'OID',
            'type': 'esriFieldTypeOID',
            'alias': 'OID'
        },
        {
            'name': 'Class',
            'type': 'esriFieldTypeString',
            'alias': 'Class'
        },
        {
            'name': 'Confidence',
            'type': 'esriFieldTypeDouble',
            'alias': 'Confidence'
        },
        {
            'name': 'Shape',
            'type': 'esriFieldTypeGeometry',
            'alias': 'Shape'
        }
    ]
}

class GeometryType:
    Point = 1
    Multipoint = 2
    Polyline = 3
    Polygon = 4

class ArcGISInstanceDetector:
    def __init__(self):
        self.name = 'Instance Segmentation'
        self.description = 'Instance Segmentation python raster function to inference a arcgis.learn deep learning model.'

    def initialize(self, **kwargs):

        if 'model' not in kwargs:
            return

        model = kwargs['model']
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
        
        sys.path.append(os.path.dirname(__file__))
        framework = self.json_info['Framework']
        if 'ModelConfiguration' in self.json_info:
            if isinstance(self.json_info['ModelConfiguration'], str):
                ChildInstanceDetector = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration'])), 'ChildInstanceDetector')
            else:
                ChildInstanceDetector = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration']['Name'])), 'ChildInstanceDetector')
        else:
            raise Exception("Invalid model configuration")

        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        device = None
        if 'device' in kwargs:
            device = kwargs['device']
            if device == -2:
                device = get_available_device()

        if device is not None:
            if device >= 0:
                try:
                    import torch
                except Exception:
                    raise Exception("PyTorch is not installed. Install it using conda install -c esri deep-learning-essentials")
                torch.cuda.set_device(device)
                arcpy.env.processorType = "GPU"
                arcpy.env.gpuId = str(device)
            else:
                arcpy.env.processorType = "CPU"

        tempProcessorType = None
        if device is None:
            # this means we are in validation phase
            tempProcessorType = arcpy.env.processorType
            arcpy.env.processorType = "CPU"

        self.child_instance_detector = ChildInstanceDetector()
        self.child_instance_detector.initialize(model, model_as_file)

        if device is None:
            arcpy.env.processorType = tempProcessorType

    def getParameterInfo(self):       
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

        return self.child_instance_detector.getParameterInfo(required_parameters)


    def getConfiguration(self, **scalars):         
        configuration = self.child_instance_detector.getConfiguration(**scalars)
        if 'DataRange' in self.json_info:
            configuration['dataRange'] = tuple(self.json_info['DataRange'])
        configuration['inheritProperties'] = 2|4|8
        configuration['inputMask'] = True
        return configuration

    def getFields(self):
        return json.dumps(fields)

    def getGeometryType(self):          
        return GeometryType.Polygon        

    def vectorize(self, **pixelBlocks):
           
        raster_mask = pixelBlocks['raster_mask']
        raster_pixels = pixelBlocks['raster_pixels']
        raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks['raster_pixels'] = raster_pixels

        try:
            masks, pred_class, pred_score = self.child_instance_detector.vectorize(**pixelBlocks)
        except RuntimeError as e:
            if 'out of memory' in str(e):
                # arcpy.AddError('Runtime Error: ran out of GPU memory, please try a smaller batch size')
                raise RuntimeError("Ran out of GPU memory, please try a smaller batch size")
                return None
            else:
                # arcpy.AddError('Runtime Error:" + str(e) + "Inferencing was not successful.')
                raise RuntimeError("Inferencing was not successful.")
                return None

        n_rows = int(math.sqrt(self.child_instance_detector.batch_size))
        n_cols = int(math.sqrt(self.child_instance_detector.batch_size))
        padding = self.child_instance_detector.padding
        keep_masks = []
        keep_scores = []
        keep_classes = []       

        for idx, mask in enumerate(masks):
            if mask == []:
                continue
            centroid = get_centroid(mask[0])
            tytx = getattr(self.child_instance_detector, 'tytx', self.json_info['ImageHeight'])
            grid_location = find_i_j(centroid, n_rows, n_cols, tytx, padding, True)
            if grid_location is not None:
                i, j, in_center = grid_location
                for poly_id, polygon in enumerate(mask):
                    polygon = np.array(polygon)
                    polygon[:, 0] = polygon[:, 0] - (2*i + 1)*padding  # Inplace operation
                    polygon[:, 1] = polygon[:, 1] - (2*j + 1)*padding  # Inplace operation            
                    mask[poly_id] = polygon.tolist()
                if in_center:
                    keep_masks.append(mask)
                    keep_scores.append(pred_score[idx])
                    keep_classes.append(pred_class[idx])

        masks =  keep_masks
        pred_score = keep_scores
        pred_class = keep_classes        


        features['features'] = []

        for mask_idx, mask in enumerate(masks):

            features['features'].append({
                'attributes': {
                    'OID': mask_idx + 1,
                    'Class': self.json_info['Classes'][pred_class[mask_idx] - 1]['Name'],
                    'Confidence': pred_score[mask_idx]
                },
                'geometry': {
                    'rings': mask
                }
        }) 

        return {'output_vectors': json.dumps(features)}