<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:esri_wms="http://www.esri.com/wms" xmlns="http://www.esri.com/wms">
	<!--
		<?xml version="1.0" encoding="UTF-8"?>
	-->	
	<xsl:output 
		method="xml" 
		version="1.0"		
		indent="yes" 
		encoding="UTF-8" /> <!-- the value encoding doesn't apply to result xml document header, it's always "UTF-8" -->

	<xsl:template match="/">
		<FeatureInfoResponse>						
			<xsl:for-each select="esri_wms:FeatureInfoResponse/esri_wms:FeatureInfoCollection/esri_wms:FeatureInfo">										
				<FIELDS>								
					<xsl:for-each select="esri_wms:Field">
						<xsl:variable name="attributeName" select="esri_wms:FieldName"/>
						<xsl:attribute name="{$attributeName}"><xsl:value-of select="esri_wms:FieldValue"/></xsl:attribute>
            <!--FIELD name="{$attributeName}"><xsl:value-of select="esri_wms:FieldValue"/></FIELD-->
          </xsl:for-each>
				</FIELDS>
			</xsl:for-each>			
		</FeatureInfoResponse>
	</xsl:template>
</xsl:stylesheet>
