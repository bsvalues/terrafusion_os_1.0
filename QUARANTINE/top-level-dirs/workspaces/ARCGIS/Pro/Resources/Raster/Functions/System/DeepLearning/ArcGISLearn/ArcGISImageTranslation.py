import sys, os, importlib
import json

sys.path.append(os.path.dirname(__file__))

import arcpy
import numpy as np
import math

from arcpy.ia.util import get_available_device

def chunk_it(image, tile_size):
    s = image.shape
    num_rows = math.ceil(s[0]/tile_size)
    num_cols = math.ceil(s[1]/tile_size)
    r = np.array_split(image, num_rows)
    rows = []
    for x in r:
        x = np.array_split(x, num_cols, axis=1)
        rows.append(x)
    return rows, num_rows, num_cols

def crop_center(img, pad):
    if pad == 0:
        return img
    return img[pad:-pad, pad: -pad, :]

def crop_flatten(chunked, pad):
    imgs = []
    for r, row  in enumerate(chunked):
        for c, col in enumerate(row):
            col = crop_center(col, pad)
            imgs.append(col)
    return imgs

def patch_chips(imgs, n_rows, n_cols):
    h_stacks = []
    for i in range(n_rows):
        h_stacks.append(np.hstack(imgs[i*n_cols:n_cols*(i+1) ]))
    return np.vstack(h_stacks)
 
class ArcGISImageTranslation:
    def __init__(self):
        self.name = 'Image Classifier'
        self.description = 'Image classification python raster function to inference a pytorch image classifier'
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

        self.child_image_classifier = ChildImageClassifier()
        self.child_image_classifier.initialize(model, model_as_file)

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

        return self.child_image_classifier.getParameterInfo(required_parameters)

    def getConfiguration(self, **scalars):
        configuration = self.child_image_classifier.getConfiguration(**scalars)
        if 'DataRange' in self.json_info:
            configuration['dataRange'] = tuple(self.json_info['DataRange'])
        #configuration['inheritProperties'] = 2|4|8
        #configuration['inputMask'] = True
        return configuration

    def updateRasterInfo(self, **kwargs):
        direction = getattr(self.child_image_classifier, "direction", "None")
        tar_nband = self.json_info.get("n_band_c", None)
        if direction == "BtoA":
            kwargs["output_info"]["bandCount"] = int(self.json_info["n_channel_rev"])
        elif tar_nband != None:
             kwargs["output_info"]["bandCount"] = int(tar_nband)
        else:
            kwargs["output_info"]["bandCount"] = int(self.json_info["n_channel"])

        if kwargs["output_info"]["bandCount"] == 3:
            kwargs['output_info']['pixelType'] = 'u1'
        else:
            kwargs['output_info']['pixelType'] = 'f4'
        return kwargs

    def updatePixels(self, tlc, shape, props, **pixelBlocks):
        # set pixel values in invalid areas to 0

        # raster_mask = pixelBlocks['raster_mask']
        raster_pixels = pixelBlocks["raster_pixels"]
        # raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks["raster_pixels"] = raster_pixels

        try:
            if hasattr(self.child_image_classifier, "updatePixelsSmooth"):
                xx = self.child_image_classifier.updatePixelsSmooth(
                    tlc, shape, props, **pixelBlocks
                ).astype(props["pixelType"], copy=False)
                pixelBlocks["output_pixels"] = xx
            else:
                xx = self.child_image_classifier.updatePixels(
                    tlc, shape, props, **pixelBlocks
                ).astype(props["pixelType"], copy=False)
                tytx = getattr(
                    self.child_image_classifier, "tytx", self.json_info["ImageHeight"]
                )
                chunks, num_rows, num_cols = chunk_it(
                    xx.transpose(1, 2, 0), tytx
                )  # self.json_info['ImageHeight'])  # ImageHeight = ImageWidth
                xx = patch_chips(
                    crop_flatten(chunks, self.child_image_classifier.padding),
                    num_rows,
                    num_cols,
                )
                xx = xx.transpose(2, 0, 1)
                pixelBlocks["output_pixels"] = xx
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