# coding: utf-8
"""
 Source Name:   Stats.py
 Version:       ArcGIS 10.1
 Author:        Environmental Systems Research Institute Inc.
 Description:   Probability Helper Functions
"""

################### Imports ########################
import arcgisscripting as ARC
import arcpy as ARCPY
import numpy as NUM
import numpy.linalg as LA
import SSUtilities as UTILS

################### Methods ########################

def oneSidedPermPV(sims, testStat):
    permDenom = len(sims) + 1
    return ((sims >= testStat).sum() + 1) / permDenom
    #return 1 - (((sims < testStat).sum()) / (len(sims) + 1))

def twoSidedPermPV(sims, testStat):
    permDenom = len(sims) + 1
    p1 = ((sims <= testStat).sum() + 1) / permDenom
    p2 = ((sims >= testStat).sum() + 1) / permDenom
    return min(1.0, (2.0 * min(p1, p2)))

def tProb(t, dof, type = 0, silent = False):
    """Calculates the area under the curve of the studentized-t
    distribution. (A)
    
    INPUTS:
    t (float): t-statistic
    dof (int): degrees of freedom
    type {int, 0}: {0,1,2} (See (1))

    NOTES: 
    (1) 0 = area under the curve to the left
        1 = area under the curve to the right
        2 = two-tailed test

    REFERENCES:
    (A) Source - Algorithm AS 27: Applied Statistics, Vol. 19(1), 1970
    """

    if dof <= 1:
        #### Must Have More Than One Degree of Freedom ####
        ARCPY.AddIDMessage("ERROR", 1128, 1)
        raise SystemExit()
    else:
        if (2 <= dof <= 4) and not silent:
            #### Warn if Less Than Five Degrees of Freedom ####
            ARCPY.AddIDMessage("WARNING", 1130)
    
    return ARC._ss.t_prob(t, dof, type)

def zProb(x, type = 0):
    """Calculates the area under the curve of the standard normal
    distribution. (A)

    INPUTS:
    z (float): z-statistic
    type {int, 0}: {0,1,2} (See (1))

    NOTES: 
    (1) 0 = area under the curve to the left
        1 = area under the curve to the right
        2 = two-tailed test

    REFERENCES:
    (A) Algorithm AS 66: Applied Statistics, Vol. 22(3), 1973
    """

    return ARC._ss.z_prob(x, type)

def chiProb(x, dof, type = 0):
    """Calculates the area under the curve for the chi-squared 
    distribution. (A)

    INPUTS:
    x (float): t-statistic
    dof (int): degrees of freedom
    type {int, 0}: {0,1} (See (1))

    NOTES: 
    (1) 0 = area under the curve to the left
        1 = area under the curve to the right
    
    REFERENCES:
    (A) Algorithm 299: Communications of the ACM, Vol. 10(4), 1967
    """

    bigX = 18. # based on simulations
    if x < 0:
        #### No Negative Values ####
        ARCPY.AddIDMessage("ERROR", 1131)
        raise SystemExit()
    if dof < 1: 
        #### Must Have More Than One Degree of Freedom ####
        ARCPY.AddIDMessage("ERROR", 1128, 1)
        raise SystemExit()
    a = 0.5 * x
    if a > bigX:
        y = 0.0
    else:
        y = NUM.exp(-a)
    if dof%2 == 0: 
        even = 1
    else:
        even = 0
    if even:
        s = y
    else:
        s = 2.0 * zProb( -NUM.sqrt(x))
    if dof == 1:
        pvalue = s
    else:
        x = .5 * (dof - 1.0)
        if even:
            z = 1.0
        else:
            z = 0.5
        if a > bigX:
            if even:
                e = 0.0
            else:
                e = 0.572364942925
            c = NUM.log(a)
            while z <= x:
                e = NUM.log(z) + e
                s = NUM.exp( (c*z) - a - e ) + s
                z += 1.0
            pvalue = s
        else:
            if even:
                e = 1.0
            else:
                e = 0.564189583548 / NUM.sqrt(a)
            c = 0
            while z <= x:
                e = e * (a/z)
                c = c + e
                z += 1.0
            pvalue = (c * y) + s
    
    if not type:
        pvalue = 1 - pvalue
        
    return pvalue

def fProb(x, m, n, type = 0):
    """Calculates the area under the curve for the F-distribution. (A)
    
    INPUTS:
    m (int): degrees of freedom
    n (int): degrees of freedom
    type {int, 0}: {0,1} (See (1))

    OUTPUT:
    x (float): F-test statistic

    NOTES: 
    (1) 0 = area under the curve to the left
        1 = area under the curve to the right

    REFERENCES: 
    (A) Algorithm 322: Communications of the ACM, Vol. 11(2), 1968
    """

    mf = 1.0 * m
    nf = 1.0 * n
    a = 2 * (m / 2) - m + 2
    b = 2 * (n / 2) - n + 2
    w = x * (mf/nf)
    z = 1.0 / (1.0+w)
    if a == 1:
        if b == 1:
            p = NUM.sqrt(w)
            y = 0.3183098862
            d = y * z / p
            p = 2 * y * NUM.arctan(p)
        else:
            p = NUM.sqrt(w*z)
            d = 0.5 * p * z / w
    else:
        if b == 1:
            p = NUM.sqrt(z)
            d = 0.5 * z * p
            p = 1 - p
        else:
            d = z * z
            p = w * z
    y = 2.0 * w / z
    j = b + 2
    while j <= n:
        d = (1 + (1.*a) / (j - 2)) * d * z
        if a == 1:
            p = p + d * y / (j - 1)
        else:
            p = (p + w) * z 
        j += 2
    y = w * z
    z = 2.0 / z
    b = n - 2
    i = a + 2
    while i <= m:
        j = i + b
        d = y * d * j / (i - 2)
        p = p - z * d / j
        i += 2
    if type == 1:
        p = 1.0 - p
    return p

def qNorm(p):
    """
    Lower tail quantile for standard normal distribution function. (A)

    INPUTS:
    p (float): probability value

    OUTPUT:
    q (float): quantile value

    REFERENCES: 
    (A) Dan Field's python adaption of Peter Acklam's code:
           
        http://home.online.no/~pjacklam/notes/invnorm/#Other_algorithms

    ORIGINAL NOTES:    

        Modified from the author's original perl code (original comments
        follow below) by dfield@yahoo-inc.com.  May 3, 2004.

        This function returns an approximation of the inverse cumulative
        standard normal distribution function.  I.e., given P, it returns
        an approximation to the X satisfying P = Pr{Z <= X} where Z is a
        random variable from the standard normal distribution.

        The algorithm uses a minimax approximation by rational functions
        and the result has a relative error whose absolute value is less
        than 1.15e-9.

        Author:      Peter J. Acklam
        Time-stamp:  2000-07-19 18:26:14
        E-mail:      pjacklam@online.no
        WWW URL:     http://home.online.no/~pjacklam
    """
    # Changed to floats to address Coverity CID 278238
    if p <= 0.0 and p >= 1.0:
        #### No Negative Values, Values must be between 0 - 1 ####
        ARCPY.AddIDMessage("ERROR", 1129)
        raise SystemExit()

    #### Coefficients in rational approximations ####
    a = (-3.969683028665376e+01,  2.209460984245205e+02, \
         -2.759285104469687e+02,  1.383577518672690e+02, \
         -3.066479806614716e+01,  2.506628277459239e+00)
    b = (-5.447609879822406e+01,  1.615858368580409e+02, \
         -1.556989798598866e+02,  6.680131188771972e+01, \
         -1.328068155288572e+01 )
    c = (-7.784894002430293e-03, -3.223964580411365e-01, \
         -2.400758277161838e+00, -2.549732539343734e+00, \
          4.374664141464968e+00,  2.938163982698783e+00)
    d = ( 7.784695709041462e-03,  3.224671290700398e-01, \
          2.445134137142996e+00,  3.754408661907416e+00)

    #### Define break-points ####
    plow  = 0.02425
    phigh = 1 - plow

    #### Rational approximation for lower region ####
    if p < plow:
       q  = NUM.sqrt(-2*NUM.log(p))
       return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)

    #### Rational approximation for upper region ####
    if phigh < p:
       q  = NUM.sqrt(-2*NUM.log(1-p))
       return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)

    #### Rational approximation for central region ####
    q = p - 0.5
    r = q*q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / \
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)

def pseudoPValue(testStat, permValues):
    numPerms = len(permValues)
    numLarger = (permValues >= testStat).sum()
    if (numPerms - numLarger) < numLarger:
        numSmaller = (permValues <= testStat).sum()
        pValue = ((numSmaller + 1.0) * 2.0) / (numPerms + 1.0)
    else:
        pValue = ((numLarger + 1.0) * 2.0) / (numPerms + 1.0)

    return pValue

def uniqueCounts(x):
    if x.dtype != float:
        x = x * 1.0
    counts = ARC._ss.unique_counts(x)
    if type(counts) == int:
        return NUM.ones((counts,), dtype = float)
    else:
        return counts

def firstIndexInArray(data, value):
    try:
        return next((idx for idx, val in NUM.ndenumerate(data) if val == value))[0]
    except StopIteration:
        return None

def lastIndexInBins(data, bins, knn = 20):
    ss = NUM.searchsorted(bins, data)
    counts = NUM.bincount(ss)
    endNeighs = NUM.cumsum(counts)

    #### Assure At Least KNN ####
    endNeighs[endNeighs < knn] = knn

    #### Add All Neighs to Any Larger Bins that Were Not Counted ####
    numBins = len(bins)
    nn = len(endNeighs)
    if len(endNeighs) != numBins:
        diffSize = numBins - nn
        newEndNeighs = NUM.ones(numBins, dtype = NUM.int32) * len(data)
        newEndNeighs[0:nn] = endNeighs
        endNeighs = newEndNeighs

    return endNeighs


######################## Histogram Methods ############################

def squareRootBins(n):
    return int(NUM.sqrt(n * 1.0))

def sturgesBins(n):
    return int(NUM.log2(n) + 1)

def riceBins(n):
    return int(2.0 * (n**(1./3)))

def doane(data):
    meanData = data.mean()
    topSkew = ((data - meanData)**3.0).sum()
    bottomSkew = (((data - meanData)**2.0).sum())**(3./2.)
    skew = topSkew / bottomSkew
    n = len(data) * 1.0
    left = 1 + NUM.log2(n)
    sig = NUM.sqrt( (6.0 * (n - 2.0)) / ( (n + 1.0) * (n + 3.0) ) )
    right = NUM.log2( 1.0 + (NUM.abs(skew) / sig) )
    return int(left + right)

def riskFunBins(data, minNumBreaks = 10, maxNumBreaks = 100, stepSize = 5):
    minData = float(data.min())
    maxData = float(data.max())
    rangeData = maxData - minData
    numBreaks = NUM.arange(minNumBreaks, maxNumBreaks + stepSize, stepSize)
    numResults = len(numBreaks)
    trials = NUM.zeros((numResults,), float)
    for ind, numBreak in enumerate(numBreaks):
        bins = NUM.array(data / numBreak, dtype = 'int32') * 1.0
        uniqueBins = uniqueCounts(bins)
        meanBins = uniqueBins.mean()
        varBins = ((uniqueBins - meanBins)**2.0).sum() / (len(uniqueBins) * 1.0)
        delta = rangeData / numBreak * 1.0
        result = ((2.0 * meanBins) - varBins) / (delta**2.0)
        trials[ind] = result
    
    minFunIndex = trials.argmin()
    return numBreaks[minFunIndex]

######################## Inequality Measures ##########################

class TheilsT(object):
    """Calculates the Classic Theil's T Index of Inequality.

    INPUTS:
    values (array): nxk variable(s) to calculate the index on.

    ATTRIBUTES:
    T (float): Theil's T Index for given variables
    n (int): number of observations
    k {int, None}: number of fields/variables
    sumVals (float): sum of all the values in each column
    meanVals (float): mean of all values in each column
    """

    def __init__(self, values):
        shapeVals = values.shape
        if len(shapeVals) > 1:
            n,k = shapeVals
        else:
            n = shapeVals[0]
            k = 1

        sumVals = values.sum(0) * 1.0
        propSum = values / sumVals
        meanVals = values.mean(0)
        logNMean = NUM.log(n*propSum)
        meanLogMean = propSum*logNMean
        self.T = meanLogMean.sum(0)
        self.values = values
        self.sumVals = sumVals
        self.meanVals = meanVals
        self.n = n
        self.k = k

    def decompose(self, partition):
        uniqueParts = NUM.unique(partition)
        nParts = len(uniqueParts)
        between = NUM.zeros((nParts, self.k))
        c = 0
        for part in uniqueParts:
            partVals = self.values[NUM.where(partition == part)]
            nPart = len(partVals)
            nRatio = nPart / (self.n * 1.0)
            valRatio = partVals.sum(0) / self.sumVals
            between[c] = nRatio * NUM.log( nRatio / valRatio )
            c += 1
        between = between.sum(0)
        self.within = self.T - between
        self.between = between


################## Rate Methods ######################

class RateHomegeneity(object):
    """Test of Homegeneity of Binomial Proportions.

    INPUTS:
    count (array, n): count values 
    pop (array, n): population values

    ATTRIBUTES:
    n (int): number of features
    chi2 (float): chi-squared statistic of homogeneity
    pvalue (float): probability value

    SOURCE:
    (1)  Anselin, L., Lozano, N., and Koschinsky, J. (2006). 
         Rate Transformations and Smoothing
         GeoDa Center Research Report.
    (2)  Klein, Martin, and Peter Linton. 
         On a Comparison of Tests of Homogeneity of Binomial Proportions
         Journal of Statistical Theory and Applications 12.3 (2013): 208-224.
    (3)  Nass, C. A. G. 
         The χ 2 test for small expectations in contingency tables, 
         with special reference to accidents and absenteeism.
         Biometrika 46.3/4 (1959): 365-385.
    """
    def __init__(self, counts, pop, family = "BINOMIAL"):
        from scipy.stats import chi2 as CHI2
        self.n = len(counts)
        ni = pop * 1.0
        xi = counts * 1.0

        if family == "BINOMIAL":
            k = self.n * 1.0
            nPlus = ni.sum() 
            xPlus = xi.sum()
            pi = xPlus / nPlus
            piI = xi / ni
            tp = ( (ni * (piI - pi)**2.0) / (pi * (1.0 - pi)) ).sum()
            rho = (nPlus - 2.0) / (nPlus - 1.0)
            mu = ((k - 1.0) * (nPlus - k)) / (nPlus - 1.0)
            sigma = ((nPlus / xPlus) + (nPlus / (nPlus - xPlus)) - 4.0) / (nPlus - 2.0)
            tau = (nPlus * (1.0 / ni).sum() - k**2.0) / (nPlus - 2.0)
            expectedValue = ((k - 1.0) * nPlus) / (nPlus - 1.0)
            variance = ((2.0 * nPlus) / (nPlus - 3.0)) * (rho - sigma) * (mu - tau) 
            variance += ((nPlus**2.0) / (nPlus - 1.0)) * sigma * tau
            c = (2.0 * expectedValue) / variance
            self.v = c * expectedValue
            self.chi2 = c * tp
            self.pvalue = 1.0 - CHI2.cdf(self.chi2, self.v)

class EmpiricalBayesRates(object):
    """Rate Standardization based on the Empirical Bayes 
    estimate of the standard deviation and mean. (1) (2)

    INPUTS:
    count (array, n): count values 
    pop (array, n): population values
    family {str, POISSON}: Either POISSON or BINOMIAL

    ATTRIBUTES:
    n (int): number of features
    xn (float): avg population
    pi (array, (n,)): raw rates
    s2 (float): weighted sample variance
    b (float): moment estimate of the expectation of the global rate
    a (float): moment estimate of the variance of global event rate
    vi (array, (n,)): marginal variance of the event rate

    METHODS:
    getStandardizedRate()
    getEstimatedRate()
    
    SOURCE:
    (1)  Assuncao and Reis (1999) 
         A new proposal to adjust Moran's I for population density.
         Statistics and Medicine
         18(16):2147-2162
         See Page 2157 for Equation
    (2)  Marshall, R. J. (1991)
         Mapping disease and mortality rates using empirical Bayes estimators
         Applied Statistics,
         40:294-294
    (3)  Assuncao et. al. (1999)
         Mapas de Malaria em Rondonia Usando o Estimador Bayesiano Empirico
         para Dados Binarios
         R.bras.Estat., Rio de Janeiro,
         60(213):69-94
    (4)  Choynowski (1959)
         Maps based on probabilities. 
         Journal of the American Statistical Association
         54(286):385–388
    """
    def __init__(self, counts, pop, weights = None, family = "BINOMIAL"):
        self.n = len(pop)
        self.x = pop.sum() * 1.0
        self.p_tilde = pop / self.x
        if weights is not None:
            self.weights = weights / weights.sum()
            wij = NUM.sqrt(self.weights * self.p_tilde)
            self.wij = wij / wij.sum()
        else:
            self.wij = self.p_tilde

        self.xn = self.x / self.n
        self.pi = (counts * 1.0) / pop

        #### Moments ####
        self.b = (self.pi * self.wij).sum()
        self.s2 = (self.wij * NUM.power(self.pi - self.b, 2.0)).sum()
        meanPopRatio = (self.b / pop)
        if family == "POISSON":
            a = self.s2 - (self.b / self.xn)
            if a < 0:
                a = 0
            vi = a + meanPopRatio
        else:
            aNum = self.s2 - (self.b - self.b**2.0) * self.n / self.x
            aDen = 1.0 - self.n/ self.x
            a = aNum / aDen
            vi = a + ((self.b  - self.b**2.0 - a) / pop)

        #### Marginal Variance ####
        less0 = vi < 0
        vi[less0] = meanPopRatio[less0]

        #### Set Attributes ####
        self.a = a
        self.vi = vi
        self.pop = pop
        self.counts = counts
        self.family = family

    def getEstimatedRate(self):
        """Returns the estimated rate based on shrinkage factor."""

        if self.family == "POISSON":
            if self.s2 < (self.b / self.xn):
                return NUM.full(len(self.pi),self.b, dtype = float)
            
            num = self.a * (self.pi - self.b) 
            den = self.a + (self.b / self.pop)
            return self.b + (num / den) 
        else:
            b1b = (self.b * (1.0 - self.b))
            if self.s2 < (b1b / self.xn):
                return NUM.full(len(self.pi),self.b, dtype = float)

            num = self.pop * self.s2 - (self.pop / self.xn) * b1b
            den = (self.pop - 1.0) * self.s2 + (((self.xn - self.pop) / self.xn) * b1b)
            rho = num / den
            return (rho * self.pi) + (1.0 - rho) * self.b

    def getStandardizedRate(self):
        """Returns the standardized rate based on the global 
        empirical mean and standard deviation. 
        """
        
        return (self.pi - self.b) / NUM.sqrt(self.vi)

################## Transformations ######################

def zTransform(x):
    return (x - x.mean(0)) / x.std(0)

def fdrTransform(pVals, rawVals, mean = 0.0):
    #### Internal Method Expects "Well-Behaved" Arrays ####
    return ARC._ss.fdr_adjusted_bins(rawVals, pVals, mean)

def pValueBins(pVals, rawVals, mean = 0.0):
    return ARC._ss.pvalue_bins(rawVals, pVals, mean)

def moranBinFromPVals(pVals, moranInfo, fdrBins = None):
    """Returns a string representation of Local Moran's I 
    Cluster-Outlier classification bins.

    INPUTS:
    pVals (array, n): pvalues from local moran (or pseudo p-values)
    moranInfo (dict): orderID = (clustered?, 
                                 local greater than global mean?,
                                 feature greater than global mean?)
    fdrBins (array, n): fdr adjusted bins for significance

    OUTPUT:
    moranBin (str): HH = Cluster of Highs, L = Cluster of Lows,
                    HL = High Outlier, LH = Low Outlier.
    """
    n = len(pVals)
    bins = NUM.empty((n,), dtype = 'a2')
    bins[:] = ""
    if fdrBins is not None:
        significant = NUM.where(abs(fdrBins) >= 2)
    else:
        significant = NUM.where(pVals <= .05)

    for orderID in significant[0]:
        clusterBool, localGlobalBool, featureGlobalBool = moranInfo[orderID]
        if clusterBool:
            if localGlobalBool:
                moranBin = "HH"
            else:
                moranBin = "LL"
        else:
            if featureGlobalBool and not localGlobalBool:
                moranBin = "HL"
            else:
                moranBin = "LH"
        bins[orderID] = moranBin

    return bins

################ Summary Statistics #####################

def median(values, weights = None):
    """Returns the weigthed median for univariate data.

    INPUTS:
    values (list): list of data values
    weights {list, None}: list of weights associated with values

    OUTPUT
    wMed (float): weighted median center
    """

    #### Assess Shape and Return if Single Feature ####
    n = len(values)
    if n == 1:
        return values[0]

    #### Assure Appropriate Weights ####
    try:
        wn = len(weights)
        if wn != n:
            weights = NUM.ones(n) 
    except:
        weights = NUM.ones(n)
    values = NUM.asarray(values, dtype = float)
    weights = NUM.asarray(weights, dtype = float)

    #### Remove Values with Zero Weights ####
    nonZeroW = NUM.flatnonzero(weights)
    weights = weights[nonZeroW]
    values = values[nonZeroW]
    
    #### Core Calculation ####
    return ARC._ss.weighted_median(values, weights)

def geo_weighted_quantiles(values, weights = None, quantiles = [.25, .5, .75]):
    """Returns the weigthed median for univariate data.

    INPUTS:
    values (list): list of data values
    weights {list, None}: list of weights associated with values

    OUTPUT
    wMed (float): weighted median center
    """

    #### Assure Appropriate Weights ####
    n = len(values)
    try:
        wn = len(weights)
        if wn != n:
            weights = NUM.ones(n) 
    except:
        weights = NUM.ones(n)

    values = NUM.asarray(values, dtype = float)
    weights = NUM.asarray(weights, dtype = float)

    #### Remove Values with Zero Weights ####
    nonZeroW = NUM.flatnonzero(weights)
    weights = weights[nonZeroW]
    values = values[nonZeroW]

    #### Assess Shape and Return if Single Feature ####
    n = len(values)
    if n == 1:
        return NUM.repeat(values[0], len(quantiles))
    
    row_count = len(weights)
    order_data = values.argsort()
    s_weights = weights[order_data]
    s_values = values[order_data]
    sum_w = s_weights.sum()
    standard_w = s_weights / sum_w
    cum_w = standard_w.cumsum()
    
    quantiles = NUM.asarray(quantiles, dtype = float)
    num_q = len(quantiles)
    quantile_values = NUM.zeros(num_q, dtype = float)

    flag = True
    c = 1
    lower_quantile_index = 0
    while flag:
        lower_sum_w = cum_w[c - 1]
        higher_sum_w = cum_w[c]

        #### Check Sum of Weights Larger than Quantile Weight Breaks ####
        for q_index in range(lower_quantile_index, num_q):
            p = quantiles[q_index]
            if higher_sum_w > p:
                lower_x = s_values[c - 1]
                higher_x = s_values[c]
                denom = higher_sum_w - lower_sum_w
                q = lower_x + (((higher_x - lower_x) * (p - lower_sum_w)) / denom)
                quantile_values[q_index] = q
                lower_quantile_index += 1

        c += 1

        #### Break When All Quantiles Found ####
        if lower_quantile_index == num_q:
            flag = False
            break

    return quantile_values

def weighted_quantiles(values, weights = None, quantiles = [.25, .5, .75]):
    """Returns the weigthed median for univariate data.

    INPUTS:
    values (list): list of data values
    weights {list, None}: list of weights associated with values

    OUTPUT
    wMed (float): weighted median center
    """

    #### Assure Appropriate Weights ####
    n = len(values)
    try:
        wn = len(weights)
        if wn != n:
            weights = NUM.ones(n) 
    except:
        weights = NUM.ones(n)

    values = NUM.asarray(values, dtype = float)
    weights = NUM.asarray(weights, dtype = float)

    #### Remove Values with Zero Weights ####
    nonZeroW = NUM.flatnonzero(weights)
    weights = weights[nonZeroW]
    values = values[nonZeroW]

    #### Assess Shape and Return if Single Feature ####
    n = len(values)
    if n == 1:
        return NUM.repeat(values[0], len(quantiles))
    nm1 = n - 1
    
    row_count = len(weights)
    order_data = values.argsort()
    s_weights = weights[order_data]
    s_values = values[order_data]
    sum_w = s_weights.sum()
    standard_w = s_weights / sum_w
    cum_w = standard_w.cumsum()
    
    quantiles = NUM.asarray(quantiles, dtype = float)
    num_q = len(quantiles)
    quantile_values = NUM.zeros(num_q, dtype = float)

    flag = True
    c = 0
    lower_quantile_index = 0
    while flag:
        #### Last Value Check ####
        if c == nm1:
            for q_index in range(lower_quantile_index, num_q):
                quantile_values[q_index] = s_values[c]
            flag = False
            break

        #### Check Sum of Weights Larger than Quantile Weight Breaks ####
        current_sum_w = cum_w[c]
        for q_index in range(lower_quantile_index, num_q):
            p = quantiles[q_index]
            if current_sum_w > p:
                quantile_values[q_index] = s_values[c]
                lower_quantile_index += 1
            else:
                if UTILS.compareFloat(current_sum_w, p):
                    quantile_values[q_index] = (s_values[c] + s_values[c+1]) / 2.0
                    lower_quantile_index += 1
        c += 1

        #### Break When All Quantiles Found ####
        if lower_quantile_index == num_q:
            flag = False
            break

    return quantile_values


def mad(values, medianValue = None):
    """Returns  median absolute deviation (MAD)

    INPUT:
    values (list): list of data values
    median (float): median
    
    OUTPUT:
    mad (float) :median absolute deviation

    """
    if medianValue is None:
        medianValue = median(values)

    mad = median(abs(values - medianValue))
    return mad



def iqrOutliers(x, multiplier = 1.75):
    """Returns boolean outlier for every value of x.

    INPUTS:
    x (array): numeric values
    multiplier {float, 1.75}: adjustment for "fence" of box-plot.
    """

    q25 = NUM.percentile(x, 25, axis = 0)
    q75 = NUM.percentile(x, 75, axis = 0)
    iqr = q75 - q25
    scaledIQR = (multiplier * iqr)
    lowerCutoff = q25 - scaledIQR
    upperCutoff = q75 + scaledIQR

    return NUM.logical_or(x < lowerCutoff, x > upperCutoff)

def univariateBandwidth(x):
    """Calculates Bandwitch using Silverman's Rule.

    INPUTS:
    x (array): numeric values
    """

    q25 = NUM.percentile(x, 25, axis = 0)
    q75 = NUM.percentile(x, 75, axis = 0)
    iqr = q75 - q25
    sd = NUM.std(x)
    ratio2Use = NUM.minimum(sd, iqr)
    obsPower = len(x)**-1./5.
    return .9 * ratio2Use * obsPower 

def isDense(minCellSize, area, numFeatures, scale = 2.0):
    """Assesses whether the scaled expected mean nearest 
    neighbor distance based on a random pattern would be 
    smaller than the minimum cell size.

    INPUTS:
    minCellSize (double): smallest cell size allowed
    area (double): study area
    numFeatures (int, double): number of observations
    scale {double, 2.0}: number to multiply the expexted
                         nn distance by before compare.
    """

    avgCellSize = .5 / (numFeatures / area)**.5
    return minCellSize > (scale * avgCellSize)

def uniqueRows(values):
    """Returns the unique rows and counts of a given n by k dim array.

    INPUTS:
    values (array): n by k array of values 
    """

    sortedArray = values[NUM.lexsort(values.T), :]
    diffIDs = NUM.where(NUM.any(NUM.diff(sortedArray, axis=0), 1))[0]
    uniqueRows = [sortedArray[i] for i in diffIDs] + [sortedArray[-1]]
    counts = NUM.diff(NUM.append(NUM.insert(diffIDs, 0, -1), sortedArray.shape[0] - 1))

    return NUM.array(uniqueRows), counts

def mapFromUniqueCounts(allValues, uniqueCounts):
    """Returns the list of arrays for coincident points indicating which ids are 
    associated with which unique point. (1)

    INPUTS:
    allValues (array): n by k array of values 
    uniqueCounts (array): unique counts returned from uniqueRows()

    RETURN:
    keys (array): first index for each unique row in allValues
    mapper (dict): first index : all remaining indices from allValues with same row

    NOTES: (1): Typical workflow would be to run uniqueRows on the coords.  If not
    unique, then run this method with the original coords and the counts from uniqueRows.
    """

    lSort = NUM.lexsort(allValues.T)
    sortedInds = NUM.arange(len(allValues), dtype = NUM.int32)[lSort]

    keys = NUM.zeros(len(uniqueCounts), dtype = NUM.int32)
    mapper = {}
    start = 0
    for ind, count in enumerate(uniqueCounts):
        mapInfo = sortedInds[start:start+count]
        mapper[int(mapInfo[0])] = [int(i) for i in mapInfo[1:]]
        keys[ind] = mapInfo[0]
        start += count

    return keys, mapper


def spatialBandwidth(xyCoords, weights = None):
    """Calculates Spatial Bandwidth Using Same Methodology as Kernel Density.

    INPUTS:
    xyCoords (array (nx2)): xy-coordinates
    weights (array (n,)): population/weight values
    """

    #### Get/Set Shape Info ####
    numFeatures = len(xyCoords)
    shape2Use = (numFeatures, 1)

    #### Handle Weights ####
    if weights is None:
        #### Unweighted ####
        w = NUM.ones(shape2Use, float)
    else:
        #### Assure Conformable ####
        if weights.shape != shape2Use:
            w = weights.reshape(numFeatures, 1)
        else:
            w = weights

    #### Scale Coords ####
    weightSum = w.sum()
    xyWeighted = w * xyCoords

    #### Mean Center ####
    centers = xyWeighted.sum(0) / weightSum

    #### Standard Distance ####
    devXY2 = (xyCoords - centers)**2.0
    sigXY = (w * devXY2).sum(0)/weightSum  
    sdVal = NUM.sqrt(sigXY.sum()) 

    #### Median Distance ####
    distances = NUM.sqrt(devXY2.sum(1))
    medianDistance = median(distances, w.flatten())

    #### Decision Criteria ####
    scalar = NUM.sqrt((1./NUM.log(2)))
    medianChoice = medianDistance * scalar
    ratio2Use = min(sdVal, medianChoice)
    obsPower = weightSum**(-.2)
    bandwidth = .9 * ratio2Use * obsPower 
    return bandwidth

def lengthOfRun(boolArray):
    """Returns the maximum number of True values in a row from the end of a
    boolean array.

    INPUTS:
    boolArray (array, (n,)): boolean array
    """

    count = 0
    for i in reversed(boolArray):
     if not i:
         break
     else:
         count += 1

    return count

def varTransform(values, transform = 0):
    """Variance Stabalizing Transformation.

    INPUTS:
    values (array, n): values to be transformed
    transform (int, {0,8}): type of transformation
                            0: Freeman Tukey
                            1: Freeman-Tukey (Simplified)
                            2: Anscombe
                            3: Log Transform
                            4: Log10 Transform
                            5: Square-Root Transform
                            6: ArcSin Transform
                            7: Generalized Log 
                            8: Log-Linear Hybrid
    """

    if transform == 0:
        #### Freeman-Tukey (Original) ####
        return NUM.sqrt(values + 1.0) + NUM.sqrt(values)
    if transform == 1:
        #### Freeman-Tukey (Simplified) ####
        return 2.0 * NUM.sqrt(values)
    if transform == 2:
        #### Anscombe ####
        return 2.0 * NUM.sqrt(values + 3./8.)
    if transform == 3:
        #### Log Transform ####
        return NUM.log( (values + 1.0) )
    if transform == 4:
        #### Log10 Transform ####
        return NUM.log10( (values + 1.0) )            
    if transform == 5:
        #### Square-Root Transform ####
        return NUM.sqrt( (values + 1.0) )   
    if transform == 6:
        #### ArcSin Transform ####
        return NUM.arcsinh(values)
    if transform == 7:
        #### Generalized Log ####
        return NUM.log( (values + NUM.sqrt( (values**2.0 + 1)) / 2.0))
    if transform == 8:
        #### Log-Linear Hybrid ####
        vals = values * 1.0
        yLessA = vals < 1.0
        vals[yLessA] = vals[yLessA] + NUM.log(1.0) - 1.0
        yGreaterA = vals >= 1.0
        vals[yGreaterA] = NUM.log(vals[yGreaterA])
        return vals

    return values

def predictSeriesSpline(data):
    import scipy.interpolate as INTERPOLATE
    indices = NUM.arange(len(data))
    nonNull = ~NUM.isnan(data)
    nonNullData = data[nonNull]
    nonNullIndices = indices[nonNull]
    function = INTERPOLATE.InterpolatedUnivariateSpline(nonNullIndices, nonNullData)
    return function(indices)

def rollingRelativeAverage(data, window = 0):
    n,k = data.shape
    out = NUM.zeros((n,k), dtype = float)
    means = NUM.zeros(n, dtype = float)
    for i in range(n):
        if i < window:
            avg = data[0:i+1].mean()
        else:
            avg = data[i-window:i+1].mean()
        out[i] = data[i] - avg
        means[i] = avg

    return out, means

def spectralOptimalK(distanceMatrix):
    A = NUM.diag(distanceMatrix.sum(1))

    try:
        invA = LA.inv(A)
        laplacian = NUM.eye(len(distanceMatrix)) - NUM.dot(invA, distanceMatrix)
        eigVals = LA.eigvals(laplacian)
        optimalK = (NUM.gradient(NUM.gradient(eigVals)) * NUM.arange(len(eigVals))).argmax()
        valid = optimalK not in [0, 1, len(distanceMatrix)]

        return optimalK, valid
    except:
        #### Perfect multicollinearity, cannot proceed ####
        return 0, False

def remapClusters(clusters, numClusters):
    uniqueClusters = NUM.unique(clusters)
    numUnique = len(uniqueClusters)
    if numUnique == numClusters:
        return clusters, numClusters
    else:
        remapped = NUM.zeros(len(clusters), dtype = NUM.int32)
        for newCluster, oldCluster in enumerate(uniqueClusters):
            remapped[clusters==oldCluster] = newCluster
        return remapped, numUnique


def calculateShare(source, target):
    """ Calcualte share
        INPUT:
            source (tuple): range source
            target (tuple): range target
        OUTPUT:
            share (float): share
    """

    allValues = [source[0], source[1], target[0], target[1]]
    indices = NUM.argsort(allValues)
    difBase = source[1] - source[0]
    difTarget = target[1] - target[0]

    if source[1] == target[1] and source[0] == target[0]:
        return 1.0, "Complete"

    if difBase == 0:
        return NUM.nan, "N/A"

    if min(target) >= max(source):
        return 0, "No overlapping"

    if max(target) <= min(source):
        return 0, "No overlapping"

    #### || -> source  [] -> target ####
    #### [ | | ] ####
    if allValues[indices[2]] == source[1] and allValues[indices[1]] == source[0]:
        dif = allValues[indices[3]] - allValues[indices[0]]
        return dif/difBase, "Complete-Extrapolation"
    
    #### | [] | ####
    if allValues[indices[2]] == target[1] and allValues[indices[1]] == target[0]:
        dif = allValues[indices[2]] - allValues[indices[1]]
        return dif/difBase, "Incomplete"

    #### | [x| ]  or [ |x] | ###
    dif = allValues[indices[2]] - allValues[indices[1]]
    share = dif/difBase

    #### | [x|==] ####
    if  source[1] == target[1]:
        return share, "Incomplete"

    #### | [x|<] ####
    if  source[1] < target[1]:
        return share, "Incomplete-Extrapolation"

    #### [==|x]| ####
    if  source[0] == target[0]:
        return share, "Incomplete"

    #### [<|x]| ####
    if  source[0] > target[0]:
        return share, "Incomplete-Extrapolation"

    return  share, "Partial"

################## Basis Expansion Function ###################

def linear(X):
    """
    Linear Transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
    OUTPUT:
        return (NumPy array)
    """
    return X

def quadratic(X):
    """
    Quadratic Transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
    OUTPUT:
        return (NumPy array)
    """
    return X**2

def hingeValue(val, low, high):
    """
    Hinge Function for transforming array with predefined min and max
    INPUT:
        val (NumPy array): Values to be transformed
        low {int, double, long}: Minimum value for transformation
        high {int, double, long}: Maximum value for transformation
    OUTPUT:
        return (NumPy array)
    """
    return NUM.clip((val-low)/(high-low), a_min = 0, a_max = 1)

def hinge(X, nKnots=50):
    """
    Hinge transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
        nKnots {int}: Number of knots to calculate hinge functions for
    OUTPUT:
        return (NumPy array)
    """

    ## Define All Knots for the Hinge Function
    maxX = X.max()
    minX = X.min()
    knots = NUM.linspace(minX, maxX, nKnots, endpoint=True)
    ## Define Transform
    tr = NUM.zeros( (X.shape[0], (nKnots-1)*2) )
    ## Lower Threshold Hinge Values
    tr[:,:nKnots-1] = NUM.array([hingeValue(X, knot, maxX) for knot in knots[:-1]]).T
    ## Upper Threshold Hinge Values
    tr[:, nKnots-1:] = NUM.array([hingeValue(X, minX, knot) for knot in knots[1:]]).T

    return tr

def hingeInfo(X, nKnots=50):
    """
    Hinge transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
        nKnots {int}: Number of knots to calculate hinge functions for
    OUTPUT:
        return (NumPy array)
    """

    ## Define All Knots for the Hinge Function
    maxX = X.max()
    minX = X.min()
    knots = NUM.linspace(minX, maxX, nKnots, endpoint=True)
    k = (nKnots-1)*2
    knotsOut = NUM.zeros(k, dtype = float)
    knotsOut[:nKnots-1] = knots[:-1]
    knotsOut[nKnots-1:] = knots[1:]

    ## Define Transform
    tr = NUM.zeros( (X.shape[0], k) )
    ## Lower Threshold Hinge Values
    tr[:,:nKnots-1] = NUM.array([hingeValue(X, knot, maxX) for knot in knots[:-1]]).T
    ## Upper Threshold Hinge Values
    tr[:, nKnots-1:] = NUM.array([hingeValue(X, minX, knot) for knot in knots[1:]]).T

    return tr, knotsOut, minX, maxX


def product(X1, X2):
    """
    Product transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
    OUTPUT:
        return (NumPy array)
    """

    return X1 * X2

def threshold(X, nKnots=50):
    """
    Threshold transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
        nKnots {int}: Number of knots to calculate hinge functions for
    OUTPUT:
        return (NumPy array)
    """
    ## Define All Knots for the Threshold Function
    knots = NUM.linspace(X.min(), X.max(), nKnots + 2, endpoint=True)[2 : nKnots+1]
    ## Initialize Transform
    tr = NUM.zeros( (X.shape[0], nKnots) )
    ## Finalize Transform
    for ind, knot in enumerate(knots):
        tr[X>knot, ind] = 1

    return tr

def thresholdInfo(X, nKnots=50):
    """
    Threshold transformation for array
    INPUT:
        val (NumPy array): Values to be transformed
        nKnots {int}: Number of knots to calculate hinge functions for
    OUTPUT:
        return (NumPy array)
    """
    ## Define All Knots for the Threshold Function
    maxX = X.max()
    minX = X.min()
    knots = NUM.linspace(minX, maxX, nKnots + 2, endpoint=True)[1 : nKnots+1]
    ## Initialize Transform
    tr = NUM.zeros( (X.shape[0], nKnots) )
    ## Finalize Transform
    for ind, knot in enumerate(knots):
        tr[X>knot, ind] = 1

    return tr, knots, minX, maxX


def mode(data):
    unique, counts = NUM.unique(data, return_counts = True)
    return unique[counts.argmax()]

def modeAndLevels(data):
    unique, counts = NUM.unique(data, return_counts = True)
    return unique[counts.argmax()], unique

""" Triangular Distribution """
class TriangularDistribution:
    def __init__(self, L, U, M):
        """ Triangular Distribution
        INPUT: 
            L (float): Lower bound
            U (float): Upper bound
            M (float): Mode 
        """
        self.L = L
        self.U = U
        self.M = M
        self.mode = M
        self.upper = U
        self.lower = L

    def pdf(self, x):
        """ Probability Density Function """
        if x < self.L:
            return 0
        elif self.L <= x < self.M:
            return 2 * (x - self.L) / ((self.U - self.L) * (self.M - self.L))
        elif x == self.M:
            return 2 / (self.U - self.L)
        elif self.M < x <= self.U:
            return 2 * (self.U - x) / ((self.U - self.L) * (self.U - self.M))
        else:
            return 0

    def cdf(self, x):
        """ Cumulative Density Function"""
        if x <= self.L:
            return 0
        elif self.L < x <= self.M:
            return ((x - self.L) ** 2) / ((self.U - self.L) * (self.M - self.L))
        elif self.M < x < self.U:
            return 1 - ((self.U - x) ** 2) / ((self.U - self.L) * (self.U - self.M))
        else:
            return 1

    def inverseCDF(self, p):
        """ Inverse Cumulative Density Function"""
        if p < (self.M - self.L) / (self.U - self.L):
            return self.L + NUM.sqrt(max(0, (self.M - self.L) * (self.U - self.L) * p))
        else:
            return self.U - NUM.sqrt(max(0, (self.U - self.L) * (self.U - self.M) * (1 - p)))


class TruncateTriangularDistribution:
    
    def __init__(self, a, b, L, U, M):
        """ Truncate Triangular Distribution
        INPUT:
            a (float): Lower bound Truncated
            b (float): Upper bound Truncated
            L (float): Lower bound Original
            U (float): Upper bound Original
            M (float): Mode
        """
        origDist = TriangularDistribution(L,U,M)
        self.L = origDist.L
        self.U = origDist.U
        self.origDist = origDist
        self.M  = origDist.M
        self.a = a
        self.b = b

        if (self.a < self.L or  self.b > self.U):
            ARCPY.AddError("The truncation bounds are outside the original distribution bounds")
            raise SystemExit
            
    def inverseCDF(self, p):
        """ Inverse Cumulative Density Function"""
        return  self.origDist.inverseCDF(p * (self.origDist.cdf(self.b) - self.origDist.cdf(self.a)) + self.origDist.cdf(self.a))

def maskZero(data):
    zeros = data==0
    if zeros.sum():
        indexValues = NUM.where(~zeros)[0]
        return indexValues
    return None
    
def maskEquals(lData, UData):
    diff = lData - UData
    return maskZero(diff)
    

def evaluateZerosVariable(dataRef, dataTarget):
    indices = maskZero(dataRef)
    if indices is None:
        return dataRef, dataTarget, None
    else:
        return dataRef[indices],dataTarget[indices], indices


def evaluateEqualVariables(lData, UData):
    indices = maskEquals(lData, UData)
    if indices is None:
        return lData, UData, None
    else:
        return lData[indices], UData[indices], indices

def rebuildVaraible(yRealization, indices, originalY):
    if indices is None:
        return yRealization
    else:
        allValues = originalY.copy()
        allValues[indices]= yRealization
        return allValues

def getRealization(ssdo, varName, sensitivity, seed, neighborsMean, zFactorForConfidenceLevel= 1.96): 
    """Get a realization of the data based on the sensitivity parameters.
    INPUT:
        ssdo (object): SSDO object
        varName (string): variable name
        sensitivity (dictionary): sensitivity parameters
        seed (int): random seed
        neighborsMean (array): mean value of neighbors
        zFactorForConfidenceLevel (float): z factor for confidence level
    OUTPUT:
        yData (array): data realization"""
    
    import scipy.stats as STATS

    def truncateNormal(a_trunc, b_trunc, loc ,scale):
        """ truncates a normal distribution
        INPUT:
            a_trunc (float): lower bound
            b_trunc (float): upper bound
            loc (float): mean
            scale (float): standard deviation
        OUTPUT:
            value (float): truncated normal distribution value
            """
        a, b = (a_trunc - loc) / scale, (b_trunc - loc) / scale
        value = STATS.truncnorm.rvs(a,b, size=1)*scale + loc
        return value[0]

    def truncateTriangular(a_trunc, b_trunc,lower, upper, y):
        """ truncates a triangular distribution
        INPUT:
            a_trunc (float): lower bound
            b_trunc (float): upper bound
            lower (float): lower bound
            upper (float): upper bound
            y (float): mean
        OUTPUT:
            value (float): truncated triangular distribution value"""
        truncTriang = TruncateTriangularDistribution(a_trunc, b_trunc, lower, upper, y)
        value = truncTriang.inverseCDF(NUM.random.rand())
        return value
    
    def applyDataLimitsSimulateTriangular(lower, upper, y, dataLimitVariable):
        """
        Applies data limits to lower and higher bounds and simulates new y values
        using a triangular distribution. If limits are applied, it uses a custom
        truncation method.

        INPUT:
          lower: numpy array of lower bounds
          upper: numpy array of upper bounds
          y: numpy array of current y values
          dataLimitVariable: tuple of (lower limit, upper limit)

        OUTPUT:
          numpy array of simulated y values
        """
        lowerCut = lower.copy()
        upperCut = upper.copy()
        lLimit = None
        uLimit = None

        if dataLimitVariable is not None:
            lLimit = lower < dataLimitVariable[0]
            uLimit = upper > dataLimitVariable[1]
            lowerCut[lLimit] = dataLimitVariable[0]
            upperCut[uLimit] = dataLimitVariable[1]


        diff = (upperCut - lowerCut)
        if NUM.sum(diff<0):
            #### At least one feature has a value in the Lower Bound Field that is greater than the value in the Upper Bound Field.####
            ARCPY.AddIDMessage("ERROR", 110574)
            raise SystemExit
        diffL = (y - lowerCut)
        diffU = (upperCut - y)
        if NUM.sum(diffL<0) or NUM.sum(diffU<0):
            #### The estimated value must be between Lower and Upper bounds for all locations ####
            ARCPY.AddIDMessage("ERROR", 110576)
            raise SystemExit
        
        #### Check if there are any values that are outside the bounds ####
        if  lLimit is not None:
            if  lLimit.sum() > 0 or uLimit.sum() > 0:
                yNew = NUM.zeros(len(y), dtype=float)
                for i in NUM.arange(len(y)):
                    yNew[i] = truncateTriangular(lowerCut[i], upperCut[i], lower[i], upper[i], y[i])
                y = yNew
            else:
                y = NUM.random.triangular(lower, y, upper, len(y))
        else:
            y = NUM.random.triangular(lower, y, upper, len(y))
        return y


    zFactor = zFactorForConfidenceLevel
    simulationMethod = sensitivity["simulation_method"]

    dataLimitVariable = None
    if sensitivity["sim_data_limits"] not in ["" , None, "#"]:
        dataLimits = sensitivity["sim_data_limits"].split(";")

        for values in dataLimits:
            if varName.upper() in values.upper():
                parts = values.split(" ")
                if parts[1] == "#" and parts[2] == "#":
                    dataLimitVariable = None
                elif parts[1] != "#" and parts[2] == "#":
                    dataLimitVariable = [UTILS.strToFloat(parts[1]), NUM.finfo(NUM.float64).max]  
                elif parts[1] == "#" and parts[2] != "#":
                    dataLimitVariable = [-NUM.finfo(NUM.float64).max, UTILS.strToFloat(parts[2])]
                else:
                    dataLimitVariable = [UTILS.strToFloat(parts[1]), UTILS.strToFloat(parts[2])]
                break

    y = ssdo.fields[varName].returnDouble()

    yMin = y.min()
    yMax = y.max()
    if dataLimitVariable is not None:
        if yMin < dataLimitVariable[0]:
            #### At least one feature has a value that is less than the Lower Limit parameter value.###
            ARCPY.AddIDMessage("ERROR", 110565)
            raise SystemExit

        if yMax > dataLimitVariable[1]:
            #### At least one feature has a value that is greater than the Upper Limit parameter value.####
            ARCPY.AddIDMessage("ERROR", 110566)
            raise SystemExit

    if neighborsMean is not None:
        y = neighborsMean

    NUM.random.seed(seed)
    if "MOE" in  sensitivity:
        moe = None
        if type(sensitivity["MOE"]) == str:
            moe = ssdo.fields[sensitivity["MOE"].upper()].returnDouble()
        if type(sensitivity["MOE"]) == list:
            if varName.upper() in sensitivity["MOE_DICT"]:
                moe = ssdo.fields[sensitivity["MOE_DICT"][varName.upper()]].returnDouble()

        locZero = moe < 0
        if NUM.sum(locZero) > 0:
            ARCPY.AddIDMessage("ERROR", 110564)
            raise SystemExit

        moeMasked, yMasked, indices = evaluateZerosVariable(moe, y)

        yR = None
        if simulationMethod == "NORMAL":

            if dataLimitVariable is not None:
                moeData = moeMasked/zFactor
                yNew = NUM.zeros(len(yMasked), dtype = float)
                for i in NUM.arange(len(yMasked)):
                    yNew[i] = truncateNormal(dataLimitVariable[0], dataLimitVariable[1], yMasked[i], moeData[i])
                yR = yNew
            else:
                yR = NUM.random.normal(yMasked, moeMasked/zFactor, len(yMasked))

        elif simulationMethod == "TRIANGULAR":
            lower = yMasked-NUM.sqrt(6)*moeMasked/zFactor
            upper = yMasked+NUM.sqrt(6)*moeMasked/zFactor

            yR = applyDataLimitsSimulateTriangular(lower, upper, yMasked, dataLimitVariable)

        elif simulationMethod == "UNIFORM":
            lower = yMasked - NUM.sqrt(3)*moeMasked/zFactor
            upper = yMasked + NUM.sqrt(3)*moeMasked/zFactor

            if dataLimitVariable is not None:
                lower[lower < dataLimitVariable[0]] = dataLimitVariable[0]
                upper[upper > dataLimitVariable[1]] = dataLimitVariable[1]

            yR = NUM.random.uniform(lower, upper, len(yMasked))

        else:
            #### '%1': Input value is invalid. ####
            ARCPY.AddIDMessage("ERROR", 89440, simulationMethod )
            raise SystemExit

        y = rebuildVaraible(yR.ravel(), indices, y)

        return y.ravel()

    if "lowField"  in sensitivity:

        lowLimit = None
        upLimit = None
        if type(sensitivity["lowField"]) == str and type(sensitivity["highField"]) == str:
            lowLimit = ssdo.fields[sensitivity["lowField"].upper()].returnDouble()
            upLimit = ssdo.fields[sensitivity["highField"].upper()].returnDouble()
        if type(sensitivity["lowField"]) == list and type(sensitivity["highField"]) == list:
            if varName.upper() in sensitivity["CONFIDENCE_BOUNDS_DICT"]:
                flds = sensitivity["CONFIDENCE_BOUNDS_DICT"][varName.upper()]
                lowLimit = ssdo.fields[flds[0].upper()].returnDouble()
                upLimit = ssdo.fields[flds[1].upper()].returnDouble()

        n = len(lowLimit)

        if NUM.allclose(lowLimit,upLimit):
            ARCPY.AddError("All the lower bound and higher bound values are the same")
            raise SystemExit

        lowLimitMasked, upLimitMasked, indices = evaluateEqualVariables(lowLimit, upLimit)
        yMasked = y
        if indices is not None:
            yMasked = y[indices]

        yR = None
        if simulationMethod in ["NORMAL"]:
            #### '%1': Input value is invalid. ####
            ARCPY.AddIDMessage("ERROR", 89440, simulationMethod )
            raise SystemExit

        elif simulationMethod == "TRIANGULAR":
            lower = lowLimitMasked
            upper = upLimitMasked
            diff = (upLimit - lowLimit)

            if NUM.sum(diff<0):
                #### At least one feature has a value in the Lower Bound Field that is greater than the value in the Upper Bound Field. ###
                ARCPY.AddIDMessage("ERROR", 110574)
                raise SystemExit

            yR = applyDataLimitsSimulateTriangular(lower, upper, yMasked, dataLimitVariable)

        elif simulationMethod == "UNIFORM":
            lower = lowLimitMasked
            higher = upLimitMasked

            if dataLimitVariable is not None:
                lower[lower < dataLimitVariable[0]] = dataLimitVariable[0]
                higher[higher > dataLimitVariable[1]] = dataLimitVariable[1]

            diff = (higher - lower)

            if NUM.sum(diff<0):
                #### At least one feature has a value in the Lower Bound Field that is greater than the value in the Upper Bound Field. ###
                ARCPY.AddIDMessage("ERROR", 110574)
                raise SystemExit

            yR = NUM.random.uniform(lower, higher, len(lower))
        else:
            #### '%1': Input value is invalid. ####
            ARCPY.AddIDMessage("ERROR", 89440, simulationMethod )
            raise SystemExit

        y = rebuildVaraible(yR.ravel(), indices, y)

        return y.ravel()

    if "percentageLow" in sensitivity:

        if type(sensitivity["percentageLow"]) == list:
            if varName.upper() in sensitivity["PERCENTAGE_DICT"]:
                values = sensitivity["PERCENTAGE_DICT"][varName.upper()]
                lowLimit = y -  NUM.abs(y)*(values[0]/100)
                upLimit  = y +  NUM.abs(y)*(values[1]/100)
        else:
            lowLimit = y -  NUM.abs(y)*(sensitivity["percentageLow"]/100)
            upLimit  = y +  NUM.abs(y)*(sensitivity["percentageHigh"]/100)

        lowLimitMasked, upLimitMasked, indices = evaluateEqualVariables(lowLimit, upLimit)
        yMasked = y
        if indices is not None:
            yMasked = y[indices]
        yR = None
        if simulationMethod in ["NORMAL"]:
            #### '%1': Input value is invalid. ####
            ARCPY.AddIDMessage("ERROR", 89440, simulationMethod )
            raise SystemExit

        elif simulationMethod == "TRIANGULAR":
            lower = lowLimitMasked
            upper = upLimitMasked

            yR = applyDataLimitsSimulateTriangular(lower, upper, yMasked, dataLimitVariable)

        elif simulationMethod == "UNIFORM":
            lower = lowLimitMasked
            upper = upLimitMasked

            if dataLimitVariable is not None:
                lower[lower < dataLimitVariable[0]] = dataLimitVariable[0]
                upper[upper > dataLimitVariable[1]] = dataLimitVariable[1]

            yR = NUM.random.uniform(lower, upper, len(lower))

        else:
            #### '%1': Input value is invalid. ####
            ARCPY.AddIDMessage("ERROR", 89440, simulationMethod )
            raise SystemExit

        y = rebuildVaraible(yR.ravel(), indices, y)
        return y.ravel()



