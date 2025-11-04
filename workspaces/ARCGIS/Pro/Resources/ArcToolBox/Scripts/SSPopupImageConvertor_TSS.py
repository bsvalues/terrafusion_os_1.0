"""
Convertors for Time Series Smoothing tool
"""

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


fontColor_global = "#848484"
colorLine = "#1976d2"
colorLineSmooth = "#F26745"
dt_template = "%Y-%m-%d %H:%M:%S"


def __calSignalTimeSteps(data):
    timeSteps = []
    t_start = datetime.strptime(data["t0"], dt_template)
    for ts in data["dt"]:
        timeSteps.append(t_start + timedelta(seconds=ts))

    return timeSteps


def __prepareData(data):
    """
    prepare the dataset for rendering
    :param data:
    :return:
    """
    dataBundle = {}
    smoothBundle = {}
    signalTimeSteps = __calSignalTimeSteps(data)
    dataBundle["x"] = signalTimeSteps
    dataBundle["y"] = data["vo"]

    allTimeStepsSameDay = False
    d0 = signalTimeSteps[0]
    d1 = signalTimeSteps[-1]
    if d0.year == d1.year and d0.month == d1.month and d0.day == d1.day:
        allTimeStepsSameDay = True

    smoothBundle["x"] = signalTimeSteps
    smoothBundle["y"] = data["vs"]

    dataRange = [min(data["vo"] + data["vs"]), max(data["vo"] + data["vs"])]
    resultBundle = {
        "dataBundle": dataBundle,
        "smoothBundle": smoothBundle,
        "range": dataRange,
        "allTimeStepsSameDay": allTimeStepsSameDay
    }
    return resultBundle


def render_tss(_data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """
    This method is used for rendering Time Series Smoothing Charts
    :param _data:
    :param outputPath:
    :param imgWidth:
    :param imgHeight:
    :return:
    """
    t1 = time.time()
    data = __prepareData(_data)

    linewidth = 1
    l_x = data["dataBundle"]["x"]
    l_y = data["dataBundle"]["y"]
    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)
    ax.set_ylabel(_data["vn"])
    PLT.ioff()
    PLT.plot(l_x, l_y, linewidth=linewidth, marker=".", c=colorLine, label=_data["labels"]["original"])

    if "smoothBundle" in data:
        l_xm = data["smoothBundle"]["x"]
        l_ym = data["smoothBundle"]["y"]
        PLT.plot(l_xm, l_ym, linewidth=linewidth, marker=".", c=colorLineSmooth, label=_data["labels"]["smoothed"])

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