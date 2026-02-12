import warnings

from pyspark.sql.functions import explode, col
from .sql.functions import geometries, geometry_type


def plot_dataframe(
        df,
        geom_col=None,
        val_col=None,
        is_categorical=False,
        ax=None,
        cmap=None,
        figsize=None,
        aspect="auto",
        max_geoms=3000,
        legend=False,
        legend_kwds=None,
        **style_kwds,
):
    """
    Plot a geometry column in a pyspark dataframe.

    :param df: the dataframe with a geometry column to be plotted
    :type: DataFrame
    :param geom_col: the name of the geometry column if dataframe has more than one geometry column
    :type: String
    :param val_col: the name of the column containing values for color mapping
    :type: String
    :param is_categorical: set to True if the data in te val_col is non-numerical
    :type: Bool
    :param ax: the axes on which to draw the plot
    :type: matplotlib.pyplot.artist
    :param cmap: the name of the matplotlib colormap to use. Must also specify 'val_col'
    :type: String
    :param figsize: the size of resulting matplotlib.figure.Figure. If the argument axes is given, figsize is ignored
    :type: Tuple of Int
    :param aspect: Aspect of the axis.
    :type: String: 'auto', 'equal', None or float
    :param max_geoms: set the number of geometries to collect after calling explode
    :type: Int
    :param legend: set to True to add a legend to the plot
    :type: Bool
    :param legend_kwds: keyword arguments to pass to matplotlib.legend such as 'maxitems', 'ncol', 'loc', 'title'.
    :type: dict
    :param style_kwds: Style options to be passed on to the actual plot function, such as 'edgecolor', 'facecolor',
                      'linewidth', 'markersize', 'alpha'.
    :type: dict
    :return: matplotlib axes
    :rtype: matplotlib.pyplot.artist
    """

    if legend_kwds is None:
        legend_kwds = {}

    if "colormap" in style_kwds:
        warnings.warn(
            "'colormap' is deprecated, please use 'cmap' instead", FutureWarning
        )
        cmap = style_kwds.pop("colormap")

    if "axes" in style_kwds:
        warnings.warn(
            "'axes' is deprecated, please use 'ax' instead", FutureWarning
        )
        ax = style_kwds.pop("axes")

    try:
        import matplotlib.pyplot as plt
    except ImportError:
        raise ImportError(
            "The matplotlib package is required for plotting in geode. "
            "You can install it using 'conda install -c conda-forge matplotlib' or "
            "'pip install matplotlib'."
        )

    if ax is None:
        fig, ax = plt.subplots(figsize=figsize)

    # TODO need to handle sref geographic aspect
    ax.set_aspect(aspect)

    # auto detect geometry column if no name passed
    if geom_col is None:
        candidates = [field.name for field in df.schema.fields if field.dataType.simpleString() in
                      ["geometry", "point", "linestring", "polygon", "multipoint"]]
        if not candidates:
            raise ValueError("No geometry columns found.")

        if len(candidates) > 1:
            raise ValueError("Multiple geometry columns found, please specify which one to use.")

        geom_col = candidates[0]

    # decompose geometries
    if val_col is not None:
        rows = df.select(explode(geometries(geom_col)).alias("geometry"), col(val_col).alias("values")) \
            .dropna() \
            .withColumn("type", geometry_type("geometry")).take(max_geoms)
        points = [(row.geometry, row.values) for row in rows if row.type == "Point"]
        lines = [(row.geometry, row.values) for row in rows if row.type == "Polyline"]
        polys = [(row.geometry, row.values) for row in rows if row.type == "Polygon"]
    else:
        rows = df.select(explode(geometries(geom_col)).alias("geometry")) \
            .dropna() \
            .withColumn("type", geometry_type("geometry")).take(max_geoms)
        points = [(row.geometry,) for row in rows if row.type == "Point"]
        lines = [(row.geometry,) for row in rows if row.type == "Polyline"]
        polys = [(row.geometry,) for row in rows if row.type == "Polygon"]

    if polys:
        values, mapping = get_values(val_col, is_categorical, polys)
        collection = _plot_polygon_collection(
            ax,
            polys,
            cmap,
            values,
            **style_kwds
        )

    if lines:
        values, mapping = get_values(val_col, is_categorical, lines)
        collection = _plot_linestring_collection(
            ax,
            lines,
            cmap,
            values,
            **style_kwds
        )

    if points:
        values, mapping = get_values(val_col, is_categorical, points)
        collection = _plot_point_collection(
            ax,
            points,
            cmap,
            values,
            **style_kwds
        )

    if legend and val_col is not None:
        from matplotlib import cm
        from matplotlib.colors import Normalize
        from matplotlib.lines import Line2D

        arr = collection.get_array()
        norm = Normalize(vmin=min(arr), vmax=max(arr))
        sm = cm.ScalarMappable(norm=norm, cmap=cmap)
        sm.set_array([])

        max_rows = legend_kwds.pop("maxitems", 30)

        if is_categorical:
            items, cats = [], []
            ks, vs = list(mapping.keys()), list(mapping.values())  # for reverse map lookup (cats -> vals)

            for i, v in enumerate(list(set(arr))[:max_rows]):
                items.append(
                    Line2D(
                        [0],
                        [0],
                        linestyle="none",
                        marker="o",
                        alpha=1,
                        markersize=5,
                        markerfacecolor=sm.to_rgba(i),
                        markeredgewidth=0,
                    )
                )
                cats.append(ks[vs.index(v)])  # reverse map lookup
            ax.legend(items, cats, **legend_kwds)
        else:
            ax.get_figure().colorbar(sm, **legend_kwds)

    plt.draw()
    return ax


def _plot_point_collection(ax, points, cmap=None, values=None, color=None, marker_size=None, **kwargs):

    xs = list(map(lambda p: p[0].x, points))
    ys = list(map(lambda p: p[0].y, points))

    if marker_size is not None:
        kwargs["s"] = marker_size

    # val_col supersedes color
    if values is not None:
        kwargs["c"] = values
        # if values themselves are colors then cmap is ignored.
        collection = ax.scatter(xs, ys, cmap=cmap, **kwargs)
    else:
        collection = ax.scatter(xs, ys, color=color, **kwargs)
    return collection


def _plot_linestring_collection(ax, lines, cmap=None, values=None, **kwargs):
    if values is not None:
        try:
            import numpy as np
        except ImportError:
            warnings.warn(
                "Color mapping with values requires numpy. You can install it with 'pip install numpy'. "
                "Continuing with val_col=None"
            )
            values = None

    from matplotlib.collections import LineCollection

    segments = []
    for row in lines:
        coordinates = []
        line = row[0]
        path_count = line.path_count
        for path_index in range(0, path_count):
            points = line.path_points(path_index)
            for p in points:
                x = p.x
                y = p.y
                coordinates.append((x, y))

        segments.append(coordinates)

    collection = LineCollection(segments, **kwargs)

    if values is not None:
        collection.set_array(np.asarray(values))
        collection.set_cmap(cmap)

    ax.add_collection(collection, autolim=True)
    ax.autoscale_view()
    return collection


def _plot_polygon_collection(ax, polys, cmap=None, values=None, **kwargs):
    if values is not None:
        try:
            import numpy as np
        except ImportError:
            warnings.warn(
                "Color mapping requires numpy. You can install it with 'pip install numpy'. "
                "Continuing with val_col=None"
            )
            values = None

    from matplotlib.collections import PatchCollection

    collection = PatchCollection([_polygon_patch(poly[0]) for poly in polys], **kwargs)

    if values is not None:
        collection.set_array(np.asarray(values))
        collection.set_cmap(cmap)

    ax.add_collection(collection, autolim=True)
    ax.autoscale_view()
    return collection


def _polygon_patch(poly):
    from matplotlib.patches import PathPatch
    from matplotlib.path import Path

    coordinates = []
    path_count = poly.path_count
    for path_index in range(0, path_count):
        points = poly.path_points(path_index)
        for p in points:
            coordinates.append((p.x, p.y))
        if points:
            closing_point = points[0]
            coordinates.append((closing_point.x, closing_point.y))

    path = Path.make_compound_path(
        Path(coordinates)
    )

    return PathPatch(path)


# helper methods
def convert_to_int(values):
    categories = set(values)
    if not categories:
        raise ValueError("no categories found.")

    mapping = dict([(v, i) for i, v in enumerate(categories)])
    return mapping


def get_values(val_col, is_categorical, data):
    if val_col is not None:
        values = [row[1] for row in data]
        mapping = None
        if is_categorical:
            mapping = convert_to_int(values)
            values = [mapping[x] for x in values]
    else:
        values = None
        mapping = None
    return values, mapping
