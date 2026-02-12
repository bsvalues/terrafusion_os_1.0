<?xml version="1.0" encoding="UTF-8"?>
<!-- Processes ArcGIS metadata to merge original FGDC metadata and transformed ArcGIS metadata. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" omit-xml-declaration="no" />

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

	<!-- exclude original metadata elements from the output -->
	<xsl:template match="mdFileID | metadataID | mdLang | mdChar | mdParentID | parentMdCit | mdHrLv | mdHrLvName | mdContact | mdDateSt | mdTimeSt | dateInfo | mdStanName | mdStanVer | distInfo | dataIdInfo | appSchInfo | porCatInfo | mdMaint | mdConst | dqInfo | spatRepInfo | refSysInfo | contInfo | mdExtInfo | dataSetURI | dataSetFn | altMdReference | mdLinkage | loc | svIdInfo | series | describes | propType | featType | featAttr | taxSys | miAcquInfo | idinfo | dataqual | spdoinfo | spref | distinfo | metainfo | Esri/scaleRange | Esri/DataProperties/itemProps/imsContentType | Esri/locales" priority="1" >
	</xsl:template>

	<!-- if imported metadata includes field content remove existing field content; otherwise, keep the existing field descriptions -->
	<xsl:template match="eainfo" priority="1" >
		<xsl:choose>
			<xsl:when test="document($gpparam)/metadata/eainfo" />
			<xsl:otherwise>
				<xsl:copy>
					<xsl:apply-templates select="node() | @*" />
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<!-- copy imported content as the target item's new metadata -->
	<!-- add Esri section with ArcGISFormat if this sections doesn't already exist -->
	<xsl:template match="metadata" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:copy-of select="document($gpparam)/metadata/mdFileID"/>
			<xsl:copy-of select="document($gpparam)/metadata/metadataID"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdLang"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdChar"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdParentID"/>
			<xsl:copy-of select="document($gpparam)/metadata/parentMdCit"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdHrLv"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdHrLvName"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdContact"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdDateSt"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdTimeSt"/>
			<xsl:copy-of select="document($gpparam)/metadata/dateInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/altMdReference"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdLinkage"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdStanName"/>
			<xsl:copy-of select="document($gpparam)/metadata/mdStanVer"/>
			<xsl:copy-of select="document($gpparam)/metadata/distInfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/dataIdInfo"/>
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
			<xsl:copy-of select="document($gpparam)/metadata/eainfo"/>
			<xsl:copy-of select="document($gpparam)/metadata/custom"/>
			<xsl:copy-of select="document($gpparam)/metadata/tool"/>
			<xsl:copy-of select="document($gpparam)/metadata/toolbox"/>
			<!-- following sections aren't supported for entering content or translation yet -->
			<xsl:copy-of select="document($gpparam)/metadata/series"/>
			<xsl:copy-of select="document($gpparam)/metadata/describes"/>
			<xsl:copy-of select="document($gpparam)/metadata/propType"/>
			<xsl:copy-of select="document($gpparam)/metadata/featType"/>
			<xsl:copy-of select="document($gpparam)/metadata/featAttr"/>
			<xsl:copy-of select="document($gpparam)/metadata/taxSys"/>
			<xsl:copy-of select="document($gpparam)/metadata/miAcquInfo"/>
			<xsl:if test="count (./Esri) = 0">
				<Esri>
					<ArcGISFormat>1.0</ArcGISFormat>
					<xsl:if test="(document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType != '')">
						<DataProperties>
							<itemProps>
								<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType"/>
							</itemProps>
						</DataProperties>
					</xsl:if>
					<xsl:copy-of select="document($gpparam)/metadata/Esri/locales"/>
					<xsl:copy-of select="document($gpparam)/metadata/Esri/scaleRange"/>
				</Esri>
			</xsl:if>
		</xsl:copy>
	</xsl:template>

	<!-- copy existing Esri section, add ArcGISFormat if one doesn't exist -->
	<xsl:template match="Esri" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:if test="count (ArcGISFormat) = 0">
				<ArcGISFormat>1.0</ArcGISFormat>
			</xsl:if>
			<xsl:if test="(count (DataProperties) = 0) and (document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType != '')">
				<DataProperties>
					<itemProps>
						<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType"/>
					</itemProps>
				</DataProperties>
			</xsl:if>
			<xsl:copy-of select="document($gpparam)/metadata/Esri/locales"/>
			<xsl:copy-of select="document($gpparam)/metadata/Esri/scaleRange"/>
		</xsl:copy>
	</xsl:template>

	<!-- copy existing DataProperties section, add itemProps section if one doesn't exist -->
	<xsl:template match="DataProperties" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:if test="(count (itemProps) = 0) and (document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType != '')">
				<itemProps>
					<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType"/>
				</itemProps>
			</xsl:if>
		</xsl:copy>
	</xsl:template>

	<!-- copy existing itemProps section, add imsContentType -->
	<xsl:template match="itemProps" priority="1" >
		<xsl:copy>
			<xsl:apply-templates select="node() | @*" />
			<xsl:copy-of select="document($gpparam)/metadata/Esri/DataProperties/itemProps/imsContentType"/>
		</xsl:copy>
	</xsl:template>

</xsl:stylesheet>
