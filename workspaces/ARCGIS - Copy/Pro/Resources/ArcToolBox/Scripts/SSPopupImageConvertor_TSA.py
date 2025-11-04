"""
Convertors for Time Series Clustering, Time Series Forecasting and Forecasting Comparison tools
"""
import arcpy
import matplotlib
matplotlib.use('Agg')
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

fontColor_global = "#848484"
colorGrey = "#607d8b"
colorHighlight = "#18ffff"
colorOrange = "#ff9800"
lineColorMap = {
    0: '#848484',
    1: '#E78AC3',
    2: '#4EC2A5',
    3: '#8DA0CB',
    4: '#FC8D62',
    5: '#FFE576',
}

classColors = ["#78AAFF", "#FF6455", "#7DDC55", "#FFB400", "#C864E1",
               "#BEA064", "#FABEC8", "#AFAFAF", "#005AE6", "#E60000",
               "#37A000", "#960096", "#B4FF00", "#822800", "#3C6E82",
               "#FF00C3", "#00E6AA", "#FFE600", "#002378", "#D78787",
               "#282828", "#73E1E1", "#006400", "#E1C3FF", "#966432",
               "#FFC88C", "#D2FFBE", "#CDE1FF", "#FFFF87", "#F0F0F0"]

compareColors = ["#F26745", "#31A2BD", "#7e57c2", "#F49368",
                 "#8d6e63", "#faa513", "#f06292", "#3D936A",
                 "#355A7C", "#E67E8A", "#2977BC", "#A06496"]

colorLine = "#1976d2"
c_color = '#ffcc80'
colorHighlight = "#18ffff"
c_outliers = ["#762a83", "#1b7837", "#848484"]

supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]
dt_template = "%Y/%m/%d %H:%M:%S"


def ext_calSignalTimeSteps(data, T=None):
    return __calSignalTimeSteps(data, T=T)


def __isLeapYear(year):
    if year % 100 == 0:
        return year % 400 == 0
    else:
        return year % 4 == 0


def __getLegalDate(t_start, deltaYear, deltaMonth):
    lastDays = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
                7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
    newYear = t_start.year
    newMonth = t_start.month
    newYear += deltaYear
    newMonth += deltaMonth
    newYear += (newMonth - 1) // 12
    newMonth = (newMonth - 1) % 12 + 1
    maxDate = lastDays[newMonth]
    if newMonth == 2 and __isLeapYear(newYear):
        maxDate = 29

    return datetime(newYear, newMonth, min(t_start.day, maxDate),
            t_start.hour, t_start.minute, t_start.second)


def __getDateFormatter(unit, allTimeStepsSameDay):
    u = unit.upper()
    if u in ["SECONDS", "MINUTES", "HOURS", "DAYS"]:
        if allTimeStepsSameDay:
            return "%H:%M:%S", False
        else:
            return "%Y/%b/%d %H:%M:%S", True
    elif u in ["WEEKS", "MONTHS", "YEARS"]:
        return "%Y/%b/%d", False
    else:
        return None


def __calSignalTimeSteps(data, T=None):
    timeSteps = []
    if T is None:
        T = len(data["ts"])
    t_start = datetime.strptime(data["t0"], dt_template)
    if "forecast" in data and len(data["forecast"]):
        T += len(data["forecast"])
    elif "CC" in data and len(data["CC"]) > 0 and len(data["CC"][0]["forecast"]) > 0:
        T += len(data["CC"][0]["forecast"])
    if "intv" in data:
        tDelta = data["intv"]
        if isinstance(tDelta, str):
            try:
                tDelta = int(tDelta)
            except:
                tDelta = 1
    else:
        tDelta = 1

    if data["unit"] == "MONTHS":
        for i in range(T):
            timeSteps.append(__getLegalDate(t_start, 0, i * tDelta))
    elif data["unit"] == "YEARS":
        for i in range(T):
            timeSteps.append(__getLegalDate(t_start, i * tDelta, 0))
    elif data["unit"] in supportTime:
        unit = data["unit"]
        if unit == "MINUTES":
            tDelta = tDelta * 60
        elif unit == "HOURS":
            tDelta = tDelta * 60 * 60
        elif unit == "DAYS":
            tDelta = tDelta * 60 * 60 * 24
        elif unit == "WEEKS":
            tDelta = tDelta * 60 * 60 * 24 * 7
        for i in range(T):
            timeSteps.append(t_start + timedelta(seconds=tDelta * i))
    else:  #  there are some error here, return simple number indexes
        for i in range(T):
            timeSteps.append(i)

    return timeSteps


def __prepareData(data):
    """
    prepare the dataset for rendering
    :param data:
    :return:
    """
    dataBundle = {}
    ts = data["ts"]
    if len(ts) < 2:
        return None
    yMin = min(ts)
    yMax = max(ts)
    yMinLine = yMin
    yMaxLine = yMax
    #### get outliers ####
    outliers = set()
    if "outliers" in data and len(data["outliers"]) > 0:
        outliers = set(data["outliers"])

    # original data
    signalTimeSteps = __calSignalTimeSteps(data)
    dataBundle["x"] = signalTimeSteps[: len(ts)]
    dataBundle["y"] = ts
    dataBundle["isOutlier"] = [False] * len(ts)
    for i in outliers:
        dataBundle["isOutlier"][i] = True

    allTimeStepsSameDay = False
    d0 = signalTimeSteps[0]
    d1 = signalTimeSteps[-1]
    if d0.year == d1.year and d0.month == d1.month and d0.day == d1.day:
        allTimeStepsSameDay = True

    resultBundle = {
        "dataBundle": dataBundle,
        "rawTime_last": signalTimeSteps[len(ts) - 1],
        "allTimeStepsSameDay": allTimeStepsSameDay
    }
    # forecasted data
    if "forecast" in data and len(data["forecast"]) > 0:
        forecast = data["forecast"]
        startInd = len(ts)
        forecastBundle = {
            "x": signalTimeSteps[startInd - 1:],
            "y": [ts[startInd - 1]] + forecast
        }
        resultBundle["forecastBundle"] = forecastBundle
        yMin = min(yMin, min(forecast))
        yMax = max(yMax, max(forecast))
        yMinLine = yMin
        yMaxLine = yMax

    # confidence interval of forecasted data
    if "conf_int" in data and len(data["conf_int"]) > 0:
        conf_int = data["conf_int"]
        startInd = len(ts)
        confidBundle = {
            "x": signalTimeSteps[startInd - 1:],
            "bottom": [ts[startInd - 1]] + [ele[0] for ele in conf_int],
            "ceiling": [ts[startInd - 1]] + [ele[1] for ele in conf_int]
        }
        dataRange = [min(confidBundle["bottom"]), max(confidBundle["ceiling"])]
        # yMin = min(yMin, dataRange[0])
        # yMax = max(yMax, dataRange[1])
        yMinLine = min(yMinLine, dataRange[0])
        yMaxLine = max(yMaxLine, dataRange[1])
        resultBundle["confidBundle"] = confidBundle

    # mean of cluster that this signal belongs to
    if "g_mean" in data and len(data["g_mean"]) > 0:
        g_mean = data["g_mean"]
        bundle_g_mean = {
            "x": signalTimeSteps[0: len(g_mean)],
            "y": g_mean
        }
        resultBundle["meanBundle"] = bundle_g_mean
        yMin = min(yMin, min(g_mean))
        yMax = max(yMax, max(g_mean))
        yMinLine = min(yMinLine, min(g_mean))
        yMaxLine = max(yMaxLine, max(g_mean))

    # medoid of cluster that this signal belongs to
    if "g_medoid" in data and len(data["g_medoid"]) > 0:
        g_medoid = data["g_medoid"]
        bundle_g_medoid = {
            "x": signalTimeSteps[0: len(g_medoid)],
            "y": g_medoid
        }
        resultBundle["medoidBundle"] = bundle_g_medoid
        yMin = min(yMin, min(g_medoid))
        yMax = max(yMax, max(g_medoid))
        yMinLine = min(yMinLine, min(g_medoid))
        yMaxLine = max(yMaxLine, max(g_medoid))

    # fitted line of the raw value and OUTLIERS
    if "fit" in data and len(data["fit"]) > 0:
        fit = data["fit"]
        time_offset = len(ts) - len(fit)

        bundle_fit = {
            "x": signalTimeSteps[time_offset: len(ts)],
            "y": fit
        }
        bundle_outliers_pos = {
            "x": [],
            "y": []
        }
        bundle_outliers_neg = {
            "x": [],
            "y": []
        }
        for i in range(len(fit)):
            real_timeStep = i + time_offset
            if real_timeStep in outliers:
                if ts[real_timeStep] > fit[i]:
                    bundle_outliers_pos["x"].append(signalTimeSteps[real_timeStep])
                    bundle_outliers_pos["y"].append(ts[real_timeStep])
                else:
                    bundle_outliers_neg["x"].append(signalTimeSteps[real_timeStep])
                    bundle_outliers_neg["y"].append(ts[real_timeStep])
        resultBundle["fitBundle"] = bundle_fit
        if len(bundle_outliers_pos["x"]):
            resultBundle["outliersBundlePos"] = bundle_outliers_pos
        if len(bundle_outliers_neg["x"]):
            resultBundle["outliersBundleNeg"] = bundle_outliers_neg

        dataRange = [min(fit), max(fit)]
        yMin = min(yMin, dataRange[0])
        yMax = max(yMax, dataRange[1])
        yMinLine = min(yMinLine, dataRange[0])
        yMaxLine = max(yMaxLine, dataRange[1])

    #### process the compare candidate components ####
    if "CC" in data and len(data["CC"]) > 0:
        CC = data["CC"]
        cds = []
        for candidate in CC:
            CB = {}
            isBest = candidate["best"]
            CB["best"] = isBest
            forecastStartInd = len(ts)
            # add additional forecast values
            fB = {
                "x": signalTimeSteps[forecastStartInd - 1: forecastStartInd + len(candidate["forecast"])],
                "y": [ts[forecastStartInd - 1]] + candidate["forecast"]
            }
            CB["forecast"] = fB
            if len(candidate["forecast"]):
                dataRange = [min(candidate["forecast"]), max(candidate["forecast"])]
                yMin = min(yMin, dataRange[0])
                yMax = max(yMax, dataRange[1])
                yMinLine = min(yMinLine, dataRange[0])
                yMaxLine = max(yMaxLine, dataRange[1])

            # add additional fit values
            if isBest:
                time_offset = len(ts) - len(candidate["fit"])
                fitB = {
                    "x": signalTimeSteps[time_offset: time_offset + len(candidate["fit"])],
                    "y": candidate["fit"]
                }
                CB["fit"] = fitB
                if len(candidate["fit"]):
                    dataRange = [min(candidate["fit"]), max(candidate["fit"])]
                    yMin = min(yMin, dataRange[0])
                    yMax = max(yMax, dataRange[1])
                    yMinLine = min(yMinLine, dataRange[0])
                    yMaxLine = max(yMaxLine, dataRange[1])

            # add additional confidence interval values
            if isBest and "conf_int" in candidate and len(candidate["conf_int"]):
                l_conf = len(candidate["conf_int"])
                cB = {
                    "x": signalTimeSteps[forecastStartInd - 1 : forecastStartInd + l_conf],
                    "bottom": [ts[forecastStartInd - 1]] + [ele[0] for ele in candidate["conf_int"]],
                    "ceiling": [ts[forecastStartInd - 1]] + [ele[1] for ele in candidate["conf_int"]]
                }

                CB["conf_int"] = cB
                dataRange = [min(cB["bottom"]), max(cB["ceiling"])]
                yMinLine = min(yMinLine, dataRange[0])
                yMaxLine = max(yMaxLine, dataRange[1])
            CB["season"] = candidate["season"]
            CB["method"] = candidate["method"]
            if "alias" in candidate:
                CB["methodAlias"] = candidate["alias"]
                if candidate["method"].find(";") > 0:
                    CB["methodNote"] = candidate["alias"] + ":" + candidate["method"][candidate["method"].find(";"):]
                else:
                    CB["methodNote"] = candidate["method"]
            else:
                CB["methodAlias"] = candidate["method"]
            cds.append(CB)
        resultBundle["forecastCandidates"] = cds

    if yMin == yMax:
        yMin -= 1
        yMax += 1
    if yMinLine == yMaxLine:
        yMinLine -= 1
        yMaxLine += 1
    resultBundle["axY"] = [yMin, yMax]
    resultBundle["axYLine"] = [yMinLine, yMaxLine]
    ext = (yMaxLine - yMinLine) * 0.1
    resultBundle["axYLineOpt"] = [yMinLine - ext, yMaxLine + ext]
    return resultBundle


def render_tsc(_data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """
    This method is used for rendering Time Series Clustering Charts
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
    colorLine = classColors[0]
    if "cid" in _data:
        colorLine = classColors[(_data["cid"] - 1) % len(classColors)]

    l_x = data["dataBundle"]["x"]
    l_y = data["dataBundle"]["y"]
    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)
    ax.set_ylabel(_data["vn"])
    PLT.ioff()
    ax.plot(l_x, l_y, linewidth=1.5, marker=".", c=colorLine, label=_data["labels"]["original"])
    # ax.plot_date(l_x, l_y, fmt=colorLine, linewidth=1.5, marker=".", label=_data["labels"]["original"])

    if "meanBundle" in data:
        l_xm = data["meanBundle"]["x"]
        l_ym = data["meanBundle"]["y"]
        ax.plot(l_xm, l_ym, linestyle="dashed", linewidth=1, c=colorLine, label=_data["labels"]["average"])

    # PLT.xlim(l_x[0], l_x[-1])
    # PLT.ylim(data["axYLine"][0], data["axYLine"][1])
    # if "unit" in _data and "allTimeStepsSameDay" in data:
    #     fmt, rot = __getDateFormatter(_data["unit"], data["allTimeStepsSameDay"])
    #     ax.xaxis.set_major_formatter(mdates.DateFormatter(fmt))
        # if rot:
        # PLT.xticks(rotation = 45)
        # PLT.gca().set_xticklabels(ax.get_xticks(), rotation=45)

    if tightenDateLabel:
        ax.xaxis.set_tick_params(rotation=20, labelsize=9)
        PLT.legend(loc='best', ncol=2)
    else:
        PLT.legend(loc='upper center', bbox_to_anchor=(0.5, -0.1), ncol=2)

    t2 = time.time()

    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2


def render_forecasting(_data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """
    This method is used for rendering the Time Series Forecasting related charts
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
    colorLine = "#1976d2"
    lineWidth = 1.2

    l_x = data["dataBundle"]["x"]
    l_y = data["dataBundle"]["y"]
    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)
    lenLimit = int(imgHeight * 7)
    ax.set_ylabel(
        _data["vn"] if len(_data["vn"]) < lenLimit else textwrap.fill(_data["vn"], lenLimit, break_on_hyphens=True))
    PLT.ioff()
    PLT.plot(l_x, l_y, linewidth=lineWidth, marker=".", c=colorLine, label=_data["labels"]["original"])
    rg_x = [data["dataBundle"]["x"][0], data["dataBundle"]["x"][-1]]
    rg_y = data["axYLineOpt"]

    fitColor = compareColors[0]
    numCol = 1

    if "fitBundle" in data:
        l_xf = data["fitBundle"]["x"]
        l_yf = data["fitBundle"]["y"]
        PLT.plot(l_xf, l_yf, linestyle="dotted", linewidth=lineWidth, marker=".", c=fitColor, label=_data["labels"]["fit"])
        numCol += 1
    if "confidBundle" in data:
        l_xc = data["confidBundle"]["x"]
        l_ycU = data["confidBundle"]["ceiling"]
        l_ycB = data["confidBundle"]["bottom"]
        PLT.fill_between(l_xc, l_ycB, l_ycU, color=fitColor, alpha=0.2, edgecolor=None, label=_data["labels"]["conf_int"])
        numCol += 1
    if "forecastBundle" in data:
        l_xf = data["forecastBundle"]["x"]
        l_yf = data["forecastBundle"]["y"]
        rg_x[1] = l_xf[-1]
        PLT.plot(l_xf, l_yf, linewidth=lineWidth, marker=".", c=fitColor, label=_data["labels"]["forecasted"])
        # forecast indicator
        l_xv = [data["rawTime_last"], data["rawTime_last"]]
        l_yv = [data["axYLineOpt"][0], data["axYLineOpt"][1]]
        PLT.plot(l_xv, l_yv, linestyle="dashed", linewidth=0.8, c=fontColor_global)
        numCol += 1

    if "forecastCandidates" in data:
        for ind, candidate in enumerate(data["forecastCandidates"]):
            cand_color = compareColors[ind]
            if "fit" in candidate:
                l_xf = candidate["fit"]["x"]
                l_yf = candidate["fit"]["y"]
                PLT.plot(l_xf, l_yf, linestyle="dotted", linewidth=lineWidth, marker=".", c=cand_color,
                         label=f"{candidate['methodAlias']}-{_data['labels']['fit']}")
                numCol += 1
            if "conf_int" in candidate:
                l_xc = candidate["conf_int"]["x"]
                l_ycU = candidate["conf_int"]["ceiling"]
                l_ycB = candidate["conf_int"]["bottom"]
                PLT.fill_between(l_xc, l_ycB, l_ycU, color=cand_color, alpha=0.2,
                                 edgecolor=None, label=_data["labels"]["conf_int"])
                numCol += 1

            if "forecast" in candidate:
                l_xf = candidate["forecast"]["x"]
                l_yf = candidate["forecast"]["y"]
                rg_x[1] = l_xf[-1]
                lw = lineWidth if candidate["best"] else 0.8
                cap = "*" if candidate["best"] else ""
                if candidate["best"]:
                    PLT.plot(l_xf, l_yf, linewidth=lw, marker=".", c=cand_color, label=cap+candidate['methodAlias'])
                else:
                    PLT.plot(l_xf, l_yf, linewidth=lw, c=cand_color, label=cap+candidate['methodAlias'])

                #### Print vertal line here ####
                l_xv = [data["rawTime_last"], data["rawTime_last"]]
                l_yv = [data["axYLineOpt"][0], data["axYLineOpt"][1]]
                PLT.plot(l_xv, l_yv, linestyle="dashed", linewidth=0.8, c=fontColor_global)
                numCol += 1

    outlierSize = 30
    if "outliersBundlePos" in data:
        PLT.scatter(data["outliersBundlePos"]["x"], data["outliersBundlePos"]["y"],
                    s=outlierSize, color=c_outliers[0],
                    label=_data["labels"]["otl_pos"] if "otl_pos" in _data["labels"] else arcpy.GetIDMessage(220092),
                    zorder=10)
        numCol += 1

    if "outliersBundleNeg" in data:
        PLT.scatter(data["outliersBundleNeg"]["x"], data["outliersBundleNeg"]["y"],
                    s=outlierSize, color=c_outliers[1],
                    label=_data["labels"]["otl_neg"] if "otl_neg" in _data["labels"] else arcpy.GetIDMessage(220093),
                    zorder=10)
        numCol += 1

    F_M = f"{arcpy.GetIDMessage(84978)}: {_data['F_M']}"  # forecast method
    text_pos_x = rg_x[0]
    text_pos_y = rg_y[1] + (rg_y[1] - rg_y[0]) * 0.1
    font = {'family': 'Verdana',
            'color': fontColor_global,
            'weight': 'bold',
            'size': 10,
            }
    lenLimit = int(imgWidth * 9)
    F_M = F_M if len(F_M) < lenLimit else textwrap.fill(F_M, lenLimit, break_on_hyphens=True)

    # test whether we need to show the confidence intervals
    if (data["axYLineOpt"][1] - data["axYLineOpt"][0]) / (data["axY"][1] - data["axY"][0]) > 2:
        ext = (data["axY"][1] - data["axY"][0]) * 0.1
        lim = (data["axY"][0] - ext, data["axY"][1] + ext)
        text_pos_y = lim[1] + ext
        PLT.ylim(lim[0], lim[1])

    else:
        # PLT.ylim(data["axYLineOpt"][0], data["axYLineOpt"][1])
        pass
    PLT.text(text_pos_x, text_pos_y, F_M, fontdict=font)

    if tightenDateLabel:
        ax.xaxis.set_tick_params(rotation=20, labelsize=9)
        PLT.legend(loc='best', ncol=3)
    else:
        PLT.legend(loc='upper center', bbox_to_anchor=(0.5, -0.1), ncol=3)

    PLT.tight_layout()
    t2 = time.time()

    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2



