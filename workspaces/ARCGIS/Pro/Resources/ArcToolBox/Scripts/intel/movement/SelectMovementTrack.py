from __future__ import annotations

import arcpy

from datetime import date, datetime, timedelta
from typing import Dict, Set, List

from intel.utilities import DEBUG, Logger, LocaleValidate
from intel.enumerations import MovementTracks

from intel.utilities.ErrorHandlers import general_error_handler, \
                                          general_error_logger

class MovementTrack:
    """Selects a movement track from features identified in the 
    source_feature_class and returns a selection layer to the user.
    Tracks are identified based on the source_id_field, input_roi, selection_time
    and time_frame parameters.
    """
    def __init__(self,
                 source_feature_class: str,
                 source_id_field: str,
                 input_roi: str,
                 selection_time: str,
                 time_frame: str) -> None:
        
        self._loc = LocaleValidate()

        self._source_feature_class = source_feature_class
        self._source_id_field = source_id_field
        self._input_roi = input_roi
        self._selection_time = selection_time
        self._time_frame = time_frame
        
        self._track_ids: Set[str] = set()
        self._dates: List[datetime] | List[List[datetime]] = []

        self._min_date: datetime | None = None
        self._max_date: datetime | None = None
        self._date_field: str = arcpy.Describe(self.source_feature_class).startTimeField
        self._where = ""

        self.DEBUG = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)

        self._min_delta: timedelta
        self._max_delta: timedelta
        
        return

    @property
    def source_feature_class(self) -> str:
        return self._source_feature_class

    @property
    def source_id_field(self) -> str:
        return self._source_id_field

    @property
    def input_roi(self) -> str:
        return self._input_roi

    @property
    def selection_time(self) -> str:
        value_unit = self._selection_time.split(" ")[1]
        value = self._loc.convert_locale_string_to_float(self._selection_time)
        switched_selection_time = f"{value} {value_unit}"
        return switched_selection_time
    
    @property
    def time_frame(self) -> str:
        return self._time_frame

    @property
    def track_ids(self) -> Set[str]:
        return self._track_ids

    @property
    def dates(self) -> List[datetime] | List[List[datetime]]:
        return self._dates
    @dates.setter
    def dates(self, value: List[datetime] | List[List[datetime]]) -> None:
        self._dates = value

    @property
    def track_ids_tuple(self) -> str:
        if self.stringify_track_ids_tuple and len(self.track_ids) == 1:
            return f"('{list(self.track_ids)[0]}')"
        elif not self.stringify_track_ids_tuple and len(self.track_ids) == 1:
            return f"({list(self.track_ids)[0]})"
        else:
            return str(tuple(self.track_ids))

    @property
    def stringify_track_ids_tuple(self) -> bool:
        out: bool = [f.type for f in arcpy.ListFields(self.source_feature_class) if f.name == self.source_id_field][0] == "String"
        return out

    @property
    def date_field(self) -> str:
        return self._date_field

    @property
    def min_date(self) -> datetime | None:
        return self._min_date
    @min_date.setter
    def min_date(self, value: datetime) -> None:
        self._min_date = value

    @property
    def max_date(self) -> datetime | None:
        return self._max_date
    @max_date.setter
    def max_date(self, value: datetime) -> None:
        self._max_date = value

    @property
    def where(self) -> str:
        return self._where
    @where.setter
    def where(self, value: str) -> None:
        self._where = value

    @property
    def min_delta(self) -> timedelta:
        return self._min_delta
    @min_delta.setter
    def min_delta(self, value: timedelta) -> None:
        self._min_delta = value

    @property
    def max_delta(self) -> timedelta:
        return self._max_delta
    @max_delta.setter
    def max_delta(self, value: timedelta) -> None:
        self._max_delta = value

    @general_error_logger
    def calculate_time_delta(self) -> None:
        """Calculates the minimum and maximum time deltas and assigns
        them to the min_delta and max_delta properties respectively.  This 
        method will only calculate the time delta if the time unit is either
        seconds, minutes, hours, or days. The time delta value is calculated off of 
        the selection_time property.  

        Raises:
            ValueError: Time unit is not Seconds, Minutes, Hours or Days.
        """

        selection_time_ = self.selection_time.split()
        selection_time_value = float(selection_time_[0])
        selection_time_unit = selection_time_[1]

        if self.DEBUG:
            self.logger.debug(f"Selection Time Value: {str(selection_time_value)}")
            self.logger.debug(f"Selection Time Unit: {selection_time_unit}")

        # This section may be worth refactoring in the match case statement
        # pattern once the Python environment associated with Pro/AllSource 
        # gets upgraded to at least 3.10.

        if selection_time_unit == 'Seconds':
            if self.time_frame == MovementTracks.BEFORE.value:
                self.min_delta = timedelta(seconds=selection_time_value)
                self.max_delta = timedelta(seconds=0)
            elif self.time_frame == MovementTracks.AFTER.value:
                self.min_delta = timedelta(seconds=0)
                self.max_delta = timedelta(seconds=selection_time_value)
            else:
                self.min_delta = timedelta(seconds=selection_time_value)
                self.max_delta = timedelta(seconds=selection_time_value)
        
        elif selection_time_unit == 'Minutes':
            if self.time_frame == MovementTracks.BEFORE.value:
                self.min_delta = timedelta(minutes=selection_time_value)
                self.max_delta = timedelta(minutes=0)
            elif self.time_frame == MovementTracks.AFTER.value:
                self.min_delta = timedelta(minutes=0)
                self.max_delta = timedelta(minutes=selection_time_value)
            else:
                self.min_delta = timedelta(minutes=selection_time_value)
                self.max_delta = timedelta(minutes=selection_time_value)
        
        elif selection_time_unit == 'Hours':
            if self.time_frame == MovementTracks.BEFORE.value:
                self.min_delta = timedelta(hours=selection_time_value)
                self.max_delta = timedelta(hours=0)
            elif self.time_frame == MovementTracks.AFTER.value:
                self.min_delta = timedelta(hours=0)
                self.max_delta = timedelta(hours=selection_time_value)
            else:
                self.min_delta = timedelta(hours=selection_time_value)
                self.max_delta = timedelta(hours=selection_time_value)
        
        elif selection_time_unit == 'Days':
            if self.time_frame == MovementTracks.BEFORE.value:
                self.min_delta = timedelta(days=selection_time_value)
                self.max_delta = timedelta(days=0)
            elif self.time_frame == MovementTracks.AFTER.value:
                self.min_delta = timedelta(days=0)
                self.max_delta = timedelta(days=selection_time_value)
            else:
                self.min_delta = timedelta(days=selection_time_value)
                self.max_delta = timedelta(days=selection_time_value)
        
        else:
            raise ValueError(arcpy.GetIDMessage(190399))

        if self.DEBUG:
            self.logger.debug(f"Minimum Timedelta: {str(self.min_delta)}")
            self.logger.debug(f"Maximum Timedelta: {str(self.max_delta)}")

    @general_error_logger
    def find_selected_tracks(self) -> None:
        """Selects the initial area of interest then iterates through
        the selected features to identify all track identifiers as defined
        in the source_id_field property and all datetime values as defined 
        by the start_time value derived from the input layer.  This method
        populates the track_ids and dates property.
        """

        arcpy.SelectLayerByLocation_management(self.source_feature_class, "INTERSECT", self.input_roi, "0", "NEW_SELECTION")

        if self.time_frame == MovementTracks.NONE.value:
            fields = [self.source_id_field]
        else:
            fields = [self.source_id_field, self.date_field]

        with arcpy.da.SearchCursor(self.source_feature_class, fields, sql_clause=("DISTINCT", None)) as cursor:
            for row in cursor:
                self.track_ids.add(row[0])
                if self.time_frame != MovementTracks.NONE.value:
                    self.dates.append(row[1])

    @general_error_logger
    def generate_where_statement(self) -> None:
        """Generates the updated where statement to be used in the final
        selection process.  Iterates through the dates property and gets
        the minimum and maximum datetime for each unique date as defined in 
        the identify_selection_days method.  This method updates the 
        min_date, max_date and where properties.
        """

        base_where = f"{self.source_id_field} IN {self.track_ids_tuple} "
        dates: List[datetime] = []
        for i,d in enumerate(self.dates):
            min_date = min(d) - self.min_delta
            max_date = max(d) + self.max_delta
            dates.append(min_date)
            dates.append(max_date)
            if i == 0:
                self.where += f"AND {self.date_field} >= timestamp '{min_date}' AND {self.date_field} <= timestamp '{max_date}' "
            else:
                self.where += f"OR {base_where} AND {self.date_field} >= timestamp '{min_date}' AND {self.date_field} <= timestamp '{max_date}' "
            
        self.where = self.where.rstrip()
        self.min_date = min(dates)
        self.max_date = max(dates)
        
        if self.DEBUG: 
            self.logger.debug(f"Where statement: {self.where}")
            self.logger.debug(f"Max time: {str(self.max_date)}")
            self.logger.debug(f"Min time: {str(self.min_date)}")

    @general_error_logger
    def update_where_statement(self) -> None:
        """Uses the time_frame property and the generate_where_statement
        and calculate_time_delta methods to update the where property used in the
        final selection.
        """

        self.where = f"{self.source_id_field} IN {self.track_ids_tuple} "
        
        if self.time_frame == MovementTracks.BEFORE.value:
            self.calculate_time_delta()
            self.generate_where_statement()

        
        elif self.time_frame == MovementTracks.AFTER.value:
            self.calculate_time_delta()
            self.generate_where_statement()
        
        elif self.time_frame == MovementTracks.BEFORE_AFTER.value:
            self.calculate_time_delta()
            self.generate_where_statement()
        
        else:
            self.where = self.where.rstrip()

        if self.DEBUG:
            self.logger.debug(f"Tracks ids: {self.track_ids_tuple}")


    @general_error_logger
    def identify_selection_days(self) -> None:
        """Takes the input dates property generated during the
        find_selected_tracks method and conducts a groupby to organize the
        list of dates into a list of list of dates.  This helps more accurately
        identify portions of the track that need to be subset via selection.
        """
        import pandas as pd

        df = pd.DataFrame(self.dates, columns=['dates'])
        grouped: Dict[date, datetime] = df.groupby([df["dates"].dt.date])["dates"].apply(list).to_dict()
        
        self.dates = [v for _,v in grouped.items()]
        if self.DEBUG: self.logger.debug(f"Number of unique days: {str(len(self.dates))}")

    def validate_time(self) -> None:
        from intel.utilities import validate_time_enablement
        from intel.errors import TimeEnablementError

        if self.time_frame != MovementTracks.NONE.value:
            try:
                validate_time_enablement(self.source_feature_class)
            except TimeEnablementError:
                self.logger.error(arcpy.GetIDMessage(190280))
                exit()

    @general_error_logger
    def select(self) -> None:
        """Takes an input source feature class and selects movement tracks based on the
        track identifyier and time value, if specified, and generates a selection.
        """
        if self.DEBUG:
            self.logger.debug(f"Source Feature Class: {self.source_feature_class}")
            self.logger.debug(f"Track ID Field: {self.source_id_field}")
            self.logger.debug(f"Time relationship {self.time_frame}")
            self.logger.debug(f"Selection time: {self.selection_time}")

        self.validate_time()

        self.find_selected_tracks()

        if self.time_frame != MovementTracks.NONE.value:
            self.identify_selection_days()

        self.update_where_statement()

        arcpy.SelectLayerByAttribute_management(self.source_feature_class, "ADD_TO_SELECTION", self.where)