# use common package. noqa. pylint: disable=import-error
from typing import List, Dict, Optional
import re

from common import LogUtils


LOGGER = LogUtils.setup_logger(__name__)


class GEMsgParser:
    """Parse the Geoenrichment service message"""

    # map of the Geoenrich service error code to tool error code.
    LOCALIZED_WARNINGS = {10030406: 100281, 20010605: 100287,
                          20010604: 100288, 20010208: 100293,
                          10050046: 100294}
    MSG_TOI = ["esriJobMessageTypeError",
               "esriJobMessageTypeWarning",
               "unknown"]

    def __init__(self):
        self.ge_localized_messages = []
        self.ge_messages = []

    def _get_localized_message(self, message_code: int) -> Optional[Dict]:
        for msg in self.ge_localized_messages:
            if msg.get("messageCode") == message_code:
                return msg
        return None

    def parse(self, msgs: List):
        for msg in msgs:
            if msg.get("type") in self.MSG_TOI:
                desc = msg.get("description")
                msg_id = msg.get("id")

                if msg_id in self.LOCALIZED_WARNINGS:
                    if msg_id in [20010604, 20010605, 20010208]:
                        relate_msg = self._get_localized_message(100047)
                        if not relate_msg:
                            self.ge_localized_messages.append({"messageCode": 100047})
                    if msg_id == 20010605:
                        existing_msg = self._get_localized_message(self.LOCALIZED_WARNINGS[msg_id])
                        cty_name = re.findall("Data is not available for country (.+).", desc)
                        if len(cty_name) != 1:
                            LOGGER.debug(f"Invalid message {desc} for {msg_id}.")
                        elif existing_msg and cty_name[0] not in existing_msg["params"]["country"]:
                            existing_msg["params"]["country"] += f", {cty_name[0]}"
                        elif not existing_msg:
                            tmp_msg = {"messageCode": self.LOCALIZED_WARNINGS[msg_id],
                                       "params": {"country": cty_name[0]}}
                            self.ge_localized_messages.append(tmp_msg)
                    else:
                        existing_msg = self._get_localized_message(self.LOCALIZED_WARNINGS[msg_id])
                        if not existing_msg:
                            self.ge_localized_messages.append({"messageCode": self.LOCALIZED_WARNINGS[msg_id]})
                elif desc:
                    # only need to bubble up one message for identical messages
                    if desc not in self.ge_messages:
                        LOGGER.debug(f"id: {msg_id} and description: {desc}")
                        self.ge_messages.append(desc)
