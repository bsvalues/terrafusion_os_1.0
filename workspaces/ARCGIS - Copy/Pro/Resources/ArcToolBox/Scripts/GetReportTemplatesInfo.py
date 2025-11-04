"""-------------------------------------------------------------------------
    Tool:               Get Report Templates Info (Server Tools)
    Source Name:        GetReportTemplatesInfo.py
    Version Added:      ArcGIS Pro 3.2
    Author:             Esri, Inc.    
    Description:        Get Report Templates Info.
                        Retrieve metadata for all .rptx or .rptt (report file and report template) available in the specified folder
                        .rptx & .rptt are considered as report templates in a printing service.
    Last Updated Ver:   ArcGIS Pro 3.2
------------------------------------------------------------------------"""

# Import required modules
#
import sys
import os
import arcpy
import json
import glob
import re
from arcgis.gis import GIS

# default location
#
_defTmpltFolder = os.path.join(arcpy.GetInstallInfo()['InstallDir'], r"Resources\ArcToolBox\Templates\ExportWebMapTemplates")

# downloading a portal item
#
def getPortalItem(reportItem):
    # extracting id and token from the string
    rpt_item_json = json.loads(reportItem)

    # converting keys in json to lower cases as the dict lookup is case sensitive
    rpt_item_lower_json = {key.lower(): val for key, val in rpt_item_json.items()}
    del rpt_item_json
    
    itemId = rpt_item_lower_json["id"]
    token = rpt_item_lower_json.get("token")

    # downloading portal item and returning the local path
    portalUrl = arcpy.GetActivePortalURL()
    portal = GIS(url=portalUrl, token=token)
    portal_item_id = itemId
    portal_item = portal.content.get(portal_item_id)
    file_path = portal_item.download(save_path=arcpy.env.scratchFolder)
    return file_path


# Converting the content of a .rptx or .rptt file to a json representation for print service client apps
#
def ConvertsToJSON(rpt_files):
    report_json_array = []

    for rpt in rpt_files:
        f = open(rpt, encoding="utf8")
        fn = os.path.splitext(os.path.basename(rpt))[0]

        try:    #add a warning when the Report File is corrupted
            data=json.load(f)
        except:
            arcpy.AddIDMessage("WARNING", 513, rpt)
            continue

        reportSections=data["reportDefinition"]["elements"]
        r = {}

        # Report_Template name
        r["reportTemplate"] = fn

        ro = {}
        r["reportOptions"] = ro

        rso = {}
        ro["reportSectionOverrides"] = rso

        #loop through report document sections
        for i in range(len(reportSections)):

            #Check if section type is report (not layout)
            if(reportSections[i]["type"]=="CIMReportSection"):
                #declare report section dict and add it to the report options dict by name
                rs = {}
                rso[reportSections[i]["name"]] = rs
                rs["name"]=""
                rs["sourceId"]=""

                #declare report element dict
                rg={}
                rfe={}
                rfl={}
                rse={}        

                #get report subsections
                reportSubsections = reportSections[i]["elements"]            
                #loop through report subsections
                for j in reversed(range(len(reportSubsections))):
                    #check for related report section
                    if(reportSubsections[j]["type"]=="CIMRelatedReportSection"):
                        #declare related report section dict
                        rrs = {}
                        rso[reportSubsections[j]["name"]] = rrs
                        rrs["relatedId"]=""
                        rrs["sourceId"]=""

                        #declare rlated report subsection dict
                        rrg={}
                        rrfe={}
                        rrfl={}
                        rrse={}     
                        
                        relatedReportSection = reportSubsections[j]
                        #get related report subsections
                        relatedReportSubsections = relatedReportSection["elements"]

                        #loop through related report subsections
                        for m in reversed(range(len(relatedReportSubsections))):
                            #check for groups
                            if(relatedReportSubsections[m]["type"]=="CIMGroupHeader"):
                                rrg[relatedReportSubsections[m]["name"]]=""

                            #get elements in related report subsection
                            relatedReportSubsectionElements = relatedReportSubsections[m]["elements"]

                            # check for any text that is bracketed, that is how we define labels                
                            labelName = subsectionElements[l].get("name")
                            if (labelName.startswith("{") and (labelName.endswith("}"))):
                                label = labelName.strip("{}")
                                rrfl[label]=""
                            
                            #check if "graphic" exists in dict 
                            for x in reversed(range(len(relatedReportSubsectionElements))): 
                                if(relatedReportSubsectionElements[x].get("graphic")):
                                    #get graphic element
                                    relatedReportGraphic = relatedReportSubsectionElements[x]["graphic"]
                                    #check for paragraph text
                                    if(relatedReportGraphic["type"]=="CIMParagraphTextGraphic"):
                                        elementAttributes = relatedReportGraphic["attributes"]
                                        text = relatedReportGraphic["text"]
                                        properties = elementAttributes["propertySetItems"]
                                        rrGroupField = relatedReportSubsectionElements[x]["name"]
                                
                                        #add element names depending on attribute properties and text
                                        if(len(properties)) > 4:
                                            if("group-field" not in rrGroupField):                                    
                                                if("field-count" in text) or ("field-mean" in text) or ("field-median" in text) or ("field-maximum" in text) or ("field-minimum" in text) or ("field-stddev" in text) or ("field-sum" in text):
                                                    rrse[relatedReportSubsectionElements[x]["name"]]=""
                                                elif("field-value" in text):
                                                    rrfe[relatedReportSubsectionElements[x]["name"]]=""
                       
                       #check for dict entries before adding to dict
                        if(len(rrg)>0):
                            rrs["groupSections"]=rrg

                        if(len(rrfe)>0):
                            rrs["fieldElements"]=rrfe
                        
                        if(len(rrfl)>0):
                            rrs["fieldLabelElements"]=rrfl
                        
                        if(len(rrse)>0):
                            rrs["statisticElements"]=rrse  
                    else:
                        #check for group header
                        if(reportSubsections[j]["type"]=="CIMGroupHeader"):
                            rg[reportSubsections[j]["name"]]=""

                        #get elements in subsection
                        subsectionElements = reportSubsections[j]["elements"]

                        for l in reversed(range(len(subsectionElements))):
                            # check for any text that is bracketed, that is how we define labels 
                            labelName = subsectionElements[l].get("name")
                            if (labelName.startswith("{") and (labelName.endswith("}"))):
                                label = labelName.strip("{}")
                                rfl[label]=""

                            #check if "graphic" exists in dict
                            if(subsectionElements[l].get("graphic")):
                                #get graphic element
                                reportGraphic = subsectionElements[l]["graphic"]
                                #check for paragraph text
                                if(reportGraphic["type"]=="CIMParagraphTextGraphic"):
                                    elementAttributes = reportGraphic["attributes"]
                                    text = reportGraphic["text"]
                                    properties = elementAttributes["propertySetItems"]
                                    groupField = subsectionElements[l]["name"]

                                    #add element names depending on attribute properties and text
                                    if(len(properties)) > 4:
                                        if("group-field" not in groupField):
                                            if("field-count" in text) or ("field-mean" in text) or ("field-median" in text) or ("field-maximum" in text) or ("field-minimum" in text) or ("field-stddev" in text) or ("field-sum" in text):
                                                rse[subsectionElements[l]["name"]]=""
                                            elif("field-value" in text):
                                                rfe[subsectionElements[l]["name"]]=""
            
                #check for dict entries before adding to dict
                if(len(rg)>0):
                    rs["groupSections"]=rg
                
                if(len(rfe)>0):
                    rs["fieldElements"]=rfe
                
                if(len(rfl)>0):
                    rs["fieldLabelElements"]=rfl
                
                if(len(rse)>0):
                    rs["statisticElements"]=rse


        f.close()
        report_json_array.append(r)

    return json.dumps(report_json_array, indent=2)


# Main module
#
def main():
    # Get the value of the input parameter
    #
    tmpltFolder = arcpy.GetParameterAsText(0)
    reportItemID = arcpy.GetParameterAsText(2).strip()

    ## When empty, it falls back to the default template location like ExportWebMap tool does
    ##
    if (len(tmpltFolder) == 0):
        tmpltFolder = _defTmpltFolder

    # Getting a list of all file paths with .rptx and rptt extensions
    #    createing Report objects and putting them in an array
    #
    reports = []
    
    #when a value is passed in for reportItemID parameter
    if reportItemID:
        try:    #throw exception when the Report File is corrupted
            rpt_file_path = getPortalItem(reportItemID)
            reports.append(rpt_file_path)
        except:
            j = json.loads(reportItemID.lower())
            if "id" in j:
                arcpy.AddIDMessage("ERROR", 513, "portal item with ID = '{0}'".format(j["id"]))
            else:
                arcpy.AddIDMessage("ERROR", 192, "Report_Item_ID parameter")
    else:  #otherwise look for .rptx or .rptt files from specified or the default folder location
        ## When folder path is empty, it falls back to the default template location like ExportWebMap tool does
        ##
        if (len(tmpltFolder) == 0):
            tmpltFolder = _defTmpltFolder

        # Getting a list of all file paths with .rptx or .rptt extensions
        #    creating Report objects and putting them in an array
        #
        reports = [f for f in glob.glob(os.path.join(tmpltFolder, "*.rpt[t,x]"))]
            

    # Encoding the array of MapDocument to JSON using a custom JSONEncoder class
    #
    outJSON = []
    try:
        outJSON = ConvertsToJSON(reports)
    except Exception as err:
        arcpy.AddError(str(err))

    # Set output parameter
    #
    arcpy.SetParameterAsText(1, outJSON)
    
    # Clean up
    #
    del reports


if __name__ == "__main__":
    main()
