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
import pathlib

prf_root_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.append(prf_root_dir)

import numpy as np

from object_detection.utils import config_util
from object_detection.builders import model_builder

try:
    import tensorflow as tf
    if tf.__version__[0] == '2':
        HAS_TF = True
    else:
        HAS_TF = False

except Exception as e:
    HAS_TF = False

from Templates.TemplateBaseDetector import TemplateBaseDetector

class ChildObjectDetector(TemplateBaseDetector):
    def load_model(self):
        '''
        Fill this method to write your own model loading python code
        save it self object if you would like to reference it later.

        Tips: you can access emd information through self.json_info.
        '''
        if not HAS_TF:
            raise Exception('Tensorflow(version 2.1.0 or above) libraries are not installed. Install Tensorflow using "conda install tensorflow-gpu=2.1.0".')

        # load model code for Tensorflow 2 Object Detection API
        pipeline_config = os.path.join(self.model_path, 'pipeline.config')
        checkpoint_dir = os.path.join(self.model_path, 'checkpoint')

        # Load pipeline config and build a detection model
        configs = config_util.get_configs_from_pipeline_file(pipeline_config)
        model_config = configs['model']
        self.detection_model = model_builder.build(model_config=model_config, is_training=False)

        # Restore checkpoint
        ckpt = tf.compat.v2.train.Checkpoint(model=self.detection_model)

        # Generally you want to put the last ckpt from training in here
        filenames = list(pathlib.Path(checkpoint_dir).glob('*.index'))
        filenames.sort()  
        ckpt.restore(str(filenames[-1]).replace('.index','')).expect_partial()

    def getParameterInfo(self, required_parameters):
        required_parameters.extend(
            [
                # Todo: add your inference parameters here
                # https://github.com/Esri/raster-functions/wiki/PythonRasterFunction#getparameterinfo
            ]
        )
        return required_parameters

    def inference(self, batch, **scalars):
        '''
        Fill this method to write your own inference python code, you can refer to the model instance that is created
        in the load_model method. Expected results format is described in the returns as below.

        :param batch: numpy array with shape (B, D, H, W), B is batch size, H, W is specified and equal to
                      ImageHeight and ImageWidth in the emd file and D is the number of bands and equal to the length
                      of ExtractBands in the emd. If BatchInference is set to False in emd, B is constant 1.
        :param scalars: inference parameters, accessed by the parameter name,
                       i.e. score_threshold=float(scalars['threshold']). If you want to have more inference
                       parameters, add it to the list of the following getParameterInfo method.
        :return: bounding boxes, python list representing bounding boxes whose length is equal to B, each element is
                                 [N,4] numpy array representing [ymin, xmin, ymax, xmax] with respect to the upper left
                                 corner of the image tile.
                 scores, python list representing the score of each bounding box whose length is equal to B, each element
                         is [N,] numpy array
                 classes, python list representing the class of each bounding box whose length is equal to B, each element
                         is [N,] numpy array and its dype is np.uint8
        '''
        #Todo: fill in this method to inference your model and return bounding boxes, scores and classes

        # batch is transposed from shape (B, D, H, W) to shape (B, H, W, D)
        batch = np.transpose(batch, (0,2,3,1)) 
        batch_size = batch.shape[0]
        label_id_offset = 1
        def get_model_detection_function(model):
            """Get a tf.function for detection."""

            @tf.function
            def detect_fn(image):
                """Detect objects in image."""

                image, shapes = model.preprocess(image)
                prediction_dict = model.predict(image, shapes)
                detections = model.postprocess(prediction_dict, shapes)

                return detections, prediction_dict, tf.reshape(shapes, [-1])

            return detect_fn

        detect_fn = get_model_detection_function(self.detection_model)

        batch_bounding_boxes, batch_scores, batch_classes = [], [], []
        for index in range(batch_size):
            input_tensor = tf.convert_to_tensor(np.expand_dims(batch[index], 0), dtype=tf.float32)
            detections, predictions_dict, shapes = detect_fn(input_tensor)

            bounding_boxes = detections['detection_boxes'][0].numpy()
            # detection_boxes: [ , ymin, xmin, ymax, xmax]
            bounding_boxes[:, [0, 2]] = bounding_boxes[:, [0, 2]] * self.json_info['ImageHeight']
            bounding_boxes[:, [1, 3]] = bounding_boxes[:, [1, 3]] * self.json_info['ImageWidth']
            scores = detections['detection_scores'][0].numpy()
            classes = (detections['detection_classes'][0].numpy() + label_id_offset).astype(int)

            keep_indices = np.where(scores > self.thres)
            batch_bounding_boxes.append(bounding_boxes[keep_indices])
            batch_scores.append(scores[keep_indices])
            batch_classes.append(classes[keep_indices])

        return batch_bounding_boxes, batch_scores, batch_classes