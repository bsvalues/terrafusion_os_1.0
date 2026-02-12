from __future__ import annotations

import math
import numpy as np

from typing import Dict, Any
from intel.enumerations import FindMeetingLocationsEnum

def area_style(meeting_count_array: np.ndarray) -> Dict[str, Any]:
    """Creates a Dictionary object representing the output symbology of the output area and point feature classes.

    Returns:
        [dict] -- Dictionary object representing the output symbology for the given layer
    """

    area_max: np.ScalarType = np.amax(meeting_count_array)
    area_quantiles = np.quantile(meeting_count_array, [0.2, 0.4, 0.6, 0.8], axis=0)
        
    area_style: Dict[str, Any] = {
        "type": "classBreaks",
        "authoringInfo": {
            "type": "classedColor",
            "colorRamp": {
                "type": "multipart",
                "colorRamps": [
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            255,
                            255,
                            204,
                            255
                        ],
                        "toColor": [
                            255,
                            238,
                            161,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            255,
                            238,
                            161,
                            255
                        ],
                        "toColor": [
                            255,
                            218,
                            117,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            255,
                            218,
                            117,
                            255
                        ],
                        "toColor": [
                            255,
                            178,
                            77,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            255,
                            178,
                            77,
                            255
                        ],
                        "toColor": [
                            252,
                            141,
                            61,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            252,
                            141,
                            61,
                            255
                        ],
                        "toColor": [
                            252,
                            78,
                            43,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            252,
                            78,
                            43,
                            255
                        ],
                        "toColor": [
                            227,
                            25,
                            28,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            227,
                            25,
                            28,
                            255
                        ],
                        "toColor": [
                            189,
                            0,
                            38,
                            255
                        ]
                    },
                    {
                        "type": "algorithmic",
                        "algorithm": "esriCIELabAlgorithm",
                        "fromColor": [
                            189,
                            0,
                            38,
                            255
                        ],
                        "toColor": [
                            128,
                            0,
                            38,
                            255
                        ]
                    }
                ]
            },
            "classificationMethod": "esriClassifyQuantile"
        },
        "field": FindMeetingLocationsEnum.TM.value,
        "classificationMethod": "esriClassifyQuantile",
        "minValue": 0,
        "classBreakInfos": [
            {
                "classMaxValue": math.floor(area_quantiles[0]),
                "label": "<{}".format(str(math.floor(area_quantiles[0]))),
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        255,
                        255,
                        204,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            110,
                            110,
                            110,
                            255
                        ],
                        "width": 0.7
                    }
                }
            },
            {
                "classMaxValue": math.ceil(area_quantiles[1]),
                "label": "<{}".format(str(math.ceil(area_quantiles[1]))),
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        254,
                        217,
                        118,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            110,
                            110,
                            110,
                            255
                        ],
                        "width": 0.7
                    }
                }
            },
            {
                "classMaxValue": math.ceil(area_quantiles[2]),
                "label": "<{}".format(str(math.ceil(area_quantiles[2]))),
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        253,
                        141,
                        60,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            110,
                            110,
                            110,
                            255
                        ],
                        "width": 0.7
                    }
                }
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        227,
                        26,
                        28,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            110,
                            110,
                            110,
                            255
                        ],
                        "width": 0.7
                    }
                },
                "classMaxValue": math.ceil(area_quantiles[3]),
                "label": "<{}".format(str(math.ceil(area_quantiles[3])))
            },
            {
                "classMaxValue": math.ceil(area_max),
                "label": "<{}".format(str(math.ceil(area_max))),
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        128,
                        0,
                        38,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            110,
                            110,
                            110,
                            255
                        ],
                        "width": 0.7
                    }
                }
            }
        ]
    }
        
                    
    area_style["scaleSymbols"] = True
    area_style["transparency"] = 0
    area_style["labelingInfo"] = None

    return area_style

def point_style(meeting_duration_array: np.ndarray) -> Dict[str, Any]:
    point_max: np.ScalarType = np.amax(meeting_duration_array)
    point_quantiles = np.quantile(meeting_duration_array, [0.2, 0.4, 0.6, 0.8], axis=0)
    
    point_style: Dict[str, Any] = {
        "type": "classBreaks",
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
        "field": FindMeetingLocationsEnum.MD.value,
        "classificationMethod": "esriClassifyQuantile",
        "minValue": 0,
        "classBreakInfos": [{
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [0, 0, 0, 0],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [0, 0, 0, 255],
                    "width": 0.69999999999999996
                }
            },
            "classMaxValue": math.floor(point_quantiles[0]),
            "label": str(math.floor(point_quantiles[0]))
        }, {
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [208,209,230,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [0, 0, 0, 255],
                    "width": 0.69999999999999996
                }
            },
            "classMaxValue": math.ceil(point_quantiles[1]),
            "label": str(math.ceil(point_quantiles[1]))
        }, {
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [116,169,207,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [0, 0, 0, 255],
                    "width": 0.69999999999999996
                }
            },
            "classMaxValue": math.ceil(point_quantiles[2]),
            "label": str(math.ceil(point_quantiles[2]))
        }, {
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [5,112,176,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [0, 0, 0, 255],
                    "width": 0.69999999999999996
                }
            },
            "classMaxValue": math.ceil(point_quantiles[3]),
            "label": str(math.ceil(point_quantiles[3]))
        }, {
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [2,56,88,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [0, 0, 0, 255],
                    "width": 0.69999999999999996
                }
            },
            "classMaxValue": math.ceil(point_max),
            "label": str(math.ceil(point_max))
        }],
        "legendOptions": {
            "order": "ascendingValues"
        }
    }

    point_style["scaleSymbols"] = True
    point_style["transparency"] = 20
    point_style["labelingInfo"] = None

    return point_style