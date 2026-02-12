import arcpy
import numpy
import math


def weighted_avg_and_std(values, weights):
    """
    Return the weighted average and standard deviation.

    values, weights -- Numpy ndarrays with the same shape.
    """
    average = numpy.average(values, weights=weights)
    #print(average)
    variance = numpy.average((values-average)**2, weights=weights)  # Fast and numerically precise
    #print(variance)
    return (average, math.sqrt(variance))

class StatisticsGen:
    def __init__(self, intersectFC, fidFieldName, weightsFieldName, groupFieldName=None, fieldsSummary=None):
        '''initialize the values'''
        self.intersectLyr = "intersectLyr"
        arcpy.MakeFeatureLayer_management(intersectFC, self.intersectLyr)
        self.wFieldname = weightsFieldName
        self.gFieldName = groupFieldName
        self.fidFieldName = fidFieldName

    def standardDeviation(self, fieldNames, fidFieldValue):
        '''generates standard deviation for given fieldnames'''
        expr = "{} = {}".format(self.fidFieldName, fidFieldValue,)
        #arcpy.AddMessage("expr:{}".format(expr))
        arcpy.SelectLayerByAttribute_management(self.intersectLyr, "NEW_SELECTION", expr)
        fields = [self.fidFieldName, self.wFieldname]
        fields.extend(fieldNames)
        if self.gFieldName is not None:
            fields.append(self.gFieldName)
        intersectArr = arcpy.da.FeatureClassToNumPyArray(self.intersectLyr, fields)
        #arcpy.AddMessage("intersectArr: {}".format(intersectArr))
        resultArr = {}
        if self.gFieldName is not None:
            gFieldValues = numpy.unique(intersectArr[self.gFieldName])
            for gFieldValue in gFieldValues:
                grpArr = intersectArr[intersectArr[self.gFieldName] == gFieldValue]
                #arcpy.AddMessage("grpArr:{}".format(grpArr))
                weights = grpArr[self.wFieldname]
                #arcpy.AddMessage("weights:{}".format(weights))
                stdVal = []
                for field in fieldNames:
                    values = grpArr[field]
                    #arcpy.AddMessage("values:{}".format(values))
                    average, stddev = weighted_avg_and_std(values, weights)
                    #arcpy.AddMessage("stddev:{}".format(stddev))
                    stdVal.append(stddev)
                resultArr.update({gFieldValue:stdVal})
        else:
            weights = intersectArr[self.wFieldname]
            stdVal = []
            for field in fieldNames:
                values = intersectArr[field]
                average, stddev = weighted_avg_and_std(values, weights)
                stdVal.append(stddev)
            resultArr.update({fidFieldValue:stdVal})
        return resultArr


def main():
    arcpy.env.workspace = r"E:\10.2AOLTesting\WeightedStdDeviation\scratch.gdb"
    intersectout = "intersectOut"
    statsout = "statsout"
    fidFieldName = "FID_SummarizedOutput"
    weightsFieldName = "w_shape"
    groupFieldName = None
    statGen = StatisticsGen(intersectout, fidFieldName, weightsFieldName)
    stddevFields = ["Value"]
    stddevFieldNames = []
    for field in stddevFields:
        fieldname = "STD_{}".format(field)
        fieldalias = "STD {}".format(field)
        arcpy.AddField_management(statsout, fieldname, "DOUBLE",
                              "#", "#", "#", fieldalias, "NULLABLE", "NON_REQUIRED", "#")
        stddevFieldNames.append(fieldname)
    cursorFields = [fidFieldName]
    if groupFieldName is not None:
        cursorFields.append(groupFieldName)
    cursorFields.extend(stddevFieldNames)
    with arcpy.da.UpdateCursor(statsout, cursorFields) as cursor:
        if groupFieldName is not None:
            try:
                while(1):
                    row = next(cursor)
                    currFieldValue = row[0]
                    resp = statGen.standardDeviation(stddevFields, currFieldValue)
                    while(resp):
                         newRow = row[0:2]
                         newRow.extend(resp[row[1]])
                         cursor.updateRow(newRow)
                         row = cursor.next()
            except:
                pass
        else:
            for row in cursor:
                currFieldValue =  row[0]
                resp = statGen.standardDeviation(stddevFields, currFieldValue)
                newRow = [currFieldValue]
                newRow.extend(resp[currFieldValue])
                cursor.updateRow(newRow)




#main()




