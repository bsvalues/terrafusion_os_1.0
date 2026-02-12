import numpy as np


def rayleigh_fit(samples):
    """
    Estimates the parameters of a rayleigh distribution based on sample set 

    Parameters
    ----------
    samples : list of sample values

    Returns
    ----------
    loc : location of rayleigh distribution (minimum value)
    scale : scale of rayleigh distribution (mode value)
    """

    loc = np.min(samples)
    scale = np.sqrt(1. / (2 * len(samples)) * np.sum((samples - loc) ** 2))
    return loc, scale
