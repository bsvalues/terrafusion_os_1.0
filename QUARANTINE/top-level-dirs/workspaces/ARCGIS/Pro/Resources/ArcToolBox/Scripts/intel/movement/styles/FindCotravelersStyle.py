import numpy as np

from intel.types import TimeDifferenceList, StyleJSON

def apply_cotravelers_symbology(time_difference_list: TimeDifferenceList) -> StyleJSON:
        """Applies symbology to the output point feature layer. 
        Returns:
            [dict] -- A dictionary object containing all of the necessary information to generate a JSON Renderer for the SetParameterSymbology function.
        """
        time_array = np.array(time_difference_list)
        quantiles = np.quantile(time_array, [0.2, 0.4, 0.6, 0.8], axis=0)
        time_max = max(time_difference_list)
        time_min = min(time_difference_list)

        lyr = {"type": "classBreaks",
                "authoringInfo": {
                    "type": "classedColor",
                    "colorRamp": {
                        "type": "algorithmic",
                        "algorithm": "esriHSVAlgorithm",
                        "fromColor": [245, 245, 0, 255],
                        "toColor": [245, 0, 0, 255]
                    },
                    "classificationMethod": "esriClassifyQuantile"
                },
                "field": "time_diff",
                "classificationMethod": "esriClassifyQuantile",
                "minValue": time_min,
                "classBreakInfos": [{
                    "symbol": {
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [255, 255, 0, 255],
                        "size": 4,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 0.69999999999999996
                        }
                    },
                    "classMaxValue": quantiles[0],
                    "label": str(quantiles[0])
                }, {
                    "symbol": {
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [255, 170, 0, 255],
                        "size": 4,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 0.69999999999999996
                        }
                    },
                    "classMaxValue": quantiles[1],
                    "label": str(quantiles[1])
                }, {
                    "symbol": {
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [230, 0, 0, 255],
                        "size": 4,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 0.69999999999999996
                        }
                    },
                    "classMaxValue": quantiles[2],
                    "label": str(quantiles[2])
                }, {
                    "symbol": {
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [255, 170, 0, 255],
                        "size": 4,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 0.69999999999999996
                        }
                    },
                    "classMaxValue": quantiles[3],
                    "label": str(quantiles[3])
                }, {
                    "symbol": {
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "color": [255, 255, 0, 255],
                        "size": 4,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 0.69999999999999996
                        }
                    },
                    "classMaxValue": time_max,
                    "label": str(time_max)
                }],
                "legendOptions": {
                    "order": "ascendingValues"
                }
            }

        lyr["scaleSymbols"] = True
        lyr["transparency"] = 0
        lyr["labelingInfo"] = None

        return lyr