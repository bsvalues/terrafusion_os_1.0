import ast
import io
import json
import codecs
import textwrap
import platform
import os, sys

class DocInjector:
    def __init__(self, filename):
        self._filename = filename
        self._lines = [line.rstrip() for line in open(filename, 'r')]
        self._ast = ast.parse(open(filename, 'rb').read(), filename, 'exec')
        self._data = json.load(open("arcpy_mp_json.json", 'r'))
        self._doclines = dict() # lineno : (docstring, endline)
        self._find_functions(self._ast)

    def _find_functions(self, ast_node):
        # build the doclines dictionary from functions
        for node in ast_node.body:
            if isinstance(node, ast.ClassDef) and node.name != "constants":
                # fetch class info from json
                c_dict = [value for value in self._data['esri_arcpyclasses'] if value['esri_classname'] == node.name]
                if len(c_dict) <= 0: continue
                c_dict = c_dict[0]

                methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]
                for method in methods:
                    # fetch function info from json
                    f_dict = [f for f in c_dict['esri_arcpymethodrefs'] if f['esri_funname'] == method.name]
                    if len(f_dict) <= 0: continue
                    f_dict = f_dict[0]

                    new_docstring = self._make_new_docstring(node.name, method.name, f_dict)
                    curr_docstring = ast.get_docstring(method)
                    if isinstance(method.body[0], ast.Expr) and isinstance(method.body[0].value, ast.Str) and curr_docstring:
                        self._doclines[int(method.body[0].lineno)-1] = (new_docstring, method.body[0].end_lineno - 1)

    def _make_new_docstring(self, class_name, method_name, f_dict):
        f_desc = f_dict['esri_summary']
        new_docstring = "%s.%s(" % (class_name, method_name)
        #add parameters to first line
        length = len(f_dict['arguments'])-1
        for i, arg in enumerate(f_dict['arguments']):
            if arg['esri_isOptional']:
                new_docstring += "{%s}%s" % (arg['esri_argname'], (", " if i != length else ""))
            else:
                new_docstring += "%s%s" % (arg['esri_argname'], (", " if i != length else ""))

        new_docstring += ")\n\n\n%s\n\n\n" % (f_desc)
        new_docstring += self._param_text(f_dict['arguments'])

        return ("\r\n".join(self._format_docstring(new_docstring)) + "\r\n")

    def _param_text(self, arg_list):
        return_string = ""
        for i, param in enumerate(arg_list):
            argname =  param['esri_argname']
            datatype = param['esri_datatype']
            description = param['esri_desc']
            default_val = ""
            if 'esri_argdefaultval' in list(param.keys()):
                default_val = (" The default value is %s." % param['esri_argdefaultval'])

            datatype_str = ""
            if datatype:
                if param['esri_isOptional']:
                    datatype_str = "{%s}" % datatype
                else:
                    datatype_str = "(%s)" % datatype

            return_string += "%s%s:\n%s%s\n" % (argname, datatype_str, description, default_val)

            if len(param['enum']) != 0:
                # add the enum values descriptions
                for e in list(param['enum'].values()):
                    return_string += "\n* %s: %s\n" % (e['name'], e['description'])

            if i != (len(arg_list)-1):
                return_string += "\n\n"

        return return_string

    def _format_docstring(self, docstring):
        doclines = []
        for line in docstring.split("\n"):
            if line == "":
                doclines.append("\r\n")
            else:
                doclines.extend(textwrap.wrap(line, width=72, replace_whitespace=True))
        if doclines:
            while not doclines[-1].strip():
                doclines.pop()
        for lineindex, linetext in enumerate(doclines):
            yield "{}{}{}{}".format(' '*8 if linetext.strip() else '',
                                    '"""' if lineindex == 0
                                          else '',
                                    linetext if linetext.strip() else '',
                                    '\r\n        """' if lineindex == len(doclines) - 1
                                        else '')
    def _fixed_source(self):
        write_docstring = False
        tmp_file = os.path.splitext(self._filename)[0] + "_TEMP.py"
        file = open(tmp_file, 'wb')
        endline = len(self._lines)
        for lineno, line in enumerate(self._lines):
            # iterate through each line of filename and replace the docstrings
            if lineno in list(self._doclines.keys()):
                write_docstring = True
                doc, endline = self._doclines[lineno]
                file.write(doc.encode('utf-8')) # write the docstring
            if not write_docstring:
                line += "\r\n"
                file.write(line.encode('utf-8')) # write normal line
            if lineno == endline:
                write_docstring = False
        file.close()
        return tmp_file

    def save(self):
        orig_file = os.path.splitext(self._filename)[0] + "_ORIG.py"
        tmp_file = self._fixed_source()
        # check if valid file
        try:
            ast.parse(open(tmp_file, 'rb').read(), tmp_file, 'exec') # try to compile file
        except Exception as e:
            print("Error in new file. Operation stopped.")
            raise
        os.rename(self._filename, orig_file) # rename old file with _ORIG.py suffix (remove later)
        os.rename(tmp_file, self._filename) # rename tmp_file to original file name (remove later)
        '''
        # overwrite original file
        if platform.system() == 'Windows':
            os.remove(self._filename) if os.path.isfile(self._filename) else None
            os.rename(tmp_file, self._filename)
        else:
            os.rename(tmp_file, self._filename)
        '''

if __name__ == "__main__":
    relpath = os.path.dirname(os.path.dirname(sys.argv[0]))
    all_files = []
    all_files.append(os.path.join(relpath, "_mp.py"))
    all_files.append(os.path.join(relpath, "_symbology.py"))
    all_files.append(os.path.join(relpath, "_renderer.py"))
    print(all_files)

    for file in all_files:
        d = DocInjector(file)
        d.save()
