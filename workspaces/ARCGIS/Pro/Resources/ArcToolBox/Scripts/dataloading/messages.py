import dataclasses
from collections.abc import Iterable
from enum import Enum
from typing import Union

import arcpy


class MsgTypeCode(Enum):
    INFORMATIVE = 0
    DEFINITION = 1
    START = 2
    STOP = 3
    WARNING = 50
    ERROR = 100
    EMPTY = 101
    GEODATABASE = 102
    ABORT = 200


@dataclasses.dataclass
class Message:
    type_code: MsgTypeCode
    return_code: int
    value: str

    def __post_init__(self):
        try:
            self.type_code = MsgTypeCode(self.type_code)
        except TypeError:
            pass

    def is_warning(self):
        return self.type_code == MsgTypeCode.WARNING

    def is_error(self):
        return self.type_code == MsgTypeCode.ERROR

    def log_warning(self):
        if self.is_warning():
            arcpy.AddWarning(self.value)

    def log_error(self):
        if self.is_error():
            arcpy.AddError(self.value)


class AllMessages:
    """Wrapper for messages returned by arcpy.GetAllMessages"""

    def __init__(self):
        self.messages: list[Message] = [Message(*values) for values in arcpy.GetAllMessages()]

    def has_return_codes(self, *codes: int) -> bool:
        """Check for specifc return code(s) in all messages"""
        return any(filter(lambda x: x.return_code in codes, self.messages))

    def return_codes(self) -> list[int]:
        """Get list of all return codes in all messages"""
        return [mess.return_code for mess in self.messages]

    def filter(
        self,
        *,
        message_type: Union[MsgTypeCode, Iterable[MsgTypeCode, None]] = None,
        return_code: Union[int, Iterable[int], None] = None,
    ) -> Iterable[Message]:
        """Filter all messages by message type(s) and/or return code(s)"""
        # if message_type is None and return_code is None:
        #     yield from self.messages
        #     return
        if isinstance(message_type, MsgTypeCode):
            message_type = (message_type,)
        if isinstance(return_code, int):
            return_code = (return_code,)

        for mess in self.messages:
            if message_type is not None and mess.type_code not in message_type:
                continue
            if return_code is not None and mess.return_code not in return_code:
                continue
            yield mess

    def log(self):
        """Log only warnings and errors"""
        for mess in self.filter(message_type=(MsgTypeCode.ERROR, MsgTypeCode.WARNING)):
            mess.log_error()
            mess.log_warning()

    def log_warnings(self, skip_return_code: int | None = None) -> bool:
        """Log only warnings"""
        logged = False
        for mess in self.filter(message_type=MsgTypeCode.WARNING):
            if skip_return_code and mess.return_code == skip_return_code:
                continue
            logged = True
            mess.log_warning()
        return logged

    def log_errors(self):
        """Log only warnings"""
        logged = False
        for mess in self.filter(message_type=MsgTypeCode.ERROR):
            logged = True
            mess.log_error()
        return logged

    def raise_errors(self):
        if error_messages := "\n".join(mess.value for mess in self.filter(message_type=MsgTypeCode.ERROR)):
            raise arcpy.ExecuteError(error_messages + "\n")
