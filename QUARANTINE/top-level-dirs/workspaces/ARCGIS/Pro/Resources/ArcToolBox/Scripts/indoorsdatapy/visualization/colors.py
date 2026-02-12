from xml.etree.ElementTree import Element, SubElement, tostring

import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib import cm

"""
Usage

m = MplColorHelper('rainbow', 0, 10)

s = SldColorsXmlMaker('PolygonSymbolizer','ahohj',0,10,3,m.get_rgb)
print s.save_xml('/tmp/sld.xml')
"""


def hex2rgb(hexcode):
    rgb = tuple(map(ord, hexcode[1:].decode('hex')))
    return rgb


def rgb2hex(r, g, b):
    hex = "#{:02x}{:02x}{:02x}".format(r, g, b)
    return hex


class MplColorHelper(object):
    """
      Example of usage
      import numpy as np
      # setup the plot
      fig, ax = plt.subplots(1,1, figsize=(6,6))

      # define the data between 0 and 20
      NUM_VALS = 20
      x = np.random.uniform(0, NUM_VALS, size=NUM_VALS)
      y = np.random.uniform(0, NUM_VALS, size=NUM_VALS)

      # define the color chart between 2 and 10 using the 'autumn_r' colormap, so
      #   y <= 2  is yellow
      #   y >= 10 is red
      #   2 < y < 10 is between from yellow to red, according to its value
      COL = MplColorHelper('autumn_r', 2, 10)

      scat = ax.scatter(x,y,s=300, c=COL.get_rgb(y))
      ax.set_title('Well defined discrete colors')
      plt.show()
    """

    def __init__(self, cmap_name, min_val, max_val):
        self.cmap_name = cmap_name
        self.cmap = plt.get_cmap(cmap_name)
        self.min_val = min_val
        self.max_val = max_val
        self.norm = mpl.colors.Normalize(vmin=min_val, vmax=max_val)
        self.scalarMap = cm.ScalarMappable(norm=self.norm, cmap=self.cmap)

    def get_rgb(self, val):
        r, g, b, t = self.scalarMap.to_rgba(val)
        return int(r * 255.), int(g * 255.), int(b * 255.)


class SldColorsXmlMaker(object):
    simple_feature_types = dict(polygon='PolygonSymbolizer',
                                point='PointSymbolizer')

    def __init__(self, simple_feature_type, attribute, min, max, step,
                 get_rgb_fnc, transformation='interpolation'):

        if simple_feature_type not in self.simple_feature_types.keys():
            raise AttributeError('Not supported type %s' % simple_feature_type)

        self.sft = self.simple_feature_types[simple_feature_type]
        self.attr = attribute
        self.step = step
        self.max_val = max
        self.min_val = min
        self.rgb_getter = get_rgb_fnc
        self.transformation = transformation

    def save_xml(self, out_path, layer_name, title):

        top = Element('StyledLayerDescriptor',
                      **{'version': "1.0.0",
                         "xsi:schemaLocation": "http://www.opengis.net/sld StyledLayerDescriptor.xsd",
                         'xmlns ': "http://www.opengis.net/sld",
                         'xmlns:ogc': "http://www.opengis.net/ogc",
                         'xmlns:xlink': "http://www.w3.org/1999/xlink",
                         'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance"})

        named_layer = SubElement(top, "NamedLayer")
        named_layer_name = SubElement(named_layer, 'Name')
        named_layer_name.text = layer_name
        named_layer_us = SubElement(named_layer, 'UserStyle')
        named_layer_title = SubElement(named_layer_us, 'Title')
        named_layer_title.text = title

        named_layer_fts = SubElement(named_layer_us, 'FeatureTypeStyle')
        named_layer_fts_rule = SubElement(named_layer_fts, 'Rule')

        top_style = SubElement(named_layer_fts_rule, self.sft)

        child = SubElement(top_style, 'Fill')
        parent_fill = SubElement(child, 'CssParameter', name='fill')
        if self.transformation == 'interpolation':
            parent_transform = SubElement(
                parent_fill, 'ogc:Function', name='Interpolate')
        else:
            parent_transform = SubElement(
                parent_fill, 'ogc:Function', name='Categorize')

        parent_propertyname = SubElement(parent_transform, 'ogc:PropertyName')
        parent_propertyname.text = self.attr

        local_min, local_max = (self.min_val, self.max_val) \
            if self.min_val < self.max_val else (self.max_val, self.min_val)

        for val in range(local_min, local_max, self.step):
            value = SubElement(parent_transform, 'ogc:Literal')
            value.text = str(val)
            color = SubElement(parent_transform, 'ogc:Literal')
            color.text = rgb2hex(*self.rgb_getter(val))

        method = SubElement(parent_transform, 'ogc:Literal')
        method.text = 'color'

        if out_path:
            with open(out_path, 'w') as wr:
                wr.write(tostring(top))
                return

        return tostring(top)

# m = MplColorHelper('rainbow', 0, 10)
#
# s = SldColorsXmlMaker('PolygonSymbolizer', 'ahohj', 0, 10, 3, m.get_rgb)
# print s.save_xml('/tmp/sld.xml', 'my_layer', 'colors')
