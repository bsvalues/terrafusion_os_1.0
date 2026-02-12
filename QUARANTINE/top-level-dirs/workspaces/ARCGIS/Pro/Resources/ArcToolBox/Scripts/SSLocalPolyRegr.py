"""
This file contains the function for local polynomial regression
Origin from https://github.com/franwe/localpoly
"""

import random
import numpy as np
import math
import scipy.interpolate as interpolate  # B-Spline
from scipy.stats import norm
import arcpy as ARCPY

RANDOM_STATE = 1


def chunks(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i: i + n]


def sort_values_by_X(X, y, w=None):
    inds = np.argsort(X)
    X_sorted = X[inds]
    y_sorted = y[inds]
    if w is None:
        return X_sorted, y_sorted, w
    else:
        return X_sorted, y_sorted, w[inds]

def create_partitions(X, y, n_sections, sampling_type):
    n = X.shape[0]
    if sampling_type == "random":
        idx = list(range(0, n))
        random.seed(RANDOM_STATE)  # not np.random.seed !!!
        random.shuffle(idx)
    elif sampling_type == "slicing":
        idx = list(range(0, n))
    X_partition_idxs = list(chunks(idx, math.ceil(n / n_sections)))
    return X_partition_idxs


def bspline(x, y, sections, degree=3):
    idx = np.linspace(0, len(x) - 1, sections + 1, endpoint=True).round(0).astype("int")
    x = x[idx]
    y = y[idx]

    t, c, k = interpolate.splrep(x, y, s=0, k=degree)
    spline = interpolate.BSpline(t, c, k, extrapolate=True)
    pars = {"t": t, "c": c, "deg": k}
    points = {"x": x, "y": y}
    return pars, spline, points

# ----------------- with tau ------- Rookley + Haerdle (Applied Quant. Finance)
def gaussian_kernel(x, Xi, h):
    """Gaussian Kernel.

    :math:`K(u) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{1}{2} u^2}` where :math:`u = \\frac {x - X_i}{h}`

    Args:
        x (float): point of interest
        Xi (array): data points, surrounding of x
        h (float): bandwidth

    Returns:
        ndarray: Kernel function for the point x
    """
    u = (x - Xi) / h
    return norm.pdf(u), None

def gaussian_trim_kernel(x, Xi, h):
    """Gaussian Kernel.

    :math:`K(u) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{1}{2} u^2}` where :math:`u = \\frac {x - X_i}{h}`

    Args:
        x (float): point of interest
        Xi (array): data points, surrounding of x
        h (float): bandwidth

    Returns:
        ndarray: Kernel function for the point x
    """
    u = (x - Xi) / h
    valid_inds = np.where((u >= -3) & (u < 3))[0]
    if len(valid_inds):
        return norm.pdf(u[valid_inds]), valid_inds
    else:
        return norm.pdf(u), np.array(range(len(Xi)))

def epanechnikov_kernel(x, Xi, h):
    """Epanechnikov kernel

    :math:`K(u) = \\frac{3}{4} \\left( 1 - u^2 \\right)` where :math:`u = \\frac {x - X_i}{h}`

    Args:
        x (float): point of interest
        Xi (array): data points, surrounding of x
        h (float): bandwidth

    Returns:
        ndarray: Kernel function for the point x
    """
    u = (x - Xi) / h
    indicator = np.where(abs(u) <= 1, 1, 0)
    k = 0.75 * (1 - u ** 2)
    return k * indicator, None


kernel_dict = {
    "gaussian": gaussian_kernel,
    "epanechnikov": epanechnikov_kernel,
    "gaussian_trim": gaussian_trim_kernel
    }


class LocalPolynomialRegression:
    """Local polynomial regression.

    LocalPolynomialRegression fits a polynomial of degree 3 in to the sourrounding of each point.
    The surrounding is realized by a kernel with bandwidth h. The regression returns the fit, as
    well as its first and second derivative.

    Parameters:
        X: X-values of data that is to be fitted (explanatory variable)
        y: y-values of data that is to be fitted (observations)
        h: bandwidth for the kernel
        gridsize: desired size of the fit (granularity)
        kernel_str: the name of the kernel as a string "gaussian"
    """

    def __init__(self, X, y, h, w=None, kernel="gaussian", gridsize=100, local_poly_order=2, mute_progress=False):
        self.X = X
        self.y = y
        self.h = h
        self.w = w
        self.local_poly_order = local_poly_order
        if w is not None:
            valid_inds = np.where(w != 0)[0]
            self.w = w[valid_inds].copy()
            self.X = X[valid_inds].copy()
            self.y = y[valid_inds].copy()
        self.kernel_str = kernel
        self.kernel = kernel_dict[self.kernel_str]
        self.gridsize = gridsize
        self.mute_progress = mute_progress

    def localpoly_old(self, x):
        """Calculates estimate for position x via Local Polynomial Regression.
        The usage of Local Polynomial Regression allows to not only calculate the estimate, but also its first and
        second derivative in this point. Data (X, y) and regression settings (kernel, h) are saved in self.
        Args:
            x (float): Position for which to calculate the estimated value.
        Returns:
            dict: Results of regression. The estimated value for point x, its first and second derivative in this point
            and the weight vector of the influence of the surrounding points.::
                {"fit": beta[0], "first": beta[1], "second": beta[2], "weight": W_hi}
        """
        n = self.X.shape[0]
        kernel, _ = self.kernel(x, self.X, self.h)
        if self.w is not None and len(self.w) == len(self.X):
            K_i = self.w / self.h * kernel
        else:
            K_i = 1 / self.h * kernel
        f_i = 1 / n * sum(K_i)

        if f_i == 0:  # doesnt really happen, but in order to avoid possible errors
            W_hi = np.zeros(n)
        else:
            W_hi = K_i / f_i

        X1 = np.ones(n)
        X2 = self.X - x
        X3 = X2 ** 2

        X = np.array([X1, X2, X3]).T
        W = np.diag(W_hi)  # (n,n)

        XTW = (X.T).dot(W)  # (3,n)
        XTWX = XTW.dot(X)  # (3,3)
        XTWy = XTW.dot(self.y)  # (3,1)

        beta = np.linalg.pinv(XTWX).dot(XTWy)  # (3,1)
        return {"fit": beta[0], "first": beta[1], "second": beta[2], "weight": W_hi}

    def localpoly(self, x_i):
        """Calculates estimate for position x via Local Polynomial Regression.

        The usage of Local Polynomial Regression allows to not only calculate the estimate, but also its first and
        second derivative in this point. Data (X, y) and regression settings (kernel, h) are saved in self.

        Args:
            x_i (float): Position for which to calculate the estimated value.

        Returns:
            dict: Results of regression. The estimated value for point x, its first and second derivative in this point
            and the weight vector of the influence of the surrounding points.::

                {"fit": beta[0], "first": beta[1], "second": beta[2], "weight": W_hi}
        """
        if self.local_poly_order == 0:
            return self.localWAvg(x_i)

        x = self.X
        y = self.y
        w = self.w
        h = self.h
        K_i, valid_inds = self.kernel(x_i, x, self.h)
        K_i /= h
        if valid_inds is not None:
            x = x[valid_inds]
            y = y[valid_inds]
            if w is not None:
                w = w[valid_inds]
        if w is not None:
            K_i *= w
        n = x.shape[0]
        f_i = 1 / n * sum(K_i)

        if f_i == 0:  # doesn't really happen, but in order to avoid possible errors
            W_hi = np.zeros(n)
        else:
            W_hi = K_i / f_i

        if self.local_poly_order == 0:
            X = np.ones(n).reshape(-1, 1)
        elif self.local_poly_order == 1:
            X1 = np.ones(n)
            X2 = x - x_i
            X = np.array([X1, X2]).T
        else:
            X1 = np.ones(n)
            X2 = x - x_i
            X3 = X2 ** 2
            X = np.array([X1, X2, X3]).T

        W = np.diag(W_hi)  # (n,n)

        XTW = (X.T).dot(W)  # (3,n)
        XTWX = XTW.dot(X)  # (3,3)
        XTWy = XTW.dot(y)  # (3,1)

        beta = np.linalg.pinv(XTWX).dot(XTWy)  # (3,1)
        # return {"fit": beta[0], "first": beta[1], "second": beta[2], "weight": W_hi}

        if self.local_poly_order == 0:
            return {"fit": beta[0], "first": 0, "second": 0}
        elif self.local_poly_order == 1:
            return {"fit": beta[0], "first": beta[1], "second": 0}
        else:
            return {"fit": beta[0], "first": beta[1], "second": beta[2]}

    def localWAvg(self, x_i):
        """Calculates estimate for position x via Local Weighted Average.

        When the order of local poly is set to 0, the local polynomial function regress to local weighted average

        Args:
            x_i (float): Position for which to calculate the estimated value.

        Returns:
            dict: Results of regression. The estimated value for point x, its first and second derivative in this point
            and the weight vector of the influence of the surrounding points.::

                {"fit": beta[0], "first": beta[1], "second": beta[2], "weight": W_hi}
        """
        x = self.X
        y = self.y
        w = self.w
        h = self.h
        K_i, valid_inds = self.kernel(x_i, x, self.h)
        K_i /= h
        if valid_inds is not None:
            x = x[valid_inds]
            y = y[valid_inds]
            if w is not None:
                w = w[valid_inds]
        if w is not None:
            K_i *= w
        n = x.shape[0]
        f_i = 1 / n * sum(K_i)

        if f_i == 0:  # doesn't really happen, but in order to avoid possible errors
            W_hi = np.zeros(n)
        else:
            W_hi = K_i / f_i

        return {"fit": (y * W_hi).sum() / W_hi.sum(), "first": 0, "second": 0}

    def fit(self, prediction_interval, customized_domain=None):
        """Fit the Local Polynomial Regression model for the prediction interval.

        Args:
            prediction_interval (tuple): interval for which the prediction is calculated
            customized_domain (np.array): customized domain for the prediction
        Returns:
            dict: Results of the fit. The estimated function (fit) in the prediction interval (X) and its first and
            second derivative::

                {
                    'X' : X_domain,    # prediction interval of fit
                    'fit': fit,        # fit of the function at point x
                    'first': first,    # first derivative at point x
                    'second': second,  # second derivative at point x
                }
        """
        if prediction_interval is not None:
            X_min, X_max = prediction_interval
            X_domain = np.linspace(X_min, X_max, self.gridsize)
        else:
            X_domain = customized_domain
        fit = np.zeros(len(X_domain))
        first = np.zeros(len(X_domain))
        second = np.zeros(len(X_domain))
        if not self.mute_progress:
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220773), 0, self.gridsize, 1)

        for i, x in enumerate(X_domain):
            results = self.localpoly(x)
            fit[i] = results["fit"]
            first[i] = results["first"]
            second[i] = results["second"]
            if not self.mute_progress:
                ARCPY.SetProgressorPosition()
        if not self.mute_progress:
            ARCPY.ResetProgressor()

        return {"X": X_domain, "fit": fit, "first": first, "second": second}


class LocalPolynomialRegressionCV(LocalPolynomialRegression):
    """Bandwidth Selection via Cross Validation for Local Polynomial Regression.

    LocalPolynomialRegressionCV performs the parameter optimization for LocalPolynomialRegression. The optimal Bandwidth
    highly depends on the data (X, y) and the kernel.

    Args:
        X (np.array): X-values of data that is to be fitted (explanatory variable)
        y (np.array): y-values of data that is to be fitted (observations)
        kernel (str, optional): Name of the kernel. Defaults to "gaussian".
        gridsize (int, optional): Desired size of the fit - granularity. Defaults to 100.
        n_sections (int, optional): Amount of sections to devide the dataset in cross validation (k-folds). Defaults to 10.
                                    If 0 is provided, the algorithm will not execute n-fold and do the real cross-validation
                                    But indeed will calculate the RMSE on the entire dataset to make it quicker
        loss (str, optional): Loss function for optimization. Defaults to "MSE".
        sampling (str, optional): Whether the dataset should be partitioned "random" or as "slicing". Defaults to "random".

    Attributes:
        prediction_interval: Interval in which to calculate the estimates, automatically set to (X.min(), X.max())
    """

    def __init__(
            self,
            X,
            y,
            w=None,
            kernel="gaussian",
            gridsize=100,
            n_sections=10,
            loss="MSE",
            sampling="random",
            local_poly_order=2,
            mute_progress=False,
    ):
        self.n_sections = n_sections
        self.loss = loss
        self.sampling = sampling
        self.prediction_interval_ = (X.min(), X.max())
        self.local_poly_order = local_poly_order
        self.mute_progress = mute_progress

        # invoking the __init__ of the parent class
        LocalPolynomialRegression.__init__(self, X=X, y=y, w=w, h=None, kernel=kernel,
                                           gridsize=gridsize, local_poly_order=local_poly_order,
                                           mute_progress=mute_progress)

    def bandwidth_cv(
        self,
        coarse_list_of_bandwidths,
        allow_fine_search_cross_boundary=True
    ):
        """Cross Validation for Bandwidth optimization.

        The CV Routine is performed twice. First, for a ``coarse_list_of_bandwidths``, then on a finer grid which spans
        around the first optimal value, ``fine_list_of_bandwidths``.

        Args:
            coarse_list_of_bandwidths (list): coarse list of bandwidths, it is suggested to give values around the Silverman bandwidth

        Returns:
            dict: fine results and coarse results of bandwidth search::

                {
                    "fine results": {
                        "bandwidths": fine_list_of_bandwidths,
                        "MSE": # mean squared errors for bandwidths,
                        "h": # optimal bandwidth within fine_list_of_bandwidths,
                    },
                    "coarse results": {
                        # ... same as above but with coarse_list_of_bandwidths
                    },
                }
        """
        FINE_SEARCH_STEPS = 10
        self.total_poly_called = 0
        if not self.mute_progress:
            # ARCPY.AddMessage(f"Total number of tests is {(len(coarse_list_of_bandwidths) + FINE_SEARCH_STEPS) * (self.n_sections if self.n_sections > 0 else 1)}.")
            ARCPY.SetProgressor(
                "step", ARCPY.GetIDMessage(220774),
                0, (len(coarse_list_of_bandwidths) + FINE_SEARCH_STEPS) * (self.n_sections if self.n_sections > 0 else 1), 1)

        if self.n_sections == 0:
            random.seed(RANDOM_STATE)
            sampling_func = self._bandwidth_quick_sampling
            max_section_comparison_length = min(len(self.y), 100)
            random_inds = random.sample(range(len(self.y)), max_section_comparison_length)

        else:
            sampling_func = self._bandwidth_cv_sampling
            random_inds = None


        # 1) coarse parameter search
        coarse_results = sampling_func(coarse_list_of_bandwidths, random_inds)

        # 2) fine parameter search, around minimum of first search
        coarse_h = coarse_results["h"]
        stepsize = coarse_list_of_bandwidths[1] - coarse_list_of_bandwidths[0]
        fine_range = [coarse_h - (stepsize * 1.1), coarse_h + (stepsize * 1.1)]
        if not allow_fine_search_cross_boundary:
            if fine_range[0] < coarse_list_of_bandwidths[0]:
                diff = coarse_list_of_bandwidths[0] - fine_range[0]
                fine_range[0] += diff
                fine_range[1] += diff

        fine_list_of_bandwidths = np.linspace(fine_range[0], fine_range[1], FINE_SEARCH_STEPS)

        fine_results = sampling_func(fine_list_of_bandwidths, random_inds)

        if not self.mute_progress:
            ARCPY.ResetProgressor()

        return {
            "fine results": fine_results,
            "coarse results": coarse_results,
        }

    def _bandwidth_cv_sampling(self, list_of_bandwidths, _):
        """The actual CV.

        First, the data is sorted by X, which is important in case the sampling type "slicing" was selected. Then the
        partitions for the CV are created (slices or random). Finally the CV is performed.
        Args:
            list_of_bandwidths (list): list of bandwidths that are evaluated

        Returns:
            dict: Results of CV. List of bandwidth that were evaluated. MSE for each bandwidth. Optimal bandwidth "h".
        """
        X_sorted, y_sorted, w_sorted = sort_values_by_X(self.X, self.y, self.w)
        X_sections = create_partitions(X_sorted, y_sorted, self.n_sections, self.sampling)
        max_comparisons_per_section = min(len(X_sections[0]), 30)

        num = len(list_of_bandwidths)
        mse_bw = np.zeros(num)  # for each bandwidth have mse - loss function
        total_fit_count = 0

        # for bandwidth h in list_of_bandwidths
        for b, h in enumerate(list_of_bandwidths):
            # take out chunks of our data and do leave-out-prediction
            runs, mse = 0, 0
            for i, section in enumerate(X_sections):
                if not self.mute_progress:
                    ARCPY.SetProgressorPosition()
                X_train, X_test = np.delete(X_sorted, section), X_sorted[section]
                y_train, y_test = np.delete(y_sorted, section), y_sorted[section]
                if w_sorted is None:
                    w_train, w_test = None, None
                else:
                    w_train, w_test = np.delete(w_sorted, section), w_sorted[section]

                max_section_comparison_length = min(len(X_test), max_comparisons_per_section)
                model = LocalPolynomialRegression(X_train, y_train, h, w_train, self.kernel_str, self.gridsize, self.local_poly_order)
                random.seed(RANDOM_STATE)

                # for random y in y_test, extimate y_hat and calculate mse
                for idx_test in random.sample(range(len(X_test)), max_section_comparison_length):
                    y_hat = model.localpoly(X_test[idx_test])["fit"]
                    self.total_poly_called += 1
                    y_true = y_test[idx_test]
                    if w_test is not None:
                        w_loc = w_test[idx_test]
                    else:
                        w_loc = 1.0
                    mse += w_loc * ((y_true - y_hat) ** 2)
                    runs += 1
                    total_fit_count += 1
            mse_bw[b] = 1 / runs * mse
        return {
            "bandwidths": list_of_bandwidths,
            "MSE": mse_bw,
            "h": list_of_bandwidths[mse_bw.argmin()],
        }


    def _bandwidth_quick_sampling(self, list_of_bandwidths, random_inds):
        """The actual do the polynomial regression on entire dataset and calculate the RMSE.
        Args:
            list_of_bandwidths (list): list of bandwidths that are evaluated

        Returns:
            dict: Results of CV. List of bandwidth that were evaluated. MSE for each bandwidth. Optimal bandwidth "h".
        """
        # X_sorted, y_sorted, w_sorted = sort_values_by_X(self.X, self.y, self.w)
        # X_sections = create_partitions(X_sorted, y_sorted, self.n_sections, self.sampling)
        # max_comparisons_per_section = min(len(X_sections[0]), 30)

        num = len(list_of_bandwidths)
        mse_bw = np.zeros(num)  # for each bandwidth have mse - loss function
        total_fit_count = 0

        # for bandwidth h in list_of_bandwidths
        sample_size = len(random_inds)
        y_reals = self.y[random_inds]
        xs = self.X[random_inds]
        if self.w is None:
            ws = np.ones(sample_size)
        else:
            ws = self.w[random_inds]
        for b, h in enumerate(list_of_bandwidths):
            # take out chunks of our data and do leave-out-prediction
            runs, mse = 0, 0
            if not self.mute_progress:
                ARCPY.SetProgressorPosition()
            model = LocalPolynomialRegression(self.X, self.y, h, self.w, self.kernel_str, self.gridsize, self.local_poly_order, mute_progress=self.mute_progress)

            # do the fitting and calculate mse
            y_hats = np.zeros(sample_size)
            for ind, x in enumerate(xs):
                y_hats[ind] = model.localpoly(x)["fit"]
                self.total_poly_called += 1

            mse = (ws * ((y_reals - y_hats) ** 2)).sum()
            mse_bw[b] = mse / sample_size
        return {
            "bandwidths": list_of_bandwidths,
            "MSE": mse_bw,
            "h": list_of_bandwidths[mse_bw.argmin()],
        }