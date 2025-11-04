# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
FindOverlapsLogic.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2020-01-13 - mfunk - module rename for 'intel'
* 2020-01-28 - jjones - refactored module to take advantage of new count Overlapping Features GP tool
* 2020-04-13 - mfunk - move arcgis api import into __init__ Python issue 1197 and
        remove FindOverlaspBase
* 2020-08-27 - mfunk - fix output field names
* 2020-10-02 - mfunk - workaround field name changes due to Geosaurus #4741
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2021-05-25 - mfunk - fixes for issue 1535
* 2022-03-25 - mfunk - fixes for SEDF in https://github.com/ArcGIS/geosaurus/pull/6943
* 2022-11-04 - mfunk - fix for intel 3240
------------------------------------------------------------------------------
'''

import os
import arcpy
import traceback
import sys
import pandas as pd

from typing import List, Tuple, Optional
from intel.utilities import DEBUG, create_temp_table_name, create_scratch_geodatabase
from intel.utilities import validate_input_geometry


class Find_Overlaps:
    def __init__(self,
                 input_features: str,
                 output_intersection: str,
                 output_centroids: str,
                 group_field: Optional[str] = None) -> None:

        # Import here, not in module -- Python issue #1197
        from arcgis.features import GeoAccessor, GeoSeriesAccessor

        self._input_features = input_features
        self._group_field = group_field

        self._output_intersection = output_intersection
        self._output_centroids = output_centroids

        # store temp datasets for removal
        self._delete_intermediate: List[str] = []
        self._delete_temp_scratch_flag: bool = False
        self._temp_scratch: Optional[str] = None

        self.sr = arcpy.Describe(self._input_features).spatialReference

    def __del__(self):
        '''
        destructor
        '''
        self._cleanup()

    @property
    def input_features(self) -> str:
        return self._input_features

    @input_features.setter
    def input_features(self, value: str) -> None:
        self._input_features = value

    @property
    def output_intersection(self) -> str:
        return self._output_intersection

    @output_intersection.setter
    def output_intersection(self, value: str) -> None:
        self._output_intersection = value

    @property
    def output_centroids(self) -> str:
        return self._output_centroids

    @output_centroids.setter
    def output_centroids(self, value: str) -> None:
        self._output_centroids = value

    @property
    def group_field(self) -> Optional[str]:
        return self._group_field

    @group_field.setter
    def group_field(self, value: str) -> None:
        self._group_field = value

    def _cleanup(self):
        """_cleanup Clean up and remove temp dataset

        Clean up and remove temp datasets
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        for i in self._delete_intermediate:
            # "Removing intermedate datasets... "
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    arcpy.AddMessage(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    arcpy.AddMessage(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
        return True

    def advance_progressor_position(self,
                                    message: str) -> None:
        arcpy.SetProgressorLabel(message)
        arcpy.SetProgressorPosition()
        arcpy.AddMessage(message)

    def find_centroid(self,
                      extent: arcpy.Extent,
                      name: Optional[str] = None,
                      group_field: Optional[str] = None) -> pd.DataFrame:
        """Finds the centroid of the input extent and returns a Spatially enabled DataFrame of the feature.

        Args:
            extent (arcpy.Extent): The extent of the features that will be used to determine the centroid.
            name (str, optional): Optional group features name. Defaults to None.

        Returns:
            pd.DataFrame: Spatially enabled DataFrame representing the centroid of the input extent.
        """

        try:
            center_x: float = (extent.XMin + extent.XMax)/2
            center_y: float = (extent.YMin + extent.YMax)/2

            centroid_fc: str = create_temp_table_name('memory')
            arcpy.management.CreateFeatureclass(os.path.dirname(centroid_fc),
                                                os.path.basename(centroid_fc),
                                                "POINT",
                                                None,
                                                None,
                                                None,
                                                self.sr)
            arcpy.management.AddFields(centroid_fc, "XCoord DOUBLE # # # #;YCoord DOUBLE # # # #;ZCoord DOUBLE # # # #")

            fields = ['SHAPE@XY', 'XCoord', 'YCoord', 'ZCoord']

            with arcpy.da.InsertCursor(centroid_fc, fields) as cursor:
                for x in range(0, 1):
                    pt = arcpy.Point(X=center_x, Y=center_y)
                    pt_geo = arcpy.PointGeometry(pt)

                    row = [pt_geo, center_x, center_y, None]
                    cursor.insertRow(row)

            sdf: pd.DataFrame = pd.DataFrame.spatial.from_featureclass(centroid_fc)
            self._delete_intermediate.append(centroid_fc)

            if name is not None and group_field is not None:
                sdf[group_field] = name

            return sdf
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def generate_empty_outputs(self,
                               empty_point_features: Optional[str] = None,
                               empty_area_features: Optional[str] = None) -> List[str]:
        """Generates the empty output feature classes for the Find Overlaps tool if no overlapping features
           were detected.  This is to keep with the ArcGIS pattern

        Args:
            empty_point_features (str): Fully qualified path for the output empty point features
            empty_area_features (str): Fully qualified path for the output empty area features

        Returns:
            list[str]: List containing the fully qualified path to the output feature classes
        """

        return_features: List[str] = []

        if empty_area_features is not None:
            area_ws: str = os.path.dirname(empty_area_features)
            area_fc_name: str = os.path.split(empty_area_features)[1]

            arcpy.CreateFeatureclass_management(area_ws, area_fc_name, "POLYGON", None, None, None, self.sr)
            arcpy.management.AddFields(empty_area_features, "overlaps LONG 'Overlap Count' # # #")

            return_features.append(empty_area_features)

            arcpy.AddWarning(arcpy.GetIDMessage(190166))

        if empty_point_features is not None:
            point_ws: str = os.path.dirname(empty_point_features)
            point_fc_name: str = os.path.split(self._output_centroids)[1]

            # Creates Empty output to match ArcGIS Pattern
            arcpy.CreateFeatureclass_management(point_ws, point_fc_name, "POINT", None, None, None, self.sr)
            arcpy.management.AddFields(empty_point_features, "XCoord DOUBLE # # # #;YCoord DOUBLE # # # #")

            return_features.append(empty_point_features)

            arcpy.AddWarning(arcpy.GetIDMessage(190167))

        arcpy.AddWarning(arcpy.GetIDMessage(117))
        return return_features

    def process_overlaps(self,
                         input_seDataFrame: pd.DataFrame,
                         name: Optional[str] = None,
                         group: Optional[str] = None) -> Tuple[Optional[pd.DataFrame], Optional[arcpy.Extent], int]:
        """Runs the Count Overlapping Features geoprocessing tool and converts the results into a spatially enabled dataframe.

        Args:
            input_seDataFrame (pd.DataFrame): The input spatially enabled DataFrame, this can be either the filtered results or the full feature class.
            name (str, optional): Optional name for the group. Defaults to None.
            group (str, optional): Optional Group field. Defaults to None.

        Returns:
            Tuple[pd.DataFrame, arcpy.Extent, int]: Output Spatially Enabled DataFrame, extent object, and count of features generated during processing.
        """

        try:
            temp_fc = create_temp_table_name(arcpy.env.scratchGDB)
            self._delete_intermediate.append(temp_fc)
            input_seDataFrame.spatial.to_featureclass(temp_fc)

            # Runs the Count Overlapping Features geoprocessing tool to get the counts of each of the individual groups.
            output_overlaps = create_temp_table_name(arcpy.env.scratchGDB)
            if arcpy.Exists(output_overlaps):
                arcpy.management.Delete(output_overlaps)
            arcpy.analysis.CountOverlappingFeatures(temp_fc, output_overlaps, 2)
            self._delete_intermediate.append(output_overlaps)
            if DEBUG:
                arcpy.AddMessage(f"CountOverlappingFeatures temp output: {output_overlaps}")

            fcount: int = int(arcpy.management.GetCount(output_overlaps)[0])
            sdf: Optional[pd.DataFrame] = None
            extent: Optional[arcpy.Extent] = None
            if fcount > 0:
                extent = arcpy.Describe(output_overlaps).extent
                sdf = pd.DataFrame.spatial.from_featureclass(output_overlaps)
                if name is not None and group is not None:
                    sdf[group] = name
            else:
                # if there are no overlaps, nothing to create
                if DEBUG:
                    arcpy.AddMessage(f"no overlapping features in group '{name}'")

            return (sdf, extent, fcount)

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def subset_dataframes(self,
                          input_seDataFrame: pd.DataFrame,
                          field_group: Optional[str] = None) -> Tuple[Optional[pd.DataFrame], Optional[pd.DataFrame]]:
        """Filters the input dataset into the necessary groups as definied in the field_group. If no field_group is specified,
           returns the input feature class as a spatially enabled DataFrame. Once the data is brought in and optionally subset, it
           then runs the process_overlaps method on the data. With the results from the process_overlaps method, the find_centroids
           method is used to calculate the centerpoint of the group or features.

        Args:
            input_seDataFrame (pd.DataFrame): The input features represented as a spatially enabled dataframe.
            field_group (str, optional): [description]. Defaults to None.

        Returns:
            Tuple[pd.DataFrame, pd.DataFrame]: Output results from the process_overlaps method and find_centroid method.
        """

        try:
            self.advance_progressor_position(arcpy.GetIDMessage(190156))

            if field_group is not None:

                processed_overlaps_sdf: List[pd.DataFrame] = []
                processed_centroid_sdf: List[pd.DataFrame] = []

                # Make a unique List of non-null group names
                group_names: List = input_seDataFrame[field_group].dropna().unique().tolist()

                # {} has {} features
                arcpy.AddMessage(arcpy.GetIDMessage(190160).format(arcpy.Describe(self._input_features).baseName, str(len(group_names))))

                # For each group in the group names subset and get overlaps
                for name in group_names:
                    if DEBUG:
                        arcpy.AddMessage(f"Processing group {name}...")

                    is_group = input_seDataFrame[field_group] == name
                    subset_sdf = input_seDataFrame[is_group].copy()

                    # {} has {} features
                    arcpy.AddMessage(arcpy.GetIDMessage(190160).format(name, str(subset_sdf.shape[0])))

                    # Get overlapping features, extent, and overlap count
                    overlaps_sdf, extent, fcount = self.process_overlaps(subset_sdf, name=name, group=field_group)

                    # if we get more than 0 overlaps back
                    if fcount > 0:
                        # Add overlap features to list
                        processed_overlaps_sdf.append(overlaps_sdf)

                        # Make the centroid data frame
                        centroid_sdf = self.find_centroid(extent, name=name, group_field=field_group)

                        if DEBUG:
                            arcpy.AddMessage(f"centroid_sdf: {centroid_sdf}")
                        # append centroid dataframe to centroid list
                        processed_centroid_sdf.append(centroid_sdf)
                    else:
                        # otherwise move to next group
                        pass

                if DEBUG:
                    arcpy.AddMessage(f"processed_centroid_sdf: {processed_centroid_sdf}")

                # if the lists have datafames in the list concatenate them
                if len(processed_overlaps_sdf) > 0:
                    # Merging
                    self.advance_progressor_position(arcpy.GetIDMessage(190154))
                    out_overlaps_sdf = pd.concat(processed_overlaps_sdf)
                    out_centroids_sdf = pd.concat(processed_centroid_sdf)
                # if not, return nothing
                else:
                    out_overlaps_sdf = None
                    out_centroids_sdf = None
                return (out_overlaps_sdf, out_centroids_sdf)

            else:
                # {} has {} features
                arcpy.AddMessage(arcpy.GetIDMessage(190160).format(arcpy.Describe(self._input_features).baseName,
                                                                   str(input_seDataFrame.shape[0])))
                overlaps_sdf: Optional[pd.DataFrame] = None
                overlaps_sdf, extent, fcount = self.process_overlaps(input_seDataFrame)
                centroid_sdf: Optional[pd.DataFrame] = None
                if fcount > 0:
                    centroid_sdf = self.find_centroid(extent)
                # Merging
                self.advance_progressor_position(arcpy.GetIDMessage(190154))
                return (overlaps_sdf, centroid_sdf)

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _updateOverlapFields(self, in_features: str) -> str:
        """_updateOverlapFields Cleans up overlap polygon fields

        cleans up overlap polygon fields

        :param in_features: input overlap polygon path
        :type in_features: str
        :return: output overlap polygon path
        :rtype: str
        """

        # make a list of fieldnames
        existing_field_names: List[str] = [f.name for f in arcpy.ListFields(in_features)]
        if DEBUG:
                arcpy.AddMessage(f"input ({in_features}) field names: {existing_field_names}")

        # drop the "COUNT_FC" field that is left over from Count Overlapping Polygons
        # Due to https://github.com/ArcGIS/geosaurus/issues/4741 the field name changes from
        # "COUNT_FC" to count_fc after passing through to_featureclass
        # 2985: COUNT_FC is NOT being returned correctly again. Check for upper and lower case.
        count_fc_fieldname: str = "COUNT_FC"
        if count_fc_fieldname in existing_field_names or \
           count_fc_fieldname.lower() in existing_field_names or \
           count_fc_fieldname.upper() in existing_field_names:
            if DEBUG:
                arcpy.AddMessage(f"Dropping extra field {count_fc_fieldname}")
            arcpy.management.DeleteField(in_features,
                                         drop_field=count_fc_fieldname)

        # change the output fieldname from COUNT_ to overlaps and drop original
        # Due to https://github.com/ArcGIS/geosaurus/issues/4741 the field name changes from
        # COUNT_ to count_ after passing through to_featureclass
        # 2934: COUNT_ is being returned correctly again.
        # 2985: COUNT_ is NOT being returned correctly again. Check for upper and lower case.
        count_fieldname: str = "COUNT_"
        overlap_fieldname: str = "overlaps"  # short name better for shapefiles and other limited naming
        overlap_alias: str = "Overlap Count"
        if count_fieldname in existing_field_names or \
           count_fieldname.lower() in existing_field_names or \
           count_fieldname.upper() in existing_field_names:
            if DEBUG:
                arcpy.AddMessage(f"Converting field {count_fieldname} to {overlap_fieldname}")
            arcpy.management.AddField(in_features,
                                      field_name=overlap_fieldname,
                                      field_type="LONG",
                                      field_alias=overlap_alias)
            exp: str = f"!{count_fieldname}!"
            arcpy.management.CalculateField(in_features,
                                            field=overlap_fieldname,
                                            expression=exp,
                                            expression_type='PYTHON3')
            arcpy.management.DeleteField(in_features,
                                         drop_field=count_fieldname)
        else:  # if COUNT_ doesn't exist the output overlaps field is still expected
            if DEBUG:
                arcpy.AddMessage(f"Field ({count_fieldname}) not found...")
            arcpy.management.AddField(in_features,
                                      field_name=overlap_fieldname,
                                      field_type="LONG",
                                      field_alias=overlap_alias)

        # 2985 SEDF modifying group field from inputs, either upper case or
        # lower case, need to change back to original name.
        if self.group_field:
            if self.group_field.lower() in existing_field_names:
                if DEBUG:
                    arcpy.AddMessage(f"Reparing group field name {self.group_field} from lowercase.")
                arcpy.management.AlterField(in_features, self.group_field.lower(), new_field_name=self.group_field)
            elif self.group_field.upper() in existing_field_names:
                if DEBUG:
                    arcpy.AddMessage(f"Reparing group field name {self.group_field} from uppercase.")
                arcpy.management.AlterField(in_features, self.group_field.upper(), new_field_name=self.group_field)

        return in_features

    def _updateCentroidFields(self, in_features: str) -> str:
        """_updateCentroidFields cleans up centroid point fields

        cleans up centroid point fields

        :param in_features: input centroid features path
        :type in_features: str
        :return: output centroid features path
        :rtype: str
        """

        # make a list of fieldnames
        existing_field_names: List[str] = [f.name for f in arcpy.ListFields(in_features)]

        # drop ZCoord field
        # Due to https://github.com/ArcGIS/geosaurus/issues/4741 the field name changes from
        # ZCoord to z_coord after passing through to_featureclass
        # zcoord_fieldname: str = r"ZCoord"
        zcoord_fieldname: str = r"z_coord"
        zcoord_fieldname_1: str = r"ZCoord"

        if zcoord_fieldname in existing_field_names:
            if DEBUG:
                arcpy.AddMessage(f"Dropping extra field {zcoord_fieldname}")
            arcpy.management.DeleteField(in_features,
                                         drop_field=zcoord_fieldname)
        if zcoord_fieldname_1 in existing_field_names:
            if DEBUG:
                arcpy.AddMessage(f"Dropping extra field {zcoord_fieldname_1}")
            arcpy.management.DeleteField(in_features,
                                         drop_field=zcoord_fieldname_1)

        # 2985 SEDF modifying group field from inputs, either upper case or
        # lower case, need to change back to original name.
        if self.group_field:
            if self.group_field.lower() in existing_field_names:
                if DEBUG:
                    arcpy.AddMessage(f"Reparing group field name {self.group_field} from lowercase.")
                arcpy.management.AlterField(in_features, self.group_field.lower(), new_field_name=self.group_field)
            elif self.group_field.upper() in existing_field_names:
                if DEBUG:
                    arcpy.AddMessage(f"Reparing group field name {self.group_field} from uppercase.")
                arcpy.management.AlterField(in_features, self.group_field.upper(), new_field_name=self.group_field)

        return in_features

    def generate_overlaps(self) -> Tuple[str, str]:
        """Main execution code for the Find Ovelaps geoprocessing tool.

        Returns:
            Tuple[str, str]: Returns the fully qualified path to the output area and point features.
        """
        arcpy.SetProgressor("step", arcpy.GetIDMessage(190156), 0, 4, 1)
        self.advance_progressor_position(arcpy.GetIDMessage(190164))

        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True

        try:

            try:
                validate_input_geometry(input_feature_class=self._input_features, shape_type="Polygon")
            except TypeError:
                arcpy.AddError(arcpy.GetIDMessage(190162))
                exit()

            # Tests to see if the file is in a projected coordinate system, if not projects the data into UTM.
            spatial_ref = arcpy.Describe(self._input_features).spatialReference

            # Validates if the spatial reference is defined, if Undefined, raises a value error
            if spatial_ref.name == "Unknown":
                arcpy.AddError(arcpy.GetIDMessage(190163))
                exit()

            sdf = pd.DataFrame.spatial.from_featureclass(self._input_features)

            if type(self._group_field) is str:
                overlaps, centroids = self.subset_dataframes(input_seDataFrame=sdf, field_group=self._group_field)
            else:
                overlaps, centroids = self.subset_dataframes(input_seDataFrame=sdf, field_group=None)

            final_overlaps: str
            final_centroids: str

            # If there are no returned overlaps, make an emtpy output
            if overlaps is None:
                empty_outputs = self.generate_empty_outputs(empty_point_features=self._output_centroids,
                                                            empty_area_features=self._output_intersection)
                final_overlaps = self._updateOverlapFields(empty_outputs[0])
                final_centroids = self._updateCentroidFields(empty_outputs[1])

            # if there are no returned centroids, make an emtpy output
            elif centroids is None:
                empty_outputs = self.generate_empty_outputs(empty_point_features=self._output_centroids)
                out_overlaps_fc = overlaps.spatial.to_featureclass(self._output_intersection)

                final_overlaps = self._updateOverlapFields(out_overlaps_fc)
                final_centroids = self._updateCentroidFields(empty_outputs[0])

            # otherwise write out new feature classes
            else:
                out_overlaps_fc = overlaps.spatial.to_featureclass(self._output_intersection)

                centroids.spatial.project("WGS 1984")
                out_centroid_fc = centroids.spatial.to_featureclass(self._output_centroids)

                final_overlaps = self._updateOverlapFields(out_overlaps_fc)
                final_centroids = self._updateCentroidFields(out_centroid_fc)

            if DEBUG:
                arcpy.AddMessage(f"final fields: {[f.name for f in arcpy.Describe(final_overlaps).fields]}")
            return final_overlaps, final_centroids

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
