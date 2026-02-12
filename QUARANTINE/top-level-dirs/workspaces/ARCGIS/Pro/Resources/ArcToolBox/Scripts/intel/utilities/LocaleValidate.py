import locale

from typing import Tuple

class LocaleValidate:
    def __init__(self) -> None:
        self.locale: Tuple[str, str] = ('English_United States', '1252')
        return

    def set_locale(self) -> None:
        # Pass in empty string for locale parameter to use the user's default settings
        locale.setlocale(locale.LC_ALL, '')

    def convert_locale_string_to_float(self, param_string: str) -> float:
        self.set_locale()
        
        value = param_string.split(" ")[0]
        ret_value = locale.atof(value)

        return ret_value