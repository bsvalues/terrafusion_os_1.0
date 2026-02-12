#COPYRIGHT 2018 ESRI
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
"""Routines for generating python code from a toolbox."""

import collections
import keyword
import operator
import os
import re
import textwrap
import tokenize
import types
import xml.dom.minidom

from arcpy import gp

from os.path import relpath

# Dictionary borrowed from tool_operation.py in rebuild_gptool_static_files repo
name_hacks = \
{
    # This dictionary maps old argument names as used in the tool's
    # implementation to new ones used in the documentation.
    # Tool:
    #    old name: new name
    "ExtractByRectangle":
    {
        "rectangle": "extent"
    },
    "ExtractByPolygon":
    {
        "polygon": "polygons"
    },
    "Kriging":
    {
        "semiVariogram_props": "kriging_model"
    },
    "TopoToRaster":
    {
        "in_topo_features": "topo_input"
    },
    "WeightedSum":
    {
        "in_rasters": "in_weighted_sum_table"
    },
    "SplineWithBarriers":
    {
        "Input_point_features": "in_point_features",
        "Output_cell_size": "cell_size"
    },
    "ContourWithBarriers":
    {
        "in_contour_list": "in_explicit_contours"
    },
    "IsoClusterUnsupervisedClassification":
    {
        "Input_raster_bands": "in_raster_bands",
        "Output_signature_file": "out_signature_file"
    },
}

data_type_hacks = {
    # This dictionary maps old argument data types as used in the tool's
    # implementation to new ones used in the documentation.
    # Tool:
    #    old data type : new data type
    "Kriging":
    {
        "Semivariogram": "KrigingModel"
    },
}

# modify tokenize to prevent traceback inception
try:
    _detect_encoding = tokenize.detect_encoding
    def detect_encoding(readline):
        try:
            return _detect_encoding(readline)
        except SyntaxError:
            return 'latin-1', []

    tokenize.detect_encoding = detect_encoding
except Exception:
    pass

def clnstr(s):
    s = re.sub("\\u2013| \\u2014 | \\u2014|\\u2014 |\\u2014", "-", s)
    s = re.sub("\\u2019", "'", s)
    s = re.sub("\n\n\n", "\n\n", s)
    s = re.sub(r"(?<= \*) +", " ", s)
    s = re.sub(r"(?<=\.) +", " ", s)

    return s.strip()


HTML_RE = re.compile('(</?[A-Z]+( [A-Za-z]+="[^"]*")*/?>)')
def text_for_node(somenode):
    """Returns a safe representation of all the text in a dom.minidom node"""
    if isinstance(somenode, list):
        return " ".join(text_for_node(node) for node in somenode)
    elif somenode is None:
        return ""
    elif somenode.nodeType == somenode.ELEMENT_NODE:
        if somenode.tagName.lower() == "bullet_item":
            return "\n\n* " + " ".join(text_for_node(node) for node in somenode.childNodes) + "\n"
        elif somenode.tagName.lower() == "link":
            return ""
        lines = ["\n".join(textwrap.wrap(line.replace('           \\u2014','\\u2014'), 70))
                 for line in
                     ("".join(text_for_node(node) for node in somenode.childNodes).split("\n"))]
        return "\n".join(lines)
    elif somenode.nodeType in (somenode.TEXT_NODE, somenode.ENTITY_NODE):
        if somenode.data.strip():
            data = somenode.data
            # Strip out HTML and HTML-like data in the text nodes
            for replace_data in set(x[0] for x in HTML_RE.findall(somenode.data)):
                data = data.replace(replace_data, ' ')
            return data.replace("\n", " ").replace("  ", " ")
    return ""

def indent_text(astring, indentation=4):
    return '\n'.join((" " * (indentation if line else 0)) + line
                      for linenum, line in enumerate(astring if isinstance(astring, list)
                                                             else astring.split('\n'))).strip()

def indent_unicode_text(astring, indentation=4):
    itext = '\n'.join((" " * (indentation if line else 0)) + line
                      for linenum, line in enumerate(astring if isinstance(astring, list)
                                                             else astring.split('\n'))).strip()
    return itext

def safe_name(*names, **kw):
    """Creates a python-safe identifier name from a set of provided strings"""
    appropriate_name_re = re.compile("^[_A-Za-z][_A-Za-z0-9]*$")
    front, back, bad = (kw.get('front', None),
                        kw.get('back',  None),
                        kw.get('bad',   None))
    def good(name):
        if not name:
            return False
        if bad:
            if name in bad:
                return False
        return name not in keyword.kwlist and appropriate_name_re.match(name)
    for name in names:
        if not name:
            continue
        if good(name):
            return name
        if front:
            if good(front + name):
                return front + name
        if back:
            if good(name + back):
                return name + back
    if kw.get('no_raise', None):
        return None
    raise ValueError(gp.getIDMessage(89008) % #"Cannot create good identifier from options: %s" %
                      repr(names))

def arglist_for_tool(tool, long_mode=False):
    """Builds a list of names for arguments in the tool's calling function"""
    seen_names = set()
    arglist = []

    try:
        md_string = tool.metadata.encode("utf-8")
        md = xml.dom.minidom.parseString(md_string)
        params = md.getElementsByTagName("param")
    except Exception as e:
        md_string, md, params, param_names = None, None, None, None
    try:
        if params is not None:
            param_names = [paramnode.attrib.get('expression', '').strip()
                           for paramnode in params]
        else:
            param_names = [paramitem.name for paramitem in tool.parameters]
    except Exception as e:
        param_names = []
    param_names += ([None] * len(tool.parameters))
    try:
        for index, parameter in enumerate(t for t in tool.parameters if t.parametertype != "Derived"):
            name = safe_name(parameter.name,
                             parameter.displayname.replace(' ', '_').replace('-', '_'),
                             'parameter_%i' % (index+1), # fallback
                             front='_',
                             bad=seen_names)
            seen_names.add(name)
            if long_mode:
                try:
                    if parameter.multivalue or (isinstance(parameter.datatype, str)
                                                    and 'value table' in
                                                        parameter.datatype.lower()):
                        name = "%s;%s..." % (name, name)
                except (RuntimeError, AttributeError):
                    pass
            arglist.append(param_names[index] if param_names[index] else name)

    except Exception as e:
        arglist = ['*a']
    return arglist

def docstring_for_tool(tool):
    """Builds the documentation string for an individual tool"""

    fn_name = "%s%s" % (tool.name, "_%s" % tool.toolbox.alias
                                           if safe_name(tool.toolbox.alias, no_raise=True)
                                           else '')
    arglist = arglist_for_tool(tool, True)
    arg_string = "argument, argument, argument, ..."
    omit_required_output = False
    if str(tool.toolbox.alias).lower() in ["sa", "ia"]:
        omit_required_output = True
    if isinstance(arglist, list):
        arg_string_list = []
        try:
            params = tool.parameters
        except Exception as e:
            params = []
        for param, argname in zip([p for p in params if (p.parametertype != "Derived") ], arglist):
            if tool.name in list(name_hacks.keys()) and param.name in list(name_hacks[tool.name].keys()):
                argname = name_hacks[tool.name][param.name]
            if param.parametertype != "Required":
                arg_string_list.append("{%s}" % argname)
            else:
                if omit_required_output and param.direction == "Output" and param.DataType == "Raster Dataset":
                    continue
                else:
                    arg_string_list.append(argname)
        arg_string = ", ".join(arg_string_list)

    # First line (usage)
    yield f"{fn_name}({arg_string})"
    inputs, outputs = [], []
    # Now attempt to fetch XML metadata and make more documentation with that
    md = None
    param_info_types = {}

    try:
        def get_metadata_string(tool):
            m_path = os.getenv("ARCPY_PARAM_DESCRIPTION_PATH")
            if m_path != None :
                try:
                    xml_file = f"{m_path}\\{tool.name}_{tool.toolbox.alias}.xml"
                    return open(xml_file, mode="r", encoding="utf-8").read()
                except Exception as e:
                    pass
            return tool.metadata.encode("utf-8")

        md_string = get_metadata_string(tool)
        md = xml.dom.minidom.parseString(md_string)
        params = md.getElementsByTagName("param")

        if params:
            param_info_types = {p.getAttribute('name') :
                                  [clnstr(text_for_node(y))
                                     for y in ((p.getElementsByTagName('pythonReference') or
                                                p.getElementsByTagName('dialogReference')))
                                  ] for p in params}

        summarynodes = (md.getElementsByTagName('summary') or md.getElementsByTagName('idAbs'))
        if summarynodes:
            description = summarynodes[-1]
            description_text = text_for_node(description).strip()

            if description_text:
                yield ""
                yield "        " + indent_text(description_text.split('\n'), 8)
    except Exception as e: # Just sort of pretend the whole thing never happened
        yield ""

    # Inputs/outputs
    try:
        tool.parameters
    except Exception as e:
        return # Give up if params aren't gettable.

    for parameter in tool.parameters:
        if parameter.parametertype == "Derived":
            continue
        ltb, rtb = ('(', ')') if parameter.parametertype == "Required" else ('{', '}')
        updated_parameter_name = parameter.name
        if tool.name in list(name_hacks.keys()) and parameter.name in list(name_hacks[tool.name].keys()):
            updated_parameter_name = name_hacks[tool.name][parameter.name]
        updated_parameter_datatype = parameter.datatype
        if tool.name in list(data_type_hacks.keys()) and parameter.datatype in list(data_type_hacks[tool.name].keys()):
            updated_parameter_datatype = data_type_hacks[tool.name][parameter.datatype]
        param_string = ("      %s %s%s%s" % ((updated_parameter_name or ''),
                                              ltb,
                                              updated_parameter_datatype if isinstance(parameter.datatype, str)
                                                                    else ' / '.join(parameter.datatype)
                                                  if not (parameter.filter and
                                                          parameter.filter.list and
                                                          parameter.filter.type != "ValueList")
                                                  else "|".join(str(pl) for pl in
                                                                parameter.filter.list),
                                              rtb))
        to_append = None
        if parameter.direction == "Input":
            to_append = inputs
        else:
            to_append = outputs

        param_info = param_info_types.get(parameter.name)

        indented_text = (indent_unicode_text('\n'.join(param_info), 10)
                         if param_info else parameter.displayname)

        try:
            if indented_text:
                param_string += ":\n          " + indented_text
        except Exception as e:
            pass

        to_append.append(param_string)

    if inputs or outputs:
        yield ''
    if inputs:
        yield "     INPUTS:"
        for line in inputs:
            yield line
        if outputs:
            yield ''
    if outputs:
        yield "     OUTPUTS:"
        for line in outputs:
            yield line

def function_name_for_tool(tool, alt_alias=None, use_alt_alias=True):
    alias = (use_alt_alias and alt_alias) or tool.toolbox.alias
    fn_name = "%s%s" % (tool.name, "_%s" % alias
                                           if alias
                                              and ' ' not in alias
                                           else '')
    return str(fn_name)


def args_as_str(arglist, tool):

    # first collect tool's params
    params = {}

    for param in tool.parameters:
        if param.filter is not None:
            param_filter_list = None
            try:
                if param.dataType in ["Linear Unit", "Areal Unit"]:
                    pass
                elif param.name in ["network_data_source", "Input_Network_Data_Source"]:
                    pass
                elif param.dataType == "Boolean":
                    param_filter_list = param.filter.List
                else:
                    param_filter_list = param.filter.ValueList
            except Exception as e:
                pass

            if (param_filter_list is not None) and (param_filter_list != []):
                params[param.name] = {"param_filter_list": param_filter_list,
                                      "multivalue": param.multivalue}

    # second walk through arglist and amend with type hint where appropriate
    result = []
    for arg in arglist:
        str_literal = ""
        default = "None"  #  could fetch default from param but risky
        if arg in params.keys():
            param_filter_list = params[arg].get("param_filter_list", None)

            if param_filter_list:
                if "" in param_filter_list:
                    # present on GPLinearUnit, skip these
                    str_literal = ""
                if params[arg].get("multivalue", False) is False:
                    str_literal = f": Literal{str(param_filter_list)} | None"
                else:
                    str_literal = f": list[Literal{str(param_filter_list)}] | Literal{str(param_filter_list)} | str | None"
        result.append(f"{arg}{str_literal}={default}")

    return ", ".join(result) + ("," if result else "")  # add magic trailing comma

def result_str(tool):
    from arcpy._mp import Layer, Table
    from arcpy import RecordSet, FeatureSet
    output = []
    for param in tool.parameters:
        if param.direction != "Output":
            continue

        gp_types = ";".join([param.dataType] if isinstance(param.dataType, str) else param.dataType)
        python_types = [str]
        if "Table View" in gp_types:
            python_types.append(Table)
        if "Layer" in gp_types:
            python_types.append(Layer)
        if "Record Set" in gp_types:
            python_types.append(RecordSet)
        if "Feature Set" in gp_types:
            python_types.append(FeatureSet)
        output.append("|".join(p.__name__ for p in python_types))

    if not output or len(output) > 3:
        return "Result"

    return f"Result{len(output)}[{','.join(output)}]"

def code_for_tool(tool, include_add_toolbox=False, alt_alias=None, use_alt_alias=True):
    """Builds a code snippet for an individual tool"""

    arglist = arglist_for_tool(tool)
    fn_name = function_name_for_tool(tool, alt_alias)
    gp_fn_name = function_name_for_tool(tool, alt_alias, use_alt_alias)

    yield "@gptooldoc(%r, None)" % str(fn_name)
    yield f"def {tool.name}({args_as_str(arglist, tool)}) -> {result_str(tool)}:"
    fn_doc = "\n".join(line if isinstance(line, str)
                            else line.decode("utf-8")
                            for line in docstring_for_tool(tool))

    # if last characted in fn_doc is " collides with closing """
    if fn_doc.endswith('"'):
        fn_doc += " "

    yield '    """%s"""' % (clnstr(fn_doc.replace('"""',"'''").replace("\\", "\\\\")))
    argstring = ("(%s%s)" % (', '.join(arglist)
                            if all('*' not in arg for arg in arglist)
                            else ','.join(a.lstrip('*') for a in arglist),
                            ',' if len(arglist) == 1
                                and not arglist[0].startswith('*')
                                else ''))
    yield "    from arcpy.geoprocessing._base import gp, gp_fixargs"
    yield "    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject"
    yield "    try:"
    yield f"        retval = convertArcObjectToPythonObject(gp.{gp_fn_name}(*gp_fixargs({argstring}, True)))"
    try:
        mod = __import__('arcpy._%s' % getattr(tool.toolbox, 'alias', ''))
        if (tool.name + "Result") in mod.__dict__:
            yield f"        from arcpy._{tool.toolbox.alias} import {tool.name}Result"
            yield f"        retval.__class__ = {tool.name}Result"
    except ImportError:
        pass
    yield "        return retval"
    yield "    except Exception as e:"
    yield "        raise e"

def docstring_for_toolbox(toolbox):
    """Returns a documentation string for a toolbox"""
    try:
        md_string = toolbox.metadata.encode("utf-8")
        md = xml.dom.minidom.parseString(md_string)
        abstract = (md.getElementsByTagName('idAbs') or [None]).pop()
        return text_for_node(abstract).strip()
    except Exception as e:
        return f"Toolbox {toolbox.displayname}"

def code_for_toolbox(toolbox, include_add_toolbox, relative_to=None, system_toolbox=False, alt_alias=None, use_alt_alias=True, exclude=[]):
    def toolset(tool):
        return os.path.dirname(tool.pathname)[len(tool.toolbox.pathname)+1:]
    toolsets = collections.defaultdict(list)
    for tool in toolbox.tools:
        if function_name_for_tool(tool) not in exclude:
            tool.parameters # This is necessary to rehydrate some tools.
            toolsets[toolset(tool)].append(tool)
    yield '# -*- coding: utf-8 -*-'
    yield 'r"""%s"""' % docstring_for_toolbox(toolbox).replace('"""', "'''")
    yield "from __future__ import annotations"
    yield f"__all__ = {[str(tool.name) for tool in toolbox.tools if (function_name_for_tool(tool) not in exclude)]}"
    yield "__alias__ = %r" % (alt_alias if alt_alias else toolbox.alias)
    if not system_toolbox:
        yield "__pathname__ = %r" % (toolbox.pathname if not relative_to
                                     else os.path.relpath(toolbox.pathname,
                                                          os.path.dirname(relative_to)))
    yield """
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3
""".strip()
    if system_toolbox:
        alias = getattr(toolbox, 'alias', '').strip().lower()
        if alias and (alias != "ba"):
            try:
                __import__(f'arcpy._{alias}' )
                yield f"from arcpy import _{alias}"
                yield f"from arcpy._{alias} import *"
                yield f"__all__ += _{alias}.__all__"
            except ImportError:
                pass # No special hidden _alias module found

    alt_alias_string = ", {}".format(repr(alt_alias)) if (alt_alias and use_alt_alias) else ''
    # Add the boilerplate gp.addToolbox() stanza
    if include_add_toolbox or relative_to:
        yield "# Make sure toolbox is in memory"
        # Absolute path, easy
        yield "try:"
        if not relative_to:
            yield f"    gp.addToolbox(__pathname__{alt_alias_string})"
        else:
            yield "    # This python file was saved with a relative path"
            # Get where the .tbx will be relative to the output .py file
            relative_path = relpath(toolbox.pathname,
                                    os.path.dirname(relative_to))
            # Put it together at runtime
            yield "    import os"
            yield "    gp.addToolbox("
            yield "       os.path.abspath("
            yield "           os.path.join("
            yield "              os.path.dirname(__file__),"
            yield "              %r))%s)" % (relative_path, alt_alias_string)
        yield "except RuntimeError:"
        yield "    raise ImportError('Could not import toolbox %%r' %% %r)" % (toolbox.pathname
                                                                               if not relative_to
                                                                               else relative_path)
        yield ""
    yield ""
    for toolsetname in sorted(toolsets):
        if toolsetname.strip():
            yield f"# {toolsetname} toolset"
        else:
            yield "# Tools"
        for tool in sorted(toolsets[toolsetname],
                           key=operator.attrgetter('name')):
            for line in code_for_tool(tool, include_add_toolbox, alt_alias, use_alt_alias):
                yield line
            yield ""
        yield ""
    yield "# End of generated toolbox code"
    yield "del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING"

def generate_toolbox_module(tbxfile, output_file=None,
                            include_gp_addtoolbox=False,
                            relative_paths=False,
                            system_toolbox=False,
                            alt_alias=None,
                            use_alt_alias=True,
                            exclude=[]):
    """Loads a file toolbox (.tbx) and creates Python code for it.
       if output_file is a string, it will treat it as a filename
       to open."""
    if isinstance(tbxfile, str):
        gp.addToolbox(tbxfile)
        toolbox = gp.createObject("Toolbox", tbxfile)
    else:
        toolbox = tbxfile
        gp.addToolbox(tbxfile.pathName, alt_alias if use_alt_alias else None)
    if relative_paths:
        if not isinstance(output_file, str):
            raise RuntimeError(gp.getIDMessage(89009,
                               "Cannot generate a path relative to unknown output"))
        relative_path = output_file
    else:
        relative_path=None
    code = "\n".join(line if isinstance(line, str)
                           else line.decode("utf-8")
                        for line in
                            code_for_toolbox(toolbox,
                                             include_gp_addtoolbox,
                                             relative_path,
                                             system_toolbox,
                                             alt_alias,
                                             use_alt_alias,
                                             exclude))

    if output_file:
        open(output_file, 'wb').write(code.encode('utf-8'))
        return code
    else:
        newmodule = types.ModuleType(alt_alias or toolbox.alias)

        try:
            code = code.encode('utf-8')
        except Exception as e:
            try:
                code = code.encode('utf-8', 'replace')
            except Exception as e:
                # Really, REALLY invalid unicode. Strip down to ASCII.
                code = ''.join(x for x in code if 32 <= ord(x) < 128)

        mycode = compile(code, toolbox.pathName, 'exec')

        # Virtual import
        eval(mycode, newmodule.__dict__, newmodule.__dict__)
        return newmodule

def import_toolbox(tbxfile, module_name=None):
    r"""Loads a file toolbox(.tbx) and creates a Python module for it.

       Sample usage:

       arcpy.import_toolbox(r"C:\Data\ArcToolbox\Sample Toolbox\demo.tbx",
                             'toolboxsample')

       This will then generate a python module for demo.tbx and make it
       available for import as arcpy.toolboxes.toolboxsample

       If the second argument is not provided, the function will use the alias
       of the toolbox, if it is set and a valid Python identifier."""
    use_alt_alias = True
    if isinstance(tbxfile, str):
        toolbox = gp.createObject("Toolbox", tbxfile)
        if tbxfile.lower().startswith('http://'):
            use_alt_alias = False
    else: # Assume non-strings are instances of Toolbox
        toolbox = tbxfile

    mymodule = generate_toolbox_module(toolbox, None, False, False, False, module_name, use_alt_alias)
    import arcpy
    for tool in mymodule.__all__:
        setattr(arcpy, tool + ('_' + mymodule.__alias__
                               if mymodule.__alias__ else ''),
                getattr(mymodule, tool, None))
    # Module already exists in arcpy?
    if hasattr(arcpy, mymodule.__alias__):
        existing_module = getattr(arcpy, mymodule.__alias__)
        # Is it a module?
        if not hasattr(existing_module, '__all__'):
            existing_module.__all__ = []
        # Add to the __all__
        existing_module.__all__ += mymodule.__all__
        # Then add the tool functions
        for tool in mymodule.__all__:
            setattr(existing_module, tool,
                    getattr(mymodule, tool, None))
    # arcpy.X = mymodule
    else:
        setattr(arcpy, mymodule.__alias__, mymodule)
    return mymodule
