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

limitations under the License.​
'''

import sys, os, importlib
import json

sys.path.append(os.path.dirname(__file__))

import arcpy
import numpy as np

from arcpy.ia.util import get_available_device
from fields import fields
from features import features

class GeometryType:
    Point = 1
    Multipoint = 2
    Polyline = 3
    Polygon = 4


class ObjectClassifier:
    def __init__(self):
        self.name = 'Object classifier'
        self.description = 'This python raster function applies deep learning model to classify objects from overlaid imagery'

    def initialize(self, **kwargs):
        if 'model' not in kwargs:
            return

        # Read esri model definition (emd) file
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
            modelconfig = self.json_info['ModelConfiguration']
            if isinstance(modelconfig, str):
                if modelconfig not in sys.modules:
                    ChildModelDetector = getattr(importlib.import_module(
                        '{}.{}'.format(framework, modelconfig)), 'ChildObjectDetector')
                else:
                    ChildModelDetector = getattr(importlib.reload(
                        '{}.{}'.format(framework, modelconfig)), 'ChildObjectDetector')
            else:
                modelconfig = self.json_info['ModelConfiguration']['Name']
                ChildModelDetector = getattr(importlib.import_module(
                    '{}.{}'.format(framework, modelconfig)), 'ChildObjectDetector')
        else:
            raise Exception("Invalid model configuration")

        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        device = None
        if 'device' in kwargs:
            device = kwargs['device']
            if device == -2:
                device = get_available_device()

        if device is not None:
            os.environ['CUDA_VISIBLE_DEVICES'] = str(device)
            if device >= 0:
                arcpy.env.processorType = "GPU"
                arcpy.env.gpuId = str(device)
            else:
                arcpy.env.processorType = "CPU"

        tempProcessorType = None
        if device is None:
            # this means we are in validation phase
            tempProcessorType = arcpy.env.processorType
            arcpy.env.processorType = "CPU"
            if 'CUDA_VISIBLE_DEVICES' in os.environ:
                tempCUDA_VISIBLE_DEVICES = os.environ['CUDA_VISIBLE_DEVICES']
            else:
                tempCUDA_VISIBLE_DEVICES = False
            os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
            

        self.child_object_detector = ChildModelDetector()
        self.child_object_detector.initialize(model, model_as_file)

        if device is None:
            arcpy.env.processorType = tempProcessorType
            if tempCUDA_VISIBLE_DEVICES is False and 'CUDA_VISIBLE_DEVICES' in os.environ:
                del os.environ['CUDA_VISIBLE_DEVICES']
            else:
                os.environ['CUDA_VISIBLE_DEVICES'] = tempCUDA_VISIBLE_DEVICES

    def getParameterInfo(self):

        # PRF needs values of these parameters from gp tool user,
        # either from gp tool UI or emd (a json) file.
        required_parameters = [
            {
                # To support mini batch, it is required that Classify Objects Using Deep Learning geoprocessing Tool
                # passes down a stack of raster tiles to PRF for model inference, the keyword required here is 'rasters'.
                'name': 'rasters',
                'dataType': 'rasters',
                'value': None,
                'required': True,
                'displayName': "Rasters",
                'description': 'The collection of overlapping rasters to objects to be classified'
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
                    'name': 'batch_size',
                    'dataType': 'numeric',
                    'required': False,
                    'value': 4 if "BatchSize" not in self.json_info else int(self.json_info["BatchSize"]),
                    'displayName': 'Batch Size',
                    'description': 'Batch Size'                    
                }
            ]       
        )

        return self.child_object_detector.getParameterInfo(required_parameters)


    def getConfiguration(self, **scalars):

        # The information PRF returns to the GP tool,
        # the information is either from emd or defined in getConfiguration method.

        configuration = self.child_object_detector.getConfiguration(**scalars)

        if 'DataRange' in self.json_info:
            configuration['dataRange'] = tuple(self.json_info['DataRange'])

        configuration['inheritProperties'] = 2|4|8
        configuration['inputMask'] = True

        return configuration

    def getFields(self):

        if "MetaDataMode" in self.json_info and self.json_info["MetaDataMode"] == "MultiLabeled_Tiles":
            for item in fields['fields']:
                if item['name'] == 'Confidence':
                    item['type'] = 'esriFieldTypeString'

        if not any(field['name'] == 'Label' for field in fields['fields']):
            fields['fields'].append(
                {
                    'name': 'Label',
                    'type': 'esriFieldTypeString',
                    'alias': 'Label'
                }
            )
        return json.dumps(fields)

    def getGeometryType(self):
        return GeometryType.Polygon

    def vectorize(self, **pixelBlocks):

        # set pixel values in invalid areas to 0
        rasters_mask = pixelBlocks['rasters_mask']
        rasters_pixels = pixelBlocks['rasters_pixels']

        for i in range(0, len(rasters_pixels)):
            rasters_pixels[i][np.where(rasters_mask[i] == 0)] = 0

        pixelBlocks['rasters_pixels'] = rasters_pixels

        try:
            polygon_list, scores, labels = self.child_object_detector.vectorize(**pixelBlocks)
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

        features['fieldAliases'].update({
            'Label': 'Label'
        })

        Labelfield = {
                'name': 'Label',
                'type': 'esriFieldTypeString',
                'alias': 'Label'
        }

        if not Labelfield in features['fields']:
            features['fields'].append(Labelfield)
 
        if "MetaDataMode" in self.json_info and self.json_info["MetaDataMode"] == "MultiLabeled_Tiles":
            for item in features['fields']:
                if item['name'] == 'Confidence':
                    item['type'] = 'esriFieldTypeString'

        for i in range(len(polygon_list)):

            rings = [[]]
            for j in range(len(polygon_list[i])):
                rings[0].append(
                    [
                        polygon_list[i][j][1],
                        polygon_list[i][j][0]
                    ]
                )

            features['features'].append({
                'attributes': {
                    'OID': i + 1,
                    'Confidence': str(scores[i]),
                    'Label': labels[i],
                    'Classname': labels[i]
                },
                'geometry': {
                    'rings': rings
                }
            })

        return {'output_vectors': json.dumps(features)}
