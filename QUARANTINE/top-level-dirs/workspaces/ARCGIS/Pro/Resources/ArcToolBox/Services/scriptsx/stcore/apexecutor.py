"""Executor of AggregatePoints"""
# use modules from common package. noqa. pylint: disable=import-error
from typing import Optional, List, Union

from common import PAFeatureLayer, LogUtils, ToolExit, PAOutputFeatureLayer
from .stcommon import SummarizeExecutor, create_tessellation, SummaryInputValidateMixin
from .statsutils import StatsCalculatorX


LOGGER = LogUtils.setup_logger(__name__)


class APExecutor(SummaryInputValidateMixin, SummarizeExecutor):

    def __init__(self, summary_lyr: PAFeatureLayer,
                 summary_boundary_lyr: Optional[PAFeatureLayer],
                 output_lyr: PAOutputFeatureLayer,
                 groupby_stat_output: Optional[PAOutputFeatureLayer],
                 summary_fields: Optional[List],
                 groupby_field: Optional[str] = None,
                 bin_type: str = "",
                 bin_size: Union[int, float, str] = "#",
                 bin_size_unit: str = "#",
                 calc_minority_majority: bool = False,
                 calc_percent_shape: bool = False,
                 keep_boundaries_with_no_features: bool = False,
                 call_from_desktop: bool = False):
        """Initialize properties of the AggregatePoints executor.

        Args:
            summary_lyr (PAFeatureLayer): a PAFeatureLayer object with point geometry to calculate summary from.
            summary_boundary_lyr (Optional[PAFeatureLayer]): a PAFeatureLayer object with the boundary.
            output_lyr (PAOutputFeatureLayer): a PAOutputFeatureLayer to save the aggregate output.
            groupby_stat_output (Optional[PAOutputFeatureLayer]): a PAOutputFeatureLayer to store the groupby stats.
            summary_fields (Optional[List]): a list of tuples where the first item is the name of the field and the
            second item is the type of stats to collect.
            groupby_field (Optional[str], optional): name of the groupby field. Defaults to None.
            bin_type (str, optional): bin type if tessellation need to be created as the summary boundary.
            Defaults to "".
            bin_size (Union[int, float, str], optional): size value (usually height) of the tessellation.
            Defaults to "#".
            bin_size_unit (str, optional): unit of the size value for tessellation creation. Defaults to "#".
            calc_minority_majority (bool, optional): True to calculate the minority and majority values based on the
            groupby field. Defaults to False.
            calc_percent_shape (bool, optional): True to calculate the percent shape of a certain groupby category
            within a certain summary boundary polygon. Defaults to False.
            keep_boundaries_with_no_features (bool, optional): True to keep all boundary features in the output even if
            there is no summary feature (point) fall into. False to only keep boundary features that have summary
            features fall within. Defaults to False.

        Raises:
            AO_100003: if the summary boundary layer is empty or the shapeType is not Polygon. 
        """
        super(APExecutor, self).__init__(summary_lyr, summary_boundary_lyr,
                                         output_lyr, groupby_stat_output,
                                         summary_fields, groupby_field,
                                         calc_minority_majority,
                                         calc_percent_shape,
                                         keep_boundaries_with_no_features,
                                         call_from_desktop=call_from_desktop)

        if self.summary_boundary_lyr is None:
            self.summary_boundary_lyr = PAFeatureLayer(create_tessellation(summary_lyr, None, bin_type,
                                                                           bin_size, bin_size_unit))

    def validate_parameters(self):
        if self.summary_lyr.shapeType != "Point":
            LOGGER.error(100002, extra={"message_ID": 100002})
            return False

        if (
            (not self.validate_summary_boundary())
            or (not self.validate_summary_fields())
            or (not self.validate_groupby_field())
        ):
            return False

        return True

    def calculate_statistics(self):
        calcultor = StatsCalculatorX(self.summary_lyr,
                                     self.summary_boundary_lyr,
                                     self.summary_fields,  # type: ignore
                                     self.groupby_field,
                                     self.keep_boundaries_with_no_features,
                                     self.output_lyr,
                                     self.groupby_stat_output,
                                     self.calc_minority_majority,
                                     self.calc_percent_shape,
                                     self.fields_info,
                                     shape_stat_units=None,
                                     sum_shape=True,
                                     call_from_desktop=self.call_from_desktop)
        try:
            calcultor.calculate()
        except Exception as err:
            LOGGER.debug("Failed to calculate statistics.")
            raise ToolExit from err
        finally:
            calcultor.clean()
