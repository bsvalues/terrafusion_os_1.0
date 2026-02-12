"""Provides a place for functions/modules which have been reogranized in the
   python 2/3 switch use in this library to be located regardless of their
   location in the running Python's standard library."""

__all__ = ['cookielib', 'urllib2', 'HTTPError', 'URLError', 'urlsplit',
           'urljoin', 'urlunsplit', 'urlencode', 'quote', 'string_type',
           'ensure_string', 'ensure_bytes', 'get_headers', 'parse_qs']

import http.cookiejar as cookielib
import urllib.request as urllib2
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urljoin, urlunsplit
from urllib.parse import urlencode, quote

from urllib.parse import parse_qs

string_type = str

def ensure_string(payload_bytes):
    if isinstance(payload_bytes, bytes):
        return payload_bytes.decode("utf-8")
    return payload_bytes

def ensure_bytes(payload_string):
    if isinstance(payload_string, str):
        return payload_string.encode("utf-8")
    return payload_string

def get_headers(handle):
    if hasattr(handle.headers, 'headers'):
        return handle.headers.headers
    return dict(list(handle.headers.items()))
