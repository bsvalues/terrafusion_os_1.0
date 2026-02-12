"""
Convertors for Local Bi-variant Relationship tool
"""

import matplotlib

import arcpy

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


def extendRange(range, ratio):
    if range[0] >= range[1]:
        return None
    delta = (range[1] - range[0]) * ratio
    return [range[0]-delta, range[1]+delta]


def generatePloyLine(coefficients, xRange, extendRatio):
    if coefficients[0] is None:
        return None, None
    if not extendRatio:
        extendRatio = 0
    bounds = extendRange(xRange, extendRatio)
    interval = (bounds[1] - bounds[0]) / 100
    xValues = []
    yValues = []
    for step in NUM.arange(bounds[0], bounds[1], interval):
        y = coefficients[0] + coefficients[1]*step + coefficients[2]*step*step
        xValues.append(step)
        yValues.append(y)
    return NUM.array(xValues), NUM.array(yValues)


def render_lbr(data, outputPath, imgWidth, imgHeight, tightenDateLabel=False):

    t1 = time.time()
    p_x = (NUM.array([ele[0] for ele in data["XY"]]) - data["gr"][0][0]) / (data["gr"][0][1] - data["gr"][0][0])
    p_y = (NUM.array([ele[1] for ele in data["XY"]]) - data["gr"][1][0]) / (data["gr"][1][1] - data["gr"][1][0])
    rg_x = [p_x.min(), p_x.max()]
    rg_y = [p_y.min(), p_y.max()]
    if rg_x[0] == rg_x[1]:
        rg_x = [rg_x[0] - 0.5, rg_x[1] + 0.5]
    if rg_y[0] == rg_y[1]:
        rg_y = [rg_y[0] - 0.5, rg_y[1] + 0.5]
    l_x, l_y = generatePloyLine(data["coef"], rg_x, 0.1)

    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)

    PLT.ioff()
    PLT.scatter(p_x, p_y, s=30, facecolors='none', edgecolors=colorGrey)
    PLT.scatter(p_x[:1], p_y[:1], s=40, color=colorHighlight)
    if l_x is not None:
        PLT.plot(l_x, l_y, c=lineColorMap[data["rel"]])

    xlim = extendRange(rg_x, 0.05)
    ylim = extendRange(rg_y, 0.05)
    PLT.xlim(xlim[0], xlim[1])
    PLT.ylim(ylim[0], ylim[1])

    ax.set_xlabel(data["axs"][0])
    ax.set_ylabel(data["axs"][1])

    font = {'family': 'Verdana',
            'color': lineColorMap[data["rel"]],
            'weight': 'bold',
            'size': 10,
            }
    text_pos_x = rg_x[1] - (rg_x[1] - rg_x[0]) / 7
    text_pos_y = rg_y[1]
    text = data["labels"][1]
    aicc = data["aicc"]
    if aicc is None and data["coef"][0] is not None:
        aicc = "-infinity"
    if "r2" in data:
        text += f"\n{data['labels'][2]}: {str(data['r2'])}"
        text += f"\n{data['labels'][3]}: {str(aicc)}"
    PLT.text(text_pos_x, text_pos_y, text, fontdict=font)

    if tightenDateLabel:
        ax.xaxis.set_tick_params(rotation=20, labelsize=9)

    t2 = time.time()
    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2
