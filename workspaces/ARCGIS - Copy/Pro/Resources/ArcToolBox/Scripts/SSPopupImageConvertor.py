import arcpy as ARCPY
import os as OS
import sys as SYS
from pathlib import Path as PATH
import matplotlib
matplotlib.use('Agg')
import json as JSON
import time
from enum import Enum
import SSUtilities as UTILS
import subprocess as SUBP
import tempfile as TEMPFILE
import shutil as SU
import SSDataObject as SSDO
import numpy as NUM
from SSCausalInferenceAnalysis import _aggregate_points_for_html as aggregate_points

# Import all the convertor functions
from SSPopupImageConvertor_CPD import render_cpd
from SSPopupImageConvertor_LBR import render_lbr
from SSPopupImageConvertor_TSA import render_tsc, render_forecasting
from SSPopupImageConvertor_TSS import render_tss
from SSPopupImageConvertor_CIA import render_cia
from SSPopupImageConvertor_TSCC import render_tscc

IMAGE_PROCESS_BATCH_SIZE = 2 ** 10  # Number of records to load into memory for processing each time
TIGHTEN_DATA_LABEL = False


def execute(parameters, messages):
    import subprocess as SUBP
    import tempfile as TEMPFILE
    import shutil as SU

    inputFC = UTILS.getTextParameter(0, parameters)
    popupField = "HTML_CHART"
    outputFC = UTILS.getTextParameter(1, parameters)
    imgWidth = parameters[2].value if parameters[2].value else 0
    imgHeight = parameters[3].value if parameters[3].value else 0
    numThreads = UTILS.getNumberOfThreadsDefault()
    rotateXLabels = parameters[4].value
    multiProcessingThreshold = 512

    if UTILS.isShapeFile(inputFC):
        ARCPY.AddIDMessage("ERROR", 110513)
        raise SystemExit()

    if outputFC is not None and outputFC != inputFC:
        if UTILS.isShapeFile(outputFC):
            ARCPY.AddIDMessage("ERROR", 110515)
            raise SystemExit()
        ARCPY.management.CopyFeatures(inputFC, outputFC)
    else:
        outputFC = inputFC

    info = ARCPY.Describe(outputFC)
    # double check the popup field before running
    try:
        field_exist = False
        for f in info.fields:
            if f.type.upper() in ["STRING", "TEXT"] and f.name.upper() == "HTML_CHART":
                field_exist = True
                break
        if not field_exist:
            ARCPY.AddIDMessage("ERROR", 110514)
            raise SystemExit()
    except:
        pass

    fieldOID = info.OIDFieldName
    numObs = int(ARCPY.GetCount_management(outputFC)[0])
    tempDir = OS.path.join(TEMPFILE.gettempdir(), "ss_temp_images")
    tempCSV = OS.path.join(tempDir, "temp.csv")

    convertor = ImageConvertor(
        info.catalogPath, popupField, tempDir, tempCSV,
        imgWidth=imgWidth / 100, imgHeight=imgHeight / 100,
        tightenDateLabel=rotateXLabels)

    if convertor.chartType == ChartType.CIA:
        desc = ARCPY.Describe(inputFC)
        if hasattr(desc, "fidSet") and desc.fidSet:
            ARCPY.AddIDMessage("ERROR", 110514)  # selection is not allowed for Causal Inference Analysis Input
            raise SystemExit()

    if convertor.chartType != ChartType.CIA and numThreads > 1 and numObs > multiProcessingThreshold:
        # ARCPY.AddMessage(f"Process with {numThreads} threads")
        ARCPY.env.autoCancelling = False
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220645).format(numObs),
                            0, 100, 1)
        startupinfo = None
        if OS.name == 'nt':
            startupinfo = SUBP.STARTUPINFO()
            startupinfo.dwFlags |= SUBP.STARTF_USESHOWWINDOW
        pyLocation = OS.path.dirname(OS.path.dirname(
            OS.path.dirname(OS.path.dirname(UTILS.__file__)))) + r"\bin\Python\envs\arcgispro-py3\python.exe"
        command = [pyLocation,
                   OS.path.join(OS.path.dirname(UTILS.__file__), "SSPopupImageConvertor.py"),
                   info.catalogPath,
                   popupField,
                   tempDir,
                   tempCSV,
                   str(imgWidth),
                   str(imgHeight),
                   str(numThreads),
                   str(int(rotateXLabels))]

        process = SUBP.Popen(command, stdout=SUBP.PIPE, stderr=SUBP.PIPE, startupinfo=startupinfo)
        for line in iter(process.stdout.readline, ""):
            if ARCPY.env.isCancelled:
                process.terminate()
                raise SystemExit()

            line = str(line).strip("b").strip("'").strip("n").strip("\r").strip("\\")
            if not line:
                break

            if line.upper().startswith("PROGRESS"):
                ARCPY.SetProgressorPosition()
            elif line.upper().startswith("ERROR"):
                ARCPY.AddError(line)
                raise SystemExit()
            else:
                ARCPY.AddMessage(line)

        ARCPY.env.autoCancelling = True
        pass
    else:
        # ARCPY.AddMessage("Process with single-thread")

        convertor.execute()

    ARCPY.ResetProgressor()
    ARCPY.EnableAttachments_management(outputFC)
    ARCPY.AddAttachments_management(outputFC, fieldOID, tempCSV, "OID",
                                    "IMGPATH", tempDir)

    try:
        # remove the temp field and html field at the end
        # ARCPY.DeleteField_management(outputFC, [popupField])
        SU.rmtree(tempDir)
    except OSError as e:
        pass

    return


def _parseHtmlStr(htmlStr):
    lines = htmlStr.split("\n")
    in_script = False
    var_head = 0
    data = {}
    for line in lines:
        l = line.strip()
        if l.startswith("<script>"):
            in_script = True
        elif l.startswith("</script>"):
            in_script = False
        if in_script:
            if l.startswith("var"):
                var_head += 1
                l = l.strip("var")
            if var_head == 1:
                expr = l.split("=")
                name = expr[0].strip()
                if name == "rp":
                    data["rp"] = "empty"
                    data["g_popupTheme"] = 1
                else:
                    try:
                        data[name] = JSON.loads(expr[1].strip(",").strip(";").replace("'", "\""))
                    except:
                        data[name] = None
    return data


def _convert_lbr(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_lbr(_parseHtmlStr(htmlStr), path, imgWidth, imgHeight, tighenDateLabel)


def _convert_forecast(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_forecasting(_parseHtmlStr(htmlStr), path, imgWidth, imgHeight, tighenDateLabel)


def _convert_tsc(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_tsc(_parseHtmlStr(htmlStr), path, imgWidth, imgHeight, tighenDateLabel)


def _convert_forecastEvaluate(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_forecasting(_parseHtmlStr(htmlStr), path, imgWidth, imgHeight, tighenDateLabel)


def _convert_timeSeriesSmoothing(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_tss(_parseHtmlStr(htmlStr)["data"], path, imgWidth, imgHeight, tighenDateLabel)


def _convert_changePointDetection(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_cpd(_parseHtmlStr(htmlStr)["data"], path, imgWidth, imgHeight, tighenDateLabel)


def _convert_causalInferenceAnalysis(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, accessoryData = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_cia(JSON.loads(htmlStr), accessoryData, path, imgWidth, imgHeight, tighenDateLabel)

def _convert_timeSeriesCrossCorrelation(val):
    htmlStr, path, imgWidth, imgHeight, reportProcess, tighenDateLabel, _ = val
    if reportProcess:
        ARCPY.AddMessage("PROGRESS")
    return render_tscc(_parseHtmlStr(htmlStr)["data"], path, imgWidth, imgHeight, tighenDateLabel)

class ChartType(Enum):
    LBR = 1
    "Local Bi-variant Relationship"

    TS_ANALYSIS = 2
    "Time Series Forecasting or Clustering"

    TS_SMOOTH = 3
    "Time Series Smoothing"

    CPD = 4
    "Change Point Detection"

    CIA = 5
    "Casual Inference Analysis"

    TS_CorssCorrelation = 6
    "Time Series Cross Correlation"


class ImageConvertor(object):
    def __init__(self, outputFC, popupField, outDir, outCSV, imgWidth=10.0, imgHeight=10.0,
                 tightenDateLabel=TIGHTEN_DATA_LABEL):
        ARCPY.env.overwriteOutput = True
        self.outputFC = outputFC
        self.popupField = popupField
        self.outDir = outDir
        self.outCSV = outCSV
        self.imgWidth = imgWidth
        self.imgHeight = imgHeight
        self.tightenDateLabel = tightenDateLabel

        self.numObs = int(ARCPY.GetCount_management(outputFC)[0])

        if OS.path.isdir(self.outDir):
            try:
                SU.rmtree(self.outDir)
            except OSError as e:
                pass

        self.chartType = None
        self.processingCore = None
        self.accessoryData = None
        self.determineChartType()

        if self.chartType == ChartType.CIA:
            self.preprocess_CIA_Data()

        if self.imgWidth <= 0:
            if self.chartType in [ChartType.LBR, ChartType.CIA]:
                self.imgWidth = 5
            else:
                self.imgWidth = 10

        if self.imgHeight <= 0:
            if self.chartType in [ChartType.LBR, ChartType.CIA]:
                self.imgHeight = 5
            else:
                if self.chartType == ChartType.TS_CorssCorrelation:
                    self.imgHeight = 8
                else:
                    self.imgHeight = 4

    def determineChartType(self):
        """
        Determine the type of the chart according to the first HTML record of the dataset
        :return: str
        """
        with ARCPY.da.SearchCursor(self.outputFC, [self.popupField]) as cursor:
            htmlStr = None
            for row in cursor:
                if row[0] is None or len(row[0]) < 10:
                    continue
                else:
                    htmlStr = row[0]
                    break
            if htmlStr is None:
                ARCPY.AddIDMessage("ERROR", 110514)
                raise SystemExit()
            lines = htmlStr.split("\n")
            for line in lines:
                l = line.strip()
                if l.startswith("st.src"):
                    if l.find("localBivarRelPlot") >= 0:
                        self.chartType = ChartType.LBR
                        self.processingCore = _convert_lbr
                        return
                    elif l.find("timeSeriesChangePointPlot") >= 0:
                        self.chartType = ChartType.CPD
                        self.processingCore = _convert_changePointDetection
                        return
                    elif l.find("timeSeriesPlot") >= 0:
                        self.chartType = ChartType.TS_ANALYSIS
                        isForecast = False
                        for l2 in lines:
                            if l2.strip().startswith("cid"):
                                self.processingCore = _convert_tsc
                                break
                            if l2.strip().startswith("CC") and len(l2) > 20:
                                self.processingCore = _convert_forecastEvaluate
                                break
                            if l2.strip().startswith("fit"):
                                isForecast = True
                        if self.processingCore is None and isForecast:
                            self.processingCore = _convert_forecast
                        return
                    elif l.find("timeSeriesSmoothing") >= 0:
                        self.chartType = ChartType.TS_SMOOTH
                        self.processingCore = _convert_timeSeriesSmoothing
                        return
                    elif l.find("SSTSCorrelation") >= 0:
                        self.chartType = ChartType.TS_CorssCorrelation
                        self.processingCore = _convert_timeSeriesCrossCorrelation
                        return
                    break
            try:
                data = JSON.loads(htmlStr)
                if "tool" in data and data["tool"].upper() == "CAUSALINFERENCEANALYSIS":
                    self.chartType = ChartType.CIA
                    self.processingCore = _convert_causalInferenceAnalysis
                    self.accessoryData = {
                        "erf_x": NUM.array(data["erf_x"]),
                        "erf_y": NUM.array(data["erf_y"]),
                        "fields": data["fields"]
                    }

                    return
            except:
                pass
        del cursor
        ARCPY.AddIDMessage("ERROR", 110514)
        raise SystemExit()

    def preprocess_CIA_Data(self):
        """
        Read the whole dataset and get some global info
        Returns
        -------

        """
        ssdo = SSDO.SSDataObject(self.outputFC, silentWarnings=True)
        fields = self.accessoryData["fields"]
        ssdo.obtainData(ssdo.oidName, fields)
        n = ssdo.numObs
        if n < 30:
            ARCPY.AddIDMessage("ERROR", 110514)
            raise SystemExit()
        x = ssdo.fields[fields[0]].returnDouble(replaceNullValues=True)
        y = ssdo.fields[fields[1]].returnDouble(replaceNullValues=True)
        w = ssdo.fields[fields[2]].returnDouble(replaceNullValues=True)
        MAX_POINT_LIMIT = 1500
        if n > MAX_POINT_LIMIT:
            x, y, w = aggregate_points(x, y, w, MAX_POINT_LIMIT)
        self.accessoryData["x"] = x
        self.accessoryData["y"] = y
        self.accessoryData["w"] = w

        weight_range = [w.min(), w.max()]
        area = 80 + 800 * (w - weight_range[0]) / (
                weight_range[1] - weight_range[0])
        self.accessoryData["range_w"] = weight_range
        self.accessoryData["range_x"] = [x.min(), x.max()]
        self.accessoryData["range_y"] = [y.min(), y.max()]
        self.accessoryData["range_erf_y"] = [self.accessoryData["erf_y"].min(), self.accessoryData["erf_y"].max()]
        self.accessoryData["area"] = area
        self.accessoryData["alias"] = [ssdo.fields[fields[0]].alias, ssdo.fields[fields[1]].alias]

        globalData = self.accessoryData
        data = [
            list(globalData["x"]),  # 0
            list(globalData["y"]),  # 1
            list(globalData["w"]),   # 2
            list(globalData["erf_x"]),  # 3
            list(globalData["erf_y"]),  # 4
            list(globalData["area"]),   # 5
            globalData["range_w"],  # 6
            globalData["range_x"],  # 7
            globalData["range_y"],  # 8
            globalData["range_erf_y"],  # 9
            globalData["alias"],       # 10
        ]
        self.accessoryData = data

    def execute(self):
        PATH(self.outDir).mkdir(parents=True, exist_ok=True)
        imgFormat = ".jpeg"
        tempCSV = OS.path.join(self.outDir, "temp.csv")
        info = ARCPY.Describe(self.outputFC)
        fieldOID = info.OIDFieldName
        fields = [fieldOID, self.popupField]
        f = open(tempCSV, "w")
        f.write(",".join(["OID", "IMGPATH"]) + "\n")
        time_dataPrep = 0
        time_render = 0
        time_saveImg = 0
        time_threeSteps = 0
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220645).format(self.numObs),
                            0, self.numObs, 1)
        with ARCPY.da.SearchCursor(self.outputFC, fields) as cursor:
            count = 0
            for row in cursor:
                ARCPY.SetProgressorPosition()
                htmlStr = row[1]
                t0 = time.time()
                if htmlStr is None or len(htmlStr) < 10:
                    continue
                imgName = str(row[0]) + imgFormat
                path = OS.path.join(self.outDir, imgName)
                f.write(",".join([str(row[0]), imgName]) + "\n")
                t1 = time.time()

                dt2, dt3 = self.processingCore((htmlStr, path, self.imgWidth, self.imgHeight, False, self.tightenDateLabel, self.accessoryData))
                # t2 = time.time()
                # await page.screenshot({'path': path})
                t3 = time.time()
                time_dataPrep += t1 - t0
                time_render += dt2
                time_saveImg += dt3
                time_threeSteps += t3 - t0
                count += 1
                if ARCPY.env.isCancelled:
                    break
            if ARCPY.env.isCancelled:
                raise SystemExit()

        # ARCPY.AddMessage(f"Time used [dataPrep] : {time_dataPrep}s")
        # ARCPY.AddMessage(f"Time used [render] : {time_render}s")
        # ARCPY.AddMessage(f"Time used [saveImg] : {time_saveImg}s")
        # ARCPY.AddMessage(f"Time used [three steps] : {time_threeSteps}s")
        f.close()
        ARCPY.ResetProgressor()
        return

    def executeParallel(self, threadNum):
        import multiprocessing
        from multiprocessing import Pool

        if threadNum > multiprocessing.cpu_count():
            threadNum = multiprocessing.cpu_count()

        PATH(self.outDir).mkdir(parents=True, exist_ok=True)
        imgFormat = ".jpeg"
        tempCSV = OS.path.join(self.outDir, "temp.csv")
        info = ARCPY.Describe(self.outputFC)
        fieldOID = info.OIDFieldName
        fields = [fieldOID, self.popupField]
        f = open(tempCSV, "w")
        f.write(",".join(["OID", "IMGPATH"]) + "\n")
        time_dataPrep = 0
        time_render = 0
        time_saveImg = 0
        time_threeSteps = 0
        dataBatch = []
        with ARCPY.da.SearchCursor(self.outputFC, fields) as cursor:
            count = 0
            currentStep = 0
            for row in cursor:
                htmlStr = row[1]
                t0 = time.time()
                count += 1
                if int(count * 100.0 / self.numObs) > currentStep:
                    updateProcess = True
                    currentStep += 1
                else:
                    updateProcess = False
                if htmlStr is None or len(htmlStr) < 10:
                    continue
                imgName = str(row[0]) + imgFormat
                path = OS.path.join(self.outDir, imgName)
                f.write(",".join([str(row[0]), imgName]) + "\n")
                dataBatch.append((htmlStr, path, self.imgWidth, self.imgHeight, updateProcess, self.tightenDateLabel,
                                  None if self.accessoryData is None else self.accessoryData.copy()))
                if count % IMAGE_PROCESS_BATCH_SIZE == 0:
                    p = Pool(threadNum)
                    p.map(self.processingCore, dataBatch)
                    dataBatch.clear()

                t3 = time.time()
                # time_dataPrep += t1 - t0
                # time_render += dt2
                # time_saveImg += dt3
                time_threeSteps += t3 - t0
                if ARCPY.env.isCancelled:
                    break
            # process all the remaining data
            t0 = time.time()
            p = Pool(threadNum)
            p.map(self.processingCore, dataBatch)
            dataBatch.clear()

            t3 = time.time()
            time_threeSteps += t3 - t0
            if ARCPY.env.isCancelled:
                raise SystemExit()

        f.close()
        ARCPY.ResetProgressor()
        # ARCPY.AddMessage(f"Time used [three steps] : {time_threeSteps}s")
        return


if __name__ == "__main__":
    argv = SYS.argv[1:]
    outputFC = argv[0]
    popupField = argv[1]
    outDir = argv[2]
    outCSV = argv[3]
    imgWidth = int(argv[4])
    imgHeight = int(argv[5])
    threadNum = int(argv[6])
    tightenXLabel = bool(int(argv[7]))
    t0 = time.time()
    convertor = ImageConvertor(outputFC, popupField, outDir, outCSV,
                               imgWidth=imgWidth / 100, imgHeight=imgHeight / 100,
                               tightenDateLabel=tightenXLabel)
    convertor.executeParallel(threadNum)
    t1 = time.time()



