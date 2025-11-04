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
			<xsl:attribute name="version">1.3.0</xsl:attribute>						
			<xsl:for-each select="esri_wms:FeatureInfoResponse/esri_wms:FeatureInfoCollection">													
			<FeatureInfoCollection>
				<xsl:attribute name="layername"><xsl:value-of select="@layername"/></xsl:attribute>							
				<xsl:for-each select="esri_wms:FeatureInfo">
				<FeatureInfo>
					<xsl:for-each select="esri_wms:Field">
					<Field>
						<FieldName><xsl:value-of select="esri_wms:FieldName"/></FieldName>
						<FieldValue><xsl:value-of select="esri_wms:FieldValue"/></FieldValue>
					</Field>		
					</xsl:for-each>																												
				</FeatureInfo>
				</xsl:for-each>					
			</FeatureInfoCollection>
			</xsl:for-each>						
		</FeatureInfoResponse>
	</xsl:template>
</xsl:stylesheet>
