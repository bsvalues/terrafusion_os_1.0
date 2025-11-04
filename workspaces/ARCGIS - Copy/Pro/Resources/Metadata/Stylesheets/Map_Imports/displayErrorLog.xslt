<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >

  <!-- An XSLT template for displaying output from analyzers that are run when maps are imported to a project.
    Copyright (c) 2014, Environmental Systems Research Institute, Inc. All rights reserved. -->

  <xsl:output method="html" indent="yes" encoding="UTF-8" doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN" doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd" />
  
  <xsl:param name="flowdirection"/>

  <xsl:template match="/">
    <xsl:comment> saved from url=(0016)http://localhost </xsl:comment>
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <title>Messages produced when importing a map or scene.</title>
      <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
      <style type="text/css">
        body {
          font-family: "Segoe UI", Arial, Sans-serif;
          font-size: 10pt;
          color: #4C4C4C;
          background-color: #FFFFFF;
          margin: 6px, 6px, 6px, 6px;
        }
        h1 {
          font-family: "Segoe UI Light", "Segoe UI", Arial, Sans-serif;
          font-size: 12pt;
          color: #0079C1;
          margin: 0px 0px 10px 0px;
        }
        p {
          margin: 0px 0px 10px 0px;
        }
        .code {
          font-family: monospace;
        }
        table {
          width: 100%;
          margin: 0px 0px 0px 0px;
          padding: 0px 0px 10px 0px;
          border-collapse:collapse;
          font-family: "Segoe UI", Arial, Sans-serif;
          font-size: 9pt;
          text-align: left;
        }
        tr th {
          border-top: 1px solid #929497;
          border-bottom: 1px solid #929497;
        }
        tr td {
          border-bottom: 1px solid #929497;
        }
        tr.odd {
          background: #EFEFEF;
        }
        tr.oddError {
          background: #E4A793;
        }
        tr.evenError {
          background: #F3DED7;
        }
        tr.oddWarning {
          background: #EFE397;
        }
        tr.evenWarning {
          background: #F3EDC7;
        }
        th {
          font-family: "Segoe UI Semibold", Arial, Sans-serif;
          color: #4C4C4C;
        }
      </style>
    </head>

    <body oncontextmenu="return true">
    <!-- <body> -->
      <xsl:if test="$flowdirection = 'RTL'">
        <xsl:attribute name="style">direction:rtl;</xsl:attribute>
      </xsl:if>
      
      <xsl:variable name="filePath" select="/ImportMXDLog/Messages/FileName" />
      <xsl:variable name="fileName">
        <xsl:call-template name="extractFileName">
          <xsl:with-param name="text" select="$filePath" />
        </xsl:call-template>
      </xsl:variable>
      
      <xsl:choose>
        <xsl:when test="not(/ImportMXDLog)">
          <p>ErrorLogNoErrorOrWarning</p> 
        </xsl:when>
        <xsl:when test="/ImportMXDLog[not(Messages)]">
          <xsl:choose>
            <xsl:when test="($fileName != '')">
              <h1>ErrorLogImportResultsFor <xsl:value-of select="$fileName" /></h1> 
              <p>ErrorLogSpecificImportSuccess: <span class="code"><xsl:value-of select="$filePath" /></span></p>
            </xsl:when>
            <xsl:otherwise>
              <h1>ErrorLogImportResults</h1> 
              <p>ErrorLogGenericImportSuccess</p> 
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="($fileName != '')">
              <h1>ErrorLogImportResultsFor <xsl:value-of select="$fileName" /></h1> 
              <p>ErrorLogMessageForMapOrScene: <span class="code"><xsl:value-of select="$filePath" /></span></p>
            </xsl:when>
            <xsl:otherwise>
              <h1>ErrorLogImportResults</h1> 
              <p>ErrorLogMessageForMapOrScene</p>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:for-each select="/ImportMXDLog/Messages">
            <table>
            <xsl:for-each select="Message">
              <xsl:choose>
                <xsl:when test="position()=1">
                  <tr>
                    <th>ErrorLogHeaderMessageName</th>
                    <th>ErrorLogHeaderType</th>
                    <th>ErrorLogHeaderSeverity</th>
                    <th>ErrorLogHeaderCode</th>
                    <th>ErrorLogHeaderDescription</th>
                    <th>ErrorLogHeaderComponentName</th>
                    <th>ErrorLogHeaderComponentType</th>
                  </tr>
                  <xsl:element name="tr">
                    <xsl:choose>
                      <xsl:when test="(MessageType = 'Error')">
                        <xsl:attribute name="class">oddError</xsl:attribute>
                      </xsl:when>
                      <xsl:when test="(MessageType = 'Warning')">
                        <xsl:attribute name="class">oddWarning</xsl:attribute>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:attribute name="class">odd</xsl:attribute>
                      </xsl:otherwise>
                    </xsl:choose>
                    <td><xsl:value-of select="Name"/></td>
                    <td><xsl:value-of select="MessageType"/></td>
                    <td><xsl:value-of select="Severity"/></td>
                    <td><xsl:value-of select="Code"/></td>
                    <td><xsl:value-of select="Description"/></td>
                    <td><xsl:value-of select="ComponentName"/></td>
                    <td><xsl:value-of select="ComponentType"/></td>
                  </xsl:element>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:element name="tr">
                    <xsl:choose>
                      <xsl:when test="(position() mod 2)">
                        <xsl:choose>
                          <xsl:when test="(MessageType = 'Error')">
                            <xsl:attribute name="class">oddError</xsl:attribute>
                          </xsl:when>
                          <xsl:when test="(MessageType = 'Warning')">
                            <xsl:attribute name="class">oddWarning</xsl:attribute>
                          </xsl:when>
                          <xsl:otherwise>
                            <xsl:attribute name="class">odd</xsl:attribute>
                          </xsl:otherwise>
                        </xsl:choose>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:choose>
                          <xsl:when test="(MessageType = 'Error')">
                            <xsl:attribute name="class">evenError</xsl:attribute>
                          </xsl:when>
                          <xsl:when test="(MessageType = 'Warning')">
                            <xsl:attribute name="class">evenWarning</xsl:attribute>
                          </xsl:when>
                        </xsl:choose>
                      </xsl:otherwise>
                    </xsl:choose>
                    <td><xsl:value-of select="Name"/></td>
                    <td><xsl:value-of select="MessageType"/></td>
                    <td><xsl:value-of select="Severity"/></td>
                    <td><xsl:value-of select="Code"/></td>
                    <td><xsl:value-of select="Description"/></td>
                    <td><xsl:value-of select="ComponentName"/></td>
                    <td><xsl:value-of select="ComponentType"/></td>
                  </xsl:element>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:for-each>
            </table>
          </xsl:for-each>
        </xsl:otherwise>
      </xsl:choose>
    
    </body>
  </html>
</xsl:template>
 
<xsl:template name="extractFileName">
	<xsl:param name="text" />
	<xsl:choose>
		<xsl:when test="contains($text, '\')">
			<xsl:variable name="before" select="substring-before($text, '\')" />
			<xsl:variable name="after" select="substring-after($text, '\')" />
			<xsl:choose>
				<xsl:when test='$after'>
					<xsl:call-template name="extractFileName">
						<xsl:with-param name="text" select="$after" />
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$text" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$text" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>