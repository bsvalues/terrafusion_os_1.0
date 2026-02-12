import os as OS
import locale as LOCALE
import numpy as NUM
import arcpy as ARCPY
import arcpy.da as DA
import arcpy.management as DM
import SSUtilities as UTILS
import SSDataObject as SSDO
import SSTimeUtilities as STU
from datetime import datetime
import json as JSON

SUPPORT_METHODS = ["BACKWARD", "CENTERED", "FORWARD", "ADAPTIVE"]
HTML_template = """<html>
<head>
  <meta charset = "utf-8">
</head>
<body><div id='timeseries_@@cid'></div></body>
  <script>
    var data = @@data,
      rp = "file:///" + g_resourceFolder + "/";
    var st = document.createElement("script"); 
    st.type = "text/javascript";
    st.src = rp + "ArcToolbox/Scripts/Images/timeSeriesSmoothing.js";
    document.head.appendChild(st);
  </script>
</html>"""


def execute(parameters, messages):
    inputFC = UTILS.getInputAppendParameter(0, parameters)
    timeField = UTILS.getTextParameter(1, parameters)
    smoothField = UTILS.getTextParameter(2, parameters)
    groupBy = UTILS.getTextParameter(3, parameters)
    if groupBy == "ID_FIELD":
        groupIdField = UTILS.getTextParameter(8, parameters)
    else:
        groupIdField = None
    smoothingMethod = UTILS.getTextParameter(4, parameters)
    if smoothingMethod not in ["BACKWARD", "CENTERED", "FORWARD", "ADAPTIVE"]:
        smoothingMethod = "BACKWARD"
    timeWindow = UTILS.getTextParameter(5, parameters)
    if parameters[6].value:
        output = None
    else:
        output = parameters[7].valueAsText
    processHeadTail = parameters[9].value
    createPopUps = parameters[10].value

    #### Apply exec new field type checker ####
    if output is not None:
        try:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, output, fields=[smoothField])
        except:
            pass

    ts = SSTSSmoothing(inputFC, timeField, smoothField, groupBy=groupBy, groupIdField=groupIdField, output=output,
                          smoothingMethod=smoothingMethod, timeWindow=timeWindow,
                          processHeadTail=processHeadTail, createPopups=createPopUps)
    charts = ts.createOutput()
    if charts is not None:
        parameters[7].charts = charts
    return


def postExecute(parameters):
    #### Update Pop-up titles ####
    if parameters[6].value:
        outputFC = None
    else:
        outputFC = parameters[7].valueAsText
    if outputFC is None:
        return
    UTILS.postExecuteUpdatePopupTitle(parameters, 7, 10)


def _newField(name, aliasName, type):
    f = ARCPY.Field()
    f.name = name
    f.aliasName = aliasName
    f.type = type
    return f


def buildOutputFCSchema(input, output, field_ana, field_time, group_by, field_group_by, method, timeWindow):
    resFields = []
    doAppd = False
    if not input or not ARCPY.Exists(input):
        return resFields
    if not output:
        doAppd = True
    if not field_ana or not field_time:
        return resFields
    if group_by == "ID_FIELD" and not field_group_by:
        return
    try:
        fieldNamesAll = []
        alias_ana = ""
        alias_time = ""
        alias_group_by = ""
        type_ana = None
        type_time = None
        type_group_by = None
        field_oid = None
        alias_oid = None
        for f in ARCPY.ListFields(input):
            fn = f.name.upper()
            fieldNamesAll.append(fn)
            if field_ana.upper() == fn:
                alias_ana = f.aliasName
                type_ana = f.type
            if field_time.upper() == fn:
                alias_time = f.aliasName
                type_time = f.type
            if field_group_by and field_group_by.upper() == fn:
                alias_group_by = f.aliasName
                type_group_by = f.type
            if f.type == "OID":
                field_oid = f.name
                alias_oid = f.aliasName
        appendFields = [field_ana, field_time]
        if field_group_by:
            appendFields.append(field_group_by)
        if field_oid:
            appendFields.append(field_oid)
        if field_oid:
            resFields.append(_newField(name=field_oid, aliasName=alias_oid, type="OID"))
        resFields.append(_newField(name=field_ana, aliasName=alias_ana, type=type_ana))
        resFields.append(_newField(name=field_time, aliasName=alias_time, type=type_time))
        if field_group_by:
            resFields.append(_newField(name=field_group_by, aliasName=alias_group_by, type=type_group_by))
        if doAppd:
            testFields = fieldNamesAll
        else:
            testFields = appendFields

        smthFN = field_ana.upper()[0: 5] + "_SMTH"
        ind = 0
        while smthFN in testFields:
            appd = "_SMTH" + str(ind)
            smthFN = field_ana.upper()[0: 10 - len(appd)] + appd
            ind += 1
        testFields.append(smthFN)
        if method == "BACKWARD":
            methodName = "Backward Smoothing"
        elif method == "CENTERED":
            methodName = "Centered Smoothing"
        elif method == "FORWARD":
            methodName = "Forward Smoothing"
        else:
            methodName = "Adaptive Smoothing"

        smthAlias = alias_ana + " " + methodName
        if timeWindow is not None:
            timeAppd = " ({})".format(timeWindow.lower())
        else:
            timeAppd = ""
        smthAlias += timeAppd

        neigh_field_name = field_ana.upper()[0: 6] + "_NBR"
        ind = 0
        while neigh_field_name in testFields:
            appd = "_NBR" + str(ind)
            neigh_field_name = field_ana.upper()[0: 10-len(appd)] + appd
            ind += 1
        testFields.append(neigh_field_name)
        neigh_field_alias = "Number of Temporal Neighbors"
        neigh_field_alias = alias_ana + " " + neigh_field_alias + timeAppd
        resFields.append(_newField(name=smthFN, aliasName=smthAlias, type="DOUBLE"))
        resFields.append(_newField(name=neigh_field_name, aliasName=neigh_field_alias, type="DOUBLE"))

        if group_by == "LOCATION":
            groupByFN = "LOCATIONID"
            ind = 1
            while groupByFN in testFields:
                groupByFN = groupByFN[0: 10 - len(str(ind))] + str(ind)
                ind += 1
            testFields.append(groupByFN)
            groupByAlias = "Location ID"
            resFields.append(_newField(name=groupByFN, aliasName=groupByAlias, type="INTEGER"))
        return resFields

    except:
        return []


class SSTSSmoothing:
    """
    Spatial Statistics Time Series Smoothing Class
    """
    def __init__(self, input, timeField, smoothField, groupBy="LOCATION", groupIdField=None, output=None,
                 smoothingMethod="BACKWARD", timeWindow=None, processHeadTail=False, createPopups=False):
        """
        Constructing function for SSTSSmoothing class
        Parameters
        ----------
        ssdo                : SSDataObject
                              the ssdo input feature class
        timeField           : str
                              field name for the time values
        smoothField         : str
                              the field names for smoothing
        groupIdField         : str
                              field name for the location ID, the field should be integer or string type
        smoothingMethod     : str or None
                              the smoothing method, should be one of ["BACKWARD", "CENTERED", "FORWARD", "ADAPTIVE"].
                              Default valus is "SIMPLE_MOVING_AVERAGE"
        timeWindow          : str
                              the time window used for smoothing. should be the combine of time span and time unit.
                              E.g., "1 weeks"
        """
        self.input = input
        self.timeField = timeField
        self.smoothField = smoothField
        self.groupBy = groupBy
        self.groupIdField = groupIdField
        self.alias_timeField = ""
        self.alias_smoothField = ""
        self.alias_smoothFieldRes = ""
        self.output = output
        self.smoothingMethod = smoothingMethod
        self.processHeadTail = processHeadTail
        self.createPopups = createPopups
        if self.smoothingMethod not in SUPPORT_METHODS:
            self.smoothingMethod = "BACKWARD"
        self.timeWindow = timeWindow
        if self.timeWindow is not None:
            self.timeWindow = self.timeWindow.upper()
        self._processData()
        self._conductSmoothing()

        return

    def _processData(self):
        """
        Do the validation and prepare the data for smoothing
        Returns
        -------
        """
        if self.output is None:
            #### Test if the input data is editable ####
            try:
                fieldNamesAll = set()
                for f in ARCPY.ListFields(self.input):
                    fieldNamesAll.add(f.name.upper())
                fn = "TID"
                id = 0
                while fn in fieldNamesAll:
                    fn = "TID" + str(id)
                    id += 1
                ARCPY.AddField_management(self.input, fn, "DOUBLE")
                ARCPY.DeleteField_management(self.input, [fn])
            except:
                ARCPY.AddIDMessage("ERROR", 381, self.input)
                raise SystemExit()

        desc = ARCPY.Describe(self.input)
        dataType = desc.dataType.upper()
        if self.groupBy not in ["LOCATION", "ID_FIELD", "NONE", None]:
            if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                self.groupBy = "LOCATION"
            else:
                self.groupBy = None

        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER'] and self.output is not None:
            desc = ARCPY.Describe(self.input)
            inputFC = desc.catalogPath
            if UTILS.isGDB(inputFC) or inputFC.lower().startswith("memory\\"):
                if not UTILS.isGDB(self.output) and not self.output.lower().startswith("memory\\"):
                    ARCPY.AddIDMessage("WARNING", 110402)

        self.ssdo = None
        self.field_timeField = None
        self.field_smoothField = None
        self.field_groupIdField = None
        self.popUpCollection = dict()
        if self.groupIdField is None:
            varNames = [self.timeField, self.smoothField]
        else:
            varNames = [self.groupIdField, self.timeField, self.smoothField]

        if desc.hasOID:
            if self.output:
                self.ssdo = SSDO.SSDataObject(self.input, templateFC=self.output, useChordal=False, ignoreDateHighPrecision=True)
            else:
                self.ssdo = SSDO.SSDataObject(self.input, useChordal=False, ignoreDateHighPrecision=True)

            #### Warn if high precision date
            warn = self.ssdo.warnNotUsingHighPrecisionDates([self.timeField])
            
            varNames = [v.upper() for v in varNames]
            #### Populate SSDO with Data ####
            try:
                self.ssdo.obtainData(self.ssdo.oidName, varNames, minNumObs=3, useNullinFields = [self.smoothField.upper()])
            except:
                ARCPY.AddIDMessage("ERROR", 381, self.input)
                raise SystemExit()
            self.numObs = self.ssdo.numObs  # collection of values for smoothing
            self.y = self.ssdo.fields[self.smoothField.upper()].returnDouble(replaceNullInts=True)
            self.t = NUM.array(self.ssdo.fields[self.timeField.upper()].data, dtype='datetime64[s]')
            self.field_smoothField = self.ssdo.fields[self.smoothField.upper()]
            self.field_timeField = self.ssdo.fields[self.timeField.upper()]
            self.alias_smoothField = self.field_smoothField.alias
            self.alias_timeField = self.field_timeField.alias
            if self.groupIdField is not None:
                self.groupByIds = self.ssdo.fields[self.groupIdField.upper()].data
                self.field_groupIdField = self.ssdo.fields[self.groupIdField.upper()]
            else:
                if self.groupBy == "LOCATION":
                    try:
                        uniqueCoords, uniqueIds = NUM.unique(self.ssdo.xyCoords, return_inverse=True, axis=0)
                        self.groupByIds = uniqueIds
                    except:
                        raise SystemExit()
                else:
                    self.groupByIds = NUM.zeros(self.numObs, dtype=int)
            order2Master = self.ssdo.order2Master
        else:
            # reading a csv table
            try:
                self.numObs = UTILS.getCount(self.input)  # collection of values for smoothing
                rows = DA.SearchCursor(self.input, varNames)
                self.y = NUM.zeros(self.numObs, dtype=float)
                self.t = NUM.zeros(self.numObs, dtype='datetime64[s]')
                self.groupByIds = NUM.zeros(self.numObs, dtype=int)
                ind = 0
                if self.groupIdField is not None:
                    for row in rows:
                        dt = NUM.datetime64(row[1])
                        if dt is not None:
                            self.groupByIds[ind] = row[0]
                            self.t[ind] = dt
                            self.y[ind] = row[2]
                            ind += 1
                else:
                    for row in rows:
                        dt = NUM.datetime64(row[0])
                        if dt is not None:
                            self.t[ind] = NUM.datetime64(row[0])
                            self.y[ind] = row[1]
                            ind += 1
                del rows
                if ind < self.numObs:
                    self.numObs = ind
                    self.y = self.y[0: ind]
                    self.t = self.t[0: ind]
                    self.groupByIds = self.groupByIds[0: ind]

                fields = ARCPY.ListFields(self.input)
                for f in fields:
                    name = f.name.upper()
                    if name == self.timeField.upper():
                        self.field_timeField = f
                    if name == self.smoothField.upper():
                        self.field_smoothField = f
                    if self.groupIdField is not None and name == self.groupIdField.upper():
                        self.field_groupIdField = f
                self.alias_smoothField = self.field_smoothField.aliasName
                self.alias_timeField = self.field_timeField.aliasName
                order2Master = NUM.arange(self.numObs)
            except:
                raise SystemExit()

        ARCPY.ResetProgressor()
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84007))
        self.hasNonVal = NUM.isnan(self.y).any()

        if self.timeWindow is None and self.smoothingMethod in ["BACKWARD", "CENTERED", "FORWARD"]:
            ARCPY.AddError("time window is required for the method {}.".format(self.smoothingMethod))
            raise SystemExit()

        #### Sort the process sequence twice. ####
        #### Then the list, the elements will be grouped by master ids. ####
        #### And in each group, the elements will be ordered by time. ####
        arg_t = NUM.argsort(self.t, kind='stable')
        arg_l = NUM.argsort(self.groupByIds[arg_t], kind='stable')
        self.procSeq = arg_t[arg_l]

        unique, counts = NUM.unique(self.groupByIds, return_counts=True)
        self.loc_TimeCount = dict(zip(unique, counts))
        self.loc_StartInd = dict()

        for ind, e in enumerate(self.procSeq):
            if self.groupByIds[e] not in self.loc_StartInd:
                self.loc_StartInd[self.groupByIds[e]] = ind

        self.uniqueTimeSeriesNum = len(self.loc_StartInd)

        dup_ts_oid = []
        for masterId, count in self.loc_TimeCount.items():
            startInd = self.loc_StartInd[masterId]
            for ti in range(startInd, startInd + count - 1):
                if self.t[self.procSeq[ti]] == self.t[self.procSeq[ti + 1]]:
                    dup_ts_oid.append(order2Master[self.procSeq[ti]])
                    break
        if len(dup_ts_oid) > 0:
            ARCPY.AddIDMessage("ERROR", 110398, len(dup_ts_oid), ", ".join(map(str, dup_ts_oid)))
            raise SystemExit()

        self.timeDelta = None
        self.isRegularTimeDelta = True
        if self.timeWindow is not None:
            val, unit = UTILS.linearUnitSplit(self.timeWindow)
            val = int(UTILS.strToFloat(val))
            if self.smoothingMethod in ["CENTERED", "ADAPTIVE"]:
                val /= 2.0
                val = int(val)
            if unit == "SECONDS":
                self.timeDelta = val * 1.0
            elif unit == "MINUTES":
                self.timeDelta = val * 60.0
            elif unit == "HOURS":
                self.timeDelta = val * 3600.0
            elif unit == "DAYS":
                self.timeDelta = val * 3600 * 24.0
            elif unit == "WEEKS":
                self.timeDelta = val * 3600 * 24 * 7.0
            elif unit == "MONTHS":
                self.isRegularTimeDelta = False
                self.timeDelta = (val, 0)
            else:  # YEARS
                self.isRegularTimeDelta = False
                self.timeDelta = (0, val)

        return

    def _conductSmoothing(self):
        tdBefore = None
        tdAfter = None
        badLocations = []
        isSupSmooth = False

        if self.smoothingMethod in ["BACKWARD", "CENTERED", "FORWARD"]:
            if self.isRegularTimeDelta:
                if self.smoothingMethod == "BACKWARD":
                    tdBefore = self.timeDelta
                    tdAfter = 0
                elif self.smoothingMethod == "CENTERED":
                    tdBefore = self.timeDelta
                    tdAfter = self.timeDelta
                else:
                    tdBefore = 0
                    tdAfter = self.timeDelta
            else:
                if self.smoothingMethod == "BACKWARD":
                    tdBefore = self.timeDelta
                    tdAfter = (0, 0)
                elif self.smoothingMethod == "CENTERED":
                    tdBefore = self.timeDelta
                    tdAfter = self.timeDelta
                else:
                    tdBefore = (0, 0)
                    tdAfter = self.timeDelta

        else:
            isSupSmooth = True

        self.results = NUM.zeros(self.y.shape, dtype=float)
        self.tempNeiNum = NUM.zeros(self.y.shape, dtype=float)

        #### Extract the Time Series in Each Location and Do the Smoothing ####
        if len(self.loc_StartInd) >= 10:
            doStepProgressor = True
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, len(self.loc_StartInd), 1)
        else:
            doStepProgressor = False
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84007))
        for locationId, startInd in self.loc_StartInd.items():
            if ARCPY.env.isCancelled:
                raise SystemExit()

            timeCount = self.loc_TimeCount[locationId]
            positionIds = NUM.zeros(timeCount, dtype=int)
            ind = 0
            for i in range(startInd, startInd + timeCount):
                positionIds[ind] = self.procSeq[i]
                ind += 1
            loc_t = self.t[positionIds]
            loc_y = self.y[positionIds]
            if isSupSmooth:
                if self.timeDelta is None:
                    loc_td = (loc_t - loc_t[0]).astype(float)
                    if NUM.isnan(loc_y).any():
                        loc_res, loc_nei_num = self.__smoothingSuperWithNone(loc_td, loc_y)
                    else:
                        loc_res, loc_nei_num = self.__smoothingSuper(loc_td, loc_y)
                else:
                    loc_res, loc_nei_num = self._localLinearRegressionWithTimeWindow(loc_t, loc_y)
            else:
                if self.hasNonVal:
                    loc_res, loc_nei_num = self.__smoothingAverageWithNone(loc_t, loc_y, tdBefore, tdAfter)
                else:
                    loc_res, loc_nei_num = self.__smoothingAverage(loc_t, loc_y, tdBefore, tdAfter)

            self.results[positionIds], self.tempNeiNum[positionIds] = loc_res, loc_nei_num
            if NUM.isnan(loc_res).all():
                badLocations.append(locationId)
            else:
                if self.createPopups:
                    loc_td = (loc_t - loc_t[0]).astype(float)
                    self.popUpCollection[locationId] = [loc_t[0], loc_td, loc_y, loc_res, locationId]
            if doStepProgressor:
                ARCPY.SetProgressorPosition()
        ARCPY.ResetProgressor()

        if len(badLocations):
            if len(badLocations) == len(self.loc_TimeCount):
                ARCPY.AddIDMessage("ERROR", 110399)
                raise SystemExit()
            else:
                ARCPY.AddIDMessage("WARNING", 110400, len(badLocations), ", ".join(list(map(str, badLocations[0: 30]))))

        return

    def __smoothingAverage(self, t, y, tdBefore, tdAfter):
        """
        Conduct the central or simple movering average
        Parameters
        ----------
        t       : ndarray
                 the time series data
        y       : ndarray
                 the values for smoothing

        Returns
        -------

        """
        ts0 = 0
        ts1 = 0
        leng = len(t)
        res = NUM.zeros(leng, dtype=float)
        neiNum = NUM.zeros(leng, dtype=int)

        # todo: could use additive model here
        for ind in range(leng):
            t0 = t[ind].astype(datetime)
            if self.isRegularTimeDelta:
                if tdBefore == 0:
                    ts0 = ind
                else:
                    tB = NUM.datetime64(STU.unitAdd(t0, seconds=-tdBefore))
                    if not self.processHeadTail and tB < t[0]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while t[ts0] < tB:
                        ts0 += 1
                if tdAfter == 0:
                    ts1 = ind + 1
                else:
                    tA = NUM.datetime64(STU.unitAdd(t0, seconds=tdAfter))
                    if not self.processHeadTail and tA > t[-1]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while ts1 < leng and t[ts1] <= tA:
                        ts1 += 1
            else:
                if tdBefore == (0, 0):
                    ts0 = ind
                else:
                    tB = NUM.datetime64(STU.unitAdd(t0, months=-tdBefore[0], years=-tdBefore[1]))
                    if not self.processHeadTail and tB < t[0]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while t[ts0] < tB:
                        ts0 += 1
                if tdAfter == (0, 0):
                    ts1 = ind + 1
                else:
                    tA = NUM.datetime64(STU.unitAdd(t0, months=tdAfter[0], years=tdAfter[1]))
                    if not self.processHeadTail and tA > t[-1]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while ts1 < leng and t[ts1] <= tA:
                        ts1 += 1
            res[ind] = NUM.mean(y[ts0: ts1])
            neiNum[ind] = ts1 - ts0

        return res, neiNum

    def __smoothingAverageWithNone(self, t, y, tdBefore, tdAfter):
        """
        Conduct the central or simple moving average
        Parameters
        ----------
        t       : ndarray
                 the time series data
        y       : ndarray
                 the values for smoothing

        Returns
        -------

        """
        ts0 = 0
        ts1 = 0
        leng = len(t)
        res = NUM.zeros(leng, dtype=float)
        neiNum = NUM.zeros(leng, dtype=int)

        # todo: could use additive model here
        for ind in range(leng):
            t0 = t[ind].astype(datetime)
            if self.isRegularTimeDelta:
                if tdBefore == 0:
                    ts0 = ind
                else:
                    tB = NUM.datetime64(STU.unitAdd(t0, seconds=-tdBefore))
                    if not self.processHeadTail and tB < t[0]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while t[ts0] < tB:
                        ts0 += 1
                if tdAfter == 0:
                    ts1 = ind + 1
                else:
                    tA = NUM.datetime64(STU.unitAdd(t0, seconds=tdAfter))
                    if not self.processHeadTail and tA > t[-1]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while ts1 < leng and t[ts1] <= tA:
                        ts1 += 1
            else:
                if tdBefore == (0, 0):
                    ts0 = ind
                else:
                    tB = NUM.datetime64(STU.unitAdd(t0, months=-tdBefore[0], years=-tdBefore[1]))
                    if not self.processHeadTail and tB < t[0]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while t[ts0] < tB:
                        ts0 += 1
                if tdAfter == (0, 0):
                    ts1 = ind + 1
                else:
                    tA = NUM.datetime64(STU.unitAdd(t0, months=tdAfter[0], years=tdAfter[1]))
                    if not self.processHeadTail and tA > t[-1]:
                        res[ind] = None
                        neiNum[ind] = 0
                        continue
                    while ts1 < leng and t[ts1] <= tA:
                        ts1 += 1
            data = y[ts0: ts1]
            data = data[~ (NUM.isinf(data) | NUM.isnan(data))]
            if len(data) > 0:
                res[ind] = NUM.mean(data)
                neiNum[ind] = len(data)
            else:
                res[ind] = None
                neiNum[ind] = 0

        return res, neiNum

    def _localLinearRegression(self, t, y, span, keep_center=True):
        """

        Parameters
        ----------
        t               : ndarray
                          time series
        y               : ndarray
                          values for smoothing
        span            : int
                         the bandwidth/window-size for smoothing
        keep_center     : boolean
                         if False, exclude self value for 'leave-on-out cross validation'

        Returns
        -------
                        : ndarray
                         the smoothed values
        """
        N = len(t)
        w = NUM.ones(N)
        arrays = [w, y, t, t * y, t * t]

        window = NUM.ones(span)
        results = [NUM.convolve(array, window, 'same') for array in arrays]

        r_w, r_y, r_t, r_ty, r_t2 = tuple(results)
        if not keep_center:
            r_w, r_y, r_t, r_ty, r_t2 = r_w - arrays[0], r_y - arrays[1], r_t - arrays[2], r_ty - arrays[3], r_t2 - arrays[4]

        Vj = (r_w * r_t2 - r_t * r_t)  # the denominator
        Cj = (r_ty * r_w - r_t * r_y)  # the numerator

        slopes = NUM.zeros(t.shape, dtype=float)
        mask = NUM.where(Vj != 0)
        slopes[mask] = Cj[mask] / Vj[mask]
        intercepts = (r_y - slopes * r_t) / r_w
        y_fit = slopes * t + intercepts
        return y_fit

    def _localLinearRegressionWithTimeWindow(self, t, y):
        """
        when the time window is provided by user, AND the data contains None values, use this method to do the
        local linear regression (super smoothing)
        Parameters
        ----------
        t               : ndarray
                          time series
        y               : ndarray
                          values for smoothing

        Returns
        -------
                        : tuple  (ndarray, ndarray)
                         the smoothed values and neighbors used for smoothing in each location
        """
        N = len(t)
        y_fit = NUM.zeros(N, dtype=float)
        nei_num = NUM.zeros(N, dtype=float)

        x = (t - t[0]).astype(float)
        #### define local statistic values ####
        sum_neiNum = 0
        sum_y = 0.0
        sum_x = 0.0
        sum_xy = 0.0
        sum_x2 = 0.0

        ind_1 = 0
        ind_2 = 0

        for ind in range(N):
            t0 = t[ind].astype(datetime)

            if self.isRegularTimeDelta:
                t1 = NUM.datetime64(STU.unitAdd(t0, seconds=-self.timeDelta))
                t2 = NUM.datetime64(STU.unitAdd(t0, seconds=self.timeDelta))
            else:
                t1 = NUM.datetime64(STU.unitAdd(t0, months=-self.timeDelta[0], years=-self.timeDelta[1]))
                t2 = NUM.datetime64(STU.unitAdd(t0, months=self.timeDelta[0], years=self.timeDelta[1]))
            while t[ind_1] < t1:
                ly = y[ind_1]
                if not (NUM.isnan(ly) or NUM.isinf(ly)):
                    sum_neiNum -= 1
                    lx = x[ind_1]
                    sum_y -= ly
                    sum_x -= lx
                    sum_xy -= lx * ly
                    sum_x2 -= lx ** 2
                ind_1 += 1
            while ind_2 < N and t[ind_2] <= t2:
                ly = y[ind_2]
                if not (NUM.isnan(ly) or NUM.isinf(ly)):
                    sum_neiNum += 1
                    lx = x[ind_2]
                    sum_y += ly
                    sum_x += lx
                    sum_xy += lx * ly
                    sum_x2 += lx ** 2
                ind_2 += 1

            Vj = sum_neiNum * sum_x2 - sum_x ** 2  # the denominator (r_w * r_t2 - r_t * r_t)
            Cj = (sum_xy * sum_neiNum - sum_x * sum_y)  # the numerator

            nei_num[ind] = sum_neiNum
            if sum_neiNum == 0:
                y_fit[ind] = None
            elif Vj == 0 or sum_neiNum == 1:
                y_fit[ind] = y[ind]
            else:
                slope = Cj / Vj
                intercept = (sum_y - slope * sum_x) / sum_neiNum
                y_fit[ind] = slope * x[ind] + intercept

        return y_fit, nei_num

    def _localRegressionInterpolate(self, x, y, x0):
        """
        Do the local regression then interpolate y value on certain location
        Parameters
        ----------
        x               : ndarray
                          x values
        y               : ndarray
                          values for smoothing
        x0              : float
                          certain location for interpolation

        Returns
        -------
                        : float
                         the interpolated y value at t0
        """

        #### define local statistic values ####
        N = len(x)
        sum_y = y.sum()
        sum_x = x.sum()
        sum_xy = (x * y).sum()
        sum_x2 = (x ** 2).sum()


        Vj = N * sum_x2 - sum_x ** 2  # the denominator
        Cj = (sum_xy * N - sum_x * sum_y)  # the numerator

        if Vj == 0 or N == 1:
            return y[0]
        else:
            slope = Cj / Vj
            intercept = (sum_y - slope * sum_x) / N
            return slope * x0 + intercept

    def __smoothingSuper(self, t, y):
        """
        Core super smooth algorithm
        Parameters
        ----------
        t               : ndarray
                          time series
        y               : ndarray
                          values for smoothing

        Returns
        -------
                        : tuple
                         the smoothed values, and the window sizes
        """
        from scipy.interpolate import interp1d

        N = len(t)
        if N < 5:
            return NUM.ones(N, dtype=float) * NUM.nan, NUM.zeros(N, dtype=float)

        ### create the search range, for example
        window_5 = max(int(0.05 * N), 3)
        window_20 = max(int(0.2 * N), 5)
        ceiling = max(int(0.5 * N), 5)
        # window_grid = NUM.unique(NUM.arange(window_5, ceiling, step=(ceiling - window_5) / 10.0).astype(int))
        window_grid = NUM.unique(NUM.array([window_5, window_20, ceiling]))

        # Make sure all the window-sizes are odd numbers
        if window_5 % 2 == 0:
            window_5 += 1
        if window_20 % 2 == 0:
            window_20 += 1
        for ind in range(len(window_grid)):
            if window_grid[ind] % 2 == 0:
                window_grid[ind] += 1

        #### Do the Super Smoothing Here ####
        ### STEP1: Do the local linear regression using the grid windows
        y_smoothed_grid = NUM.array([self._localLinearRegression(t, y, span=sp, keep_center=False)
                                     for sp in window_grid])
        ### STEP2: Calculate the absolute residu le of the smoothed values
        y_resid_grid = abs((y_smoothed_grid - y))

        ### STEP3: Smooth residuals from the STEP2 using span = window_20
        y_resid_smoothed = NUM.array([self._localLinearRegression(t, y_resid, span=window_20, keep_center=True)
                                      for y_resid in y_resid_grid])

        ### STEP4: select the optimal(best) bandwidth that minimize the residuals
        best_spans = window_grid[NUM.argmin(y_resid_smoothed, 0)]

        ### STEP5: Smooth the optimal bandwidth again using span = window_20
        best_spans_smoothed = self._localLinearRegression(t, best_spans, span=window_20, keep_center=True)

        #### Make sure the smoothed bandwidths are in the range of the original window_grid ####
        bd_min = window_grid[0]
        bd_max = window_grid[-1]
        for ind in range(len(best_spans_smoothed)):
            if best_spans_smoothed[ind] < bd_min:
                best_spans_smoothed[ind] = bd_min
            elif best_spans_smoothed[ind] > bd_max:
                best_spans_smoothed[ind] = bd_max

        ### STEP6: Interpolate to get the fitted smoothed y, since the best_spans_smooth are not always integer
        y_smooth_fit = NUM.array([interp1d(window_grid, yt_smooth)(span_t)
                                  for yt_smooth, span_t in zip(y_smoothed_grid.T, best_spans_smoothed)])

        ### STEP7: Finially, do the smooth on last step's results again using span=window_5
        y_smooth_fit_final = self._localLinearRegression(t, y_smooth_fit, span=window_5, keep_center=True)

        return y_smooth_fit_final, best_spans_smoothed

    def __smoothingSuperWithNone(self, t_full, y_full):
        """
        Core super smooth algorithm to deal data with None values
        Parameters
        ----------
        t_full          : ndarray
                          time series
        y_full          : ndarray
                          values for smoothing

        Returns
        -------
                        : tuple
                         the smoothed values, and the window sizes
        """
        from scipy.interpolate import interp1d

        mask = ~ (NUM.isnan(y_full) | NUM.isinf(y_full))
        t = t_full[mask]
        y = y_full[mask]
        N = len(t)
        N_full = len(y_full)
        if N < 5:
            return NUM.ones(N_full, dtype=float) * NUM.nan, NUM.zeros(N_full, dtype=float)

        ### create the search range, for example
        window_5 = max(int(0.05 * N), 3)
        window_20 = max(int(0.2 * N), 5)
        ceiling = max(int(0.5 * N), 5)
        window_grid = NUM.unique(NUM.array([window_5, window_20, ceiling]))

        # Make sure all the window-sizes are odd numbers
        if window_5 % 2 == 0:
            window_5 += 1
        if window_20 % 2 == 0:
            window_20 += 1
        for ind in range(len(window_grid)):
            if window_grid[ind] % 2 == 0:
                window_grid[ind] += 1

        #### Do the Super Smoothing Here ####
        ### STEP1: Do the local linear regression using the grid windows
        y_smoothed_grid = NUM.array([self._localLinearRegression(t, y, span=sp, keep_center=False)
                                     for sp in window_grid])
        ### STEP2: Calculate the absolute residu le of the smoothed values
        y_resid_grid = abs((y_smoothed_grid - y))

        ### STEP3: Smooth residuals from the STEP2 using span = window_20
        y_resid_smoothed = NUM.array([self._localLinearRegression(t, y_resid, span=window_20, keep_center=True)
                                      for y_resid in y_resid_grid])

        ### STEP4: select the optimal(best) bandwidth that minimize the residuals
        best_spans = window_grid[NUM.argmin(y_resid_smoothed, 0)]

        ### STEP5: Smooth the optimal bandwidth again using span = window_20
        best_spans_smoothed = self._localLinearRegression(t, best_spans, span=window_20, keep_center=True)

        #### Make sure the smoothed bandwidths are in the range of the original window_grid ####
        bd_min = window_grid[0]
        bd_max = window_grid[-1]
        for ind in range(len(best_spans_smoothed)):
            if best_spans_smoothed[ind] < bd_min:
                best_spans_smoothed[ind] = bd_min
            elif best_spans_smoothed[ind] > bd_max:
                best_spans_smoothed[ind] = bd_max

        ### STEP6: Interpolate to get the fitted smoothed y, since the best_spans_smooth are not always integer
        y_smooth_fit = NUM.array([interp1d(window_grid, yt_smooth)(span_t)
                                  for yt_smooth, span_t in zip(y_smoothed_grid.T, best_spans_smoothed)])

        ### STEP7: Finially, do the smooth on last step's results again using span=window_5
        y_smooth_fit_final = self._localLinearRegression(t, y_smooth_fit, span=window_5, keep_center=True)

        # ================================================================================================
        #### After the normal values are processed with super smoothing method, deal with None values ####
        # ================================================================================================
        y_smooth_fit_full = NUM.zeros(N_full, dtype=float)
        best_spans_full = NUM.zeros(N_full, dtype=float)
        y_smooth_fit_full[mask] = y_smooth_fit_final
        best_spans_full[mask] = best_spans_smoothed

        N_none = N_full - N
        mask_none = ~mask
        y_smooth_fit_none = NUM.zeros(N_none, dtype=float)
        best_spans_none = NUM.zeros(N_none, dtype=float)

        left_valid_ids = NUM.full(N_full, -1, dtype=int)
        left_valid_ids[mask] = NUM.arange(N)

        #### STEP1: for the none values, use their right and left valid neighbors' spans to interpolate the appropriate span ####
        best_spans_full[mask_none] = NUM.interp(t_full[mask_none], t, best_spans_smoothed)

        left_ind = -1
        for ind in range(N_full):
            if left_valid_ids[ind] != -1:
                left_ind = left_valid_ids[ind]
                continue
            t0 = t_full[ind]
            span = best_spans_full[ind]
            #### STEP2: Use the (float)span to select two (or one) integer span from the grid ####
            int_spans = []
            for i, sp in enumerate(window_grid):
                if sp >= span:
                    if sp > span and i > 0:
                        int_spans.append(window_grid[i-1])
                    int_spans.append(sp)
                    break
            if len(int_spans) == 0:
                int_spans.append(window_grid[-1])
            #### STEP3: use the interger spans to do the local regression and interpolation ####
            interp_ys = []
            for sp in int_spans:
                wing = int((sp - 1) / 2)
                floor = left_ind - wing + 1
                if floor < 0:
                    floor = 0
                t_local = t[floor: left_ind + wing + 1]
                y_local = y[floor: left_ind + wing + 1]
                interp_ys.append(self._localRegressionInterpolate(t_local, y_local, t0))
            #### STEP4: use the interpolated ys to get the final y for this location(time step)####
            if len(interp_ys) == 1:
                y_smooth_fit_full[ind] = interp_ys[0]
            else:
                y_smooth_fit_full[ind] = NUM.interp(span, int_spans, interp_ys)

        return y_smooth_fit_full, best_spans_full

    def createOutput(self):
        ARCPY.env.overwriteOutput = True
        smthFN = None
        smthAlias = None
        valFn = None
        valAlias = None
        timeFn = None
        timeAlias = None
        groupByFN = None

        neigh_field_alias = "Number of Temporal Neighbors"
        doAppd = self.output is None
        fieldNamesAll = set()
        if self.smoothingMethod == "BACKWARD":
            methodName = "Backward Smoothing"
        elif self.smoothingMethod == "CENTERED":
            methodName = "Centered Smoothing"
        elif self.smoothingMethod == "FORWARD":
            methodName = "Forward Smoothing"
        else:
            methodName = "Adaptive Smoothing"

        oidName = None
        if self.ssdo is not None:
            valFn = self.smoothField.upper()
            valAlias = self.field_smoothField.alias
            timeFn = self.timeField.upper()
            timeAlias = self.field_timeField.alias

            appendFields = []
            if doAppd:
                for f in ARCPY.ListFields(self.input):
                    fieldNamesAll.add(f.name.upper())
                if self.groupIdField is not None:
                    groupByFN = self.groupIdField.upper()
            else:
                if self.groupIdField is None:
                    appendFields = [self.timeField.upper(), self.smoothField.upper()]
                else:
                    appendFields = [self.groupIdField.upper(), self.timeField.upper(), self.smoothField.upper()]
                    groupByFN = self.groupIdField.upper()
                fieldNamesAll = set(appendFields)

            candidateFields = {}

            smthFN = self.smoothField.upper()[0: 5] + "_SMTH"
            ind = 0
            while smthFN in fieldNamesAll:
                appd = "_SMTH" + str(ind)
                smthFN = self.smoothField.upper()[0: 10 - len(appd)] + appd
                ind += 1
            fieldNamesAll.add(smthFN)

            smthAlias = self.ssdo.fields[self.smoothField.upper()].alias + " " + methodName
            if self.timeWindow is not None:
                timeAppd = " ({})".format(self.timeWindow.lower())
            else:
                timeAppd = ""
            smthAlias += timeAppd
            candidateField = SSDO.CandidateField(smthFN, "DOUBLE", self.results,
                                                 alias=smthAlias, checkNullValues = True)
            self.alias_smoothFieldRes = smthAlias

            candidateFields[smthFN] = candidateField

            neigh_field_name = self.smoothField.upper()[0: 6] + "_NBR"
            ind = 0
            while neigh_field_name in fieldNamesAll:
                appd = "_NBR" + str(ind)
                neigh_field_name = self.smoothField.upper()[0: 10-len(appd)] + appd
                ind += 1
            fieldNamesAll.add(neigh_field_name)
            candidateFields[neigh_field_name] = SSDO.CandidateField(
                neigh_field_name, "DOUBLE", self.tempNeiNum,
                alias=self.ssdo.fields[self.smoothField.upper()].alias + " " + neigh_field_alias + timeAppd)

            fieldOrder = [smthFN, neigh_field_name]
            if self.groupBy == "LOCATION":
                groupByFN = "LOCATIONID"
                ind = 1
                while groupByFN in fieldNamesAll:
                    groupByFN = groupByFN[0: 10 - len(str(ind))] + str(ind)
                    ind += 1
                fieldNamesAll.add(groupByFN)
                candidateFields[groupByFN] = SSDO.CandidateField(
                    groupByFN, "LONG", self.groupByIds,
                    alias="Location ID")
                fieldOrder.append(groupByFN)
            if doAppd:
                html2AppdFile = self.input
                oidName = self.ssdo.oidName
                self.ssdo.addFields2FC(candidateFields, fieldOrder=fieldOrder)
            else:
                self.ssdo.output2NewFC(self.output, candidateFields,
                                       appendFields=appendFields, fieldOrder=fieldOrder)
                html2AppdFile = self.output
                try:
                    oidName = ARCPY.Describe(html2AppdFile).OIDFieldName
                except:
                    pass
        else: # deal with CSV input only
            inputFields = [self.field_timeField.name, self.field_smoothField.name]
            inputTypes = [self.field_timeField.type, self.field_smoothField.type]
            inputAliases = [self.field_timeField.aliasName, self.field_smoothField.aliasName]
            valFn = inputFields[1]
            valAlias = inputAliases[1]
            timeFn = inputFields[0]
            timeAlias = inputAliases[0]

            if self.groupIdField is not None:
                inputFields = [self.field_groupIdField.name] + inputFields
                inputTypes = [self.field_groupIdField.type] + inputTypes
                inputAliases = [self.field_groupIdField.aliasName] + inputAliases
                groupByFN = inputFields[0]
            smthFN = self.smoothField[0: 5] + "_SMTH"
            ind = 0
            while smthFN in inputFields:
                appd = "_SMTH" + str(ind)
                smthFN = self.smoothField[0: 10 - len(appd)] + appd
                ind += 1

            smthAlias = self.field_smoothField.aliasName + " " + methodName
            if self.timeWindow is not None:
                smthAlias += " ({})".format(self.timeWindow.lower())
            inputFields.append(smthFN)
            inputTypes.append("DOUBLE")
            inputAliases.append(smthAlias)
            self.alias_smoothFieldRes = smthAlias

            neigh_field_name = self.smoothField + "_NBR"
            ind = 0
            while neigh_field_name in inputFields:
                appd = "_NBR" + str(ind)
                neigh_field_name = self.smoothField[0: 10-len(appd)] + appd
                ind += 1
            inputFields.append(neigh_field_name)
            inputTypes.append("DOUBLE")
            inputAliases.append(self.field_smoothField.aliasName + " " + neigh_field_alias)

            inputData = []

            if self.groupIdField is None:
                for ind in range(self.numObs):
                    inputData.append((self.t[ind].astype(datetime), self.y[ind],
                                      self.results[ind], self.tempNeiNum[ind]))
            else:
                for ind in range(self.numObs):
                    inputData.append((self.groupByIds[ind], self.t[ind].astype(datetime),
                                      self.y[ind], self.results[ind], self.tempNeiNum[ind]))

            inTypes = []
            for t in inputTypes:
                t = t.upper()
                if t == "INTEGER":
                    t = "LONG"
                inTypes.append(t)
            UTILS.createOutputTable(self.output, inputFields,
                                    inTypes, inputData, aliases=inputAliases)
            html2AppdFile = self.output
            oidName = ARCPY.Describe(html2AppdFile).OIDFieldName

        #### Prepare and create Pop-ups seperately ####
        if doAppd:
            desc = ARCPY.Describe(self.input)
            outputFC = desc.catalogPath
        else:
            outputFC = self.output
        outPath, outName = OS.path.split(outputFC)

        if self.createPopups and not UTILS.IsPathInGeoDatabase(outputFC):
            #### Throw Warning That We Ignore PopUps for Shapefiles ####
            ARCPY.AddIDMessage("WARNING", 110315)
        elif self.createPopups and UTILS.IsPathInGeoDatabase(outputFC):
            resourcePath = OS.path.dirname(OS.path.dirname(OS.path.dirname(__file__)))
            lang, code = LOCALE.getdefaultlocale()
            langIds = [lang[0:2], lang.replace('_', "-")]
            selectedLang = 'en'
            for langId in langIds:
                localeJSPath = OS.path.join(resourcePath,
                                            "Charts\\scripts\\culture",
                                            "wijmo.culture.@c.min.js".replace('@c', langId))
                if OS.path.isfile(localeJSPath):
                    selectedLang = langId
                    break
            htmlFN = "HTML_CHART"
            ind = 1
            while htmlFN in fieldNamesAll:
                htmlFN = htmlFN[0: 10 - len(str(ind))] + str(ind)
                ind += 1

            maxTimeSteps = -1
            targetLocationId = -1
            for locationId, data in self.popUpCollection.items():
                if len(data[1]) > maxTimeSteps:
                    maxTimeSteps = len(data[1])
                    targetLocationId = locationId
            data = self.popUpCollection[targetLocationId]
            content = {
                "t0": str(data[0].astype(datetime)),
                "dt": data[1].tolist(),
                "vo": data[2].tolist(),
                "vs": data[3].tolist(),
                "vn": valAlias,
                "cid": htmlFN,
                "lang": selectedLang,
                "labels": {
                    'datetime': ARCPY.GetIDMessage(84972),
                    'original': ARCPY.GetIDMessage(84968),
                    'smoothed': ARCPY.GetIDMessage(220183),
                    'residual': ARCPY.GetIDMessage(84079),
                },
            }
            field_str_test = HTML_template.replace("@@cid", htmlFN).replace("@@data", JSON.dumps(content))
            maxLength = int(len(field_str_test) * 1.5)

            ARCPY.management.AddFields(
                html2AppdFile,
                [[htmlFN, 'Text', "Time Series HTML Pop-Up", maxLength, None, None]])

            locationIdCollection = set(self.popUpCollection.keys())
            if groupByFN is None:
                queryFields = [htmlFN]
            else:
                if doAppd:
                    queryFields = [groupByFN, htmlFN]
                else:
                    valid_groupByFN = ARCPY.ValidateFieldName(groupByFN, outPath)
                    queryFields = [valid_groupByFN, htmlFN]
            if oidName is not None:
                queryFields = [oidName] + queryFields
            with ARCPY.da.UpdateCursor(html2AppdFile, queryFields) as cursor:
                for row in cursor:
                    if groupByFN is None:
                        if len(data[1]) > 1:
                            row[1] = field_str_test
                            cursor.updateRow(row)
                        break
                    elif row[1] in locationIdCollection:
                        data = self.popUpCollection[row[1]]
                        if len(data[1]) > 1:
                            content = {
                                "t0": str(data[0].astype(datetime)),
                                "dt": data[1].tolist(),
                                "vo": data[2].tolist(),
                                "vs": data[3].tolist(),
                                "vn": valAlias,
                                "cid": htmlFN,
                                "lang": selectedLang,
                                "labels": {
                                    'datetime': ARCPY.GetIDMessage(84972),
                                    'original': ARCPY.GetIDMessage(84968),
                                    'smoothed': ARCPY.GetIDMessage(220183),
                                    'residual': ARCPY.GetIDMessage(84079),
                                },
                            }
                            html_str = HTML_template.replace("@@cid", htmlFN).replace("@@data", JSON.dumps(content))
                            if len(html_str) > maxLength:
                                html_str = html_str[0: maxLength]
                            row[2] = html_str
                            locationIdCollection.remove(row[1])
                            cursor.updateRow(row)
                    if len(locationIdCollection) == 0:
                        break

        if doAppd:
            return None
        else:
            chartTitle = ARCPY.GetIDMessage(220184)
            smthChart = ARCPY.Chart(chartTitle)
            smthChart.type = "line"
            smthChart.title = chartTitle
            if groupByFN is not None:
                smthChart.line.splitCategory = ARCPY.ValidateFieldName(groupByFN, outPath)

            smthChart.xAxis.field = ARCPY.ValidateFieldName(timeFn, outPath)
            smthChart.xAxis.title = timeAlias
            smthChart.yAxis.field = ARCPY.ValidateFieldName(smthFN, outPath)
            smthChart.yAxis.title = smthAlias

            return [smthChart]

