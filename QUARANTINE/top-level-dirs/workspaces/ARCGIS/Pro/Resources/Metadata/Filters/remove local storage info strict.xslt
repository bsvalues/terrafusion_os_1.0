<?xml version="1.0" encoding="UTF-8"?>
<!-- Processes ArcGIS metadata to remove local machine names from metadata before it is published. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" omit-xml-declaration="no" />
	
	<xsl:variable name="withheld">withheld</xsl:variable>
	
	<!-- start processing all nodes and attributes in the XML document -->
	<!-- any CDATA blocks in the original XML will be lost because they can't be handled by XSLT -->
	<xsl:template match="/">
		<xsl:apply-templates select="node() | @*" />
	</xsl:template>

	<!-- copy all nodes and attributes in the XML document -->
	<xsl:template match="node() | @*" priority="0">
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
		</xsl:copy>
	</xsl:template>
	
	<!-- templates below override the default template above that copies all noes and attributes -->
	
	<!-- exclude network machine names from metadata -->
	<!-- URL and ftp addresses, fully-qualified (on local disk) and relative path names will not be modified -->

	<!-- remove machine names from text that might include UNC paths, machine name itself is removed but rest of path is left as-is -->
	<xsl:template match="text()[contains(., '\\') or contains(., ':\')]" priority="1" >
		<xsl:call-template name="handlePaths">
			<xsl:with-param name="text"><xsl:value-of select="." /></xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<!-- remove reference to Desktop operating system -->
	<xsl:template match="envirDesc[contains(., 'Microsoft') or contains(., 'Windows')] | native[contains(., 'Microsoft') or contains(., 'Windows')]" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
			<xsl:if test="@Sync">
				<xsl:attribute name="Sync">FALSE</xsl:attribute>
			</xsl:if>
			<xsl:value-of select="substring-after(.,'; ')" />
		</xsl:copy>
	</xsl:template>

	<!-- for items in an SDE geodatabase, remove reference to SDE from the item type -->
	<xsl:template match="formatName[contains(., 'SDE')] | natvform[contains(., 'SDE')]" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
			<xsl:if test="@Sync">
				<xsl:attribute name="Sync">FALSE</xsl:attribute>
			</xsl:if>
			<xsl:value-of select="substring-after(.,'SDE ')" />
		</xsl:copy>
	</xsl:template>

	<!-- Remove SDE server connection information if present; leave ArcIMS connection informatin -->
	<!-- entire set of connection details are replaced by text "withheld", if present Sync set to FALSE to prevent reoccurrence -->
	<xsl:template match="*[not(.//*) and starts-with(., 'Server=') and not(starts-with(., 'Server=http'))]" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
			<xsl:if test="@Sync">
				<xsl:attribute name="Sync">FALSE</xsl:attribute>
			</xsl:if>
			<xsl:value-of select="$withheld" />
		</xsl:copy>
	</xsl:template>
	<xsl:template match="@*[starts-with(., 'Server=') and not(starts-with(., 'Server=http'))]" priority="1" >
		<xsl:attribute name="{name()}"><xsl:value-of select="$withheld" /></xsl:attribute>
		<xsl:apply-templates select="node() | @*" />
	</xsl:template>

	<!-- check all elements to see if their value starts with the double-backslash or file://\\ that preceeds the machine name in a UNC path or is a fully-qualified path added automatically by ArcGIS -->
	<!-- entire path is replaced by text "withheld", if present Sync set to FALSE to prevent reoccurrence -->
	<xsl:template match="*[not(.//*) and (starts-with(., '\\') or starts-with(., 'file://\\') or (substring(.,2,2) = ':\'))]" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
			<xsl:if test="@Sync">
				<xsl:attribute name="Sync">FALSE</xsl:attribute>
			</xsl:if>
			<xsl:value-of select="$withheld" />
		</xsl:copy>
	</xsl:template>
	<xsl:template match="@*[(starts-with(., '\\') or starts-with(., 'file://\\') or (substring(.,2,2) = ':\'))]" priority="1" >
		<xsl:attribute name="{name()}"><xsl:value-of select="$withheld" /></xsl:attribute>
		<xsl:apply-templates select="node() | @*" />
	</xsl:template>
	
	<xsl:template match="itemName[contains(., '.')] | ftname[contains(., '.')] | otfcname[contains(., '.')] | dtfcname[contains(., '.')] | relflab[contains(., '.')] | relblab[contains(., '.')] | enttypl[contains(., '.') and (@Sync='TRUE')] | enttypl[contains(., '.') and (@Sync='TRUE')] | title[contains(., '.') and (@Sync='TRUE')] | resTitle[contains(., '.') and (@Sync='TRUE')]" priority="1" >
		<xsl:choose>
			<xsl:when test="(/metadata/Esri/DataProperties/itemProps/itemLocation/protocol = 'ArcSDE Connection')">
				<xsl:copy>
					<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
					<xsl:if test="@Sync">
						<xsl:attribute name="Sync">FALSE</xsl:attribute>
					</xsl:if>
					<xsl:call-template name="handleSDEnames">
						<xsl:with-param name="name" select="." />
					</xsl:call-template>
				</xsl:copy>
			</xsl:when>
			<xsl:otherwise>
				<xsl:copy>
					<xsl:apply-templates select="node() | @*" />
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="@Name[contains(., '.')]" priority="1" >
		<xsl:choose>
			<xsl:when test="(/metadata/Esri/DataProperties/itemProps/itemLocation/protocol = 'ArcSDE Connection')">
				<xsl:attribute name="{name()}">
					<xsl:call-template name="handleSDEnames">
						<xsl:with-param name="name" select="." />
					</xsl:call-template>
				</xsl:attribute>
				<xsl:apply-templates select="node() | @*" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:copy>
					<xsl:apply-templates select="node() | @*" />
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<!-- Remove embedded layer file, if present (Pro 2.3 or later) -->
	<xsl:template match="LayerFile" priority="1" >
	</xsl:template>

	<!-- check well-known elements and attributes where file paths might appear, and remove content that doesn't start like a well-known internet address -->
	<xsl:template match="linkage[not(starts-with(.,'ftp') or starts-with(.,'http'))] | bgFileName[not(starts-with(.,'ftp') or starts-with(.,'http'))] | gmlDescRef[not(starts-with(.,'ftp') or starts-with(.,'http'))] | unitQuanRef[not(starts-with(.,'ftp') or starts-with(.,'http'))] | unitQuanRef[not(starts-with(.,'ftp') or starts-with(.,'http'))] | onlink[not(starts-with(.,'ftp') or starts-with(.,'http'))] | networkr[not(starts-with(.,'ftp') or starts-with(.,'http'))] | browsen[not(starts-with(.,'ftp') or starts-with(.,'http'))] | srcused[not(starts-with(.,'ftp') or starts-with(.,'http'))] | srcprod[not(starts-with(.,'ftp') or starts-with(.,'http'))]" priority="2" >
		<xsl:copy>
			<xsl:apply-templates select="* | comment() | @*[not(name() = 'Sync')]" />
			<xsl:if test="@Sync">
				<xsl:attribute name="Sync">FALSE</xsl:attribute>
			</xsl:if>
			<xsl:value-of select="$withheld" />
		</xsl:copy>
	</xsl:template>
	<xsl:template match="@href[not(starts-with(.,'ftp') or starts-with(.,'http'))] | @src[not(starts-with(.,'ftp') or starts-with(.,'http'))]" priority="2" >
		<xsl:attribute name="{name()}"><xsl:value-of select="$withheld" /></xsl:attribute>
		<xsl:apply-templates select="node() | @*" />
	</xsl:template>

	<!-- Remove 8.0.0 synchronized SDE connection information from FGDC distribution section, if present -->
	<!-- Remove 10.x synchronized locations, copy history, gp history, if present -->
	<!-- content is entirely removed -->
	<xsl:template match="sdeconn | itemLocation | copyHistory | DataProperties/lineage | protocol[contains(.,'SDE')] | accinstr[contains(., 'SDE')]" priority="2" >
	</xsl:template>

	<xsl:template name="handlePaths">
		<xsl:param name="text" />
		<xsl:choose>
			<xsl:when test="contains($text, '\\')">
				<xsl:value-of select="substring-before($text, '\\')" />
				<xsl:variable name="after" select="substring-after($text, '\\')" />
				<xsl:call-template name="removeRestOfPath">
					<xsl:with-param name="text" select="substring-before($after, ' ')" />
				</xsl:call-template>&#160;
				<xsl:call-template name="handlePaths">
					<xsl:with-param name="text" select="substring-after($after, ' ')" />
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="contains($text, ':\')">
				<xsl:variable name="string" select="substring-before($text, ':\')" />
				<xsl:value-of select="substring($string,1,(string-length($string) - 1))" />
				<xsl:variable name="after" select="substring-after($text, ':\')" />
				<xsl:call-template name="removeRestOfPath">
					<xsl:with-param name="text" select="substring-before($after, ' ')" />
				</xsl:call-template>&#160;
				<xsl:call-template name="handlePaths">
					<xsl:with-param name="text" select="substring-after($after, ' ')" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="removeRestOfPath">
		<xsl:param name="text" />
		<xsl:choose>
			<xsl:when test="contains($text, '\')">
				<xsl:variable name="after" select="substring-after($text, '\')" />
				<xsl:call-template name="removeRestOfPath">
					<xsl:with-param name="text" select="$after" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="handleSDEnames">
		<xsl:param name="name" />
		<xsl:choose>
			<xsl:when test="contains($name, '.')">
				<xsl:variable name="after" select="substring-after($name, '.')" />
				<xsl:call-template name="handleSDEnames">
					<xsl:with-param name="name" select="$after" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$name" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>
