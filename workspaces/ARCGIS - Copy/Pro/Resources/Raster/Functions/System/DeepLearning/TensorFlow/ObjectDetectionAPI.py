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

prf_root_dir = os.path.join(os.path.dirname(__file__), os.pardir)
sys.path.append(prf_root_dir)

import numpy as np

try:
    import tensorflow as tf
    if tf.__version__[0] == '2':
        tf.compat.v1.disable_v2_behavior()
    HAS_TF = True

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
            raise Exception('Tensorflow libraries are not installed. Install Tensorflow using "conda install tensorflow-gpu".')

        self.detection_graph = tf.Graph()
        with self.detection_graph.as_default():
            od_graph_def = tf.compat.v1.GraphDef()
            with tf.io.gfile.GFile(self.model_path, 'rb') as fid:
                serialized_graph = fid.read()
                od_graph_def.ParseFromString(serialized_graph)
                tf.import_graph_def(od_graph_def, name='')

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
                      of ExtractBands in the emd.
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
        config = tf.compat.v1.ConfigProto()
        if 'PerProcessGPUMemoryFraction' in self.json_info:
            config.gpu_options.per_process_gpu_memory_fraction = float(self.json_info['PerProcessGPUMemoryFraction'])

        batch = np.transpose(batch, (0, 2, 3, 1))
        with self.detection_graph.as_default():
            with tf.compat.v1.Session(config=config) as sess:
                feed_dict = {
                    'image_tensor:0': batch
                }
                fetches = {
                    'boundingboxes': 'detection_boxes:0',
                    'scores': 'detection_scores:0',
                    'classes': 'detection_classes:0'
                }

                output_dict = sess.run(fetches, feed_dict=feed_dict)

        bounding_boxes = output_dict['boundingboxes']
        scores = output_dict['scores']
        classes = output_dict['classes']

        # bounding_boxes: [ , ymin, xmin, ymax, xmax]
        bounding_boxes[:, :, [0, 2]] = bounding_boxes[:, :, [0, 2]] * self.json_info['ImageHeight']
        bounding_boxes[:, :, [1, 3]] = bounding_boxes[:, :, [1, 3]] * self.json_info['ImageWidth']

        batch_bounding_boxes, batch_scores, batch_classes = [], [], []

        batch_size = bounding_boxes.shape[0]
        for batch_idx in range(batch_size):
            keep_indices = np.where(scores[batch_idx] > self.thres)
            batch_bounding_boxes.append(bounding_boxes[batch_idx][keep_indices])
            batch_scores.append(scores[batch_idx][keep_indices])
            batch_classes.append(classes[batch_idx][keep_indices])

        return batch_bounding_boxes, batch_scores, batch_classes
