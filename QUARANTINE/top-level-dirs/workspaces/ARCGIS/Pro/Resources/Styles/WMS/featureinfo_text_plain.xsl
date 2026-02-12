<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:esri_wms="http://www.esri.com/wms" xmlns="http://www.esri.com/wms">
	<xsl:output method="text" indent="no" encoding="ISO-8859-1" omit-xml-declaration="yes"/>
	<xsl:variable name="newline">
	<xsl:text>
</xsl:text>
	</xsl:variable>
	<xsl:template match="/">	
		<xsl:for-each select="esri_wms:FeatureInfoResponse/esri_wms:FeatureInfoCollection">@<xsl:value-of select="@layername"/><xsl:value-of select="$newline"/>
			<xsl:for-each select="esri_wms:FeatureInfo[1]/esri_wms:Field"><xsl:value-of select="esri_wms:FieldName"/>;</xsl:for-each><xsl:value-of select="$newline"/>
			<xsl:for-each select="esri_wms:FeatureInfo">
				<xsl:for-each select="esri_wms:Field"><xsl:value-of select="esri_wms:FieldValue"/>;</xsl:for-each><xsl:value-of select="$newline"/>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>
