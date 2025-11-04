from ._base import *


class CalculateField(BaseTool):

    def __init__(self):
        super().__init__('CalculateField')

    def setField(self, field_name, field_type):
        """

        :param field_name
        :type field_name: str
        :param field_type
        :type field_type: str
        """
        super()._set_builder_args('fieldName', [field_name])
        super()._set_builder_args('dataType', [field_type])
        return self

    def setExpression(self, expression):
        """

        :param expression
        :type expression: str
        """
        super()._set_builder_args('expression', [expression])
        return self

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: List[str]
        """
        super()._set_builder_args('trackFields', [*track_fields])
        super()._set_builder_args('trackAware', [True])
        return self

    def setTimeBoundarySplit(self, time_boundary_split, time_boundary_split_unit, time_boundary_reference=None):
        """

        :param time_boundary_split
        :type time_boundary_split: int
        :param time_boundary_split_unit
        :type time_boundary_split_unit: str
        :param time_boundary_reference
        :type time_boundary_reference: int/long/datetime.datetime
        """
        check_duration(time_boundary_split, time_boundary_split_unit, "time_boundary_split")
        super()._set_builder_args('timeBoundarySplit', [time_boundary_split, time_boundary_split_unit])
        if time_boundary_reference:
            super()._set_builder_args('timeBoundaryReference', [time_boundary_reference])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class Overlay(BaseTool):

    def __init__(self):
        super().__init__('OverlayLayers')

    def setOverlayType(self, overlay_type):
        """

        :param overlay_type
        :type overlay_type: str
        """
        super()._set_builder_args('overlayType', [overlay_type])
        return self

    def run(self, dataframe, overlay_dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        super()._set_builder_args('overlayLayer', [overlay_dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class Clip(BaseTool):

    def __init__(self):
        super().__init__('ClipLayer')

    def run(self, dataframe, clip_dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        super()._set_builder_args('clipLayer', [clip_dataframe])
        result = super()._exec_tool(['output'])
        return result['output']

