"""-----------------------------------------------------------------------------
Name:              WeightedOverlay.py
Purpose:           This raster analysis service allows Cost path analysis
Author:            Esri Inc.
Created:           2/4/2014
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.3
-----------------------------------------------------------------------------"""
# internal libraries
import arcpy
import json

class LicenseError(Exception):
    pass


# Define function templates used in this service:
# Sample template
remapjson = {
    "rasterFunction": "Remap",
    "rasterFunctionArguments": {
        "InputRanges": [],
        "OutputValues": [],
        "GeometryType": "",
        "Geometries": [],
        "NoDataRanges": [],
        "AllowUnmatched": False,
        "Raster": "",
    },
    "outputPixelType": "",
    "variableName": "Raster"
}

calcjson = {
    "rasterFunction": "RasterCalculator",
    "rasterFunctionArguments": {
        "Rasters": [
            {
                "rasterFunction": "Remap",
                "rasterFunctionArguments": {
                    "Rasters": "$$-Error-InputMissing-Invalid",
                    "UseTable": "false",
                    "InputRanges": [],
                    "OutputValues": [],
                    "NoDataRanges": [],
                    "AllowUnmatched": "true"
                }
            },
            {
                "rasterFunction": "Remap",
                "rasterFunctionArguments": {
                    "Rasters": "$$-Error-InputMissing-Invalid",
                    "UseTable": "false",
                    "InputRanges": [],
                    "OutputValues": [],
                    "NoDataRanges": [],
                    "AllowUnmatched": "true"
                }
            },
        ],
        "InputNames": [],
        "Expression": "",
        "ExtentType": 0,
        "CellsizeType": 1
    }
}

def getOutSR(context):
    """
    :param context: context parameter contains output spatial reference info
    :return wkid code or spatial reference object:
    """
    outsr = ""
    try:
        if context == "" or context == "#":
            arcpy.AddMessage("Using input raster dataset's spatial reference.")
            return outsr
        context = json.loads(context)
        contextlower = dict((k.lower(), v) for k,v in context.items())
        if "outsr" in contextlower:
            return contextlower["outsr"]
        else:
            return outsr
    except:
        arcpy.AddWarning("Invalid output coordinate system setting, revert to default.")
        return outsr

def getRemapVals(rasrow):
    """
    :param rasrow: Single raster input in the weighted overlay table
    :return rastbl: reorganized raster input to be assigned to template
    """

    try:
        invals = []
        outvals = []
        remapjsonlist = []

        # Check if raster name/path exist
        if not "name" in rasrow:
            raise Exception("No input raster name found.")
        # Check if influence value defined
        elif not "influence" in rasrow:
            raise Exception("No influence value found for raster: {0}.".format(rasrow["name"]))
        # Check if remap value pair exists
        elif not "remapval" in rasrow:
            raise Exception("No remap value pairs found for raster: {0}.".format(rasrow["name"]))
        else:
            # Now apply simple validation check for raster input
            raspath = rasrow["name"]
            if raspath == "" or raspath == None or not isinstance(raspath, str):
                raise Exception("Invalid raster input found: {}.".format(rasrow["name"]))

            # Now apply simple validation check for influence
            influ = rasrow["influence"]
            if influ == "" or influ == None:
                raise Exception("Invalid influence value found for raster: {0}.".format(rasrow["name"]))
            elif influ > 100 or influ <= 0:
                raise Exception("Invalid influence value found for raster: {0}, influence value should be between 0 and 100.".format(rasrow["name"]))

            # Now read remap value pair first
            remapval = rasrow["remapval"]
            # Check if remap value pair really exist
            if not isinstance(remapval, list):
                raise Exception("No remap value range defined.")
            else:
                # Read remap value pairs first
                for i in remapval:
                    if len(i) < 2:
                        arcpy.AddWarning("Missing valid in/out remap value pair: {}".format(str(i)))
                        continue
                    else:
                        # Append in/out value pairs to in/out list used in function
                        # If the element of i is not the correct type, we leave it to the raster function template for validation
                        outvals.extend(i[-1])
                        invals.extend(i[:-1])

            #Assign value from input list to function template
            remap_temp = remapjson
            remap_temp["rasterFunctionArguments"]["Raster"] = rasrow["name"]
            remap_temp["rasterFunctionArguments"]["InputRanges"] = invals
            remap_temp["rasterFunctionArguments"]["OutputValues"] = invals

            remapjsonlist.append([remap_temp, rasrow["influence"]])

            return remapjsonlist

    except Exception as e:
        arcpy.AddError(e)
        return None

def getRasTbl(rastbl):
    """
    :param rastbl: The input JSON that defines input raster and remapping table
    :return wofunc: Weighted overlay function template JSON object
    """

    try:
        raslist = []
        wojson = json.loads(rastbl.lower())

        if not "rasters" in wojson:
            raise Exception("No valid 'rasters' key")
        else:
            raslist = wojson["rasters"]
            if len(raslist) < 1:
                raise Exception("No valid raster input")
            else:
                # Now parse the remap value to two lists,
                for i in raslist:
                    # Add the reformated raster item to list
                    raslist.append(getRemapVals(i))

                return raslist

    except Exception as e:
        arcpy.AddError(e)
        return None
    except:
        arcpy.AddError("Weighted Overlay table is invalid.")
        return None


# Define function templates used in this service:
# Sample template
remapjson = {
    "rasterFunction": "Remap",
    "rasterFunctionArguments": {
        "InputRanges": [],
        "OutputValues": [],
        "GeometryType": "",
        "Geometries": [],
        "NoDataRanges": [],
        "AllowUnmatched": False,
        "Raster": "",
    },
    "outputPixelType": "",
    "variableName": "Raster"
}

calcjson = {
    "rasterFunction": "RasterCalculator",
    "rasterFunctionArguments": {
        "Rasters": [],
        "InputNames": [],
        "Expression": "",
        "ExtentType": 0,
        "CellsizeType": 1
    }
}


if __name__ == '__main__':

    inrastbl = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise LicenseError

        # Input raster table schema:
        inrastbl = """{
                        "rasters": [
                            {
                                "name": "C:/Z__RasterAnalysis/weightedOverlay/landuser",
                                "influence": 50,
                                "remapval": [[3,3], [4,4], [5,5], [6,6], [10,1]]
                            },
                            {
                                "name": "C:/Z__RasterAnalysis/weightedOverlay/recr",
                                "influence": 50,
                                "remapval": [[1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,1]]
                            },
                        ],
                    }"""

        # Generate remap function template for each input raster
        remap_temp = getRasTbl(inrastbl)

        # Now loop through the remap function template + influence list
        wotemp = calcjson
        count = 1
        if len(remap_temp) > 0:
            for i in remap_temp:
                inname = "r" + int(count)
                rtemp = i[0]
                influ = i[1]

                wotemp["Raster"].append(rtemp)
                wotemp["InputNames"].append(inname)

                if wotemp["Expression"] == "":
                    exp = [str(influ), "*", inname]
                    wotemp["Expression"] = "".join(exp)
                else:
                    exp = [wotemp["Expression"], "+", str(influ), "*", inname]
                    wotemp["Expression"] = "".join(exp)

            inrft = json.dumps(wotemp)
            arcpy.AddMessage(inrft)
            result = arcpy.GenerateRaster_rasteranalysis(inrft, outras)

        else:
            raise Exception("No valid Remap raster input.")

    except LicenseError:
        arcpy.AddError("Spatial Analyst license is unavailable.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(err)

    except Exception as err:
        arcpy.AddError(err)

