"""
Tool:               <Tool label>
Source Name:        <File name>
Version:            <ArcGIS Version>
Author:             <Author>
Usage:              <Command syntax>
Required Arguments: <parameter0>
                    <parameter1>
Optional Arguments: <parameter2>
                    <parameter3>
Description:        <Description>
"""
import arcpy


def ScriptTool(parameter0, parameter1, parameter2, parameter3):
    """ScriptTool function docstring"""

    return


if __name__ == '__main__':
    # ScriptTool parameters
    parameter0 = arcpy.GetParameterAsText(0)
    parameter1 = arcpy.GetParameter(1)
    parameter2 = arcpy.GetParameterAsText(2)
    parameter3 = arcpy.GetParameterAsText(3)
    
    ScriptTool(parameter0, parameter1, parameter2, parameter3)

