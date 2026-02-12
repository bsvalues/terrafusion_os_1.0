<?xml version="1.0" encoding="UTF-8"?>
<!-- Processes ArcGIS metadata to merge original FGDC metadata and transformed ArcGIS metadata. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" omit-xml-declaration="no" />

	<xsl:variable name="dataIdentContent">
		<dataIdInfo>
			<xsl:for-each select="document($gpparam)/metadata/dataIdInfo/node() | document($gpparam)/metadata/dataIdInfo/@*">
				<xsl:copy>
					<xsl:apply-templates select="node() | @*" />
				</xsl:copy>
			</xsl:for-each>
		</dataIdInfo>
	</xsl:variable>

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

	<!-- exclude original ArcGIS/ESRI-ISO elements from the output -->
	<xsl:template match="mdFileID | mdLang | mdChar | mdParentID | mdHrLv | mdHrLvName | mdContact | mdDateSt | mdStanName | mdStanVer | distInfo | dataIdInfo | appSchInfo | porCatInfo | mdMaint | mdConst | dqInfo | spatRepInfo | refSysInfo | contInfo | mdExtInfo | dataSetURI | dataSetFn | loc | svIdInfo | series | describes | propType | featType | featAttr | taxSys | miAcquInfo | Esri/DataProperties/itemProps/imsContentType | Esri/scaleRange | browseem | @BrowseGraphicType" priority="1" >
	</xsl:template>

	<!-- copy existing Esri section, add ArcGISFormat if one doesn't exist, new scale range and content type code -->
	<xsl:template match="Esri" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:if test="count (ArcGISFormat) = 0">
				<ArcGISFormat>1.0</ArcGISFormat>
			</xsl:if>
			<xsl:if test="count (DataProperties) = 0">
				<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties"/>
			</xsl:if>
			<xsl:copy-of select="document($gpparam)/metadata/Esri/scaleRange"/>
		</xsl:copy>
	</xsl:template>

	<!-- if existing Esri section includes DataProperties, but has no content type code, get FGDC value in itemProps -->
	<xsl:template match="DataProperties" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:if test="count (itemProps) = 0">
				<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps"/>
			</xsl:if>
		</xsl:copy>
	</xsl:template>

	<!-- if existing Esri section includes itemProps, but has no content type code, get FGDC value -->
	<xsl:template match="itemProps" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType"/>
		</xsl:copy>
	</xsl:template>

	<!-- copy existing Binary section, add original document as an enclosure if document was not previously upgraded from FGDC -->
	<xsl:template match="Binary" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:if test="(count (Thumbnail) = 0) and (/metadata/idinfo/browse/browseem[. != ''])">
				<Thumbnail>
					<Data EsriPropertyType="Picture">
						<xsl:value-of select="/metadata/idinfo/browse/browseem" />
					</Data>
				</Thumbnail>
			</xsl:if>
			<xsl:if test="(count (Enclosure) = 0)">
				<xsl:copy-of select="document($gpparam)/metadata/Binary/Enclosure"/>
			</xsl:if>
			<xsl:if test="(count (Enclosure/Data) > 0) and (count (Enclosure/Data/@SourceMetadataSchema) = 0)">
				<xsl:copy-of select="document($gpparam)/metadata/Binary/Enclosure"/>
			</xsl:if>
		</xsl:copy>
	</xsl:template>	

	<!-- add Esri section with ArcGISFormat and Binary section with original document if these sections don't already exist -->
	<xsl:template match="metadata" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:copy-of select="document($gpparam)/metadata/mdFileID"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdLang"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdChar"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdParentID"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdHrLv"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdHrLvName"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdContact"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdDateSt"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdStanName"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdStanVer"/>
			<xsl:copy-of select="document($gpparam)/metadata/distInfo"/>
			<xsl:copy-of select="$dataIdentContent"/>
			<xsl:copy-of select="document($gpparam)/metadata/appSchInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/porCatInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdMaint"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdConst"/>
			<xsl:copy-of select="document($gpparam)/metadata/dqInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/spatRepInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/refSysInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/contInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdExtInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/dataSetURI"/>
			<xsl:copy-of select="document($gpparam)/metadata/dataSetFn"/>
			<xsl:copy-of select="document($gpparam)/metadata/loc"/>
			<xsl:copy-of select="document($gpparam)/metadata/series"/>
			<xsl:copy-of select="document($gpparam)/metadata/describes"/>
			<xsl:copy-of select="document($gpparam)/metadata/propType"/>
			<xsl:copy-of select="document($gpparam)/metadata/featType"/>
			<xsl:copy-of select="document($gpparam)/metadata/featAttr"/>
			<xsl:copy-of select="document($gpparam)/metadata/taxSys"/>
			<xsl:copy-of select="document($gpparam)/metadata/miAcquInfo"/>
			<xsl:if test="count (./Esri) = 0">
				<xsl:copy-of select="document($gpparam)/metadata/Esri"/>
			</xsl:if>
			<xsl:if test="count (./Binary) = 0">
				<Binary>
					<xsl:if test="/metadata/idinfo/browse/browseem[. != '']">
						<Thumbnail>
							<Data EsriPropertyType="Picture">
								<xsl:value-of select="/metadata/idinfo/browse/browseem" />
							</Data>
						</Thumbnail>
					</xsl:if>
					<xsl:copy-of select="document($gpparam)/metadata/Binary/Enclosure"/>
				</Binary>
			</xsl:if>
		</xsl:copy>
	</xsl:template>
	
	<!-- if keyword element contains words separated by commas, extract the words and put them in separate keyword elements -->
	<xsl:template match="keyword[contains(.,',')]" priority="1">
		<xsl:call-template name="splitKeywords">
			<xsl:with-param name="original" select="." />
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="splitKeywords">
		<xsl:param name="original" />
		<xsl:choose>
			<xsl:when test="contains(string($original), ',')">
				<xsl:variable name="keyword" select="substring-before($original, ',')" />
				<xsl:variable name="rest" select="substring-after($original, ',')" />
				<keyword><xsl:value-of select="normalize-space($keyword)" /></keyword>
				<xsl:call-template name="splitKeywords">
					<xsl:with-param name="original" select="$rest" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<keyword><xsl:value-of select="normalize-space($original)" /></keyword>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<!-- if FGDC metadata has only 8.0 thumbnail in browseem element, remove empty browse section; otherwise keep browse graphic info, browseem will be removed -->
	<xsl:template match="browse[browseem/text()]" priority="1">
		<xsl:if test="((count (*[. != '']) - count (browseem[. != ''])) &gt; 0)">
			<xsl:copy>
				<xsl:apply-templates select="node() | @*" />
			</xsl:copy>
		</xsl:if>
	</xsl:template>

</xsl:stylesheet>
