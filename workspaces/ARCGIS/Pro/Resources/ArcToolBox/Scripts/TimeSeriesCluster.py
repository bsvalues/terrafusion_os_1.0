import arcgisscripting as ARC
import arcpy as ARCPY
import locale as LOCALE
import SSUtilities as UTILS
import numpy as NUM
import SSCube as CUBE
import SSPanel as PANEL
import SSCubeUtilities as CUTILS
import SSDataObject as SSDO
import time
import os as OS

PERMUTATION_NUM = 10
PERMUTATION_NUM_CLARA = 20
LOCATION_THRESHOLD_CLARA = 10000

timeSeriesColors = ["#78AAFF", "#FF6455", "#7DDC55", "#FFB400", "#C864E1",
                    "#BEA064", "#FABEC8", "#AFAFAF", "#005AE6", "#E60000",
                    "#37A000", "#960096", "#B4FF00", "#822800", "#3C6E82",
                    "#FF00C3", "#00E6AA", "#FFE600", "#002378", "#D78787",
                    "#282828", "#73E1E1", "#006400", "#E1C3FF", "#966432",
                    "#FFC88C", "#D2FFBE", "#CDE1FF", "#FFFF87", "#F0F0F0"]

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    ################### Imports ########################
    #### User Defined Inputs ####
    inputCube = parameters[0].valueAsText
    varName = parameters[1].valueAsText
    param_outputFC = parameters[2]
    outputFC = param_outputFC.valueAsText
    charaOfInterest = parameters[3].valueAsText.upper()
    clusterNum = UTILS.getNumericParameter(4, parameters)
    param_chartTable = parameters[5]
    chartTable = param_chartTable.valueAsText
    shapeChar2Ignore = parameters[6].valueAsText
    createPopUps = parameters[7].value

    #### Boolean for Panel Or Not ####
    isPanelCube = isPanelFromFile(inputCube)

    if not isPanelCube:
        #### Create Cube Object ####
        cube = CUBE.SSCube(inputCube, 'a')

    else:
        #### Create Panel Cube Object for Analysis ####
        cube = PANEL.SSPanel(inputCube, 'a')

    if shapeChar2Ignore:
        shapeChar2Ignore = [t.strip("'").upper() for t in shapeChar2Ignore.split(";")]

    #### Run Analysis ####
    tsc = TimeSeriesCluster(cube, varName,
                            charaOfInterest=charaOfInterest,
                            clusterNum=clusterNum,
                            shapeChar2Ignore=shapeChar2Ignore)

    tsc.exportClusterFC(outputFC, createPopUps=createPopUps)

    #### Create Charting Output ####
    if chartTable:
        chartFields = cube.timeSeriesClusteringPlot3D(chartTable, varName)
        cube.exportTable3D(chartTable, chartFields)

    cube.close()

    #### Set Shape and Layer Type ####
    if cube.isPolygon:
        renderLayerFile = "MultiVarClusterPolygons.lyr"
    else:
        renderLayerFile = "MultiVarClusterPoints.lyrx"

    #### Render Results ####
    try:
        fullRLF = OS.path.join(UTILS.pathLayers, renderLayerFile)
        param_outputFC.symbology = fullRLF
    except:
        ARCPY.AddIDMessage("WARNING", 973)

    #### Render Time-Series Chart ####
    if UTILS.isPRO() and chartTable is not None:
        fields = {"CLUSTER_ID": "CLUSTER_ID", "START_DATE": "START_DATE",
                  "END_DATE": "END_DATE", "CLUST_MEAN": "CLUST_MEAN","CLUST_MED": "CLUST_MED"}
        fields  = UTILS.honorCaseSDE(chartTable, fields)

        meanTitle = ARCPY.GetIDMessage(84802)
        meanChart = ARCPY.Chart(meanTitle)
        meanChart.type = "line"
        meanChart.title = meanTitle
        meanChart.line.splitCategory = fields["CLUSTER_ID"]

        meanChart.line.timeIntervalUnits = cube.timeUnit
        meanChart.line.timeIntervalSize = float(cube.timeSize)

        #### Assign X Axis Field ####
        if cube.isStartTime:
            meanChart.xAxis.field = fields["START_DATE"]
            meanChart.xAxis.title = ARCPY.GetIDMessage(84777)
            aggType = "equalIntervalsFromStartTime"
        else:
            meanChart.xAxis.field = fields["END_DATE"]
            meanChart.xAxis.title = ARCPY.GetIDMessage(84778)
            aggType = "equalIntervalsFromEndTime"

        #### Assign Y Axis Field ####
        meanChart.yAxis.field = fields["CLUST_MEAN"]
        meanChart.yAxis.title = varName

        #### Set Colors ####
        colors = timeSeriesColors[:tsc.clusterNum]
        meanChart.color = colors

        #### Medoid Time Series Chart ####
        medTitle = ARCPY.GetIDMessage(84803)
        medChart = ARCPY.Chart(medTitle)
        medChart.type = "line"
        medChart.title = medTitle
        medChart.line.splitCategory = fields["CLUSTER_ID"]

        medChart.line.timeIntervalUnits = cube.timeUnit
        medChart.line.timeIntervalSize = float(cube.timeSize)

        #### Assign X Axis Field ####
        if cube.isStartTime:
            medChart.xAxis.field = fields["START_DATE"]
            medChart.xAxis.title = ARCPY.GetIDMessage(84777)
            aggType = "equalIntervalsFromStartTime"
        else:
            medChart.xAxis.field = fields["END_DATE"]
            medChart.xAxis.title = ARCPY.GetIDMessage(84778)
            aggType = "equalIntervalsFromEndTime"

        #### Assign Y Axis Field ####
        medChart.yAxis.field = fields["CLUST_MED"]
        medChart.yAxis.title = varName

        #### Set Colors ####
        medChart.color = colors

        #### Add to Parameter ####
        param_chartTable.charts = [meanChart, medChart]

    return


def postExecute(parameters):
    #### Update Pop-up titles ####
    UTILS.postExecuteUpdatePopupTitle(parameters, 2, 7)


def isPanel(dataset):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining Panel Cube'
    try:
        if validStr in dataset.description:
            return True
        else:
            return False
    except:
        return False


def isPanelFromFile(ncFile):
    import netCDF4 as NET

    try:
        dataset = NET.Dataset(ncFile, keepweakref = True)
        isPanelCube = isPanel(dataset)
        dataset.close()
    except:
        isPanelCube = False

    return isPanelCube


class ClusterResultBean:
    def __init__(self, clusterIds, fieldName, fieldAlias, description, group,
                 centerIDs=None, randSeed=None, fStatsSummaryTable=[], pseudoFMessage=[]):
        self.clusterIds = clusterIds
        self.fieldName = fieldName
        self.fieldAlias = fieldAlias
        self.description = description
        self.group = group
        self.centerIDs = centerIDs
        self.randSeed = randSeed
        self.fStatsSummaryTable = fStatsSummaryTable
        self.pseudoFMessages = pseudoFMessage

        self.con_Fourier = False
        self.con_Fourier_scores = None
        self.con_Fourier_functionNum = None

        self.con_FourierAMP = False
        self.con_FourierAMP_scores = None
        self.con_FourierAMP_functionNum = fStatsSummaryTable


    def getCandidateField(self, fieldName=None):
        if fieldName is None:
            fieldName = self.fieldName
        return SSDO.CandidateField(fieldName, "LONG", data=self.clusterIds, alias=self.fieldAlias)


    def toJsonStr(self, mean):
        template = """{
            fieldName: "@@fieldName",
            cid: @@cid,
            sta: @@sta,
            mean: @@mean,
            description: "@@description",
            group: "@@group",
        }"""

        template = template.replace("@@fieldName", self.fieldName)
        template = template.replace("@@cid", str(self.clusterIds.tolist()))

        unique, counts = NUM.unique(self.clusterIds, return_counts=True)
        clusterSta = dict(zip(unique, counts))

        template = template.replace("@@sta", str(clusterSta))
        template = template.replace("@@mean", str(mean))
        template = template.replace("@@description", self.description)
        template = template.replace("@@group", self.group)
        return template


def conductCluster(numClusters, data, clusterMethod="K_MEANS", distanceMetric=1, appendAttr=None):
    """
    conduct k-means / k-medoids-pam clustering on the given dataset
    :param numClusters:
    :param data:
    :param clusterMethod:
    :param appendAttr: dict
    :return:
    """
    permCount = PERMUTATION_NUM
    if clusterMethod == "K_MEDOIDS_CLARA":
        permCount = PERMUTATION_NUM_CLARA
    numThreads = UTILS.getNumberOfThreadsDefault()
    #### Get Initial Seeds ####
    randSeed = UTILS.getRandomSeed()
    if randSeed == 0:
        randSeed = int(time.time()*10000) % 9999

    # CLARA_N = -1
    CLARA_N = int(data.shape[0]**0.5)

    if numClusters is not None:
        CluClas = None
        if clusterMethod == "K_MEANS":
            CluClas = ARC._ss.PyKMeans(data)
            CluClas.cluster(num_cluster=numClusters, random_seed=randSeed, num_repeat=permCount, num_thread=numThreads)
            if CluClas.get_results_num() == 0:
                raise SystemExit()
        elif clusterMethod in ["K_MEDOIDS_PAM", "K_MEDOIDS_CLARA", "K_MEDOIDS_CLARANS"]:
            algorithmCode = 1
            if clusterMethod == "K_MEDOIDS_CLARA":
                algorithmCode = 2
            elif clusterMethod == "K_MEDOIDS_CLARANS":
                algorithmCode = 3
            try:
                CluClas = ARC._ss.PyKMedoids(data, DISTANCEMETRIC=distanceMetric, CLUSTERMETHOD=algorithmCode)
            except:
                ARCPY.AddIDMessage("ERROR", 120273)
                raise SystemExit()

            if not CluClas.can_solve():
                raise SystemExit()
            if CluClas.get_nonconstant_locations_num() == 0:
                ARCPY.AddIDMessage("ERROR", 110134, 1)
                raise SystemExit()
            if algorithmCode == 2:
                CluClas.cluster(num_cluster=numClusters, random_seed=randSeed,
                                num_repeat=permCount, num_thread=numThreads,
                                clara_sampling_num=CLARA_N)
            elif algorithmCode == 3:
                CluClas.cluster(num_cluster=numClusters, random_seed=randSeed,
                                num_repeat=permCount, num_thread=numThreads,
                                clarans_sampling_ratio=-1)
            else:
                CluClas.cluster(num_cluster=numClusters, random_seed=randSeed,
                                num_repeat=permCount, num_thread=numThreads)

            if (not CluClas.can_solve()) or CluClas.get_results_num() == 0:
                raise SystemExit()
        else:
            ARCPY.AddError("This method is not supported now")
            raise SystemExit()

        bestResultId = -1
        bestPseudoF = -1
        bestK = -1
        for id in range(CluClas.get_results_num()):
            cr = CluClas.get_result_by_id(id, with_data=False, with_stat_info=True)
            if cr["pseudoF"] > 1e100:
                cr["pseudoF"] = NUM.inf
            if cr["pseudoF"] > bestPseudoF or (cr["pseudoF"] == bestPseudoF and cr["K"] < bestK):
                bestPseudoF = cr["pseudoF"]
                bestResultId = id
                bestK = cr["K"]
        bestCr = CluClas.get_result_by_id(bestResultId, with_data=True, with_stat_info=True)
        if bestCr["pseudoF"] > 1e100:
            bestCr["pseudoF"] = NUM.inf
        #### Deal with Possible Empty Clusters ####
        numUnique = bestCr["K"]
        if numUnique != numClusters:
            cNum = numUnique
            if cNum == 1:
                ARCPY.AddIDMessage("ERROR", 110134, cNum)
                raise SystemExit()
            else:
                ARCPY.AddIDMessage("WARNING", 110134, cNum)
        if numClusters < 2:
            ARCPY.AddIDMessage("ERROR", 110128, 2)
            raise SystemExit()
        if clusterMethod == "K_MEDOIDS_PAM" and bestCr["has_constant_nodes"]:
            # ARCPY.AddWarning("Data contains constant time singals, which are grouped into the first cluster.")
            pass

        report = [ARCPY.GetIDMessage(84973).format(UTILS.formatValue(bestCr["pseudoF"], "%.3f")),
                  ARCPY.GetIDMessage(84821).format(randSeed)]

        return ClusterResultBean(
            clusterIds=bestCr["cluster_ids"] + 1,
            fieldName=appendAttr["fieldName"],
            fieldAlias=appendAttr["fieldAlias"] + " " + clusterMethod,
            description=appendAttr["description"],
            group=appendAttr["group"],
            centerIDs=bestCr["cluster_representative_ids"],
            fStatsSummaryTable=[],
            pseudoFMessage=report)
    else:
        N = data.shape[0]
        clusterNumMin = 2
        clusterNumMax = min(10, N - 1)
        CluClas = None
        if clusterMethod == "K_MEANS":
            CluClas = ARC._ss.PyKMeans(data)
            CluClas.cluster(num_min_cluster=clusterNumMin, num_max_cluster=clusterNumMax,
                            num_repeat=permCount, random_seed=randSeed, num_thread=numThreads)

        elif clusterMethod in ["K_MEDOIDS_PAM", "K_MEDOIDS_CLARA", "K_MEDOIDS_CLARANS"]:
            algorithmCode = 1
            if clusterMethod == "K_MEDOIDS_CLARA":
                algorithmCode = 2
            elif clusterMethod == "K_MEDOIDS_CLARANS":
                algorithmCode = 3
            try:
                CluClas = ARC._ss.PyKMedoids(data, DISTANCEMETRIC=distanceMetric, CLUSTERMETHOD=algorithmCode)
            except:
                ARCPY.AddIDMessage("ERROR", 120273)
                raise SystemExit()

            if not CluClas.can_solve():
                raise SystemExit()
            if CluClas.get_nonconstant_locations_num() == 0:
                ARCPY.AddIDMessage("ERROR", 110134, 1)
                raise SystemExit()
            if algorithmCode == 2:
                CluClas.cluster(num_min_cluster=clusterNumMin, num_max_cluster=clusterNumMax,
                                random_seed=randSeed, num_repeat=permCount, num_thread=numThreads,
                                clara_sampling_num=CLARA_N)
            elif algorithmCode == 3:
                CluClas.cluster(num_min_cluster=clusterNumMin, num_max_cluster=clusterNumMax,
                                random_seed=randSeed, num_repeat=permCount, num_thread=numThreads,
                                clarans_sampling_ratio=-1)
            else:
                CluClas.cluster(num_min_cluster=clusterNumMin, num_max_cluster=clusterNumMax,
                                random_seed=randSeed, num_repeat=permCount, num_thread=numThreads)
            if not CluClas.can_solve():
                raise SystemExit()
        else:
            ARCPY.AddError("This method is not supported now")
            raise SystemExit()

        if CluClas.get_results_num() == 0:
            raise SystemExit()
        bestResultId = -1
        bestPseudoF = -1
        bestFScoreCollection = {}
        bestK = -1
        kMax = -1
        ARCPY.SetProgressor("step", "Gathering Statistic Evidence...",
                            0, CluClas.get_results_num(), 1)
        for id in range(CluClas.get_results_num()):
            cr = CluClas.get_result_by_id(id, with_data=False, with_stat_info=True)
            if cr["K"] > kMax:
                kMax = cr["K"]
            if cr["pseudoF"] > 1e100:
                cr["pseudoF"] = NUM.inf
            if cr["K"] not in bestFScoreCollection or cr["pseudoF"] > bestFScoreCollection[cr["K"]]:
                bestFScoreCollection[cr["K"]] = cr["pseudoF"]
                if (cr["pseudoF"] > bestPseudoF) or (NUM.isinf(cr["pseudoF"]) and cr["K"] < bestK):
                    bestResultId = id
                    bestPseudoF = cr["pseudoF"]
                    bestK = cr["K"]
            ARCPY.SetProgressorPosition()

        if bestResultId == -1:
            cr = CluClas.get_result_by_id(0, with_data=False, with_stat_info=True)
            bestResultId = 0
            bestPseudoF = cr["pseudoF"]
            bestK = cr["K"]

        if NUM.isinf(bestPseudoF):
            kMax = bestK

        cNum = kMax
        if cNum < clusterNumMax:
            if cNum == 1:
                ARCPY.AddIDMessage("ERROR", 110134, cNum)
                raise SystemExit()
            else:
                ARCPY.AddIDMessage("WARNING", 110134, cNum)

        clusterNumbersFound = list(bestFScoreCollection.keys())
        clusterNumbersFound.sort()

        header = ARCPY.GetIDMessage(84411)
        #### Column Labels ####
        total = []
        total.append([ARCPY.GetIDMessage(84764), ARCPY.GetIDMessage(84966)])

        #### Add Rows ####
        for clusterNum in clusterNumbersFound:
            clm = clusterNum
            pseudoF = bestFScoreCollection[clusterNum]
            total.append([str(clm), UTILS.formatValue(pseudoF, "%.3f")])
            if NUM.isinf(pseudoF):
                break

        cr = CluClas.get_result_by_id(bestResultId, with_data=True, with_stat_info=True)
        clusterNumOpt = cr["K"]
        #### Create Output Text Table ####
        total.append("EMPTY")
        report = [UTILS.outputTextTable(total, header=header,
                                        pad=2, colPad=6,
                                        justify=["left", "right"],
                                        titleFillToken="-",
                                        emptyFillToken="-",
                                        footnote= [ARCPY.GetIDMessage(84762).format(clusterNumOpt)],
                                        tableSize="small", returnHTMLMsg=True,
                                        force2Txt=False)]

        if clusterMethod == "K_MEDOIDS_PAM" and cr["has_constant_nodes"]:
            # ARCPY.AddWarning("Data contains constant time singals, which are grouped into the first cluster.")
            pass
        
        pseudoFMessage = [ARCPY.GetIDMessage(84821).format(randSeed)]

        return ClusterResultBean(
            clusterIds=cr["cluster_ids"] + 1,
            fieldName=appendAttr["fieldName"],
            fieldAlias=appendAttr["fieldAlias"] + " " + clusterMethod,
            description=appendAttr["description"],
            group=appendAttr["group"],
            centerIDs=cr["cluster_representative_ids"],
            randSeed=cr["init_random_seed"],
            fStatsSummaryTable=report,
            pseudoFMessage=pseudoFMessage)


class TimeSeriesCluster:
    def __init__(self, cube, varName, charaOfInterest, clusterNum=None,
                 shapeChar2Ignore=None):
        """
        This class takes the SSCube as input and the fields name

        Parameters
        ----------
        cube
        varName
        charaOfInterest
        clusterNum
        shapeChar2Ignore
        """
        self.cube = cube
        self.varName = self.cube.checkVariable(varName)
        self.charaOfInterest = charaOfInterest
        self.clusterNum = clusterNum
        self.shapeChar2Ignore = shapeChar2Ignore
        self.clusterResult = None
        if charaOfInterest in ["VALUE", "PROFILE_FOURIER"]:
            self.clusterMethod = "K_MEANS"
        else:
            self.clusterMethod = "K_MEDOIDS_PAM"

        #### organize the dataset for next step analysis ####
        self.cubeIdList = None
        self.cubeIsPanel = isinstance(cube, PANEL.SSPanel)
        if self.cubeIsPanel:
            values = cube.obtainValues(varName, flatten=False)
            self.cubeIdList = NUM.array([i for i in range(self.cube.numLocations)])
            self.T = cube.numTime
            self.N = self.cube.numLocations
            self.data = NUM.zeros((self.N, self.T), dtype=float)
            for i in range(self.N):
                self.data[i, :] = values.data[:, i]
        else:
            numRows = cube.numRows
            numCols = cube.numCols
            self.mask = cube.getAnalysisMask(varName)

            #### Set stats info For cube ####
            analysisMask = self.cube.obtainVariableMask(self.varName)
            self.cube.cubeInfo.reset_search_info(mask=analysisMask)
            tiledMask = NUM.tile(analysisMask, self.cube.cubeInfo.num_time)
            tiledMask = tiledMask.reshape(self.cube.numTime, numRows, numCols)

            #### Retrieve Values from Cube ####
            fillZeros = self.varName[-6:] == '_ZEROS'
            y = self.cube.obtainValues(self.varName, flatten=False,
                                  fillZeros=fillZeros) * 1.0

            self.cubeIdList = NUM.where(self.mask)[0]
            self.T = cube.numTime
            self.N = len(self.cubeIdList)
            self.data = NUM.zeros((self.N, self.T), dtype=float)
            for ind, id in enumerate(self.cubeIdList):
                row = id // numCols
                col = id % numCols
                self.data[ind, :] = y[:, row, col]

            #### One-Dimensional (flattened) Masks ####
            tiledMask = tiledMask.ravel()
            y = y.ravel()
            #### Set Stats ####
            self.cube.setStats(y, tiledMask)

        self.basisFuncNum = self.T
        if self.N <= 2:
            ARCPY.AddIDMessage("ERROR", 110304, 3)
            raise SystemExit()
        if self.clusterNum is not None and self.clusterNum >= self.N:
            ARCPY.AddIDMessage("ERROR", 110190, self.clusterNum, self.N)
            raise SystemExit()
        if self.N > 1e4:
            ARCPY.AddIDMessage("WARNING", 110305, self.N)

        if self.clusterMethod == "K_MEDOIDS_PAM" and self.N > LOCATION_THRESHOLD_CLARA:
            self.clusterMethod = "K_MEDOIDS_CLARA"

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(cube, "isForecast") and cube.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        self.dataOrigin = self.data.copy()

        self.candidateFieldList = []
        if self.cubeIsPanel:
            locationField = self.cube.getLocationFields()[0]
        else:
            locationField = self.cube.getLocationField(self.mask)
        self.candidateFieldList.append(locationField)

        if self.charaOfInterest == "VALUE":
            resultBean = conductCluster(self.clusterNum,
                                        data=self.data,
                                        clusterMethod=self.clusterMethod,
                                        distanceMetric=1,
                                        appendAttr={"fieldName": "CID_TIMESERIES_VALUE",
                                                     "fieldAlias": "CID-TimeSeries-Value Based",
                                                     "description": "Time Series Cluster (VALUE Based)",
                                                     "group": "RAW"})
            #### Update the number of clusters ####
            self.clusterNum = len(resultBean.centerIDs)
            self.clusterResult = resultBean
        elif self.charaOfInterest == "PROFILE":
            resultBean = conductCluster(self.clusterNum,
                                        data=self.data,
                                        clusterMethod=self.clusterMethod,
                                        distanceMetric=2,
                                        appendAttr={
                                            "fieldName": "CID_Correlation",
                                            "fieldAlias": "CID-Correlation",
                                            "description": "Time Series Cluster (Correlation Covariance)",
                                            "group": "PROFILE"})

            #### Update the number of clusters ####
            self.clusterNum = len(resultBean.centerIDs)
            self.clusterResult = resultBean
        elif self.charaOfInterest == "PROFILE_FOURIER":
            if self.shapeChar2Ignore and "RANGE" in self.shapeChar2Ignore:
                for i in range(len(self.data)):
                    ts = self.data[i]
                    tsMin = ts.min()
                    tsRange = ts.max() - ts.min()
                    if tsRange == 0:
                        self.data[i] = NUM.full(self.T, 0.0)
                    else:
                        self.data[i] = (ts - tsMin) / tsRange
            result_fourierAMP = None
            fieldName = "CID_Fourier"
            fieldAlias = "CID-Fourier"
            description = "FDA Fourier"
            #### Do the fourier analysis here ####
            result_fourier = self.processFourier()
            res = result_fourier
            if self.shapeChar2Ignore and "TIME_LAG" in self.shapeChar2Ignore:
                result_fourierAMP = self.processFourierAmplitude(res["scores"])
                res = result_fourierAMP
                fieldName += "_AMP"
                fieldAlias += "-AMP"
                description += " [Ignore Time Lag]"
            scores = res["scores"]
            data = NUM.zeros((scores.shape[0], scores.shape[1]-1), dtype=float)
            data[:, :] = scores[:, 1:]
            resultBean = conductCluster(self.clusterNum,
                                        data=data,
                                        clusterMethod=self.clusterMethod,
                                        distanceMetric=1,
                                        appendAttr={"fieldName": "CID_TIMESERIES_VALUE",
                                                    "fieldAlias": "CID-TimeSeries-Value Based",
                                                    "description": "Time Series Cluster (VALUE Based)",
                                                    "group": "RAW"})
            resultBean.con_Fourier = True
            resultBean.con_Fourier_scores = result_fourier["scores"]
            resultBean.con_Fourier_functionNum = result_fourier["functionNum"]
            if result_fourierAMP:
                resultBean.con_FourierAMP = True
                resultBean.con_FourierAMP_scores = result_fourierAMP["scores"]
                resultBean.con_FourierAMP_functionNum = result_fourierAMP["functionNum"]
            #### Update the number of clusters ####
            self.clusterNum = len(resultBean.centerIDs)
            self.clusterResult = resultBean

    def processFourier(self):
        numBasis = self.T - 1 + (self.T % 2)
        if self.basisFuncNum and self.basisFuncNum < numBasis:
            numBasis = self.basisFuncNum
            if numBasis % 2 == 0:
                numBasis += 1

        basisMat = CUTILS.fourierBasis(numBasis, self.T)
        #### Perform FDA at locations ####
        scores = NUM.matmul(self.data, basisMat) / basisMat.shape[0] * 2
        result = {
            "scores": scores,
            "functionNum": numBasis-1,
        }
        return result

    def processFourierAmplitude(self, scores):
        scoresAmp = NUM.zeros((self.N, (scores.shape[1] + 1) // 2), dtype=NUM.float64)
        scoresAmp[:, 0] = scores[:, 0]
        for i in range(1, scoresAmp.shape[1]):
            sinScore = scores[:, i * 2 - 1]
            cosScore = scores[:, i * 2]
            scoresAmp[:, i] = NUM.sqrt(NUM.square(sinScore) + NUM.square(cosScore))
        result = {
            "scores":  scoresAmp,
            "functionNum": scoresAmp.shape[1]-1
        }
        return result

    def exportClusterFC(self, outputFC, createPopUps=False):
        """
        Export the andlysis scores and cluster results into the output feature class
        :param outputFC:
        :return:
        """
        bulletList = []
        result = self.clusterResult
        for message in self.clusterResult.pseudoFMessages:
            bulletList.append(message)
        if result.con_Fourier:
            bulletList.append(ARCPY.GetIDMessage(220215).format(self.basisFuncNum))
        bulletMessage = UTILS.outputBulletList(bulletList, ordered=False, force2Txt=False)
        if len(bulletMessage):
            bulletMessage = "\n" + bulletMessage.strip("\n")
            ARCPY.AddMessage(bulletMessage)

        fieldName = "CLUSTER_ID"
        #### append the first cluster result to the cube so it can be used for creating the table/charts ####
        analysisMask = self.cube.obtainVariableMask(self.varName)
        if self.cubeIsPanel:
            clusters = result.clusterIds
        else:
            self.cube.cubeInfo.reset_search_info(mask=analysisMask)
            clusters = NUM.zeros(self.cube.sizeSlice, NUM.int32)
            clusters[analysisMask] = result.clusterIds
        #### Create Cluster Centers ####
        baseCenters = NUM.zeros((len(result.clusterIds, )), dtype=NUM.int32)
        baseCenters[result.centerIDs] = 1
        if self.cubeIsPanel:
            centers = baseCenters
        else:
            centers = NUM.zeros(self.cube.sizeSlice, NUM.int32)
            centers[analysisMask] = baseCenters
        alias = UTILS.formatString("Time-Series Cluster Representative").format(self.varName)
        outputVarName = "TSCLUST_" + self.varName
        self.cube.append(outputVarName + "_CLUSTER", clusters)
        self.cube.append(outputVarName + "_CENTER", centers)
        if not self.cubeIsPanel:
            maskName = self.varName + '_TSCMASK'
            self.cube.createMaskVariable(maskName, analysisMask, varName=outputVarName)
        clusterfield = result.getCandidateField(fieldName=fieldName)
        clusterfield.alias = "Time-Series Cluster ID"
        self.candidateFieldList.append(clusterfield)
        repField = SSDO.CandidateField("CENTER_REP", "LONG",
                                       data=baseCenters,
                                       alias=alias)
        self.candidateFieldList.append(repField)

        ##### Initial Cube Report ####
        outputTable = self.cube.generalCubeReport()
        if len(outputTable):
            outputTable = outputTable[1:]

        if UTILS.couldExportHTMLMessage():
            for m in self.clusterResult.fStatsSummaryTable:
                ARCPY.AddMessage(m)
        else:
            for m in self.clusterResult.fStatsSummaryTable:
                outputTable += m
                outputTable += "\n"

        #### Time-Series Trend Table ####
        self.cube.setTimeSeriesOfClusters(self.varName)
        mkVals = NUM.zeros((self.clusterNum,), dtype=float)
        mkPVals = NUM.zeros((self.clusterNum,), dtype=float)
        for ind in range(self.clusterNum):
            timeSeries = self.cube.meanPerCluster[ind]
            mkVal, mkPVal = ARC._ss.mann_kendall(timeSeries)
            mkVals[ind] = mkVal
            mkPVals[ind] = mkPVal

        trendTable = CUTILS.timeSeriesTrendReport(mkVals, mkPVals)
        outputTable += "\n" + trendTable

        header = ARCPY.GetIDMessage(84964)
        #### Column Labels ####
        total = []
        total.append([ARCPY.GetIDMessage(84790), ARCPY.GetIDMessage(84965)])
        clusterStat = {}
        for cid in result.clusterIds:
            if cid not in clusterStat:
                clusterStat[cid] = 0
            clusterStat[cid] += 1
        #### Add Rows ####
        keys = list(clusterStat.keys())
        keys.sort()
        for cid in keys:
            total.append([str(cid), str(clusterStat[cid])])
        #### Create Output Text Table ####
        total.append("EMPTY")
        clusterTable = UTILS.outputTextTable(total, header=header,
                                             pad=2, colPad=6,
                                             justify=["left", "right"],
                                             titleFillToken="-",
                                             emptyFillToken="-", tableSize="small",
                                             force2Txt=False)
        outputTable += "\n" + clusterTable

        ARCPY.AddMessage(outputTable)

        popupFieldThreshold = 1e7
        appendPopupsSeperately = self.N * self.T > popupFieldThreshold

        startTimes, endTimes = self.cube.getOutputTimeFieldInfo()
        if self.cube.isStartTime:
            t0 = startTimes[0]
        else:
            t0 = endTimes[0]
        data = {
            "rawValues": self.dataOrigin,
            "t0": t0.strftime("%Y/%m/%d %H:%M:%S"),
            "intv": str(self.cube.timeSize),
            "N": self.N,
            "T": self.T,
            "timeUnit": self.cube.timeUnit,
            "clusterIds": self.clusterResult.clusterIds
        }
        if createPopUps:
            if UTILS.isShapeFile(outputFC):
                #### Throw Warning That We Ignore PopUps for Shapefiles ####
                ARCPY.AddIDMessage("WARNING", 110315)
            elif not appendPopupsSeperately:
                self.candidateFieldList.append(
                    CUTILS.generateCubePopupChartFieldFromData(data,
                                                               self.varName,
                                                               theme="TIME_SERIES_CLUSTERING_RESULTS"))
        self.cube.exportFeatures2D(outputFC=outputFC, candidateFieldList=self.candidateFieldList)

        #### For large Dataset, Append the Pop-ups Field seperately ####
        if createPopUps and not UTILS.isShapeFile(outputFC) and appendPopupsSeperately:
            popupFieldName = "HTML_CHART"
            popupFieldAlias = "Time Series HTML Pop-Up"
            batchSize = int(popupFieldThreshold / self.T)
            currentPos = 0
            popupUpdateCursor = None
            totoalUpdated = 0
            while currentPos < self.N:
                rows, maxRowLength = CUTILS.generateCubePopupChartFieldFromData(data, self.varName,
                                                                                theme="TIME_SERIES_CLUSTERING_RESULTS",
                                                                                indStart=currentPos,
                                                                                indEnd=currentPos + batchSize)
                if currentPos == 0:
                    #### Create New Field for the FC ####
                    ARCPY.management.AddFields(
                        outputFC,
                        [[popupFieldName, 'Text', popupFieldAlias, int(maxRowLength * 1.1), None, None]])
                    fields = ['OBJECTID', popupFieldName]
                    popupUpdateCursor = ARCPY.da.UpdateCursor(outputFC, fields)

                localPos = 0
                recordSize = len(rows)
                for r in popupUpdateCursor:
                    r[1] = rows[localPos]
                    popupUpdateCursor.updateRow(r)
                    totoalUpdated += 1
                    localPos += 1
                    if localPos >= recordSize:
                        break

                currentPos += batchSize
