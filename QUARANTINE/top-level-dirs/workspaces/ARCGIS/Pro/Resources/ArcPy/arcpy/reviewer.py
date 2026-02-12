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
r"""The ArcGIS Data Reviewer extension adds a data quality control
framework to ArcGIS. Data Reviewer validates data using different
checks, contained in batch jobs, that test spatial relationships and
integrity. It also provides tools to correct errors found during
validation."""
from __future__ import annotations

__all__ = [
    "CreateReviewerSession",
    "DeleteReviewerSession",
    "EnableDataReviewer",
    "ExecuteReviewerBatchJob",
    "WriteToReviewerTable",
]
__alias__ = "Reviewer"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Data Validation toolset
@gptooldoc("ExecuteReviewerBatchJob_Reviewer", None)
def ExecuteReviewerBatchJob(
    reviewer_workspace=None,
    session=None,
    batch_job_file=None,
    production_workspace=None,
    analysis_area=None,
    changed_features: Literal["CHANGED_FEATURES", "ALL_FEATURES"] | None = None,
    production_workspaceversion=None,
) -> Result1[str | Table]:
    """ExecuteReviewerBatchJob_Reviewer(reviewer_workspace, session, batch_job_file, {production_workspace}, {analysis_area}, {changed_features}, {production_workspaceversion})

       Runs a Reviewer batch job on a workspace and writes the results to a
       Reviewer session. A Reviewer batch job contains groups of Reviewer
       checks. Checks validate data based on conditions, rules, and spatial
       relationships. Checks also specify sets of features or rows to
       validate and their source workspace. A Reviewer session stores
       information about validation tasks performed by Reviewer checks. This
       information is stored in a table and a dataset in the Reviewer
       workspace.

    INPUTS:
     reviewer_workspace (Workspace):
         The workspace where the Reviewer batch job results will be written.
     session (String):
         The identifier and name for the Reviewer session. The session must
         exist in the Reviewer workspace.
     batch_job_file (File):
         The path to the Reviewer batch job file that will be run.
     production_workspace {Workspace}:
         The enterprise or file geodatabase that contains the features that
         will be validated.
     analysis_area {Feature Layer / Extent}:
         Polygon features or an arcpy.Extent object that define the area that
         will be used to build a validation processing area.
     changed_features {Boolean}:
         Specifies the type of features, changed or unchanged, that will be
         validated when the production workspace references data in an
         enterprise geodatabase.CHANGED_FEATURES-Only features that changed
         from the parent to the
         child version will be validated.ALL_FEATURES-All features in the data
         referenced by the batch job will
         be validated. This is the default.
     production_workspaceversion {String}:
         The version of the production workspace that will be validated by the
         batch job. This is only applicable when the production workspace is an
         enterprise geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExecuteReviewerBatchJob_Reviewer(
                *gp_fixargs(
                    (
                        reviewer_workspace,
                        session,
                        batch_job_file,
                        production_workspace,
                        analysis_area,
                        changed_features,
                        production_workspaceversion,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("WriteToReviewerTable_Reviewer", None)
def WriteToReviewerTable(
    in_reviewer_workspace=None,
    in_session=None,
    in_features=None,
    in_field=None,
    in_origin_table_name=None,
    in_review_status=None,
    in_subtype=None,
    in_notes=None,
    in_severity=None,
    in_check_title=None,
) -> Result1[str | Table]:
    """WriteToReviewerTable_Reviewer(in_reviewer_workspace, in_session, in_features, in_field, in_origin_table_name, in_review_status, {in_subtype}, {in_notes}, {in_severity}, {in_check_title})

       Writes a feature class, feature layer, table, or table view to the
       Reviewer workspace.

    INPUTS:
     in_reviewer_workspace (Workspace):
         The path to the Reviewer workspace where the features or table records
         will be written.
     in_session (String):
         The Reviewer session ID where the features or table records will be
         written. Use the full session ID format: Session 1 : Session 1.
     in_features (Feature Layer / Table View):
         The features or table records that will be written to the Reviewer
         workspace.
     in_field (Field):
         The field that contains identifiers for the features. The
         value from this field will populate theresult in thepane. The field
         you provide must have a data type of Long. IDReviewer Results
     in_origin_table_name (String / Field):
         The string or field value that will be used to populate
         theresult in thepane for each record that is written. This is
         typically the name of the feature class or table. The parameter value
         can be derived from a specified value or a field from the input.
         SourceReviewer Results
     in_review_status (String / Field):
         A status string that will be associated with the group of
         records written to the Reviewer workspace. The default is. The
         parameter value can be derived from a specified value or a field from
         the input. Write GP Results to Reviewer Table
     in_subtype {String / Field}:
         The feature class subtype to which the features belong. The
         value from this parameter will populate theresult in thepane. The
         parameter value can be derived from a specified value or a field from
         the input. SubtypeReviewer Results
     in_notes {String / Field}:
         The text that populates thefield in the Reviewer table. The
         notes are used to provide a more specific description of the feature
         or table record. The parameter value can be derived from a specified
         value or a field from the input. Notes
     in_severity {String / Field}:
         A numeric value that represents the significance of the
         features or table records that have been written to the Reviewer
         workspace. The values range from 5 (low priority) to 1 (high
         priority). This value will populate theresult in thepane. The
         parameter value can be derived from a specified value or a field from
         the input. SeverityReviewer Results
     in_check_title {String / Field}:
         The text that will populate theresult in thepane. This value
         is used to describe the error condition detected on the feature or
         table record. The parameter value can be derived from a specified
         value or a field from the input. Check TitleReviewer Results"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.WriteToReviewerTable_Reviewer(
                *gp_fixargs(
                    (
                        in_reviewer_workspace,
                        in_session,
                        in_features,
                        in_field,
                        in_origin_table_name,
                        in_review_status,
                        in_subtype,
                        in_notes,
                        in_severity,
                        in_check_title,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Result Management toolset
@gptooldoc("CreateReviewerSession_Reviewer", None)
def CreateReviewerSession(
    reviewer_workspace=None,
    session_name=None,
    session_template=None,
    duplicate_checking: Literal["DATABASE", "SESSION", "NONE"] | None = None,
    store_geometry: Literal["STORE_GEOMETRY", "DO_NOT_STORE_GEOMETRY"] | None = None,
    username=None,
    version=None,
) -> Result1[str]:
    """CreateReviewerSession_Reviewer(reviewer_workspace, session_name, {session_template}, {duplicate_checking}, {store_geometry}, {username}, {version})

       Creates a new Reviewer session in a specified workspace.

    INPUTS:
     reviewer_workspace (Workspace):
         The workspace where the new Reviewer session will be created.
     session_name (String):
         The name of the session that will be created in the Reviewer
         workspace.
     session_template {String}:
         An existing Reviewer session whose properties will be copied to the
         new session.
     duplicate_checking {String}:
         Specifies how duplicate validation results will be handled in the
         session.NONE-No search will be conducted for duplicate validation
         results.
         This will improve performance when writing validation results to the
         database. This is the default.SESSION-The session will be searched for
         duplicate validation results.DATABASE-The entire database will be
         searched for duplicate validation
         results.
     store_geometry {Boolean}:
         Specifies whether results will include an associated
         geometry.STORE_GEOMETRY-Results will include both geometry and
         attribute
         information. This is the default.DO_NOT_STORE_GEOMETRY-Results will
         include only attribute information.
         This can improve performance when writing validation results to the
         geodatabase.
     username {String}:
         The username of the person creating the Reviewer session. The default
         is the Windows user who is actively logged in.
     version {String}:
         The enterprise geodatabase version that the session will be associated
         with. This parameter is only enabled when the Reviewer workspace is
         stored in an enterprise geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateReviewerSession_Reviewer(
                *gp_fixargs(
                    (
                        reviewer_workspace,
                        session_name,
                        session_template,
                        duplicate_checking,
                        store_geometry,
                        username,
                        version,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteReviewerSession_Reviewer", None)
def DeleteReviewerSession(
    reviewer_workspace=None,
    session=None,
) -> Result1[str]:
    """DeleteReviewerSession_Reviewer(reviewer_workspace, session;session...)

       Permanently deletes one or more sessions and all related records from
       a Reviewer workspace.

    INPUTS:
     reviewer_workspace (Workspace):
         The workspace from which the Reviewer session will be deleted.
     session (String):
         The Reviewer session identifier and name. The session must exist in
         the Reviewer workspace, for example, Session 1 : data_qc."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteReviewerSession_Reviewer(*gp_fixargs((reviewer_workspace, session), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableDataReviewer_Reviewer", None)
def EnableDataReviewer(
    workspace=None,
    spatial_reference=None,
    register_as_versioned: Literal["NONVERSIONED", "VERSIONED"] | None = None,
    config_keyword=None,
) -> Result1[str]:
    """EnableDataReviewer_Reviewer(workspace, {spatial_reference}, {register_as_versioned}, {config_keyword})

       Adds a feature dataset and tables necessary for an existing
       geodatabase to be considered a Reviewer workspace and store ArcGIS
       Data Reviewer results. The Reviewer workspace tables are required by
       Data Reviewer to manage Reviewer sessions.

    INPUTS:
     workspace (Workspace):
         The geodatabase where the Data Reviewer tables and feature dataset
         will be created. This can be a desktop or enterprise geodatabase.
     spatial_reference {Spatial Reference}:
         The geographic or projected coordinate system of the feature classes
         in the Reviewer workspace. The default is GCS_WGS_1984 if no value is
         provided.
     register_as_versioned {Boolean}:
         Specifies whether the feature classes and tables added to the
         workspace will be registered as versioned. This only applies to
         enterprise databases.NONVERSIONED-The feature classes and tables will
         not be registered as
         versioned after they are added to the geodatabase. This is the
         default.VERSIONED-The feature classes and tables will be registered as
         versioned after they are added to the geodatabase.
     config_keyword {String}:
         The configuration keyword that determines the storage parameters of
         the database tables. This applies to file and enterprise geodatabases.
         The DEFAULTS keyword is used by default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableDataReviewer_Reviewer(
                *gp_fixargs((workspace, spatial_reference, register_as_versioned, config_keyword), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
