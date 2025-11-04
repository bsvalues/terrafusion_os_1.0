"""-----------------------------------------------------------------------------
Tool Name:          Features to GPX (Conversion Tools)
Source Name:        FeaturesToGPX.py
Version:            ArcGIS Pro 2.6
Author:             Esri
Useage:             FeaturesToGPX(in_features,
                                  out_gpx_file,
                                  {name_field},
                                  {descript_field},
                                  {z_field},
                                  {date_field})

Required Arguments: Input Features
                    Output GPX File
Optional Arguments: Name Field
                    Description Field
                    Z Field
                    Date Field

Description:        Takes input features with either point or line geometry and
                    converts into a .GPX file.
-----------------------------------------------------------------------------"""

try:
    from xml.etree import cElementTree as ET
except:
    from xml.etree import ElementTree as ET

import arcpy
from datetime import datetime

gpx = ET.Element("gpx", xmlns="http://www.topografix.com/GPX/1/1",
                 xalan="http://xml.apache.org/xalan",
                 xsi="http://www.w3.org/2001/XMLSchema-instance",
                 creator="Esri",
                 version="1.1")

def prettify(elem):
    """Return a pretty-printed XML string for the Element.
    """
    from xml.dom import minidom
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def featuresToGPX(inputFC, outGPX, name_field, descript_field, z_field, date_field):
    ''' This is called by the __main__ if run from a tool or at the command line
    '''
    descInput = arcpy.Describe(inputFC)
    generatePointsFromFeatures(inputFC , descInput, name_field, descript_field, z_field, date_field)

    # Write the output GPX file
    try:
        gpxFile = open(outGPX, "w")
        gpxFile.write(prettify(gpx))
    except TypeError as e:
        arcpy.AddIDMessage("ERROR", 10060, gpxFile)
    finally:
        gpxFile.close()

def generatePointsFromFeatures(inputFC, descInput, name_field, descript_field, z_field, date_field):

    def attHelper(row):
        # helper function to get/set field attributes for output gpx file

        pnt = row[1].getPart()
        valuesDict["PNTX"] = str(pnt.X)
        valuesDict["PNTY"] = str(pnt.Y)

        Z = pnt.Z if descInput.hasZ else None
        if Z or (z_field in cursorFields):
            valuesDict[z_field] = str(Z) if Z else str(row[fieldNameDict[z_field]])
        else:
            valuesDict[z_field] = str(0)

        valuesDict[name_field] = row[fieldNameDict[name_field]] if name_field in fields else " "
        valuesDict[descript_field] = row[fieldNameDict[descript_field]] if descript_field in fields else " "
        valuesDict[name_field] = str(valuesDict[name_field])
        valuesDict[descript_field] = str(valuesDict[descript_field])

        if date_field in fields:
            row_time = row[fieldNameDict[date_field]]
            formatted_time = row_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            valuesDict[date_field] = formatted_time

        return
    #-------------end helper function-----------------

    def getValuesFromFC(inputFC, cursorFields ):

        previousPartNum = 0
        startTrack = True
        error_row = []
        foundone = 0

        # Support the extent environment if specified by user > Select input features that intersect the extent
        if arcpy.env.extent:
            polygon = arcpy.env.extent.polygon
            mfl = arcpy.MakeFeatureLayer_management(inputFC, "tempmfl")
            inputFC = arcpy.SelectLayerByLocation_management(mfl, "INTERSECT", polygon, "", "SUBSET_SELECTION")

        # Loop through all features and parts
        with arcpy.da.SearchCursor(inputFC, cursorFields, spatial_reference="4326", explode_to_points=True) as searchCur:
            for row in searchCur:
                if descInput.shapeType == "Polyline":
                    for part in row:
                        try:
                            newPart = False
                            if not row[0] == previousPartNum or startTrack is True:
                                startTrack = False
                                newPart = True
                            previousPartNum = row[0]

                            attHelper(row)
                            yield "trk", newPart
                            foundone = 1
                        except:
                            error_row.append(row[0])

                elif descInput.shapeType == "Multipoint" or descInput.shapeType == "Point":
                    # check to see if data was original GPX with "Type" of "TRKPT" or "WPT"
                    trkType = row[fieldNameDict["TYPE"]].upper() if "TYPE" in fields else None
                    try:
                        attHelper(row)

                        if trkType == "TRKPT":
                            newPart = False
                            if previousPartNum == 0:
                                newPart = True
                                previousPartNum = 1

                            yield "trk", newPart

                        else:
                            yield "wpt", None
                        foundone = 1
                    except:
                        error_row.append(row[0])
        
        if len(error_row) > 0:
            error_row = sorted(set(error_row))
            bad_geom_message = arcpy.GetIDMessage(190193)
            arcpy.AddWarning(bad_geom_message.replace("{}", ", ".join(str(id) for id in error_row)))
        if not foundone:
            arcpy.AddIDMessage("Warning", 685, "GPX")
                        

    # ---------end get values function-------------

    # Get list of available fields
    fields = [f.name.upper() for f in arcpy.ListFields(inputFC)]
    valuesDict = {z_field: 0, name_field: "", descript_field: "", date_field: "", "TYPE": "", "PNTX": 0, "PNTY": 0}
    fieldNameDict = {z_field: 0, name_field: 1, descript_field: 2, date_field: 3, "TYPE": 4, "PNTX": 5, "PNTY": 6}

    cursorFields = ["OID@", "SHAPE@"]

    for key, item in valuesDict.items():
        if key in fields:
            fieldNameDict[key] = len(cursorFields)  # assign current index
            cursorFields.append(key)   # build up list of fields for cursor
        else:
            fieldNameDict[key] = None

    for index, gpxValues in enumerate(getValuesFromFC(inputFC, cursorFields)):

        if gpxValues[0] == "wpt":
            wpt = ET.SubElement(gpx, 'wpt', {'lon':valuesDict["PNTX"], 'lat':valuesDict["PNTY"]})
            wptEle = ET.SubElement(wpt, "ele")
            wptEle.text = valuesDict[z_field]
            if date_field in fields:
                wptTime = ET.SubElement(wpt, "time")
                wptTime.text = valuesDict[date_field]
            wptName = ET.SubElement(wpt, "name")
            wptName.text = valuesDict[name_field]
            wptDesc = ET.SubElement(wpt, "desc")
            wptDesc.text = valuesDict[descript_field]

        else:  #TRKS
            if gpxValues[1]:
                # Elements for the start of a new track
                trk = ET.SubElement(gpx, "trk")
                trkName = ET.SubElement(trk, "name")
                trkName.text = valuesDict[name_field]
                trkDesc = ET.SubElement(trk, "desc")
                trkDesc.text = valuesDict[descript_field]
                trkSeg = ET.SubElement(trk, "trkseg")

            trkPt = ET.SubElement(trkSeg, "trkpt", {'lon':valuesDict["PNTX"], 'lat':valuesDict["PNTY"]})
            trkPtEle = ET.SubElement(trkPt, "ele")
            trkPtEle.text = valuesDict[z_field]
            if date_field in fields:
                trkPtTime = ET.SubElement(trkPt, "time")
                trkPtTime.text = valuesDict[date_field]

if __name__ == "__main__":
    ''' Gather tool inputs and pass them to featuresToGPX
    '''
    inputFC = arcpy.GetParameterAsText(0)
    outGPX = arcpy.GetParameterAsText(1)
    name = arcpy.GetParameterAsText(2).upper()
    descript = arcpy.GetParameterAsText(3).upper()
    z_field = arcpy.GetParameterAsText(4).upper()
    datetimes = arcpy.GetParameterAsText(5).upper()

    featuresToGPX(inputFC, outGPX, name, descript, z_field, datetimes)
