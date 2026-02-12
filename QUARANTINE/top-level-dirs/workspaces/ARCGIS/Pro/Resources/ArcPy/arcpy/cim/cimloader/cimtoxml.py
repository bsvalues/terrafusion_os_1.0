from lxml import objectify
from lxml import etree
from enum import Enum

__all__ = ["PopulateXMLElementWithAttr"]

html_escape_table = {"&": "&amp;",'"': "&quot;","'": "&apos;",">": "&gt;","<": "&lt;",}
def html_escape(text):
    """Produce entities within text."""
    return "".join(html_escape_table.get(c,c) for c in text)

def PopulateXMLElementWithAttr(obj):
    if hasattr(obj, "xml_obj"):
        xmlobj = getattr(obj, "xml_obj")
        for element in xmlobj.getchildren():
            if hasattr(obj, element.tag):
                if hasattr(getattr(obj, element.tag), "xml_obj"):
                    result_xml = PopulateXMLElementWithAttr(getattr(obj, element.tag))
                    if result_xml is not None:
                        element = result_xml
                elif isinstance(getattr(obj, element.tag), list):
                    i = 0
                    for array_item_obj in getattr(obj, element.tag):
                        xml_internal = PopulateXMLElementWithAttr(array_item_obj)
                        if xml_internal is not None:
                            element.replace(element.getchildren()[i], xml_internal)
                        i = i + 1
                else:
                    if getattr(obj, element.tag):
                        if issubclass(getattr(obj, element.tag).__class__, Enum):
                            element.text = str(getattr(obj, element.tag)).split('.')[-1]
                        elif issubclass(getattr(obj, element.tag).__class__, bool):
                            element.text = str(getattr(obj, element.tag)).lower()
                        else:
                            element.text = html_escape(str(getattr(obj, element.tag)))
        return xmlobj
    return None
