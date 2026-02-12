from typing import Dict

from common import (Renderer, PAOutputFeatureLayer, LogUtils)

LOGGER = LogUtils.setup_logger(__name__)

class SpatialStatsRenderer(Renderer):
    """Abstract class contains utility functions to generate renderer."""

    @staticmethod
    def get_db_cluster_rendering_info(color_count: list, noise: bool) -> Dict:
        get_colors = [
            [166, 206, 227, 255], [31, 120, 180, 255], [178, 223, 138, 255], [51, 160, 44, 255],
            [251, 154, 153, 255], [227, 26, 28, 255], [253, 191, 111, 255], [255, 127, 0, 255]
        ]
        get_legends = ["light blue", "blue", "light green", "green", "pink", "red", "beige", "orange"]

        symbol_list = []

        db_cluster = {
            "renderer": {
                "type": "uniqueValue",
                "field1": "COLOR_ID",
                "uniqueValueInfos": [],
                "fieldDelimiter": ","
            },
            "transparency": 0,
        }

        if noise:
            color_count = color_count[1:]
            db_cluster["renderer"]["defaultSymbol"] = {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [156, 156, 156, 255],
                "size": 4,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [156, 156, 156, 255],
                    "width": 0
                }
            }
            db_cluster["renderer"]["defaultLabel"] = "Noise"

        for i, count in enumerate(color_count):
            legend = get_legends[i]
            db_cluster_point = {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": "",
                    "size": 7,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [166, 206, 227, 255],
                        "width": 0
                    }
                },
                "value": "",
                "label": ""
            }
            db_cluster_point['symbol']['color'] = get_colors[i]
            db_cluster_point['value'] = i + 1
            cluster_purl = "cluster" if count == 1 else "clusters"
            db_cluster_point['label'] = '{0} {1} displayed in the {2} color'.format(count, cluster_purl, legend)
            symbol_list.append(db_cluster_point)

        db_cluster["renderer"]["uniqueValueInfos"] = symbol_list

        return db_cluster

    @staticmethod
    def get_hotspot_rendering_info(out_layer: PAOutputFeatureLayer) -> Dict:
        ''' returns drawing info for Hot Spots '''
        out_shape = out_layer.shapeType
        if out_shape == "Polygon":
            drawing_info = Renderer.get_drawing_from_json("hotspot_polygons.json")
            return drawing_info
        else:
            drawing_info = Renderer.get_drawing_from_json("hotspot_points.json")
            if out_layer.count > 10000:
                for i in range(0, 7):
                    drawing_info[i]["symbol"]["size"] -= 1
            return drawing_info

    @staticmethod
    def get_outlier_rendering_info(out_layer: PAOutputFeatureLayer) -> Dict:
        '''returns drawing info for Outliers'''
        out_shape = out_layer.shapeType
        if out_shape == "Polygon":
            drawing_info = Renderer.get_drawing_from_json("outlier_polygons.json")
            return drawing_info
        else:
            drawing_info = Renderer.get_drawing_from_json("outlier_points.json")
            if out_layer.count > 10000:
                for i in range(0, 4):
                    drawing_info[i]["symbol"]["size"] -= 1
            return drawing_info
        
    @staticmethod
    def get_index_rendering_info(out_layer: PAOutputFeatureLayer) -> Dict:
        '''return drawing info for Composite Index'''
        out_shape = out_layer.shapeType
        drawing_info = None
        if out_shape == "Point":
            drawing_info = Renderer.get_drawing_from_json("index_points.json")
        elif out_shape == "Polygon":
            drawing_info = Renderer.get_drawing_from_json("index_polygons.json")
        else: # Line
            drawing_info = Renderer.get_drawing_from_json("index_lines.json")
        return drawing_info