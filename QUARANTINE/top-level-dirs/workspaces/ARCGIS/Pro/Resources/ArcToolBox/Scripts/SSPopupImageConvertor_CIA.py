"""
Convertors for Casual Inference Analysis tool
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as PLT
from matplotlib.path import Path
from mpl_toolkits.axisartist.axislines import Axes
from mpl_toolkits.axisartist.axislines import Subplot
import numpy as NUM
import json as JSON
import time
from enum import Enum
from datetime import datetime, timedelta
import textwrap
import arcpy as ARCPY

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

colorLine = "#CC0099"
c_color = '#ffcc80'
colorHighlight = "#18ffff"
c_outliers = ["#762a83", "#1b7837", "#848484"]
colorLineOrange = "#ff9800"

def extendRange(range, ratio):
    if range[0] >= range[1]:
        return None
    delta = (range[1] - range[0]) * ratio
    return [range[0]-delta, range[1]+delta]


def render_cia(data, globalData, outputPath, imgWidth, imgHeight, tightenDateLabel=False):
    """

    Parameters
    ----------
    data
    globalData
    outputPath
    imgWidth
    imgHeight
    tightenDateLabel

    Returns
    -------

    """


    t1 = time.time()
    # get the point data
    p_x = NUM.array(globalData[0])
    p_y = NUM.array(globalData[1])
    p_w = NUM.array(globalData[2])

    # get the erf data
    erf_x = NUM.array(globalData[3])
    erf_y = NUM.array(globalData[4])
    PLT.rcParams['font.family'] = ['Segoe UI', 'serif', 'sans-serif', 'Microsoft YaHei']

    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)

    PLT.ioff()
    range_w = globalData[6]
    area = NUM.array(globalData[5])
    area_focal = 80 + 800 * (data["w"] - range_w[0]) / (
            range_w[1] - range_w[0])
    group_solid = NUM.where(p_w != 0)[0]
    group_hollow = NUM.where(p_w == 0)[0]
    diff_y = data["y"] - data["y_on_erf"]
    if len(group_hollow):
        PLT.scatter(p_x[group_hollow], p_y[group_hollow], s=4,
                    c="#9e9e9e")
        # plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=60,
        #             facecolors="none", edgecolors=(0, 0, 1, 0.3))
    PLT.scatter(p_x[group_solid], p_y[group_solid], s=area[group_solid],
                facecolors="#2493F2", edgecolors="#2493F2", alpha=0.4, zorder=1, label=None)
    # build the fake series only for legend
    PLT.scatter([], [], s=20,
                facecolors="#2493F2", edgecolors="#2493F2", alpha=0.4, zorder=1, label=ARCPY.GetIDMessage(220348))
    # global ERF
    PLT.plot(erf_x, erf_y, c=colorLine, alpha=0.9,
             linewidth=2, zorder=10, label=ARCPY.GetIDMessage(220747))  # Exposure-Response Function (ERF)  label=ARCPY.GetIDMessage(220747),
    # local ERF
    PLT.plot(erf_x, erf_y + diff_y, c=colorLineOrange, alpha=0.9, linestyle='--',
             linewidth=1.5, zorder=10, label=ARCPY.GetIDMessage(220654).replace("{{{0}}}", "{0}").format(data["id"]))  # Exposure-Response Function (ERF)
    PLT.scatter(data["x"], data["y"], s=area_focal,
                facecolors="#bf360c", edgecolors=colorLineOrange, alpha=0.9, zorder=8)
    xlim = extendRange(globalData[7], 0.05)
    ys = globalData[8] + globalData[9] + \
         [globalData[9][0] + diff_y, globalData[9][1] + diff_y]
    ylim = extendRange([min(ys), max(ys)], 0.05)

    tar_outcome_y = []
    tar_expo_x = []
    if "tar_outcome" in data:
        for ele in data["tar_outcome"]:
            tar_outcome_y.append(ele[0])
    if "tar_exposure" in data:
        for ele in data["tar_exposure"]:
            tar_expo_x.append(ele[0])
    verts2r = [
        (1., 5.),
        (9., 0.),
        (1., -5.),
        (1., 5.),
    ]
    codes = [
        Path.MOVETO,
        Path.LINETO,
        Path.LINETO,
        Path.CLOSEPOLY,
    ]
    path2r = Path(verts2r, codes)
    path2r_legd = Path([(ele[0] - 6, ele[1]) for ele in verts2r], codes)

    verts2t = [
        (-5., 1.),
        (0., 9.),
        (5., 1.),
        (-5., 1.),
    ]
    path2t = Path(verts2t, codes)

    path2t_legd = Path([(ele[0], ele[1] - 6) for ele in verts2t], codes)

    if len(tar_outcome_y) > 0:
        PLT.plot([xlim[0]] * len(tar_outcome_y), tar_outcome_y, 'o', marker=path2r, markersize=20, c=colorLineOrange,
                 alpha=0.9, zorder=8, label=None)
        # build the fake series only for legend
        PLT.plot([], [], 'o', marker=path2r_legd, markersize=8, c=colorLineOrange,
                 alpha=0.9, zorder=8,
                 label=ARCPY.GetIDMessage(220765).format(globalData[10][1]).replace(":", "").replace("：", ""))

    if len(tar_expo_x) > 0:
        PLT.plot(tar_expo_x, [ylim[0]] * len(tar_expo_x), 'o', marker=path2t, markersize=20, c=colorLineOrange,
                 alpha=0.9, zorder=8, label=None)

        # build the fake series only for legend
        PLT.plot([], [], 'o', marker=path2t_legd, markersize=8, c=colorLineOrange,
                 alpha=0.9, zorder=8,
                 label=ARCPY.GetIDMessage(220770).format(globalData[10][0]).replace(":", "").replace("：", ""))

    PLT.xlim(xlim[0], xlim[1])
    PLT.ylim(ylim[0], ylim[1])
    #
    ax.set_xlabel(globalData[10][0])
    ax.set_ylabel(globalData[10][1])

    if tightenDateLabel:
        ax.xaxis.set_tick_params(rotation=20, labelsize=9)

    PLT.legend(loc='lower center', bbox_to_anchor=(0.5, -0.45))

    t2 = time.time()
    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2


def render_cia_old(data, globalData, outputPath, imgWidth, imgHeight, tightenDateLabel=False):

    t1 = time.time()
    # get the point data
    p_x = globalData["x"]
    p_y = globalData["y"]
    p_w = globalData["w"]

    # get the erf data
    erf_x = globalData["erf_x"]
    erf_y = globalData["erf_y"]
    PLT.rcParams['font.family'] = ['Segoe UI', 'serif', 'sans-serif', 'Microsoft YaHei']

    fig, ax = PLT.subplots(figsize=(imgWidth, imgHeight))
    ax.spines[['right', 'top']].set_visible(False)

    PLT.ioff()
    range_w = globalData["range_w"]
    area = globalData["area"]
    area_focal = 80 + 800 * (data["w"] - range_w[0]) / (
            range_w[1] - range_w[0])
    group_solid = NUM.where(p_w != 0)[0]
    group_hollow = NUM.where(p_w == 0)[0]
    diff_y = data["y"] - data["y_on_erf"]
    if len(group_hollow):
        PLT.scatter(p_x[group_hollow], p_y[group_hollow], s=4,
                    c="#9e9e9e")
        # plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=60,
        #             facecolors="none", edgecolors=(0, 0, 1, 0.3))
    PLT.scatter(p_x[group_solid], p_y[group_solid], s=area[group_solid],
                facecolors="#2493F2", edgecolors="#2493F2", alpha=0.4, zorder=1)
    # global ERF
    PLT.plot(erf_x, erf_y, c=colorLine, alpha=0.9,
             linewidth=2, zorder=10)  # Exposure-Response Function (ERF)  label=ARCPY.GetIDMessage(220747),
    # local ERF
    PLT.plot(erf_x, erf_y + diff_y, c=colorLineOrange, alpha=0.9, linestyle='--',
             linewidth=1.5, zorder=10)  # Exposure-Response Function (ERF)
    PLT.scatter(data["x"], data["y"], s=area_focal,
                facecolors="#bf360c", edgecolors=colorLineOrange, alpha=0.9, zorder=8)
    xlim = extendRange(globalData["range_x"], 0.05)
    ys = globalData["range_y"] + globalData["range_erf_y"] + \
         [globalData["range_erf_y"][0] + diff_y, globalData["range_erf_y"][1] + diff_y]
    ylim = extendRange([min(ys), max(ys)], 0.05)

    tar_outcome_y = []
    tar_expo_x = []
    if "tar_outcome" in data:
        for ele in data["tar_outcome"]:
            tar_outcome_y.append(ele[0])
    if "tar_exposure" in data:
        for ele in data["tar_exposure"]:
            tar_expo_x.append(ele[0])
    verts2r = [
        (1., 5.),
        (9., 0.),
        (1., -5.),
        (1., 5.),
    ]
    codes = [
        Path.MOVETO,
        Path.LINETO,
        Path.LINETO,
        Path.CLOSEPOLY,
    ]
    path2r = Path(verts2r, codes)

    verts2t = [
        (-5., 1.),
        (0., 9.),
        (5., 1.),
        (-5., 1.),
    ]
    path2t = Path(verts2t, codes)

    if len(tar_outcome_y) > 0:
        PLT.plot([xlim[0]] * len(tar_outcome_y), tar_outcome_y, 'o', marker=path2r, markersize=20, c=colorLineOrange,
                 alpha=0.9, zorder=8)

    if len(tar_expo_x) > 0:
        # PLT.scatter(tar_expo_x, [ylim[0]] * len(tar_expo_x), s=80, facecolors="red", edgecolors="#ffcc80", alpha=0.9, zorder=8)
        PLT.plot(tar_expo_x, [ylim[0]] * len(tar_expo_x), 'o', marker=path2t, markersize=20, c=colorLineOrange,
                 alpha=0.9, zorder=8)

    PLT.xlim(xlim[0], xlim[1])
    PLT.ylim(ylim[0], ylim[1])
    #
    ax.set_xlabel(globalData["alias"][0])
    ax.set_ylabel(globalData["alias"][1])

    t2 = time.time()
    PLT.savefig(outputPath, bbox_inches='tight')
    PLT.close(fig)
    t3 = time.time()
    return t2 - t1, t3 - t2
