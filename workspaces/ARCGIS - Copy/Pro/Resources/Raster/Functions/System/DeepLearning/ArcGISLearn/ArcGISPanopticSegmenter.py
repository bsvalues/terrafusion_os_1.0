import sys, os, importlib
import json

sys.path.append(os.path.dirname(__file__))

import arcpy
import numpy as np
import math

from arcpy.ia.util import get_available_device

# utility functions for object detection
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

attribute_table = {
    'displayFieldName': '',
    'fieldAliases': {
        'OID': 'OID',
        'Value': 'Value',
        'Class': 'Class',
        'Red': 'Red',
        'Green': 'Green',
        'Blue': 'Blue'
    },
    'fields': [
        {
            'name': 'OID',
            'type': 'esriFieldTypeOID',
            'alias': 'OID'
        },
        {
            'name': 'Value',
            'type': 'esriFieldTypeInteger',
            'alias': 'Value'
        },
        {
            'name': 'Class',
            'type': 'esriFieldTypeString',
            'alias': 'Class'
        },
        {
            'name': 'Red',
            'type': 'esriFieldTypeInteger',
            'alias': 'Red'
        },
        {
            'name': 'Green',
            'type': 'esriFieldTypeInteger',
            'alias': 'Green'
        },
        {
            'name': 'Blue',
            'type': 'esriFieldTypeInteger',
            'alias': 'Blue'
        }
    ],
    'features': []
}

class GeometryType:
    Point = 1
    Multipoint = 2
    Polyline = 3
    Polygon = 4


class ArcGISPanopticSegmenter:
    def __init__(self):
        self.name = 'Panoptic Segmenter'
        self.description = 'This python raster function applies deep learning model to detect object instances in imagery and segment rasters by classes'

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

        # sys.path.append(os.path.dirname(__file__))
        framework = self.json_info['Framework']
        if 'ModelConfiguration' in self.json_info:
            ChildPanopticSegmenter = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration'])), 'ChildPanopticSegmenter')
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

        self.child_panoptic_segmenter = ChildPanopticSegmenter()
        self.child_panoptic_segmenter.initialize(model, model_as_file)

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

        required_parameters = self.child_panoptic_segmenter.getParameterInfo(required_parameters)
        required_parameters.extend(
            [
                {
                    'name': 'output_classified_raster',
                    'dataType': 'string',
                    'required': False,
                    'displayName': 'Output Classified Raster',
                    'description': 'Output Classified Raster'
                }
            ]
        )
        return required_parameters

    def getConfiguration(self, **scalars):
        configuration = self.child_panoptic_segmenter.getConfiguration(**scalars)
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
        # set pixel values in invalid areas to 0
        raster_mask = pixelBlocks['raster_mask']
        raster_pixels = pixelBlocks['raster_pixels']
        raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks['raster_pixels'] = raster_pixels

        try:
            polygon_list, scores, classes = self.child_panoptic_segmenter.vectorize(**pixelBlocks)
        except RuntimeError as e:
            if 'out of memory' in str(e):
                # arcpy.AddError('Runtime Error: ran out of GPU memory, please try a smaller batch size')
                raise RuntimeError("Ran out of GPU memory, please try a smaller batch size")
                return None
            else:
                # arcpy.AddError('Runtime Error:" + str(e) + "Inferencing was not successful.')
                raise RuntimeError("Inferencing was not successful.")
                return None

        n_rows = int(math.sqrt(self.child_panoptic_segmenter.batch_size))
        n_cols = int(math.sqrt(self.child_panoptic_segmenter.batch_size))
        padding = self.child_panoptic_segmenter.padding
        keep_polygon = []
        keep_scores = []
        keep_classes = []

        for idx, polygon in enumerate(polygon_list):
            centroid = polygon.mean(0)
            quadrant = find_i_j(centroid, n_rows, n_cols, self.json_info['ImageHeight'], padding, self.child_panoptic_segmenter.filter_outer_padding_detections)
            if quadrant is not None:
                i, j, in_center = quadrant
                polygon[:, 0] = polygon[:, 0] - (2*i + 1)*padding
                polygon[:, 1] = polygon[:, 1] - (2*j + 1)*padding
                keep_polygon.append(polygon)
                if not in_center:
                    scores[idx] = (self.child_panoptic_segmenter.thres * 100) + scores[idx] * 0.01
                keep_scores.append(scores[idx])
                keep_classes.append(classes[idx])

        polygon_list =  keep_polygon
        scores = keep_scores
        classes = keep_classes
        features['features'] = []
        for i in range(len(polygon_list)):
            rings = [[]]
            for j in range(polygon_list[i].shape[0]):
                rings[0].append(
                    [
                        polygon_list[i][j][1],
                        polygon_list[i][j][0]
                    ]
                )

            features['features'].append({
                'attributes': {
                    'OID': i + 1,
                    'Class': self.json_info['Classes'][classes[i] - 1]['Name'],
                    'Confidence': scores[i]
                },
                'geometry': {
                    'rings': rings
                }
            })

        return {'output_vectors': json.dumps(features)}

    def updateRasterInfo(self, **kwargs):
        kwargs['output_info']['bandCount'] = 1
        #todo: type is determined by the value range of classes in the json file
        prob_raster = getattr(self.child_panoptic_segmenter,'probability_raster',False)
        if prob_raster:
            kwargs['output_info']['pixelType'] = 'f4' # To ensure that output pixels are in prob range 0 to 1
        else:
            kwargs['output_info']['pixelType'] = 'i4'
        class_info = self.json_info['Classes']
        attribute_table['features'] = []
        for i, c in enumerate(class_info):
            attribute_table['features'].append(
                {
                    'attributes':{
                        'OID':i+1,
                        'Value':c['Value'],
                        'Class':c['Name'],
                        'Red':c['Color'][0],
                        'Green':c['Color'][1],
                        'Blue':c['Color'][2]
                    }
                }
            )
        kwargs['output_info']['rasterAttributeTable'] = json.dumps(attribute_table)

        return kwargs

    def updatePixels(self, tlc, shape, props, **pixelBlocks):
        # set pixel values in invalid areas to 0

        raster_mask = pixelBlocks['raster_mask']
        raster_pixels = pixelBlocks['raster_pixels']
        raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks['raster_pixels'] = raster_pixels

        xx = self.child_panoptic_segmenter.updatePixelsTTA(tlc, shape, props, **pixelBlocks).astype(props['pixelType'], copy=False)
        pixelBlocks['output_pixels'] = xx

        return pixelBlocks