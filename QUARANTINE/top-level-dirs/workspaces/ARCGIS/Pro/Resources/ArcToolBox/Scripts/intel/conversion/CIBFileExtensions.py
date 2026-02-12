
import os
from intel.utilities import DEBUG, Logger
from intel.utilities.ErrorHandlers import general_error_logger

class CIBFileExtensions(object):

    _logger: Logger

    @general_error_logger
    def __init__(self):

        super().__init__()

        self._logger = Logger()
        self._logger.create_logger(self.__class__.__name__)
        if DEBUG:
            self._logger.debug(f"DEBUG is {DEBUG}")

        self._horizontal_geographic_zone: list[str] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "j"]

        self._cib_ext_base = {".5 meter resolution imagery": ".i5",
                              "1 meter resolution imagery": ".i4",
                              "2 meter resolution imagery": ".i3",
                              "5 meter resolution imagery": ".i2",
                              "10 meter resolution imagery": ".i1",
                              "greater than 10 meter resolution imagery": ".iv",
                             }

        self._cib_extensions: list[str] = []

        self._generateList()

    @property
    def fileExtensions(self) -> list[str]:
        return self._cib_extensions

    @general_error_logger
    def _generateList(self):

        for k, v in self._cib_ext_base.items():
            for zone in self._horizontal_geographic_zone:
                self._cib_extensions.append(f"{v}{zone}")
        return self._cib_extensions
