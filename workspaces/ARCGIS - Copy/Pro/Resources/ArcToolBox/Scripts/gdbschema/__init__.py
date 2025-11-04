from ._logging import init_logging

logger = init_logging(__name__)
del init_logging


class ConvertPayload:
    def __init__(self, input_file: str):
        self.payload = self._convert_file(input_file)

    @staticmethod
    def _convert_file(file: str):
        if file.casefold().endswith(".json"):
            return ConvertPayload._read_json(file)

        from .to_json.workspace import ConvertDataElement

        with logger.timing(function="XLSX"):
            return ConvertDataElement(file).to_json()

    @staticmethod
    def _read_json(payload):
        from datetime import datetime
        from .common import load_json

        preface = {  # These keys will occur first.
            "dateExported": None,
        }

        with logger.timing(function="JSON") as t, open(payload, "r", encoding="utf-8") as f:
            with logger.timing(code="Read", **t):
                data = preface | load_json(f)

            if data["dateExported"] is None:
                data["dateExported"] = datetime.now().replace(microsecond=0).isoformat()

        return data

    def save_json(self, file: str):
        from .common import dump_json

        with logger.timing(function="JSON") as t, open(file, "w", encoding="utf-8") as f:
            with logger.timing(code="Write", **t):
                dump_json(self.payload, file=f, pretty=True)

    def save_xml(self, file: str):
        from .to_xml.workspace import ConvertDataElement
        from .to_xml.helper import write_xml

        with logger.timing(function="XML", level=logger.INFO):
            xml = ConvertDataElement(self.payload).to_xml()
            write_xml(xml, file)

    def save_files(
        self,
        excel_file: str = None,
        html_file: str = None,
        pdf_file: str = None,
    ):
        import pathlib
        from .conversion import Workspace

        with logger.timing(function="Workspace", code="Constructor"):
            gdb = Workspace(self.payload)

        if excel_file:
            from .writer.excel import ExcelSaver

            with logger.timing(function=ExcelSaver.PREFIX, level=logger.INFO):
                excel = pathlib.Path(excel_file)
                ExcelSaver(gdb, excel.parent.as_posix(), excel.stem).main()

        if html_file or pdf_file:  # PDF needs HTML
            from .writer.html import HTMLSaver
            import uuid

            with logger.timing(function=HTMLSaver.PREFIX, level=logger.INFO):
                if html_file:
                    html = pathlib.Path(html_file)
                else:  # Create a temporary html file in the same directory.
                    html = pathlib.Path(pdf_file).with_name(f"{uuid.uuid4().hex}.html")
                HTMLSaver(gdb, html.parent.as_posix(), html.stem).main()

            if pdf_file:
                from .writer.pdf import PDFSaver

                with logger.timing(function=PDFSaver.PREFIX, level=logger.INFO):
                    pdf = pathlib.Path(pdf_file)
                    PDFSaver(gdb, pdf.parent.as_posix(), pdf.stem).main(html)

                if not html_file:
                    html.unlink(missing_ok=True)


def _convert(
    input_file: str,
    json: str = None,
    xlsx: str = None,
    html: str = None,
    pdf: str = None,
    xml: str = None,
):
    converter = ConvertPayload(input_file)
    if json:
        converter.save_json(json)
    if xml:
        converter.save_xml(xml)
    if xlsx or html or pdf:
        converter.save_files(xlsx, html, pdf)


def convert(
    json_file: str,
    formats: str,
    *args,
    **kwargs,
):
    import pathlib

    logger.prefix = "SchemaExport"
    formats = formats.casefold()
    json_file = pathlib.Path(json_file)

    def make_file(ext: str):
        if ext not in formats:
            return
        return json_file.with_suffix(f".{ext}").as_posix()

    try:
        with logger.timing(level=logger.INFO) as t:
            _convert(
                json_file.as_posix(),
                json=make_file("json"),
                xlsx=make_file("xlsx"),
                html=make_file("html"),
                pdf=make_file("pdf"),
            )

    except Exception:
        import traceback

        logger.exception(traceback.format_exc(), extra=t)
        raise

    if "json" not in formats:  # Delete the json last in case the other formats fail.
        json_file.unlink(missing_ok=True)


def convert_report(
    report: str,
    folder: str,
    name: str,
    formats: str,
) -> tuple[str, ...]:
    """Converts schema report to other formats."""
    import pathlib

    logger.prefix = "SchemaImport"
    formats = formats.casefold()

    files = {}
    base = pathlib.Path(folder) / name
    for ext in ("json", "xlsx", "html", "pdf", "xml"):
        if ext not in formats:
            continue
        files[ext] = base.with_suffix(f".{ext}").as_posix()

    _convert(report, **files)

    return tuple(files.values())


def generate_contingent_values(
    table: str,
    fg_csv: str,
    cav_csv: str,
    field_groups: list[str] = None,
    mode: str = "SCHEMA",
):
    """Creates contingent values based on schema or data"""
    from .cav import ContingentValueBuilder

    build = ContingentValueBuilder(table=table, field_groups=field_groups or None)
    build.main(field_group=fg_csv, contingent_values=cav_csv, use_schema=mode == "SCHEMA")
