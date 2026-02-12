"""Module to create layer popup."""

from typing import Optional, Any, List, Dict, Union

from .palog import LogUtils

LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["PopupInfo"]


class PopupInfo:
    """Popup info element of a featurelayer.

    Attributes
    ----------
        title : 'str'
            Title of the popup.
        description : 'Optional[str]'
            Description of the popup.
        show_attachments : 'bool'
            True if the attachments need to be shown and False otherwise.

    Methods
    -------
        add_media_info()
            Add a chart element to mediaInfo component of the popup.
        add_field_info()
            Add a field element to fieldInfo component of the popup.
        get_popup_info()
            Get a Dict with key as the property name and value by the property value.

    """

    def __init__(self, title: str, description: Optional[str] = None, show_attachments: bool = False):
        """Set object properties.

        Args:
            title: title of the popup.
            description: description of the popup.
            showAttachments: whether to show attachments in the popup or not.
        Returns:
            No returns.

        """
        self.title = title
        if description:
            self.description = description
        self.showAttachments = show_attachments

    class _ChartMediaInfo:
        """Struct represents the chart component of the popup."""

        def __init__(self, title: str, caption: str, value: Any, chart_type: str):
            """Set up the properties of the object.

            Args:
                title: title of the chart media.
                caption: caption of the chart.
                value: value of the chart.
                chartType: type of chart.
            Returns:
                No return.

            """
            self.title = title
            self.caption = caption
            self.value = value
            self.chartType = chart_type

    class _FieldInfo:
        """Struct represents the field info component of the popup."""

        def __init__(self, field_name: str, label: str, use_date_format: bool, places: int, visible: bool,
                     string_field_option: str, date_format: Any = None):
            """Set up the properties of the _FieldInfo object.

            Args:
                fieldName: name of the field.
                label: label of the field on popup.
                use_date_format: flag to whether use date format or not.
                places: decimal places to keep.
                visible: whether to set the field as visible or not.
                stringFieldOption: option to show the string field.
                date_format: special format for field with date type.

            """
            self.fieldName = field_name
            self.label = label
            self.tooltip = label
            self.visible = visible
            self.stringFieldOption = string_field_option
            self.isEditable = False if field_name.upper() in ["FID", "OID", "OBJECTID"] else True
            if use_date_format:
                if date_format:
                    self.dFormat = {"dateFormat": date_format}  # noqa. pylint: disable=invalid-name
                else:
                    self.dFormat = {"places": places, "digitSeparator": True}

    def add_media_info(self, title: str, field_names: List[str], tooltip_field: Any,
                       chart_type: str = "columnchart", caption: str = "",
                       norm_field: str = "", rel_table_id: Optional[Union[str, int]] = None):
        """Add a chart element to mediaInfo component of the popup.

        Args:
            title: title of the mediaInfo component.
            field_names: a list of field names.
            tooltip_field: field with tool tip information.
            chart_type: type of chart.
            caption: caption of the chart.
            norm_field: field of normalization.
            rel_table_id: id of the relational table. If rel_table_id is passed will prefix fieldnames and
            tooltip_field with /relationships/<reltableid>.
        Returns:
            No return.

        """
        if rel_table_id is not None:
            prefix = f"relationships/{rel_table_id}"
            field_names = [f"{prefix}/{field}" for field in field_names]
            tooltip_field = f"relationships/{rel_table_id}/{tooltip_field}"
        value = {"fields": field_names, "tooltipField": tooltip_field}
        value["normalizeField"] = norm_field
        media_info = vars(self._ChartMediaInfo(title, caption, value, chart_type))
        media_info.update({"type": media_info.pop("chartType")})
        if "mediaInfos" not in self.__dict__:
            self.mediaInfos = []  # noqa. pylint: disable=invalid-name, attribute-defined-outside-init
        self.mediaInfos.append(media_info)

    def add_field_info(self, field_name: str, label: str, use_dformat: bool = False, places: int = 2,
                       visible: bool = True, string_field_option: str = "textbox",
                       date_format: Any = None, rel_table_id: Any = None):
        """Add a field element to fieldInfo component of the popup.

        Args:
            fieldName: name of the field.
            label: label of the field on popup.
            use_date_format: flag to whether use date/double format or not.
            places: decimal places to keep.
            visible: whether to set the field as visible or not.
            string_field_option: option to show the string field.
            date_format: special format for field with date type.
            rel_table_id: id of the relational table.
        Returns:
            No return.

        """
        if rel_table_id is not None:
            field_name = "relationships/{}/{}".format(rel_table_id, field_name)
        field_info = vars(self._FieldInfo(field_name, label, use_dformat, places, visible,
                                          string_field_option, date_format))
        # update property name dFormat to format
        if use_dformat:
            field_info["format"] = field_info.get("dFormat")
            field_info.pop("dFormat")
        # Add to popup class
        if "fieldInfos" not in self.__dict__:
            self.fieldInfos = []  # noqa. pylint: disable=invalid-name, attribute-defined-outside-init
        self.fieldInfos.append(field_info)

    def get_popup_info(self) -> Dict:
        """Get the popup information.

        Returns:
            A dictionary with the keyed as the property name and valued by the property value.

        """
        return vars(self)
