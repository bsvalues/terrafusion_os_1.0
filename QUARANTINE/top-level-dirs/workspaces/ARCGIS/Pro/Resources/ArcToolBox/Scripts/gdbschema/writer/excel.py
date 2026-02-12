from .base import Saver
from .excel_helper import *
from .._logging import get_logger

logger = get_logger(__name__)


class ExcelSaver(Saver):
    PREFIX = "Excel"

    def __init__(self, gdb, folder, base_name):
        super().__init__(gdb, folder, base_name, suffix="xlsx")
        self.WORKSPACE_BOOK = base_name

        self.book = Book()

    def create_overview_sheets(self):
        toc = self.book.create_sheet(self.book.TOC, add_toc=False)
        toc.add_collection(self.gdb.properties(), add_order=False)
        toc.add_collection(self.gdb.mega_count(), add_order=False)
        toc.add_collection(self.gdb.dataset_collection())

        for item in self.gdb.mega():
            sheet = self.book.create_sheet(item.class_name(), add_toc=False)
            sheet.add_collection(item, add_label=False)

    def create_domain_sheets(self):
        from ..conversion.workspace import WorkspaceDomain, DomainUsage, DomainCodedValue

        domain: WorkspaceDomain
        for i, domain in enumerate(self.gdb.domains, 1):
            sheet = self.book.create_sheet(
                name=f"{domain.SHEET_PREFIX}{i}_{str(domain.name)}",
                display=str(domain),
            )

            ordered_collection = domain.ordered()
            sheet.add_empty_rows(len(ordered_collection) + 1)

            for j, order in enumerate(ordered_collection, 1):
                sheet.add_collection(
                    order,
                    add_order=order.cls in (DomainCodedValue, DomainUsage),
                    nav_link=j,
                )

    def create_workspace_sheets(self):
        from ..conversion.helper import BaseCollection

        # Object class
        for i, data in enumerate(self.gdb.datasets, 1):
            sheet = self.book.create_sheet(
                name=f"{data.SHEET_PREFIX}{i}_{str(data.name).split('.')[-1]}",
                display=str(data),
            )

            ordered_collection = data.ordered()
            sheet.add_empty_rows(len(ordered_collection) + 1)

            for j, order in enumerate(ordered_collection, 1):
                sheet.add_collection(
                    order,
                    add_order=isinstance(order, BaseCollection),
                    nav_link=j,
                )

    def main(self):
        with logger.timing(function=self.PREFIX, code="OverviewSheets"):
            self.create_overview_sheets()
        with logger.timing(function=self.PREFIX, code="DataElementSheets"):
            self.create_workspace_sheets()
        with logger.timing(function=self.PREFIX, code="DomainSheets"):
            self.create_domain_sheets()

        self.book.save(self._output_file(self.WORKSPACE_BOOK))
