# coding: utf-8
"""
Source Name:   SSReportXML.py
Version:       ArcGIS 10.4/11.1
Author:        Environmental Systems Research Institute Inc.
Description:   Reporting Functions for ESRI Script Tools using XML/HTML.
"""

################### Imports ########################
import SSUtilities as UTILS
import xml.etree.ElementTree as ET

#### Body Text ####
bodyText = """
        html, body, div, span, applet, object, iframe,
        h1, h2, h3, h4, h5, h6, p, blockquote, pre,
        a, abbr, acronym, address, big, cite, code,
        del, dfn, em, font, img, ins, kbd, q, s, samp,
        small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
        dl, dt, dd, ol, ul, li,
        fieldset, form, label, legend,
        table, caption, tbody, tfoot, thead, tr, th, td {
            margin: 0;
            padding: 0;
            border: 0;
            outline: 0;
            font-size: 100%;
            vertical-align: baseline;
            background: transparent;
        }
        body {
            line-height: 1.2em;
        }
        ol, ul {
            list-style: none;
        }
        blockquote, q {
            quotes: none;
        }
        blockquote:before, blockquote:after,
        q:before, q:after {
            content: '';
            content: none;
        }

        :focus {
            outline: 0;
        }

        table {
            border-collapse: collapse;
            border-spacing: 0;
        }



        body {
            font-family: tahoma, verdana, sans-serif;
            background-color: #e5f0f5;
            text-align: center;

        }
        h1 {
            text-align: center;
            color:#00709C;
            font-size:1.2em;
            margin: 12px;
        }

        caption {
            text-align: center;
            color:#00709C;
            font-size:1em;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        th {
            text-align: left;
            padding-right: 4px;
        }

        #mainImg {
            border: 1px solid #c6c6c6;
            padding: 20px 30px 10px 30px;
            text-align: center;
            background-color: #ffffff;
            margin:0 auto 15px auto;
            width: 540px;
        }

        #mainImg p {
            text-align: left;
            font-size:.8em;
            border-top: 1px solid #c6c6c6;
            padding: 10px 0 0 0;
        }

        #key {
            float: center;
            width: 540px;
            margin:0 auto;
            text-align: left;
        }

        #keytable {
            float: left;
            font-size:.75em;
            position: absolute;
            margin: 30px 0 0 0;
        }

        #keytable img {
            margin-left: 4px;
        }
        .infotable {
            border: 1px solid #c6c6c6;
            background-color: #ffffff;
            font-size:1.2em;
            width: 600px;
            margin: 0 auto 15px auto;
        }
        .infotable th, .infotable td  {
            width: 50%;
            font-size:.75em;
            padding: 5px;
            border-top: 1px solid #c6c6c6;
        }

        .infotable th{
            border-right: 1px solid #c6c6c6;
        }

        th {
            text-align: right;
        }
        td {
            text-align: left;
        }
    """

######################### XML Functions ###########################

def xmlReport(title = None):
    """Creates Base Report Element.

    INPUTS:
    title {str, None}: Title for the report.

    OUTPUT:
    reportElement (obj): Base Report Element
    reportTree (obj): Report Element Tree
    """

    #### Root Element ####
    reportElement = ET.Element("Report")
    reportTree = ET.ElementTree(reportElement)

    #### Title Element ####
    if title is not None:
        titleElement = ET.SubElement(reportElement, "ssTitle")
        titleElement.text = title

    return reportElement, reportTree

def xmlFooter(parentElement, footerText):
    """Adds a footnote to a given Element.

    INPUTS:
    parentElement (obj): Parent Element
    footerText (str): Footnote text.

    OUTPUT:
    footerElement (obj): Footer Element.
    """

    footerElement = ET.SubElement(parentElement, "ssFooter")
    footerElement.text = footerText

    return footerElement

def xmlGraphic(reportElement, graphicFile, footerText = None):
    """Generates XML Graphic Elements for Reporting.

    INPUTS:
    reportElement (obj): Root Element in XML report.
    graphicFile (file): Image file to embed.
    footer {str, None}: Footer for the image.

    OUTPUT:
    graphElement (obj): Graph Element
    """

    graphicElement = ET.SubElement(reportElement, "ssGraphic")
    imageElement = ET.SubElement(graphicElement, "ssImage")
    imageElement.text = graphicFile
    if footerText is not None:
        footerElement = xmlFooter(graphicElement, 
                        footerText = footerText)

    return graphicElement

def xmlRow(tableElement, cellValues, rType = "ssRow"):
    """Returns a Row Element for a given Table Element.

    INPUTS:
    tableElement (obj): Table Element
    cellValues (list): values in the row.
    rType {str, ssRow}: type of row {ssRow, ssFloatRow}

    OUTPUT:
    rowElement (obj): Row Element
    """
    
    rowElement = ET.SubElement(tableElement, rType)
    rowInd0 = ET.SubElement(rowElement, "Label")
    rowInd1 = ET.SubElement(rowElement, "Value")
    if rType == "ssRow":
        label, value = cellValues
        rowInd0.text = label
        rowInd1.text = value
    else:
        rowInd2 = ET.SubElement(rowElement, "SignBox")
        label, value, img = cellValues
        rowInd0.text = label
        rowInd1.text = value
        rowInd2.text = img
    
    return rowElement

def xmlTable(reportElement, rowValues, title = None, tType = "ssTable"):
    """Generates XML Table Elements for Reporting.

    INPUTS:
    reportElement (obj): Root Element in XML report.
    rowValues (list): Each row in the table is a list.
    title {str, None}: Title of the table.
    tType {str, ssTable}: type of table {ssTable, ssFloat}

    OUTPUT:
    tableElement (obj): Table Element in XML report.
    """

    tableElement = ET.SubElement(reportElement, tType)
    if title is not None:
        tableTitle = ET.SubElement(tableElement, "ssTableTitle")
        tableTitle.text = title

    if tType == "ssTable":
        rType = "ssRow"
    else:
        rType = "ssFloatRow"
    for row in rowValues:
        xmlRow(tableElement, row, rType = rType)

    return tableElement

######################### HTML Functions ###########################

def report2html(reportTree, htmlFile):
    """Converts an Report Element Tree to a HTML File.

    INPUTS:
    reportTree (obj): Report Element Tree
    htmlFile (str): path to the output html file
    """

    root = ET.Element('html')

    #### <head> ####
    head = ET.Element('head')

    #### <style> ####
    style = ET.Element('style')
    style.attrib['type'] = "text/css"
    style.text = str(bodyText)
    head.append(style)
    # </style>

    #### <meta> ####
    meta = ET.Element('meta')
    meta.attrib['http-equiv'] = "content-type"
    meta.attrib['content'] = "text/html; charset=utf-8"
    head.append(meta)
    # </meta>
    
    #### <title>...</title> ####
    title_element = reportTree.find('ssTitle')
    title = ET.Element('title')
    title_text = ("" if title_element is None else title_element.text)
    title.text = title_text

    #### </head> ####
    head.append(title)

    #### <body> ####
    body = ET.Element('body')

    #### <h1>Title</h1> ####
    title_header = ET.Element('h1')
    title_header.text = title_text
    body.append(title_header)

    #### <table>Moran's... ####
    key_div = ET.Element('div')
    key_div.attrib['id'] = "key"
    key_table = ET.SubElement(key_div, 'table')
    key_table.attrib['id'] = "keytable"
    table_element = reportTree.find('ssGraphic/ssFloat')
    for row in (table_element.findall('ssFloatRow') if table_element is not None else []):
        #### <tr> ####
        row_elt = ET.Element('tr')
        label = ET.Element('th')
        label_elt = row.find('Label')
        label.text = (label_elt.text if label_elt is not None else "")
        value = ET.Element('td')
        value_elt = row.find('Value')
        value.text = (value_elt.text if value_elt is not None else "")
        signbox = ET.Element('td')
        signbox_elt = row.find('SignBox')
        if signbox_elt is not None and signbox_elt.text:
            img = ET.Element('img')
            img.attrib['src'] = "file://{0}".format(signbox_elt.text)
            signbox.append(img)
        row_elt.append(label)
        row_elt.append(value)
        row_elt.append(signbox)
        key_table.append(row_elt)
        #### </tr> ####
    #### </table> ####
    body.append(key_div)

    #### <img src="..."> #### 
    img_div = ET.Element('div')
    img_div.attrib['id'] = "mainImg"
    image = ET.SubElement(img_div, 'img')
    image_src = reportTree.find('ssGraphic/ssImage')
    image.attrib['src'] = ("" if image_src is None else "file://{0}".format(image_src.text))
    image.attrib['alt'] = title_text
    body.append(img_div)

    #### <p>given ...</p> ####
    explanation_element = reportTree.find('ssGraphic/ssFooter')
    expanatory_text = ("" if explanation_element is None else explanation_element.text)
    explanatory_par = ET.SubElement(img_div, 'p')
    explanatory_par.text = expanatory_text
    tables = reportTree.findall('ssTable')
    if tables is not None:
        for table_elt in tables:
            table = ET.Element('table')
            table.attrib["class"] = "infotable"
            caption = ET.Element('caption')
            caption_elt = table_elt.find('ssTableTitle')
            caption.text = (caption_elt.text if caption_elt is not None else "")
            if caption.text:
                table.append(caption)
            for row_elt in table_elt.findall('ssRow'):
                row = ET.Element('tr')
                label = row_elt.find('Label')
                value = row_elt.find('Value')
                label_elt = ET.Element('th')
                label_elt.text = (label.text if label is not None else "")
                value_elt = ET.Element('td')
                value_elt.text = (value.text if value is not None else "")
                row.append(label_elt)
                row.append(value_elt)
                table.append(row)
            body.append(table)
    #### </body> ####
    root.append(head)
    root.append(body)
    htmlStr = ET.tostring(root, encoding = 'UTF-8').decode('UTF-8')
    outHTML = UTILS.openFile(htmlFile, 'w')
    firstLine = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"'
    secondLine = '"http://www.w3.org/TR/html4/strict.dtd">'
    lineStr = UTILS.formatString("{0}\n")
    UTILS.writeText(outHTML, lineStr.format(firstLine))
    UTILS.writeText(outHTML, lineStr.format(secondLine))
    UTILS.writeText(outHTML, htmlStr)
    outHTML.close()

