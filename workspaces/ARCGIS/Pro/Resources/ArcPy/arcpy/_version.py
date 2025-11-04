#COPYRIGHT 2023 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

__all__ = ["version", "__version__"]

import os
import sys
from functools import cached_property

class Version:
    """ product version information """

    def __init__(self, ):
        """ initialize the class """

        self.data = self._get_installation_data()

    def __str__(self,):
        """ string repr of arcpy.__version__
             eg: ArcGISPro 3.2 (build 48013)
        """

        val = f"{self.data['product']} {self.data['version']}"
        if self.data.get('show_build', False):
            val += f" (build {self.build})"
        return val

    def __repr__(self):
        return f"<Version {self!s}>"

    @cached_property
    def installInfo(self):
        """ get the build from arcobjects version """

        from arcpy.geoprocessing import gp
        return gp.GetInstallInfo()

    @cached_property
    def build(self):
        """ get the build from arcobjects version """

        return self.installInfo["BuildNumber"]

    @cached_property
    def install_dir(self):
        """ install dir referenced relative to current file """

        return os.path.realpath(os.path.join(__file__, '..', '..', '..', '..'))

    @cached_property
    def arcobjects(self,):
        """ ArcObjects dll version

            querying reliable always there 'bin/afcore.dll'
        """

        fpth = os.path.join(self.install_dir, "bin", "afcore.dll")
        return self._get_file_version(fpth)

    @cached_property
    def arcgisscripting(self,):
        """ version of arcgisscripting in the active env """

        fpth = os.path.join(sys.prefix, "Lib", "site-packages", "arcgisscripting", "_arcgisscripting.pyd")
        return self._get_file_version(fpth)

    def _get_installation_data(self,):
        """ get data from ArcGIS.Installation.xml """

        try:
            from lxml import etree
            from lxml.objectify import BoolElement
        except Exception as e:
            # don't bring down arcpy if lxml broken
            pass

        product = None
        version = None
        product_full = None
        show_build = None
        executable_name = None

        fpth = os.path.join(self.install_dir, "bin", "ArcGIS.Installation.xml")
        if os.path.isfile(fpth) and ('lxml' in sys.modules):
            tree = etree.parse(fpth)

            installation = tree.getroot()
            product, version = list(installation.values())
            displayVersion = tree.xpath("//Installation/DisplayVersion")

            try:
                product_full, show_build = list(displayVersion[0].values())
                show_build = BoolElement(show_build).__bool__()
            except IndexError:
                pass

            try:
                executable_name = tree.xpath("//Installation/ExecutableName")[0].text
            except IndexError:
                pass
        else:
            version = self.installInfo["Version"]
            product = self.installInfo["ProductName"]
            show_build = True

        return {
            "product": product,
            "version": version,
            "product_full": product_full,
            "show_build": show_build,
            "executable_name": executable_name
        }

    def _get_file_version(self, filename):
        if not sys.platform.startswith("win"):
            return   # native linux does not support ctypes.windll
        from ctypes import (
            byref, c_char, c_uint, cast, windll,
            pointer, POINTER, sizeof, Structure, WinError
        )
        from ctypes.wintypes import BOOL, DWORD, LPVOID, LPCVOID, LPCWSTR

        class VS_FIXEDFILEINFO(Structure):
            _fields_ = [
                ("dwSignature", DWORD),  # will be 0xFEEF04BD
                ("dwStrucVersion", DWORD),
                ("dwFileVersionMS", DWORD),
                ("dwFileVersionLS", DWORD),
                ("dwProductVersionMS", DWORD),
                ("dwProductVersionLS", DWORD),
                ("dwFileFlagsMask", DWORD),
                ("dwFileFlags", DWORD),
                ("dwFileOS", DWORD),
                ("dwFileType", DWORD),
                ("dwFileSubtype", DWORD),
                ("dwFileDateMS", DWORD),
                ("dwFileDateLS", DWORD),
            ]

        PUINT = POINTER(c_uint)
        LPDWORD = POINTER(DWORD)

        GetFileVersionInfoSizeW = windll.version.GetFileVersionInfoSizeW
        GetFileVersionInfoSizeW.restype = DWORD
        GetFileVersionInfoSizeW.argtypes = [LPCWSTR, LPDWORD]
        GetFileVersionInfoSize = GetFileVersionInfoSizeW  # alias

        GetFileVersionInfoW = windll.version.GetFileVersionInfoW
        GetFileVersionInfoW.restype = BOOL
        GetFileVersionInfoW.argtypes = [LPCWSTR, DWORD, DWORD, LPVOID]
        GetFileVersionInfo = GetFileVersionInfoW  # alias

        VerQueryValueW = windll.version.VerQueryValueW
        VerQueryValueW.restype = BOOL
        VerQueryValueW.argtypes = [LPCVOID, LPCWSTR, POINTER(LPVOID), PUINT]
        VerQueryValue = VerQueryValueW  # alias

        dwLen = GetFileVersionInfoSize(filename, None)
        if not dwLen:
            raise WinError()
        lpData = (c_char * dwLen)()
        if not GetFileVersionInfo(filename, 0, sizeof(lpData), lpData):
            raise WinError()
        uLen = c_uint()
        lpffi = POINTER(VS_FIXEDFILEINFO)()
        lplpBuffer = cast(pointer(lpffi), POINTER(LPVOID))
        if not VerQueryValue(lpData, "\\", lplpBuffer, byref(uLen)):
            raise WinError()
        ffi = lpffi.contents

        result = [int(ffi.dwFileVersionMS >> 16),
                  int(ffi.dwFileVersionMS & 0xffff),
                  int(ffi.dwFileVersionLS >> 16),
                  int(ffi.dwFileVersionLS & 0xffff),]

        # return as a string
        return ".".join([str(i) for i in result])


# version and __version__ are included on in the root arcpy namespace
version = Version()
__version__ = version.data["version"]
