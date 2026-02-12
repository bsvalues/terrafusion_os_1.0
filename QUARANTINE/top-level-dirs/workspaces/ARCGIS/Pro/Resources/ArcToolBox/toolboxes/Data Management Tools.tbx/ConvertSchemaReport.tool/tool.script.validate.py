import pathlib

import arcpy


class ToolValidator:
    def __init__(self):
        self.params: tuple[arcpy.Parameter, ...] = arcpy.GetParameterInfo()
        (
            self.report,
            self.folder,
            self.name,
            self.formats,
            *_,
        ) = self.params

    def _validate_output_files(self):
        for param in (self.folder, self.name, self.formats):
            if param.hasError() or not param.valueAsText:
                return

        base = pathlib.Path(self.folder.valueAsText) / self.name.valueAsText
        for ext in self.formats.values:
            if (file := base.with_suffix(f".{ext.casefold()}")).exists():
                # 2869: Output file %s already exists.
                self.name.setIDMessage("ERROR", 2869, file.as_posix())
                return

    def initializeParameters(self):
        if not self.folder.valueAsText:
            try:
                self.folder.value = arcpy.mp.ArcGISProject("current").homeFolder
            except OSError:
                pass

    def updateMessages(self):
        self._validate_output_files()
