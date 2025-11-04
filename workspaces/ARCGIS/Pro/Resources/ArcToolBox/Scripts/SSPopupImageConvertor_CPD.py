"""
Convertors for Change Point Detection tool
"""

import matplotlib
matplotlib.use('Agg')
import math as MATH
import matplotlib.pyplot as PLT
from mpl_toolkits.axisartist.axislines import Axes
from mpl_toolkits.axisartist.axislines import Subplot
import numpy as NUM
import json as JSON
import time
from enum import Enum
from datetime import datetime, timedelta
import textwrap
import matplotlib.dates as mdates

# from .Convertor_TSA import __getLegalDate, __calSignalTimeSteps, __isLeapYear
from SSPopupImageConvertor_TSA import __getLegalDate, __calSignalTimeSteps, __isLeapYear

fontColor_global = "#848484"
colorLine = "#1A85FF"
colorHighlight = "#18ffff"
c_cp = "#D41159"
c_mean = "#D41159"
c_lower = "#D41159"
c_upper = c_lower
c_global_var = "#b5b5b5"
c_area = "#d66f95"
supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]


def __append_xy_value(target, x, y):
    target["x"].append(x)
    target["y"].append(y)

def __append_area_value(target, x, bottom, ceiling):
    target["x"].append(x)
    target["bottom"].append(bottom)
    target["ceiling"].append(ceiling)


def __prepareData(data):
    """
    prepare the dataset for rendering
    :param data:
    :return:
    """
    dataBundle = {}
    if "intv" in data:
        data["intv"] = int(data["intv"])
    signalTimeSteps = __calSignalTimeSteps(data)
    ts = data["ts"]
    dataBundle["x"] = signalTimeSteps[: len(ts)]
    dataBundle["y"] = ts
    tsNum = len(ts)

    changePoints = {"x": [], "y": []}
    meanValueBundle = {"x": [], "y": []}
    lowerBoundBundle = {"x": [], "y": []}
    upperBoundBundle = {"x": [], "y": []}
    slopeValueBundle = {"x": [], "y": []}
    globalLowerBundle = {"x": [], "y": []}
    globalUpperBundle = {"x": [], "y": []}
    areaBundle = {"x": [], "bottom": [], "ceiling": []}
    bounds = []
    if "cps" in data:
        cpSet = set(data["cps"])
    else:
        cpSet = set()

    sumVal = 0.0
    sumCount = 0.0
    cpStartId = 0
    meanVal = 0.0
    segVar = 0.0
    stdDev= 0.0
    lowerBound = 0.0
    upperBound = 0.0
    slopeVal = 0.0
    changeType = int(data["cpt"])

    if changeType == 2:
        dataBundle["isCp"] = [False] * tsNum
        dataBundle["slope"] = NUM.zeros(tsNum)
        dataBundle["intercept"] = NUM.zeros(tsNum)
        for i in range(tsNum):
            isCp = i in cpSet
            dataBundle["isCp"][i] = isCp
            if isCp:
                n = i - cpStartId
                sum_xt = 0.0
                sum_x = 0.0
                sum_t = 0.0
                sum_t2 = 0.0
                for j in range(cpStartId, i):
                    sum_x += ts[j]
                    sum_xt += ts[j] * j
                    sum_t += j
                    sum_t2 += j ** 2
                # Fitted line is of form  X = a + b * t
                b = (n * sum_xt - sum_x * sum_t) / (n * sum_t2 - sum_t * sum_t)
                a = (sum_x - b * sum_t) / n

                __append_xy_value(slopeValueBundle, signalTimeSteps[cpStartId], a + b * cpStartId)
                bounds.append(a + b * cpStartId)
                dataBundle["slope"][cpStartId: i] = b
                dataBundle["intercept"][cpStartId: i] = a
                cpStartId = i
                bounds.append(a + b * (i - 1))
                __append_xy_value(slopeValueBundle, signalTimeSteps[i - 1], a + b * (i - 1))
                __append_xy_value(slopeValueBundle, signalTimeSteps[i - 1], None)
        # last segment
        lastSegIdx = len(signalTimeSteps) - 1
        n = lastSegIdx - cpStartId + 1
        sum_xt = 0.0
        sum_x = 0.0
        sum_t = 0.0
        sum_t2 = 0.0

        for j in range(cpStartId, len(signalTimeSteps)):
            sum_x += ts[j]
            sum_xt += ts[j] * j
            sum_t += j
            sum_t2 += j ** 2

        b = (n * sum_xt - sum_x * sum_t) / (n * sum_t2 - sum_t * sum_t)
        a = (sum_x - b * sum_t) / n
        bounds.append(a + b * lastSegIdx)
        __append_xy_value(slopeValueBundle, signalTimeSteps[cpStartId], a + b * cpStartId)
        __append_xy_value(slopeValueBundle, signalTimeSteps[lastSegIdx], a + b * lastSegIdx)
        bounds.append(a + b * lastSegIdx)
        dataBundle["slope"][cpStartId: len(signalTimeSteps)] = b
        dataBundle["intercept"][cpStartId: len(signalTimeSteps)] = a

    elif changeType == 1:
        sumVal = sum(ts)
        meanVal = sumVal / tsNum
        dataBundle["isCp"] = [False] * tsNum
        dataBundle["mean"] = meanVal
        dataBundle["lower"] = NUM.zeros(tsNum)
        dataBundle["upper"] = NUM.zeros(tsNum)
        for i in range(tsNum):
            isCp = i in cpSet
            dataBundle["isCp"][i] = isCp
            if isCp:
                stdDev = MATH.sqrt(segVar / (i - cpStartId + 1))
                lowerBound = meanVal - 2 * stdDev
                upperBound = meanVal + 2 * stdDev
                dataBundle["lower"][cpStartId: i] = lowerBound
                dataBundle["upper"][cpStartId: i] = upperBound
                bounds.append(lowerBound)
                bounds.append(upperBound)
                tCp = signalTimeSteps[cpStartId]
                __append_xy_value(lowerBoundBundle, tCp, lowerBound)
                __append_xy_value(upperBoundBundle, tCp, upperBound)
                __append_area_value(areaBundle, tCp, lowerBound, upperBound)
                cpStartId = i
                tCpM = signalTimeSteps[cpStartId - 1]
                __append_xy_value(lowerBoundBundle, tCpM, lowerBound)
                __append_xy_value(lowerBoundBundle, tCpM, None)
                __append_xy_value(upperBoundBundle, tCpM, upperBound)
                __append_xy_value(upperBoundBundle, tCpM, None)
                __append_area_value(areaBundle, tCpM, lowerBound, upperBound)
                __append_area_value(areaBundle, tCpM, NUM.nan, NUM.nan)
                segVar = 0.0
            else:
                segVar += (ts[i] - meanVal) ** 2
        # deal with the last segment
        stdDev = MATH.sqrt(segVar / (len(signalTimeSteps) - cpStartId + 1))
        lowerBound = meanVal - 2 * stdDev
        upperBound = meanVal + 2 * stdDev
        bounds.append(lowerBound)
        bounds.append(upperBound)
        dataBundle["lower"][cpStartId: len(signalTimeSteps)] = lowerBound
        dataBundle["upper"][cpStartId: len(signalTimeSteps)] = upperBound
        __append_xy_value(lowerBoundBundle, signalTimeSteps[cpStartId], lowerBound)
        __append_xy_value(lowerBoundBundle, signalTimeSteps[-1], lowerBound)
        __append_xy_value(upperBoundBundle, signalTimeSteps[cpStartId], upperBound)
        __append_xy_value(upperBoundBundle, signalTimeSteps[-1], upperBound)
        __append_area_value(areaBundle, signalTimeSteps[cpStartId], lowerBound, upperBound)
        __append_area_value(areaBundle, signalTimeSteps[-1], lowerBound, upperBound)

        # Add the global mean and variance
        __append_xy_value(meanValueBundle, signalTimeSteps[0], meanVal)
        __append_xy_value(meanValueBundle, signalTimeSteps[-1], meanVal)
        # global
        globalVar = 0.0
        for j in range(len(signalTimeSteps)):
            globalVar += (ts[j] - meanVal) ** 2
        globalVar /= len(signalTimeSteps)
        globalSTD = MATH.sqrt(globalVar)
        globalLowerBound = meanVal - 2 * globalSTD
        globalUpperBound = meanVal + 2 * globalSTD
        __append_xy_value(globalLowerBundle, signalTimeSteps[0], globalLowerBound)
        __append_xy_value(globalLowerBundle, signalTimeSteps[-1], globalLowerBound)
        __append_xy_value(globalUpperBundle, signalTimeSteps[0], globalUpperBound)
        __append_xy_value(globalUpperBundle, signalTimeSteps[-1], globalUpperBound)
        dataBundle["globalLower"] = [globalLowerBound]
        dataBundle["globalUpper"] = [globalUpperBound]

    else:
        dataBundle["isCp"] = [False] * tsNum
        dataBundle["mean"] = NUM.zeros(tsNum)
        for i in range(tsNum):
            isCp = i in cpSet
            dataBundle["isCp"][i] = isCp
            if isCp and sumCount > 0:
                meanVal = sumVal / sumCount
                __append_xy_value(meanValueBundle, signalTimeSteps[cpStartId], meanVal)
                dataBundle["mean"][cpStartId: i] = meanVal
                cpStartId = i
                __append_xy_value(meanValueBundle, signalTimeSteps[cpStartId - 1], meanVal)
                __append_xy_value(meanValueBundle, signalTimeSteps[cpStartId - 1], None)
                sumVal = ts[i]
                sumCount = 1
            else:
                sumVal += ts[i]
                sumCount += 1

        # close the mean line at the end
        meanVal = sumVal / sumCount
        __append_xy_value(meanValueBundle, signalTimeSteps[cpStartId], meanVal)
        __append_xy_value(meanValueBundle, signalTimeSteps[-1], meanVal)
        dataBundle["mean"][cpStartId: len(signalTimeSteps)] = meanVal

    if "cps" in data:
        for tid in data["cps"]:
            __append_xy_value(changePoints, signalTimeSteps[tid], ts[tid])

    d_range = [min(ts + bounds), max(ts + bounds)]
    resultBundle = {
        "dataBundle": dataBundle,
        "changePoints": changePoints,
        "range": d_range,
    }
    if changeType == 0 or changeType == 3:
        resultBundle["meanValueBundle"] = meanValueBundle
    elif changeType == 1:
        resultBundle["lowerBoundBundle"] = lowerBoundBundle
        resultBundle["upperBoundBundle"] = upperBoundBundle
        resultBundle["globalLowerBundle"] = globalLowerBundle
        resultBundle["globalUpperBundle"] = globalUpperBundle
        resultBundle["meanValueBundle"] = meanValueBundle
        resultBundle["areaBundle"] = areaBundle
    else:
        resultBundle["slopeValueBundle"] = slopeValueBundle

    return resultBundle


def render_cpd(_data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """
    This method is used for rendering Change Point Detection Charts
    :param _data:
    :param outputPath:
    :param imgWidth:
    :param imgHeight:
    :return:
    """
    t1 = time.time()
    data = __prepareData(_data)
    if data is None:
        return 0, 0
    d0 = data["dataBundle"]["x"][0]
    d1 = data["dataBundle"]["x"][-1]

    lineMarkerSize = 1.2
    meanLineWidth = 1.5
    if len(data["dataBundle"]["x"]) >= 200:
        meanLineWidth = "2.0"
    dashLineStyle = (0, (6, 1))

    l_x = data["dataBundle"]["x"]
    l_y = data["dataBundle"]["y"]
    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)
    ax.set_ylabel(_data["vn"])
    PLT.ioff()
    ax.plot(l_x, l_y, linewidth=lineMarkerSize, marker=".", c=colorLine, label=_data["labels"]["original"])
    # ax.plot_date(l_x, l_y, fmt=colorLine, linewidth=1.5, marker=".", label=_data["labels"]["original"])

    if "changePoints" in data:
        PLT.scatter(data["changePoints"]["x"], data["changePoints"]["y"],
                    color=c_cp, marker="o", label=_data["labels"]["chpts"], zorder=10)

    changeType = int(_data["cpt"])
    if changeType in [0, 3]:
        if "meanValueBundle" in data:
            l_xm = data["meanValueBundle"]["x"]
            l_ym = data["meanValueBundle"]["y"]
            ax.plot(l_xm, l_ym, linewidth=meanLineWidth, c=c_mean, label=_data["labels"]["segMeanVals"])
    elif changeType == 1:
        if "meanValueBundle" in data:
            l_xm = data["meanValueBundle"]["x"]
            l_ym = data["meanValueBundle"]["y"]
            ax.plot(l_xm, l_ym, linewidth=meanLineWidth, c=c_mean,
                    label=_data["labels"]["globalMean"])
        if "upperBoundBundle" in data:
            l_xu = data["upperBoundBundle"]["x"]
            l_yu = data["upperBoundBundle"]["y"]
            ax.plot(l_xu, l_yu, linewidth=meanLineWidth, linestyle=dashLineStyle, c=c_mean,
                    label=_data["labels"]["segUpperBounds"])
        if "lowerBoundBundle" in data:
            l_xl = data["lowerBoundBundle"]["x"]
            l_yl = data["lowerBoundBundle"]["y"]
            ax.plot(l_xl, l_yl, linewidth=meanLineWidth, linestyle=dashLineStyle, c=c_mean,
                    label=_data["labels"]["segLowerBounds"])
        if "globalUpperBundle" in data:
            l_xgu = data["globalUpperBundle"]["x"]
            l_ygu = data["globalUpperBundle"]["y"]
            ax.plot(l_xgu, l_ygu, linewidth=meanLineWidth, linestyle=dashLineStyle, c=c_global_var,
                    label=_data["labels"]["globUpperBounds"])
        if "globalLowerBundle" in data:
            l_xgl = data["globalLowerBundle"]["x"]
            l_ygl = data["globalLowerBundle"]["y"]
            ax.plot(l_xgl, l_ygl, linewidth=meanLineWidth, linestyle=dashLineStyle, c=c_global_var,
                    label=_data["labels"]["globLowerBounds"])
        if "areaBundle" in data:
            l_xc = data["areaBundle"]["x"]
            l_ycU = data["areaBundle"]["ceiling"]
            l_ycB = data["areaBundle"]["bottom"]
            PLT.fill_between(l_xc, l_ycB, l_ycU, color=c_area, alpha=0.08,
                             edgecolor=None, label=_data["labels"]["segArea"])

    else:
        if "slopeValueBundle" in data:
            l_xs = data["slopeValueBundle"]["x"]
            l_ys = data["slopeValueBundle"]["y"]
            ax.plot(l_xs, l_ys, linewidth=meanLineWidth, linestyle=dashLineStyle, c=c_mean,
                    label=_data["labels"]["segLine"])

    if "headerNote" in _data["labels"] and "changeStr" in _data["labels"]:
        font = {'family': 'Verdana',
                'color': fontColor_global,
                'weight': 'bold',
                'size': 10,
                }
        text_pos_x = d0
        text_pos_y = data["range"][-1] + (data["range"][-1] - data["range"][0]) * 0.1
        text = f'{_data["labels"]["headerNote"]}: {_data["labels"]["changeStr"]}'
        PLT.text(text_pos_x, text_pos_y, text, fontdict=font)

    if tightenDateLabel:
        ax.xaxis.set_tick_params(rotation=20, labelsize=9)
        PLT.legend(loc='best', ncol=4)
    else:
        PLT.legend(loc='upper center', bbox_to_anchor=(0.5, -0.1), ncol=4)

    t2 = time.time()

    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2