
import aolutils
import arcpy
import numpy
import time
import json
try:
    from urllib import unquote, urlencode, quote
except ImportError:
    from urllib.parse import unquote, urlencode, quote

from urllib.request import Request, urlopen
import requests


def processRemoteTool(tbxFullURL, taskName, paramsList,
                        inputLayerPosition=0, maxFeatures=100):
    '''tbxFullUrl: must be of the form : url;folder/servicename;token=token;referer"
    taskName: fully qaualified task name taskName_serviceName
    paramsList: list of parameter values for the task. If default value use "#"
    inputLayerPosition: position of input layer to split in paramsList
    maxFeatures: max number of features in one request'''   
    selectionSet = None
    inputLayer = None
    arcpy.gp.addToolbox(tbxFullURL)
    try:
        
        try:
            task = getattr(arcpy.gp, taskName)
            arcpy.AddMessage("Add toolbox, successful")
        except:
            arcpy.AddError(tbxFullURL)
            arcpy.AddError(taskName)
            arcpy.AddError("Unable to access tool")
            raise Exception
        
        # get input layer
        inputLayer = paramsList[inputLayerPosition]          
        
        # get the OID array for builing query
        OIDFieldName = arcpy.Describe(inputLayer).OIDFieldName
        OIDFieldName = OIDFieldName.split('.')[-1]
        numpyOID = arcpy.da.FeatureClassToNumPyArray(inputLayer, ["OID@"])
        numpyOID = numpy.sort(numpyOID)	
        maxOID = numpyOID["OID@"].max()
        count = numpyOID.size	
        
        total_splits = count // maxFeatures

        # determine selection method
        #arcpy.AddMessage('inputLayer is {}'.format(inputLayer))
        #layer = arcpy.mapping.Layer(inputLayer)
        layer = arcpy.MakeFeatureLayer_management(inputLayer)
        layer = layer.getOutput(0)
        
        #selectionSet = layer.getSelectionSet() 
        desc = arcpy.Describe(inputLayer)
        tmpOidFieldName = desc.OIDFieldName
        tmpOidFieldName = tmpOidFieldName.split('.')[-1]
        selectionSetStr = desc.FIDSet 
        if selectionSetStr:
            selectionSet = [x for x in selectionSetStr.split(';')]
            selectionType = "SUBSET_SELECTION"
        else:
            selectionSet=None
            selectionType = "NEW_SELECTION"
            
        # define where clause
        whereClause = "\"{0}\" >= {1} AND \"{0}\" <= {2}"  
        
        # select features and submit jobs
        resultList = []
        for i in range(0, total_splits):
            minRange = numpyOID[i*maxFeatures][0]  
            maxRange = numpyOID[((i*maxFeatures)+ maxFeatures -1)][0]
            expr = whereClause.format(OIDFieldName, str(minRange), str(maxRange))
            arcpy.SelectLayerByAttribute_management(inputLayer, selectionType, expr)
            # didn't use yield on purpose; should execute the code in-place     
            result = (task(*paramsList), expr)
            #arcpy.AddMessage(layer.getSelectionSet())
            arcpy.AddMessage("Submitted job: {}".format(expr))
            resultList.append(result)
            # Restore selection
            if selectionSet:
                #layer.setSelectionSet("new", selectionSet)
                tmpWhereClause='"%s" IN (%s)'%(tmpOidFieldName, ",".join(selectionSet))
                #arcpy.SelectLayerByAttribute_management(layer.name, "NEW_SELECTION", tmpWhereClause)
                arcpy.SelectLayerByAttribute_management(inputLayer, "NEW_SELECTION", tmpWhereClause)
                
        # submit any last remaining features
        if count % maxFeatures > 0:
            minRange = numpyOID[total_splits*maxFeatures][0]
            maxRange = maxOID
            expr = whereClause.format(OIDFieldName, str(minRange), str(maxRange)) 
            arcpy.SelectLayerByAttribute_management(inputLayer, selectionType, expr)            
            result = (task(*paramsList), expr)
            #arcpy.AddMessage(layer.getSelectionSet())
            arcpy.AddMessage("Submitted job: {}".format(expr))
            resultList.append(result)
        arcpy.AddMessage("Submitted jobs successfully")
        # check Job status
        outResultList = [result for (result, whereClause) in  resultList]
        if checkJobStatus(resultList):
            return outResultList, True
        else:
            return outResultList, False
    except Exception as e:  
        arcpy.AddMessage(str(e))
        arcpy.AddMessage("Job Submission to remote tool failed")
        return None, False
    finally:    
        try:
            arcpy.gp.removeToolbox(tbxFullURL)
        except:
            arcpy.AddMessage('Failed to remove the toolbox: {}'.format(tbxFullURL))
        #Restore Input Layer to its original state
        if selectionSet:
            if layer:
                #layer.setSelectionSet("new", selectionSet)
                tmpWhereClause='"%s" IN (%s)'%(tmpOidFieldName, ",".join(selectionSet))
                arcpy.SelectLayerByAttribute_management(layer.name, "NEW_SELECTION", tmpWhereClause)          
        elif inputLayer:
            arcpy.SelectLayerByAttribute_management(inputLayer, "CLEAR_SELECTION")
            

            
def checkJobStatus(resultList): 
    '''check the staus of the job'''
    jobsNotDone = True
    startPos = 0
    try:
        while jobsNotDone:        
            for i, (result, expr) in enumerate(resultList[startPos:]):
                if result.status < 4:                       
                    startPos = startPos + i                   
                    jobsNotDone = True
                    break
                elif result.status != 4:
                    # fail if even one request fails
                    #No point in looking for further results
                    arcpy.AddMessage("Failed for expr: {}".format(expr))
                    arcpy.AddMessage("Result status code: {}".format(result.status))
                    reportErrorMessages(result)
                    return False
                else:
                    arcpy.AddMessage("Succeeded expr:{}".format(expr))
                    jobsNotDone = False                    
            if jobsNotDone:
                time.sleep(3)
        return True
    except Exception as e:
        arcpy.AddMessage("check Job Status Failed")
        arcpy.AddMessage(str(e))
    
    

def getResults(resultList, maxFeatures=100, outputPosition=0, fieldMap=None):
    '''write results to output location
    resultList = list of result obj (objtained from processRemoteToolbox method)
    maxFeatures: maxFeatures that you provided when creating the resultList
    outputPosition: position of the output param in result eg: 0, 1 etc.
    fieldMap: if interested in changing the fieldnames, alias etc of the output fc'''
    
    if not resultList:
        return None
    arcpy.AddMessage("Getting Results for output {}".format(outputPosition))
    arcpy.AddMessage('resultList is {} with type of {}'.format(resultList, type(resultList).__name__))
    noOfResults = len(resultList)
    #arcpy.AddMessage(noOfResults)
    try:
        wkspc = aolutils.getOutputWkspc(noOfResults*maxFeatures)
        #wkspc = arcpy.env.scratchGDB
        outputLocation = arcpy.CreateUniqueName("remoteToolOutput", wkspc)       
        outputRS = [result.getOutput(outputPosition) for result in resultList]
        arcpy.Merge_management(outputRS, outputLocation)
        return outputLocation
    
    except arcpy.ExecuteError:
        arcpy.AddMessage("Merging result output Failed")
        return None
    except Exception as e:
        arcpy.AddMessage(str(e))        
        arcpy.AddMessage("error when getting outputs")
        return None
    
def reportErrorMessages(result):
    # reports only error messages from the tool
    msgs = result.getMessages(2)
    if msgs:
        arcpy.AddMessage(msgs)
       


def getToken(referer):
    
    #global referer
    query_dict = {'username': "xxxxxx",
                  'password': "xxxx",
                  'expiration': 120,
                  'client':'referer',
                  'referer': referer,                  
                  'f': 'json'}
    
    tokenUrl = "https://www.arcgis.com/sharing/rest/generatetoken"
    token = ""
    
    response=requests.post(tokenUrl, data=query_dict, verify=False, headers={'referer':referer})
    tokenJson = response.json()
            	
    #req = Request(tokenUrl)
    #req.add_header("referer",referer)
    #tokenResponse = urlopen(req, urlencode(query_dict))   
    #tokenJson = json.load(tokenResponse)
    if "token" in tokenJson:
        return tokenJson["token"]
    else:
        print(tokenJson)
        return None

        
def testFromDesktop():
    arcpy.env.overwriteOutput = True    
    referer = "http://hydro.arcgis.com/arcgis/rest"
    token = getToken(referer)
    if token:
        arcpy.AddMessage("Recieved a token")
        serviceUrl = "http://hydro.arcgis.com/arcgis/services"
        serviceName = "Tools/Hydrology"
        tbxFullURL = "{};{};token={};{}".format(serviceUrl, serviceName, token, referer)
        taskName = "Watershed_Hydrology"
        inputPoint = r"X:\xxxxx\RemoteTool\data\usa.gdb\testCities"
        inputLayer = "inputPointLayer"
        arcpy.MakeFeatureLayer_management(inputPoint, inputLayer)
        #inputLayer = arcpy.GetParameterAsText(0)
        params = [inputLayer]
        resultList = processRemoteTool(tbxFullURL, taskName, params)
        outputLocation = arcpy.GetParameterAsText(1)
        if resultList:
            watershedOutput = getResults(resultList)
        
            
def testFromOnline():
    hostedgp = agolgp.HostedGP(2,1)   
    outputName = hostedgp.GetOutputName(1)
    inputHostedLayer, inputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0) 
    inputLayer = inputHostedLayer.name	
    tbxFullURL = aolutils.getRemoteToolbox(hostedgp,"hydrology")
    arcpy.AddMessage(tbxFullURL)
    taskName = "Watershed_Hydrology"
    resultList = processRemoteTool(tbxFullURL, taskName,[inputLayer])
    if resultList:
        watershedOutput = getResults(resultList)
    
    descWatershed = arcpy.Describe(watershedOutput)

    #Create renderer with temporary layer
    drawingInfo = rendererUtils.getSimpleRendererInfo("Polygon")

    # create output description
    outDesc = aolutils.getOutDescription("Watershed",0, drawingInfo)   
    # create result
    aggResult = aolutils.HostedToolResult(outputName)
    aggResult.addHostedOutput(descEnrichedLayer, outDesc, 3)
    startTime = time.time()
    startTime = aggResult.generateHostedResult(hostedgp, startTime) 
            

def getMaxSplit(countOfFeatures, numOfSplits, minVal=10, maxVal=100):
    '''define maxFeatures based on number of splits and min and max val'''
    maxFeatures = countOfFeatures//numOfSplits
    if maxFeatures < minVal:
        maxFeatures = minVal
    elif maxFeatures > maxVal:
        maxFeatures = maxVal
    return maxFeatures
    


if  __name__ == '__main__':
    
    testBed = "Online"
    #testBed = "Desktop"
    if testBed == "Online":
        import time
        import hostedgp as agolgp
        testFromOnline()
    else:
        testFromDesktop()    
    
