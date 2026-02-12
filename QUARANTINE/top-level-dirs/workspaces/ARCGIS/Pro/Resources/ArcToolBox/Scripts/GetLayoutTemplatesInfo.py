"""-------------------------------------------------------------------------
    Tool:               Get Layout Templates Info (Server Tools)
    Source Name:        GetLayoutTemplatesInfo.py
    Version Added:      ArcGIS Pro 2.1
    Author:             Esri, Inc.    
    Description:        Get Layout Templates Info.
                        Retrieve metadata for all .pagx available in the specified folder
                        each .pagx is considered as a layout template in a printing service.
    Last Updated Ver:   ArcGIS Pro 3.4
------------------------------------------------------------------------"""

# Import required modules
#
import sys
import os
import arcpy
import json
import glob
import re
import xml.dom.minidom as DOM

# default location
#
_defTmpltFolder = os.path.join(arcpy.GetInstallInfo()['InstallDir'], r"Resources\ArcToolBox\Templates\ExportWebMapTemplates")

# finds all occurences of <dyn prop1=... /> tags in a string
# returns an array of array e.g. [["<dyn .. >, start_position, end_position]]
#    returns empty array when nothing is found
def extractDynXMLTags(srcText):
    sXMLtag = "<dyn"
    eXMLtag = "/>"
   
    srcTextLCase = srcText.lower() #for case insensitive search

    # looking for "<dyn" in the string
    dynXmlTagCount = srcTextLCase.count(sXMLtag)
    if (dynXmlTagCount == 0):
        return []
   
    # making sure there are equal number of "/>" and "<dyn" in the string
    # else it is an invalid dyn text element
    if (dynXmlTagCount != srcTextLCase.count(eXMLtag)):
        return []
   
    # extracting dynamic text element's xml tags
    dynTextArray = []
    ePos = 0
    for x in range(dynXmlTagCount):
        sPos = srcTextLCase.find(sXMLtag, ePos)
        ePos = srcTextLCase.find(eXMLtag, sPos) + 2
       
        dynTextArray.append([srcText[sPos: ePos], sPos, ePos]) #extracting from the original text not the lower-case version
       
    return dynTextArray


# removes all occurences of any xml tag e.g. <FNT size="10">... </FNT>
#    it is very simple approach that that '<' is the beginning of an xml tag and '>' of that tag.
#    ... therefore it removes those characters and everything in between
def removeAllXMLTags(srcText):
    textWithoutXMLtags = ""

    doSkip = False
    for x in srcText:
      if (x == '<'):
        doSkip = True
      
      if (not doSkip):
        textWithoutXMLtags = textWithoutXMLtags + x
      
      if (x == '>'):
        doSkip = False
    
    return textWithoutXMLtags


# add info about a few types of layout elements
def addMapSurroundInfos(layoutElms, mse):
    for lytElm in layoutElms:
        if (type(lytElm).__name__ == "CIMMarkerNorthArrow") or (type(lytElm).__name__ == "CIMScaleLine"):
            mse.append({"name": lytElm.name, "type": type(lytElm).__name__, "visible": lytElm.visible})
        elif type(lytElm).__name__ == "CIMLegend":
            mse.append({"name": lytElm.name, "type": type(lytElm).__name__, "visible": lytElm.visible, "defaultLegendItem": {"dynamicLegends": lytElm.defaultLegendItem.autoVisibility}})
        elif type(lytElm).__name__ == "CIMTableFrame":
            filterType = "visible" if lytElm.fillingStrategy == "ShowVisibleRows" else "all"
            tblPropDict = {"name": lytElm.name, "type": type(lytElm).__name__, "visible": lytElm.visible, "filterType": filterType}
            if lytElm.rowLimit > 0: #0 means rowlimit is not set
                tblPropDict["rowCount"] = lytElm.rowLimit
            
            # generating fields and orderByFields from the DefaultFields element
            filteredCustPropsList = list(filter(lambda x: x.key == "DefaultFields", lytElm.customProperties))
            if len(filteredCustPropsList) > 0:
                fieldArray = []
                orderByFieldArray = []
                #converting the value of DefaultFields, that is a string, to json array and looping thru all its elements
                for fi in json.loads(filteredCustPropsList[0].value):
                    fieldArray.append(fi["name"])
                    if (fi["sortInfo"].lower() != "none"):
                        orderByFieldArray.insert(fi["sortOrder"], {"field:": fi["name"], "order": 'ASC' if 'asc' in fi["sortInfo"].lower() else 'DESC'})
                    
                tblPropDict["fields"] =  fieldArray #adding default field list
                tblPropDict["orderByFields"] = orderByFieldArray  #adding default orderBy fields
                
            mse.append(tblPropDict)
        elif type(lytElm).__name__ == "CIMChartFrame":
            filterType = "visible" if lytElm.isDynamic else "all"
            mse.append({"name": lytElm.name, "type": type(lytElm).__name__, "visible": lytElm.visible, "filterType": filterType})
        elif type(lytElm).__name__ == "CIMGroupElement":
            grpdElms = []
            addMapSurroundInfos(lytElm.elements, grpdElms)
            if (len(grpdElms) > 0):
                mse.append({"name": lytElm.name, "type": type(lytElm).__name__, "visible": lytElm.visible, "elements": grpdElms})
        else:
            pass  


# Defining a custom JSONEncoder for MapDocument object
#
class LayoutEncoder(json.JSONEncoder):
    def default(self, layout):
        if isinstance(layout, arcpy._mp.Layout):
            d = {}

            # Layout_Template name
            d["layoutTemplate"] = layout.name

            # Page size & unit
            d["pageSize"] = [round(layout.pageWidth, 2), round(layout.pageHeight, 2)]
            d["pageUnits"] = layout.pageUnits

            # Size of the mapframe element on the layout
            mapFrames = layout.listElements("MAPFRAME_ELEMENT")
            mf = None
            if (len(mapFrames) == 1): # if there is only one mapframe element, use that
                mf = mapFrames[0]
            elif (len(mapFrames) > 1):
                webMapFrames = layout.listElements("MAPFRAME_ELEMENT", "WEBMAP_MAP_FRAME") # if the layout has 1+ mapframe elements, look for one with a specific name
                if (len(webMapFrames) == 1):
                    mf = webMapFrames[0]
                else:
                    arcpy.AddWarning("Layout '{0}' has more than one map frames but none named 'WEBMAP_MAP_FRAME'.".format(layout.name))
            else:
                arcpy.AddWarning("Layout '{0}' has no map frames.".format(layout.name))

            if (mf != None):
                d["webMapFrameSize"] = [round(mf.elementWidth, 2), round(mf.elementHeight, 2)]

            # Layout options containing information about layout elements
            lo = {}
            d["layoutOptions"] = lo
            lo["hasTitleText"] = False
            lo["hasAuthorText"] = False
            lo["hasCopyrightText"] = False
            lo["hasLegend"] = False

            # Is a legend element available whose parent dataframe name is same as the active dataframe's name
            if (mf != None):
                for lgd in layout.listElements("LEGEND_ELEMENT"):
                    if (lgd.mapFrame.name == mf.name):
                        lo["hasLegend"] = True
                        break

            # Availability of text elements - both predefined and user-defined
            ct = []     #an array contains custom text elements - each as a separate dictionary
            lo["customTextElements"] = ct

            mse = []     #an array contains map surrounding elements including dynamic text elements, chart/table frame etc. - each as a separate dictionary
            lo["mapSurroundInfos"] = mse
           
            # looping thru all text elements
            for txtElm in layout.listElements("TEXT_ELEMENT"):
                dynXMLTagArray = extractDynXMLTags(txtElm.text)
                if len(dynXMLTagArray) > 0:
                    dynTxtTagJSONArray = []
                    srcTextObfuscated = ""
                    sPos = 0

                    for elm in dynXMLTagArray:
                        try:    #processing dynamic-text-elements with xml tags
                            x = DOM.parseString(elm[0])
                            xmlNode = x.childNodes[0]
                            if (xmlNode.getAttribute("type") == "layout") and (xmlNode.getAttribute("property") == "metadata"): #predefined with specific dynamic-text (i.e. xml tag)
                                if (xmlNode.getAttribute("attribute") == "title"):
                                    lo["hasTitleText"] = True
                                if (xmlNode.getAttribute("attribute") == "contactname"):
                                    lo["hasAuthorText"] = True
                                if (xmlNode.getAttribute("attribute") == "credits"):
                                    lo["hasCopyrightText"] = True
                            elif (xmlNode.getAttribute("type") == "table"):
                                dynTxtTagJSON = {"type": xmlNode.getAttribute("type"), "property": xmlNode.getAttribute("property"), \
                                                    "field": xmlNode.getAttribute("field")}
                                
                                attrArray = xmlNode.attributes
                                if (attrArray.get("isDynamic") != None):
                                    dynTxtTagJSON["filterType"] = "visible" if xmlNode.getAttribute("isDynamic") == 'true' else "all"
                                
                                #building a string without </dyn> </dyn> tags
                                srcTextObfuscated = "{}{}[{}]".format(srcTextObfuscated, txtElm.text[sPos : elm[1]], xmlNode.getAttribute("property"))
                                sPos = elm[2]
                                dynTxtTagJSONArray.append(dynTxtTagJSON)
                        except:
                            pass
                   
                    if len(dynTxtTagJSONArray) > 0: #only appending if dyn xml tag of type 'table' exists
                        #building a string without </dyn> </dyn> tags
                        srcTextObfuscated = "{}{}".format(srcTextObfuscated, txtElm.text[sPos: len(txtElm.text)])
                        srcTextObfuscated = removeAllXMLTags(srcTextObfuscated) #there may be some text formatting tags that has no meanings for web clients
                        
                        dynTxtElmJSON = {"name": txtElm.name, "type": "CIMGraphicElement", "visible": txtElm.visible, \
                                        "text": srcTextObfuscated, "dynamicTextElements": dynTxtTagJSONArray}
                        mse.append(dynTxtElmJSON)

                else: #find all other text elements who names are embedded within a pair of opening and closing curly braces
                      if (re.search(r"^({).*(})$", txtElm.name) is not None):
                          ct.append({txtElm.name.replace('{', '').replace('}',''): txtElm.text}) #removing opening and closing curly braces from the name

            # Availability of other map surrounding elements that can only accessible via layout's CIMDefinition
            cim_lyt = layout.getDefinition('V3')
            addMapSurroundInfos(cim_lyt.elements, mse)
            del cim_lyt

            return d
        return json.JSONEncoder.default(self, layout)



# Main module
#
def main():
    # Get the value of the input parameter
    #
    tmpltFolder = arcpy.GetParameterAsText(0)
    layoutItemID = arcpy.GetParameterAsText(2).strip()

    ## When empty, it falls back to the default template location like ExportWebMap tool does
    ##
    if (len(tmpltFolder) == 0):
        tmpltFolder = _defTmpltFolder

    # Getting a list of all file paths with .pagx extensions
    #    createing Layout objects and putting them in an array
    #
    layouts    = []
   
    #when a value is passed in for layoutItemID parameter
    if layoutItemID:
        try:    #throw exception when the Layout File is corrupted
            l = arcpy.mp.ConvertLayoutFileToLayout(layoutItemID)
                                                                                                                                 
            layouts.append(l)
        except:
            j = json.loads(layoutItemID.lower())
            if "id" in j:
                arcpy.AddIDMessage("ERROR", 513, "portal item with ID = '{0}'".format(j["id"]))
            else:
                arcpy.AddIDMessage("ERROR", 192, "Layout_Item_ID parameter")
    else:  #otherwise look for .pagx files from specified or the default folder location
        ## When folder path is empty, it falls back to the default template location like ExportWebMap tool does
        ##
        if (len(tmpltFolder) == 0):
            tmpltFolder = _defTmpltFolder

        # Getting a list of all file paths with .pagx extensions
        #    creating Layout objects and putting them in an array
        #
        for f in glob.glob(os.path.join(tmpltFolder, "*.pagx")):
            try:    #throw exception when the Layout File is corrupted
                l = arcpy.mp.ConvertLayoutFileToLayout(f)
                l.name = os.path.splitext(os.path.basename(f))[0] #setting the layout name as the file name to be used in PagXEncoder
                layouts.append(l)
            except:
                arcpy.AddWarning("Unable to open layout file (.pagx) named {0}".format(os.path.basename(f)))

           

    # Encoding the array of MapDocument to JSON using a custom JSONEncoder class
    #
    outJSON = ""
    try:
        outJSON = json.dumps(layouts, cls=LayoutEncoder, indent=2)
    except Exception as err:
        arcpy.AddError(str(err))

    # Set output parameter
    #
    arcpy.SetParameterAsText(1, outJSON)
   
    # Clean up
    #
    del layouts


if __name__ == "__main__":
    main()