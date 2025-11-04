# coding: utf-8
"""
Tool Name:  Data Engineering Chart Utilities  
Source Name: DEChartUtils.py
Version: ArcGIS PRO 2.8
Author: ESRI

Add Chart in a feature/table
"""
import arcpy as ARCPY

def getSource(inputFC, typeInput, frame, uri ):
    p = ARCPY.mp.ArcGISProject("CURRENT")
    df = p.listMaps(frame)[0]
    source = None

    if typeInput == "Layer":
        source = [e for e in df.listLayers() if e.longName == inputFC ]  

        if uri is not None:
            if len(source) > 1:
                for e  in source:
                    ldef = e.getDefinition("V2")
                    if ldef.uRI.upper()  == uri.upper():
                        source = e
                        break
            else:
                source = source[0]
        else:
            source = source[0]

    if typeInput == "Table":
        source = df.listTables(inputFC)
        if len(source) == 0:
            for i in df.listTables():
                if i.URI.upper() == uri.upper():
                    source = [i]

        if uri is not None:
            if len(source) > 1:
                for e  in source:
                    ldef = e.getDefinition("V2")
                    if ldef.uRI.upper()  == uri.upper():
                        source = e
                        break
            else:
                source = source[0]
        else:
            source = source[0]
    return source

def bar(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "bar"
    chart.title = nameChart
    chart.bar.aggregation = "COUNT"
    chart.xAxis.field = fields[0]
    chart.yAxis.title = ARCPY.GetIDMessage(84785) #Count
    return chart

def histogram(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "histogram"
    chart.title = nameChart
    chart.xAxis.field = fields[0]
    chart.yAxis.title = ARCPY.GetIDMessage(84785) #Count
    return chart

def line(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "line"
    chart.title = nameChart
    chart.line.aggregation = "COUNT"
    chart.xAxis.field = fields[0]
    chart.yAxis.title = ARCPY.GetIDMessage(84785) #Count
    return chart  

def qqPlot(chartField, chartFieldTitle):
    fields  = chartField.split(';')

    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "qqPlot"
    chart.title = nameChart

    if len(fields) == 1:
        chart.xAxis.field = chartField
    if len(fields) > 1:
        chart.xAxis.field = fields[0]
        chart.yAxis.field = fields[1]

    return chart     

def boxPlot(chartField, chartFieldTitle):
    fields  = chartField.split(';')

    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "boxPlot"
    chart.title = nameChart

    if len(fields) == 1:
        chart.xAxis.field = ""
        chart.yAxis.field = chartField
    if len(fields) > 1:
        chart.xAxis.field = ""
        chart.yAxis.field = fields
        chart.boxPlot.standardizeValues = True
        chart.yAxis.title = ARCPY.GetIDMessage(84269)

    return chart     

def scatter(chartField, chartFieldTitle):
    fields  = chartField.split(';')

    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "scatter"
    chart.title = nameChart

    if len(fields) == 1:
        chart.xAxis.field = chartField
    if len(fields) > 1:
        chart.xAxis.field = fields[0]
        chart.yAxis.field = fields[1]

    return chart 

def dataClock(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "dataClock"
    chart.title = nameChart
    chart.dataClock.aggregation = "COUNT"
    chart.xAxis.field = fields[0]
    return chart

def matrixHeatChart(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "matrixHeatChart"
    chart.title = nameChart
    chart.matrixHeatChart.aggregation = "COUNT"
    chart.xAxis.field = fields[0]
    chart.yAxis.field = fields[1]
    return chart
    
def calendarHeatChart(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    chart.type = "calendarHeatChart"
    chart.title = nameChart
    chart.calendarHeatChart.aggregation = "COUNT"
    chart.xAxis.field = fields[0]
    return chart

def scatterMatrix(chartField, chartFieldTitle):
    fields  = chartField.split(';')
    nameChart = chartFieldTitle
    chart = ARCPY.Chart(nameChart)
    title = chartFieldTitle.split('|')[0]
    chart.type = "scatterMatrix"
    chart.title = title
    chart.scatterMatrix.fields = fields
    return chart
    
def AddChart(parameters):
    ARCPY.AddWarning("init")
    inputFC = parameters[0].valueAsText
    chartField = parameters[1].valueAsText
    chartFieldTitle = parameters[2].valueAsText
    typeChart = parameters[3].valueAsText
    frame = parameters[4].valueAsText
    typeInput = parameters[5].valueAsText
    uri = parameters[6].value
    nameChart = chartFieldTitle
    chart = None
    if chartField in ["", None]:
        names = chartFieldTitle.split("|")
        chart = ARCPY.Chart(names[0])
        chart.type = typeChart
        chart.title = names[1]
    else:
        chart = eval("{0}(chartField,chartFieldTitle)".format(typeChart))
    ARCPY.AddWarning("created")
    source = getSource(inputFC, typeInput, frame, uri )
    ARCPY.AddWarning("ddd")
    chart.addToLayer(source)
    ARCPY.AddMessage("updated input")
    return
    
def testCharts(inputFC, fields, typeChart, frame = "Map", typeInput ="Layer", uri = None):
    chartFieldTitle = "My Title "
    chart = eval("{0}(fields,chartFieldTitle+'{0}')".format(typeChart))
    source = getSource(inputFC, typeInput, frame, uri )
    chart.addToLayer(source)
    
def testUnit():
    testCharts("CopiedSchools","Days_1_2_OSS_2015;Pct_0_days_OSS_2015","histogram")
    testCharts("CopiedSchools","GRADE_RANGE;Pct_0_days_OSS_2015","bar")        
    testCharts("CopiedSchools","last_edited_date;GRADE_RANGE;Pct_0_days_OSS_2015","line")
    testCharts("CopiedSchools","Pct_0_days_OSS_2015","qqPlot")    
    testCharts("CopiedSchools","Pct_0_days_OSS_2015","boxPlot")    
    testCharts("CopiedSchools","Pct_0_days_OSS_2015;Days_1_2_OSS_2015","scatter")    
    testCharts("CopiedSchools","last_edited_date;Pct_0_days_OSS_2015","dataClock")    
    testCharts("CopiedSchools","Days_1_2_OSS_2015;Pct_0_days_OSS_2015","matrixHeatChart")
    testCharts("CopiedSchools","last_edited_date;ays_1_2_OSS_2015;ct_0_days_OSS_2015","calendarHeatChart")
    testCharts("CopiedSchools","Total_Student_Count_2017;Days_1_2_OSS_2015;Pct_0_days_OSS_2015","scatterMatrix")    
    