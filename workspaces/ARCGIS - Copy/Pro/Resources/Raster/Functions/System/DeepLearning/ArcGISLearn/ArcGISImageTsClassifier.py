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
    return img[pad:-pad, pad:-pad, :]

def crop_flatten(chunked, pad):
    imgs = []
    for r, row in enumerate(chunked):
        for c, col in enumerate(row):
            col = crop_center(col, pad)
            imgs.append(col)
    return imgs

def patch_chips(imgs, n_rows, n_cols):
    h_stacks = []
    for i in range(n_rows):
        h_stacks.append(np.hstack(imgs[i*n_cols:n_cols*(i+1)]))
    return np.vstack(h_stacks)

attribute_table = {
    "displayFieldName": "",
    "fieldAliases": {
        "OID": "OID",
        "Value": "Value",
        "Class": "Class"
    },
    "fields": [
        {
            "name": "OID",
            "type": "esriFieldTypeOID",
            "alias": "OID"
        },
        {
            "name": "Value",
            "type": "esriFieldTypeInteger",
            "alias": "Value"
        },
        {
            "name": "Class",
            "type": "esriFieldTypeString",
            "alias": "Class"
        }
    ],
    "features": []
}

class ArcGISImageTsClassifier:
    def __init__(self):
        self.name = "ImageTS Classifier"
        self.description = "Image TS classification python raster function to inference a pytorch time-series classifier"

    def initialize(self, **kwargs):
        if "model" not in kwargs:
            return

        model = kwargs["model"]
        model_as_file = True
        try:
            with open(model, "r") as f:
                self.json_info = json.load(f)
        except FileNotFoundError:
            try:
                self.json_info = json.loads(model)
                model_as_file = False
            except json.decoder.JSONDecodeError:
                raise Exception("Invalid model argument")

        self.class_values = set([row['Value'] for row in self.json_info.get('Classes', [])])
        sys.path.append(os.path.dirname(__file__))
        framework = self.json_info["Framework"]
        if "ModelConfiguration" in self.json_info:
            if isinstance(self.json_info["ModelConfiguration"], str):
                ChildImageClassifier = getattr(
                    importlib.import_module(
                        "{}.{}".format(framework, self.json_info["ModelConfiguration"])
                    ),
                    "ChildImageClassifier",
                )
            else:
                ChildImageClassifier = getattr(
                    importlib.import_module(
                        "{}.{}".format(
                            framework, self.json_info["ModelConfiguration"]["Name"]
                        )
                    ),
                    "ChildImageClassifier",
                )
        else:
            raise Exception("Invalid model configuration")

        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        device = None
        if "device" in kwargs:
            device = kwargs["device"]
            if device == -2:
                device = get_available_device()

        if device is not None:
            if device >= 0:
                try:
                    import torch
                except Exception:
                    raise Exception(
                        "PyTorch is not installed. Install it using conda install -c esri deep-learning-essentials"
                    )
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
                "name": "raster",
                "dataType": "raster",
                "required": True,
                "displayName": "Raster",
                "description": "Input Raster",
            },
            {
                "name": "model",
                "dataType": "string",
                "required": True,
                "displayName": "Input Model Definition (EMD) File",
                "description": "Input model definition (EMD) JSON file",
            },
            {
                "name": "device",
                "dataType": "numeric",
                "required": False,
                "displayName": "Device ID",
                "description": "Device ID",
            },
        ]

        params = self.child_image_classifier.getParameterInfo(required_parameters)
        if 0 not in self.class_values and len(self.class_values)>1:
            for param in params:
                if param['name'] == 'predict_background':
                    param['value'] = 'False'
                    break
        return params

    def getConfiguration(self, **scalars):
        configuration = self.child_image_classifier.getConfiguration(**scalars)
        if "DataRange" in self.json_info:
            configuration["dataRange"] = tuple(self.json_info["DataRange"])
        configuration["inheritProperties"] = 4 | 8
        configuration["invalidateProperties"] = 2 | 4 | 8
        configuration["inputMask"] = True
        if scalars.get('processfullimage'):
            self.child_image_classifier.processfullimage = True
        return configuration

    def updateRasterInfo(self, **kwargs):
        kwargs["output_info"]["bandCount"] = 1
        kwargs["output_info"]["pixelType"] = "i4"
        class_info = self.json_info.get("Class_mapping", None)
        num_class_info = self.json_info.get("Num_class_mapping", None)
        if num_class_info == None:
            num_class_info = class_info
        key_vals, num_key_vals = list(class_info.items()), list(num_class_info.items())

        attribute_table["features"] = []
        for i, c in enumerate(class_info):
            attribute_table["features"].append(
                {
                    "attributes": {
                        "OID": i + 1,
                        "Value": num_key_vals[i][1],
                        "Class": key_vals[i][1]
                    }
                }
            )

        kwargs["output_info"]["rasterAttributeTable"] = json.dumps(attribute_table)

        return kwargs

    def updateKeyMetadata(self, names, bandIndex, **keyMetadata):
        if bandIndex == -1:
            keyMetadata['datatype'] = "Thematic" # For Classify Pixel tool, the default raster type is "Thematic"

        return keyMetadata

    def updatePixels(self, tlc, shape, props, **pixelBlocks):
        # set pixel values in invalid areas to 0
        raster_mask = pixelBlocks["raster_mask"]
        raster_pixels = pixelBlocks["raster_pixels"]
        raster_pixels[np.where(raster_mask == 0)] = 0
        pixelBlocks["raster_pixels"] = raster_pixels

        if getattr(self.child_image_classifier, 'processfullimage', False):
            raster_size = pixelBlocks['raster_pixels'].shape[1]
            self.child_image_classifier.tytx = raster_size
            self.child_image_classifier.batch_size = 1
            self.child_image_classifier.rectangle_height =1
            self.child_image_classifier.rectangle_width = 1
        try:
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