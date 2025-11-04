#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

import arcpy

class EnvManager:
    """context manager for arcpy.env"""
    def __init__(self, **kwargs):
        self._original_envs = {}
        self._environments = kwargs

    def __enter__(self):
        envs = list(arcpy.env._environments) + ['autoCancelling', 'overwriteOutput', 'useCompatibleFieldTypes']

        # Handle invalid keys and read-only environments
        for k in list(self._environments.keys()):
            if k not in envs:
                msg = arcpy.GetIDMessage(87059).replace('%1', '%s') % k
                raise AttributeError(msg)
            elif k in ['scratchGDB', 'scratchFolder']:
                msg = arcpy.GetIDMessage(87064).replace('%1', '%s') % k
                raise AttributeError(msg)

        for k, v in list(self._environments.items()):
            if k in envs:
                self._original_envs[k] = getattr(arcpy.env, k)
                setattr(arcpy.env, k, v)

    def __exit__(self, exc_type, exc_value, traceback):
        self.reset()

    def reset(self):
        for k, v in list(self._original_envs.items()):
            setattr(arcpy.env, k, v)
