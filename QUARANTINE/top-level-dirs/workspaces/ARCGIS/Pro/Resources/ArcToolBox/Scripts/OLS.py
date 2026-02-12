# coding: utf-8
"""
Tool Name:     Ordinary Least Squares
Source Name:   OLS.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Runs OLS and produces standard output.
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.linalg as LA
import numpy.random as RAND
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import locale as LOCALE
import warnings as WARNINGS
import copy as COPY
import textwrap as TWP
LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
olsCoefFieldNames = ["Variable", "Coef", "StdError", "t_Stat", "Prob",
                     "Robust_SE", "Robust_t", "Robust_Pr", "StdCoef"]

olsDiagFieldNames = ["Diag_Name", "Diag_Value", "Definition"]

olsFCFieldNames = ["Estimated", "Residual", "StdResid"]

############### Methods ###############

def execute(parameters, messages):

    #### Get User Provided Inputs ####
    inputFC = UTILS.getTextParameter(0, parameters)
    masterField = UTILS.getTextParameter(1, parameters)
    outputFC = UTILS.getTextParameter(2, parameters)
    depVarName = UTILS.getTextParameter(3, parameters).upper()
    indVarNames = UTILS.getTextParameter(4, parameters).upper()
    indVarNames = indVarNames.split(";")

    #### Get User Provided Optional Output Table Parameters ####
    coefTable = UTILS.getTextParameter(5, parameters)
    diagTable = UTILS.getTextParameter(6, parameters)
    reportFile = UTILS.getTextParameter(7, parameters)

    #### Create SSDataObject ####
    fieldList = [depVarName] + indVarNames
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                useChordal = False)

    #### Populate SSDO with Data ####
    ssdo.obtainData(masterField, fieldList, minNumObs = 5)

    #### Call OLS Class for Regression ####
    ols = OLS(ssdo, depVarName, indVarNames)

    #### Print Results ####
    ols.report()

    #### Spatial Autocorrelation Warning ####
    ARCPY.AddIDMessage("WARNING", 851)

    #### Create Output Feature Class ####
    ols.outputResults(outputFC, parameters)
    outFCBase = OS.path.basename(outputFC).split(".")[0]

    #### Construct Output Database Tables if User-Specified ####
    if coefTable:
        #### Resolve Complete Table Name ####
        coefPath, coefName = OS.path.split(coefTable)
        if coefPath == "":
            coefPath = OS.path.split(ssdo.catPath)[0]
            coefTable = OS.path.join(coefPath, coefName)

        #### Check that Table Will not Overwrite OutputFC ####
        if OS.path.basename(coefTable).split(".")[0] == outFCBase:
            ARCPY.AddIDMessage("WARNING", 943, coefTable)
        else:
            ols.createCoefficientTable(coefTable)

    if diagTable:
        #### Resolve Complete Table Name ####
        diagPath, diagName = OS.path.split(diagTable)
        if diagPath == "":
            diagPath = OS.path.split(ssdo.catPath)[0]
            diagTable = OS.path.join(diagPath, diagName)

        #### Check that Table Will not Overwrite OutputFC ####
        if OS.path.basename(diagTable).split(".")[0] == outFCBase:
            ARCPY.AddIDMessage("WARNING", 943, diagTable)
        else:
            ols.createDiagnosticTable(diagTable)

    #### Create Report File ####
    if reportFile:
        ols.createOutputGraphic(reportFile)

def writeVarColHeaders(grid, colLabs):
    for ind, label in enumerate(colLabs):
        if ind == 0:
            justify = "left"
        else:
            justify = "right"
        grid.writeCell((grid.rowCount, ind), label,
                        justify = justify)
    grid.stepRow()

class OLS(object):
    """Computes linear regression via Ordinary Least Squares.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (kxk) Variance-Covariance Matrix
    seCoef (array): (kx1) Standard Errors for Coeffs
    tStats (array): (kx1) Student-t statistics
    pVals (array): k pvalues for tStats (two sided test)
    varCoefRob (array): (kxk) Variance-Covariance Matrix
    seCoefRob (array): (kx1) Standard Errors for Coeffs
    tStatsRob (array): (kx1) Student-t statistics
    pValsRob (array): k pvalues for tStats (two sided test)
    r2 (float): R-Squared
    r2Adj (float): Adjusted R-Squared
    s2 (float): OLS Estimate of the variance of residuals
    s2mle (float): ML Estimate of the variance of residuals
    coefTable (str): Results for printing
    diagTable (str): Results for printing
    interpretTable (str): Help on intepreting results
    BP (float): Breusch-Pagan test for Heteroskedasticity
    BPProb (float): Probability for BP
    JB (float): Jarque-Bera test for normality of residuals
    JBProb (float): Probability for JB
    fStat (float): F-Test for overall sign. of regression
    fProb (float): Probability for JointStat
    waldStat (float): Robust Wald test for overall sign. of regression
    waldProb (float): Probability for waldStat
    vifVal (str,array): Either an error message or result

    METHODS:
    initialize
    calculate
    createCoefficientReport
    createDiagnosticReport
    createInterpretReport
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.warnedTProb = False

        #### Initialize Data ####
        self.initialize()

        #### Calculate Statistic ####
        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")
            self.calculate()
            #### Create Reports ####
            self.createCoefficientReport()
            self.createDiagnosticReport()
            self.createInterpretReport()

    def initialize(self):
        """Performs additional validation and populates the
        SSDataObject."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### MasterField Can Not Be The Dependent Variable ####
        if ssdo.masterField == self.depVarName:
            ARCPY.AddIDMessage("ERROR", 945, ssdo.masterField,
                               ARCPY.GetIDMessage(84112))
            raise SystemExit()

        #### Remove the MasterField from Independent Vars ####
        if ssdo.masterField in self.indVarNames:
            self.indVarNames.remove(ssdo.masterField)
            ARCPY.AddIDMessage("WARNING", 736, ssdo.masterField)

        #### Remove the Dependent Variable from Independent Vars ####
        if self.depVarName in self.indVarNames:
            self.indVarNames.remove(self.depVarName)
            ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Raise Error If No Independent Vars ####
        if not len(self.indVarNames):
            ARCPY.AddIDMessage("ERROR", 737)
            raise SystemExit()

        #### Create Dependent Variable ####
        self.allVars = [self.depVarName] + self.indVarNames
        yData = ssdo.fields[self.depVarName].returnDouble()
        self.n = ssdo.numObs
        self.y = NUM.empty((self.n, 1), dtype = float)
        self.y[:,0] = yData

        #### Assure that Variance is Larger than Zero ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        #### Create Design Matrix ####
        self.k = len(self.indVarNames) + 1
        self.x = NUM.ones((self.n, self.k), dtype = float)
        for column, variable in enumerate(self.indVarNames):
            self.x[:,column + 1] = ssdo.fields[variable].data

    def calculate(self):
        """Performs OLS and related diagnostics."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        x = self.x
        y = self.y
        n = self.n
        k = self.k

        #### General Information ####
        fn = n * 1.0
        dof = n - k

        #### Assure DOF is Larger than 1 ####
        if dof <= 2:
            ARCPY.AddIDMessage("ERROR", 1128, 2)
            raise SystemExit()

        fdof = dof * 1.0
        xt = x.T
        yt = y.T
        xx = NUM.dot(xt, x)

        try:
            xxi = LA.inv(xx)
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### Compute Coefficients ####
        xy = NUM.dot(xt, y)
        coef = NUM.dot(xxi, xy)

        #### Compute Standardized Coefficients ####
        ySTD = y.std()
        xSTD = x.std(0)
        stdRatio = xSTD / ySTD
        self.coefSTD = stdRatio * coef.flatten()

        #### Residuals, Sum Of Squares, R2, Etc. ####
        yHat = NUM.dot(x, coef)
        yBar = (y.sum())/fn
        e = y - yHat
        ess = ( NUM.dot(e.T, e) )[0][0]
        s2 = (ess / fdof)
        s2mle = (ess / fn)
        seResiduals = NUM.sqrt(s2)
        ss = y - yBar
        tss = ( NUM.dot(ss.T, ss) )[0][0]
        r2 = 1.0 - (ess/tss)
        r2Adj =  1.0 - ( (ess / (fdof)) / (tss / (fn-1)) )
        u2 = e * e

        #### Variance-Covariance for Coefficients ####
        varBeta = xxi * s2

        #### Standard Errors / t-Statistics ####
        seBeta = NUM.sqrt(varBeta.diagonal())
        tStat = (coef.T / seBeta).flatten()

        #### Bad Probabilities - Near Multicollinearity ####
        badProbs = NUM.isnan(seBeta).sum() != 0

        #### White's Robust Standard Errors ####
        dofScale =  (int( n / (n - k) )) * 1.0
        sHat = NUM.dot((u2 * x).T, x) * dofScale
        varBetaRob = NUM.dot(NUM.dot(xxi, sHat), xxi)
        seBetaRob =  NUM.sqrt(varBetaRob.diagonal())
        tStatRob = (coef.T / seBetaRob).flatten()

        #### DOF Warning Once for t-Stats ####
        silentVector = [ True for i in range(k) ]
        if (2 <= dof <= 4) and not self.warnedTProb:
            silentVector[0] = False
            self.warnedTProb = True

        #### Coefficient t-Tests ####
        pVals = NUM.empty((k,), float)
        pValsRob = NUM.empty((k,), float)
        for varInd in UTILS.ssRange(k):
            #### General ####
            try:
                p = STATS.tProb(tStat[varInd], dof, type = 2,
                                silent = silentVector[varInd])
            except:
                p =  NUM.nan
                badProbs = True
            pVals[varInd] = p

            #### Robust ####
            try:
                p = STATS.tProb(tStatRob[varInd], dof, type = 2,
                                silent = True)
            except:
                p =  NUM.nan
                badProbs = True
            pValsRob[varInd] = p

        #### Jarque-Bera Test For Normality of the Residuals ####
        muE = (e.sum()) / fn
        devE = e - muE
        u3 = (devE**3.0).sum() / fn
        u4 = (devE**4.0).sum() / fn
        denomS = s2mle**1.5
        denomK = s2mle**2.0
        skew = u3 / denomS
        kurt = u4 / denomK
        self.JB = (n/6.) * ( skew**2. + ( (kurt - 3.)**2. / 4. ))
        if self.JB >= 0.0:
            self.JBProb = STATS.chiProb(self.JB, 2, type = 1)
        else:
            self.JBProb = NUM.nan
            badProbs = True

        #### Breusch-Pagan Test for Heteroskedasticity ####
        u2y = NUM.dot(xt, u2)
        bpCoef = NUM.dot(xxi, u2y)
        u2Hat = NUM.dot(x, bpCoef)
        eU = u2 - u2Hat
        essU = NUM.dot(eU.T, eU)
        u2Bar = (u2.sum()) / fn
        ssU = u2 - u2Bar
        tssU = NUM.dot(ssU.T, ssU)
        r2U = 1.0 - (essU/tssU)
        self.BP = (fn * r2U)[0][0]
        if self.BP >= 0.0:
            self.BPProb = STATS.chiProb(self.BP, (k-1), type = 1)
        else:
            self.BPProb = NUM.nan
            badProbs = True

        #### Classic Joint-Hypothesis F-Test ####
        q = k - 1
        fq = q * 1.0
        self.fStat = (r2/fq) / ((1 - r2) / (fn - k))
        try:
            self.fProb = abs(STATS.fProb(self.fStat, q,
                                      (n-k), type = 1))
        except:
            self.fProb = NUM.nan
            badProbs = True

        #### Wald Robust Joint Hypothesis Test ####
        R = NUM.zeros((q,k))
        R[0:,1:] = NUM.eye(q)
        Rb = NUM.dot(R, coef)

        try:
            invRbR = LA.inv( NUM.dot(NUM.dot(R, varBetaRob), R.T) )
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        self.waldStat = ( NUM.dot(NUM.dot(Rb.T, invRbR), Rb) )[0][0]
        if self.waldStat >= 0.0:
            self.waldProb = STATS.chiProb(self.waldStat, q, type = 1)
        else:
            self.waldProb = NUM.nan
            badProbs = True

        #### Log-Likelihood ####
        self.logLik = -(n / 2.) * (1. + NUM.log(2. * NUM.pi)) - \
                       (n / 2.) * NUM.log(s2mle)

        #### AIC/AICc ####
        k1 = k + 1
        self.aic = -2. * self.logLik + 2. * k1
        self.aicc = -2. * self.logLik + 2. * k1 * (fn / (fn - k1 - 1))

        #### Calculate the Variance Inflation Factor ####
        if k <= 2:
            self.vifVal = ARCPY.GetIDMessage(84090)
            self.vif = False
        else:
            xTemp = xt[1:]
            corX = NUM.corrcoef(xTemp)

            try:
                ic = LA.inv(corX)
            except:
                #### Perfect multicollinearity, cannot proceed ####
                ARCPY.AddIDMessage("ERROR", 639)
                raise SystemExit()

            self.vifVal = ic.diagonal()
            self.vif = True

        #### Set Attributes ####
        self.dof = dof
        self.coef = coef
        self.yHat = yHat
        self.yBar = yBar
        self.residuals = e
        self.seResiduals = seResiduals
        self.stdResiduals = e / self.seResiduals
        self.ess = ess
        self.tss = tss
        self.varCoef = varBeta
        self.seCoef = seBeta
        self.tStats = tStat
        self.pVals = pVals
        self.varCoefRob = varBetaRob
        self.seCoefRob = seBetaRob
        self.tStatsRob = tStatRob
        self.pValsRob = pValsRob
        self.r2 = r2
        self.r2Adj = r2Adj
        self.s2 = s2
        self.s2mle = s2mle
        self.q = q
        self.badProbs = badProbs
        self.varLabels = [ARCPY.GetIDMessage(84064)] + self.indVarNames

    def createCoefficientReport(self):
        """Creates a formatted summary table of the OLS
        coefficients."""

        #### Table Title ####
        header =  ARCPY.GetIDMessage(84075)
        aFoot = ARCPY.GetIDMessage(84080)
        bFoot = ARCPY.GetIDMessage(84086)
        cFoot = ARCPY.GetIDMessage(84103)
        coefColLab = [ARCPY.GetIDMessage(84049), UTILS.buildSuperscript(aFoot)]
        probColLab = [ARCPY.GetIDMessage(84055), UTILS.buildSuperscript(bFoot)]
        robColLab = [ARCPY.GetIDMessage(84102), UTILS.buildSuperscript(bFoot)]
        vifColLab = [ARCPY.GetIDMessage(84284), UTILS.buildSuperscript(cFoot)]

        #### Column Labels ####
        total = [[ARCPY.GetIDMessage(84068), coefColLab,
                  ARCPY.GetIDMessage(84051), ARCPY.GetIDMessage(84053),
                  probColLab, ARCPY.GetIDMessage(84097),
                  ARCPY.GetIDMessage(84101), robColLab]]

        totalRaw = [[ARCPY.GetIDMessage(84068), f"{ARCPY.GetIDMessage(84049)} [{aFoot}]",
                  ARCPY.GetIDMessage(84051), ARCPY.GetIDMessage(84053),
                  f"{ARCPY.GetIDMessage(84055)} [{bFoot}]", ARCPY.GetIDMessage(84097),
                  ARCPY.GetIDMessage(84101), f"{ARCPY.GetIDMessage(84102)} [{bFoot}]"]]

        if self.vif:
            total[0].append(vifColLab)
            totalRaw[0].append(f"{ARCPY.GetIDMessage(84284)} [{cFoot}]" )

        #### Loop Through Explanatory Variables ####
        for row in UTILS.ssRange(self.k):
            #### Variable Name ####
            rowVals = [self.varLabels[row]]
            rowValsRaw = [self.varLabels[row]]

            #### Standard Values ####
            rowVals.append(UTILS.formatValue(self.coef[row, 0]))
            rowVals.append(UTILS.formatValue(self.seCoef[row]))
            rowVals.append(UTILS.formatValue(self.tStats[row]))
            rowVals.append(UTILS.writePVal(self.pVals[row], padNonSig = True, returnHTMLElement=True))

            #### Robust Values ####
            rowVals.append(UTILS.formatValue(self.seCoefRob[row]))
            rowVals.append(UTILS.formatValue(self.tStatsRob[row]))
            rowVals.append(UTILS.writePVal(self.pValsRob[row],
                                           padNonSig = True, returnHTMLElement=True))

            #### Standard Values ####
            rowValsRaw.append(UTILS.formatValue(self.coef[row, 0]))
            rowValsRaw.append(UTILS.formatValue(self.seCoef[row]))
            rowValsRaw.append(UTILS.formatValue(self.tStats[row]))
            rowValsRaw.append(UTILS.writePVal(self.pVals[row], padNonSig=True, returnHTMLElement=False))

            #### Robust Values ####
            rowValsRaw.append(UTILS.formatValue(self.seCoefRob[row]))
            rowValsRaw.append(UTILS.formatValue(self.tStatsRob[row]))
            rowValsRaw.append(UTILS.writePVal(self.pValsRob[row],
                                           padNonSig=True, returnHTMLElement=False))

            #### VIF ####
            if self.vif:
                if row == 0:
                    rowVIF = ARCPY.GetIDMessage(84092)
                else:
                    rowVIF = self.vifVal[(row - 1)]
                    if abs(rowVIF) > 1000:
                        rowVIF = "> 1000.0"
                    else:
                        rowVIF = LOCALE.format_string("%0.6f", rowVIF)
                rowVals.append(rowVIF)
                rowValsRaw.append(rowVIF)

            #### Append Row to Result List ####
            total.append(rowVals)
            totalRaw.append(rowValsRaw)

        #### Finalize Coefficient Table ####
        self.coefTable = UTILS.outputTextTable(total, header = header,
                                               titleFillToken="-", pad = 1, justify = "right",
                                               returnHTMLMsg=True, force2Txt=False)
        self.coefTablePlain = UTILS.outputTextTable(total, header = header,
                                                    titleFillToken="-", pad = 1, justify = "right",
                                                    returnHTMLMsg=True, force2Txt=True)
        self.coefRaw = totalRaw

    def createDiagnosticReport(self):
        """Creates a formatted summary table of the OLS
        diagnostics."""

        #### Create PValue Array ####
        allPVals = NUM.array( [self.fProb, self.waldProb,
                               self.BPProb, self.JBProb] )

        #### Check For Any Significance for Extra Padding ####
        signFlag = NUM.any(allPVals <= 0.05)

        #### Table Title ####
        header = ARCPY.GetIDMessage(84076)
        feet = [84104, 84105, 84106, 84107]
        feet = [ ARCPY.GetIDMessage(i) for i in feet ]
        dFoot, eFoot, fFoot, gFoot = feet
        dFoot = ARCPY.GetIDMessage(84104)

        row1 = [ARCPY.GetIDMessage(84253),
                self.ssdo.inName,
                '  ' + ARCPY.GetIDMessage(84254),
                UTILS.padValue(self.depVarName, significant = signFlag)]

        aiccLab = ['  ' + ARCPY.GetIDMessage(84251), UTILS.buildSuperscript(dFoot)]
        row2 = [ARCPY.GetIDMessage(84093),
                str(self.n), aiccLab,
                UTILS.padValue(UTILS.formatValue(self.aicc),
                               significant = signFlag)]
        row2Raw = [ARCPY.GetIDMessage(84093),
                str(self.n), f"  {ARCPY.GetIDMessage(84251)}{[dFoot]}",
                UTILS.padValue(UTILS.formatValue(self.aicc),
                               significant=signFlag)]

        r2Lab = [ARCPY.GetIDMessage(84019), UTILS.buildSuperscript(dFoot)]
        adjR2Lab = ['  ' + ARCPY.GetIDMessage(84022), UTILS.buildSuperscript(dFoot)]
        row3 = [r2Lab, UTILS.formatValue(self.r2),
                adjR2Lab,
                UTILS.padValue(UTILS.formatValue(self.r2Adj),
                               significant = signFlag)]
        row3Raw = [f"{ARCPY.GetIDMessage(84019)}{[dFoot]}", UTILS.formatValue(self.r2),
                f"  {ARCPY.GetIDMessage(84022)}{[dFoot]}",
                UTILS.padValue(UTILS.formatValue(self.r2Adj),
                               significant=signFlag)]

        fdofLab = ARCPY.GetIDMessage(84028)
        fLab = [ARCPY.GetIDMessage(84025), UTILS.buildSuperscript(eFoot)]
        row4 = [fLab, UTILS.formatValue(self.fStat),
                "  " + fdofLab.format(self.q, self.dof),
                UTILS.writePVal(self.fProb, padNonSig = True, returnHTMLElement=True)]
        row4Raw = [f"{ARCPY.GetIDMessage(84025)}{[eFoot]}", UTILS.formatValue(self.fStat),
                "  " + fdofLab.format(self.q, self.dof),
                UTILS.writePVal(self.fProb, padNonSig=True, returnHTMLElement=False)]

        chiMess = ARCPY.GetIDMessage(84034)
        wLab = [ARCPY.GetIDMessage(84031), UTILS.buildSuperscript(eFoot)]
        row5 = [wLab, UTILS.formatValue(self.waldStat),
                "  " + chiMess.format(self.q),
                UTILS.writePVal(self.waldProb, padNonSig = True, returnHTMLElement=True)]
        row5Raw = [f"{ARCPY.GetIDMessage(84031)}{[eFoot]}", UTILS.formatValue(self.waldStat),
                "  " + chiMess.format(self.q),
                UTILS.writePVal(self.waldProb, padNonSig=True, returnHTMLElement=False)]

        kLab = [ARCPY.GetIDMessage(84037), UTILS.buildSuperscript(fFoot)]
        row6 = [kLab, UTILS.formatValue(self.BP),
                '  '+ chiMess.format(self.q),
                UTILS.writePVal(self.BPProb, padNonSig = True, returnHTMLElement=True)]
        row6Raw = [f"{ARCPY.GetIDMessage(84037)}{[fFoot]}", UTILS.formatValue(self.BP),
                '  ' + chiMess.format(self.q),
                UTILS.writePVal(self.BPProb, padNonSig=True, returnHTMLElement=False)]

        jbLab = [ARCPY.GetIDMessage(84043), UTILS.buildSuperscript(gFoot)]
        row7 = [jbLab, UTILS.formatValue(self.JB),
                '  '+ chiMess.format(2),
                UTILS.writePVal(self.JBProb, padNonSig = True, returnHTMLElement=True)]
        row7Raw = [f"{ARCPY.GetIDMessage(84043)}{[gFoot]}", UTILS.formatValue(self.JB),
                '  ' + chiMess.format(2),
                UTILS.writePVal(self.JBProb, padNonSig=True, returnHTMLElement=False)]

        #### Finalize Diagnostic Table ####
        diagTotal = [ row1, row2, row3, row4, row5, row6, row7 ]
        diagJustify = ["left", "right", "left", "right"]
        diagTotalRaw = [ row1, row2Raw, row3Raw, row4Raw, row5Raw, row6Raw, row7Raw ]

        self.diagTable = UTILS.outputTextTable(diagTotal,
                                               header = header, pad = 1, titleFillToken="-",
                                               justify = diagJustify, returnHTMLMsg=True,
                                               emphasizeHeadRow=False,
                                               force2Txt=False)

        self.diagTablePlain = UTILS.outputTextTable(diagTotal,
                                               header = header, pad = 1, titleFillToken="-",
                                               justify = diagJustify, returnHTMLMsg=True,
                                               force2Txt=True)
        self.diagRaw = diagTotalRaw
        self.diagJustify = diagJustify

    def createInterpretReport(self):
        """Creates the interpretation table for OLS."""

        #### Generate Interpretation Table #####
        header =  ARCPY.GetIDMessage(84081)

        #### Set up Rows in Tables ####
        decimalSep = UTILS.returnDecimalChar()
        if decimalSep == ".":
            pValue = "0.01"
            VIF = "7.5"
        else:
            pValue = "0,01"
            VIF = "7,5"

        significance = [ARCPY.GetIDMessage(84111), ARCPY.GetIDMessage(84082).format(pValue)]
        coefficient = [ARCPY.GetIDMessage(84080), ARCPY.GetIDMessage(84349)]
        probs = [ARCPY.GetIDMessage(84086), ARCPY.GetIDMessage(84350).format(pValue)]
        multicoll = [ARCPY.GetIDMessage(84103), ARCPY.GetIDMessage(84083).format(VIF)]
        rSquared = [ARCPY.GetIDMessage(84104), ARCPY.GetIDMessage(84084)]
        jointFW = [ARCPY.GetIDMessage(84105), ARCPY.GetIDMessage(84085).format(pValue)]
        bpRow = [ARCPY.GetIDMessage(84106), ARCPY.GetIDMessage(84087).format(pValue)]
        jbRow = [ARCPY.GetIDMessage(84107), ARCPY.GetIDMessage(84088).format(pValue)]

        #### Finalize Interpretation Table ####
        intTotal = [significance, coefficient, probs, multicoll,
                    rSquared, jointFW, bpRow, jbRow]

        intTotalRaw = COPY.deepcopy(intTotal)
        for row in intTotalRaw[1:]:
            row[0] = f"[{row[0]}]"

        self.interpretTable = UTILS.outputTextTable(intTotal, pad = 1, header=header,
                                                    titleFillToken="-", justify = ["center", "left"],
                                                    returnHTMLMsg=True, emphasizeHeadRow=False,
                                                    force2Txt=False)

        self.interpretTablePlain = UTILS.outputTextTable(intTotal, pad = 1, header=header,
                                                         titleFillToken="-", justify = ["center", "left"],
                                                         returnHTMLMsg=True, force2Txt=True)
        self.interpretRaw = intTotalRaw

    def createCoefficientTable(self, tableName):
        """Creates Output Coefficient Database Table for OLS.

        INPUTS:
        tableName (str): catalog path to the output table
        """

        #### Set Progressor ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84071), force2Txt=False))
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84071))
        outPath, outName = OS.path.split(tableName)

        #### Set Up Field Names and Types ####
        inputFields = UTILS.getFieldNames(olsCoefFieldNames, outPath)
        inputTypes = ["TEXT", "DOUBLE", "DOUBLE",
                      "DOUBLE", "DOUBLE", "DOUBLE",
                      "DOUBLE", "DOUBLE", "DOUBLE"]

        #### Set Up Input Data ####
        inputData = []
        coefList = list(self.coef.flatten())
        for rowInd, rowVal in enumerate(coefList):
            inputData.append( (self.varLabels[rowInd], rowVal,
                               self.seCoef[rowInd], self.tStats[rowInd],
                               self.pVals[rowInd], self.seCoefRob[rowInd],
                               self.tStatsRob[rowInd], self.pValsRob[rowInd],
                               self.coefSTD[rowInd])
                             )

        #### Write Coefficient Table ####
        UTILS.createOutputTable(tableName, inputFields,
                                inputTypes, inputData)

    def createDiagnosticTable(self, tableName):
        """Creates Output Diagnostic Database Table for OLS.

        INPUTS:
        tableName (str): catalog path to the output table
        """

        #### Set Progressor ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84098), force2Txt=False))
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84098))
        outPath, outName = OS.path.split(tableName)

        #### Set Up Field Names and Types ####
        inputFields = UTILS.getFieldNames(olsDiagFieldNames, outPath)
        inputTypes = ["TEXT", "DOUBLE", "TEXT"]

        #### Set Up Input Data ####
        inputData = []
        diags = [84114, 84249, 84018, 84021, 84024, 84027, 84030,
                 84033, 84036, 84039, 84042, 84045, 84062]

        desc = [84116, 84250, 84020, 84023, 84026, 84029, 84032,
                84035, 84038, 84041, 84044, 84047, 84063]

        diags = [ ARCPY.GetIDMessage(i) for i in diags ]
        desc = [ ARCPY.GetIDMessage(i) for i in desc ]

        stats = [self.aic, self.aicc, self.r2, self.r2Adj,
                 self.fStat, self.fProb, self.waldStat, self.waldProb,
                 self.BP, self.BPProb, self.JB, self.JBProb, self.s2]

        for rowInd, rowVal in enumerate(stats):
            inputData.append( (diags[rowInd], rowVal, desc[rowInd]) )

        #### Write Diagnostic Table ####
        UTILS.createOutputTable(tableName, inputFields,
                                inputTypes, inputData)

    def report(self, fileName = None):
        """Generate Text and Graphical Output."""

        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, "{0}\n".format(self.coefTablePlain))
            UTILS.writeText(f, "{0}\n".format(self.diagTablePlain))
            UTILS.writeText(f, "{0}".format(self.interpretTablePlain))
            f.close()
        else:
            ARCPY.AddMessage(self.coefTable)
            ARCPY.AddMessage(self.diagTable)
            ARCPY.AddMessage(self.interpretTable)

            #### Report if Bad Probabilities Found ####
            if self.badProbs:
                ARCPY.AddIDMessage("WARNING", 738)

    def outputResults(self, outputFC, parameters = None):
        """Creates output feature class."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)
        resultDict = {}
        fieldOrder = UTILS.getFieldNames(olsFCFieldNames, outPath)
        fieldData = [self.yHat.flatten(), self.residuals.flatten(),
                     self.stdResiduals.flatten()]

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        for fieldInd, fieldName in enumerate(fieldOrder):
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE",
                                                 fieldData[fieldInd])
            candidateFields[fieldName] = candidateField

        #### Write Data to Output Feature Class ####
        ssdo.output2NewFC(outputFC, candidateFields,
                          appendFields = self.allVars,
                          fieldOrder = fieldOrder)

        #### Set Default Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderType = UTILS.renderType[ssdo.shapeType.upper()]
            if renderType == 0:
                renderLayerFile = "StdResidPoints.lyrx"
            elif renderType == 1:
                renderLayerFile = "StdResidPolylines.lyr"
            else:
                renderLayerFile = "StdResidPolygons.lyr"

            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[2].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)


    def createOutputGraphic(self, fileName):
        """Create OLS Output Report File.

        INPUTS
        fileName (str): path to output report file (*.pdf)
        """
        import SSReport as REPORT
        import matplotlib.gridspec as GRIDSPEC
        from scipy.stats import norm as NORM

        #### Set Progressor ####
        writeMSG = ARCPY.GetIDMessage(84186)
        ARCPY.SetProgressor("step", writeMSG, 0, 6, 1)
        ARCPY.AddMessage(UTILS.outputParagraph(writeMSG, force2Txt=False))

        #### Set Colors ####
        colors = NUM.array(["#4575B5", "#849EBA", "#C0CCBE", "#FFFFBF",
                            "#FAB984", "#ED7551", "#D62F27"])
        cutoffs = NUM.array([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5])

        #### Set Data ####
        stdRes = self.stdResiduals.flatten()
        predicted = self.yHat.flatten()

        #### Create PDF Output ####
        pdfOutput = REPORT.openPDF(fileName)

        ##### Make Coefficient Table ####
        title = ARCPY.GetIDMessage(84075) + " - " + ARCPY.GetIDMessage(84370)
        contStr = ARCPY.GetIDMessage(84377)
        varTitlePlus = title + " " + contStr

        numCols = 9
        report = REPORT.startNewReport(9, title = title, landscape = True,
                                       titleFont = REPORT.ssTitleFont)
        grid = report.grid
        colLabs = self.coefRaw[0]
        tabVals = self.coefRaw[1:]

        #### Create Column Labels ####
        writeVarColHeaders(grid, colLabs)

        #### Loop Through Explanatory Variables ####
        for row in UTILS.ssRange(self.k):
            if grid.rowCount >= 20:
                #### Finalize Page ####
                grid.finalizeTable()
                report.write(pdfOutput)

                #### New Page ####
                report = REPORT.startNewReport(9, title = varTitlePlus,
                                               landscape = True,
                                               titleFont = REPORT.ssTitleFont)
                grid = report.grid
                writeVarColHeaders(grid, colLabs)

            #### Variable Name ####
            rowVals = tabVals[row]
            for ind, val in enumerate(rowVals):
                justify = "right"
                gridPlot = report.fig.add_subplot(grid.gridSpec[grid.rowCount, ind])
                if ind in [4, 7]:
                    if not val.count("*"):
                        x0 = .925
                elif ind == 0:
                    justify = "left"
                    x0 = 0.0
                else:
                    x0 = 1.0

                #### Limit Col Value Length to 12 ####
                if ind in [0, 1, 2, 5, 8]:
                    val = val[0:12]

                gridPlot.text(x0, 0.5, val,
                              fontproperties = REPORT.ssFont,
                              horizontalalignment = justify,
                              **REPORT.bAlignment)
                gridPlot.set_axis_off()

            grid.stepRow()
        grid.createLineRow(grid.rowCount, startCol = 0, endCol = numCols)
        grid.finalizeTable()

        #### Add To PDF ####
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        #### Diagnostic Table/Interpret Tables ####
        numCols = 6
        title = ARCPY.GetIDMessage(84076)
        titlePlus = title + " " + contStr
        report = REPORT.startNewReport(numCols, title = title,
                                       landscape = True, numRows = 22,
                                       titleFont = REPORT.ssTitleFont)
        grid = report.grid
        ind2Col = {0:0, 1:1, 2:3, 3:5}

        for rowInd, row in enumerate(self.diagRaw):
            maxRowCount = 1
            for ind, val in enumerate(row):
                #### Wrap Col Length to 16 ####
                if rowInd == 0:
                    if ind not in [0,2]:
                        val = TWP.fill(val, 16)
                        maxRowCount = max(maxRowCount, val.count("\n") + 1)

                #### Set Col Info ####
                justify = self.diagJustify[ind]
                if ind == 2:
                    colspan = 2
                else:
                    colspan = 1
                col = ind2Col[ind]
                grid.writeCell((grid.rowCount, col), val,
                                justify = justify, colspan = colspan)
            for i in range(0, maxRowCount, 2):
                grid.stepRow()
        grid.createEmptyRow()

        #### Add Footnotes ####
        notesMSG = ARCPY.GetIDMessage(84081)
        grid.writeCell((grid.rowCount, 0), notesMSG,
                        colspan = 2, fontObj = REPORT.ssBoldFont,
                        justify = "left")
        grid.stepRow()


        #### Set Line Width Based on Non-Latin Font File ####
        if REPORT.fontFilePathName is None:
            splitLineAt = 145
        else:
            splitLineAt = 100

        #### Draw Interpretation Notes ####
        for note in self.interpretRaw:
            text = " ".join(note)
            lines = REPORT.splitFootnote(text, splitLineAt)
            for line in lines:
                if grid.rowCount >= 22:
                    #### Finalize Page ####
                    grid.finalizeTable()
                    report.write(pdfOutput)

                    #### New Page ####
                    report = REPORT.startNewReport(numCols, title = titlePlus,
                                               landscape = True, numRows = 22,
                                               titleFont = REPORT.ssTitleFont)

                    grid = report.grid

                #### Write Footnote ####
                grid.writeCell((grid.rowCount, 0), line,
                                colspan = 2, justify = "left")
                grid.stepRow()

        grid.finalizeTable()

        #### Add To PDF ####
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        ##### Make Scatterplot Matrices ####
        k = len(self.indVarNames)
        title = ARCPY.GetIDMessage(84371)
        titlePlus = title + " " + contStr
        report = REPORT.startNewReport(6, title = title,
                                       landscape = True, numRows = 4,
                                       titleFont = REPORT.ssTitleFont)
        grid = report.grid

        #### Loop Through Explanatory Variables ####
        seq = list(NUM.arange(0, k, 5))
        if seq[-1] < k:
            seq.append(k)

        for ind, s in enumerate(seq[0:-1]):
            if grid.rowCount == 4:
                #### Finalize Page ####
                grid.finalizeTable()
                report.write(pdfOutput)

                #### New Page ####
                report = REPORT.startNewReport(6, title = titlePlus,
                                               landscape = True, numRows = 4,
                                               titleFont = REPORT.ssTitleFont)
                grid = report.grid

            #### New Group of Vars ####
            e = seq[ind + 1]
            values = self.x[:,(s+1):(e+1)]
            numVars = e - s
            varNames = self.indVarNames[s:e]
            lenRow = len(varNames)

            #### Histogram ####
            for vInd, vName in enumerate(varNames):
                data = values[:,vInd]
                gridPlot = report.fig.add_subplot(grid.gridSpec[grid.rowCount, vInd])
                gridPlot.hist(data)
                gridPlot.xaxis.set_visible(False)
                gridPlot.yaxis.set_visible(False)
                gridPlot.set_title(vName[0:14],
                                   fontproperties = REPORT.ssBoldFont)


            #### Add Dep Var ####
            gridPlot = report.fig.add_subplot(grid.gridSpec[grid.rowCount, lenRow])
            gridPlot.hist(self.y)
            gridPlot.xaxis.set_visible(False)
            gridPlot.yaxis.set_visible(False)
            gridPlot.set_title(self.depVarName[0:14],
                               fontproperties = REPORT.ssBoldFont)
            grid.stepRow()

            for vInd, vName in enumerate(varNames):
                xVals = values[:,vInd]
                m = NUM.polyfit(xVals, self.y, 1)
                yFit = NUM.polyval(m, xVals)
                gridPlot = report.fig.add_subplot(grid.gridSpec[grid.rowCount, vInd])
                gridPlot.scatter(xVals, self.y, s = 10, edgecolors = None,
                                 linewidths = 0.05)
                gridPlot.plot(xVals, yFit, color='k', lw = 1, alpha = .7)
                gridPlot.xaxis.set_visible(False)
                gridPlot.yaxis.set_ticks([])
                if vInd == 0:
                    gridPlot.yaxis.set_label_text(self.depVarName[0:14],
                                     fontproperties = REPORT.ssBoldFont)
            grid.stepRow()


        #### Add Help Text ####
        if grid.rowCount == 4:
            #### Finalize Page ####
            grid.finalizeTable()
            report.write(pdfOutput)

            #### New Page ####
            report = REPORT.startNewReport(6, title = titlePlus,
                                           landscape = True, numRows = 4,
                                           titleFont = REPORT.ssTitleFont)
            grid = report.grid

        #### Get Help Info ####
        #### Set Line Width Based on Non-Latin Font File ####
        if REPORT.fontFilePathName is None:
            splitLineAt = 110
        else:
            splitLineAt = 55
        helpTxt1 = REPORT.splitFootnote(ARCPY.GetIDMessage(84403), splitLineAt)
        helpTxt2 = REPORT.splitFootnote(ARCPY.GetIDMessage(84404), splitLineAt)
        helpTxt1 = "\n".join(helpTxt1)
        helpTxt2 = "\n".join(helpTxt2)
        helpTxt = helpTxt1 + "\n\n" + helpTxt2
        grid.writeCell((grid.rowCount, 0), helpTxt,
                        fontObj = REPORT.ssBigFont,
                        colspan = 6, justify = "left")
        grid.stepRow()

        #### Finalize Page ####
        grid.finalizeTable()

        #### Add To PDF ####
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        #### Histogram of Residuals ####
        title = ARCPY.GetIDMessage(84341)
        titlePlus = title + " " + contStr
        numCols = 10
        report = REPORT.startNewReport(numCols, title = title,
                                       landscape = True,
                                       titleFont = REPORT.ssTitleFont,
                                       numRows = 30)
        numRows = report.numRows
        grid = report.grid
        gridPlot = report.fig.add_subplot(grid.gridSpec[0:22, 1:(numCols-1)])

        #### Add Histogram ####
        n, bins, patches = gridPlot.hist(stdRes, 15, density = True,
                                         facecolor='#8400A8', alpha=0.75)

        #### Bell Curve ####
        x = NUM.arange(-3.5, 3.5, 0.01)
        y = NORM.pdf(x, 0, 1)
        gridPlot.plot(x, y, color='blue', lw=1, linestyle = "-")

        #### Axis Info ####
        gridPlot.yaxis.grid(True, linestyle='-', which='both',
                            color='lightgrey', alpha=0.5)
        gridPlot.set_ylabel(ARCPY.GetIDMessage(84055),
                            fontproperties = REPORT.ssLabFont)
        gridPlot.set_xlabel(ARCPY.GetIDMessage(84337),
                            fontproperties = REPORT.ssLabFont)

        #### Text Box ####
        grid.rowCount = 25

        #### Set Line Width Based on Non-Latin Font File ####
        if REPORT.fontFilePathName is None:
            splitLineAt = 120
        else:
            splitLineAt = 80

        infoRows = REPORT.splitFootnote(ARCPY.GetIDMessage(84421),
                                        splitLineAt)
        for row in infoRows:
            if grid.rowCount >= numRows:
                #### Finalize Page ####
                grid.finalizeTable()
                report.write(pdfOutput)

                #### New Page ####
                report = REPORT.startNewReport(numCols, title = titlePlus,
                                               landscape = True,
                                               titleFont = REPORT.ssTitleFont)
                grid = report.grid

            grid.writeCell((grid.rowCount, 0), row, colspan = numCols,
                           justify = "left", fontObj = REPORT.ssBigFont)
            grid.stepRow()

        #### Add To PDF ####
        grid.finalizeTable()
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        #### Scatterplot of Std. Residuals and Predicted Y ####
        title = ARCPY.GetIDMessage(84336)
        numCols = 10
        report = REPORT.startNewReport(numCols, title = title,
                                       landscape = False,
                                       titleFont = REPORT.ssTitleFont,
                                       numRows = 32)
        numRows = report.numRows
        grid = report.grid
        gridPlot = report.fig.add_subplot(grid.gridSpec[0:20, 1:(numCols-1)])

        #### Best Fit Line ####
        sortedYHatInd = NUM.argsort(predicted)
        sortedYHat = predicted[sortedYHatInd]
        sortedSTDRes = stdRes[sortedYHatInd]
        m = NUM.polyfit(sortedYHat, sortedSTDRes, 1)
        yFit = NUM.polyval(m, sortedYHat)
        gridPlot.plot(sortedYHat, yFit, color='k', lw = 2, alpha = .7)

        #### Plot Values ####
        binVals = NUM.digitize(stdRes, cutoffs)
        binColors = colors[binVals]
        gridPlot.scatter(predicted, stdRes, s = 30, c = binColors)

        #### Labels ####
        gridPlot.set_ylabel(ARCPY.GetIDMessage(84337),
                            fontproperties = REPORT.ssLabFont)
        gridPlot.set_xlabel(ARCPY.GetIDMessage(84338),
                            fontproperties = REPORT.ssLabFont)
        gridPlot.yaxis.grid(True, linestyle='-', which='both',
                            color='lightgrey', alpha=0.5)

        #### Text Box ####
        grid.rowCount = 23

        #### Set Line Width Based on Non-Latin Font File ####
        if REPORT.fontFilePathName is None:
            splitLineAt = 60
        else:
            splitLineAt = 30

        infoRows = REPORT.splitFootnote(ARCPY.GetIDMessage(84422),
                                        splitLineAt)
        numLines = len(infoRows)
        if numLines > 9:
            #### Place Text and Small Scatter on Next Page ####
            grid.finalizeTable()
            report.write(pdfOutput)

            #### New Page ####
            titlePlus = title + " " + contStr
            report = REPORT.startNewReport(numCols, title = titlePlus,
                                           landscape = False,
                                           titleFont = REPORT.ssTitleFont,
                                           numRows = 32)
            grid = report.grid

        startGrid = grid.rowCount * 1
        for row in infoRows:
            grid.writeCell((grid.rowCount, 0), row, colspan = 7,
                           justify = "left", fontObj = REPORT.ssBigFont)
            grid.stepRow()

        #### Random Scatter ####
        scatLines = 8
        scatEnd = startGrid + scatLines
        gridPlot = report.fig.add_subplot(grid.gridSpec[startGrid:scatEnd, 7:10])
        RAND.seed(seed=100)
        rN = 200
        randRes = RAND.normal(0, 1, (rN,))
        randPred = RAND.normal(0, 1, (rN,))
        randX = NUM.ones((rN,2))
        randX[:,1] = randRes
        coef, sumRes, rank, s = LA.lstsq(randX, randPred, rcond = 1)
        randYHat = NUM.dot(randX, coef)
        randE = randPred - randYHat
        ess = (randE**2.0).sum()
        fdof = (rN - 2) * 1.0
        s2 = ess / fdof
        se = NUM.sqrt(s2)
        seRandE = randE / se

        sortedXP = NUM.argsort(randYHat)
        sRandPred = randYHat[sortedXP]
        sRandRes = seRandE[sortedXP]
        mRand = NUM.polyfit(sRandPred, sRandRes, 1)
        yRandFit = NUM.polyval(mRand, sRandPred)
        gridPlot.plot(sRandPred, yRandFit, color='k', lw = 1, alpha = .7)

        binValsR = NUM.digitize(seRandE, cutoffs)
        binColorsR = colors[binValsR]
        gridPlot.scatter(randYHat, seRandE, s = 10, c = binColorsR,
                         edgecolors = None, linewidths = 0.05)
        gridPlot.yaxis.grid(True, linestyle='-', which='both',
                                 color='lightgrey', alpha=0.5)
        gridPlot.yaxis.set_ticks([0])
        gridPlot.yaxis.set_ticklabels([])
        meanY = randYHat.mean()
        gridPlot.xaxis.set_ticks([meanY])
        gridPlot.xaxis.set_ticklabels([ARCPY.GetIDMessage(84340)],
                                 fontproperties = REPORT.ssLabFont)
        RAND.seed()

        #### Adjust Row Count to End of Lines/Scatter ####
        if numLines < scatLines:
            grid.rowCount = startGrid + scatLines

        #### Add To PDF ####
        grid.finalizeTable()
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        ##### Add Dataset/Parameter Info ####
        paramLabels = [84253, 84359, 84360, 84112]
        paramLabels = [ ARCPY.GetIDMessage(i) for i in paramLabels ]
        paramValues = [TWP.fill(self.ssdo.inputFC, 50).replace("\n", " "), self.ssdo.masterField,
                       self.ssdo.templateFC, self.depVarName]

        #### Set Analysis Field Names ####
        countRows = len(paramLabels) + 1
        maxVarLen = 100
        varLines = [ i[0:(maxVarLen - 1)] for i in self.indVarNames ]
        for ind, varLine in enumerate(varLines):
            if ind == 0:
                paramLabels.append(ARCPY.GetIDMessage(84402))
            elif countRows >= 20:
                paramLabels.append(ARCPY.GetIDMessage(84402))
                countRows = 1
            else:
                paramLabels.append("")
            countRows += 1
            paramValues.append(varLine)

        #### Add Selection Set Boolean ####
        paramLabels.append(ARCPY.GetIDMessage(84418))
        paramValues.append(str(self.ssdo.selectionSet))

        title = ARCPY.GetIDMessage(84372)
        REPORT.createParameterPage(paramLabels, paramValues,
                                   title = title,
                                   pdfOutput = pdfOutput,
                                   titleFont = REPORT.ssTitleFont)
        ARCPY.SetProgressorPosition()

        #### Finish Up ####
        ARCPY.AddMessage(fileName)
        pdfOutput.close()

