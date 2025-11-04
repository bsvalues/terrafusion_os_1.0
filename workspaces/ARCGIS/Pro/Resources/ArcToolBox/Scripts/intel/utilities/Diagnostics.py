from __future__ import annotations

import arcpy
import os
import pathlib
import ctypes

class Diagnostic:
    ''' Class that determines whether the enablediagnostics flag is enabled in the application.
        This class sets two properties that are then passed to the utilities __init__ class and used
        throughout ArcGIS AllSource. 

        The two properties that are passed out are:
            is_enabled [bool]: a simple boolean value representing whether diagnostics is enabled.
            diagnostics_path [str]: the path to where the diagnostics/log file will be written.

        For versions past 3.0 the diagnostics_path property will be able to be set via an option
        that is accessible via the backstage.
    '''
    
    def __init__(self):       
        # get log dll
        pro_install_dir: str = arcpy.GetInstallInfo()['InstallDir']
        diagnostic_dll = ctypes.CDLL(os.path.join(pro_install_dir, "bin", "DADFLib.dll"))
        
        # Get enabled property from pro log file
        self._is_enabled: bool = False
        
        enabled_val: int = diagnostic_dll.EventLogIsEnabled()
        
        if enabled_val == 0:
            self._is_enabled = False
        else:
            self._is_enabled = True
        
        # Get diagnostic folder path
        self._diagnosticPath: str = os.path.join(pathlib.Path.home(),
                                           "Documents",
                                           "ArcGIS",
                                           "Diagnostics")
        
    def __del__(self):
        del self.is_enabled
        del self.diagnostic_path
    
    def __repr__(self) -> str:
        return f"Diagnostic<is enabled: {self.is_enabled}, \n\
                            diagnostic path: {self.diagnostic_path}>"

    def __str__(self) -> str:
        return self.__repr__()
    
    @property
    def is_enabled(self) -> bool:
        return self._is_enabled
    @is_enabled.deleter
    def is_enabled(self) -> None:
        del self._is_enabled
    
    @property
    def diagnostic_path(self) -> str:
        return self._diagnosticPath
    @diagnostic_path.deleter
    def diagnostic_path(self) -> None:
        del self._diagnosticPath

DEBUG = Diagnostic().is_enabled
DIAGNOSTIC_PATH = Diagnostic().diagnostic_path