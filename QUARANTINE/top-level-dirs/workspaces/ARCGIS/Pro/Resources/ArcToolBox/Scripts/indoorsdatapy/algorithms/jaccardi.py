# coding: utf-8


import logging
import os
from copy import deepcopy
from itertools import combinations

if os.environ.get('DISPLAY', '') == '':
    print('no display found. Using non-interactive Agg backend')
    import matplotlib as mpl

    mpl.use('Agg')
import numpy as np
from mpl_toolkits.axes_grid1 import make_axes_locatable

logger = logging.getLogger(__name__)


def plot_matrix(data, fig, ax, title):
    """Plot square matrix"""
    # Make indices
    indices = {k: i for i, k in enumerate(data)}
    # Get matrix
    M = jaccardi_matrix(data)
    # Make square similarity matrix
    M0 = np.diagflat(np.ones(len(data)))
    for (i, j), k in M:
        M0[indices[i], indices[j]] = k
        M0[indices[j], indices[i]] = k
    # Plot image
    im = ax.imshow(M0, vmin=0, vmax=1)
    ax.set_title(title)
    # add color axis
    cax = make_axes_locatable(ax).append_axes('right', size='5%', pad=0.05)
    fig.colorbar(im, cax=cax, orientation='vertical')
    # Use names of enties in data instead of numeric axes
    ticks = list(range(len(data)))
    ax.set_xticks(ticks)
    ax.set_yticks(ticks)
    labels = {i: k for k, i in indices.items()}
    ax.set_xticklabels([labels[i] for i in range(len(data))])
    ax.set_yticklabels([labels[i] for i in range(len(data))])


def jaccardi(a, b):
    """Calculate Jaccardi similarity

    Parameters
    ---------
    a: set
        set to compare
    b: iterable
        set to compare
    Return
    -----
    float:
        jaccardi similarity
    """
    if 0 in (len(a), len(b)):
        return 0.
    return len(a.intersection(b)) * 1.0 / len(a.union(b))


def jaccardi_matrix(inp):
    """Build jaccardi matrix

    fills flattened upper triangular matrix (indices i>j)

    Parameters
    ----------
    inp: dict(list(str), list(str))
        Input data

    Returns:
    list(([int], [int], float))
        indices and distances
    """
    return [((i[0], j[0]), jaccardi(i[1], j[1]))
            for i, j in combinations(inp.items(), 2)]


def jaccardian_cluster(inp, threshold=0.1):
    """Hiearchical clustering on Jaccardi similarity

    Parameters
    ----------
    inp : list(dict(str, list(str)))
        transmitter lists for each input file
    threshold : float, optional
        range[0, 1], 0 will cluster ALL data

    Returns
    -----
    list of made links
    dictionary of clusters
    """
    clusters = deepcopy(inp)  # {k: set(v) for k,v in inp.items()}
    links = []
    score = 1
    while len(clusters) > 1 and score > threshold:
        M = jaccardi_matrix(clusters)
        m = list(map(lambda x: x[1], M))
        a = m.index(max(m))
        score = M[a][1]
        if score < threshold:
            break
        link = tuple([
            y for x in M[a][0] for y in (x if isinstance(x, tuple) else (x,))
        ])
        value = set()
        for j in M[a][0]:
            value.update(clusters[j])
            del clusters[j]
        links.append((tuple(link), score))
        clusters[tuple(link)] = value
    return links, clusters
