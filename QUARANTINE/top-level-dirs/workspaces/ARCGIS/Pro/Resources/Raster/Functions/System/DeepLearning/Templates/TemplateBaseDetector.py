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

import sys, os
import json

prf_root_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.append(prf_root_dir)

import prf_utils

class TemplateBaseDetector:
    def initialize(self, model, model_as_file):
        if model_as_file:
            with open(model, 'r') as f:
                self.json_info = json.load(f)
        else:
            self.json_info = json.loads(model)

        model_path = self.json_info['ModelFile']
        if model_as_file and not os.path.isabs(model_path):
            model_path = os.path.abspath(os.path.join(os.path.dirname(model), model_path))

        self.model_path = model_path
        self.model_is_loaded = False
        
    def getConfiguration(self, **scalars):
        if "padding" in scalars:
            self.padding = int(scalars["padding"])
        elif "Padding" in self.json_info:
            self.padding = int(self.json_info["Padding"])
        else:
            self.padding = 0

        if "threshold" in scalars:
            self.thres = float(scalars["threshold"])
        elif "Threshold" in self.json_info:
            self.thres = float(self.json_info["Threshold"])
        else:
            self.thres = 0.5

        if "batch_size" in scalars:
            self.batch_size = int(scalars["batch_size"])
        elif "BatchSize" in self.json_info:
            self.batch_size = int(self.json_info["BatchSize"])
        else:
            self.batch_size = 64
        
        self.scalars = scalars

        self.rectangle_height, self.rectangle_width = prf_utils.calculate_rectangle_size_from_batch_size(self.batch_size)
        ty, tx = prf_utils.get_tile_size(self.json_info['ImageHeight'], self.json_info['ImageWidth'],
                                         self.padding, self.rectangle_height, self.rectangle_width)
        self.fixedTileSize = 0 if "fixedTileSize" not in self.json_info else int(self.json_info["fixedTileSize"]),

        return {
            'padding': self.padding,
            'batch_size': self.batch_size,
            'tx': tx,
            'ty': ty,
            'fixedTileSize': self.fixedTileSize
        }

    def vectorize(self, **pixelBlocks):
        if not self.model_is_loaded:
            self.load_model()
            self.model_is_loaded = True

        input_image = pixelBlocks['raster_pixels']

        if self.fixedTileSize == 1:
            fixed_tile_size = True
        else:
            fixed_tile_size = False

        batch, batch_height, batch_width = \
            prf_utils.tile_to_batch(input_image,
                                    self.json_info['ImageHeight'],
                                    self.json_info['ImageWidth'],
                                    self.padding,
                                    fixed_tile_size=fixed_tile_size)

        batch_bounding_boxes, batch_scores, batch_classes = self.inference(batch, **self.scalars)
        return prf_utils.batch_detection_results_to_tile_results(
            batch_bounding_boxes,
            batch_scores,
            batch_classes,
            self.json_info['ImageHeight'],
            self.json_info['ImageWidth'],
            self.padding,
            batch_width
        )
