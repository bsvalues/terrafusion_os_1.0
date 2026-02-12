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

if 'attribute_table' in sys.modules:
    del sys.modules['attribute_table']
from attribute_table import attribute_table

class ImageClassifier:
    def __init__(self):
        self.name = 'Image Classifier'
        self.description = 'This python raster function applies deep learning model to do pixel-based classification in imagery' 

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
            if isinstance(self.json_info['ModelConfiguration'], str):
                ChildImageClassifier = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration'])), 'ChildImageClassifier')
            else:
                ChildImageClassifier = getattr(importlib.import_module(
                    '{}.{}'.format(framework, self.json_info['ModelConfiguration']['Name'])), 'ChildImageClassifier')
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
                if framework in ["Tensorflow", "Tensorflow2"]:
                    arcpy.env.processorType = "CPU"
                else:
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
            

        self.child_image_classifier = ChildImageClassifier()
        self.child_image_classifier.initialize(model, model_as_file)

        if device is None:
            arcpy.env.processorType = tempProcessorType
            if tempCUDA_VISIBLE_DEVICES is False and 'CUDA_VISIBLE_DEVICES' in os.environ:
                del os.environ['CUDA_VISIBLE_DEVICES']
            else:
                os.environ['CUDA_VISIBLE_DEVICES'] = tempCUDA_VISIBLE_DEVICES

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
            },
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
                    
                },
                {
                    'name': 'padding',
                    'dataType': 'numeric',
                    'required': False,
                    'value': 0 if "ModelPadding" not in self.json_info else int(self.json_info["ModelPadding"]),
                    'displayName': 'Padding',
                    'description': 'Padding'
                    
                }
            ]       
        )

        return self.child_image_classifier.getParameterInfo(required_parameters)

    def getConfiguration(self, **scalars):
        configuration = self.child_image_classifier.getConfiguration(**scalars)
        if 'DataRange' in self.json_info:
            configuration['dataRange'] = tuple(self.json_info['DataRange'])
        configuration['inheritProperties'] = 2|4|8
        configuration['inputMask'] = True
        return configuration

    def updateRasterInfo(self, **kwargs):
        kwargs['output_info']['bandCount'] = 1
        #todo: type is determined by the value range of classes in the json file
        kwargs['output_info']['pixelType'] = "u2" # represents unsigned 2 bytes
        class_info = self.json_info['Classes']
        attribute_table['features'] = []
        for i, c in enumerate(class_info):
            attribute_table['features'].append(
                {
                    'attributes':{
                        'OID':i+1,
                        'Value':c['Value'],
                        'Classvalue':c['Value'],
                        'Classname':c['Name'],
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

        try:
            pixelBlocks['output_pixels'] = self.child_image_classifier.updatePixels(tlc, shape, props, **pixelBlocks).astype(props['pixelType'], copy=False)
        except RuntimeError as e:
            if 'out of memory' in str(e):
                # arcpy.AddError('Runtime Error: ran out of GPU memory, please try a smaller batch size')
                raise RuntimeError("Ran out of GPU memory, please try a smaller batch size")
                return None
            else:
                # arcpy.AddError('Runtime Error:" + str(e) + "Inferencing was not successful.')
                raise RuntimeError("Inferencing was not successful.")
                return None

        return pixelBlocks
