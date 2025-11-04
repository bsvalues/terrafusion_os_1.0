import os
import pathlib
from typing import Iterator, TYPE_CHECKING

import arcpy

if TYPE_CHECKING:
    from arcpy.typing.describe import GDBTable


class AttachmentsDisabled(Exception):
    pass


class NoNameFields(Exception):
    pass


class NoAttachments(Exception):
    pass


class ExportAttachments:
    ORIGINAL = "ORIGINAL"
    REPLACE = "REPLACE"
    PREFIX = "PREFIX"
    SUFFIX = "SUFFIX"

    def __init__(
        self,
        table: str,
        folder: str,
        directory_field: str = None,
        name_format: str = "ORIGINAL",
        name_fields: list[str] = None,
    ):
        self.table = table
        self.folder = pathlib.Path(folder)
        self.dir_field = directory_field
        self.format = name_format
        self.fields: list[str] = [] if self.format == self.ORIGINAL else (name_fields or [])

        self.rc = self.validate()
        self.export_count = 0

    def validate(self) -> str | None:
        if not self.fields and self.format != self.ORIGINAL:
            raise NoNameFields

        # There can be multiple relationship classes, find the attachment RC.
        table_desc = arcpy.Describe(self.table, "Table")
        if table_desc.path.casefold().startswith("http"):
            self.export_services(table_desc)
            return

        gdb = table_desc.workspace.catalogPath
        for rc_name in getattr(table_desc, "relationshipClassNames", []):
            rc_desc = arcpy.Describe(os.path.join(gdb, rc_name), "RelationshipClass")
            if getattr(rc_desc, "isAttachmentRelationship", False):
                break
        else:
            raise AttachmentsDisabled

        # Ensure there is at least 1 entry in attachment table.
        attachment = os.path.join(gdb, rc_desc.destinationClassNames[0])
        with arcpy.da.SearchCursor(attachment, "OID@") as cursor:
            try:
                next(cursor)
            except StopIteration:
                raise NoAttachments

        return rc_desc.catalogPath

    def generate_field_mappings(self, oid_in: str, oid_out: str) -> arcpy.FieldMappings:
        """Creates FieldMappings to load a subset of fields from services"""

        fms = arcpy.FieldMappings()

        # Map OID field to Big Int.
        oid = arcpy.FieldMap()
        oid.addInputField(self.table, oid_in)
        out_field = oid.outputField
        out_field.name = out_field.aliasName = oid_out
        out_field.type = "BigInteger"
        oid.outputField = out_field
        fms.addFieldMap(oid)

        # Bring over any other fields needed for output naming.
        for field in [*self.fields, self.dir_field]:
            if field is None or field.casefold() == oid_in:
                continue
            fm = arcpy.FieldMap()
            fm.addInputField(self.table, field)
            fms.addFieldMap(fm)

        return fms

    def export_services(self, describe: "GDBTable"):
        import uuid

        gdb = arcpy.CreateFileGDB_management(arcpy.env.scratchFolder, f"Attach_{uuid.uuid4().hex}")[0]

        oid = describe.OIDFieldName.casefold()
        new_field = f"f_{uuid.uuid4().hex}"
        fms = self.generate_field_mappings(oid, new_field)

        # Replace OID field with new field.
        fields = [f.casefold() for f in self.fields]
        dir_field = None if self.dir_field is None else self.dir_field.casefold()
        if oid in fields:
            fields[fields.index(oid)] = new_field
        if oid == dir_field:
            dir_field = new_field

        with arcpy.EnvManager(maintainAttachments=True):
            new_table = arcpy.ExportTable_conversion(
                in_table=self.table,
                out_table=os.path.join(gdb, "data"),
                field_mapping=fms,
            )[0]

        ExportAttachments(
            table=new_table,
            folder=self.folder.as_posix(),
            directory_field=dir_field,
            name_format=self.format,
            name_fields=fields,
        ).export()

        try:
            arcpy.ClearWorkspaceCache_management(gdb)
            arcpy.Delete_management(gdb)
        except Exception:
            pass

    def search(self) -> Iterator[tuple[tuple, tuple[str, memoryview]]]:
        from itertools import islice

        desc = arcpy.Describe(self.rc, "RelationshipClass")
        attachment = os.path.join(desc.workspace.catalogPath, desc.destinationClassNames[0])
        pk_field = desc.originClassKeys[0][0]
        fk_field = desc.originClassKeys[1][0]

        origin = []
        if self.dir_field:
            origin.append(self.dir_field)
        if self.fields:
            origin.extend(self.fields)

        num = 1_000
        with arcpy.da.SearchCursor(self.table, [pk_field, *origin]) as table_cursor:
            while True:
                # Read num records from cursor to build lookup.
                if self.dir_field:
                    lookup = {k: rest for k, *rest in islice(table_cursor, num)}
                else:
                    lookup = {k: ("", *rest) for k, *rest in islice(table_cursor, num)}
                if not lookup:
                    break

                in_clause = ",".join(map(repr, lookup.keys()))

                with arcpy.da.SearchCursor(
                    attachment,
                    [fk_field, "ATT_NAME", "DATA"],
                    f"{fk_field} IN ({in_clause})",
                ) as attach_cursor:
                    for fk, *remaining in attach_cursor:
                        yield lookup[fk], remaining
                del attach_cursor

        del table_cursor

    def save(self, data: memoryview, folder: str, file_name: str, overwrite: bool = True):
        """Writes binary data to disk, creating folders as needed"""
        file = self.folder.joinpath(folder.strip(" ."), file_name.strip(" ."))
        file.parent.mkdir(parents=True, exist_ok=True)

        if not overwrite:
            i = 0
            base = file.stem
            while file.exists():
                i += 1
                file = file.with_stem(f"{base}_{i}")

        file.write_bytes(data)
        self.export_count += 1

    def export(self):
        if self.rc is None:
            return

        is_replace = self.format == self.REPLACE
        is_prefix = self.format == self.PREFIX
        is_suffix = self.format == self.SUFFIX
        change_file_name = is_replace or is_prefix or is_suffix

        # Replace invalid file/folder characters.
        str_trans = str.maketrans(
            {
                "<": "_",
                ">": "_",
                ":": ", ",
                '"': "_",
                "/": "-",
                "\\": "-",
                "|": "-",
                "?": "_",
                "*": "_",
            }
        )
        str_trans.update(dict.fromkeys(range(32)))  # ASCII control characters

        for (folder_name, *text_fields), (file_name, blob) in self.search():
            if change_file_name:
                if "." in file_name:
                    parts = file_name.rsplit(".", 1)
                    stem = parts[0]
                    suffix = "." + parts[-1]
                else:
                    stem = file_name
                    suffix = ""

                new_name = "_".join(map(str, text_fields))
                if is_replace:
                    file_name = f"{new_name}{suffix}"
                elif is_prefix:
                    file_name = f"{new_name}_{stem}{suffix}"
                else:
                    file_name = f"{stem}_{new_name}{suffix}"

            self.save(
                blob,
                folder="" if folder_name is None else str(folder_name).translate(str_trans),
                file_name=file_name.translate(str_trans),
                overwrite=not change_file_name,
            )

        if not self.export_count:
            raise NoAttachments


def main():
    params = arcpy.GetParameterInfo()
    try:
        ExportAttachments(
            table=params.in_dataset.value,
            folder=params.out_location.valueAsText,
            directory_field=params.subdirectory_field.valueAsText,
            name_format=params.name_format.value,
            name_fields=(params.name_fields.valueAsText or "").split(";"),
        ).export()

    except AttachmentsDisabled:
        arcpy.AddIDMessage("ERROR", 1179)
    except NoAttachments:
        arcpy.AddIDMessage("WARNING", 160771)
    except NoNameFields:
        arcpy.AddIDMessage("ERROR", 407, "Name Fields")
    except Exception:
        raise


if __name__ == "__main__":
    main()
