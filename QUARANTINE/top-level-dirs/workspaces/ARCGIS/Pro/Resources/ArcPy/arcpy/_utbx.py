"""
toolbox API
"""

import os

__alias__ = "_utbx"

__all__ = [
    "CreateToolbox",
    "CreateTool",
    "ImportTool",
    "Delete",
    "Rename",
    "GetProps",
    "SetProps",
    "AuxFiles",
    "AuxFileDelete",
    "AuxFileCopy",
]


def CreateToolbox(path, alias="tbx1", props={}):
    """
    Create toolbox. NOTE: for universal toolbox path should end with '.tbx/'
    props: dictionary,
        'alias'       - string,
        'displayname' - string,
        'description' - string,
        'helpcontext' - int
    """
    return _internal().createNewToolbox(path, alias, props)


def Delete(path):
    """
    Delete toolbox or tool
    """
    _internal().deleteComponent(path)


def Rename(path, new_name):
    """
    Renames toolbox or tool
    """
    _internal().renameComponent(path, new_name)


def GetProps(path, names="*"):
    """
    Get toolbox or tool properties.
    path: full path to toolbox or tool
    names: string or collection of strings,
      '*'              - all available properties (ignore empty)
      toolbox:
        'alias'        - string
        'displayname'  - string
        'description'  - string
        'helpcontext'  - int
        'tools'        - dictionary {toolname(string), toolset(string)}
      tool:
        'type'         - string
        'displayname'  - string
        'description'  - string
        'helpcontext'  - int
        'product_code' - int
        'extention_codes' - tuple of (int)
        'params'       - list of [GPParamater]
        'script_file'  - string <Script tool>
        'validate_file'- string <Script tool>
        'guid'         - string <Function tool>
    """
    if _is_toolbox_path(path):
        return _internal().getToolboxProps(path, names)
    else:
        return _internal().getToolProps(path, names)


def SetProps(path, props):
    """
    Update toolbox or tool properties.
    path: full path to toolbox or tool
    props: dictionary,
      toolbox:
        'alias'       - string,
        'displayname' - string,
        'description' - string,
        'helpcontext' - int,
        'tools'       - dictionary {toolname, category}. allow to add/change/delete 'category'
      tool:
        'displayname'  - string
        'description'  - string
        'helpcontext'  - int
        'product_code' - int
        'extention_codes' - tuple of int
        'params'       - list of [GPParamater]
        'script_file'  - string <Script tool>
        'validate_file'- string <Script tool>
    """
    if _is_toolbox_path(path):
        _internal().updateToolbox(path, props)
    else:
        _internal().updateTool(path, props)


def DeleteTool(path):
    """
    Delete tool. path - <fullpath tbx>/<toolname>
    """
    _internal().deleteComponent(path)


def CreateTool(path, type="ScriptTool", toolset=None):
    """
    Create new tool.
    path: full toolbox path with new tool name
    type: 'ScriptTool', 'ModelTool'
    toolset: (optional) tool's category
    """
    _internal().createNewTool(path, type, "" if toolset is None else toolset)


def ImportTool(path, tool_path, name=None, toolset=None):
    """
    Import tool.
    path: full toolbox path
    tool_path: full tool path or function '{GUID}' or factory '{GUID}/name'
    name: (optional) new tool name, if None - use original tool name
    toolset: (optional) tool's category, if None - 'root' category
    """
    _internal().importTool(
        path,
        tool_path,
        "" if name is None else name,
        "" if toolset is None else toolset,
    )


def AuxFiles(path, auxonly=True):
    """
    returns tuple of toolbox files
    path: full toolbox path
    auxonly: True - returns auxiliary files only, False - all files inside toolbox
    """
    return _internal().files(path, auxonly)


def AuxFileDelete(file_path):
    """
    Delete auxiliary file.
    file_path: [string or list,tuple of string] full file path
    """
    if isinstance(file_path, (list, tuple)):
        for path in file_path:
            _internal().remove_file(path)
    else:
        _internal().remove_file(file_path)
    return


def AuxFileCopy(source_path, destination_path, overwrite=False):
    """
    Copy file from/to toolbox
    source_path: full path
    destination_path: full path
    """
    return _internal().copy_file(source_path, destination_path, overwrite)


def _internal():
    from arcgisscripting._arcgisscripting import _utbx

    return _utbx


def _is_toolbox_path(path):
    ext = os.path.splitext(path)[1]
    if ext == ".tbx" or ext == ".pyt":
        return True
    # is geodatabase toolbox or tool
    pos = path.find(".gdb")
    if pos == -1:
        return False
    # if '/' after '.gdb/' then tool
    return path.find("/", pos + 5) == -1 and path.find("\\", pos + 5) == -1
