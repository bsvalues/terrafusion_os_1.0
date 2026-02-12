################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.linalg as LA
import scipy.spatial as SCPS
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.analysis as ANA
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import SSCubeObject as SSCO
import Stats as STATS
import WeightsUtilities as WU

#### GLOBALS ####
polynomialAICcPenalty = 3
USE_PYTHON = False

################ Output Field Names #################
bdFCFieldNames = ["ENTROPY", "PVALUES"]
bdFCFieldAlias = ["Entropy", "p-values"]

bdSigFieldName = "LBR_SIG"
bdSigAliasName = "Local Bivariate Relationship Confidence Level"

bdCoefMatchFieldNames = ["PINTERCEPT", "P_COEF_1", "P_COEF_2"]
bdCoefMatchFieldAlias = ["Polynomial Intercept", "Polynomial Coefficient (Linear)",
                         "Polynomial Coefficient (Squared)"]

bdCoefMatchLinearNames = ["INTERCEPT", "COEF_1"]
bdCoefMatchLinearAlias = ["Intercept", "Coefficient (Linear)"]

bdStatMatchFieldNames = ["AICC", "R2", "P_AICc", "P_R2"]
bdStatMatchFieldAlias = ["AICc (Linear)", "r-squared (Linear)",
                         "AICc (Polynomial)", "r-squared (Polynomial)"]

bdTextMatchFieldNames = ["SIG_COEF", "P_SIG_COEF", "LBR_TYPE"]
bdTextMatchFieldAlias = ["Significance of Coefficients (Linear)",
                         "Significance of Coefficients (Polynomial)",
                         "Type of Relationship"]

bdChartFieldName = "HTML_CHART"
bdChartAliasName = "Bivariate HTML Pop-Up"

relationshipLabelMap = {
                        0:'Positive Linear',
                        1:'Negative Linear',
                        2:'Convex',
                        3:'Concave',
                        4: 'Undefined Complex'
                        }

significanceMap = {"90%": .1, "95%": .05, "99%": .01}
significanceBinMap = {"90%": 1, "95%": 2, "99%": 3}
significanceBin2TextMap = {0: "Not Significant", 1: "90% Confidence", 2: "95% Confidence", 3: "99% Confidence"}
R2CUTOFF = .05

def execute(parameters, messages):

    ### Get parameter values ####
    ARCPY.env.overwriteOutput = True
    inputFC = UTILS.getTextParameter(0, parameters)
    depVarName = UTILS.getTextParameter(1, parameters).upper()
    indVarName = UTILS.getTextParameter(2, parameters).upper()
    outputFC = UTILS.getTextParameter(3, parameters)

    numNeighs = UTILS.getNumericParameter(4, parameters)
    if numNeighs is None:
        numNeighs = 30

    permutations = UTILS.getNumericParameter(5, parameters)
    if permutations is None:
        permutations = 199

    createPopUps = parameters[6].value

    significance = UTILS.getTextParameter(7, parameters)
    if significance is None:
        significance = "90%"

    applyFDR = parameters[8].value

    alpha = UTILS.getNumericParameter(9, parameters)
    if alpha is None:
        alpha = 0.5

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    allVars = [depVarName, indVarName]
    ssdo.obtainData(ssdo.oidName, allVars, minNumObs = 31)

    #### Make Sure the Total Number of Features is Larger than 20 ####
    if ssdo.numObs < 20:
        ARCPY.AddIDMessage("Error", 641, 20)
        raise SystemExit()
    #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
    if ssdo.numObs <= numNeighs:
        ARCPY.AddIDMessage("Error", 110265)
        raise SystemExit()

    #### Analysis ####
    bd = ScanDependence(ssdo, depVarName, indVarName, alpha = alpha,
                        numNeighs = numNeighs, permutations = permutations,
                        significance = significance, solveType = "MINIMUM_SPANNING_TREE",
                        createPopUps = createPopUps, applyFDR = applyFDR)

    #### Report ####
    bd.getReport()

    #### Create Output ####
    bd.createOutput(outputFC, applyFDR = applyFDR)

    #### Runtime Render Commands ####
    renderLayerFile = ""
    shapeType = ssdo.shapeType.upper()
    fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                                 "Resources", "ArcToolbox", "Templates", "Layers")
    if shapeType == "POINT":
        renderLayerFile = "BivariateDependence_Points.lyrx"
    if shapeType == "POLYGON":
        renderLayerFile = "BivariateDependence_Polygons.lyrx"
    try:
        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        parameters[3].symbology = fullRLF
    except:
        ARCPY.AddIDMessage("WARNING", 973)


def postExecute(parameters):
    #### Update Pop-up titles ####
    UTILS.postExecuteUpdatePopupTitle(parameters, 3, 6)


def regress(y,x):
    xt = x.T
    xx = NUM.dot(xt, x)
    n,k = x.shape
    fn = n * 1.0
    dof = n-k
    fdof = dof * 1.0
    xxi = LA.inv(xx)

    #### Compute Coefficients ####
    xy = NUM.dot(xt, y)
    coef = NUM.dot(xxi, xy)

    #### Get MaxLik S2 ####
    yBar = (y.sum())/fn
    yHat = NUM.dot(x, coef)
    e = y - yHat
    u2 = e * e
    ess = ( NUM.dot(e.T, e) )[0][0]
    s2 = (ess / fdof)
    s2mle = (ess / fn)
    ss = y - yBar
    tss = ( NUM.dot(ss.T, ss) )[0][0]

    #### Variance-Covariance for Coefficients ####
    varBeta = xxi * s2

    diagVarBeta = varBeta.diagonal()
    if (diagVarBeta <= 0).sum() != 0:
        return coef.ravel(), "*"*k, UTILS.shpFileNull['DOUBLE'], 1.0

    #### Standard Errors / t-Statistics / p-values ####
    r2Adj =  1.0 - ( (ess / (fdof)) / (tss / (fn-1)) )
    seBeta = NUM.sqrt(varBeta.diagonal())
    tStat = (coef.T / seBeta).flatten()
    sigStr = ""
    for varInd in UTILS.ssRange(k):
        #### Robust ####
        try:
            p = STATS.tProb(tStat[varInd], dof, type = 2,
                            silent = True)
        except:
            p =  NUM.nan

        #### Significance Str ####
        if p <= .1:
            sigStr += "*"
        else:
            sigStr += "_"

    #### Log-Likelihood ####
    logLik = -(n / 2.) * (1. + NUM.log(2. * NUM.pi)) - \
                    (n / 2.) * NUM.log(s2mle)

    #### AIC/AICc ####
    k1 = k + 1
    aicc = -2. * logLik + 2. * k1 * (fn / (fn - k1 - 1))

    return coef.ravel(), sigStr, aicc, r2Adj

def pseudo_pvalue(sims, num_larger):
    if ((sims - num_larger) < num_larger):
        num_larger = sims - num_larger

    return (num_larger + 1.0) / (sims + 1.0)


def globalGWRCoincidentPointChecker(ssdo, numNeighs):
    maxCoin = ssdo.counts.max()
    if maxCoin >= numNeighs:
        ARCPY.AddIDMessage("ERROR", 110286, str(maxCoin), str(numNeighs))
        raise SystemExit()


class BivariateDependence(object):
    """Calculates Local Bivariate Dependence based on Entropy. 
    
    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightsFile {str, None}: path to a spatial weights matrix file
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    numNeighs {long, None}: if space concept is NEAREST_NEIGHBOR_GRAPH
    """

    def __init__(self, ssdo, depVarName, indVarName, alpha = .5,
                 numNeighs = None, permutations = 99, significance = "90%",
                 solveType = "MINIMUM_SPANNING_TREE", createPopUps = False,
                 applyFDR = True):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Assure Num Neighs is Viable ####
        if self.numNeighs < 6:
            self.numNeighs = 6

        globalGWRCoincidentPointChecker(ssdo, numNeighs)

        self.__organizeData()

        #### Create Output Field Data ####
        self.pVals = NUM.zeros(self.ssdo.numObs, dtype = float)
        self.coef = NUM.full((self.ssdo.numObs, 2), NUM.nan, dtype = float)
        self.polyCoef = NUM.full((self.ssdo.numObs, 3), NUM.nan, dtype = float)
        self.sigs = NUM.full(self.ssdo.numObs, "", dtype = 'U3')
        self.polySigs = NUM.full(self.ssdo.numObs, "", dtype = 'U3')
        self.types = NUM.full(self.ssdo.numObs, "Not Significant", dtype = 'U30')
        self.aiccs = NUM.full((self.ssdo.numObs, 2), NUM.nan, dtype = float)
        self.r2 = NUM.full((self.ssdo.numObs, 2), NUM.nan, dtype = float)

    def __organizeData(self):
        """Organizes the data for the partitioning algorithms.
        """

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### Linear Transform Variables into [0,1] ####
        self.n = self.ssdo.numObs
        y = ssdo.fields[self.depVarName].returnDouble()
        x = ssdo.fields[self.indVarName].returnDouble()
        if self.n > 1e6:
            ARCPY.AddIDMessage("WARNING", 110305, self.n)

        #### Assure that Variance is Larger than Zero ####
        zeroVarFields = []
        yVar = y.var()
        if NUM.isnan(yVar) or yVar <= 0.0:
            zeroVarFields.append(self.depVarName)

        xVar = x.var()
        if NUM.isnan(xVar) or xVar <= 0.0:
            zeroVarFields.append(self.indVarName)

        #### Error for Constant Fields ####
        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()

        #### Standardize ####
        yMin = y.min()
        yRange = y.max() - yMin
        xMin = x.min()
        xRange = x.max() - xMin
        y = (y - yMin) / yRange
        x = (x - xMin) / xRange

        #### Create Z Matrix ####
        self.z = NUM.zeros((ssdo.numObs, 2), dtype = float)
        self.z[:,0] = y
        self.z[:,1] = x

        #### Create KDTree ####
        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            self.coords = ssdo.spheroidCoords
        else:
            self.coords = ssdo.xyCoords

        self.kdTree = SCPS.cKDTree(self.coords)

    def createOutput(self, outputFC, applyFDR = False):
        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        fieldOrder = []
        candidateFields = {}
        if applyFDR:
            pvBins = self.fdrBins
        else:
            pvBins = self.pvBins

        if USE_PYTHON:
            entropy = self.entropyVals[:,0]
        else:
            entropy = self.entropyVals
        fieldData = [entropy, self.pVals]
        for fieldInd, fieldName in enumerate(bdFCFieldNames):
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", fieldData[fieldInd],
                                                 alias = bdFCFieldAlias[fieldInd])
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        pvSigString = NUM.full(self.ssdo.numObs, "Not Significant", dtype='U30')
        for ind, val in enumerate(pvBins):
            pvSigString[ind] = significanceBin2TextMap[pvBins[ind]]
        candidateField = SSDO.CandidateField(bdSigFieldName, "TEXT", pvSigString,
                                             alias=bdSigAliasName,
                                             length=30)
        candidateFields[bdSigFieldName] = candidateField
        fieldOrder.append(bdSigFieldName)


        #### Add Linear Coefficients ####
        for fieldInd, fieldName in enumerate(bdCoefMatchLinearNames):
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.coef[:,fieldInd],
                                                    alias = bdCoefMatchLinearAlias[fieldInd],
                                                    checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add Polyinomial Coefficients ####
        for fieldInd, fieldName in enumerate(bdCoefMatchFieldNames):
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.polyCoef[:,fieldInd],
                                                    alias = bdCoefMatchFieldAlias[fieldInd],
                                                    checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add Stats ####
        fieldData = [self.aiccs[:,0], self.r2[:,0], self.aiccs[:,1], self.r2[:,1]]
        for fieldInd, fieldName in enumerate(bdStatMatchFieldNames):
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", fieldData[fieldInd],
                                                    alias = bdStatMatchFieldAlias[fieldInd],
                                                    checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add String Fields ####
        fieldData = [self.sigs, self.polySigs, self.types]
        fieldLengths = [3, 3, 30]
        for fieldInd, fieldName in enumerate(bdTextMatchFieldNames):
            candidateField = SSDO.CandidateField(fieldName, "TEXT", fieldData[fieldInd],
                                                    alias = bdTextMatchFieldAlias[fieldInd],
                                                    length = fieldLengths[fieldInd])
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add the HTML field ####
        if self.createPopUps:
            if not UTILS.isShapeFile(outputFC):
                candidateFields[bdChartFieldName] = self.generateChartField()
                fieldOrder.append(bdChartFieldName)
            else:
                #### Throw Warning That We Ignore PopUps for Shapefiles ####
                ARCPY.AddIDMessage("WARNING", 110277)

        #### Write Data to Output Feature Class ####
        appendFields = [self.depVarName, self.indVarName]
        self.ssdo.output2NewFC(outputFC, candidateFields, appendFields = appendFields,
                               fieldOrder = fieldOrder)

    def generateChartField(self):
        template = """<html>
  <head>
    <meta charset = "utf-8">
    <script>
      var XY = @@XY,
        gr = @@gr,
        coef = @@coef,
        rel = @@rel,
        ids = @@ids,
        r2 = @@r2,
        aicc = @@aicc,
        axs = @@axs,
        labels=@@labels,
        lang="@@lang",
        rp = "file:///" + g_resourceFolder + "/";
        var st = document.createElement("script"); 
        st.type = "text/javascript";
        st.src = rp + "ArcToolbox/Scripts/Images/localBivarRelPlot.js";
        document.head.appendChild(st);
    </script>
  </head>
  <body></body>
</html>"""
        resourcePath = OS.path.dirname(OS.path.dirname(OS.path.dirname(__file__)))

        #### Add locale information ####
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

        template = template\
            .replace("@@lang", selectedLang)\
            .replace("@@lbr_js_path", OS.path.join(OS.path.dirname(__file__), "Images", "localBivarRelPlot.js"))

        Xs = self.ssdo.fields[self.indVarName].returnDouble()
        Ys = self.ssdo.fields[self.depVarName].returnDouble()
        XYs = NUM.array([Xs, Ys]).T.tolist()
        XYs = [[UTILS.roundValue(v[0], 4), UTILS.roundValue(v[1], 4)] for v in XYs]
        axs = [self.ssdo.allFields[self.indVarName].alias, self.ssdo.allFields[self.depVarName].alias]
        globalRange = [[UTILS.roundValue(Xs.min(), 4), UTILS.roundValue(Xs.max(), 4)],
                       [UTILS.roundValue(Ys.min(), 4), UTILS.roundValue(Ys.max(), 4)]]

        relationString = {
            'Not Significant': [0, 84511],
            'Positive Linear': [1, 84922],
            'Negative Linear': [2, 84923],
            'Undefined Complex': [5, 84926],
            'Convex': [3, 84925],
            'Concave': [4, 84924]
        }
        coefficients = []
        coefficientSignificance = []
        relations = []
        r2s = []
        aiccs = []
        labels = []
        r2Str = ARCPY.GetIDMessage(84021)
        aiccStr = ARCPY.GetIDMessage(84249)
        explanaryStr = ARCPY.GetIDMessage(84935)
        dependentStr = ARCPY.GetIDMessage(84936)
        lineName = ARCPY.GetIDMessage(84957)
        for ind, typeStr in enumerate(self.types):
            relationInt = relationString[typeStr][0]
            relations.append(relationInt)
            if relationInt in [0, 5]:
                coefficients.append([NUM.nan, NUM.nan, NUM.nan])
                coefficientSignificance.append('')
                r2s.append('null')
                aiccs.append('null')
            elif relationInt in [1, 2]:
                coefs = [UTILS.roundValue(x, 4) for x in self.coef[ind, 0: 2]]
                coefs.append(0)
                coefficients.append(coefs)
                coefficientSignificance.append(self.sigs[ind])
                r2s.append(UTILS.roundValue(self.r2[ind, 0], 4))
                aiccs.append(UTILS.roundValue(self.aiccs[ind, 0], 4))
            elif relationInt in [3, 4, 6, 7]:
                coefficients.append([UTILS.roundValue(x, 4) for x in self.polyCoef[ind, 0: 3]])
                coefficientSignificance.append(self.polySigs[ind])
                r2s.append(UTILS.roundValue(self.r2[ind, 1], 4))
                aiccs.append(UTILS.roundValue(self.aiccs[ind, 1], 4))
            labels.append([lineName, ARCPY.GetIDMessage(relationString[
                                typeStr][1]), r2Str, aiccStr, explanaryStr, dependentStr])

        column = []
        maxLength = 0
        order2MasterMap = self.ssdo.order2Master
        for orderID in range(self.ssdo.numObs):
            values = []
            ids = []
            nids = self.localIDs[orderID]
            if nids[0] != orderID:
                nids = list(nids)
                nids.remove(orderID)
                nids.insert(0, orderID)
            for nid in nids:
                values.append(XYs[nid])
                ids.append(order2MasterMap[nid])
            s = template.replace("@@XY", str(values)) \
                .replace("@@gr", str(globalRange)) \
                .replace("@@coef", str(coefficients[orderID]).replace('nan', 'null')) \
                .replace("@@rel", str(relations[orderID])) \
                .replace("@@ids", str(ids)) \
                .replace("@@r2", str(r2s[orderID])) \
                .replace("@@aicc", str(aiccs[orderID]) if aiccs[orderID] != -NUM.inf else "Number.NEGATIVE_INFINITY") \
                .replace("@@axs", str(axs)) \
                .replace("@@labels", str(labels[orderID]))

            if len(s) > maxLength:
                maxLength = len(s)
            column.append(s)
        maxLength += 10
        candidateField = SSDO.CandidateField(bdChartFieldName, "TEXT",
                                             NUM.array(column, dtype="U" + str(maxLength)),
                                             alias=bdChartAliasName,
                                             length=maxLength)
        return candidateField

    def polynomial_choice(self, orderID, yData, xData):

        #### Linear Regression First ####
        n = self.numNeighs
        fn = n * 1.0
        y = yData.reshape(n,1)

        x = NUM.ones((n, 3), dtype = float)
        x[:,1] = xData
        x[:,2] = xData**(2.0)

        coef, sigStr, aicc, r2 = regress(y, x[:,0:2])
        self.coef[orderID] = coef
        self.sigs[orderID] = sigStr
        self.aiccs[orderID,0] = aicc
        self.r2[orderID,0] = r2

        #### Linear Description Key Index ####
        if coef[1] > 0:
            descriptionKey = 0
            descriptionKey_prev = 0
        else:
            descriptionKey = 1
            descriptionKey_prev = 1

        #### Check for Perfect Linear ####
        perfect = UTILS.compareFloat(1.0, abs(NUM.corrcoef(yData, xData)[0,1])) or \
                  UTILS.compareFloat(1.0, abs(NUM.corrcoef(x[:,1], x[:,2])[0,1]))
        undefinedR2 = r2

        if not perfect:
            p_coef, sigStr, p_aicc, p_r2 = regress(y, x)
            self.polyCoef[orderID] = p_coef
            self.polySigs[orderID] = sigStr
            self.aiccs[orderID,1] = p_aicc
            self.r2[orderID,1] = p_r2

            #### Choose Lower AICc - Advantage To Linear using Global Penalty (Parsimony) ####
            if aicc > (p_aicc + polynomialAICcPenalty):
                undefinedR2 = p_r2
                descriptionKey_prev = (descriptionKey_prev, True)
                if p_coef[2] > 0:
                    descriptionKey = 2
                else:
                    descriptionKey = 3

        #### Assigned Undefined Functions ####
        if undefinedR2 < R2CUTOFF:
            descriptionKey_prev = 3
            descriptionKey = 4

        self.types[orderID] = relationshipLabelMap[descriptionKey]

    def getReport(self):
        """Generates Entire Report for BivariateDependence."""

        self.getCategoryReport()
        self.getEntropyReport()
        self.getFDRReport()

        ARCPY.AddMessage(self.categoryTable)
        ARCPY.AddMessage(self.entropyTable)
        ARCPY.AddMessage(self.significanceTable)

    def getCategoryReport(self):
        """Generates Category Report for BivariateDependence."""

        header =  ARCPY.GetIDMessage(84932)

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84919), ARCPY.GetIDMessage(84920),
                     ARCPY.GetIDMessage(84921)])

        #### Get/Add Summary Values ####
        labels = ['Positive Linear', 'Negative Linear',
                  'Concave', 'Convex',
                  'Undefined Complex', 'Not Significant']
        codes = [84922, 84923, 84924, 84925, 84926, 84511]
        for ind, label in enumerate(labels):
            numLabel = (self.types == label).sum()
            total.append([ARCPY.GetIDMessage(codes[ind]), "{0}".format(numLabel), 
                          UTILS.formatValue(100 * (numLabel / self.ssdo.numObs), "%0.2f")])

        #### Add Total ####
        total.append([ARCPY.GetIDMessage(84355), "{0}".format(self.ssdo.numObs),
                      UTILS.formatValue(100., "%0.2f")])
        total.append("EMPTY")

        #### Create Output Text Table ####
        self.categoryTable = UTILS.outputTextTable(total, header = header, 
                                                   pad = 1, colPad = 2,
                                                   justify = ["left", "left", "right"],
                                                   titleFillToken = "-",
                                                   emptyFillToken = "-", force2Txt=False, returnHTMLMsg=True)

    def getEntropyReport(self):
        """Generates Entropy Report for BivariateDependence."""

        header =  ARCPY.GetIDMessage(84933)

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84919), ARCPY.GetIDMessage(84271),
                      ARCPY.GetIDMessage(84272), ARCPY.GetIDMessage(84261),
                      ARCPY.GetIDMessage(84414)])

        #### Add Rows ####
        data = [self.entropyVals, self.pVals]
        codes = [84927, 84807]
        for ind, code in enumerate(codes):
            values = data[ind]
            total.append([ARCPY.GetIDMessage(code), 
                          UTILS.formatValue(values.min(), "%0.4f"),
                          UTILS.formatValue(values.max(), "%0.4f"),
                          UTILS.formatValue(values.mean(), "%0.4f"),
                          UTILS.formatValue(NUM.median(values), "%0.4f")])

        #### Create Output Text Table ####
        total.append("EMPTY")
        justify = ["left", "right", "right", "right", "right"]
        self.entropyTable = UTILS.outputTextTable(total, header = header,
                                                  pad = 1, colPad = 3, 
                                                  justify = justify,
                                                  titleFillToken = "-",
                                                  emptyFillToken = "-", force2Txt=False, returnHTMLMsg=True)

    def getFDRReport(self):
        """Generates FDR Report for BivariateDependence."""

        header =  ARCPY.GetIDMessage(84934)

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84919), ARCPY.GetIDMessage(84928),
                     ARCPY.GetIDMessage(84929)])

        #### Add Rows ####
        data = [self.significant, self.significantFDR]
        codes = [84930, 84931]
        for ind, code in enumerate(codes):
            values = data[ind]
            numSig = values.sum()
            total.append([ARCPY.GetIDMessage(codes[ind]), "{0}".format(numSig),
                          UTILS.formatValue(100 * (numSig / self.ssdo.numObs), "%0.2f")])

        #### Create Output Text Table ####
        total.append("EMPTY")
        self.significanceTable = UTILS.outputTextTable(total, header = header, 
                                                       pad = 1, colPad = 5,
                                                       justify = ["left", "left", "right"],
                                                       titleFillToken = "-",
                                                       emptyFillToken = "-", force2Txt=False, returnHTMLMsg=True)

class ScanDependence(BivariateDependence):
    """Solves Bivariate Dependence Using Scan Neighbors."""

    def __init__(self, ssdo, depVarName, indVarName, alpha = .5,
                 numNeighs = None, permutations = 99, significance = "90%",
                 solveType = "MINIMUM_SPANNING_TREE",
                 createPopUps = False, applyFDR = True):

        #### Init Super Class ####
        super(ScanDependence, self).__init__(ssdo, depVarName, indVarName, alpha = .5,
                                             numNeighs = numNeighs, permutations = permutations, 
                                             significance = significance,
                                             solveType = solveType, 
                                             createPopUps = createPopUps,
                                             applyFDR = applyFDR)

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Entropy Cutoff ####
        if significance in significanceMap:
            self.cutoff = significanceMap[significance]
        else:
            self.cutoff = .1

        #### Get Links ####
        self.__getLinks()

        #### Calculate ####
        if self.solveType == "NEAREST_NEIGHBOR_GRAPH":
            if USE_PYTHON:
                self.__calculate_knn()
            else:
                self.__calculate_knn_cpp()
        else:
            if USE_PYTHON:
                self.__calculate_mst()
            else:
                self.__calculate_mst_cpp()


    def __getLinks(self):
        #### Shorthand Attributes ####
        ssdo = self.ssdo
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84614), 0, ssdo.numObs, 1)

        #### Local Link Definition Used Everywhere ####
        n = self.numNeighs
        sizeArray = int((n**2.0 - n) / 2)
        looper = NUM.arange(self.numNeighs, dtype = NUM.int32)
        self.links = NUM.zeros((sizeArray, 2), dtype = NUM.int32)
        c = 0
        for i in looper[0:-1]:
            for j in looper[i+1:]:
                self.links[c] = (i, j)
                c += 1

        self.localIDs = {}
        for orderID in range(self.ssdo.numObs):
            coordinates = self.coords[orderID]

            #### Includes Self as Neighbor ####
            info = self.kdTree.query(coordinates, k = self.numNeighs, p = 2)
            self.localIDs[orderID] = NUM.array(info[1], dtype=int)
            if ARCPY.env.isCancelled:
                break
            ARCPY.SetProgressorPosition()

    def __calculate_mst_cpp(self):
        e = ARC._ss.Entropy(self.z, self.links, self.localIDs, self.numNeighs)
        if e.can_solve:
            randSeed = UTILS.getRandomSeed()
            numThreads = UTILS.getNumberOfThreadsDefault()
            e.solve_mst(self.permutations, self.alpha, random_seed = randSeed, 
                        num_threads = numThreads)
            self.entropyVals = e.entropy
            self.pVals = e.p_values
        else:
            raise SystemExit()

        #### Set Significance Bins and Run Regressions ####
        self.__setBinsAndRegress()

    def __calculate_mst(self):
        denom = self.numNeighs**(1.0 - self.alpha)
        self.entropyVals = NUM.zeros((self.ssdo.numObs, self.permutations + 1), dtype = float)
        origins = self.links[:,0]
        dest = self.links[:,1]
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, self.ssdo.numObs, 1)
        for orderID in range(self.ssdo.numObs):

            #### Map Global Def to Local Indices ####
            localIDs = self.localIDs[orderID]
            z = self.z[localIDs]
            y = z[:,0]
            x = z[:,1]

            #### Use Zero-Based IDs for MST Solve ####
            squaredDiffY = (y[origins] - y[dest])**2.0
            dist = (squaredDiffY + (x[origins] - x[dest])**2.0) ** (self.alpha / 2.0)
            info = ARC._ss.min_span_tree(self.links, dist, self.numNeighs)
            weights = info[1]
            entropy = weights.sum() / denom
            self.entropyVals[orderID, 0] = entropy
            #### Chenck the local variance of x and y, if any one is 0, return P =1 ####
            if NUM.cov(x) == 0.0 or NUM.cov(y) == 0.0:
                self.pVals[orderID] = 1
            else:
                numSmaller = 0
                for perm in range(self.permutations):
                    #### Permute Local ID Order and Recalculate the Xs Only ####
                    permIDs = RAND.permutation(localIDs)
                    permX = self.z[permIDs][:,1]
                    pDist = (squaredDiffY + (permX[origins] - permX[dest])**2.0) ** (self.alpha / 2.0)
                    rInfo = ARC._ss.min_span_tree(self.links, pDist, self.numNeighs)
                    rWeights = rInfo[1]
                    pEntropy = rWeights.sum() / denom
                    self.entropyVals[orderID, perm+1] = pEntropy
                    numSmaller += pEntropy < entropy

                #### One-Sided Test ####
                p = (numSmaller + 1.0) / (self.permutations + 1.0)
                self.pVals[orderID] = p

            ARCPY.SetProgressorPosition()

        #### Set Significance Bins and Run Regressions ####
        self.__setBinsAndRegress()

    def __calculate_knn_cpp(self):
        e = ARC._ss.Entropy(self.z, self.links, self.localIDs, self.numNeighs)
        if e.can_solve:
            randSeed = UTILS.getRandomSeed()
            numThreads = UTILS.getNumberOfThreadsDefault()
            e.solve_knn(self.permutations, self.alpha, random_seed = randSeed, 
                        num_threads = numThreads)
            self.entropyVals = e.entropy
            self.pVals = e.p_values
        else:
            raise SystemExit()

        #### Set Significance Bins and Run Regressions ####
        self.__setBinsAndRegress()

    def __calculate_knn(self):
        p = (1.0 - self.alpha)
        scale = 1.0 / p
        denom = self.numNeighs**((1 - p))
        self.entropyVals = NUM.zeros((self.ssdo.numObs, self.permutations + 1), dtype = float)
        origins = self.links[:,0]
        dest = self.links[:,1]

        #### Get Empirical Gamma Constant and Update Denom ####
        gamma = NUM.zeros(self.permutations, dtype = float)
        for perm in range(self.permutations):
            localIDs = RAND.randint(0, self.ssdo.numObs, self.numNeighs)
            z = self.z[localIDs]
            y = z[:,0]
            x = z[:,1]

            #### Use Zero-Based IDs for Graph Solve ####
            squaredDiffY = (y[origins] - y[dest])**2.0
            dist = NUM.sqrt(squaredDiffY + (x[origins] - x[dest])**2.0)**self.alpha
            entropy = dist.sum() / denom
            gamma[perm] = entropy

        gamma = gamma.mean() 
        denom = gamma * denom

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, self.ssdo.numObs, 1)
        for orderID in range(self.ssdo.numObs):

            #### Map Global Def to Local Indices ####
            localIDs = self.localIDs[orderID]
            z = self.z[localIDs]
            y = z[:,0]
            x = z[:,1]

            #### Use Zero-Based IDs for Graph Solve ####
            squaredDiffY = (y[origins] - y[dest])**2.0
            dist = NUM.sqrt(squaredDiffY + (x[origins] - x[dest])**2.0)**self.alpha
            entropy = scale * NUM.log(dist.sum() / denom)
            self.entropyVals[orderID, 0] = entropy

            #### Check Local Variance ####
            if not (z.var(0) == 0).sum():
                numSmaller = 0
                for perm in range(self.permutations):
                    #### Permute Local ID Order and Recalculate the Xs Only ####
                    permIDs = RAND.permutation(localIDs)
                    permX = self.z[permIDs][:,1]
                    pDist = NUM.sqrt(squaredDiffY + (permX[origins] - permX[dest])**2.0)**self.alpha
                    pEntropy = scale * NUM.log(pDist.sum() / denom)
                    self.entropyVals[orderID, perm+1] = pEntropy
                    numSmaller += pEntropy < entropy

                #### One-Sided Test ####
                p = (numSmaller + 1.0) / (self.permutations + 1.0)
                self.pVals[orderID] = p
            else:
                self.pVals[orderID] = 1.0

            ARCPY.SetProgressorPosition()

        #### Set Significance Bins and Run Regressions ####
        self.__setBinsAndRegress()

    def __setBinsAndRegress(self):
        if USE_PYTHON:
            rawVals = self.entropyVals[:,0]
        else:
            rawVals = self.entropyVals
        meanVal = rawVals.mean()
        fdr = STATS.fdrTransform(self.pVals, rawVals, mean = meanVal)
        self.fdrBins = abs(fdr)

        self.pvBins = NUM.zeros(self.ssdo.numObs, dtype = NUM.int32)
        for orderID, pv in enumerate(self.pVals):
            if pv <= .01:
                self.pvBins[orderID] = 3
            elif pv <= .05:
                self.pvBins[orderID] = 2
            elif pv <= .1:
                self.pvBins[orderID] = 1

        #### Polynomial Significance Boolean ####
        intCutoff = significanceBinMap[self.significance]
        self.significant = self.pvBins >= intCutoff
        self.significantFDR = self.fdrBins >= intCutoff
        if self.applyFDR:
            runRegression = self.significantFDR
        else:
            runRegression = self.significant

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84902), 0, self.ssdo.numObs, 1)
        for orderID in range(self.ssdo.numObs):

            #### Match Distributions ####
            if runRegression[orderID]:

                #### Map Global Def to Local Indices ####
                localIDs = self.localIDs[orderID]
                z = self.z[localIDs]
                y = z[:,0]
                x = z[:,1]

                self.polynomial_choice(orderID, y, x)

            ARCPY.SetProgressorPosition()