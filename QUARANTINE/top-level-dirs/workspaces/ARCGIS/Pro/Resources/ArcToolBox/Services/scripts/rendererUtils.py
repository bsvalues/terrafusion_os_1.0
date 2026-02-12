#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import arcpy
import json
import debugUtils
# import for sortClassValues
import ast
from copy import deepcopy
import locale
import os



GRADUATED_COLOR_RAMPS = {2: ([230,183,196,255],[182,95,165,255]),
                         3: ([238,206,201,255],[213,136,185,255],[161,78,150,255]),
                         4: ([246,229,207,255],[221,159,191,255],[204,113,180,255],[140,60,136,255]),
                         5: ([246,229,207,255],[221,159,191,255],[204,113,180,255],[161,78,150,255],[118,42,121,255])
                         }

# Constant Variables

CREATEVIEWSHED_SIMPLE_COLOR = [230,152,0,255]
CREATEWATERSHEDS_SIMPLE_COLOR = [59, 148, 0, 255]
OPTIMUMTRAVELCOSTNEIGHBORNETWORK_SIMPLE_COLOR=[59, 148, 0, 255]

UNIQUE_VALUE_DEF = {

    "type": "uniqueValueDef",
    "uniqueValueFields": ["BUFF_DIST"],
    "fieldDelimiter": ",",
    "baseSymbol": {
        "type": "esriSFS",
        "style": "esriSFSSolid",
        "color": [198, 245, 215, 255],
        "outline": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [110, 110, 110, 255],
            "width": 1.0}},
    "colorRamp": {
        "type": "algorithmic",
        "fromColor": [0, 255, 255, 255],
        "toColor": [0, 0, 255, 255],
        "algorithm": "esriHSVAlgorithm"}}

GRADUATED_SYMBOLS_DEF = {
    "type": "classBreaksDef",
    "classificationField": "Point_Count",
    "classificationMethod": "esriClassifyNaturalBreaks",
    "classBreaksType": "esriGraduatedSymbols",
    "breakCount": 5,
    "baseSymbol": {
        "type": "esriSMS",
        "style": "esriSMSCircle",
        "color": [204,113,180,255],
        "size": 8,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "outline": {
            "color": [204,113,180,255],
            "width": 1
        }
        },
    "colorRamp": {
        "type": "algorithmic",
        "fromColor": [204,113,180,255],
        "toColor": [204,113,180,255],
        "algorithm": "esriHSVAlgorithm"
    }
}

BLUE_COLOR_RAMP = {
        "type": "algorithmic",
        "toColor": [0, 255, 255, 255],
        "fromColor": [0, 0, 255, 255],
        "algorithm": "esriHSVAlgorithm"}

GRADUATED_COLORS_DEF = {
    "type": "classBreaksDef",
    "classificationField": "Point_Count",
    "classificationMethod": "esriClassifyNaturalBreaks",
    #"normalizationType": "esriNormalizeByField",
    #"normalizationField": "Area",
    "breakCount": 5,
    #"baseSymbol" : {
        #"type": "esriSFS",
        #"style": "esriSFSSolid",
        #"color": [198,245,215,100],
        #"outline": {
            #"type": "esriSLS",
            #"style": "esriSLSSolid",
            #"color": [110,110,110,255],
            #"width": 1 }
        #},
    #"colorRamp": {
        #"type": "algorithmic",
        #"fromColor": [255, 255, 128, 255],
        #"toColor": [107, 0, 0, 255],
        #"algorithm": "esriHSVAlgorithm" }
     "baseSymbol" : {
        "type": "esriSFS",
        "style": "esriSFSSolid",
        "color": [255, 251, 253, 255],
        "outline": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [255, 251, 253, 255],
            "width": 1}
        },
    "colorRamp": {
        "type": "algorithmic",
        "fromColor": [222, 164, 207, 255],
        "toColor": [63, 0, 125, 255],
        "algorithm": "esriHSVAlgorithm" }
}

GRADUATED_COLORS_LINE_BASE_SYMBOL = {
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": [204,113,180,255],
    "width": 2
}

GRADUATED_COLORS_POINT_BASE_SYMBOL = {
    "type": "esriSMS",
    "style": "esriSMSCircle",
    "color": [204,113,180,255],
    "size": 8,
    "angle": 0,
    "xoffset": 0,
    "yoffset": 0,
    "outline": {
        "color": [204,113,180,255],
        "width": 0 }
}



SIMPLE_RENDERER_POINT = {"renderer": {"type": "simple",
                                      "symbol": {"type": "esriSMS",
                                                 "style": "esriSMSCircle",
                                                 "color": [79,129,189,255],
                                                 "size": 10,
                                                 "angle": 0,
                                                 "xoffset": 0,
                                                 "yoffset": 0,
                                                 "outline": {"color": [54,93,141,255], "width": 1}}}
                         }
SIMPLE_RENDERER_POLYLINE = {"renderer":{"type":"simple",
                                        "symbol": {"type": "esriSLS",
                                                   "style": "esriSLSSolid",
                                                   "color": [79,129,189,255],
                                                   "width": 2}}
                            }

SIMPLE_RENDERER_POLYGON = {"renderer":{"type": "simple",
                                       "symbol": {"type": "esriSFS",
                                                  "style": "esriSFSSolid",
                                                  "color": [79,129,189,255],
                                                  "outline": {
                                                      "type": "esriSLS",
                                                      "style": "esriSLSSolid",
                                                      "color": [54,93,141,255],
                                                      "width": 1.5}}},
                           "transparency":25
                           }

SIMPLE_RENDERER_TESSELLATION = {"renderer":{"type": "simple",
                                            "symbol": {"type": "esriSFS",
                                                       "style": "esriSFSSolid",
                                                       "color": [79,129,189,0],
                                                       "outline": {
                                                                "type": "esriSLS",
                                                                "style": "esriSLSSolid",
                                                                "color": [54,93,141,255],
                                                                "width": 1.5}}},
                                            "transparency":0
                                }
SIMPLE_BUFFER_RENDERER = {"renderer": {"type": "simple",
                                       "symbol": {"type": "esriSFS",
                                                  "style": "esriSFSSolid",
                                                  "color": [0,100,255,94],
                                                  "outline": {
                                                      "type": "esriSLS",
                                                      "style": "esriSLSSolid",
                                                      "color": [110, 110, 110, 255],
                                                      "width": 1}}}
                          }

HOT_SPOT_POLYGONS = {
    "renderer": {
        "type": "classBreaks",
        "field": "Gi_Bin",
        "classificationMethod": "esriClassifyManual",
        "minValue": -3,
        "classBreakInfos": [{
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                "color": [69, 117, 181, 255],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [178, 178, 178, 255],
                    "width": 0.4
                }
            },
            "classMaxValue": -3,
            "label": "Cold Spot with 99% Confidence",
            "description": ""
        },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [132, 158, 186, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": -2,
                "label": "Cold Spot with 95% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [192, 204, 190, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": -1,
                "label": "Cold Spot with 90% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [247, 247, 242, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 0,
                "label": "Not Significant",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [250, 185, 132, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 1,
                "label": "Hot Spot with 90% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [237, 117, 81, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 2,
                "label": "Hot Spot with 95% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [214, 47, 39, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [178, 178, 178, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 3,
                "label": "Hot Spot with 99% Confidence",
                "description": ""
            }
        ]
    },
    "transparency": 15
}

HOT_SPOT_POINTS = {
    "renderer": {
        "type": "uniqueValue",
        "field1": "Gi_Bin",
        "uniqueValueInfos": [{
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [
                    69,
                    117,
                    181,
                    255
                ],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [
                        56,
                        96,
                        148,
                        255
                    ],
                    "width": 0.5
                }
            },
            "value": -3,
            "label": "Cold Spot with 99% Confidence",
            "description": ""
        },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        132,
                        158,
                        186,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            112,
                            134,
                            158,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": -2,
                "label": "Cold Spot with 95% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        192,
                        204,
                        190,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            154,
                            163,
                            152,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": -1,
                "label": "Cold Spot with 90% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        156,
                        156,
                        156,
                        255
                    ],
                    "size": 3,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "value": 0,
                "label": "Not Significant",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        250,
                        185,
                        132,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            212,
                            157,
                            112,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": 1,
                "label": "Hot Spot with 90% Confidence",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        237,
                        117,
                        81,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            207,
                            102,
                            70,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": 2,
                "label": "Hot Spot with 95% Confidence",
                "description": ""
            },

            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        214,
                        41,
                        39,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            176,
                            39,
                            32,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": 3,
                "label": "Hot Spot with 99% Confidence",
                "description": ""
            }
        ]
    }
}

OUTLIER_POLYGONS = {
    "renderer": {
        "type": "uniqueValue",
        "field1": "COType",
        "uniqueValueInfos": [{
            "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                "color": [
                    240,
                    184,
                    177,
                    255
                ],
                "outline": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [
                        178,
                        178,
                        178,
                        255
                    ],
                    "width": 0.375
                }
            },
            "value": "HH",
            "label": "High-High Cluster",
            "description": ""
        },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        224,
                        27,
                        27,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            178,
                            178,
                            178,
                            255
                        ],
                        "width": 0.375
                    }
                },
                "value": "HL",
                "label": "High-Low Outlier",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        27,
                        83,
                        224,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            178,
                            178,
                            178,
                            255
                        ],
                        "width": 0.375
                    }
                },
                "value": "LH",
                "label": "Low-High Outlier",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        183,
                        217,
                        232,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            178,
                            178,
                            178,
                            255
                        ],
                        "width": 0.375
                    }
                },
                "value": "LL",
                "label": "Low-Low Cluster",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [
                        247,
                        247,
                        242,
                        255
                    ],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [
                            178,
                            178,
                            178,
                            255
                        ],
                        "width": 0.375
                    }
                },
                "value": "",
                "label": "Not Significant",
                "description": ""
            }
        ]
    },
    "transparency": 15
}

OUTLIER_POINTS = {
    "renderer": {
        "type": "uniqueValue",
        "field1": "COType",
        "uniqueValueInfos": [{
            "symbol": {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [
                    240,
                    184,
                    177,
                    255
                ],
                "size": 5,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [
                        179,
                        137,
                        132,
                        255
                    ],
                    "width": 0.5
                }
            },
            "value": "HH",
            "label": "High-High Cluster",
            "description": ""
        },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        224,
                        27,
                        27,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            168,
                            20,
                            20,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": "HL",
                "label": "High-Low Outlier",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        27,
                        83,
                        224,
                        255
                    ],
                    "size": 6,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            18,
                            57,
                            118,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": "LH",
                "label": "Low-High Outlier",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        153,
                        208,
                        232,
                        255
                    ],
                    "size": 5,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline": {
                        "color": [
                            126,
                            171,
                            191,
                            255
                        ],
                        "width": 0.5
                    }
                },
                "value": "LL",
                "label": "Low-Low Cluster",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [
                        156,
                        156,
                        156,
                        255
                    ],
                    "size": 2,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "value": "",
                "label": "Not Significant",
                "description": ""
            }
        ],
        "fieldDelimiter": ","
    }
}

SIMILAR_POINTS = {
    "renderer": {
        "type": "classBreaks",
        "field": "SIMRANK",
        "classificationMethod": "esriClassifyManual",
        "minValue": 0,
        "classBreakInfos": [
            {
                "symbol": {
                    "type": "esriSMS",
                    #                    "url": "f4132ce594a735c060bea90da35e348f",
                    #                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAKpJREFUCJljYYAARiHtUEMhcW7uO/sWnGVgYPjGwMDAwMKgHStpZWk7nVtQypuBkZFFUsPl3PP714rvbG87wGJuadvKLSTtDzWBgYNH0EhMUWvqHQYGUxY2Nk5nBjTAzSOopR1Y6cjC8J/hD7okw///DD+//f/O8u37ly0cvEJ5yHJfP70+fWdnx36Wsws+FJsnMHKwcfOGMPxn4GL48+vg06c3cxgYGP4DALg/Mu+4EmWfAAAAAElFTkSuQmCC",
                    #                    "contentType": "image/png",
                    "style": "esriSMSCircle",
                    "color": [168, 0, 0, 255],
                    "size": 8,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 0,
                "label": u"Reference Location",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriPMS",
                    "url": "f4132ce594a735c060bea90da35e348f",
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAZJJREFUOI2t1EFIlEEYxvE/n9u+S6MYE3atw4IH2ZMH711KKqQgCJTs7NGjnhNvBZ4Loiio8CJRJHSIrnuMZSMQ1FPKlNJIzyqfHbZd9jO/dhd6LnN4Z37zzsBMgf+UQl7hZrl8iRCuJ1A+guMEvpwZGVl7Wa9v9wRNwtBZ7x+kIdwDBlIg+VM73NlZueH9s1IIc6/gIBeahXP73n9MoZLT6EABZg/MJselShW+nQrtmz0iH2mn6NwFDzWki8DPDDTl/QRwqxvSyqBzfgxef5auZqAEZnpFWhmGK9778RBCtfNoXY90MkPOEWOcBjJQqV8IQFIFspe9CUz0gxzG2G6g847WU7jdDxSaw1YGGgzh6Q+z5cQ53wvSiJGaBPA+Az2BX9dgughvuyEpUJcQbADPMxDAG+ndZVh0zt3Pe4RHQC0EvkLDzO5KavwFAXyQlkaljfNmj4ehVHSuDXyPkWqzk10zuyPpU2vdqRvX4QXSupnNE+OUpDJw3CyxCjyUtNe5JvcbAXYlLQAL/5jTE9RXfgOYb4w3BYjzbgAAAABJRU5ErkJggg==",
                    "contentType": "image/png",
                    "width": 13,
                    "height": 13,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 1,
                "label": "1",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriPMS",
                    "url": "f1c17e883f5602288691637b0e14adb5",
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAdhJREFUOI2t1D9oU1EUx/Fvbl7yYtq0MRXr5B8IdJBMGToJ4qIhllBBECpWcBMc7CLW2WKXWlDcKhRFwYpLKY0GBK1rwEViNFCqdinlWUMT33l93Ocg0TxNbAL+1nvPh3sOnGvwn2K0O5gZHT3s4ZxWiqR28ZRSHwjZi1efFL50BN3NZGJOVN1GuxcDqKCnIaDAA9iJ3JkeyT6MRqKXryws1NtC98aPx+2q8RpNqs1DgyFDjVfr25lL6XRqrljcaAnZ1dgctEV+ZU/Y2D+YiJWAQ8C2D5rN5YY1+sxuSCP7emOJkaPJp4vvKqd8kKc43ynSyMH+gZOJhJW2LKv4G+qgpT+zN9ZDrVYbA5ohHQl0CSmCiEgKmloLoD6BHu4G+r5jA0T8kKLgac52A61bFsBnH2T3xh8YWxu3gspIdILYjkO+VAF44YOuz8/b09nsmAqzvNustNa8Kr/HElkFHvkggGtLS/mJE8duDPb03QwZqiXiuC4rpY88r6w5pmleEBHnLwhg5uXKVGZoaPXIQPz+gf6+SDQcBqDuuqx/3SJffMuayKZpmudE5E2jruX2L5fLj4GCaZoTQE5Ekvzc2zLwDJgVkW/NNW2/EWBTRCaByX/c6QjqKj8AMJelTDPU9DYAAAAASUVORK5CYII=",
                    "contentType": "image/png",
                    "width": 13,
                    "height": 13,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 2,
                "label": "2",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriPMS",
                    "url": "95ec6840130d393fbe61da2bd3203b4c",
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAd5JREFUOI2t1M9rE0EYxvHv7G6zaYkSUrAlBw20WFByqUj/BBWEgCIEam2uFeohNyv0UPDHqUotBoQVJKX2oJbUg2JzEi8e7FFTKRSNJymLmmbTWbY7HkpKtiY2AZ/rO++H94WZMfhPMVoVSpaV8JW6KDRtUPm+Ar5gGK9OZTLf24LW5+eP7HZ33/chgxC6UgqE2Ct63sO1XG4h4nnXT05OOi2hUj4f3ZXyHZBsOqYQejgUGv/peReeZrPJ8dnZH00h33UthGiONCTS03Osr7f3M3AC2A5AnyxrBLh0GFLP8f7+2M10+vndpaXzBye62i5Sz+lE4lwsFjtj2/bHRujQlQ6mLxqlWq2OAgEo3CmkaxpSyiQ0ribEN5Qa6QSqOM7+APuQUGpVwZVOoFK5DFAOQLVQKG/UavcMXY+1g2w7Do+WlwHeBqDhsbGdtVxuVNe016J+k1vEV4qFYpGvtr0JLAYggOGJiTcvpqdvDcTjt0NdXU2RHddlsVhkrlBwTdO8JqV0/4IALs/M3LmRSm2eHRp6MhCPh49GIijgd6VCqVzm8coKHzY2tkzTTEsp39f7mr7+uULhGbBqmmYWSEkpBwEFrAMvgQdSyl+NPS2/EWBLSjkFTP3jTFtQR/kDNhKlh4aUP40AAAAASUVORK5CYII=",
                    "contentType": "image/png",
                    "width": 13,
                    "height": 13,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 3,
                "label": "3",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriPMS",
                    "url": "0ca324c34bb5e8f4c244a48d3448841d",
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAdJJREFUOI2t1E9IVFEUx/Hv9Y1zB4ahGKWQWcwEGm4eBC2E9g8NBoIgCoymlYvciStbRIsiSCwKWwj9eTQUQaTQg7S3q7YtZaj8EyoIISPavOgOOqdN1jyayXngb3vu+dx7FufGOKDEmhXWfD8nkAe6ERHgc5tSrzOOs9YStOp5KaX1HYHLiFj1tV2R+wueV0xqfaXLcX40hb76/mHgnYjYjW5VYOl4vLBZqZx+MT5unx8d/dYQiok8FGiI1CeVTB7p6ugoAVmgEoJW5ub6BM7uh+zlWCaTvjY09PL61NRACGpT6qK0qvzOid7e/nQ6fbJcLn/8A4lSNhKNOtrZSRAEg8BfSEEi6otiloUxxoa60QRWgL4o0FYQACRCECI+cC4KVFpaAlgNQbtKPZWdnVsxy0q3gnwPAu65LsDbEJRznJ9fPG/Qsqw3ah+kVqvxeGaGhfX1ZeBZCALoyednZycnr/bkcjfi7e0NEVOt8mR6mtuuW9VaXzLGVP+BAAaGh2+OFArLp2z70fFsNnEolQJgc3ub0uIiD4pF3s/Pb2itLxhjPuz1Ndz+Cdd9PgG+1noEOGOM6QYE+AS8Au4aY7bqe5p+I8CGMWYMGPvPmZagSPkFOZqkEatWzp0AAAAASUVORK5CYII=",
                    "contentType": "image/png",
                    "width": 13,
                    "height": 13,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 4,
                "label": "4",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriPMS",
                    "url": "6fc4e5ec509e66a906ec00496008c3f5",
                    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAddJREFUOI2t1DFoU0Ecx/Hv5b30ntCQ+gZLXXzDazu9Djq0i64qKBZBKlTU2aGDm8lqareUZAvqEqsURAodFLtIkW5dGvA1NlCqgiI1+ngm5irmnFqTmpgE/K1397n//447k/8Us91AUCo5Gi4IrV2E0MDbOiwfdd0PXUFfisWYEYmk0fqmAAMArQEQWmc/FQqP+qW81T8yUm0LBZubA0Qiq4DXalchhHHEsm6Uw/D88uKid3Fq6nPrigzjQTukMfFY7Nhx2/aBE8D3JijY2hoHLndC9uM6jn0vmXx6J5U611yR1tcQolsHgJOed9a27VPlcnn9DyREx5YOZ2hwkEqlMg2sN56R1StkGgZKKQ8aWxPiHVqP9wJ9C8ODAg4gDSsCrvQCvfF9gPdNkDDN/M9qdS4ajdrdIEEYMpfNArxsguKOU/u4sTFtmObzSIfb+1Wvk8vnKe3sbAOPmyCAobGxF6tLS8nR4eGU1dfXEvlRq3F/YYG76fSelPK6UmrvLwjgzOTkbGJmZvv0xMTDUde1BuJx0JqvQUDB95nP5Xi1trYrpbyqlHq9v67l65/NZJ6QyaxIKW8Dl5RSLqCBIvAMmFdKBY1r2n4jwK5SKgEk/jGnK6in/AYguZyuULvqkwAAAABJRU5ErkJggg==",
                    "contentType": "image/png",
                    "width": 13,
                    "height": 13,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0
                },
                "classMaxValue": 5,
                "label": "5",
                "description": ""
            }
        ]
    },
    "transparency": 10
}

SIMILAR_LINES = {
    "renderer": {
        "type": "classBreaks",
        "field": "SIMRANK",
        "classificationMethod": "esriClassifyManual",
        "minValue": 0,
        "classBreakInfos": [
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [168, 0, 0, 255],
                    "width": 3
                },
                "classMaxValue": 0,
                "label": "Reference Location",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [82, 24, 24, 255],
                    "width": 3
                },
                "classMaxValue": 1,
                "label": "1",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [143, 80, 77, 255],
                    "width": 3
                },
                "classMaxValue": 2,
                "label": "2",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [214, 156, 156, 255],
                    "width": 3
                },
                "classMaxValue": 3,
                "label": "3",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [227, 186, 186, 255],
                    "width": 3
                },
                "classMaxValue": 4,
                "label": "4",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [240, 218, 218, 255],
                    "width": 3
                },
                "classMaxValue": 5,
                "label": "5",
                "description": ""
            }
        ]
    },
    "transparency": 10
}

SIMILAR_POLYGONS = {
    "renderer": {
        "type": "classBreaks",
        "field": "SIMRANK",
        "classificationMethod": "esriClassifyManual",
        "minValue": 0,
        "classBreakInfos": [
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [168, 0, 0, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [110, 110, 110, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 0,
                "label": "Reference Location",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [82, 24, 24, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [255, 255, 255, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 1,
                "label": "1",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [143, 80, 77, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [255, 255, 255, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 2,
                "label": "2",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [214, 156, 156, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [255, 255, 255, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 3,
                "label": "3",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [227, 186, 186, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [255, 255, 255, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 4,
                "label": "4",
                "description": ""
            },
            {
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [240, 218, 218, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [255, 255, 255, 255],
                        "width": 0.4
                    }
                },
                "classMaxValue": 5,
                "label": "5",
                "description": ""
            }
        ]
    },
    "transparency": 10
}


LINE_LABELING_INFO = {
        "labelPlacement" : "esriServerLinePlacementAboveAlong",
        "labelExpression" : "[FROM_DIST]",
        "useCodedValues" : True,
        "symbol" :
        {
          "type" : "esriTS",
          "color" : [107, 0, 0, 255],
          "backgroundColor" : None,
          "borderLineColor" : None,
          "verticalAlignment" : "bottom",
          "horizontalAlignment" : "center",
          "rightToLeft" : False,
          "angle" : 0,
          "xoffset" : 0,
          "yoffset" : 0,
          "font" :
          {
            "family" : "Arial",
            "size" : 10,
            "style" : "normal",
            "weight" : "normal",
            "decoration" : "none"
          }
        },
        "minScale" : 0,
        "maxScale" : 0
      }


def getLabelingInfo(labelExpression, shapeType):
    '''remember label expression must be a string example "[FROM_DIST]"
    '''
    if "polyline" in shapeType.lower():
        LINE_LABELING_INFO["labelExpression"] = labelExpression
        return LINE_LABELING_INFO

def applySimpleRenderer(lyr):
    """To apply the defined symbology from lyrx to the lyr using apply symbology
    """
    import os
    shapeType = arcpy.Describe(lyr).shapeType.lower()
    if 'point' in shapeType:
        symbolLyr = os.path.join(os.path.dirname(__file__), 'SIMPLE_RENDERER_POINT.lyrx')
    elif 'polyline' in shapeType:
        symbolLyr = os.path.join(os.path.dirname(__file__), 'SIMPLE_RENDERER_POLYLINE.lyrx')
    elif 'polygon' in shapeType:
        symbolLyr = os.path.join(os.path.dirname(__file__), 'SIMPLE_RENDERER_POLYGON.lyrx')
    else:
        raise Exception("Unsupported shapeType of {}".format(shapeType))

    arcpy.ApplySymbologyFromLayer_management(lyr, symbolLyr)

def getSimpleRendererInfo(shapeType, taskName=None, transparency=25):
    '''returns simple renderer drawing info'''
    def updateColorAndOutline(drawingInfo, color):
        renderer = drawingInfo["renderer"]
        symbol = renderer["symbol"]
        symbol["color"] = color
        symbol["outline"]["color"] = color
        return drawingInfo
    
    def updateColor(drawingInfo, color):
        renderer = drawingInfo["renderer"]
        symbol = renderer["symbol"]
        symbol["color"] = color
        return drawingInfo

    if taskName == u'CreateBuffers':
        return SIMPLE_BUFFER_RENDERER
    shapeType = shapeType.lower()
    if 'point' in shapeType:
        drawing_info = deepcopy(SIMPLE_RENDERER_POINT)
        if taskName == "CreateWatersheds":
            return updateColorAndOutline(drawing_info,
                                  CREATEWATERSHEDS_SIMPLE_COLOR)
        arcpy.AddMessage('drawing_info: {}'.format(drawing_info))
        return drawing_info
    elif 'polyline' in shapeType:
        drawing_info = deepcopy(SIMPLE_RENDERER_POLYLINE)
        if taskName == "DetermineOptimumTravelCostNetwork":
            return updateColor(drawing_info,
                               OPTIMUMTRAVELCOSTNEIGHBORNETWORK_SIMPLE_COLOR)
        return drawing_info
    elif 'polygon' in shapeType:
        if taskName == "GenerateTessellations":
            return deepcopy(SIMPLE_RENDERER_TESSELLATION)

        drawingInfo = deepcopy(SIMPLE_RENDERER_POLYGON)
        if taskName == "CreateViewshed":
            updateColorAndOutline(drawingInfo,
                                  CREATEVIEWSHED_SIMPLE_COLOR)
        if transparency != 25:
            drawingInfo["transparency"] = transparency
        return drawingInfo
    else:
        return None

def getGraduatedColorsInfo(data, classificationField, normalizationField=None, shapeType=None,
                           transparency=25, taskName=None):
    '''returns drawing info for graduate symbols
    data: layer
    classificationField: field name on which to classify
    transparency : int between 0 - 100 for transparency. default is 25
    '''
    rendererDef = deepcopy(GRADUATED_COLORS_DEF)
    if taskName and taskName == "TraceDownstream":
        rendererDef["colorRamp"] = BLUE_COLOR_RAMP
    rendererDef["classificationField"] = classificationField
    if normalizationField:
        rendererDef["normalizationType"] = "esriNormalizeByField"
        rendererDef["normalizationField"] = normalizationField
    if shapeType:
        if 'line'in shapeType:
            rendererDef["baseSymbol"] = GRADUATED_COLORS_LINE_BASE_SYMBOL
        if 'point' in shapeType.lower():
            rendererDef["baseSymbol"] = GRADUATED_COLORS_POINT_BASE_SYMBOL

    #debugUtils.debugRenderer(rendererDef)

    drawingInfo = getDrawingInfo(data, rendererDef, transparency)
    if taskName:
        return drawingInfo
    #update purple color ramp
    renderer = drawingInfo.get("renderer")
    if renderer and "classBreakInfos" in renderer:
        classBreaks = renderer["classBreakInfos"]
        if len(classBreaks) > 1 :
            colorRamp = GRADUATED_COLOR_RAMPS[len(classBreaks)]
            for classBreak,colorVal in zip(classBreaks,colorRamp):
                classBreak["symbol"]["color"] = colorVal

    return drawingInfo

def getGraduatedSymbolsInfo(data, classificationField, shapeType="Polygons", transparency=25):
    '''returns drawing info for graduate dymbols
    data: layer
    classificationField: field name on which to classify
    transparency : int between 0 - 100 for transparency. default is 25
    '''
    lyr = "tmpLayer"
    arcpy.MakeFeatureLayer_management(data, lyr)
    dirfile = os.path.abspath(os.path.realpath(os.path.dirname(__file__)))
    lyrxFile = os.path.join(dirfile, "GraduatedSymbols_Polygons.lyrx")
    fieldValues = "VALUE_FIELD point_count {}".format(classificationField)
    arcpy.ApplySymbologyFromLayer_management(lyr, lyrxFile, fieldValues, "UPDATE")
    fs = arcpy.FeatureSet(lyr)
    drawinginfo_str = fs._arc_object.getsymbology()
    if drawinginfo_str:
        rendererJSON = json.loads(drawinginfo_str)
        drawingInfo = {}
        drawingInfo["renderer"] = rendererJSON["renderer"]
        drawingInfo["transparency"] = transparency
        if ("minValue" in drawingInfo["renderer"]) and (drawingInfo["renderer"]["minValue"] == 0):
            #create drawinginfo without zeroes
            addZeroClassBreak(drawingInfo["renderer"])
        # round off values to 8
        classBreaks = drawingInfo["renderer"]["classBreakInfos"]
        minValue = drawingInfo["renderer"]["minValue"]
        drawingInfo["renderer"]["minValue"] = round(minValue, 8)
        for classBreak in classBreaks:
            maxV = classBreak["classMaxValue"]
            tmpMaxV = round(maxV, 8)
            classBreak["classMaxValue"] = tmpMaxV
            maxVLabel = classBreak["label"]
            if str(maxV) in maxVLabel:
                maxVLabel.replace(str(maxV), str(tmpMaxV))
        return drawingInfo



def getUniqueValueRendererInfo(data, uniqueValueFields, transparency=50, rendererDef=None,
                               showOtherValues=False,dataWhereClause=None):
    '''returns unique value drawing info
    data: Polygon layer.
    uniqueValueFields: an array of unique value fields, separate elements by , .
    transparency : if polygon provide a custom transparency value, default is 50
    '''
    #arcpy.AddMessage("getUniqueValueRendererInfo")
    if not rendererDef:
        rendererDef = UNIQUE_VALUE_DEF
    rendererDef["uniqueValueFields"] = uniqueValueFields
    #arcpy.AddMessage(rendererDef["UniqueValueFields"])
    drawingInfo = getDrawingInfo(data, rendererDef, transparency, showOtherValues,dataWhereClause)
    try:
        localeInfo = locale.localeconv()
        delimiter = localeInfo["decimal_point"]
        if delimiter not in ".":
            renderer = drawingInfo["renderer"]
            for valclass in renderer["uniqueValueInfos"]:
                if delimiter in valclass["value"]:
                    val = valclass["value"].replace(delimiter,".").rstrip(")").lstrip("(")
                    val = val.replace(" ", "")
                    if "." in val:
                        #trim trailing zeroes and dot, at 10.5
                        val = val.rstrip("0")
                        val = val.rstrip(".")
                    valclass["value"] = val
                    valclass["label"] = valclass["value"]
    except:
        pass
    return drawingInfo


def sortClassValues(classvalues):
    """Convert a list of sorted number strings to a list of sorted numbers"""
    #arcpy.AddMessage("sortClassValues")
    newvalues = [ast.literal_eval(i) for i in classvalues]
    newvalues.sort()
    return newvalues

# End def sortClassValues

def updateClassBreaksLabelsSymbols(classBreaksRenderer, updateLabels=True, updateSymbols=False):
    '''Updates label values or symbols sizes; temporary fix 
    New implementation for featureset symbology does not have the classMinValue. So it needs
    to fetch from the label.
    '''
    classBreaks = classBreaksRenderer["classBreakInfos"]
    #workaround for sqlserver 8 decimals
    minVal = classBreaksRenderer["minValue"]
    classBreaksRenderer["minValue"] = round(minVal, 8) - 0.00000001
    maxClassbreak = len(classBreaks) - 1
    for i, classBreak in enumerate(classBreaks):
        maxV = classBreak["classMaxValue"]
        tmpMaxV = round(maxV, 8)
        if i == maxClassbreak:
           tmpMaxV = tmpMaxV + 0.00000001
        classBreak["classMaxValue"] = tmpMaxV
        if updateLabels:
            maxVLabel = classBreak["label"]
            maxVLabel.replace(str(maxV), str(tmpMaxV))
    if updateSymbols:
        for classBreak in classBreaks:
            # workaround for increasing size
            symbol = classBreak["symbol"]
            if "size" in symbol.keys():
                siz = symbol["size"]
                classBreak["symbol"]["size"] = siz + 4
            elif "width" in symbol.keys():
                wid = symbol["width"]
                classBreak["symbol"]["width"] = wid + 0.5
        # workaround for background fill symbol,
        #since the transparrency get's lost in setSymbology
        backgroundFillSymbol = {"type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [255, 255, 255, 0],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSSolid",
                                    "color": [68,68,68,255],
                                    "width": 1.5
                                }}
        classBreaksRenderer["backgroundFillSymbol"] = backgroundFillSymbol


def _getUniqueValueSymClassValues(symbology):
    '''This is a replacement of the previous symbology.classValues property.
    '''
    renderer = symbology.get('renderer', None)
    classValues = []
    if renderer and renderer.get('type', '') == 'uniqueValue': 
        uniqValueInfos = renderer.get('uniqueValueInfos', [])

        for uval in uniqValueInfos:
            classValues.append(uval['value'])
    
    return classValues

def update_unique_value_drawing_transparency(drawing_info, transparency=50):
    """Update the symbology transparency so the overlapping polygons can be visible on Pro. This function is
    for CreateBuffers tool with stack of polygons generated with ringType as disks.

    Args:
        drawing_info: a dictionary with the drawing information.
        transparency: a float value within the range of [0, 100] defining the transparency.
    Returns:
        No returns (pass by reference).
    Raises:
        No exceptions.

    """
    if transparency < 0 or transparency > 100:
        return
    
    if not isinstance(drawing_info, dict):
        return
    
    renderer = drawing_info.get("renderer", None)
    if renderer:
        unique_val_infos = renderer.get("uniqueValueInfos", [])
        for uniq_infos in unique_val_infos:
            symbol = uniq_infos.get("symbol", {})
            color = symbol.get("color", [])
            if len(color) == 4:
                color[3] = int(255 * (transparency / 100.0))
                symbol["color"] = color


def getDrawingInfo(data, rendererDef, transparency=50, showOtherValues=True, dataWhereClause=None):
    '''create layerOutDescription from outDescription Alternative'''
    #arcpy.AddMessage("getDrawingInfo")
    rendererType = rendererDef.get("type")
    #arcpy.AddMessage("rendererType: {}".format(rendererType))
    #workarounds for classbreaksymbols
    if rendererType == "classBreaksDef":
        #workaround for SQL Server
        roundToDecimals = True
        # current size range is from 4-18
        # increment +4
        cbtype = rendererDef.get("classBreaksType")
        updateSymbolSize = True	if cbtype == "esriGraduatedSymbols" else False
        # update labels for normalization since the decimal values
        # may not be appropriate for labels Workaround
        updateClassBreaksLabels = True	if "normalizationField" in rendererDef else False
    else:
        updateSymbolSize = False
        updateClassBreaksLabels = False
        roundToDecimals = False

    outLayerName = arcpy.MakeFeatureLayer_management(data,"outLayer", dataWhereClause).getOutput(0)
    # Feature sets do not support where clause
    if dataWhereClause:
        outLayerNameCopy = "in_memory/outLayerCopy"
        arcpy.management.CopyFeatures("outLayer", outLayerNameCopy)
        fs = arcpy.FeatureSet(outLayerNameCopy)
    else:
        fs = arcpy.FeatureSet("outLayer")
    # set transparency if only the geometrytype is polygon
    shapeType = arcpy.Describe(outLayerName).shapeType
    if shapeType == "Polygon":
        outLayerName.transparency = transparency

    try:
        fs._arc_object.setsymbology(rendererDef)
        symbology = json.loads(fs._arc_object.getsymbology())
        # workaround for unique values
        if rendererType == "uniqueValueDef" and outLayerName.supports("SYMBOLOGY"):
            try:
                classValues = sortClassValues(_getUniqueValueSymClassValues(symbology))
                symbology['classValues'] = classValues
            except Exception as ex:
                arcpy.AddMessage("Cannot sort values from the unique value renderer because {}".format(str(ex)))
        #showOthervalues
        symbology['showOtherValues'] = showOtherValues
        symbology['transparency'] = transparency
        # get drawing info
        drawingInfo = symbology
        #remove the symbol for other values if required
        if not showOtherValues:
            defaultSymbolProperties = ("defaultLabel", "defaultSymbol")
            renderer = drawingInfo["renderer"]
            for prop in defaultSymbolProperties:
                if prop in renderer:
                    del renderer[prop]
        if updateClassBreaksLabels or updateSymbolSize or roundToDecimals:
            updateClassBreaksLabelsSymbols(drawingInfo["renderer"],
                                           updateClassBreaksLabels,
                                           updateSymbolSize)
        return drawingInfo
    except Exception as err:
        # import traceback, sys
        # for msg in traceback.format_exception(*sys.exc_info()):
        #     arcpy.AddMessage(msg)
        # if hasattr(err, "message"):
        #    arcpy.AddMessage(err.message)
        arcpy.AddMessage("unable to support the renderer definition")
        return None


# End def createLayerOutDesc


def getHotSpotRenderingInfo(outshape, pt_count):
    '''returns drawing info for Hot Spots
    '''
    if outshape == "Polygon":
        return HOT_SPOT_POLYGONS
    else:
        if pt_count > 10000:
            for i in range(0, 7):
                HOT_SPOT_POINTS["renderer"]["uniqueValueInfos"][i]["symbol"]["width"] = 5
                HOT_SPOT_POINTS["renderer"]["uniqueValueInfos"][i]["symbol"]["height"] = 5

        return HOT_SPOT_POINTS


def getOutlierRenderingInfo(outshape, pt_count):
    '''returns drawing info for Outliers
    '''
    if outshape == "Polygon":
        return OUTLIER_POLYGONS
    else:
        if pt_count > 10000:
            for i in range(0, 4):
                OUTLIER_POINTS["renderer"]["uniqueValueInfos"][i]["symbol"]["width"] = 5
                OUTLIER_POINTS["renderer"]["uniqueValueInfos"][i]["symbol"]["height"] = 5

        return OUTLIER_POINTS


def getSimilarRenderingInfo(numResult, shapeType):
    '''returns drawing info for graduate symbols
    data: layer
    classificationField: field name on which to classify
    transparency : int between 0 - 100 for transparency. default is 10
    '''

    renderDict = {'point': SIMILAR_POINTS,
                  'polyline': SIMILAR_LINES,
                  'polygon': SIMILAR_POLYGONS}

    if numResult > 5:
        for i in range(1, 6):
            level = float(numResult) / 5
            renderDict[shapeType]["renderer"]["classBreakInfos"][i]["classMaxValue"] = int(round(level * (i)))
            renderDict[shapeType]["renderer"]["classBreakInfos"][i]["label"] = "{0} - {1}".format(
                int(round(level * (i - 1))) + 1, int(round(level * (i))))
    else:
        for i in range(numResult, 5):
            del renderDict[shapeType]["renderer"]["classBreakInfos"][numResult + 1]
    if numResult > 800:
        for i in range(1, 6):
            if shapeType == "point":
                SIMILAR_POINTS["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 8
                SIMILAR_POINTS["renderer"]["classBreakInfos"][i]["symbol"]["height"] = 8
            elif shapeType == 'polyline':
                SIMILAR_LINES["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 1

    elif numResult > 100:
        for i in range(1, 6):
            if shapeType == "point":
                SIMILAR_POINTS["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 10
                SIMILAR_POINTS["renderer"]["classBreakInfos"][i]["symbol"]["height"] = 10
            elif shapeType == 'polyline':
                SIMILAR_LINES["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 2
    # debugUtils.debugRenderer(renderDict[shapeType])
    return renderDict[shapeType]


def getDBClusterRenderingInfo(colorCount, noise):

    getColors = [[166, 206, 227, 255], [31, 120, 180, 255], [178, 223, 138, 255], [51, 160, 44, 255],
                 [251, 154, 153, 255], [227, 26, 28, 255], [253, 191, 111, 255], [255, 127, 0, 255]]
    getLegends = ["light blue", "blue", "light green", "green", "pink", "red", "beige", "orange"]

    symbolList = []

    DB_CLUSTER = {
        "renderer": {
            "type": "uniqueValue",
            "field1": "COLOR_ID",
            "uniqueValueInfos": [],
            "fieldDelimiter": ","
        },
        "transparency": 0,
    }

    if noise:
        colorCount = colorCount[1:]
        DB_CLUSTER["renderer"]["defaultSymbol"] = {
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
        DB_CLUSTER["renderer"]["defaultLabel"] = "Noise"

    for i, count in enumerate(colorCount):
        legend = getLegends[i]
        DB_CLUSTER_POINT = {
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
        DB_CLUSTER_POINT['symbol']['color'] = getColors[i]
        DB_CLUSTER_POINT['value'] = i + 1
        clusterPurl = "cluster" if count == 1 else "clusters"
        DB_CLUSTER_POINT['label'] = '{0} {1} displayed in the {2} color'.format(count, clusterPurl, legend)
        symbolList.append(DB_CLUSTER_POINT)

    DB_CLUSTER["renderer"]["uniqueValueInfos"] = symbolList

    return DB_CLUSTER

def addZeroClassBreak(renderer):
    '''adds a zero classbreak'''
    if not 'classBreakInfos' in renderer:
        return
    try:
        classBreakInfos = renderer["classBreakInfos"]
        firstClassBreak = classBreakInfos[0]
        if firstClassBreak["classMaxValue"] == 0:
            # just change the label and symbol
            firstClassBreak["label"] = "=0"
            firstClassBreak["symbol"]["color"][3] = 0
        else:
            # add a new zero classbreak
            zeroClassBreak = deepcopy(firstClassBreak)
            zeroClassBreak["classMaxValue"] = 0
            zeroClassBreak["label"] = "=0"
            symbol = zeroClassBreak["symbol"]
            symbol["color"][3] = 0
            classBreakInfos.insert(0, zeroClassBreak)
    except KeyError:
        arcpy.AddMessage("KeyError: Unable to add zero classbreak")
    except IndexError:
        arcpy.AddMessage("IndexError: Unable to add ZeroClassBreak")
    except Exception:
        arcpy.AddMessage("Generic Exception: Unable to add ZeroClassBreak")
