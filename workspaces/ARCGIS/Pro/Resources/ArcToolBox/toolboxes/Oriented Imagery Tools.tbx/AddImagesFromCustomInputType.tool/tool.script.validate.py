import sys
import importlib.util
from pathlib import Path
from typing import Optional
import arcpy

DEFAULT_INPUT_TYPE_FOLDER = (
    Path(__file__).parents[4] / "OrientedImagery/CustomInputTypes"
)


class ToolValidator:
    """Class to add custom behavior and properties to the tool and tool parameters."""

    def __init__(self) -> None:
        """Setup tool"""
        self.params = arcpy.GetParameterInfo()
        self.default_modules = self._get_default_modules()
        self.input_type: Optional[object] = None

    def initializeParameters(self) -> None:
        """
        Customize parameter properties.
        This gets called when the tool is opened.
        """
        self.params[1].filter.list = list(self.default_modules.keys()) + ["Folder"]

    def updateParameters(self) -> None:
        """
        Modify parameter values and properties.
        This gets called each time a parameter is modified, before standard validation.
        """
        if self.params[1].value and not self.params[1].hasBeenValidated:
            if self.params[1].valueAsText == "Folder":
                if self.params[2].hasBeenValidated:
                    self.params[2].value = ""
                    self.params[3].value = [["", ""]]
                    self.params[4].value = [["", ""]]
                self.params[2].enabled = True

    def updateMessages(self) -> None:
        """
        Customize messages for the parameters.
        This gets called after standard validation.
        """
        if self.params[1].valueAsText not in ["Folder", None]:
            module_name = self.params[1].valueAsText.strip()
            module_folder = self.default_modules[module_name]
            self.params[2].enabled = False
            self.params[2].value = str(module_folder)
            self._load_module(module_folder)

        if self.params[2].enabled and self.params[2].value:
            module_folder = Path(self.params[2].valueAsText.strip())
            self._load_module(module_folder)

        if (
            self.params[1].value != "Folder"
            and not self.params[1].hasBeenValidated
            and self.input_type
        ) or (
            self.params[2].enabled
            and self.params[2].value
            and not self.params[2].hasBeenValidated
            and self.input_type
        ):
            self._update_valuetables()

        self.params[3].clearMessage()

    def isLicensed(self) -> bool:
        """set tool isLicensed."""
        return (
            arcpy.CheckProduct("ArcEditor") in ["Available", "AlreadyInitialized"]
            or arcpy.CheckProduct("ArcInfo") in ["Available", "AlreadyInitialized"]
            or arcpy.CheckProduct("ArcServer") in ["Available", "AlreadyInitialized"]
        )

    def postExecute(self) -> None:
        """
        This method takes place after outputs are processed and added to the display.
        """

    @staticmethod
    def _get_default_modules() -> dict[str, Path]:
        """
        Get modules from DEFAULT_INPUT_TYPE_FOLDER

        Returns:
            dict[str, Path]: Dictionary of default module names and folders
        """
        default_modules = {}
        modules = DEFAULT_INPUT_TYPE_FOLDER.glob("**/*.py")
        for module in modules:
            if module.stem == module.parent.stem:
                default_modules[module.stem] = module.parent
        return default_modules

    def _load_module(self, module_folder: Path) -> None:
        """
        Load module and set input_type attribute

        Args:
            module_path (Path): Path to module
        """
        try:
            # load module
            module_name = module_folder.stem.strip(".")
            if str(module_folder) not in sys.path:
                sys.path.insert(0, str(module_folder))
            module = importlib.import_module(module_name)
            importlib.reload(module)

            # validate module
            type_class = getattr(module, module_name)
            type_class_methods = [
                "input_data_schema",
                "auxiliary_parameters",
                "oriented_imagery_fields",
                "oriented_imagery_properties",
                "oriented_imagery_records",
            ]
            for method in type_class_methods:
                getattr(type_class, method)

            self.input_type = type_class()
        except ImportError as error:
            if self.params[2].enabled:
                self.params[2].setIDMessage("ERROR", 3892, error.name)
            else:
                self.params[1].setIDMessage("ERROR", 3892, error.name)
            self.params[3].value = [["", ""]]
            self.params[4].value = [["", ""]]
        except (FileNotFoundError, AttributeError):
            if self.params[2].enabled:
                self.params[2].setIDMessage("ERROR", 3887)
            else:
                self.params[1].setIDMessage("ERROR", 3887)
            self.params[3].value = [["", ""]]
            self.params[4].value = [["", ""]]

    def _update_valuetables(self) -> None:
        """
        Update input_data_schema and auxiliary_parameters valuetables
        """
        try:
            input_data_schema = self.input_type.input_data_schema()
            new_keys = list(input_data_schema.keys())
            if self.params[3].value:
                current_keys = [row[0] for row in self.params[3].value]
            else:
                current_keys = [["", ""]]
            if current_keys != new_keys:
                self.params[3].value = [[key, ""] for key in input_data_schema]
        except Exception:
            self.params[3].setIDMessage("ERROR", 3888, "input_data_schema")
            self.params[3].value = [["", ""]]
            self.params[4].value = [["", ""]]

        try:
            auxiliary_parameters = self.input_type.auxiliary_parameters()
            new_keys = list(auxiliary_parameters.keys())
            if self.params[4].value:
                current_keys = [row[0] for row in self.params[4].value]
            else:
                current_keys = [["", ""]]
            if current_keys != new_keys:
                self.params[4].value = [
                    [key, value] for key, value in auxiliary_parameters.items()
                ]
        except Exception:
            self.params[4].setIDMessage("ERROR", 3888, "auxiliary_parameters")
            self.params[3].value = [["", ""]]
            self.params[4].value = [["", ""]]
