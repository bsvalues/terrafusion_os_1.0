# COPYRIGHT 2019 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com

"""Work with network analysis functionality provided with ArcGIS Network Analyst extension."""


# noqa. Used to populate the module namespace. pylint:disable=wildcard-import, unused-wildcard-import, unused-import, line-too-long
from ._na._solvers import *
from ._na._rs import *
from ._na._cfs import *
from ._na._sas import *
from ._na._odcms import *
from ._na._las import *
from ._na._vrps import *
from ._na._nds import *
from ._na._ndsc import *
from ._na._s import *
from ._na._lmds import *
from ._na import TravelMode, NAClassFieldMap, NAClassFieldMappings, GetTravelModes, GetWebToolInfo
from ._na import cna as _cna
from .na import CalculateLocations, ShareAsRouteLayers, MakeNetworkDatasetLayer, BuildNetwork, DissolveNetwork, CreateNetworkDatasetFromTemplate, CreateTemplateFromNetworkDataset, CreateTurnFeatureClass, IncreaseMaximumEdges, PopulateAlternateIDFields, UpdateByAlternateIDFields, UpdateByGeometry, CreateNetworkDataset  # noqa


def ListDirectionsLanguages():  # To be consistent with arcpy style. pylint:disable=invalid-name
    """Return a List of supported directions language names."""
    return _cna.ListDirectionsLanguages()
