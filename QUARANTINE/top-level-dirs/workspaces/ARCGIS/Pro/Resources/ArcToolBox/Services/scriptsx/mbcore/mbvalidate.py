"""Model builder's validate logic definition"""
import os
from typing import List, Tuple, Dict, Optional, Union
from abc import ABC, abstractmethod
import json
import copy
import uuid

import arcpy
import arcpy.management

from common import GPMessageHandler, MsgCategory, PAOutputName, PAEnvironment, ToolExit, DescribeOutput


class ValidateUtilMixin:
    FIELD_TYPES = ["Blob", "Date", "Double", "Geometry",
                   "GlobalID", "Guid", "Integer", "OID",
                   "Raster", "Single", "SmallInteger",
                   "String", "DateOnly", "TimeOnly",
                   "TimestampOffset", "BigInteger"]
    
    @classmethod
    def create_field(cls, field_type: str, field_name: str, field_alias: str = "") -> arcpy.Field:
        """Create an arcpy.Field object from field properties.

        Args:
            field_type (str): type of the field.
            field_name (str): name of the field.
            field_alias (str, optional): aliasName of the field. Defaults to "".

        Raises:
            RuntimeError: if the field_type specified is not a valid field type.

        Returns:
            arcpy.Field: an instance of arcpy.Field.
        """
        if field_type not in cls.FIELD_TYPES:
            raise RuntimeError(f"Unsupported field type: {field_type}")
        field = arcpy.Field()
        field.name = field_name
        field.aliasName = field_alias if field_alias.strip() else field_name
        field.type = field_type
        return field
    
    @classmethod
    def copy_field(cls, field: arcpy.Field) -> arcpy.Field:
        """Make a deep copy of the existing field.

        Args:
            field (arcpy.Field): field to copy from.

        Returns:
            arcpy.Field: copy of the existing field.
        """
        new_fld = arcpy.Field()
        (new_fld.name, new_fld.aliasName, new_fld.type) = (field.name, field.aliasName, field.type)
        return new_fld

    @classmethod
    def add_field(cls, fields: List[arcpy.Field], fld2add: arcpy.Field):
        """Add field to an existing list of fields.

        Args:
            fields (List[arcpy.Field]): a list of fields to add to.
            fld2add (arcpy.Field): an instance of arcpy.Field to add to the list.
        """
        oid_field = None
        shp_field = None
        gid_field = None
        existing_fields = []
        for f in fields:
            if f.type == "OID":
                oid_field = f.name
            elif f.type == "Geometry":
                shp_field = f.name
            elif f.type == "GlobalID":
                gid_field = f.name
            existing_fields.append(f.name.lower())

        if (
            oid_field and fld2add.type == "OID"
            or (shp_field and fld2add.type == "Geometry")
            or (gid_field and fld2add.type == "GlobalID")
        ):
            return

        if fld2add.name.lower() not in existing_fields:
            fields.append(fld2add)
        else:
            idx = 1
            new_name = f"{fld2add.name}_{idx}"
            while new_name.lower() in existing_fields:
                idx += 1
                new_name = f"{fld2add.name}_{idx}"
            new_fld = cls.create_field(fld2add.type, new_name, fld2add.aliasName)
            fields.append(new_fld)
    
    @classmethod
    def is_value_in(cls, filter_list: List[str], value: str, case_sensitive: bool = False) -> bool:
        """check if a certain value is in the list or not.

        Args:
            filter_list (List[str]): a list with the value to check against.
            value (str): the value to check if it exists in the list.
            case_sensitive (bool, optional): True to compare in a case sensitive way and
            False otherwise. Defaults to False.

        Returns:
            bool: True if the value is in the filter_list and False otherwise.
        """
        for fval in filter_list:
            if case_sensitive and fval == value:
                return True
            elif not case_sensitive and fval.lower() == value.lower():
                return True
        return False

    @classmethod
    def parse_gp_msg(cls, msg: str) -> Optional[Tuple[int, str]]:
        """Parse a raw message with information of message number anf message content.

        Args:
            msg (str): a raw message from GP (i.e., ERROR 000800  The value is not a member
            of Full | Left | Right | Outside.)

        Returns:
            Optional[Tuple[int, str]]: message with interested information peeled off. None, if
            the raw message is not properly formatted. (message number<int>, message content<str>)
            is returned if parsed successfully.
        """
        if msg.lower().startswith("error") or msg.lower().startswith("warning"):
            start_idx = len("error") if msg.lower().startswith("error") else len("warning")
            msg_numb = []
            end_idx = start_idx
            for i in range(start_idx - 1, len(msg)):
                if msg[i].isnumeric():
                    msg_numb.append(msg[i])
                elif msg_numb and not msg[i].isnumeric() and msg[i] not in [":", " "]:
                    end_idx = i
                    break
            if not msg_numb:
                return None
            return (int("".join(msg_numb)), msg[end_idx::].strip())

        return None

    @classmethod
    def gp_msg_to_ao(cls, gp_msg: Tuple[int, str], mb_local_msgs: Dict) -> Dict:
        """Convert GP format message to ArcGIS online format.

        Args:
            gp_msg (Tuple[int, str]): formatted GP message with the message number and content.
            mb_local_msgs (Dict): localized messages for model builder.

        Raises:
            ValueError: if the template message from the localized messages is not in right format.

        Returns:
            Dict: message in ArcGIS online format.
        """
        gp_msg_code = f"GP_{gp_msg[0]}"
        if gp_msg_code in mb_local_msgs:
            msg_template = mb_local_msgs[gp_msg_code]
            if '{' in msg_template and '}' in msg_template:
                raw_msg = f"{gp_msg[1]}." if not gp_msg[1].endswith(".") and msg_template.endswith(".") else gp_msg[1]
                param_names = []
                param_st_idx = []
                param_end_idx = []
                param_start = False
                tmp_name = []
                for i, chr in enumerate(msg_template):
                    if chr == '{':
                        param_st_idx.append(i)
                        param_start = True
                        tmp_name = []
                    elif chr == '}':
                        param_end_idx.append(i)
                        param_start = False
                        param_names.append("".join(tmp_name))
                        tmp_name = []
                    elif param_start:
                        tmp_name.append(chr)

                # parameter is not properly enclosed
                if param_start:
                    raise ValueError("Unable to format {gp_msg[0]} as the template message is invalid.")
                
                params = {}
                for i in range(len(param_names)):
                    param_val_st_idx = 0
                    prev_end = 0 if i == 0 else param_end_idx[i - 1]
                    str_len = param_st_idx[i] - prev_end - 1
                    for j in range(str_len, len(raw_msg)):
                        if msg_template[prev_end + 1: param_st_idx[i]] == raw_msg[j - str_len: j]:
                            param_val_st_idx = j
                            break

                    param_val_end_idx = 0
                    later_end = len(msg_template) if i == len(param_names) - 1 else param_st_idx[i + 1]
                    str_len = later_end - param_end_idx[i] - 1
                    for j in range(param_val_st_idx, len(raw_msg)):
                        if msg_template[param_end_idx[i] + 1: later_end] == raw_msg[j : j + str_len]:
                            param_val_end_idx = j
                            break
                    params[param_names[i]] = raw_msg[param_val_st_idx: param_val_end_idx]
                return {"messageCode": gp_msg_code, "message": raw_msg, "params": params}
            else:
                return {"messageCode": gp_msg_code, "message": gp_msg[1]}
        else:
            # return the message as it is as message interpolation currently does
            # not support un-localized message.
            return {"messageCode": gp_msg_code, "message": gp_msg[1]}

    @classmethod
    def init_out_fields(cls, is_tbl: bool = False) -> List[arcpy.Field]:
        """initialize the default fields for output.

        Args:
            is_tbl (bool, optional): True to create default fields for table
            and False for feature class. Defaults to False.

        Returns:
            List[arcpy.Field]: a list of arcpy.Field initialized.
        """
        out_fields = []
        oid_fld = arcpy.Field()
        (oid_fld.name, oid_fld.aliasName, oid_fld.type) = ("objectid", "objectid", "OID")
        out_fields.append(oid_fld)
        if not is_tbl:
            geom_fld = arcpy.Field()
            (geom_fld.name, geom_fld.aliasName, geom_fld.type) = ("Shape", "Shape", "Geometry")
            out_fields.append(geom_fld)
        return out_fields
    
    @classmethod
    def init_output_path(cls, ouptut_prefix: str) -> str:
        """Initialize a path to keep the output.

        Args:
            ouptut_prefix (str): prefix for the output.

        Returns:
            str: absolute path of the potential output.
        """
        wkspc = arcpy.env.workspace if getattr(arcpy.env, "workspace") else arcpy.env.scratchGDB
        return os.path.join(wkspc, f"{ouptut_prefix}_{uuid.uuid4().hex}")

    @classmethod
    def enable_parameters(
        cls,
        p2e: List[Optional[arcpy.Parameter]] = [],
        p2d: List[Optional[arcpy.Parameter]]= []):
        """ enable and disable list of parameters
        """
        for p in p2e:
            if p is not None:
                p.enabled = True
        for p in p2d:
            if p is not None:
                p.enabled = False
    
    @classmethod
    def clear_parameter(cls, parameter: arcpy.Parameter):
        parameter.enabled = False
        parameter.value = None


class MBToolValidator(ValidateUtilMixin, ABC):
    """Class for validating a model builder tool's parameter values and controlling
    the behavior of the tool's dialog."""
    MSG_PREF = "AO_"

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params: List[arcpy.Parameter] = arcpy.GetParameterInfo()
        self._msgs: Optional[Dict] = None
    
    @property
    def messages(self) -> Dict:
        if not self._msgs:
            self._msgs = GPMessageHandler().errors
        return self._msgs

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        self._update_msg()
        self.convert_gp_msg()

    @abstractmethod
    def _update_msg(self):
        pass

    def validate_output_param(self, opname_idx: int):
        try:
            if self.params[opname_idx].value:
                op_val = json.loads(self.params[opname_idx].value)
                _ = PAOutputName(op_val, PAEnvironment.MODELBUILDER, validate_only=True)
        except ToolExit as err:
            self.params[opname_idx].setErrorMessage(str(err))
        except ValueError:
            self.set_msg(True, opname_idx, 100055)

    def _format_msg(self, msg_code: str, params: Optional[Dict]=None) -> str:
        """Get the formatted error/warning message.

        Args:
            msg_code (str): message code.
            params (Optional[Dict], optional): parameters associated with the message.
            Defaults to None.

        Returns:
            str: formatted message.
        """
        if msg_code not in self.messages:
            self.params[0].setErrorMessage(f"unable to find {msg_code}.")

        msg_template = copy.deepcopy(self.messages[msg_code])
        if params:
            for pname, pval in params.items():
                if pname not in msg_template:
                    self.params[0].setErrorMessage(f"No parameter named {pname} in message: {msg_template}")
                else:
                    msg_template = msg_template.replace(f"{{{pname}}}", pval)
            return json.dumps({"messageCode": msg_code, "message": msg_template, "params": params})
        return json.dumps({"messageCode": msg_code, "message": msg_template})

    def set_msg(self, is_error: bool, param_idx: int, msg_numb: Union[int, str],
                params: Optional[Dict] = None,
                category: MsgCategory = MsgCategory.AO):
        """set the error or warning message for a certain parameter.

        Args:
            is_error (bool): True to set error message and False to set warning message.
            param_idx (int): index of the parameter to set the message on.
            msg_numb (int): error/warning message number.
            params (Optional[Dict], optional): parameters associated with the message. Defaults to None.
            prefix (Optional[str], optional): prefix of the message code. This allows using other customized
            messages.
        """
        if category == MsgCategory.AO:
            msg_code = f"AO_{msg_numb}"
        elif category == MsgCategory.GE:
            msg_code = f"GPEXT_{msg_numb}"
        elif category == MsgCategory.GP:
            msg_code = f"GP_{msg_numb}"
        else:
            msg_code = f"{self.MSG_PREF}{msg_numb}"

        if is_error:
            self.params[param_idx].setErrorMessage(self._format_msg(msg_code, params))
        else:
            self.params[param_idx].setWarningMessage(self._format_msg(msg_code, params))

    def convert_gp_msg(self):
        """Convert message in GP format to Arcgis online format."""        
        for param in self.params:
            if param.hasError() or param.hasWarning():
                is_warning = False if param.hasError() else True
                # check if it is in AO format
                if "messageCode" not in param.message:
                    gp_msg = self.parse_gp_msg(param.message)
                    # if param.message is not a properly formatted GP message, leave it as it is
                    if gp_msg:
                        ao_format_msg = self.gp_msg_to_ao(gp_msg, self.messages)
                        if isinstance(ao_format_msg, dict):
                            param.clearMessage()
                            if is_warning:
                                param.setWarningMessage(json.dumps(ao_format_msg))
                            else:
                                param.setErrorMessage(json.dumps(ao_format_msg))

    def set_out_schema(
        self,
        param_idx: int,
        additional_flds: Optional[List[arcpy.Field]] = None,
        feat_type: Optional[str] = None,
        geom_type: Optional[str] = None
    ):
        """Set the schema of the output parameter.

        Args:
            param_idx (int): index of the output parameter.
            additional_flds (Optional[List[arcpy.Field]], optional): additional fields of the output. Defaults to None.
            feat_type (Optional[str], optional): feature type of the output. Defaults to None.
            geom_type (Optional[str], optional): geometry type of the output. Defaults to None.
        """
        if additional_flds:
            self.params[param_idx].schema.additionalFields = additional_flds
        
        if feat_type:
            self.params[param_idx].schema.featureTypeRule = "AsSpecified"
            self.params[param_idx].schema.featureType = feat_type
        
        if geom_type:
            self.params[param_idx].schema.geometryTypeRule = "AsSpecified"
            self.params[param_idx].schema.geometryType = geom_type

    def set_par_dep_rules(
        self,
        param_idx: int,
        dep_idx: int,
        field_rule: str,
        feat_type_rule: Optional[str]=None,
        geom_type_rule: Optional[str]=None
    ):
        """Set the dependency rules between the output and the input.

        Args:
            param_idx (int): index of the output parameter.
            dep_idx (int): index of the input parameter.
            field_rule (str): fieldsRule of dependency.
            feat_type_rule (Optional[str], optional): featureTypeRule of dependency. Defaults to None.
            geom_type_rule (Optional[str], optional): geometryTypeRule of dependency. Defaults to None.
        """
        if feat_type_rule:
            self.params[param_idx].schema.featureTypeRule = feat_type_rule
        if geom_type_rule:
            self.params[param_idx].schema.geometryTypeRule = geom_type_rule
        # fieldsRule as None will not keep the original ObjectID content as a separate field in output
        # AllFIDsOnly will have a seperate column starts with FID_ to keep the content of the original
        # ObjectID.
        self.params[param_idx].schema.fieldsRule = field_rule
        self.params[param_idx].parameterDependencies = [self.params[dep_idx].name]
    
    def set_param_dep(
        self,
        param_idx: int,
        dep_idxes: List[int]
    ):
        """Set the parameter's dependencies

        Args:
            param_idx (int): index of the parameter to set dependencies upon.
            dep_idxes (List[int]): index of the dependent parameters.
        """
        self.params[param_idx].parameterDependencies = [self.params[i].name for i in dep_idxes]
    
    def set_filter(
        self,
        param_idx: int,
        filter: List
    ):
        """Set the filter of a parameter.

        Args:
            param_idx (int): index of the parameter.
            filter (List): value of the parameter's filter.
        """
        if self.params[param_idx].filter is None or self.params[param_idx].filter.list is None:
            self.params[param_idx].setErrorMessage(f"Filter of parameter {param_idx} has not been initialized.")
        else:
            self.params[param_idx].filter.list = filter

    def validate_summary_table(self, st_param_idx: int, desc: Optional[DescribeOutput]):
        """validate the summary table.

        Args:
            st_param_idx (int): the index of the summaryFields value table.
            desc (Optional[desc]): an instance of DescribeOutput which contains
            the fields information. We'll have to carry over this from
            the layer that feed this summaryTable as the GPField parameter's value
            is a arcpy.Value object instead of arcpy.Field which does not have the
            field type.
        """
        if not desc:
            return

        flds_info = {fld.name: fld.type for fld in desc.fields}
        if self.params[st_param_idx].value:
            for row in self.params[st_param_idx].value:
                if row[1] and row[1].lower() not in ["min", "max"]:
                    fname = row[0] if isinstance(row[0], str) else str(row[0])
                    if (
                        fname in flds_info
                        and flds_info[fname] in ["DateOnly", "TimeOnly", "TimestampOffset", "Date"]
                    ):
                        self.set_msg(True, st_param_idx, 100006, {"summary": row[1], "fieldName": fname})
