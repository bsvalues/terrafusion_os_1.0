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

import ast
import collections
import functools
import inspect
import keyword
import logging
import operator
import os
import pprint
import re
import sys
import types
import xml.etree.ElementTree

__all__ = ['inProcess', 'noisy', 'logcall', 'ArgAdaptor', 'listofnamedtuples',
           'getstartingpage', 'fetchautocomplete', 'py3_syntax_report']


def inProcess():
    """Checks if a script is running in process or not.
           Returns a boolean."""
    return ('GP_PROXY_OPS' not in os.environ)

def noisy():
    """Turns on the noisiest level of logging for the logging module."""
    logging.getLogger().setLevel(0)

def logcall():
    """Performs a logging.debug line with the current function stack's
       function name with arguments. Useful as a sort of inline tracing.
       Use noisy() to ensure the visibility of these logging calls."""
    logging.debug("%s%s" % (
        sys._getframe().f_back.f_code.co_name,
        inspect.formatargvalues(
            *inspect.getargvalues(
                sys._getframe().f_back
            )
        )
    ))

class ArgAdaptor:
    """Function call argument hook -- meant to allow for string
       mappings to integer values.

        Sample usage:

        class MappingConstants(ArgAdaptor):
            __args__ = {
                "format": {"pdf": 1,
                           "svg": 2,
                           "eps": 3
                          }
            }

        @MappingConstants.maskargs
        def exportToVector(filename, format=1):
            full_filename = "%s.%s" % (filename,
                                       {1: 'pdf', 2: 'svg', 3: 'eps'}[format])
            return _c_api.export(full_filename, format)

        Then instead of

        >>> exportToVector("c:\\hello", 2)

        you can call

        >>> exportToVector("c:\\hello", "svg")

        which is easier to understand when inspecting source, and then you can
        add/change literal values as needed without breaking other parts of
        the codebase.

        This function masker will also treat args that are recognized in the
        class as mappings as bitmasks if a collection (set, list, tuple) are
        passed in. For example:

        class BitMaskedFunction(ArgAdaptor):
            __args__ = { "permissions": {"read": 1, "write": 2, "execute": 4} }

        @BitMaskedFunction.maskargs
        def createfile(filename, permissions):
            return _c_api.touchfile(filename, permissions)

        A call to

        >>> createfile("hello.txt", ("read", "execute"))

        will call the function with the value of permissions set to 5
        (composed of 4 | 1).

        PLEASE NOTE: Any STRING value being passed through will be LOWERCASED
        (for case insensitivity reasons), so ensure any string keys are in
        lowercase in the __args__ definition.
    """
    __args__ = {}
    @classmethod
    def maskargs(cls, fn):
        """Wraps a function so arguments map to the name/value pairs specified in cls.__args__"""
        argnames, varargs, varkw, defaults, *_ = inspect.getfullargspec(fn)
        # Special case - get rid of 'self' which gets lost in binding
        is_method = False
        adjusted_argnames = argnames
        if argnames and argnames[0] == 'self' \
                and not isinstance(fn, (staticmethod, classmethod)):
            adjusted_argnames = argnames[1:]
        @functools.wraps(fn)
        def fn_(*a, **k):
            args = list(a)
            for idx, val in enumerate(args):
                if isinstance(val, str):
                    val = val.upper()
                if len(argnames) > idx and argnames[idx]:
                    mod_name = "%s.%s" % (fn.__name__, argnames[idx])
                    arg_name = mod_name if mod_name in cls.__args__ else argnames[idx]
                    if arg_name in cls.__args__:
                        if isinstance(val, (set, list, tuple)):
                            args[idx] = 0
                            for ival in val:
                                ivl = (ival.upper()
                                        if isinstance(ival, str)
                                        else ival)
                                if ivl in cls.__args__[arg_name] \
                                        and isinstance(ivl, str):
                                    val = cls.__args__[arg_name][ivl]
                                    if isinstance(ivl, (int, float)):
                                        args[idx] |= val
                                    else:
                                        if not isinstance(args[idx], str):
                                            args[idx] = val
                                        else:
                                            args[idx] += "," + val
                                elif isinstance(ivl, (int, float)):
                                    args[idx] |= ivl
                                else:
                                    raise ValueError(
                                            "Value %r not found in list" % ival)
                        elif val in cls.__args__[arg_name]:
                            args[idx] = cls.__args__[arg_name][val]
                        elif val not in list(cls.__args__[arg_name].values()):
                            raise ValueError(
                                    "Invalid value for %s: %r (choices are: %r)"
                                    % (arg_name, val,
                                       list(cls.__args__[
                                           arg_name].keys())))
            kw = k.copy()
            for key in list(kw.keys()):
                val = kw[key]
                if isinstance(val, str):
                    val = val.upper()
                if key in cls.__args__:
                    if isinstance(val, (set, list, tuple)):
                        kw[key] = 0
                        for ival in val:
                            if ival.upper() in cls.__args__[key]:
                                val = cls.__args__[key][ival.upper()]
                                if isinstance(val, (int, float)):
                                    kw[key] |= val
                                else:
                                    if not isinstance(kw[key], str):
                                        kw[key] = val
                                    else:
                                        kw[key] += "," + val
                            else:
                                raise ValueError("Value %r not found in list" %
                                                 ival)
                    elif val in cls.__args__[key]:
                        kw[key] = cls.__args__[key][val]
                    elif val not in list(cls.__args__[key].values()):
                        raise ValueError(
                                "Invalid value for %s: %r (choices are: %r)" %
                                (key, val, list(cls.__args__[key].values())))
            return fn(*args, **kw)
        # Add the old argspec to __doc__
        doc_addendum = "%s%s" % (fn.__name__, str(inspect.signature(fn)))
        needs_addendum = fn.__doc__ and not (fn.__name__+'('
                                             in fn.__doc__.strip()
                                                        .split('\n')[0])
        if fn_.__doc__ is None:
            fn_.__doc__ = doc_addendum
        elif needs_addendum:
            fn_.__doc__ = doc_addendum + "\n" + fn_.__doc__
        # functools.wraps doesn't cover __esri_toolinfo__,
        # copy manual or build one
        if hasattr(fn, '__esri_toolinfo__'):
            fn_.__esri_toolinfo__ = fn.__esri_toolinfo__
        else:
            # Build a default __esri_toolinfo__
            toolinfo = [""] * len(adjusted_argnames)
            for i, arg in enumerate(adjusted_argnames):
                farg = "%s.%s" % (fn.__name__, arg)
                if farg in cls.__args__:
                    toolinfo[i] = "String::%s:" % '|'.join(
                            list(cls.__args__[farg].keys()))
                elif arg in cls.__args__:
                    toolinfo[i] = "String::%s:" % '|'.join(
                            list(cls.__args__[arg].keys()))
            fn_.__esri_toolinfo__ = toolinfo
        return fn_
    @classmethod
    def maskmethods(cls, otherclass):
        "Mask the methods"
        new = {}
        # Find functions
        for name, value in list(otherclass.__dict__.items()):
            # Make decorated versions
            if callable(value) and not name.startswith("_"):
                new[name] = cls.maskargs(value)
        # Push decorated versions out
        for name, value in list(new.items()):
            setattr(otherclass, name, value)

WHITESPACE_RE = re.compile("^[ \t]*")
IDENTIFIER_RE_STRING = r"([a-z_][a-z_0-9]*(?:\s*[.]\s*[a-z_][a-z_0-9]*)*\.?)"
CALL_RE_STRING = IDENTIFIER_RE_STRING + " *[(]"
STRING_RE_STRING = '''("([^"]|\")*"|'([^']|\')*')'''
CLOSE_CALL_RE_STRING = "[)]"
IDENTIFIER_RE = re.compile(IDENTIFIER_RE_STRING,
                           re.IGNORECASE | re.MULTILINE)
CALL_RE = re.compile(CALL_RE_STRING, re.IGNORECASE)
STRING_RE = re.compile(STRING_RE_STRING)
CLOSE_CALL_RE = re.compile(CLOSE_CALL_RE_STRING)

SENTINEL = object()
ADDITIONAL_ITEMS = object()
KEYWORD = object()

class RASTER_SENTINEL:
    __esri_toolinfo__ = ["RasterLayer|RasterDataLayer|RasterDataset|"
                         "RasterBand|FormulatedRaster|MosaicLayer|MosaicDataset"
                         "::::"]

def _mergelines(lines, newline):
    if not lines:
        return [newline.rstrip()]
    else:
        last_line, next_line = lines[-1], newline
        wsa_ = WHITESPACE_RE.match(last_line)
        wsb_ = WHITESPACE_RE.match(next_line)
        wsa = wsa_.group() if wsa_ else ''
        wsb = wsb_.group() if wsb_ else ''
        if wsa == wsb and next_line.strip():
            return lines[:-1] + [lines[-1] + ' ' + next_line.lstrip()]
        else:
            return lines + [next_line.rstrip()]

def _fixedwhitespace(whitespacestring):
    if isinstance(whitespacestring, str):
        if isinstance(whitespacestring, str):
            try:
                whitespacestring = whitespacestring.decode("utf-8")
            except Exception as e:
                pass
        lines = whitespacestring.split("\n")
    else:
        lines = whitespacestring
    lines = [l.replace('\t', '    ') for l in lines]
    if len(lines) > 1:
        # Grab first non-blank line, use its leading whitespace as
        # standard for leading whitespace in subsequent lines
        allines = ([lines[lidx] for lidx in range(1, len(lines))
                               if lines[lidx].strip()]
                   or [''])
        whitespacematch = WHITESPACE_RE.match(allines[0])
        whitespacetostrip = (whitespacematch.group() if whitespacematch
                                                     else '')
        if whitespacetostrip:
            for index in range(1, len(lines)):
                if lines[index].startswith(whitespacetostrip):
                    lines[index] = lines[index][len(whitespacetostrip):]
    # _mergelines is an attempt to get rid of superfluous newlines
    # in wrapped paragraphs
    return "\n".join(functools.reduce(_mergelines, [None] + lines))

def _get_lines_with_prototype(doc_string):
    paren_index = doc_string.find(")")
    if paren_index != -1 and paren_index < len(doc_string) - 1:
        line_one = doc_string[:paren_index+1]
        rest = doc_string[paren_index+1:]
        line_one_unified = " ".join(line.strip() for line in line_one.split("\n"))
        if rest.startswith("\n"):
            rest = rest[1:]
        return [line_one_unified] + rest.split("\n")
    else:
        return doc_string.split('\n')

def reformat_doc_string(obj_tokens, object_of_interest, object_parent=None):
    object_to_fetch = ".".join(obj_tokens)
    if object_of_interest is not None:
        # For x.y, if x.__class__.y is a property, then use that doc string
        if object_parent and not isinstance(object_parent, types.ModuleType):
            parent_class = getattr(object_parent, '__class__', None)
            if parent_class:
                class_attr = getattr(parent_class, obj_tokens[-1], None)
                if class_attr and isinstance(class_attr, property):
                    if class_attr.__doc__:
                        return object_to_fetch + "\n" + class_attr.__doc__
        # Base types, do a nice representation
        if isinstance(object_of_interest, str):
            return repr(object_of_interest)
        elif isinstance(object_of_interest, (int, float,
                                             complex, dict, list,
                                             tuple)):
            return pprint.pformat(object_of_interest)
        elif object_of_interest in (int, float,
                                    complex, dict, list,
                                    tuple):
            return object_of_interest.__doc__
        # Things with an __init__
        elif isinstance(object_of_interest, type):
            constructor = getattr(object_of_interest, '__init__', None)
            if constructor:
                docstring = _fixedwhitespace(getattr(constructor, '__doc__', '') or
                                             getattr(object_of_interest, '__doc__', ''))
                # Fall back to .__class__.__doc__ if
                # .__class__.__init__.__doc__ is blank
                if not docstring:
                    docstring = _fixedwhitespace(
                            getattr(object_of_interest, '__doc__', None) or '')
                if ('see x.__class__.__doc__ for signature' in docstring or
                'see help(type(x)) for signature' in docstring or
                'See help(type(self)) for accurate signature.' in docstring):
                    docstring = getattr(object_of_interest, '__doc__', None) or ''
                if obj_tokens[-1] + "(" not in docstring.split('\n')[0]:
                    try:
                        spec = inspect.signature(constructor)
                        docstring = (object_to_fetch + str(spec)
                                     + "\n" + docstring)
                    except Exception as e:
                        pass
                return docstring
        # Methods/functions
        if isinstance(object_of_interest,
                (types.FunctionType, types.MethodType)):
            # Grab the doc
            docstring = getattr(object_of_interest, '__doc__',  None) or ''
            if isinstance(docstring, str):
                pass
            elif isinstance(docstring, str):
                try:
                    docstring = docstring.decode("utf-8")
                except Exception as e:
                    pass
            # Look to see if the first line looks like a prototype of this
            # function, if not, inject a first-line prototype into it
            firstline = docstring.split('\n')[0]
            if any(t not in firstline for t in (obj_tokens[-1], "(")):
                spec = inspect.signature(object_of_interest)
                docstring = (str(object_to_fetch + str(spec) + "\n") +
                             _fixedwhitespace(docstring))
            # Prototype included, treat first line separately from rest
            elif '\n' in docstring:
                fixed_lines = _get_lines_with_prototype(docstring)
                docstring = fixed_lines[0] + "\n" + _fixedwhitespace(fixed_lines[1:])
            return docstring
        # Common built-in constants
        elif object_of_interest in (True, False, None, Ellipsis):
            return str(object_of_interest)
        # Anything else
        docstring = _fixedwhitespace(getattr(object_of_interest, '__doc__',
                                             repr(object_of_interest))
                                                or '')
        if obj_tokens[-1] + "(" not in docstring.split('\n')[0]:
            docstring = object_to_fetch + "\n" + docstring
        return docstring

def fixdocstring(object_to_fetch, _builtins, _globals, _locals):
    "Function for ArcGIS desktop - fetches side-panel help for objects"
    try:
        # Drill down in builtins, globals, locals from x.y.z to figure out
        # where exactly the object is question is
        obj_tokens = [item.strip() for item in object_to_fetch.split('.')
                      if item.strip()]
        if not obj_tokens:
            return ""

        object_of_interest, object_parent = None, None

        t1 = obj_tokens[0]
        if t1 in _locals:
            object_of_interest = _locals[t1]
        elif t1 in _globals:
            object_of_interest = _globals[t1]
        elif t1 in _builtins:
            object_of_interest = _builtins[t1]
        else:
            return ""

        try:
            for token in obj_tokens[1:]:
                object_of_interest, object_parent = \
                        (getattr(object_of_interest, token),
                         object_of_interest)
        except Exception as e:
            return ""

        return reformat_doc_string(obj_tokens, object_of_interest, object_parent)
    except Exception as e:
        # Swallow error; side panel depends on getting back a blank string
        # when it is providing malformed input to this function to know it's
        # malformed.
        return ""
        #import traceback
        #return traceback.format_exc()

def _pick_names(part, name_list):
    name_list = list(name_list)
    if part in name_list:
        return [part]
    part_starts_with_underscore = part.startswith('_')
    candidates = []
    for name in name_list:
        if part_starts_with_underscore or not name.startswith('_'):
            if name.lower().startswith(part.lower()):
                candidates.append(name)
    return candidates

def find_autocomplete_candidates(code, string_index, var_dict):
    """Find automatic completion candidates for a string, given the namespace
       represented as a dictionary var_dict."""
    if not (code and string_index <= len(code) and isinstance(code, str)):
        return
    last_return = code[:string_index].rfind("\n")
    if last_return == -1:
        last_return = 0
    next_return = code[string_index:].find("\n") + string_index
    if next_return == (string_index - 1):
        next_return = len(code) + 1
    current_line = code[last_return:next_return].rstrip()

    # On an import line? Avoid giving help
    line_strip = current_line.strip()
    if line_strip.startswith('import ') or line_strip.startswith('from '):
        return

    # the getset_descriptor type isn't normally defined, but can be accessed from C types
    getset_descriptor = type(BaseException.args)

    for match in IDENTIFIER_RE.finditer(code):
        start_, end_, text_ = match.start(), match.end(), match.group()
        # Special case: don't treat "name" in pi[1].name as a variable name
        if start_ > 1 and code[start_ - 1] in "]).":
            pass
        elif start_ < string_index and end_ >= string_index:
            tail = string_index - start_
            identifier = text_[:tail]
            parts = [p.strip() for p in identifier.split('.')]
            new_candidates = [((i, j),) for (i, j)
                              in list(var_dict.items())
                              if i not in keyword.kwlist]
            try:
                if len(parts) == 1:
                    new_candidates += [((k, KEYWORD),)
                                       for k in keyword.kwlist]
            except Exception as e:
                pass
            candidates = []
            for part in parts:
                candidates = new_candidates
                acceptable_names = _pick_names(part, [c[-1][0]
                                                      for c in candidates])
                # Filter candidate objects based on name: start out
                # generous and get more strict if others match better
                candidates = [c for c in candidates
                              if c[-1][0] in acceptable_names]
                new_candidates = []
                # Iterate over possible drill-downable objects
                for candidate in candidates:
                    candidate_object = candidate[-1][1]
                    if candidate_object is SENTINEL:
                        continue
                    # Put up each child attribute on deck as a
                    # candidate for next lookup round
                    #for attrib in sorted(dir(candidate_object)):
                    for attrib in dir(candidate_object):
                        try:
                            class_attrib = getattr(type(candidate_object), attrib, None)
                            if class_attrib and isinstance(class_attrib, (property, getset_descriptor)):
                                new_object = class_attrib
                            else:
                                new_object = getattr(candidate_object,
                                                     attrib,
                                                     None)
                        except Exception as e:
                            new_object = SENTINEL
                        finally:
                            new_candidate = (candidate[:-1] +
                                             (
                                              (candidate[-1][0],
                                               None),
                                              (attrib, new_object)
                                             )
                                            )
                            new_candidates.append(new_candidate)
            # Group items by a common prefix if after a dot like in cursor
            # position arcpy.| (chucking XML over the wall to managed tier
            # isn't speedy; limit number of candidates when possible)
            if len(parts[-1].strip()) == 0 and len(candidates) > 2000:
                grouped_candidates = collections.defaultdict(list)
                for c in candidates:
                    key = c[-1][0][:2].upper()
                    grouped_candidates[key].append(c)
                candidates = []
                for key in grouped_candidates:
                    key_candidates = grouped_candidates[key]
                    if len(key_candidates) < 5:
                        candidates.extend(key_candidates)
                    else:
                        candidates.append(((str(len(key_candidates)), None),
                                           (key, ADDITIONAL_ITEMS)))

            # And limit to 128 max, which is still a huge number of items
            # for a list of autocomplete candidates
            #elif len(candidates) > 128:
            #    candidates = candidates[:128]

            # we can handle big list now
            candidates = sorted(candidates, key=lambda x: x[-1][0].lower())
            for c in candidates:
                text = ".".join(v[0] for v in c)
                candidate_object = c[-1][1]
                display_text = text.split('.')[-1]
                # Short-circuit if we have what we're already looking for
                if len(candidates) == 1 and text == text_:
                    return
                s = start_ - string_index
                e = end_ - string_index
                #if text.startswith(text_):
                #    text = text[len(text_):]
                #    s = 0
                cursor_offset = None
                info_text = candidate_object.__doc__ if hasattr(candidate_object, "__doc__") else None
                # Look up variable type for icons in app
                var_type = None
                if candidate_object is SENTINEL:
                    var_type = 'e' # Failed to fetch = error
                elif candidate_object is ADDITIONAL_ITEMS:
                    var_type = 'r'
                    text = c[1][0]
                    display_text = "{}... ({})".format(c[1][0], c[0][0])
                    s, e = 0, 0
                elif (len(c) == 1) and (candidate_object is KEYWORD):
                    var_type = 'k'
                elif callable(candidate_object):
                    if isinstance(candidate_object, type):
                        var_type = 'o' # Object with constructor
                    elif isinstance(candidate_object, types.MethodType):
                        var_type = 'm' # Bound method
                    else:
                        var_type = 'f' # Generic function
                        try:
                            a = getattr(candidate_object,
                                        '__esri_toolname__',
                                        None)
                            if a:
                                var_type = 't' # GP Tool
                                info_text = None
                        except Exception as e:
                            pass
                    display_text += "()"
                    text += "()"
                    cursor_offset = -1
                elif isinstance(candidate_object, types.ModuleType):
                    var_type = 'p' # "Package" or module
                    text += "."
                ret_var = {
                            's': str(s),
                            'e': str(e),
                            't': text,
                            'd': display_text
                          }
                # Optional attributes
                if info_text is not None:
                    ret_var['i'] = info_text
                # Is a cursor offset applied?
                if cursor_offset:
                    ret_var['o'] = str(cursor_offset)
                # Is there a specified variable type?
                if var_type:
                    ret_var['v'] = str(var_type)
                # Push along to app
                yield ret_var
        elif start_ > string_index:
            # Exhausted reachable matches
            return
    if False:
        yield

def _fetchvar(varname, var_dict):
    var_parts = [v.strip(' ()') for v in varname.split('.')]
    var = var_dict.get(var_parts[0], None)
    for part in var_parts[1:]:
        if var is not None:
            try:
                var = getattr(var, part)
            except Exception as e:
                var = None
    return (var_parts, var)

def in_index(string_index, start, end):
    if string_index >= start and string_index < end:
        return string_index - start
    return -1

def call_ranges(code, string_index):
    """Finds a list of what look like function calls in the currect text block
       that overlap with the current cursor position."""
    starts = {(match.start(), 1, match.group(1))
              for match in CALL_RE.finditer(code)}
    ends = {(match.start(), -1, match.group(0))
            for match in CLOSE_CALL_RE.finditer(code)}
    op_machine = sorted(starts | ends)
    range_stack = []
    ranges = []
    for start, bal, text in op_machine:
        if bal == 1:
            range_stack.append((start, text))
        elif bal == -1 and range_stack:
            block_start, block_text = range_stack.pop()
            ranges.append((block_start, start + len(text), block_text))
    for start, text in range_stack:
        ranges.append((start, len(code) + 1, text))
    ranges = [(text, start, end, code[start:end], in_index(string_index,
                                                           start, end))
              for start, end, text in ranges
              if start <= string_index and end >= string_index]
    return sorted(ranges, key=operator.itemgetter(1))

def function_call_in_context(code, string_index, var_dict):
    """Finds a reference to the current "function call" the code is currently
       in, given the code as a str object, the (zero-indexed) position of
       the cursor, and the flattened namespace represented in var_dict.

       Returns a tuple of the form ([list, of, string, tokens],
                                    reference_to_object)"""
    valid_ranges = call_ranges(code, string_index)
    if valid_ranges:
        last_range = valid_ranges[-1]
        return ((last_range[3], last_range[4]) +
                _fetchvar(last_range[0], var_dict))
    return ("", -1, [], None)

CALL_STACK_MAP = {
        '"': '"',
        "'": "'",
        '{': '}',
        '(': ')',
        '[': ']',
}

def split_call_string(call_string):
    skip = False
    stack = []
    last_index = 0

    for index in range(len(call_string)):
        if skip:
            skip = False
        else:
            char = call_string[index]
            if char == "\\":
                skip = True
                continue
            elif stack and char == stack[-1]:
                stack.pop()
            elif char in CALL_STACK_MAP:
                if not stack or stack[-1] not in ('"', "'"):
                    stack.append(CALL_STACK_MAP[char])
            elif char == "," and not stack:
                yield call_string[last_index:index]
                last_index = index + 1
    if last_index < len(call_string) + 1:
        yield call_string[last_index:]

def arg_index_for_call_string(call_string):
    if '(' in call_string:
        call_string = call_string[call_string.find('(') + 1:]
    args = list(split_call_string(call_string))
    selected_index = 0
    start_index = 0
    last_index = 0
    argname = None

    for arg_idx, arg in enumerate(args):
        start_index += last_index
        selected_index = arg_idx
        argname = None
        if '=' in arg:
            argname = arg[:arg.find('=')].strip()
        last_index = len(arg) + 1
    return (selected_index, argname, start_index)

def parse_spec(call_prototype):
    args = list(split_call_string(call_prototype))
    string_index = 0
    argct = 0
    arg_list = {}
    for arg_idx, arg in enumerate(args):
        candidates = []
        argct = arg_idx
        argname = arg.strip(" {}().")
        if '=' in arg:
            argname = arg[:arg.find('=')].strip()
        elif arg == '...':
            argname = '*'
        elif arg.startswith('**'):
            argname = '**'
        elif arg.startswith('*'):
            argname = '*'
        else:
            argct += 1
        #candidates.append({})
        new_tuple = (argname, string_index, len(arg), candidates)
        arg_list[arg_idx] = new_tuple
        arg_list[argname] = new_tuple
        string_index += len(arg) + 1
    arg_list['!arg_ct'] = argct
    return arg_list

def values_for_dropdown_function(args):
    retval = []
    for arg in split_call_string(args):
        try:
            retval.append(ast.literal_eval(arg.strip()))
        except Exception as e:
            retval.append(arg.strip())
    return tuple(retval)

def get_index_and_argvals_for_dropdown_call(call_string, index):
    # On a parameter boundary (",")
    if index < len(call_string) and call_string[index] == ',':
        return (-1, (), 0, 0)
    if '(' not in call_string:
        return (-1, (), 0, 0)
    paren_index = call_string.index('(')
    call_string = call_string[paren_index+1:]
    index -= paren_index
    if call_string.rstrip().endswith(')'):
        call_string = call_string[:call_string.rfind(')')]
    # Out of range
    if index < 0 or index > len(call_string) + 1:
        return (-1, (), 0, 0)
    string_index = 0
    for arg_no, arg in enumerate(split_call_string(call_string)):
        arg_lpad = len(arg) - len(arg.lstrip())
        if index >= string_index and index <= (string_index + arg_lpad + 1):
            start_index = (string_index - index) + 1
            end_index = (len(arg) + start_index)
            if end_index < 0:
                end_index = 0
            return (arg_no, values_for_dropdown_function(call_string),
                    start_index, end_index)
        string_index += len(arg) + 1
    return (-1, (), 0, 0)

def tool_popup_items(found_item, call_str, start_index):
    toolname = found_item.__esri_toolname__

    (param_index,
     param_vals,
     start_index,
     end_index) = get_index_and_argvals_for_dropdown_call(call_str,
                                                          start_index)
    if param_index != -1:
        import arcpy
        val = arcpy.gp._gp.getgptooldropdown(toolname, param_index, param_vals)
        if val:
            for displayname, text, valtype in val:
                yield {
                       's': str(start_index),
                       'e': str(end_index),
                       'd': displayname,
                       't': (' ' if param_index else '') + repr(text),
                       'v': valtype
                      }

def _fix_paraminfo_item(param_info_string):
    if not param_info_string:
        return None
    items = param_info_string.split(":")
    if not len(items) == 5:
        items = items[:5]
        items.extend([None] * (5 - len(items)))
    if items[3]:
        try:
            items[3] = int(items[3])
        except Exception as e:
            items[3] = None
    if items[4]:
        try:
            items[4] = int(items[4])
        except Exception as e:
            items[4] = None
    return tuple(items)

def tool_item_items(found_item, call_str, start_index):
    toolinfo = [_fix_paraminfo_item(p) for p in found_item.__esri_toolinfo__]
    if not any(toolinfo):
        return

    tool_name = getattr(found_item, '__esri_toolname__', None)

    (param_index,
     param_vals,
     start_index,
     end_index) = get_index_and_argvals_for_dropdown_call(call_str,
                                                          start_index)

    if param_index != -1:
        if not (toolinfo[param_index] or tool_name):
            # Optimization: don't bother at all for NULL-spec params
            return
        elif toolinfo[param_index][0] in ("String", "Python"):
            # Optimization: for string dropdowns don't go to validator routines
            need_repr = (toolinfo[param_index][0] != "Python")
            for item in sorted(toolinfo[param_index][2].split("|")):
                yield {
                       's': str(start_index),
                       'e': str(end_index),
                       'd': item,
                       't': (' ' if param_index else '') + (repr(item)
                                                            if need_repr
                                                            else item),
                       'v': 'o'
                      }
            return
        else:
            import arcpy
            val = arcpy.gp._gp.getgptooldropdown(toolinfo, param_index,
                                                 param_vals, tool_name)
            if val:
                for displayname, text, valtype in sorted(val):
                    yield {
                           's': str(start_index),
                           'e': str(end_index),
                           'd': displayname,
                           't': (' ' if param_index else '') + repr(text),
                           'v': valtype
                          }

def _fixline(line):
    line_state = []
    for token in line.strip().split():
        line_state.append(token)
        if sum(len(t) for t in line_state) > 65:
            yield " ".join(line_state)
            line_state = []
    if line_state:
        yield " ".join(line_state)

def _textwrap(text):
    """The textwrap module was being initially employed, but it wasn't
       customizable enough to make everyone happy. This method is dumb,
       but it works well enough to make everyone satisfied with its
       output."""
    return "\n".join("\n".join(_fixline(line))
                     for line in text.split('\n'))

def help_tip(call_str, call_index, obj_tokens, found_item, start_index):
    """Returns the plain text for the help tooltip in the Python window
       for the current function call. The Python window allows for
       non-overlapping, non-nested, HTML-like tags (<T>TEXT</T>) where T is:

           B: Bold
           I: Italic
           H: Highlighted
           S: Small
           R: Regular (non-monospaced) font
           U: Underline

       Tags can be <I>like this</I> or <SB>composed together</SB>"""
    # Dropdowns?
    candidates = []
    lines = (reformat_doc_string(obj_tokens, found_item) or "").split("\n", 1)
    # first line of help
    help_line = lines[0].strip().replace("(self)", "()").replace("(self,", "(")
    # Highlight **function_name**()
    final_help_line = help_line
    if '(' in help_line:
        fi = call_str.find('(')
        call_progress = call_str[fi + 1:call_index]

        help_fi = help_line.find('(')
        final_help_line = "<B>" + help_line[:help_fi] + "</B>"
        # Highlight function_name(...) **-> return type** and then find the
        # prototype (args) part of the line to highlight the current parameter
        if ')' in help_line[help_fi:]:
            help_fi2 = help_line.rfind(')') + 1
            prototype_section = help_line[help_fi + 1:help_fi2 - 1]

            if prototype_section:
                # Strip out supplied arguments in bound methods/classmethods
                # Yes, this assumes one always uses self/cls as the arg names
                # for them. Yes, there are corner cases where this will fail.
                # However, for the time being it's good enough.
                (arg_index,
                 arg_name,
                 start_context) = arg_index_for_call_string(call_progress)
                fn_info = parse_spec(prototype_section)
                if arg_index not in fn_info and arg_name is None:
                    arg_index = None
                    arg_name = '*'
                elif arg_name is not None:
                    arg_index = None
                    if arg_name not in fn_info:
                        arg_name = '**'
                arg_info = (None, 0, 0, [])
                if arg_index is not None:
                    arg_info = fn_info.get(arg_index, arg_info)
                else:
                    arg_info = fn_info.get(arg_name, arg_info)
                arg_name, start, arg_length, candidates = arg_info
                if arg_name is not None:
                    prototype_section = "{0}<BI>{1}</BI>{2}".format(
                            prototype_section[:start],
                            prototype_section[start:start + arg_length],
                            prototype_section[start + arg_length:])
            final_help_line += "({})".format(prototype_section)
            return_section = help_line[help_fi2:]
            if return_section.strip():
                final_help_line += "<IS>{}</IS>".format(return_section)
        else:
            final_help_line += help_line[help_fi:]
    # Look for autocomplete for tool data
    if hasattr(found_item, "__esri_toolinfo__"):
        for candidate in tool_item_items(found_item, call_str, call_index):
            candidates.append(candidate)
    elif hasattr(found_item, "__esri_toolname__"):
        for candidate in tool_popup_items(found_item, call_str, call_index):
            candidates.append(candidate)
    elif found_item.__name__ == "Raster":
        for candidate in tool_item_items(RASTER_SENTINEL, call_str, call_index):
            candidates.append(candidate)
    # return first line of help for arcpy.* members
    if hasattr(found_item, "__esri_toolname__"):
        wrapped_final_help_line = final_help_line
    else:
        wrapped_final_help_line = '\n'.join([final_help_line] + lines[1:])

    return (wrapped_final_help_line, candidates)

def find_autocomplete_xml(code, string_index, var_dict):
    """Return the XML equivalent of what find_autocomplete_candidates
       returns to forward to ArcGIS Desktop's Python window"""
    if not var_dict:
        return
    top_tag = xml.etree.ElementTree.Element("autocompletelookup")

    call_str, call_index, tokens, item = function_call_in_context(code,
                                                                  string_index,
                                                                  var_dict)

    # Tooltip? Perhaps some extra dropdown help?
    help_node = xml.etree.ElementTree.SubElement(top_tag, "help")
    try:
        help_node.text, candidates = help_tip(call_str, call_index, tokens, item, string_index)
    except Exception as e:
        help_node.text, candidates = '', []

    candidate_node = xml.etree.ElementTree.SubElement(top_tag, "candidates")
    if not candidates:
        candidates = find_autocomplete_candidates(code,
                                                  string_index,
                                                  var_dict)
    for item in candidates:
        xml.etree.ElementTree.SubElement(candidate_node, "c", item)

    # Encode/decode trick to ensure we're sending a str object
    return xml.etree.ElementTree.tostring(top_tag, "utf-8").decode("utf-8")

def fetchautocomplete(code, string_index):
    """Function for ArcGIS desktop - fetches autocomplete candidates for
       python window"""
    locals_dict = {}
    # Hack borrowed from logcall: grab caller's variable states and merge them
    back_frame = sys._getframe().f_back
    if back_frame is not None:
        locals_dict.update(getattr(back_frame, 'f_builtins', {}))
        locals_dict.update(getattr(back_frame, 'f_globals', {}))
        locals_dict.update(getattr(back_frame, 'f_locals', {}))
    return find_autocomplete_xml(code, string_index, locals_dict)

def listofnamedtuples(list_of_dicts, tuple_name=''):
    """Return a list of named tuples from a list of dicts
       (for gp.ListUsers)"""
    columns = sorted(
                functools.reduce(
                    operator.or_,
                    (set(dictionary)
                         for dictionary in list_of_dicts),
                    set()))
    tuple_type = collections.namedtuple(tuple_name, columns)
    return [tuple_type(*(dictionary.get(key, None)
                                for key in columns))
                                    for dictionary in list_of_dicts]

PRG_RE = re.compile("(-?[0-9]+([.][0-9]+)?)( *- *-?[0-9.]+([.][0-9]+)?)?")

def getstartingpage(page_range_string):
    "Get the first specified number in a string like 5-10,11,12"
    all_pages = PRG_RE.findall(page_range_string)
    range_list = [(int(start_page), int(end_page[1:]) if end_page else None)
                  for start_page, _, end_page, _ in all_pages]
    return min(p[0] for p in range_list)

ALL_FIX_NAMES = None
REFACTORING_TOOL = None

def get_all_fix_names():
    """Return a sorted list of all available fix names in the given package.
       Modified from get_all_fix_names implementation in Python's stdlib to
       look at .pyc and .pyo files as well."""
    global ALL_FIX_NAMES

    if ALL_FIX_NAMES is None:
        import lib2to3.fixes
        fixer_dir = os.path.dirname(lib2to3.fixes.__file__)
        fix_names = []
        for name in sorted(os.listdir(fixer_dir)):
            fn, suffix = os.path.splitext(name)
            if fn.startswith("fix_") and suffix.lower() in (".py",
                                                            ".pyc",
                                                            ".pyo"):
                fn = fn[4:]
                fix_names.append(fn)
        ALL_FIX_NAMES = sorted(set(fix_names))
    return ALL_FIX_NAMES

def code_to_python_3(code_block, filename):
    """Python 2 goes in, Python 3 comes out."""
    global REFACTORING_TOOL

    if REFACTORING_TOOL is None:
        import lib2to3
        import lib2to3.refactor

        all_fixes = ["lib2to3.fixes.fix_{}".format(l)
                     for l in get_all_fix_names()]
        REFACTORING_TOOL = lib2to3.refactor.RefactoringTool(all_fixes,
                                             options={'print_function': False})
    # + "\n" to make it parse, then [:-1] to chop off tacked-on \n
    return str(REFACTORING_TOOL.refactor_string(code_block + "\n",
                                                    filename))[:-1]

def code_diff_report(python_source, new_source, filename):
    """Helper function for py3_syntax_report: turn a difflib-generated diff
       between two scripts into an intelligible report"""
    import difflib

    line_commentary = []
    line_changes = {}
    line_number = 1

    for line in difflib.ndiff(python_source.split("\n"),
                              new_source.split("\n")):
        state = line[0]
        line_text = line[2:].rstrip()

        if state == " ":
            line_number += 1
        elif state == "+":
            if line_number in line_changes:
                line_change = line_changes[line_number]
                change_text = "Line {}: {} -> {}".format(line_number,
                                                         line_change,
                                                         line_text)
                line_commentary.append(change_text)
                del line_changes[line_number]
            else:
                change_text = "Line {}: {}".format(line_number, line_text)
            line_number += 1
        elif state == "-":
            line_changes[line_number] = line_text
        elif state == "?":
            pass
    return "\n".join(line_commentary)

def py3_syntax_report(python_source, filename="<script>"):
    "Return a report on Python 3 compatibility"
    # Assume UTF-8 if we don't have str
    if not isinstance(python_source, str):
        python_source = python_source.decode("utf-8")
    python_source = python_source.replace("\r\n", "\n")
    new_source = code_to_python_3(python_source, filename)
    if python_source == new_source:
        return "Python 3 OK"
    elif python_source and not new_source:
        return "Syntax Error in Python 2"
    else:
        return code_diff_report(python_source, new_source, filename)
