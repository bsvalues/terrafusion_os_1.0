# coding: utf-8
"""
Source Name:   SSReport.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Reporting Functions for ESRI Script Tools as well as users for their own
               scripts.
"""

################### Imports ########################
import sys as SYS 
import arcpy as ARCPY
import matplotlib as MPL
MPL.use('Agg')
from matplotlib.figure import Figure as FIGURE
from matplotlib.font_manager import FontProperties
from matplotlib.backends.backend_pdf import PdfPages as PDF
from matplotlib.backends.backend_pdf import FigureCanvasPdf 
import matplotlib.gridspec as GRIDSPEC

#### Set Locale for Matplotlib Axis Labels ####
MPL.rcParams['axes.formatter.use_locale'] = True

#################### MatplotLib Constants #########################

#### Text Allignment ####

cAlignment = {'verticalalignment':'center'}
bAlignment = {'verticalalignment':'top'}

################## Set/Create Font Information ####################

def createFont(family = None, style = None, variant = None, weight = None, 
               stretch = None, size = None, fontFilePathName = None):
    """Returns a Font Object for text in Matplotlib."""

    #### Copy Global Font Properties ####
    if fontFilePathName:
        try:
            font0 = FontProperties(fname = fontFilePathName)
        except:
            font0 = FontProperties()
    else:
        font0 = FontProperties()
    font = font0.copy()

    #### Adjust Based on Arguments ####
    if family is not None:
        font.set_family(family)
    if style is not None:
        font.set_style(style)
    if variant is not None:
        font.set_variant(variant)
    if weight is not None:
        font.set_weight(weight)
    if stretch is not None:
        font.set_stretch(stretch)
    if size is not None:
        font.set_size(size)

    return font

############### Examples of Setting Local Fonts #################
#### English, French, German, Italian, Spanish ####
#### Set Default to None, Base Font Should Work ####
fontFilePathName = None
fontFileBoldName = None
languageCode = ARCPY.gp._gp.GetLocaleInfo()['languagecode'].upper()
baseFontSize = 8

if languageCode in ["ZH", "JA", "RU"]:
    baseFontSize = 6
    if "WIN" not in SYS.platform.upper():
        #### Linux (DejaVu Sans) ####
        if ARCPY.Exists('/usr/share/fonts/dejavu-lgc/DejaVuLGCSans.ttf'):
            fontFilePathName = '/usr/share/fonts/dejavu-lgc/DejaVuLGCSans.ttf'
            fontFileBoldName = '/usr/share/fonts/dejavu-lgc/DejaVuLGCSans.ttf'
        else:
            ARCPY.AddIDMessage("WARNING", 110042)
    else:
        if languageCode == "RU":
            #### Russian ####
            baseFontSize = 8
            fontFilePathName = r'C:\Windows\Fonts\calibri.ttf'
            fontFileBoldName = r'C:\Windows\Fonts\calibrib.ttf'
        else:
            #### Chinese/Japanese* ####
            fontFilePathName = r'C:\Windows\Fonts\simhei.ttf'
            fontFileBoldName = r'C:\Windows\Fonts\simhei.ttf'
    
####################################################

#### Create Spatial Stats PDF Fonts ####
ssFont = createFont(fontFilePathName = fontFilePathName,
                    size = baseFontSize + 2)
ssBoldFont = createFont(fontFilePathName = fontFileBoldName,
                        weight = 'semibold', 
                        size = baseFontSize + 2)
ssBigFont = createFont(fontFilePathName = fontFilePathName,
                       size = baseFontSize + 4)
ssSmallFont = createFont(fontFilePathName = fontFilePathName,
                         size = baseFontSize)
ssLabFont = createFont(fontFilePathName = fontFileBoldName,
                       weight = 'semibold', 
                       size = baseFontSize + 4)
ssTitleFont = createFont(fontFilePathName = fontFileBoldName,
                         weight = 'semibold', 
                         size = baseFontSize + 6)

##########################################################

################### Matplotlib Functions ##########################

def openPDF(fileName):
    """Wraps the PDF Output File Pointer with ArcGIS an ArcGIS Error.

    INPUTS:
    fileName (str): path to the output file

    RETURN:
    output PDF file pointer
    """

    try:
        return PDF(fileName)
    except:
        ARCPY.AddIDMessage("ERROR", 210, fileName)
        raise SystemExit()

################### Matplotlib Classes ############################

class ReportPage(object):
    def __init__(self, title = "", landscape = True, titleFontSize = 12,
                 titleFont = None):
        self.title = title
        self.landscape = landscape
        self.titleFontSize = titleFontSize
        self.titleFont = titleFont
        self.construct()

    def construct(self):
        if self.landscape:
            fig = FIGURE(figsize=(11, 8.5))
            self.numRows = 20
        else:
            fig = FIGURE(figsize=(8.5, 11))
            self.numRows = 28
        if self.titleFont:
            fig.suptitle(self.title, fontproperties = self.titleFont)
        else:
            fig.suptitle(self.title, fontsize = self.titleFontSize, 
                         fontweight = 'semibold')
        self.fig = fig
        self.canvas = FigureCanvasPdf(self.fig)
        if self.canvas.manager:
            self.canvas.manager.set_window_title(self.title)

    def createReportGrid(self, numCols):
        self.grid = ReportGrid(self.fig, self.numRows, numCols)

    def write(self, pdfOutput = None):
        if pdfOutput:
            self.canvas.print_figure(pdfOutput)

class ReportGrid(object):
    def __init__(self, fig, numRows, numCols):

        #### Set Initial Attributes ####
        self.fig = fig
        self.numRows = numRows
        self.numCols = numCols
        self.rowCount = 0
        self.gridSpec = GRIDSPEC.GridSpec(numRows, numCols)

    def createEmptyRow(self):
        self.stepRow()

    def createEmptyCol(self, col):
        pass

    def createLineRow(self, row, startCol = 1, endCol = 8, color = "black"):
        grid = self.fig.add_subplot(self.gridSpec[row, startCol:endCol])
        grid.plot((0.0, 1.0), (-2.0, -2.0), "-", color = color)
        grid.axis('off')

    def createLineCol(self, col, startRow = 0, endRow = 19, color = "black"):
        rowspan = endRow - startRow
        grid = self.fig.add_subplot(self.gridSpec[startRow:endRow, col])
        grid.plot((0.5, 0.5), (0.0, 1.0), "-", color = color)
        grid.axis('off')

    def finalizeTable(self):
        while self.rowCount < self.numRows:
            self.stepRow()

        self.fig.subplots_adjust(top = .925, bottom = .075, 
                                 left = 0.05, right = .95, 
                                 wspace = -.0)

    def writeCell(self, cellInfo, text, rowspan = 1, colspan = 1,
                  color = "black", fontObj = ssFont, justify = "center",
                  setX = None):
        if setX:
            x0 = setX
        else:
            if justify in ["left", "center"]:
                x0 = 0.0
            else:
                x0 = 1.0
        startRow, startCol = cellInfo
        endRow = startRow + rowspan
        endCol = startCol + colspan
        grid = self.fig.add_subplot(self.gridSpec[startRow:endRow, startCol:endCol])
        grid.text(x0, 0.5, text, color = color, 
                  fontproperties = fontObj, 
                  horizontalalignment = justify, wrap=True,
                  **bAlignment)
        grid.axis('off')

    def writeFootnote(self, text, color = "black", fontObj = ssFont):
        grid = self.fig.add_subplot(self.gridSpec[self.rowCount, :])
        grid.text(0.0, 0.5, text, color = color, 
                  fontproperties = fontObj,
                  **bAlignment)
        grid.axis('off')

    def createColumnLabels(self, colLabs, color = "black", fontObj = ssFont,
                           justify = "center", setX = None):
        for ind, label in enumerate(colLabs):
            self.writeCell((self.rowCount, ind), label, 
                            color = "black", fontObj = fontObj,
                            justify = justify, setX = setX)
        self.stepRow()

    def stepRow(self):
        self.rowCount += 1

#################### MatplotLib Functions #########################

def startNewReport(numCols, title = None, landscape = True, 
                   titleFontSize = 12, numRows = None, 
                   titleFont = None):
    if titleFont:
        report = ReportPage(title = title, landscape = landscape, 
                            titleFont = titleFont)
    else:
        report = ReportPage(title = title, landscape = landscape, 
                            titleFontSize = titleFontSize)
    if numRows:
        report.numRows = numRows
    report.createReportGrid(numCols)
    return report

def setTickFontSize(plot, size = 10):
    allTicks = plot.get_xticklabels() + plot.get_yticklabels()
    for label in allTicks:
        label.set_fontsize(size) 

def createParameterPage(paramLabels, paramValues, 
                        title = "Parameter Information",
                        pdfOutput = None,
                        titleFont = None):

    #### Make Main Figure ####
    report = startNewReport(8, title = title, landscape = True,
                            titleFont = titleFont)

    #### Get Grid Info ####
    grid = report.grid

    #### Add Labels ####
    paramLab = ARCPY.GetIDMessage(84400)
    inputLab = ARCPY.GetIDMessage(84401)
    grid.writeCell((0, 0), paramLab, colspan = 3, 
                   fontObj = ssBoldFont, justify = "left")
    grid.writeCell((0, 3), inputLab, colspan = 5, 
                   fontObj = ssBoldFont, justify = "left")
    grid.stepRow()
    grid.createLineRow(grid.rowCount, startCol = 0)
    grid.stepRow()

    #### Make Table ####
    for ind, label in enumerate(paramLabels):
        if grid.rowCount >= 20:
            grid.finalizeTable()
            if pdfOutput:
                report.write(pdfOutput)

            #### Make Main Figure ####
            titleCont = title + " " + ARCPY.GetIDMessage(84377)
            report = startNewReport(8, title = title, landscape = True,
                                    titleFont = titleFont)

            #### Get Grid Info ####
            grid = report.grid

            #### Add Labels ####
            grid.writeCell((0, 0), paramLab, colspan = 3, 
                           fontObj = ssBoldFont, justify = "left")
            grid.writeCell((0, 3), inputLab, colspan = 5, 
                           fontObj = ssBoldFont, justify = "left")
            grid.stepRow()
            grid.createLineRow(grid.rowCount, startCol = 0)


        value = paramValues[ind]
        grid.writeCell((grid.rowCount, 0), label, colspan = 3, 
                        justify = "left")
        grid.writeCell((grid.rowCount, 3), value, colspan = 5, 
                        justify = "left")
        grid.stepRow()
    grid.finalizeTable()

    if pdfOutput:
        report.write(pdfOutput)

def splitFootnote(footnote, index):
    outStr = []
    splitStr = []
    linelen = 0
    words = footnote.split()
    shortWords = []
    for word in words:
        lenWord = len(word)
        if lenWord > index:
            start = 0
            while start < lenWord:
                shortWords.append(word[start:start+index])
                start += index
        else:
            shortWords.append(word)

    for word in shortWords:
        linelen = linelen + len(word) + 1
        if linelen > index:
            if len(splitStr):
                outStr.append(" ".join(splitStr))
            splitStr = [word]
            linelen = len(word)
        else:
            splitStr.append(word)
    outStr.append(" ".join(splitStr))

    return outStr