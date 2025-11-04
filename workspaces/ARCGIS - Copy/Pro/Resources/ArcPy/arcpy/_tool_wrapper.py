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

def NotImplServerLinux():
    """ Function injected in lieux of tool wrappers in arcpy.toolbox_linux
        for tools not supported in Python 3 runtime for ArcGIS Server on Linux

    """
    raise NotImplementedError("Tool not supported by Python 3 runtime for ArcGIS Server on Linux")
