from .base import Saver

__all__ = ["PDFSaver"]


class PDFSaver(Saver):
    PREFIX = "PDF"

    def __init__(self, gdb, folder, base_name):
        super().__init__(gdb, folder, base_name, suffix="pdf")

    @staticmethod
    def get_exe():
        import arcpy
        import os

        return os.path.join(arcpy.GetInstallInfo()["InstallDir"], "bin", "wkhtmltopdf.exe")

    def main(self, html_file):
        import subprocess

        subprocess.check_call(
            [
                self.get_exe(),
                str(html_file),
                str(self._output_file()),
            ],
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
