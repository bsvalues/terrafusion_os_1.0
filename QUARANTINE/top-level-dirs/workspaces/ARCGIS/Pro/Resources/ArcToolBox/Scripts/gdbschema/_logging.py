import contextlib
import ctypes
import enum
import logging

from typing import Generator

__all__ = [
    "init_logging",
    "get_logger",
]


def init_logging(name: str, prefix: str = "") -> "GDBLogger":
    """Initializes the logger `name` with custom class"""
    with logging._lock:
        cls = logging.getLoggerClass()

        logging.setLoggerClass(GDBLogger)
        logger: "GDBLogger" = logging.getLogger(name)
        logging.setLoggerClass(cls)

    logger.add_diagnostic_handler()
    logger.add_arcpy_handler()
    logger.prefix = prefix

    return logger


def get_logger(name: str) -> "GDBLogger":
    # Instead of the created logger children at module.namespace, we just use the module name.
    # This way we don't need to change the logger class.
    return logging.getLogger(name.split(".")[0])


class LoggingLevel(enum.IntEnum):
    ERROR = 0
    WARNING = 1
    INFO = 2
    DEBUG = 3

    @classmethod
    def from_logging_level(cls, level: int):
        """Converts python logging level to Diagnostic LoggingLevel"""
        if level >= logging.ERROR:
            return cls.ERROR
        elif level >= logging.WARNING:
            return cls.WARNING
        elif level >= logging.INFO:
            return cls.INFO
        else:
            return cls.DEBUG


class ProDiagnostic:
    def __init__(self):
        import arcpy
        import os

        self.dll = ctypes.CDLL(os.path.join(arcpy.GetInstallInfo()["InstallDir"], "bin", "DADFLib.dll"))

    def __enter__(self):
        self.set_level(LoggingLevel.DEBUG)
        self.enable()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disable()
        self.flush()
        self.close()

    def set_level(self, level: LoggingLevel):
        """Changes logging level"""
        self.dll.EventLogSetLogLevel(level)

    def get_level(self) -> LoggingLevel:
        """Gets current logging level"""
        return LoggingLevel(self.dll.EventLogGetLogLevel())

    def get_log_file(self) -> str:
        """Gets patch to log file"""
        path = ctypes.c_wchar_p()
        self.dll.EventLogGetPath(ctypes.byref(path))
        return path.value

    def is_enabled(self) -> bool:
        """Logging is active"""
        return bool(self.dll.EventLogIsEnabled())

    def enable(self):
        """Enables logging"""
        self.dll.EventLogEnable()

    def disable(self):
        """Disables logging"""
        self.dll.EventLogDisable()

    def flush(self):
        """Flushes log file"""
        self.dll.EventLogFlush()

    def close(self):
        """Closes the log file"""
        self.dll.EventLogClose()

    def write(
        self,
        msg: str,
        level: LoggingLevel = LoggingLevel.DEBUG,
        function: str = None,
        code: str = None,
        elapsed: int = None,
        flush: bool = False,
    ):
        """Writes message to the diagnostic"""
        msg = str(msg)
        if function is None:
            self.dll.EventLogWrite(level, msg, flush)
        else:
            self.dll.EventLogWriteEx(level, msg, function, code, elapsed, flush)


class DiagnosticHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.diagnostic = ProDiagnostic()

    def emit(self, record: logging.LogRecord):
        if not self.diagnostic.is_enabled():
            return

        self.diagnostic.write(
            msg=record.msg,
            level=LoggingLevel.from_logging_level(record.levelno),
            function=getattr(record, "function", None),
            code=getattr(record, "code", None),
            elapsed=getattr(record, "elapsed", None),
        )


class ArcpyHandler(logging.Handler):
    def __init__(self):
        super().__init__()

    def emit(self, record):
        import arcpy

        msg = self.format(record)
        if record.levelno >= logging.ERROR:
            arcpy.AddError(msg)
        elif record.levelno >= logging.WARNING:
            arcpy.AddWarning(msg)
        else:
            arcpy.AddMessage(msg)


class ConsoleHandler(logging.StreamHandler):
    def __init__(self):
        import sys

        super().__init__(sys.stdout)
        self.setFormatter(logging.Formatter("[%(asctime)s]\t%(message)s", datefmt="%Y-%m-%d %H:%M:%S"))

    def format(self, record: logging.LogRecord) -> str:
        # If one of the extra keywords are present, then enrich message.
        function = getattr(record, "function", None)
        code = getattr(record, "code", None)
        elapsed = getattr(record, "elapsed", None)
        if not all(x is None for x in (function, code, elapsed)):
            record.msg = f"{record.msg or ''} ({function}.{code}) {elapsed or ''}".strip()

        return super().format(record)


class GDBLogger(logging.Logger):
    """Logging facilities for writing to Pro diagnostic monitor"""

    # Log levels
    ERROR = logging.ERROR
    WARNING = logging.WARNING
    INFO = logging.INFO
    DEBUG = logging.DEBUG

    def __init__(self, name):
        super().__init__(name)
        self.prefix: str = ""  # This will be added as function prefix to diagnostic calls.

    def _add_handler(self, cls: type[logging.Handler]):
        for h in self.handlers:
            if isinstance(h, cls):
                return

        self.addHandler(cls())

    def add_console_handler(self):
        self._add_handler(ConsoleHandler)

    def add_diagnostic_handler(self):
        import os

        if os.name == "nt":  # Can only load the DLL on Windows.
            self._add_handler(DiagnosticHandler)

    def add_arcpy_handler(self):
        self._add_handler(ArcpyHandler)

    @contextlib.contextmanager
    def timing(
        self,
        message: str | None = None,
        function: str | None = None,
        code: str | None = None,
        level: int = logging.DEBUG,
    ) -> Generator[dict, None, None]:
        """Context manager that logs start/end of code block"""
        from time import perf_counter_ns

        if function is None:
            function = self.prefix
        elif not function.startswith(self.prefix):
            function = f"{self.prefix}.{function}"
        func = dict(function=function)

        self.log(level, message, extra=func | dict(code=f"Begin{code or ''}"))

        start = perf_counter_ns()
        try:
            yield func if code is None else func | dict(code=code)

        finally:
            end = (perf_counter_ns() - start) // 1_000_000  # milliseconds
            self.log(level, message, extra=func | dict(code=f"End{code or ''}", elapsed=end))
