import pathlib
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..conversion import Workspace


class Saver:
    PREFIX = ""  # Diagnostic log

    def __init__(self, gdb: "Workspace", folder: str, base_name: str, suffix: str):
        self.gdb = gdb
        self.folder = pathlib.Path(folder)
        self.base_name = base_name
        self.suffix = suffix

    def _output_file(self, base_name: str = None) -> pathlib.Path:
        return self.folder / f"{base_name or self.base_name}.{self.suffix}"
