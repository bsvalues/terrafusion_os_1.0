"""
Convertors for Time Series Cross Correlation tool
"""
import math

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
import arcpy as ARCPY
import numbers as NUMBERS
from SSPopupImageConvertor_TSA import ext_calSignalTimeSteps as __calSignalTimeSteps

fontColor_global = "#848484"
colorLine = "#E66100"
colorLine2 = "#5D3A9B"
dt_template = "%Y/%m/%d %H:%M:%S"

colorCategories = [
        [-0.9, 21.06, 29.42, 67.79, 100],
        [-0.8, 26.47, 55.53, 82.91, 100],
        [-0.7, 28.1, 80.26, 98.6, 100],
        [-0.6, 22.48, 105.37, 112.98, 100],
        [-0.5, 18.49, 130.77, 123.5, 100],
        [-0.4, 56.71, 154.15, 129.22, 100],
        [-0.3, 109.94, 173.57, 138.93, 100],
        [-0.2, 157.39, 191.98, 159.38, 100],
        [-0.1, 199.37, 211.86, 189.28, 100],
        [0, 237.86, 234.5, 225.77, 100],
        [0.1, 246.94, 230.94, 223.82, 100],
        [0.2, 235.12, 197.65, 179.5, 100],
        [0.3, 226.11, 164.02, 140.28, 100],
        [0.4, 216.37, 130.05, 111.96, 100],
        [0.5, 201.4, 97.73, 98.87, 100],
        [0.6, 179.84, 69.23, 96.29, 100],
        [0.7, 153.15, 44.93, 96.89, 100],
        [0.8, 121.89, 26.81, 94.52, 100],
        [0.9, 86.72, 19.34, 80.31, 100],
        [1, 52.07, 13.12, 53.39, 100]
    ]


def __prepareData(data):
    """
    prepare the dataset for rendering
    :param data:
    :return:
    """

    #### Prepare correlations data ####
    lag = data["lag0"]
    includeLag0 = data["include0"]
    if "show_ci" not in data or not data["show_ci"]:
        show_ci = False
    else:
        show_ci = True
    absMaxY = -10
    BOUNDRY_SHIFT = 1.96 / math.sqrt(data["num_t"])
    corrs = []
    lags = []
    ci_low = []
    ci_high = []
    isAbsMax = []
    colors = []
    edge_colors = []

    for i, y in enumerate(data["corrs"]):
        if not includeLag0 and lag == 0:
            lag += 1
        lags.append(lag)
        if isinstance(y, NUMBERS.Number) and not math.isnan(y):
            if y > 1:
                y = 1
            if y < -1:
                y = -1
            if abs(y) > absMaxY:
                absMaxY = abs(y)
            corrs.append(y)
            stage = int((y + 0.9) * 10)
            if stage < 0:
                stage = 0
            elif stage > len(colorCategories) - 1:
                stage = len(colorCategories) - 1
            colors.append([colorCategories[stage][1]/255, colorCategories[stage][2]/255, colorCategories[stage][3]/255, 0.8])
            if y < 0:
                ed_ind = 0
            else:
                ed_ind = len(colorCategories) - 1
            edge_colors.append([colorCategories[ed_ind][1]/255, colorCategories[ed_ind][2]/255, colorCategories[ed_ind][3]/255, 0.6])

            if show_ci:
                ci_low.append(y - BOUNDRY_SHIFT if y - BOUNDRY_SHIFT > -1 else -1)
                ci_high.append(y + BOUNDRY_SHIFT if y + BOUNDRY_SHIFT < 1 else 1)
        else:
            corrs.append(NUM.nan)
            colors.append([0, 0, 0, 0])
            edge_colors.append([0, 0, 0, 0])
            if show_ci:
                ci_low.append(NUM.nan)
                ci_high.append(NUM.nan)
        lag += 1
    corrBundle = {
        "corrs": corrs,
        "lags": lags,
        "colors": colors,
    }
    if show_ci:
        corrBundle["ci_low"] = ci_low
        corrBundle["ci_high"] = ci_high
    for i in range(len(corrs)):
        if not corrs[i] is None and not NUM.isnan(corrs[i]) and abs(corrs[i]) == absMaxY:
            isAbsMax.append(1)
            edge_colors[i] = "#ffd500"
        else:
            isAbsMax.append(0)
    corrBundle["isAbsMax"] = isAbsMax
    corrBundle["edge_colors"] = edge_colors
    resultBundle = {
        "corrBundle": corrBundle,
    }

    #### Prepare time series data ####
    if "ts1" in data and data["ts1"] is not None:
        tsBundle = {
            "ts1": data["ts1"],
        }
        signalTimeSteps = __calSignalTimeSteps(data, T=len(data["ts1"]))
        tsBundle["x"] = signalTimeSteps
        if "ts2" in data and data["ts2"] is not None:
            tsBundle["ts2"] = data["ts2"]
        allTimeStepsSameDay = False
        d0 = signalTimeSteps[0]
        d1 = signalTimeSteps[-1]
        if d0.year == d1.year and d0.month == d1.month and d0.day == d1.day:
            allTimeStepsSameDay = True
        tsBundle["allTimeStepsSameDay"] = allTimeStepsSameDay
        resultBundle["tsBundle"] = tsBundle

    return resultBundle


def render_tscc(_data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """
    This method is used for rendering Time Series Cross Correlation Charts
    :param _data:
    :param outputPath:
    :param imgWidth:
    :param imgHeight:
    :return:
    """

    t1 = time.time()
    data = __prepareData(_data)

    if "tsBundle" in data:
        #### produce both correlation and time-series charts ####
        fig, ax = PLT.subplots(nrows=2, ncols=1, figsize=(imgWidth, imgHeight))
        ax_main = ax[0]
    else:
        #### produce only correlation chart ####
        fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
        ax_main = ax
        
    ax_main.spines[['right', 'top']].set_visible(False)
    ax_main.set_ylabel("Time Series Correlation")
    ax_main.set_xlabel("Time Lag")
    PLT.ioff()
    ax_main.grid(color='grey', linestyle='dashdot', linewidth=0.5)
    ax_main.set_ylim(-1.05, 1.05)
    ax_main.spines['bottom'].set_position(('data', 0))
    if "ci_low" in data["corrBundle"]:
        ax_main.fill_between(data["corrBundle"]["lags"],
                             data["corrBundle"]["ci_low"],
                             data["corrBundle"]["ci_high"], color="#78AAFF", alpha=0.2)
    ax_main.bar(data["corrBundle"]["lags"], data["corrBundle"]["corrs"],
              color=data["corrBundle"]["colors"], edgecolor=data["corrBundle"]["edge_colors"],
              linewidth=NUM.array(data["corrBundle"]["isAbsMax"]) * 0.5 + 1)


    if "tsBundle" in data:
        ax[1].set_ylabel(_data["labels"]["var1"], color=colorLine)
        ax[1].set_xlabel(_data["labels"]["date_time"])
        l_x = data["tsBundle"]["x"]
        l_y = data["tsBundle"]["ts1"]
        if len(l_x) > 150:
            marker = "."
        else:
            marker = "o"
        ax[1].tick_params(axis='y', labelcolor=colorLine)
        ax[1].plot(l_x, l_y, linewidth=1, marker=marker, c=colorLine, label=_data["labels"]["var1"])
        if "ts2" in data["tsBundle"]:
            ax2 = ax[1].twinx()
            l_y = data["tsBundle"]["ts2"]
            ax2.plot(l_x, l_y, linewidth=1, marker=marker, c=colorLine2, label=_data["labels"]["var2"])
            ax2.set_ylabel(_data["labels"]["var2"], color=colorLine2)
            ax2.tick_params(axis='y', labelcolor=colorLine2)
            ax[1].spines[['top']].set_visible(False)
            ax2.spines[['top']].set_visible(False)
        else:
            ax[1].spines[['right', 'top']].set_visible(False)

        tightenDateLabel = True
        if tightenDateLabel:
            ax[1].xaxis.set_tick_params(rotation=20, labelsize=9)
            if "ts2" in data["tsBundle"]:
                ax[1].legend(loc='lower left', bbox_to_anchor=(0.5, -0.3), ncol=1)
                ax2.legend(loc='lower right', bbox_to_anchor=(0.5, -0.3), ncol=1)
            else:
                ax[1].legend(loc='lower center', bbox_to_anchor=(0.5, -0.3), ncol=1)
        else:
            if "ts2" in data["tsBundle"]:
                ax[1].legend(loc='lower left', bbox_to_anchor=(0.5, -0.3), ncol=1)
                ax2.legend(loc='lower right', bbox_to_anchor=(0.5, -0.3), ncol=1)
            else:
                ax[1].legend(loc='lower center', bbox_to_anchor=(0.5, -0.3), ncol=1)
    t2 = time.time()

    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2