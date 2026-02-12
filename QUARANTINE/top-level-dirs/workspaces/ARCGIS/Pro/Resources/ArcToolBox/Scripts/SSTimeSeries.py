import numpy as NUM
import numpy.linalg as LA
import scipy.signal as SIG
import scipy.optimize as OPT
import scipy.stats as SCISTAT
import arcpy as ARCPY
import SSUtilities as UTILS
import arcgisscripting as ARC
import arcpy as ARCPY
import math as MATH
import scipy.stats as SCISTATS
import SSDataObject as SSDO

def getGrubbCriticalValue(t, alpha = .1):
    t_dist = SCISTATS.t.ppf(1 - alpha / (2 * t), t - 2)
    num = (t - 1) * t_dist
    denom = NUM.sqrt((t - 2 + t_dist**2.0) * t)

    return num/denom

def GeneralizedESD(data, fit, alpha = .1, testSize = None):
    t = len(data)
    boolArray = NUM.ones(t, dtype = bool)
    indexArray = NUM.arange(t, dtype = NUM.int32)

    #### Resolve Default Test Size ####
    if testSize is None:
        testSize = max(1, int(t * .05))

    #### Reverse ArgSort ####
    fitResiduals = data - fit

    #### Create Test Stats ####
    allTestInds = []
    outlierStats = []
    outlierCVs = []
    maxIndOut = None

    for i in range(testSize):

        #### Calculate Stats for Observations not Tested Yet ####
        subsetResiduals = fitResiduals[boolArray]
        indexResiduals = indexArray[boolArray]
        subsetMean = subsetResiduals.mean()
        res = subsetResiduals - subsetMean
        v = res.var()

        #### Break if no Variance ####
        if UTILS.compareFloat(v, 0.0):
            break

        s = res.std(ddof = 1)
        new_t = len(res)
        ares = abs(res)
        maxResInd = ares.argmax()
        baseIndex = indexResiduals[maxResInd]

        gTop = ares[maxResInd]
        gStat = gTop / s
        cv = getGrubbCriticalValue(new_t, alpha = alpha)
        allTestInds.append(baseIndex)
        outlierStats.append(gStat)
        outlierCVs.append(cv)
        boolArray[baseIndex] = False
        if gStat > cv:
            maxIndOut = i

    if maxIndOut is not None:
        outlierInds = allTestInds[:maxIndOut + 1]
    else:
        outlierInds = []

    return allTestInds, outlierInds, outlierStats, outlierCVs

class TSOutliers(object):
    def __init__(self, forecastObject, alpha = .1, testSize = None, keepStats = True):
        UTILS.assignClassAttr(self, locals())
        self.outliers = NUM.zeros((forecastObject.forecastTime, forecastObject.numLocations), dtype = bool)
        self.numLocations = self.forecastObject.numLocations
        if self.testSize is None:
            self.testSize = max(1, int(forecastObject.numTime * .05))
        if self.keepStats:
            self.outlierInfo = {}

        #### Remove First Time Window From Forest Forecast ####
        if self.forecastObject.forecastType == 0:
            self.startOutlierIndex = abs(self.forecastObject.seasonInt)
        elif 100 <= self.forecastObject.forecastType <= 105:
            self.startOutlierIndex = abs(self.forecastObject.sequence_length)
        else:
            self.startOutlierIndex = NUM.zeros(forecastObject.numLocations, dtype = NUM.int32)

        #### Keep Track of Time-Wise Outlier Stats ####
        self.numOutliersOverTime = 0
        self.numTestsOverTime = 0

        for i in range(self.numLocations):
            startIndex = self.startOutlierIndex[i]
            fitted = forecastObject.fitForecast[startIndex:forecastObject.numTime,i]
            data = forecastObject.data[startIndex:,i]
            outlierInfo = GeneralizedESD(data, fitted, alpha = self.alpha, testSize = self.testSize)
            outlierArray = NUM.zeros(forecastObject.forecastTime, dtype = bool)
            outlierInds = [i + startIndex for i in outlierInfo[1]]
            numOut = len(outlierInds)
            outlierArray[outlierInds] = True
            self.outliers[:,i] = outlierArray
            
            if self.keepStats:
                self.outlierInfo[i] = outlierInfo

            #### Update Time-Wise Outlier Info ####
            self.numOutliersOverTime += numOut
            self.numTestsOverTime += forecastObject.numTime - startIndex

        #### Statistics for Reporting ####
        self.numOutliersByLocation = self.outliers.sum(0)
        self.numOutliersByTime = self.outliers.sum(1)
        self.numLocationsWithOutliers = (self.numOutliersByLocation > 0).sum()
        self.percLocationsWithOutliers = (self.numLocationsWithOutliers / forecastObject.numLocations) * 100
        self.minOutliersByLocation = self.numOutliersByLocation.min()
        self.maxOutliersByLocation = self.numOutliersByLocation.max()
        self.meanOutliersByLocation = self.numOutliersByLocation.mean()
        self.maxOutliersTimeBin = self.numOutliersByTime.argmax()
        minStartIndex = self.startOutlierIndex.min()
        self.minOutliersByTime = self.numOutliersByTime[minStartIndex:forecastObject.numTime].min()
        self.maxOutliersByTime = self.numOutliersByTime[minStartIndex:forecastObject.numTime].max()
        self.meanOutliersByTime = self.numOutliersByTime[minStartIndex:forecastObject.numTime].mean()

    def report(self, location):
        if not self.keepStats:
            ARCPY.AddMessage("You must pass the keepStats parameter as True to get a report.")
            return ""

        strAlpha = UTILS.formatValue(self.alpha, '%0.2f')
        if location not in self.outlierInfo:
            report = "Location {0} has no outliers at the {1} alpha level."
            ARCPY.AddMessage(report.format(location, strAlpha))
            return report

        header = "Time Series Outlier Report for Location {0} at alpha = {1}".format(location, strAlpha)
        rows = [ ["Time Index", "R Value", "Grubb's CV", "Significant"]]
        allTestInds, outlierInds, outlierStats, outlierCVs = self.outlierInfo[location]
        startIndex = self.startOutlierIndex[location]
        for ind, timeIndex in enumerate(allTestInds):
            timeInd = startIndex + timeIndex
            isSig = str(timeIndex in outlierInds)
            row = [ str(timeInd), UTILS.formatValue(outlierStats[ind]),
                   UTILS.formatValue(outlierCVs[ind]), isSig]
            rows.append(row)

        report = UTILS.outputTextTable(rows, justify = ['left', 'right', 'right', 'right'],
                                       header = header, colPad = 3, 
                                       emptyFillToken = "-")

        ARCPY.AddMessage(report)
        return report

def autoCovariance(x, nlag = None):
    n = len(x)
    lag_len = nlag
    if nlag is None:
        lag_len = n - 1
   
    d = n * NUM.ones(2 * n - 1)
    acov = NUM.correlate(x, x, 'full')[n - 1:] / d[n - 1:]
    return acov[:lag_len + 1].copy()

def findfrequency(ts):
    t = len(ts)
    ts_detrend = SIG.detrend(ts)
    maxLag = int(min(t - 1, 10 * NUM.log10(t)))

    #### Estimate Autocovariance ####
    sxx_m = autoCovariance(ts_detrend)[:maxLag + 1]

    phi = NUM.zeros((maxLag + 1, maxLag + 1), 'd')
    sig = NUM.zeros(maxLag + 1)
    aic = [NUM.inf, ] * (maxLag + 1)

    if sxx_m[0] == 0.0:
        return 1

    phi[1, 1] = sxx_m[1] / sxx_m[0]
    sig[1] = sxx_m[0] - phi[1, 1] * sxx_m[1]
    for k in range(2, maxLag + 1):
        phi[k, k] = (sxx_m[k] - NUM.dot(phi[1:k, k-1], sxx_m[1:k][::-1])) / sig[k-1]
        for j in range(1, k):
            phi[j, k] = phi[j, k-1] - phi[k, k] * phi[k-j, k-1]
        sig[k] = sig[k-1] * (1 - phi[k, k]**2)

    aic[1:] = t * NUM.log(sig[1:]) + 2 * (1 + NUM.arange(1, maxLag + 1))

    bestLag = NUM.argmin(aic)
    bestAIC = aic[bestLag]
    bestSigma = sig[bestLag]

    if bestLag == 1:
        bestBetas = NUM.array([phi[1, bestLag]])
    else:
        bestBetas = NUM.array(phi[1:(bestLag+1), bestLag])
    bestBetas = bestBetas.reshape((len(bestBetas), 1))

    f = NUM.arange(0, 500, 501./500.) / 1000.
    spec = NUM.zeros(len(f))

    prediction_variance = bestSigma
    xfreq = 1

    if bestLag >= 1:
        orders = NUM.arange(start=1, stop=bestLag + 1, step=1)
        cs = NUM.dot(NUM.cos(NUM.outer(f, orders) * 2. * NUM.pi), bestBetas)
        sn = NUM.dot(NUM.sin(NUM.outer(f, orders) * 2. * NUM.pi), bestBetas)
        spec = prediction_variance / (xfreq * (NUM.square(1 - cs) + NUM.square(sn)))
    else:
        spec = NUM.rep(prediction_variance, len(f))

    maxSpecInd = spec.argmax()

    if spec[maxSpecInd] > 10:

        if f[maxSpecInd] == 0.00:
            period = NUM.Inf
        else:
            period = NUM.floor(1 / f[maxSpecInd] + 0.5)

        if NUM.isinf(period):
            j = NUM.where(spec[1:] - spec[0:-1] > 0)[0]
            try:
                if len(j):
                    nextmax = j[0] + spec[(j[0] + 1):].argmax()
                    if nextmax < len(f):
                        period = NUM.floor(1 / f[nextmax] + 0.5)
                    else:
                        period = 1
                else:
                    period = 1
            except:
                period = 1
    else:
        period = 1

    #### Period Can't be Larger than 1/3 of T ####
    if period > int(t / 3.0):
        period = 1

    return period

class TS_LinearForecast(object):

    def __init__(self, data, addTime = 0):
        self.addTime = addTime
        self.numTime, self.numLocations = data.shape
        self.totalTime = self.numTime + addTime

        #### Estimation Design Matrix ####
        x = NUM.ones((self.numTime, 2), dtype = float)
        x[:,1] = NUM.arange(self.numTime)

        #### Prediction Design Matrix ####
        px = NUM.ones((self.totalTime, 2), dtype = float)
        px[:,1] = NUM.arange(self.totalTime)

        #### Intermediate Arrays ####
        xt = x.T
        xx = NUM.dot(xt, x)
        xxi = LA.inv(xx)

        #### Result Arrays ####
        self.coef = NUM.zeros((self.numLocations, 2), dtype = float)
        self.residuals = NUM.zeros((self.numTime, self.numLocations), dtype = float)
        self.linearForecast = NUM.zeros((self.totalTime, self.numLocations), dtype = float)

        for i in range(self.numLocations):
            y = data[:,i].reshape(self.numTime, 1)
            yt = y.T

            #### Compute Coefficients ####
            xy = NUM.dot(xt, y)
            coef = NUM.dot(xxi, xy)
            self.coef[i] = coef.ravel()

            #### Estimate and Residuals ####
            yHat = NUM.dot(x, coef)
            self.residuals[:,i] = (y - yHat).ravel()

            #### Linear Forecast ####
            self.linearForecast[:,i] = NUM.dot(px, coef).ravel()


def initial_seasonal_info_old(series, slen, add = True, reverse = True):
    #### Must Have 2 Complete Seasons ####
    t = len(series)
    m2 = slen * 2
    if t < m2:
        ARCPY.AddError("Must Have At Least 2 complete seasons")
        raise SystemExit()

    #### Calculate Seasonal Averages ####
    seasonals = NUM.zeros(slen, dtype = float)
    counts = NUM.zeros(slen, dtype = float)
    for i in range(t):
        seasonals[i % slen] += series[i]
        counts[i % slen] += 1.0

    seasonals = seasonals / counts

    #### Normalize ####
    if add:
        seasonals = seasonals - seasonals.mean()
    else:
        seasonals = seasonals / seasonals.mean()

    #### Initial Intercept and Slope ####
    lenRegression = max(m2, t)
    ds = NUM.zeros((lenRegression,1), dtype = float)
    for i in range(lenRegression):
        if add:
            ds[i] = series[i] - seasonals[i % slen]
        else:
            ds[i] = series[i] / seasonals[i % slen]

    lp = TS_LinearForecast(ds)
    l0 = lp.coef[0][0]
    b0 = lp.coef[0][1]

    #### Put Last Season First for State Space Equations ####
    seasonalTemp = NUM.zeros(slen, dtype = float)
    seasonalTemp[0] = seasonals[-1]
    seasonalTemp[1:] = seasonals[0:-1]
    seasonals = seasonalTemp

    return l0, b0, seasonals

def initial_seasonal_info(series, slen, add = True):
    #### Must Have 2 Complete Seasons ####
    t = len(series)
    m2 = slen * 2
    if t < m2:
        ARCPY.AddError("Must Have At Least 2 complete seasons")
        raise SystemExit()

    #### Calculate Seasonal Averages ####
    cm = centered_ma(series, slen)
    if add:
        dt = series - cm
    else:
        dt = series / cm
    seasonals = NUM.zeros(slen, dtype = float)
    counts = NUM.zeros(slen, dtype = float)
    sCount = 0
    for i in range(t):
        if sCount > m2:
            break
        else:
            d = dt[i]
            if not NUM.isnan(d):
                seasonals[i % slen] += d
                counts[i % slen] += 1.0
                sCount += 1

    seasonals = seasonals / counts

    #### Normalize ####
    if add:
        seasonals = seasonals - seasonals.mean()
    else:
        seasonals = seasonals / seasonals.mean()

    #### Initial Intercept and Slope ####
    lenRegression = max(m2, t)
    ds = NUM.zeros((lenRegression,1), dtype = float)
    for i in range(lenRegression):
        if add:
            ds[i] = series[i] - seasonals[i % slen]
        else:
            ds[i] = series[i] / seasonals[i % slen]

    lp = TS_LinearForecast(ds)
    l0 = lp.coef[0][0]
    b0 = lp.coef[0][1]

    return l0, b0, seasonals

def get_initial_trend_info(series, add = True):
    maxLen = min(10, len(series))
    yValues = series[0:maxLen].reshape(maxLen, 1)
    lp = TS_LinearForecast(yValues)
    l0 = lp.coef[0][0]
    b0 = lp.coef[0][1]

    if not add:
        b0 = 1.0 + (l0 / b0)

    return l0, b0

def centered_ma(a, window):
    m = int(window / 2)
    isEven = window % 2 == 0
    t = len(a)
    cma = NUM.ones(t, dtype = float) * NUM.nan
    if isEven:
        for i in range(m+1, t - (m - 1)):
            backward = a[i - (m + 1): i - 1 + m].mean()
            forward = a[i - m: i + m].mean()
            cma[i-1] = (backward + forward) / 2.0
    else:
        for i in range(m, t - 1):
            cma[i] = a[i - m: i + m+1].mean()

    return cma

def multSeasonTest(data, window, seasons2Test = 1, alpha = .05):
    t = len(data)

    if seasons2Test > window:
        seasons2Test = window

    #### Centered Moving Average ####
    cma = centered_ma(data, window)

    #### Remove Trend ####
    seasonOnly = data - cma

    #### Complete Number of Seasons ####
    numSeasons = int(t / window)
    remainder = window - (t % window)
    all = t + remainder
    seasons = NUM.ones(all, dtype = float) * NUM.nan
    seasons[0:t] = seasonOnly
    ns = int(len(seasons)/window)
    seasons = seasons.reshape(ns, window)

    #### Artificially Add NaNs for Complete CMA ####
    centered = NUM.ones(all, dtype = float) * NUM.nan
    centered[0:t] = cma
    centered = centered.reshape(ns, window)

    #### Get Seasonal Means ####
    sMeans = NUM.nanmean(seasons, 0)

    #### Identify Less than Zero Signs ####
    signMeans = NUM.ones(window, dtype = float) 
    signMeans[sMeans < 0] = -1

    #### Apply Signs to Seasonal Data ####
    sSeasons = seasons * signMeans

    #### Descending Sorted Abs Means ####
    sortedSeasonIDs = abs(sMeans).argsort()[::-1]

    #### Eliminate Based on Number of Tests Requested ####
    sortedSeasonIDs = sortedSeasonIDs[0:seasons2Test]

    #### Do Tests ####
    stats = NUM.zeros(seasons2Test, dtype = float)
    pVals = NUM.zeros(seasons2Test, dtype = float)
    for i in range(seasons2Test):
        col = sortedSeasonIDs[i]
        vals = sSeasons[:,col]
        vals = vals[~NUM.isnan(vals)]
        cm = centered[:,col]
        cm = cm[~NUM.isnan(cm)]
        stat, pv = SCISTAT.pearsonr(vals,cm)
        oneSided = 1.0 - .5 * pv
        stats[i] = stat
        pVals[i] = oneSided

    #### Get Medians ####
    medP = NUM.median(pVals)
    medS = NUM.median(stats)

    #### If Negative Correlation it is Additive ####
    if medS <= 0:
        medP = 1.0

    if medP <= alpha:
        b = True
    else:
        b = False

    return stats, pVals, b


############################ Optimize ###########################

def opt_hw_aaa(input_params, y, lStart, bStart, sStart):
    alpha, beta_star, gamma_star = input_params

    ssd = ARC._ss.hw_aaa(y, alpha, beta_star, gamma_star, lStart, bStart, sStart)

    return ssd

def opt_hw_aada(input_params, y, lStart, bStart, sStart):
    alpha, beta_star, gamma_star, phi = input_params

    ssd = ARC._ss.hw_aaa(y, alpha, beta_star, gamma_star, lStart, bStart, sStart, phi)

    return ssd

def opt_hw_aa(input_params, y, lStart, bStart):
    alpha, beta_star = input_params

    ssd = ARC._ss.hw_aa(y, alpha, beta_star, lStart, bStart)

    return ssd

def opt_hw_aad(input_params, y, lStart, bStart):
    alpha, beta_star, phi = input_params

    ssd = ARC._ss.hw_aa(y, alpha, beta_star, lStart, bStart, phi)

    return ssd

def opt_hw_aam(input_params, y, lStart, bStart, sStart):
    alpha, beta_star, gamma_star = input_params

    ssd = ARC._ss.hw_aam(y, alpha, beta_star, gamma_star, lStart, bStart, sStart)

    return ssd

def opt_hw_aadm(input_params, y, lStart, bStart, sStart):
    alpha, beta_star, gamma_star, phi = input_params

    ssd = ARC._ss.hw_aam(y, alpha, beta_star, gamma_star, lStart, bStart, sStart, phi)

    return ssd

########## Core Functions #############

def forecast_aaa(m, h, s2, alpha, beta_star, gamma_star, level, trend, seasonal, phi = 1.0):
    dampen = UTILS.compareFloat(phi, 1.0) is False
    beta = beta_star * alpha
    gamma = (1 - alpha) * gamma_star
    forecast = NUM.zeros((3, h), dtype = float)
    components = NUM.zeros((3, h), dtype = float)
    phi_h = 0.0

    for i in range(1, h+1):
        ind = i - 1
        phi_h += phi**i
        phiTrend = (phi_h * trend)
        #phiTrend = ((phi * i) * trend)
        season = seasonal[ind % m]
        pred = level + phiTrend + season
        if i == 1:
            v = s2
        else:
            h_m = (i - 1) // m
            if dampen:
                v = s2 * (1 + (alpha**2.0 * (i - 1)) + ((beta * phi * i) / (1 - phi)**2.0) \
                    * (2 * alpha * (1 - phi) + beta * phi) \
                    - (beta * phi * (1 - phi**i)) / ((1 - phi)**2 * (1 - phi**2)) \
                    * (2 * alpha * (1 - phi**2) + beta * phi * (1 + 2*phi - phi**i)) \
                    + gamma * h_m * (2 * alpha + gamma) \
                    + ((2 * beta * gamma * phi) / ((1 - phi) * (1 - phi**m))) \
                    * (h_m * (1 - phi**m) - phi**m * (1 - phi**(m * h_m))))
            else:
                v = s2 * (1 + (i - 1) \
                    * (alpha**2 + alpha * beta * i + (1/6) * beta**2 * i * (2 * i - 1)) \
                    + gamma * h_m * (2 * alpha + gamma + beta * m * (h_m + 1)))
        
        #### Add Results ####
        dev = 1.96 * NUM.sqrt(v) 
        forecast[0,ind] = pred - dev
        forecast[1,ind] = pred
        forecast[2,ind] = pred + dev

        components[0,ind] = level
        components[1,ind] = phiTrend
        components[2,ind] = season

    return forecast, components

def forecast_aa(h, s2, alpha, beta_star, level, trend, phi = 1.0):
    dampen = UTILS.compareFloat(phi, 1.0) is False
    beta = beta_star * alpha
    forecast = NUM.zeros((3, h), dtype = float)
    components = NUM.zeros((3, h), dtype = float)
    phi_h = 0.0

    for i in range(1, h+1):
        ind = i - 1
        phi_h += phi**i
        phiTrend = (phi_h * trend)
        #phiTrend = ((phi * i) * trend)
        pred = level + phiTrend

        if i == 1:
            v = s2
        else:
            if dampen:
                v = s2 * (1 + (alpha**2.0 * (i - 1)) + ((beta * phi * i) / (1 - phi)**2.0) \
                    * (2 * alpha * (1 - phi) + beta * phi) \
                    - (beta * phi * (1 - phi**i)) / ((1 - phi)**2 * (1 - phi**2)) \
                    * (2 * alpha * (1 - phi**2) + beta * phi * (1 + 2*phi - phi**i)))
            else:
                v = s2 * (1 + (i - 1) \
                    * (alpha**2 + alpha * beta * i + (1/6) * beta**2 * i * (2 * i - 1)))

        #### Add Results ####
        dev = 1.96 * NUM.sqrt(v) 
        forecast[0,ind] = pred - dev
        forecast[1,ind] = pred
        forecast[2,ind] = pred + dev

        components[0,ind] = level
        components[1,ind] = phiTrend

    return forecast, components

def forecast_mam(m, h, s2, alpha, beta_star, gamma_star, level, trend, seasonal, phi = 1.0):
    dampen = UTILS.compareFloat(phi, 1.0) is False
    beta = beta_star * alpha
    gamma = (1 - alpha) * gamma_star
    forecast = NUM.zeros((3, h), dtype = float)
    components = NUM.zeros((3, h), dtype = float)
    onePlusSig = 1 + s2
    onePlusGS = 1 + (gamma**2.0 * s2)
    thetas = NUM.zeros(h, dtype = float)
    phi_h = 0.0

    for i in range(1, h+1):
        ind = i - 1
        mod = ind % m
        phi_h += phi**i
        phiTrend = (phi_h * trend)
        #phiTrend = ((phi * i) * trend)
        season = seasonal[mod]
        mu_tilde = level + phiTrend
        pred = mu_tilde * season
        season2 = season**2.0

        #### Calculate Theta ####
        init_theta = mu_tilde**2.0
        if i == 1:
            theta_h = init_theta
        else:
            c2 = (alpha + (beta * phi * (i-1)))**2.0
            theta_h = init_theta + (s2 * ((c2* thetas[0:ind]).sum()))
        thetas[ind] = theta_h
        
        #### Calculate Variance ####
        v = season2 * ((theta_h * onePlusSig * onePlusGS**mod) - init_theta)
        
        #### Add Results ####
        dev = 1.96 * NUM.sqrt(v) 
        forecast[0,ind] = pred - dev
        forecast[1,ind] = pred
        forecast[2,ind] = pred + dev

        components[0,ind] = level
        components[1,ind] = phiTrend
        components[2,ind] = season

    return forecast, components

class OptimizedHoltWinters(object):

    def __init__(self, data, dampen = True, seasonalInt = None, seasonalType = "add"):
        UTILS.assignClassAttr(self, locals())
        self.numTime = len(data)
        self.data = self.data.ravel()

        #### Set/Find Seasonal Int ####
        if seasonalInt is not None:
            self.seasonalInt = seasonalInt
        else:
            self.seasonalInt = findfrequency(data)

        self.seasonalInt = int(self.seasonalInt)
        self.isSeasonal = self.seasonalInt > 1

        #### Check Seasonal Mult ####
        self.add = self.seasonalType.upper() == "ADD"
        if self.isSeasonal and not self.add:
            if self.data.min() <= 0:
                msg = "Multiplicative Seasons requires that all the data is greater than zero"
                ARCPY.AddError(msg)
                raise SystemExit

        #### Get Initial Info ####
        if self.isSeasonal:
            self.level0, self.trend0, self.seasonal0 = initial_seasonal_info(self.data,
                                                                             self.seasonalInt,
                                                                             add = self.add)
        else:
            self.level0, self.trend0 = get_initial_trend_info(self.data)

        #### Set Holt Winter's Type Methods ####
        if self.isSeasonal:
            self.args = (self.data, self.level0, self.trend0, self.seasonal0)
            if self.add:
                if self.dampen:
                    self.opt_hw = opt_hw_aada
                    self.hw = ARC._ss.hw_aaa
                    self.pstart = [.1, .01, .01, .98]
                    self.bounds = ((0,1), (0,1), (0,1), (.8, 1.0))
                    self.modelType = "AAdA"
                else:
                    self.opt_hw = opt_hw_aaa
                    self.hw = ARC._ss.hw_aaa
                    self.pstart = [.1, .01, .01]
                    self.bounds = ((0,1), (0,1), (0,1))
                    self.modelType = "AAA"
            else:
                if self.dampen:
                    self.opt_hw = opt_hw_aadm
                    self.hw = ARC._ss.hw_aam
                    self.pstart = [.1, .01, .01, .98]
                    self.bounds = ((0,1), (0,1), (0,1), (.8, 1.0))
                    self.modelType = "MAdM"
                else:
                    self.opt_hw = opt_hw_aam
                    self.hw = ARC._ss.hw_aam
                    self.pstart = [.1, .01, .01]
                    self.bounds = ((0,1), (0,1), (0,1))
                    self.modelType = "MAM"
        else:
            self.args = (self.data, self.level0, self.trend0)
            if self.dampen:
                self.opt_hw = opt_hw_aad
                self.hw = ARC._ss.hw_aa
                self.pstart = [.1, .01, .98]
                self.bounds = ((0,1), (0,1), (.8, 1.0))
                self.modelType = "AAd"
            else:
                self.opt_hw = opt_hw_aa
                self.hw = ARC._ss.hw_aa
                self.pstart = [.1, .01]
                self.bounds = ((0,1), (0,1))
                self.modelType = "AA"

        #### Find Optimal Smoothing Params ####
        nm = OPT.minimize(self.opt_hw, self.pstart, bounds = self.bounds, 
                          args = self.args, method = "L-BFGS-B")

        #### Calculation ####
        if self.isSeasonal:
            if self.dampen:
                #### AAdA or AAdM ####
                self.alpha, self.beta_star, self.gamma_star, self.phi = nm['x']
                res = self.hw(self.data, self.alpha, self.beta_star, self.gamma_star,
                              self.level0, self.trend0, self.seasonal0, phi = self.phi,
                              return_arrays = True)
            else:
                #### AAA or AAM ####
                self.alpha, self.beta_star, self.gamma_star = nm['x']
                res = self.hw(self.data, self.alpha, self.beta_star, self.gamma_star,
                              self.level0, self.trend0, self.seasonal0,
                              return_arrays = True)
                self.phi = 1.0

            #### Parse Results and Set Members ####
            self.fitted, self.comp, self.ssd = res

            #### Set Seasonal Info ####
            self.seasons = self.comp[:,2]
            self.seasonalt = self.seasons[-self.seasonalInt:]
            self.gamma = (1 - self.alpha) * self.gamma_star
        else:
            if self.dampen:
                #### AAd ####
                self.alpha, self.beta_star, self.phi = nm['x']
                res = self.hw(self.data, self.alpha, self.beta_star,
                              self.level0, self.trend0, phi = self.phi,
                              return_arrays = True)
            else:
                #### AA ####
                self.alpha, self.beta_star = nm['x']
                res = self.hw(self.data, self.alpha, self.beta_star,
                              self.level0, self.trend0,
                              return_arrays = True)
                self.phi = 1.0

            #### Parse Results and Set Members ####
            self.fitted, self.comp, self.ssd = res

        #### Set Levels and Trends ####
        self.levels = self.comp[:,0]
        self.trends = self.comp[:,1]

        #### Set Final Info for Forecasting ####
        self.beta = self.alpha * self.beta_star
        self.levelt = self.levels[-1]
        self.trendt = self.trends[-1]
        self.s2 = self.ssd / self.numTime

    def forecast(self, h):
        if self.isSeasonal:
            if self.add:
                pred, comp = forecast_aaa(self.seasonalInt, h, self.s2, 
                                          self.alpha, self.beta_star, self.gamma_star, 
                                          self.levelt, self.trendt, self.seasonalt, 
                                          phi = self.phi)
            else:
                pred, comp = forecast_mam(self.seasonalInt, h, self.s2, 
                                          self.alpha, self.beta_star, self.gamma_star, 
                                          self.levelt, self.trendt, self.seasonalt, 
                                          phi = self.phi)

        else:
            pred, comp = forecast_aa(h, self.s2, self.alpha, self.beta_star, 
                                     self.levelt, self.trendt, phi = self.phi)

        self.lowInterval = pred[0,:]
        self.prediction = pred[1,:]
        self.highInterval = pred[2,:]

        #### Create Components ####
        forecastTime = self.numTime + h
        self.levelComponents = NUM.zeros(forecastTime, dtype = float)
        self.trendComponents = NUM.zeros(forecastTime, dtype = float)
        self.seasonComponents = NUM.zeros(forecastTime, dtype = float)

        #self.levelComponents[:self.numTime] = self.levels
        self.levelComponents[:self.numTime] = self.comp[:,0]
        self.levelComponents[self.numTime:] = comp[0]

        #self.trendComponents[:self.numTime] = self.trends
        self.trendComponents[:self.numTime] = self.comp[:,1]
        self.trendComponents[self.numTime:] = comp[1]

        if self.isSeasonal:
            #self.seasonComponents[:self.numTime] = self.seasons
            self.seasonComponents[:self.numTime] = self.comp[:,2]
            self.seasonComponents[self.numTime:] = comp[2]

    def plot(self, clip = False):
        p = PLT.figure(plot_width=800, plot_height=350)
        titleText = "Holt Winters Model ({0}) [Clipped = {1}]".format(self.modelType,
                                                                      str(clip))
        t = Title()
        t.text = titleText
        p.title = t

        h = len(self.prediction)

        #### Optionally Clip to End ####
        numTime = self.numTime
        data = self.data
        fitted = self.fitted
        if clip:
            numTime = int(self.numTime * .05)
            data = data[-numTime:]
            fitted = fitted[-numTime:]

        #### Get Max Time ####
        maxTime = numTime + h

        #### Get Range Arrays ####
        ntArray = NUM.arange(numTime)
        ptArray = NUM.arange(numTime, maxTime)


        p.line(ntArray, data, color = 'black')
        p.line(ntArray, fitted, color = 'red')
        p.line(ptArray, self.prediction, color = 'red')
        #if self.add:
        #    p.line(ptArray, self.lowInterval, color = 'blue')
        #    p.line(ptArray, self.highInterval, color = 'blue')
        p.line(ptArray, self.lowInterval, color = 'blue')
        p.line(ptArray, self.highInterval, color = 'blue')
        output_file("foo.html")
        show(p)


def getValidationMetrics(ohw, validationSize):

    #### Clip Data ####
    lessNumTime = ohw.numTime - validationSize
    validationData = ohw.data[:lessNumTime]

    #### Fit Model ####
    validation_ohw = OptimizedHoltWinters(validationData, dampen = ohw.dampen, 
                                     seasonalInt = ohw.seasonalInt, 
                                     seasonalType = ohw.seasonalType)

    #### Predict ####
    validation_ohw.forecast(validationSize)

    #### Validation SSD ####
    actual = ohw.data[lessNumTime:]
    res = actual - validation_ohw.prediction
    ssd = (res**2.0).sum()

    #### Validation MSE ####
    rmse = NUM.sqrt(ssd / validationSize)

    return ssd, rmse


def HLNTest(raw, f1, f2, forecastSteps=1, alpha = 0.05):
    '''
    H0: Two forecasts f1 and f2 have the same accuracy.
    H1: The first forecast f1 is more accurate than the second forecast f2.
    :param raw: raw data
    :param f1: forecast 1 (fitted data)
    :param f2: forecast 2 (fitted data)
    :param forecastSteps: number of steps for forecast, used for determing which method to use (D-M test vs. HLN test)
    :param alpha: significant p-value used for Z or T test
    :return:
    '''
    from scipy import stats as STATS

    T = len(raw)
    d1t = NUM.square(f1[0: T] - raw)
    d2t = NUM.square(f2[0: T] - raw)
    useHLN = T < 30 or forecastSteps > 1
    h = MATH.ceil(T**0.333)

    dt = d1t - d2t
    dmean = NUM.mean(dt)
    dt_demean = dt - dmean
    acov = NUM.correlate(dt_demean, dt_demean, 'full') / T  # this part can be optimized since we only use a small portion of the acov

    DMScore = dmean / (NUM.abs(acov[T-h: T+h+1].sum()/T)**0.5)

    if useHLN:
        DMScore *= ((T + 1 - 2 * h + h * (h - 1)/T) / T) ** 0.5
        pvalue = STATS.t.cdf(DMScore, df=T - 1)
    else:
        pvalue = STATS.norm.cdf(DMScore)

    if pvalue <= alpha:
        equivalent = False
    else:
        equivalent = True

    return equivalent


def HLNTestBatch(raw, fitValues, rmseValues, stepBegin, forecastSteps=1, alpha=0.05):
    '''
    H0: Two forecasts f1 and f2 have the same accuracy.
    H1: The first forecast f1 is more accurate than the second forecast f2.
    :param raw: raw data
    :param fitValues: collection of fitted data for comparison
    :param rmseValues the RMSE values of the fitted-time-series to row-time-series
    :param stepBegin: the beginning step of the fitted, not necessarily equal to 0 since forest-based method uses some as trainning data
    :param forecastSteps: number of steps for forecast, used for determing which method to use (D-M test vs. HLN test)
    :param alpha: significant p-value used for Z or T test
    :return:
    '''
    from scipy import stats as STATS
    T = len(raw-stepBegin)
    useHLN = T < 30 or forecastSteps > 1
    h = MATH.ceil(T ** 0.333)

    order = NUM.argsort(rmseValues)
    equivalentFitList = [order[0]]
    dt0 = NUM.square(fitValues[order[0]][stepBegin:] - raw[stepBegin:])

    for id in order[1:]:
        dt1 = NUM.square(fitValues[id][stepBegin:] - raw[stepBegin:])
        dt = dt0 - dt1
        dmean = NUM.mean(dt)
        dt_demean = dt - dmean
        acov = NUM.correlate(
            dt_demean,
            dt_demean,
            'full') / T  # this part can be optimized since we only use a small portion of the acov

        v = NUM.abs(acov[T - h: T + h + 1].sum() / T)
        if v < 1e-8:
            v = 1e-8
        DMScore = dmean / NUM.sqrt(v)
        if useHLN:
            DMScore *= (((T + 1 - 2 * h + h * (h - 1) / T) / T) ** 0.5)
            pvalue = STATS.t.cdf(DMScore, df=T - 1)
        else:
            pvalue = STATS.norm.cdf(DMScore)

        if pvalue <= alpha:
            pass
        else:
            equivalentFitList.append(id)

    return NUM.array(equivalentFitList)