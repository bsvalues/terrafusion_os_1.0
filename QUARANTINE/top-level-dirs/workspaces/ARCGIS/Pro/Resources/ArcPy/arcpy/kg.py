# COPYRIGHT 2013-2024 ESRI
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
r"""The Knowledge Graph toolbox contains a powerful set of tools to
analyze Knowledge Graphs."""
from __future__ import annotations

__all__ = ["FilteredFindPaths"]
__alias__ = "kg"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Graph Algorithms toolset
@gptooldoc("FilteredFindPaths_kg", None)
def FilteredFindPaths(
    in_knowledge_graph_url=None,
    config_type: Literal["FILE", "STRING"] | None = None,
    config_string=None,
    in_config_file=None,
    result_type: Literal["FILE", "STRING"] | None = None,
    out_results_file=None,
) -> Result2[str, str]:
    """FilteredFindPaths_kg(in_knowledge_graph_url, {config_type}, {config_string}, {in_config_file}, {result_type}, {out_results_file})

       Find paths in a knowledge graph.

    INPUTS:
     in_knowledge_graph_url (String):
         Knowledge Graph URL
     config_type {String}:
         Configuration type
     config_string {String}:
         Config string
     in_config_file {File}:
         Config file
     result_type {String}:
         Results type

    OUTPUTS:
     out_results_file {File}:
         Results file"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FilteredFindPaths_kg(
                *gp_fixargs(
                    (in_knowledge_graph_url, config_type, config_string, in_config_file, result_type, out_results_file),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
