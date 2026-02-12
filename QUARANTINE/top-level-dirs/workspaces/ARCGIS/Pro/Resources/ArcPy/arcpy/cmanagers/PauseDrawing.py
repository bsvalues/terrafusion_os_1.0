#COPYRIGHT 2023 ESRI
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

from enum import Flag, auto 

class ViewContext(Flag):
    maps = auto()
    layouts = auto()
    maps_and_layouts = auto() 

class PauseDrawing:
    def __init__(self, context=ViewContext.maps_and_layouts):
        self.context = context
        self.maps = []
        self.layouts = []

    def fall_back_method(self, context):
        pass

    def redirect_call(self, method_name):
        method = getattr(self, method_name, self.fall_back_method)
        return method

    def __enter__(self):
        method = self.redirect_call("PauseDrawing")
        self.maps, self.layouts = method(self.context)

    def __exit__(self, exc_type, exc_value, traceback):
        method = self.redirect_call("RestoreDrawing")
        method(self.context, self.maps, self.layouts)
