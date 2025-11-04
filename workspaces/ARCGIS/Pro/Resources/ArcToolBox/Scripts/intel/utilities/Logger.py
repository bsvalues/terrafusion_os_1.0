from __future__ import annotations

import logging
import os
import arcpy

from typing import Dict, List

from intel.utilities import DEBUG, DIAGNOSTIC_PATH
from intel.utilities.interfaces.ILogger import ILogger

class Logger(ILogger):
    """Basic logging class for ArcGIS AllSource. This class is designed
    to create only one instance of the Logger and any subsequent classes that are
    created reference the existing class.  NOTE: No new instances of this class will actually
    get created and to test this, two methods have been created to display the address in memory
    of the current class.  The get_class_address will get the address in memory of the existing
    logger class and the get_instance_address will get the address in memory of any instances
    that were created of the class. If there were any instance created, and a memory address
    is returned, this should be considered an error.

    Raises:
        Exception: This error will be raised if an instance of the logger is identified as being created.

    Returns:
        [Logger]: The logger class
    """
    def __init__(self) -> None:
        self._loggers_dict: Dict[str, logging.Logger] = {}
        self._loggers: List[str] = []
        self._top_level_logger = False
        if DEBUG:
            self._log_level = logging.DEBUG
            self._level = 'DEBUG'
        else:
            self._log_level = logging.WARNING
            self._level = 'WARN'
        
        pass

    @property
    def active_handlers(self):
        return self.top_logger.handlers

    @property
    def loggers_dict(self):
        return self._loggers_dict

    @property
    def loggers(self):
        return self._loggers

    @property
    def top_level_logger(self):
        return self._top_level_logger

    @property
    def log_level(self):
        return self._log_level

    @property
    def level(self):
        return self._level

    def create_hanlders(self) -> logging.Logger:
        # create logger with 'spam_application'
        self.top_logger = logging.getLogger('intel')
        self.top_logger.setLevel(logging.DEBUG)
        if not self.top_logger.handlers:    

            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            
            if self.level == "DEBUG":   
                if not os.path.exists(DIAGNOSTIC_PATH):
                    os.mkdir(DIAGNOSTIC_PATH, mode=0o777)

                log_name = f"Intel.log"
                out_log = os.path.join(DIAGNOSTIC_PATH, log_name)
            
                fh = logging.FileHandler(out_log)
                fh.setLevel(logging.DEBUG)
                fh.setFormatter(formatter)
                self.top_logger.addHandler(fh)

        self._top_level_logger = True
        return self.top_logger

    def create_logger(self, name: str) -> None:
        if not self.top_level_logger:
            self.create_hanlders()

        if self.loggers_dict.get(name):
            self.logger = self.loggers_dict.get(name)
        else:
            logger = logging.getLogger(f"intel.{name}")
            self.loggers_dict[f"intel.{name}"] = logger
            self.loggers.append(f"intel.{name}")
            self.logger = logger
    
    @classmethod
    def get_class_address(cls) -> str:
        """Returns the address of the Logger class.  NOTE: This method was implemented
        primarily to help with testing and debugging of the logger class and to ensure the
        class remains a singleton class.

        Returns:
            str: The location in memory of the Logger instance
        """
        return hex(id(cls))

    def get_instance_address(self) -> str:
        """Returns the instance address of the Logger.  NOTE:  This method should always fail.
        This class is designed as a singleton class and therefore does not have any call to self.
        This method is implemented as a testing means to verify the "singleton-ness" of the class.

        Returns:
            str: The location in memory of the Logger instance
        """
        return hex(id(self))
    
    
    def debug(self, msg: str) -> None:
        arcpy.AddMessage(f"{msg}")
        self.logger.debug(msg)

    def warning(self, msg: str) -> None:
        arcpy.AddWarning(msg)
        self.logger.warning(msg)

    def error(self, msg: str) -> None:
        arcpy.AddError(msg)
        self.logger.error(msg)

    def err(self, msg: str) -> None:
        self.logger.error(msg)