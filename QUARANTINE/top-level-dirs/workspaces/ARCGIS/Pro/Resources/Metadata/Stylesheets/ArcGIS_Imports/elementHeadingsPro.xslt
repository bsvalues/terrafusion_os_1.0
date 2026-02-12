<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:res="http://www.esri.com/metadata/res/" xmlns:esri="http://www.esri.com/metadata/" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:msxsl="urn:schemas-microsoft-com:xslt" >

<!-- An XSLT template for displaying metadata in ArcGIS stored in the ArcGIS metadata format.
     Copyright (c) 2014, Esri, Inc. All rights reserved.
     Revision History: Created 5/20/2014 avienneau
-->

<!-- REFERENCE TO RESOURCE STRINGS TO IDENTIFY METADATA ELEMENTS IN THE HTML DISPLAY -->

<xsl:template name="elementText">
	<xsl:param name="ele" />
	<xsl:choose>
		<xsl:when test="(ancestor::*[(name() = 'date') or (name() = 'dateInfo') or (name() = 'maintDate')])">
			<xsl:call-template name="citationDatesElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[(name() = 'mdContact') or (name() = 'idPoC') or (name() = 'usrCntInfo') or (name() = 'stepProc') or (name() = 'distorCont') or (name() = 'citRespParty') or (name() = 'extEleSrc') or (name() = 'maintCont') or (name() = 'responsibleParty') or (name() = 'addressee')])">
			<xsl:call-template name="contactsElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[(name() = 'cntOnlineRes') or (name() = 'onLineSrc') or (name() = 'extOnRes') or (name() = 'svConPt') or (name() = 'citOnlineRes') or (name() = 'mdLinkage') or (name() = 'bgLinkage') or (name() = 'graFileOnline') or (name() = 'swFileOnline')])">
			<xsl:call-template name="onlineResElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[(name() = 'idCitation') or (name() = 'thesaName') or (name() = 'identAuth') or (name() = 'srcCitatn') or (name() = 'evalProc') or (name() = 'conSpec') or (name() = 'paraCit') or (name() = 'portCatCit') or (name() = 'catCitation') or (name() = 'asName') or (name() = 'aggrDSName') or (name() = 'parentMdCit') or (name() = 'altMdReference') or (name() = 'ontology') or (name() = 'additionalDoc') or (name() = 'usrIssues') or (name() = 'metadataRef') or (name() = 'referenceDoc') or (name() = 'reportReference') or (name() = 'srcMetadata') or (name() = 'evalReferenceDoc') or (name() = 'fmtSpecCitation') or (name() = 'medCitation') or (name() = 'svOperDataset') or (name() = 'svProfile') or (name() = 'svStandard') or (name() = 'svResourceRef')])">
			<xsl:call-template name="citationElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[(name() = 'geoId') or (name() = 'refSysID') or (name() = 'srcRefSys') or (name() = 'RS_Identifier') or (name() = 'citId') or (name() = 'svResCitId') or (name() = 'imagQuCode') or (name() = 'prcTypCde') or (name() = 'measId') or (name() = 'aggrDSIdent') or (name() = 'metadataID') or (name() = 'medId') or (name() = 'partyId')])">
			<xsl:call-template name="identifierElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'eainfo'])">
			<xsl:call-template name="fieldsElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'Binary'])">
			<xsl:call-template name="binaryElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'Esri'])">
			<xsl:call-template name="esriElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'spatRepInfo'])">
			<xsl:call-template name="spatRepElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'spdoinfo'])">
			<xsl:call-template name="spdoinfoElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'contInfo'])">
			<xsl:call-template name="contInfoElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'dqInfo'])">
			<xsl:call-template name="dqInfoElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'appSchInfo'])">
			<xsl:call-template name="appSchElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'resultFile'])">
			<xsl:call-template name="mxFileElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'mdExtInfo'])">
			<xsl:call-template name="extensionElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="(ancestor::*[name() = 'MdCoRefSys'])">
			<xsl:call-template name="oldCoordsysElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise>
			<xsl:call-template name="otherElementText">
				<xsl:with-param name="ele" select="$ele" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="citationDatesElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Dates -->
		<xsl:when test="($eleName = 'createDate')"><res:Creation/></xsl:when>
		<xsl:when test="($eleName = 'pubDate')"><res:Publication/></xsl:when>
		<xsl:when test="($eleName = 'date') and (name($ele/..) = 'pubDate')"><res:IndeterminateDate/></xsl:when>
		<xsl:when test="($eleName = 'time') and (name($ele/..) = 'pubDate')"><res:IndeterminateTime/></xsl:when>
		<xsl:when test="($eleName = 'reviseDate')"><res:Revision/></xsl:when>
		<xsl:when test="($eleName = 'notavailDate')"><res:NotAvailable/></xsl:when>
		<xsl:when test="($eleName = 'inforceDate')"><res:InForce/></xsl:when>
		<xsl:when test="($eleName = 'adoptDate')"><res:Adoption/></xsl:when>
		<xsl:when test="($eleName = 'deprecDate')"><res:Deprecation/></xsl:when>
		<xsl:when test="($eleName = 'supersDate')"><res:Superseded/></xsl:when>
      <!-- ISO 19115-1 application schema info -->
		<xsl:when test="($eleName = 'expiryDate')"><res:expiryDate/></xsl:when>
		<xsl:when test="($eleName = 'lastUpdateDate')"><res:lastUpdateDate/></xsl:when>
		<xsl:when test="($eleName = 'lastRevisionDate')"><res:lastRevisionDate/></xsl:when>
		<xsl:when test="($eleName = 'nextUpdateDate')"><res:nextUpdateDate/></xsl:when>
		<xsl:when test="($eleName = 'validityBeginsDate')"><res:validityBeginsDate/></xsl:when>
		<xsl:when test="($eleName = 'validityExpiresDate')"><res:validityExpiresDate/></xsl:when>
		<xsl:when test="($eleName = 'releasedDate')"><res:releasedDate/></xsl:when>
		<xsl:when test="($eleName = 'distributionDate')"><res:distributionDate/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="contactsElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<xsl:when test="($eleName = 'extEleSrc')"><res:extEleSrc/></xsl:when>
		<xsl:when test="($eleName = 'rpIndName')"><res:rpIndName/></xsl:when>
		<xsl:when test="($eleName = 'rpOrgName')"><res:rpOrgName/></xsl:when>
		<xsl:when test="($eleName = 'rpPosName')"><res:rpPosName/></xsl:when>
		<xsl:when test="($eleName = 'role')"><res:role/></xsl:when>
      <!-- ISO 19115-1 party info -->
		<xsl:when test="($eleName = 'partyExt')"><res:partyExt/></xsl:when>
		<xsl:when test="($eleName = 'partyId')"><res:partyId/></xsl:when>
		<xsl:when test="($eleName = 'logo')"><res:logo/></xsl:when>
		<xsl:when test="($eleName = 'extraCntInfo')"><res:extraCntInfo/></xsl:when>
		<xsl:when test="($eleName = 'individual')"><res:individual/></xsl:when>
		<xsl:when test="($eleName = 'extraOrg')"><res:extraOrg/></xsl:when>
		<xsl:when test="($eleName = 'extraIndividual')"><res:extraIndividual/></xsl:when>
		<!-- Contact Information -->
		<xsl:when test="($eleName = 'rpCntInfo')"><res:rpCntInfo/></xsl:when>
		<xsl:when test="($eleName = 'cntHours')"><res:cntHours/></xsl:when>
		<xsl:when test="($eleName = 'cntInstr')"><res:cntInstr/></xsl:when>
      <!-- ISO 19115-1 contact info -->
		<xsl:when test="($eleName = 'extraAddress')"><res:extraAddress/></xsl:when>
		<xsl:when test="($eleName = 'contactType')"><res:contactType/></xsl:when>
		<!-- Address -->
		<xsl:when test="($eleName = 'cntAddress')"><res:cntAddress/></xsl:when>
		<xsl:when test="($eleName = 'addressType')"><res:addressType/></xsl:when>
		<xsl:when test="($eleName = 'delPoint')"><res:delPoint/></xsl:when>
		<xsl:when test="($eleName = 'city')"><res:city/></xsl:when>
		<xsl:when test="($eleName = 'adminArea')"><res:adminArea/></xsl:when>
		<xsl:when test="($eleName = 'postCode')"><res:postCode/></xsl:when>
		<xsl:when test="($eleName = 'country')"><res:country/></xsl:when>
		<xsl:when test="($eleName = 'eMailAdd')"><res:eMailAdd/></xsl:when>
		<!-- Telephone -->
		<xsl:when test="($eleName = 'cntPhone')"><res:cntPhone/></xsl:when>
		<xsl:when test="($eleName = 'voiceNum') and (@tddtty = 'True')"><res:tddttyNum/></xsl:when>
		<xsl:when test="($eleName = 'voiceNum') and not(@tddtty = 'True')"><res:voiceNum/></xsl:when>
		<xsl:when test="($eleName = 'faxNum')"><res:faxNum/></xsl:when>
      <!-- ISO 19115-1 contact info -->
		<xsl:when test="($eleName = 'smsNum')"><res:smsNum/></xsl:when>
		<!-- Online Resource -->
		<xsl:when test="($eleName = 'cntOnlineRes')"><res:onLineRes/></xsl:when>
		<xsl:when test="($eleName = 'citOnlineRes')"><res:citOnlineRes/></xsl:when>
		<xsl:when test="($eleName = 'linkage')"><res:linkage/></xsl:when>
		<xsl:when test="($eleName = 'protocol')"><res:protocol/></xsl:when>
		<xsl:when test="($eleName = 'orName')"><res:orName/></xsl:when>
		<xsl:when test="($eleName = 'orFunct')"><res:orFunct/></xsl:when>
		<xsl:when test="($eleName = 'orDesc')"><res:orDesc/></xsl:when>
		<xsl:when test="($eleName = 'appProfile')"><res:appProfile/></xsl:when>
      <!-- ISO 19115-1 online resource info -->
		<xsl:when test="($eleName = 'protocolRequest')"><res:protocolRequest/></xsl:when>
		<!-- Identifiers -->
		<xsl:when test="($eleName = 'identAuth')"><res:identAuth/></xsl:when>
		<xsl:when test="($eleName = 'code') and (name($ele/..) = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'idCodeSpace')"><res:idCodeSpace/></xsl:when>
		<xsl:when test="($eleName = 'idVersion')"><res:idVersion/></xsl:when>
      <!-- ISO 19115-1 identifier info -->
		<xsl:when test="($eleName = 'idDescription')"><res:IDdescription/></xsl:when>
		<!-- Browse Graphic -->
		<xsl:when test="($eleName = 'graphOver')"><res:graphOver/></xsl:when>
		<xsl:when test="($eleName = 'bgFileName')"><res:bgFileName/></xsl:when>
		<xsl:when test="($eleName = 'bgFileType')"><res:bgFileType/></xsl:when>
		<xsl:when test="($eleName = 'bgFileDesc')"><res:bgFileDesc/></xsl:when>
      <!-- ISO 19115-1 browse graphic info -->
		<xsl:when test="($eleName = 'bgConsts')"><res:bgConsts/></xsl:when>
		<xsl:when test="($eleName = 'bgLinkage')"><res:bgLinkage/></xsl:when>
		<!-- Constraints -->
		<xsl:when test="($eleName = 'Consts')"><res:Consts/></xsl:when>
		<xsl:when test="($eleName = 'useLimit')"><res:useLimit/></xsl:when>
		<xsl:when test="($eleName = 'LegConsts')"><res:LegConsts/></xsl:when>
		<xsl:when test="($eleName = 'accessConsts')"><res:accessConsts/></xsl:when>
		<xsl:when test="($eleName = 'useConsts')"><res:useConsts/></xsl:when>
		<xsl:when test="($eleName = 'othConsts')"><res:othConsts/></xsl:when>
		<xsl:when test="($eleName = 'SecConsts')"><res:SecConsts/></xsl:when>
		<xsl:when test="($eleName = 'class')"><res:classification/></xsl:when>
		<xsl:when test="($eleName = 'classSys')"><res:classSys/></xsl:when>
		<xsl:when test="($eleName = 'userNote')"><res:userNote/></xsl:when>
		<xsl:when test="($eleName = 'handDesc')"><res:handDesc/></xsl:when>
      <!-- ISO 19115-1 constraint info -->
		<xsl:when test="($eleName = 'applicationScope')"><res:applicationScope/></xsl:when>
		<xsl:when test="($eleName = 'constsGraphic')"><res:constsGraphic/></xsl:when>
		<xsl:when test="($eleName = 'referenceDoc')"><res:referenceDoc/></xsl:when>
		<xsl:when test="($eleName = 'releasability')"><res:releasability/></xsl:when>
		<xsl:when test="($eleName = 'responsibleParty')"><res:constRespParty/></xsl:when>
		<xsl:when test="($eleName = 'addressee')"><res:addressee/></xsl:when>
		<xsl:when test="($eleName = 'disseminationConsts')"><res:disseminationConsts/></xsl:when>
		<xsl:when test="($eleName = 'statement') and (name($ele/..) = 'releasability')"><res:releasabilityStatement/></xsl:when>
		<!-- Extent -->
		<xsl:when test="($eleName = 'exDesc')"><res:exDesc/></xsl:when>
		<!-- Geographic Extent -->
		<xsl:when test="($eleName = 'geoEle')"><res:geoEle/></xsl:when>
		<xsl:when test="($eleName = 'GeoBndBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'nativeExtBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'geoBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'esriExtentType')"><res:attExtentType/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoBox') or (name($ele/..) = 'GeoBndBox') or (name($ele/..) = 'nativeExtBox'))"><res:exTypeCode1/></xsl:when>
		<xsl:when test="($eleName = 'westBL')"><res:westBL/></xsl:when>
		<xsl:when test="($eleName = 'eastBL')"><res:eastBL/></xsl:when>
		<xsl:when test="($eleName = 'northBL')"><res:northBL/></xsl:when>
		<xsl:when test="($eleName = 'southBL')"><res:southBL/></xsl:when>
		<xsl:when test="($eleName = 'geoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'GeoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoDesc') or (name($ele/..) = 'GeoDesc'))"><res:exTypeCode2/></xsl:when>
		<xsl:when test="($eleName = 'geoId')"><res:geoId/></xsl:when>
		<xsl:when test="($eleName = 'BoundPoly')"><res:BoundPoly/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and (name($ele/..) = 'BoundPoly')"><res:exTypeCode/></xsl:when>
		<xsl:when test="($eleName = 'polygon')"><res:polygon/></xsl:when>
		<xsl:when test="($eleName = 'exterior')"><res:exterior/></xsl:when>
		<xsl:when test="($eleName = 'interior')"><res:interior/></xsl:when>
		<xsl:when test="($eleName = 'pos') and ((name($ele/..) = 'exterior') or (name($ele/..) = 'interior') or (name($ele/..) = 'cornerPts'))"><res:pos/></xsl:when>
		<xsl:when test="($eleName = 'posList')"><res:posList/></xsl:when>
		<xsl:when test="($eleName = 'coordinates')"><res:polygonCoordinates/></xsl:when>
		<xsl:when test="($eleName = 'MdCoRefSys') and (name($ele/..) = 'GM_Polygon')"><res:polygonMdCoRefSys/></xsl:when>
		<xsl:when test="($eleName = 'exSpat')"><res:exSpat/></xsl:when>
      <!-- ISO 19115-1 extent info -->
		<xsl:when test="($eleName = 'exVert')"><res:vertEle/></xsl:when>
		<!-- Vertical Extent -->
		<xsl:when test="($eleName = 'vertEle')"><res:vertEle/></xsl:when>
		<xsl:when test="($eleName = 'vertMinVal')"><res:vertMinVal/></xsl:when>
		<xsl:when test="($eleName = 'vertMaxVal')"><res:vertMaxVal/></xsl:when>
		<xsl:when test="($eleName = 'vertUoM')"><res:vertUoM/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:uomName/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOstandardUnit/></xsl:when>
		<xsl:when test="($eleName = 'datumID')"><res:datumID/></xsl:when>
		<!-- Temporal Extent -->
		<xsl:when test="($eleName = 'TempExtent')"><res:TempExtent/></xsl:when>
		<xsl:when test="($eleName = 'tmPosition')"><res:tmPosition/></xsl:when>
		<xsl:when test="($eleName = 'tmBegin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'tmEnd')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'date') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateDate/></xsl:when>
		<xsl:when test="($eleName = 'time') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateTime/></xsl:when>
		<xsl:when test="($eleName = 'begin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'end')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'calDate')"><res:calDate/></xsl:when>
		<xsl:when test="($eleName = 'clkTime')"><res:clkTime/></xsl:when>
		<xsl:when test="($eleName = 'SpatTempEx')"><res:SpatTempEx/></xsl:when>
		<xsl:when test="($eleName = 'exTemp')"><res:exTemp/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="onlineResElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<xsl:when test="($eleName = 'linkage')"><res:linkage/></xsl:when>
		<xsl:when test="($eleName = 'protocol')"><res:protocol/></xsl:when>
		<xsl:when test="($eleName = 'orName')"><res:orName/></xsl:when>
		<xsl:when test="($eleName = 'orFunct')"><res:orFunct/></xsl:when>
		<xsl:when test="($eleName = 'orDesc')"><res:orDesc/></xsl:when>
		<xsl:when test="($eleName = 'appProfile')"><res:appProfile/></xsl:when>
      <!-- ISO 19115-1 online resource info -->
		<xsl:when test="($eleName = 'protocolRequest')"><res:protocolRequest/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="citationElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<xsl:when test="($eleName = 'resTitle')"><res:resTitle/></xsl:when>
		<xsl:when test="($eleName = 'resAltTitle')"><res:resAltTitle/></xsl:when>
		<xsl:when test="($eleName = 'resEd')"><res:resEd/></xsl:when>
		<xsl:when test="($eleName = 'resEdDate')"><res:resEdDate/></xsl:when>
		<xsl:when test="($eleName = 'presForm')"><res:presForm/></xsl:when>
		<xsl:when test="($eleName = 'fgdcGeoform')"><res:fgdcGeoform/></xsl:when>
		<xsl:when test="($eleName = 'collTitle')"><res:collTitle/></xsl:when>
		<xsl:when test="($eleName = 'isbn')"><res:isbn/></xsl:when>
		<xsl:when test="($eleName = 'issn')"><res:issn/></xsl:when>
		<xsl:when test="($eleName = 'citId')"><res:citId/></xsl:when>
		<xsl:when test="($eleName = 'citIdType')"><res:citIdType/></xsl:when>
		<xsl:when test="($eleName = 'otherCitDet')"><res:otherCitDet/></xsl:when>
		<xsl:when test="($eleName = 'citRespParty')"><res:citRespParty/></xsl:when>
		<xsl:when test="($eleName = 'rpCntInfo')"><res:rpCntInfo/></xsl:when>
		<!-- Series -->
		<xsl:when test="($eleName = 'datasetSeries')"><res:datasetSeries/></xsl:when>
		<xsl:when test="($eleName = 'seriesName')"><res:seriesName/></xsl:when>
		<xsl:when test="($eleName = 'issId')"><res:issId/></xsl:when>
		<xsl:when test="($eleName = 'artPage')"><res:artPage/></xsl:when>
		<!-- Identifiers -->
		<xsl:when test="($eleName = 'identAuth')"><res:identAuth/></xsl:when>
		<xsl:when test="($eleName = 'code') and (name($ele/..) = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'idCodeSpace')"><res:idCodeSpace/></xsl:when>
		<xsl:when test="($eleName = 'idVersion')"><res:idVersion/></xsl:when>
      <!-- ISO 19115-1 identifier info -->
		<xsl:when test="($eleName = 'idDescription')"><res:IDdescription/></xsl:when>
		<!-- Online Resource -->
		<xsl:when test="($eleName = 'citOnlineRes')"><res:citOnlineRes/></xsl:when>
		<xsl:when test="($eleName = 'linkage')"><res:linkage/></xsl:when>
		<xsl:when test="($eleName = 'protocol')"><res:protocol/></xsl:when>
		<xsl:when test="($eleName = 'orName')"><res:orName/></xsl:when>
		<xsl:when test="($eleName = 'orFunct')"><res:orFunct/></xsl:when>
		<xsl:when test="($eleName = 'orDesc')"><res:orDesc/></xsl:when>
		<xsl:when test="($eleName = 'appProfile')"><res:appProfile/></xsl:when>
      <!-- ISO 19115-1 online resource info -->
		<xsl:when test="($eleName = 'protocolRequest')"><res:protocolRequest/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="identifierElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<xsl:when test="($eleName = 'identAuth')"><res:identAuth/></xsl:when>
		<xsl:when test="($eleName = 'code') and (name($ele/..) = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'identCode')"><res:identCode/></xsl:when>
		<xsl:when test="($eleName = 'idCodeSpace')"><res:idCodeSpace/></xsl:when>
		<xsl:when test="($eleName = 'idVersion')"><res:idVersion/></xsl:when>
      <!-- ISO 19115-1 identifier info -->
		<xsl:when test="($eleName = 'idDescription')"><res:IDdescription/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="otherElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Metadata Info -->
		<xsl:when test="($eleName = 'mdLang')"><res:mdLang/></xsl:when>
		<xsl:when test="($eleName = 'mdChar')"><res:mdChar/></xsl:when>
		<xsl:when test="($eleName = 'mdFileID')"><res:mdFileID/></xsl:when>
		<xsl:when test="($eleName = 'mdParentID')"><res:mdParentID/></xsl:when>
		<xsl:when test="($eleName = 'dataSetURI')"><res:dataSetURI/></xsl:when>
		<xsl:when test="($eleName = 'dataSetFn')"><res:dataSetFn/></xsl:when>
		<xsl:when test="($eleName = 'mdHrLv')"><res:mdHrLv/></xsl:when>
		<xsl:when test="($eleName = 'mdHrLvName')"><res:mdHrLvName/></xsl:when>
		<xsl:when test="($eleName = 'mdDateSt')"><res:mdDateSt/></xsl:when>
		<xsl:when test="($eleName = 'mdConst')"><res:mdConst/></xsl:when>
		<xsl:when test="($eleName = 'mdStanName')"><res:mdStanName/></xsl:when>
		<xsl:when test="($eleName = 'mdStanVer')"><res:mdStanVer/></xsl:when>
      <!-- ISO 19115-1 metadata info -->
		<xsl:when test="($eleName = 'metadataID')"><res:metadataID/></xsl:when>
		<xsl:when test="($eleName = 'parentMdCit')"><res:parentMdCit/></xsl:when>
		<xsl:when test="($eleName = 'dateInfo')"><res:dateInfo/></xsl:when>
		<xsl:when test="($eleName = 'altMdReference')"><res:altMdReference/></xsl:when>
		<xsl:when test="($eleName = 'mdLinkage')"><res:mdLinkage/></xsl:when>
		<!-- Maintenance -->
		<xsl:when test="($eleName = 'resMaint')"><res:resMaint/></xsl:when>
		<xsl:when test="($eleName = 'mdMaint')"><res:resOtherwise/></xsl:when>
		<xsl:when test="($eleName = 'dateNext')"><res:dateNext/></xsl:when>
		<xsl:when test="($eleName = 'maintFreq')"><res:maintFreq/></xsl:when>
		<xsl:when test="($eleName = 'maintScp')"><res:maintScp/></xsl:when>
		<xsl:when test="($eleName = 'maintNote')"><res:maintNote/></xsl:when>
		<xsl:when test="($eleName = 'usrDefFreq')"><res:usrDefFreq/></xsl:when>
		<xsl:when test="($eleName = 'duration')"><res:duration/></xsl:when>
		<xsl:when test="($eleName = 'designator')"><res:designator/></xsl:when>
		<xsl:when test="($eleName = 'years')"><res:years/></xsl:when>
		<xsl:when test="($eleName = 'months')"><res:months/></xsl:when>
		<xsl:when test="($eleName = 'days')"><res:days/></xsl:when>
		<xsl:when test="($eleName = 'timeIndicator')"><res:timeIndicator/></xsl:when>
		<xsl:when test="($eleName = 'hours')"><res:hours/></xsl:when>
		<xsl:when test="($eleName = 'minutes')"><res:minutes/></xsl:when>
		<xsl:when test="($eleName = 'seconds')"><res:seconds/></xsl:when>
      <!-- ISO 19115-1 maintenance info -->
		<xsl:when test="($eleName = 'maintDate')"><res:maintDate/></xsl:when>
		<xsl:when test="($eleName = 'maintScpExt')"><res:maintScpExt/></xsl:when>
		<!-- Scope Description -->
		<xsl:when test="($eleName = 'scpLvl')"><res:scpLvl/></xsl:when>
		<xsl:when test="($eleName = 'scpLvlDesc')"><res:scpLvlDesc/></xsl:when>
		<xsl:when test="($eleName = 'upScpDesc')"><res:scpLvlDesc/></xsl:when>
		<xsl:when test="($eleName = 'attribSet')"><res:attribSet/></xsl:when>
		<xsl:when test="($eleName = 'featSet')"><res:featSet/></xsl:when>
		<xsl:when test="($eleName = 'featIntSet')"><res:featIntSet/></xsl:when>
		<xsl:when test="($eleName = 'attribIntSet')"><res:attribIntSet/></xsl:when>
		<xsl:when test="($eleName = 'datasetSet')"><res:dataSet/></xsl:when>
		<xsl:when test="($eleName = 'other')"><res:other/></xsl:when>
		<!-- Constraints -->
		<xsl:when test="($eleName = 'resConst')"><res:resConst/></xsl:when>
		<xsl:when test="($eleName = 'Consts')"><res:Consts/></xsl:when>
		<xsl:when test="($eleName = 'useLimit')"><res:useLimit/></xsl:when>
		<xsl:when test="($eleName = 'LegConsts')"><res:LegConsts/></xsl:when>
		<xsl:when test="($eleName = 'accessConsts')"><res:accessConsts/></xsl:when>
		<xsl:when test="($eleName = 'useConsts')"><res:useConsts/></xsl:when>
		<xsl:when test="($eleName = 'othConsts')"><res:othConsts/></xsl:when>
		<xsl:when test="($eleName = 'SecConsts')"><res:SecConsts/></xsl:when>
		<xsl:when test="($eleName = 'class')"><res:classification/></xsl:when>
		<xsl:when test="($eleName = 'classSys')"><res:classSys/></xsl:when>
		<xsl:when test="($eleName = 'userNote')"><res:userNote/></xsl:when>
		<xsl:when test="($eleName = 'handDesc')"><res:handDesc/></xsl:when>
		<xsl:when test="($eleName = 'inspirePublicAccessLimits')"><res:INSPIRE_LOPA/></xsl:when>
		<xsl:when test="($eleName = 'inspireAccessUseConditions')"><res:INSPIRE_CAAU/></xsl:when>
      <!-- ISO 19115-1 constraint info -->
		<xsl:when test="($eleName = 'applicationScope')"><res:applicationScope/></xsl:when>
		<xsl:when test="($eleName = 'constsGraphic')"><res:constsGraphic/></xsl:when>
		<xsl:when test="($eleName = 'referenceDoc')"><res:referenceDoc/></xsl:when>
		<xsl:when test="($eleName = 'releasability')"><res:releasability/></xsl:when>
		<xsl:when test="($eleName = 'responsibleParty')"><res:constRespParty/></xsl:when>
		<xsl:when test="($eleName = 'addressee')"><res:addressee/></xsl:when>
		<xsl:when test="($eleName = 'disseminationConsts')"><res:disseminationConsts/></xsl:when>
		<xsl:when test="($eleName = 'statement') and (name($ele/..) = 'releasability')"><res:releasabilityStatement/></xsl:when>
		<!-- Identification -->
		<xsl:when test="($eleName = 'tpCat')"><res:tpCat/></xsl:when>
		<xsl:when test="($eleName = 'idAbs')"><res:idAbs/></xsl:when>
		<xsl:when test="($eleName = 'idPurp')"><res:idPurp/></xsl:when>
		<xsl:when test="($eleName = 'dataLang')"><res:dataLang/></xsl:when>
		<xsl:when test="($eleName = 'dataChar')"><res:dataChar/></xsl:when>
		<xsl:when test="($eleName = 'idStatus')"><res:idStatus/></xsl:when>
		<xsl:when test="($eleName = 'spatRpType')"><res:spatRpType/></xsl:when>
		<xsl:when test="($eleName = 'envirDesc')"><res:envirDesc/></xsl:when>
		<xsl:when test="($eleName = 'suppInfo')"><res:suppInfo/></xsl:when>
		<xsl:when test="($eleName = 'idCredit')"><res:idCredit/></xsl:when>
		<!-- Services -->
		<xsl:when test="($eleName = 'genericName') and (name($ele/..) = 'svType')"><res:svType/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'svType')"><res:svType_codespace/></xsl:when>
		<xsl:when test="($eleName = 'svTypeVer')"><res:svTypeVer/></xsl:when>
		<xsl:when test="($eleName = 'serType')"><res:serType/></xsl:when>
		<xsl:when test="($eleName = 'typeProps')"><res:typeProps/></xsl:when>
		<xsl:when test="($eleName = 'svCouplRes')"><res:svCouplRes/></xsl:when>
		<xsl:when test="($eleName = 'svOpName') and (name($ele/..) = 'svCouplRes')"><res:svOpName/></xsl:when>
		<xsl:when test="($eleName = 'svOpName') and (name($ele/..) = 'svOper')"><res:svOpName_0/></xsl:when>
		<xsl:when test="($eleName = 'svCouplType')"><res:svCouplType/></xsl:when>
		<xsl:when test="($eleName = 'svOper')"><res:svOper/></xsl:when>
		<xsl:when test="($eleName = 'svOperOn')"><res:svOperOn/></xsl:when>
		<xsl:when test="($eleName = 'svDesc')"><res:svDesc/></xsl:when>
		<xsl:when test="($eleName = 'svInvocName')"><res:svInvocName/></xsl:when>
		<xsl:when test="($eleName = 'svDCP')"><res:svDCP/></xsl:when>
		<xsl:when test="($eleName = 'svParams')"><res:svParams/></xsl:when>
		<xsl:when test="($eleName = 'svParName')"><res:svParName/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'genericName')"><res:genericName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'aName') and (name($ele/..) = 'attributeType')"><res:attributeType/></xsl:when>
		<xsl:when test="($eleName = 'aName')"><res:aName/></xsl:when>
		<xsl:when test="($eleName = 'svDesc')"><res:svDesc/></xsl:when>
		<xsl:when test="($eleName = 'svParDir')"><res:svParDir/></xsl:when>
		<xsl:when test="($eleName = 'svParOpt')"><res:svParOpt/></xsl:when>
		<xsl:when test="($eleName = 'svRepeat')"><res:svRepeat/></xsl:when>
		<xsl:when test="($eleName = 'svValType')"><res:svValType/></xsl:when>
      <!-- ISO 19115-1 service info -->
		<xsl:when test="($eleName = 'svOperDataset')"><res:svOperDataset/></xsl:when>
		<xsl:when test="($eleName = 'svProfile')"><res:svProfile/></xsl:when>
		<xsl:when test="($eleName = 'svStandard')"><res:svStandard/></xsl:when>
		<xsl:when test="($eleName = 'svResourceRef')"><res:svResourceRef/></xsl:when>
		<xsl:when test="($eleName = 'svOperDefinition')"><res:svOperDefinition/></xsl:when>
		<xsl:when test="($eleName = 'svOperChain')"><res:svOperChain/></xsl:when>
		<xsl:when test="($eleName = 'svChainName')"><res:svChainName/></xsl:when>
		<xsl:when test="($eleName = 'svChainDesc')"><res:svChainDesc/></xsl:when>
		<xsl:when test="($eleName = 'svOperOrdered')"><res:svOperOrdered/></xsl:when>
		<xsl:when test="($eleName = 'order')"><res:order/></xsl:when>
		<!-- Keywords -->
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'searchKeys')"><res:tagsForSearching/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'discKeys')"><res:discKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'placeKeys')"><res:placeKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'stratKeys')"><res:stratKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'tempKeys')"><res:tempKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'themeKeys')"><res:themeKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'otherKeys')"><res:otherKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'productKeys')"><res:productKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'subTopicCatKeys')"><res:subTopicCatKeys/></xsl:when>
		<xsl:when test="($eleName = 'thesaLang')"><res:thesaLang/></xsl:when>
      <!-- ISO 19115-1 keyword info -->
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'taxonKeys')"><res:taxonKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'dataCentreKeys')"><res:dataCentreKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'featureTypeKeys')"><res:featureTypeKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'instrumentKeys')"><res:instrumentKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'platformKeys')"><res:platformKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'processKeys')"><res:processKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'projectKeys')"><res:projectKeys/></xsl:when>
		<xsl:when test="($eleName = 'keyword') and (name($ele/..) = 'serviceKeys')"><res:serviceKeys/></xsl:when>
		<xsl:when test="($eleName = 'keywordClass')"><res:keywordClass/></xsl:when>
		<xsl:when test="($eleName = 'className')"><res:className/></xsl:when>
		<xsl:when test="($eleName = 'conceptId')"><res:conceptId/></xsl:when>
		<xsl:when test="($eleName = 'ontology')"><res:ontology/></xsl:when>
		<!-- Browse Graphic -->
		<xsl:when test="($eleName = 'graphOver')"><res:graphOver/></xsl:when>
		<xsl:when test="($eleName = 'bgFileName')"><res:bgFileName/></xsl:when>
		<xsl:when test="($eleName = 'bgFileType')"><res:bgFileType/></xsl:when>
		<xsl:when test="($eleName = 'bgFileDesc')"><res:bgFileDesc/></xsl:when>
      <!-- ISO 19115-1 browse graphic info -->
		<xsl:when test="($eleName = 'bgConsts')"><res:bgConsts/></xsl:when>
		<xsl:when test="($eleName = 'bgLinkage')"><res:bgLinkage/></xsl:when>
		<!-- Usage -->
		<xsl:when test="($eleName = 'idSpecUse')"><res:idSpecUse/></xsl:when>
		<xsl:when test="($eleName = 'usageDate')"><res:usageDate/></xsl:when>
		<xsl:when test="($eleName = 'specUsage')"><res:specUsage/></xsl:when>
		<xsl:when test="($eleName = 'usrDetLim')"><res:usrDetLim/></xsl:when>
      <!-- ISO 19115-1 usage info -->
		<xsl:when test="($eleName = 'usageDateGml')"><res:usageDateGml/></xsl:when>
		<xsl:when test="($eleName = 'usageDateTime')"><res:usageDateTime/></xsl:when>
		<xsl:when test="($eleName = 'usrResponse')"><res:usrResponse/></xsl:when>
		<xsl:when test="($eleName = 'additionalDoc')"><res:additionalDoc/></xsl:when>
		<xsl:when test="($eleName = 'usrIssues')"><res:usrIssues/></xsl:when>
		<!-- GML attributes -->
		<xsl:when test="($eleName = 'gmlAttributes')"><res:gmlAttributes/></xsl:when>
		<xsl:when test="($eleName = 'gmlID')"><res:gmlID/></xsl:when>
		<xsl:when test="($eleName = 'gmlDesc')"><res:gmlDesc/></xsl:when>
		<xsl:when test="($eleName = 'gmlDescRef')"><res:gmlDescRef/></xsl:when>
		<xsl:when test="($eleName = 'gmlIdent')"><res:gmlIdent/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlIdent')"><res:gmlIdent_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlName')"><res:gmlName/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlName')"><res:gmlName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlRemarks')"><res:gmlRemarks/></xsl:when>
		<!-- Aggregates -->
		<xsl:when test="($eleName = 'aggrInfo')"><res:aggrInfo/></xsl:when>
		<xsl:when test="($eleName = 'assocType')"><res:assocType/></xsl:when>
		<xsl:when test="($eleName = 'initType')"><res:initType/></xsl:when>
      <!-- ISO 19115-1 aggregate info -->
		<xsl:when test="($eleName = 'metadataRef')"><res:metadataRef/></xsl:when>
		<!-- Scale -->
		<xsl:when test="($eleName = 'dataScale')"><res:dataScale/></xsl:when>
		<xsl:when test="($eleName = 'scaleDist')"><res:scaleDist/></xsl:when>
		<xsl:when test="($eleName = 'value') and ((name($ele/..) = 'scaleDist') or (name($ele/..) = 'verticalDist') or (name($ele/..) = 'angularDist'))"><res:value/></xsl:when>
		<xsl:when test="($eleName = 'equScale')"><res:equScale/></xsl:when>
		<xsl:when test="($eleName = 'srcScale')"><res:srcScale/></xsl:when>
		<xsl:when test="($eleName = 'rfDenom')"><res:rfDenom/></xsl:when>
		<xsl:when test="($eleName = 'Scale')"><res:Scale/></xsl:when>
      <!-- ISO 19115-1 resolution info -->
		<xsl:when test="($eleName = 'verticalDist')"><res:verticalDist/></xsl:when>
		<xsl:when test="($eleName = 'angularDist')"><res:angularDist/></xsl:when>
		<xsl:when test="($eleName = 'levelOfDetail')"><res:levelOfDetail/></xsl:when>
		<!-- Extent -->
		<xsl:when test="($eleName = 'dataExt')"><res:dataExt/></xsl:when>
		<xsl:when test="($eleName = 'scpExt')"><res:scpExt/></xsl:when>
		<xsl:when test="($eleName = 'srcExt')"><res:srcExt/></xsl:when>
		<xsl:when test="($eleName = 'svExt')"><res:svExt/></xsl:when>
		<xsl:when test="($eleName = 'exDesc')"><res:exDesc/></xsl:when>
		<!-- Geographic Extent -->
		<xsl:when test="($eleName = 'geoEle')"><res:geoEle/></xsl:when>
		<xsl:when test="($eleName = 'GeoBndBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'nativeExtBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'geoBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'esriExtentType')"><res:attExtentType/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoBox') or (name($ele/..) = 'GeoBndBox') or (name($ele/..) = 'nativeExtBox'))"><res:exTypeCode1/></xsl:when>
		<xsl:when test="($eleName = 'westBL')"><res:westBL/></xsl:when>
		<xsl:when test="($eleName = 'eastBL')"><res:eastBL/></xsl:when>
		<xsl:when test="($eleName = 'northBL')"><res:northBL/></xsl:when>
		<xsl:when test="($eleName = 'southBL')"><res:southBL/></xsl:when>
		<xsl:when test="($eleName = 'geoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'GeoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoDesc') or (name($ele/..) = 'GeoDesc'))"><res:exTypeCode2/></xsl:when>
		<xsl:when test="($eleName = 'geoId')"><res:geoId/></xsl:when>
		<xsl:when test="($eleName = 'BoundPoly')"><res:BoundPoly/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and (name($ele/..) = 'BoundPoly')"><res:exTypeCode/></xsl:when>
		<xsl:when test="($eleName = 'polygon')"><res:polygon/></xsl:when>
		<xsl:when test="($eleName = 'exterior')"><res:exterior/></xsl:when>
		<xsl:when test="($eleName = 'interior')"><res:interior/></xsl:when>
		<xsl:when test="($eleName = 'pos') and ((name($ele/..) = 'exterior') or (name($ele/..) = 'interior') or (name($ele/..) = 'cornerPts'))"><res:pos/></xsl:when>
		<xsl:when test="($eleName = 'posList')"><res:posList/></xsl:when>
		<xsl:when test="($eleName = 'coordinates')"><res:polygonCoordinates/></xsl:when>
		<xsl:when test="($eleName = 'MdCoRefSys') and (name($ele/..) = 'GM_Polygon')"><res:polygonMdCoRefSys/></xsl:when>
		<xsl:when test="($eleName = 'exSpat')"><res:exSpat/></xsl:when>
      <!-- ISO 19115-1 extent info -->
		<xsl:when test="($eleName = 'exVert')"><res:vertEle/></xsl:when>
		<!-- Vertical Extent -->
		<xsl:when test="($eleName = 'vertEle')"><res:vertEle/></xsl:when>
		<xsl:when test="($eleName = 'vertMinVal')"><res:vertMinVal/></xsl:when>
		<xsl:when test="($eleName = 'vertMaxVal')"><res:vertMaxVal/></xsl:when>
		<xsl:when test="($eleName = 'vertUoM')"><res:vertUoM/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:uomName/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOstandardUnit/></xsl:when>
		<xsl:when test="($eleName = 'datumID')"><res:datumID/></xsl:when>
		<!-- Temporal Extent -->
		<xsl:when test="($eleName = 'TempExtent')"><res:TempExtent/></xsl:when>
		<xsl:when test="($eleName = 'tmPosition')"><res:tmPosition/></xsl:when>
		<xsl:when test="($eleName = 'tmBegin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'tmEnd')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'date') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateDate/></xsl:when>
		<xsl:when test="($eleName = 'time') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateTime/></xsl:when>
		<xsl:when test="($eleName = 'begin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'end')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'calDate')"><res:calDate/></xsl:when>
		<xsl:when test="($eleName = 'clkTime')"><res:clkTime/></xsl:when>
		<xsl:when test="($eleName = 'SpatTempEx')"><res:SpatTempEx/></xsl:when>
		<xsl:when test="($eleName = 'exTemp')"><res:exTemp/></xsl:when>
		<!-- Reference System -->
		<xsl:when test="($eleName = 'refSysID')"><res:refSysID/></xsl:when>
		<xsl:when test="($eleName = 'srcRefSys')"><res:srcRefSys/></xsl:when>
		<xsl:when test="($eleName = 'dimension')"><res:IDDimension/></xsl:when> <!-- works for both reference system and positional accuracy -->
      <!-- ISO 19115-1 resolution info -->
		<xsl:when test="($eleName = 'refSysType')"><res:refSysType/></xsl:when>
		<!-- Distributor -->
		<xsl:when test="($eleName = 'distributor')"><res:distributor/></xsl:when>
		<xsl:when test="($eleName = 'formatDist')"><res:distributor/></xsl:when>
      <!-- ISO 19115-1 distributor info -->
		<xsl:when test="($eleName = 'distDescription')"><res:distDescription/></xsl:when>
		<!-- Format -->
		<xsl:when test="($eleName = 'dsFormat')"><res:dsFormat/></xsl:when>
		<xsl:when test="($eleName = 'distorFormat')"><res:distorFormat/></xsl:when>
		<xsl:when test="($eleName = 'distFormat')"><res:distFormat/></xsl:when>
		<xsl:when test="($eleName = 'formatName')"><res:formatName/></xsl:when>
		<xsl:when test="($eleName = 'formatVer')"><res:formatVer/></xsl:when>
		<xsl:when test="($eleName = 'formatAmdNum')"><res:formatAmdNum/></xsl:when>
		<xsl:when test="($eleName = 'formatSpec')"><res:formatSpec/></xsl:when>
		<xsl:when test="($eleName = 'fileDecmTech')"><res:fileDecmTech/></xsl:when>
		<xsl:when test="($eleName = 'formatInfo')"><res:formatInfo/></xsl:when>
		<xsl:when test="($eleName = 'formatTech')"><res:formatTech/></xsl:when>
      <!-- ISO 19115-1 distributor info -->
		<xsl:when test="($eleName = 'fmtSpecCitation')"><res:fmtSpecCitation/></xsl:when>
		<xsl:when test="($eleName = 'medium')"><res:medium/></xsl:when>
		<!-- Order Process -->
		<xsl:when test="($eleName = 'distorOrdPrc')"><res:distorOrdPrc/></xsl:when>
		<xsl:when test="($eleName = 'svAccProps')"><res:svAccProps/></xsl:when>
		<xsl:when test="($eleName = 'resFees')"><res:resFees/></xsl:when>
		<xsl:when test="($eleName = 'units')"><res:units/></xsl:when>
		<xsl:when test="($eleName = 'planAvDtTm')"><res:planAvDtTm/></xsl:when>
		<xsl:when test="($eleName = 'planAvTmPd')"><res:planAvTmPd/></xsl:when>
		<xsl:when test="($eleName = 'ordTurn')"><res:ordTurn/></xsl:when>
		<xsl:when test="($eleName = 'ordInstr')"><res:ordInstr/></xsl:when>
      <!-- ISO 19115-1 order info -->
		<xsl:when test="($eleName = 'ordOptionsType')"><res:ordOptionsType/></xsl:when>
		<xsl:when test="($eleName = 'ordOptions')"><res:ordOptionsVal/></xsl:when>
		<!-- Transfer Options -->
		<xsl:when test="($eleName = 'distorTran')"><res:distorTran/></xsl:when>
		<xsl:when test="($eleName = 'distTranOps')"><res:distorTran/></xsl:when>
		<xsl:when test="($eleName = 'transSize')"><res:transSize/></xsl:when>
		<xsl:when test="($eleName = 'unitsODist')"><res:unitsODist/></xsl:when>
      <!-- ISO 19115-1 transfer info -->
		<xsl:when test="($eleName = 'transFreq')"><res:transFreq/></xsl:when>
		<!-- Medium -->
		<xsl:when test="($eleName = 'offLineMed')"><res:offLineMed/></xsl:when>
		<xsl:when test="($eleName = 'medName')"><res:medName/></xsl:when>
		<xsl:when test="($eleName = 'medVol')"><res:medVol/></xsl:when>
		<xsl:when test="($eleName = 'medFormat')"><res:medFormat/></xsl:when>
		<xsl:when test="($eleName = 'medDensity')"><res:medDensity/></xsl:when>
		<xsl:when test="($eleName = 'medDenUnits')"><res:medDenUnits/></xsl:when>
		<xsl:when test="($eleName = 'medNote')"><res:medNote/></xsl:when>
      <!-- ISO 19115-1 medium info -->
		<xsl:when test="($eleName = 'medCitation')"><res:medCitation/></xsl:when>
		<xsl:when test="($eleName = 'medId')"><res:medId/></xsl:when>
		<!-- Identifiers -->
		<xsl:when test="($eleName = 'geoId')"><res:geoId/></xsl:when>
		<xsl:when test="($eleName = 'citId')"><res:citId/></xsl:when>
		<xsl:when test="($eleName = 'svResCitId')"><res:citId/></xsl:when>
		<xsl:when test="($eleName = 'imagQuCode')"><res:imagQuCode/></xsl:when>
		<xsl:when test="($eleName = 'prcTypCde')"><res:prcTypCde/></xsl:when>
		<xsl:when test="($eleName = 'measId')"><res:measId/></xsl:when>
		<xsl:when test="($eleName = 'aggrDSIdent')"><res:aggrDSIdent/></xsl:when>
		<xsl:when test="($eleName = 'refSysName')"><res:refSysName/></xsl:when>
		<xsl:when test="($eleName = 'MdIdent') and (name($ele/..) = 'imagQuCode')"><res:imagQuCode/></xsl:when>
		<xsl:when test="($eleName = 'MdIdent') and (name($ele/..) = 'prcTypCde')"><res:prcTypCde/></xsl:when>
		<xsl:when test="($eleName = 'MdIdent') and (name($ele/..) = 'measId')"><res:measId/></xsl:when>
		<!-- Citations -->
		<xsl:when test="($eleName = 'idCitation')"><res:idCitation/></xsl:when>
		<xsl:when test="($eleName = 'thesaName')"><res:thesaName/></xsl:when>
		<xsl:when test="($eleName = 'identAuth')"><res:identAuth/></xsl:when>
		<xsl:when test="($eleName = 'srcCitatn')"><res:srcCitatn/></xsl:when>
		<xsl:when test="($eleName = 'evalProc')"><res:evalProc/></xsl:when>
		<xsl:when test="($eleName = 'conSpec')"><res:conSpec/></xsl:when>
		<xsl:when test="($eleName = 'paraCit')"><res:paraCit/></xsl:when>
		<xsl:when test="($eleName = 'portCatCit')"><res:portCatCit/></xsl:when>
		<xsl:when test="($eleName = 'asName')"><res:asName/></xsl:when>
		<xsl:when test="($eleName = 'aggrDSName')"><res:aggrDSName/></xsl:when>
		<!-- Contacts -->
		<xsl:when test="($eleName = 'mdContact')"><res:mdContact/></xsl:when>
		<xsl:when test="($eleName = 'idPoC')"><res:idPoC/></xsl:when>
		<xsl:when test="($eleName = 'usrCntInfo')"><res:usrCntInfo/></xsl:when>
		<xsl:when test="($eleName = 'stepProc')"><res:stepProc/></xsl:when>
		<xsl:when test="($eleName = 'distorCont')"><res:distorCont/></xsl:when>
		<xsl:when test="($eleName = 'maintCont')"><res:maintCont/></xsl:when>
		<!-- Online Resource -->
		<xsl:when test="($eleName = 'onLineSrc')"><res:onLineSrc/></xsl:when>
		<xsl:when test="($eleName = 'extOnRes')"><res:extOnRes/></xsl:when>
		<xsl:when test="($eleName = 'svConPt')"><res:svConPt/></xsl:when>
		<xsl:when test="($eleName = 'cntOnlineRes')"><res:onLineRes/></xsl:when>
		<xsl:when test="($eleName = 'citOnlineRes')"><res:citOnlineRes/></xsl:when>
		<!-- Application Schema -->
		<xsl:when test="($eleName = 'appSchInfo')"><res:ApplicationSchema/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="esriElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Esri Basic Metadata -->
		<xsl:when test="($eleName = 'ArcGISFormat')"><res:ArcGISFormat/></xsl:when>
		<xsl:when test="($eleName = 'ArcGISstyle')"><res:ArcGISstyle/></xsl:when>
		<xsl:when test="($eleName = 'ArcGISProfile')"><res:ArcGISProfile/></xsl:when>
		<xsl:when test="($eleName = 'SyncOnce')"><res:SyncOnce/></xsl:when>
		<xsl:when test="($eleName = 'Sync')"><res:SyncWhenViewing/></xsl:when>
		<xsl:when test="($eleName = 'MapLyrSync')"><res:MapLyrSync/></xsl:when>
		<xsl:when test="($eleName = 'CreaDate')"><res:CreaDate/></xsl:when>
		<xsl:when test="($eleName = 'ModDate')"><res:ModDate/></xsl:when>
		<xsl:when test="($eleName = 'SyncDate')"><res:SyncDate/></xsl:when>
		<xsl:when test="($eleName = 'Identifier')"><res:Identifier/></xsl:when>
		<xsl:when test="($eleName = 'PublishedDocID')"><res:PublishedDocID/></xsl:when>
		<xsl:when test="($eleName = 'PublishStatus')"><res:PublishStatus/></xsl:when>
		<xsl:when test="($eleName = 'MetaID')"><res:MetaID/></xsl:when>
		<!-- ESRI Item Properties -->
		<xsl:when test="($eleName = 'itemProps')"><res:itemProps/></xsl:when>
		<xsl:when test="($eleName = 'itemName')"><res:itemName/></xsl:when>
		<xsl:when test="($eleName = 'itemSize')"><res:itemSize/></xsl:when>
		<xsl:when test="($eleName = 'imsContentType')"><res:imsContentType/></xsl:when>
		<xsl:when test="($eleName = 'export') and (name($ele/..) = 'imsContentType')"><res:imsContentTypeExport/></xsl:when>
		<xsl:when test="($eleName = 'linkage')"><res:itemLocationLinkage/></xsl:when>
		<xsl:when test="($eleName = 'protocol')"><res:itemLocationProtocol/></xsl:when>
		<xsl:when test="($eleName = 'nativeExtBox')"><res:nativeExtBox/></xsl:when>
		<xsl:when test="($eleName = 'coordRef')"><res:coordRef/></xsl:when>
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'coordRef')"><res:type/></xsl:when>
		<xsl:when test="($eleName = 'projcsn')"><res:projcsn/></xsl:when>
		<xsl:when test="($eleName = 'geogcsn')"><res:geogcsn/></xsl:when>
		<xsl:when test="($eleName = 'peXml')"><res:peXml/></xsl:when>
		<!-- ESRI ArcIMS Service Properties -->
		<xsl:when test="($eleName = 'Server')"><res:Server/></xsl:when>
		<xsl:when test="($eleName = 'Service')"><res:Service/></xsl:when>
		<xsl:when test="($eleName = 'ServiceType')"><res:ServiceType/></xsl:when>
		<xsl:when test="($eleName = 'ServiceFCType')"><res:ServiceFCType/></xsl:when>
		<xsl:when test="($eleName = 'ServiceFCName')"><res:ServiceFCName/></xsl:when>
		<!-- ESRI Copy/Paste History -->
		<xsl:when test="($eleName = 'copyHistory')"><res:copyHistory/></xsl:when>
		<xsl:when test="($eleName = 'date') and (name($ele/..) = 'copy')"><res:copy/></xsl:when>
		<xsl:when test="($eleName = 'source')"><res:source/></xsl:when>
		<xsl:when test="($eleName = 'dest')"><res:dest/></xsl:when>
		<!-- ESRI Geoprocessing History -->
		<xsl:when test="($eleName = 'lineage')"><res:ESRIGeoprocessingHistory/></xsl:when>
		<xsl:when test="($eleName = 'Process')"><res:Process/></xsl:when>
		<xsl:when test="($eleName = 'Name') and (name($ele/..) = 'Process')"><res:ProcessName/></xsl:when>
		<xsl:when test="($eleName = 'Date')"><res:ProcessDate/></xsl:when>
		<xsl:when test="($eleName = 'ToolSource')"><res:ProcessToolLocation/></xsl:when>
		<xsl:when test="($eleName = 'export') and (name($ele/..) = 'Process')"><res:ProcessExport/></xsl:when>
		<!-- ESRI Raster Properties General -->
		<xsl:when test="($eleName = 'RasterProperties')"><res:ESRIRaster /></xsl:when>
		<xsl:when test="($eleName = 'General')"><res:General/></xsl:when>
		<xsl:when test="($eleName = 'PixelDepth')"><res:idPixDepth/></xsl:when>
		<xsl:when test="($eleName = 'HasColormap')"><res:idHasColmap/></xsl:when>
		<xsl:when test="($eleName = 'CompressionType')"><res:idCompressionType/></xsl:when>
		<xsl:when test="($eleName = 'NumBands')"><res:idNumBands/></xsl:when>
		<xsl:when test="($eleName = 'Format')"><res:idRasterFmt/></xsl:when>
		<xsl:when test="($eleName = 'HasPyramids')"><res:idHasPyramids/></xsl:when>
		<xsl:when test="($eleName = 'SourceType')"><res:idSrcType/></xsl:when>
		<xsl:when test="($eleName = 'PixelType')"><res:idPixType/></xsl:when>
		<xsl:when test="($eleName = 'NoDataValue')"><res:idNoDataVal/></xsl:when>
		<!-- ESRI Raster Mosaic Properties -->
		<xsl:when test="($eleName = 'Properties')"><res:MosaicProperties /></xsl:when>
		<xsl:when test="($eleName = 'Functions')"><res:MosaicFunctions /></xsl:when>
		<xsl:when test="($eleName = 'Name') and (name($ele/..) = 'Function')"><res:MosaicFunction /></xsl:when>
		<xsl:when test="($eleName = 'Description')"><res:MosaicDescription /></xsl:when>
		<xsl:when test="($eleName = 'Arguments')"><res:MosaicArguments /></xsl:when>
		<xsl:when test="($eleName = 'MaxImageHeight')"><res:idMaxImageHeight /></xsl:when>
		<xsl:when test="($eleName = 'MaxImageWidth')"><res:idMaxImageWidth /></xsl:when>
		<xsl:when test="($eleName = 'MaxRecordCount')"><res:idMaxRecordCount /></xsl:when>
		<xsl:when test="($eleName = 'MaxDownloadImageCount')"><res:idMaxDownloadImageCount /></xsl:when>
		<xsl:when test="($eleName = 'MaxMosaicImageCount')"><res:idMaxMosaicImageCount /></xsl:when>
		<xsl:when test="($eleName = 'ViewpointSpacingX')"><res:idViewpointSpacingX /></xsl:when>
		<xsl:when test="($eleName = 'ViewpointSpacingY')"><res:idViewpointSpacingY /></xsl:when>
		<xsl:when test="($eleName = 'DefaultCompressionQuality')"><res:idDefaultCompressionQuality /></xsl:when>
		<xsl:when test="($eleName = 'DefaultResamplingMethod')"><res:idDefaultResamplingMethod /></xsl:when>
		<xsl:when test="($eleName = 'AllowedItemMetadata')"><res:idAllowedItemMetadata /></xsl:when>
		<xsl:when test="($eleName = 'AllowedMosaicMethods')"><res:idAllowedMosaicMethods /></xsl:when>
		<xsl:when test="($eleName = 'AllowedCompressions')"><res:idAllowedCompressions /></xsl:when>
		<xsl:when test="($eleName = 'AllowedFields')"><res:idAllowedFields /></xsl:when>
		<xsl:when test="($eleName = 'AvailableVisibleFields')"><res:idAvailableVisibleFields /></xsl:when>
		<xsl:when test="($eleName = 'AvailableMosaicMethods')"><res:idAvailableMosaicMethods /></xsl:when>
		<xsl:when test="($eleName = 'AvailableCompressionMethods')"><res:idAvailableCompressionMethods /></xsl:when>
		<xsl:when test="($eleName = 'AvailableItemMetadataLevels')"><res:idAvailableItemMetadataLevels /></xsl:when>
		<xsl:when test="($eleName = 'ConfigKeyword')"><res:idConfigKeyword /></xsl:when>
		<!-- ESRI Reference System Details -->
		<xsl:when test="($eleName = 'ProjectedCoordinateSystem')"><res:ProjectedCoordinateSystem/></xsl:when>
		<xsl:when test="($eleName = 'GeographicCoordinateSystem')"><res:GeographicCoordinateSystem/></xsl:when>
		<xsl:when test="($eleName = 'XOrigin')"><res:XOrigin/></xsl:when>
		<xsl:when test="($eleName = 'YOrigin')"><res:YOrigin/></xsl:when>
		<xsl:when test="($eleName = 'XYScale')"><res:XYScale/></xsl:when>
		<xsl:when test="($eleName = 'ZOrigin')"><res:ZOrigin/></xsl:when>
		<xsl:when test="($eleName = 'ZScale')"><res:ZScale/></xsl:when>
		<xsl:when test="($eleName = 'MOrigin')"><res:MOrigin/></xsl:when>
		<xsl:when test="($eleName = 'MScale')"><res:MScale/></xsl:when>
		<xsl:when test="($eleName = 'XYTolerance')"><res:XYTolerance/></xsl:when>
		<xsl:when test="($eleName = 'ZTolerance')"><res:ZTolerance/></xsl:when>
		<xsl:when test="($eleName = 'MTolerance')"><res:MTolerance/></xsl:when>
		<xsl:when test="($eleName = 'HighPrecision')"><res:HighPrecision/></xsl:when>
		<xsl:when test="($eleName = 'LeftLongitude')"><res:LeftLongitude/></xsl:when>
		<xsl:when test="($eleName = 'WKID')"><res:WKID/></xsl:when>
		<xsl:when test="($eleName = 'LatestWKID')"><res:LatestWKID/></xsl:when>
		<xsl:when test="($eleName = 'WKT')"><res:WKT/></xsl:when>
		<!-- Topology Properties -->
		<xsl:when test="($eleName = 'topoinfo')"><res:ESRITopology/></xsl:when>
		<xsl:when test="($eleName = 'topoName')"><res:topoName/></xsl:when>
		<xsl:when test="($eleName = 'clusterTol')"><res:clusterTol/></xsl:when>
		<xsl:when test="($eleName = 'trustedPolygon')"><res:trustedPolygon/></xsl:when>
		<xsl:when test="($eleName = 'notTrusted')"><res:notTrusted/></xsl:when>
		<xsl:when test="($eleName = 'maxErrors')"><res:maxErrors/></xsl:when>
		<xsl:when test="($eleName = 'topoRule')"><res:topoRule/></xsl:when>
		<xsl:when test="($eleName = 'topoRuleName')"><res:topoRuleName/></xsl:when>
		<xsl:when test="($eleName = 'topoRuleID')"><res:topoRuleID/></xsl:when>
		<xsl:when test="($eleName = 'topoRuleType')"><res:topoRuleType/></xsl:when>
		<xsl:when test="($eleName = 'topoRuleOrigin')"><res:topoRuleOrigin/></xsl:when>
		<xsl:when test="($eleName = 'fcname')"><res:fcname/></xsl:when>
		<xsl:when test="($eleName = 'stcode')"><res:stcode/></xsl:when>
		<xsl:when test="($eleName = 'stname')"><res:stname/></xsl:when>
		<xsl:when test="($eleName = 'allOriginSubtypes')"><res:allOriginSubtypes/></xsl:when>
		<xsl:when test="($eleName = 'topoRuleDest')"><res:topoRuleDest/></xsl:when>
		<xsl:when test="($eleName = 'allDestSubtypes')"><res:allDestSubtypes/></xsl:when>
		<!-- Terrain Properties -->
		<xsl:when test="($eleName = 'Terrain')"><res:ESRITerrain/></xsl:when>
		<xsl:when test="($eleName = 'totalPts')"><res:totalPts/></xsl:when>
		<!-- Network Dataset Properties -->
		<xsl:when test="($eleName = 'NetworkDiagram')"><res:ESRINetworkDiagram/></xsl:when>
		<xsl:when test="($eleName = 'templateName')"><res:templateName/></xsl:when>
		<xsl:when test="($eleName = 'createdBy')"><res:createdBy/></xsl:when>
		<xsl:when test="($eleName = 'lastUpdatedBy')"><res:lastUpdatedBy/></xsl:when>
		<!-- Locators -->
		<xsl:when test="($eleName = 'Locator')"><res:ESRILocator/></xsl:when>
		<xsl:when test="($eleName = 'Style')"><res:Style/></xsl:when>
		<xsl:when test="($eleName = 'FieldAliases')"><res:InputFields/></xsl:when>
		<xsl:when test="($eleName = 'FileMAT')"><res:FileMAT/></xsl:when>
		<xsl:when test="($eleName = 'FileSTN')"><res:FileSTN/></xsl:when>
		<xsl:when test="($eleName = 'IntFileMAT')"><res:IntFileMAT/></xsl:when>
		<xsl:when test="($eleName = 'IntFileSTN')"><res:IntFileSTN/></xsl:when>
		<xsl:when test="($eleName = 'Fallback')"><res:Fallback/></xsl:when>
		<!-- ESRI Locales -->
		<xsl:when test="($eleName = 'locale')"><res:idLocale/></xsl:when>
		<xsl:when test="($eleName = 'idAbs')"><res:idAbs/></xsl:when>
		<xsl:when test="($eleName = 'resTitle')"><res:resTitle/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="binaryElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- ESRI Thumbnails and Enclosures -->
		<xsl:when test="($eleName = 'Thumbnail')"><res:Thumbnail/></xsl:when>
		<xsl:when test="($eleName = 'img') and (name($ele/..) = 'Thumbnail')"><res:ThumbnailType/></xsl:when>
		<xsl:when test="($eleName = 'Enclosure')"><res:Enclosure/></xsl:when>
		<xsl:when test="($eleName = 'EsriPropertyType')"><res:EnclosureType/></xsl:when>
		<xsl:when test="($eleName = 'img') and (name($ele/..) = 'Enclosure')"><res:EnclosureType/></xsl:when>
		<xsl:when test="($eleName = 'OriginalFileName')"><res:OriginalFileName/></xsl:when>
		<xsl:when test="($eleName = 'Descript')"><res:Descript/></xsl:when>
		<xsl:when test="($eleName = 'SourceMetadata')"><res:SourceMetadata/></xsl:when>
		<xsl:when test="($eleName = 'SourceMetadataSchema')"><res:SourceMetadataSchema/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="spatRepElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Spatial Data Representation - Raster -->
		<xsl:when test="($eleName = 'GridSpatRep')"><res:GridSpatRep/></xsl:when>
		<xsl:when test="($eleName = 'Georect')"><res:Georect/></xsl:when>
		<xsl:when test="($eleName = 'Georef')"><res:Georef/></xsl:when>
		<xsl:when test="($eleName = 'numDims')"><res:numDims/></xsl:when>
		<xsl:when test="($eleName = 'cellGeo')"><res:cellGeo/></xsl:when>
		<xsl:when test="($eleName = 'ptInPixel')"><res:ptInPixel/></xsl:when>
		<xsl:when test="($eleName = 'tranParaAv')"><res:tranParaAv/></xsl:when>
		<xsl:when test="($eleName = 'transDimDesc')"><res:transDimDesc/></xsl:when>
		<xsl:when test="($eleName = 'transDimMap')"><res:transDimMap/></xsl:when>
		<xsl:when test="($eleName = 'chkPtAv')"><res:chkPtAv/></xsl:when>
		<xsl:when test="($eleName = 'chkPtDesc')"><res:chkPtDesc/></xsl:when>
		<xsl:when test="($eleName = 'cornerPts')"><res:cornerPts/></xsl:when>
		<xsl:when test="($eleName = 'centerPt')"><res:centerPt/></xsl:when>
		<xsl:when test="($eleName = 'pos') and (name($ele/..) = 'centerPt')"><res:centerPt/></xsl:when>
		<xsl:when test="($eleName = 'pos') and ((name($ele/..) = 'exterior') or (name($ele/..) = 'interior') or (name($ele/..) = 'cornerPts'))"><res:pos/></xsl:when>
		<xsl:when test="($eleName = 'posList')"><res:posList/></xsl:when>
		<xsl:when test="($eleName = 'ctrlPtAv')"><res:ctrlPtAv/></xsl:when>
		<xsl:when test="($eleName = 'orieParaAv')"><res:orieParaAv/></xsl:when>
		<xsl:when test="($eleName = 'orieParaDs')"><res:orieParaDs/></xsl:when>
		<xsl:when test="($eleName = 'georefPars')"><res:georefPars/></xsl:when>
		<xsl:when test="($eleName = 'paraCit')"><res:paraCit/></xsl:when>
		<!-- Dimension -->
		<xsl:when test="($eleName = 'axisDimension')"><res:axisDimension/></xsl:when>
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'axisDimension')"><res:axisDimension_type/></xsl:when>
		<xsl:when test="($eleName = 'dimSize')"><res:dimSize/></xsl:when>
		<xsl:when test="($eleName = 'axDimProps')"><res:axDimProps/></xsl:when>
		<xsl:when test="($eleName = 'Dimen')"><res:Dimen/></xsl:when>
		<xsl:when test="($eleName = 'dimName')"><res:dimName/></xsl:when>
		<xsl:when test="($eleName = 'value') and (name($ele/..) = 'dimResol') and (name($ele/../..) = 'axisDimension')"><res:dimResol/></xsl:when>
		<xsl:when test="($eleName = 'dimResol')"><res:dimResol/></xsl:when>
		<xsl:when test="($eleName = 'value') and (name($ele/..) = 'dimResol')"><res:distance/></xsl:when>
      <!-- ISO 19115-1 resolution info -->
		<xsl:when test="($eleName = 'dimTitle')"><res:dimTitle/></xsl:when>
		<xsl:when test="($eleName = 'dimDescription')"><res:dimDescription/></xsl:when>
		<!-- Spatial Data Representation - Vector -->
		<xsl:when test="($eleName = 'VectSpatRep')"><res:VectSpatRep/></xsl:when>
		<xsl:when test="($eleName = 'topLvl')"><res:topLvl/></xsl:when>
		<xsl:when test="($eleName = 'geometObjs')"><res:geometObjs/></xsl:when>
		<xsl:when test="($eleName = 'Name') and (name($ele/..) = 'geometObjs')"><res:FeatureClass/></xsl:when>
		<xsl:when test="($eleName = 'geoObjTyp')"><res:geoObjTyp/></xsl:when>
		<xsl:when test="($eleName = 'geoObjCnt')"><res:geoObjCnt/></xsl:when>
		<!-- Spatial Data Representation - FGDC Indirect -->
		<xsl:when test="($eleName = 'Indref')"><res:Indref/></xsl:when>
		<!-- Unit of Measure -->
		<xsl:when test="($eleName = 'unitSymbol')"><res:unitSymbol/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'unitSymbol')"><res:unitSymbol_codespace/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanType')"><res:unitQuanType/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanRef')"><res:unitQuanRef/></xsl:when>
		<xsl:when test="($eleName = 'UomArea')"><res:UomArea/></xsl:when>
		<xsl:when test="($eleName = 'UomLength')"><res:UomLength/></xsl:when>
		<xsl:when test="($eleName = 'UomVolume')"><res:UomVolume/></xsl:when>
		<xsl:when test="($eleName = 'UomScale')"><res:UomScale/></xsl:when>
		<xsl:when test="($eleName = 'UomTime')"><res:UomTime/></xsl:when>
		<xsl:when test="($eleName = 'UomVelocity')"><res:UomVelocity/></xsl:when>
		<xsl:when test="($eleName = 'UomAngle')"><res:UomAngle/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:UomOtherwise/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOUnits/></xsl:when>
		<!-- GML attributes -->
		<xsl:when test="($eleName = 'gmlAttributes')"><res:gmlAttributes/></xsl:when>
		<xsl:when test="($eleName = 'gmlID')"><res:gmlID/></xsl:when>
		<xsl:when test="($eleName = 'gmlDesc')"><res:gmlDesc/></xsl:when>
		<xsl:when test="($eleName = 'gmlDescRef')"><res:gmlDescRef/></xsl:when>
		<xsl:when test="($eleName = 'gmlIdent')"><res:gmlIdent/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlIdent')"><res:gmlIdent_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlName')"><res:gmlName/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlName')"><res:gmlName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlRemarks')"><res:gmlRemarks/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="mxFileElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Result File -->
		<xsl:when test="($eleName = 'resultFile')"><res:resultFile/></xsl:when>
		<xsl:when test="($eleName = 'mxFileName')"><res:mxFileName/></xsl:when>
		<xsl:when test="($eleName = 'mxFileDesc')"><res:mxFileDesc/></xsl:when>
		<xsl:when test="($eleName = 'mxFileType')"><res:mxFileType/></xsl:when>
		<xsl:when test="($eleName = 'value') and (name($ele/..) = 'mxFileType')"><res:mxMimeType/></xsl:when>
		<xsl:when test="($eleName = 'mxFeatType')"><res:mxFeatType/></xsl:when>
		<xsl:when test="($eleName = 'mxFileFormat')"><res:mxFileFormat/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="dqInfoElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Data Quality Elements -->
		<xsl:when test="($eleName = 'DQCompComm')"><res:DQCompComm/></xsl:when>
		<xsl:when test="($eleName = 'DQCompOm')"><res:DQCompOm/></xsl:when>
		<xsl:when test="($eleName = 'DQConcConsis')"><res:DQConcConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQDomConsis')"><res:DQDomConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQFormConsis')"><res:DQFormConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQTopConsis')"><res:DQTopConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQAbsExtPosAcc')"><res:DQAbsExtPosAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQGridDataPosAcc')"><res:DQGridDataPosAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQRelIntPosAcc')"><res:DQRelIntPosAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQAccTimeMeas')"><res:DQAccTimeMeas/></xsl:when>
		<xsl:when test="($eleName = 'DQTempConsis')"><res:DQTempConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQTempValid')"><res:DQTempValid/></xsl:when>
		<xsl:when test="($eleName = 'DQThemClassCor')"><res:DQThemClassCor/></xsl:when>
		<xsl:when test="($eleName = 'DQNonQuanAttAcc')"><res:DQNonQuanAttAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQQuanAttAcc')"><res:DQQuanAttAcc/></xsl:when>
		<xsl:when test="($eleName = 'measDateTm')"><res:measDateTm/></xsl:when>
		<xsl:when test="($eleName = 'measName')"><res:measName/></xsl:when>
		<xsl:when test="($eleName = 'measDesc')"><res:measDesc/></xsl:when>
		<xsl:when test="($eleName = 'evalMethType')"><res:evalMethType/></xsl:when>
		<xsl:when test="($eleName = 'evalMethDesc')"><res:evalMethDesc/></xsl:when>
		<xsl:when test="($eleName = 'DQComplete')"><res:DQComplete/></xsl:when>
		<xsl:when test="($eleName = 'DQLogConsis')"><res:DQLogConsis/></xsl:when>
		<xsl:when test="($eleName = 'DQPosAcc')"><res:DQPosAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQTempAcc')"><res:DQTempAcc/></xsl:when>
		<xsl:when test="($eleName = 'DQThemAcc')"><res:DQThemAcc/></xsl:when>
      <!-- ISO 19157-2 quality info -->
		<xsl:when test="($eleName = 'reportDateTime')"><res:reportDateTime/></xsl:when>
		<xsl:when test="($eleName = 'standaloneReport')"><res:standaloneReport/></xsl:when>
		<xsl:when test="($eleName = 'reportReference')"><res:reportReference/></xsl:when>
		<xsl:when test="($eleName = 'abstract')"><res:reportAbstract/></xsl:when>
		<xsl:when test="($eleName = 'elementReport')"><res:elementReport/></xsl:when>
		<xsl:when test="($eleName = 'reportID')"><res:reportID/></xsl:when>
		<xsl:when test="($eleName = 'derivedElement')"><res:derivedElement/></xsl:when>
		<xsl:when test="($eleName = 'relatedElement')"><res:relatedElement/></xsl:when>
		
		<xsl:when test="($eleName = 'uuidref') and (name($ele/..) = 'derivedElement')"><res:relatedElementUUIDref/></xsl:when>
		<xsl:when test="($eleName = 'uuidref') and (name($ele/..) = 'relatedElement')"><res:relatedElementUUIDref/></xsl:when>
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'derivedElement')"><res:associatedReportType/></xsl:when>
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'relatedElement')"><res:associatedReportType/></xsl:when>
		
		<xsl:when test="($eleName = 'standaloneQualityReportDetails')"><res:standaloneQualityReportDetails/></xsl:when>
		<xsl:when test="($eleName = 'inspectionType')"><res:inspectionType/></xsl:when>
		<xsl:when test="($eleName = 'sampleInspection')"><res:sampleInspection/></xsl:when>
		<xsl:when test="($eleName = 'samplingScheme')"><res:samplingScheme/></xsl:when>
		<xsl:when test="($eleName = 'lotDescription')"><res:lotDescription/></xsl:when>
		<xsl:when test="($eleName = 'samplingRatio')"><res:samplingRatio/></xsl:when>
		<xsl:when test="($eleName = 'indirectInfo')"><res:indirectInfo/></xsl:when>
		<!-- Data Quality Results -->
		<xsl:when test="($eleName = 'Result')"><res:Result/></xsl:when>
		<xsl:when test="($eleName = 'ConResult')"><res:ConResult/></xsl:when>
		<xsl:when test="($eleName = 'conPass')"><res:conPass/></xsl:when>
		<xsl:when test="($eleName = 'conExpl')"><res:conExpl/></xsl:when>
		<xsl:when test="($eleName = 'conSpec')"><res:conSpec/></xsl:when>
		<xsl:when test="($eleName = 'QuanResult')"><res:QuanResult/></xsl:when>
		<xsl:when test="($eleName = 'quanValue')"><res:quanValue/></xsl:when>
		<xsl:when test="($eleName = 'quanVal')"><res:quanValue/></xsl:when>
		<xsl:when test="($eleName = 'quanValUnit')"><res:quanValUnit/></xsl:when>
		<xsl:when test="($eleName = 'quanValType')"><res:quanValType/></xsl:when>
		<xsl:when test="($eleName = 'errStat')"><res:errStat/></xsl:when>
      <!-- ISO 19157-2 quality info -->
		<xsl:when test="($eleName = 'measResult')"><res:measResult/></xsl:when>
		<xsl:when test="($eleName = 'resultDateTime')"><res:resultDateTime/></xsl:when>
		<xsl:when test="($eleName = 'evalReferenceDoc')"><res:evalReferenceDoc/></xsl:when>
		<xsl:when test="($eleName = 'evalProc')"><res:evalProc/></xsl:when>
		<xsl:when test="($eleName = 'measId')"><res:measId/></xsl:when>
		<xsl:when test="($eleName = 'resultScope')"><res:resultScope/></xsl:when>
		<xsl:when test="($eleName = 'deductiveSource')"><res:deductiveSource/></xsl:when>
		<xsl:when test="($eleName = 'DescriptiveResult')"><res:DescriptiveResult/></xsl:when>
		<xsl:when test="($eleName = 'statement') and (name($ele/..) = 'DescriptiveResult')"><res:DescResultStatement/></xsl:when>
		<xsl:when test="($eleName = 'CoverageResult')"><res:CoverageResult/></xsl:when>
		<xsl:when test="($eleName = 'spatRpType')"><res:spatRpType/></xsl:when>
		<xsl:when test="($eleName = 'resultFormat')"><res:resultFormat/></xsl:when>
		<!-- Data Quality Scope -->
		<xsl:when test="($eleName = 'dqScope')"><res:dqScope/></xsl:when>
		<xsl:when test="($eleName = 'scpLvl')"><res:scpLvl/></xsl:when>
		<!-- Scope Description -->
		<xsl:when test="($eleName = 'scpLvlDesc')"><res:scpLvlDesc/></xsl:when>
		<xsl:when test="($eleName = 'upScpDesc')"><res:scpLvlDesc/></xsl:when>
		<xsl:when test="($eleName = 'attribSet')"><res:attribSet/></xsl:when>
		<xsl:when test="($eleName = 'featSet')"><res:featSet/></xsl:when>
		<xsl:when test="($eleName = 'featIntSet')"><res:featIntSet/></xsl:when>
		<xsl:when test="($eleName = 'attribIntSet')"><res:attribIntSet/></xsl:when>
		<xsl:when test="($eleName = 'datasetSet')"><res:dataSet/></xsl:when>
		<xsl:when test="($eleName = 'other')"><res:other/></xsl:when>
		<!-- Extent -->
		<xsl:when test="($eleName = 'scpExt')"><res:scpExt/></xsl:when>
		<xsl:when test="($eleName = 'srcExt')"><res:srcExt/></xsl:when>
		<xsl:when test="($eleName = 'exDesc')"><res:exDesc/></xsl:when>
		<!-- Geographic Extent -->
		<xsl:when test="($eleName = 'geoEle')"><res:geoEle/></xsl:when>
		<xsl:when test="($eleName = 'GeoBndBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'nativeExtBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'geoBox')"><res:GeoBndBox/></xsl:when>
		<xsl:when test="($eleName = 'esriExtentType')"><res:attExtentType/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoBox') or (name($ele/..) = 'GeoBndBox') or (name($ele/..) = 'nativeExtBox'))"><res:exTypeCode1/></xsl:when>
		<xsl:when test="($eleName = 'westBL')"><res:westBL/></xsl:when>
		<xsl:when test="($eleName = 'eastBL')"><res:eastBL/></xsl:when>
		<xsl:when test="($eleName = 'northBL')"><res:northBL/></xsl:when>
		<xsl:when test="($eleName = 'southBL')"><res:southBL/></xsl:when>
		<xsl:when test="($eleName = 'geoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'GeoDesc')"><res:GeoDesc/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and ((name($ele/..) = 'geoDesc') or (name($ele/..) = 'GeoDesc'))"><res:exTypeCode2/></xsl:when>
		<xsl:when test="($eleName = 'geoId')"><res:geoId/></xsl:when>
		<xsl:when test="($eleName = 'BoundPoly')"><res:BoundPoly/></xsl:when>
		<xsl:when test="($eleName = 'exTypeCode') and (name($ele/..) = 'BoundPoly')"><res:exTypeCode/></xsl:when>
		<xsl:when test="($eleName = 'polygon')"><res:polygon/></xsl:when>
		<xsl:when test="($eleName = 'exterior')"><res:exterior/></xsl:when>
		<xsl:when test="($eleName = 'interior')"><res:interior/></xsl:when>
		<xsl:when test="($eleName = 'pos') and ((name($ele/..) = 'exterior') or (name($ele/..) = 'interior') or (name($ele/..) = 'cornerPts'))"><res:pos/></xsl:when>
		<xsl:when test="($eleName = 'posList')"><res:posList/></xsl:when>
		<xsl:when test="($eleName = 'coordinates')"><res:polygonCoordinates/></xsl:when>
		<xsl:when test="($eleName = 'MdCoRefSys') and (name($ele/..) = 'GM_Polygon')"><res:polygonMdCoRefSys/></xsl:when>
		<xsl:when test="($eleName = 'exSpat')"><res:exSpat/></xsl:when>
      <!-- ISO 19115-1 extent info -->
		<xsl:when test="($eleName = 'exVert')"><res:vertEle/></xsl:when>
		<!-- Vertical Extent -->
		<xsl:when test="($eleName = 'vertEle')"><res:vertEle/></xsl:when>
		<xsl:when test="($eleName = 'vertMinVal')"><res:vertMinVal/></xsl:when>
		<xsl:when test="($eleName = 'vertMaxVal')"><res:vertMaxVal/></xsl:when>
		<xsl:when test="($eleName = 'vertUoM')"><res:vertUoM/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:uomName/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOstandardUnit/></xsl:when>
		<xsl:when test="($eleName = 'datumID')"><res:datumID/></xsl:when>
		<!-- Temporal Extent -->
		<xsl:when test="($eleName = 'TempExtent')"><res:TempExtent/></xsl:when>
		<xsl:when test="($eleName = 'tmPosition')"><res:tmPosition/></xsl:when>
		<xsl:when test="($eleName = 'tmBegin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'tmEnd')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'date') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateDate/></xsl:when>
		<xsl:when test="($eleName = 'time') and ((name($ele/..) = 'tmPosition') or (name($ele/..) = 'tmBegin') or (name($ele/..) = 'tmEnd'))"><res:IndeterminateTime/></xsl:when>
		<xsl:when test="($eleName = 'begin')"><res:begin/></xsl:when>
		<xsl:when test="($eleName = 'end')"><res:end/></xsl:when>
		<xsl:when test="($eleName = 'calDate')"><res:calDate/></xsl:when>
		<xsl:when test="($eleName = 'clkTime')"><res:clkTime/></xsl:when>
		<xsl:when test="($eleName = 'SpatTempEx')"><res:SpatTempEx/></xsl:when>
		<xsl:when test="($eleName = 'exTemp')"><res:exTemp/></xsl:when>
		<!-- Lineage -->
		<xsl:when test="($eleName = 'dataLineage')"><res:dataLineage/></xsl:when>
		<xsl:when test="($eleName = 'statement') and (name($ele/..) = 'dataLineage')"><res:statement/></xsl:when>
		<xsl:when test="($eleName = 'prcStep')"><res:prcStep/></xsl:when>
		<xsl:when test="($eleName = 'srcStep')"><res:prcStep/></xsl:when>
		<xsl:when test="($eleName = 'stepDateTm')"><res:stepDateTm/></xsl:when>
		<xsl:when test="($eleName = 'date') and (name($ele/..) = 'stepDateTm')"><res:IndeterminateDate/></xsl:when>
		<xsl:when test="($eleName = 'time') and (name($ele/..) = 'stepDateTm')"><res:IndeterminateTime/></xsl:when>
		<xsl:when test="($eleName = 'stepDesc')"><res:stepDesc/></xsl:when>
		<xsl:when test="($eleName = 'stepRat')"><res:stepRat/></xsl:when>
		<xsl:when test="($eleName = 'stepProc')"><res:stepProc/></xsl:when>
		<xsl:when test="($eleName = 'dataSource')"><res:dataSource/></xsl:when>
		<xsl:when test="($eleName = 'stepSrc')"><res:dataSource/></xsl:when>
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'stepSrc')"><res:dataSource_type/></xsl:when>
		<xsl:when test="($eleName = 'srcDesc')"><res:srcDesc/></xsl:when>
		<xsl:when test="($eleName = 'srcMedName')"><res:srcMedName/></xsl:when>
		<xsl:when test="($eleName = 'referenceDoc')"><res:referenceDoc/></xsl:when>
		<xsl:when test="($eleName = 'srcCitatn')"><res:srcCitatn/></xsl:when>
		<xsl:when test="($eleName = 'srcRefSys')"><res:srcRefSys/></xsl:when>
      <!-- ISO 19115-1 lineage info -->
		<xsl:when test="($eleName = 'infoScope')"><res:infoScope/></xsl:when>
		<xsl:when test="($eleName = 'srcResol')"><res:srcResol/></xsl:when>
		<xsl:when test="($eleName = 'srcRefSysType')"><res:srcRefSysType/></xsl:when>
		<xsl:when test="($eleName = 'srcMetadata')"><res:srcMetadata/></xsl:when>
		<xsl:when test="($eleName = 'lvlScope')"><res:lvlScope/></xsl:when>
		<xsl:when test="($eleName = 'stepDateTmGml')"><res:stepDateTmGml/></xsl:when>
		<xsl:when test="($eleName = 'stepDateTimePeriod')"><res:stepDateTimePeriod/></xsl:when>
		<xsl:when test="($eleName = 'additionalDoc')"><res:additionalDoc/></xsl:when>
		<!-- Scale -->
		<xsl:when test="($eleName = 'scaleDist')"><res:scaleDist/></xsl:when>
		<xsl:when test="($eleName = 'value') and ((name($ele/..) = 'scaleDist') or (name($ele/..) = 'verticalDist') or (name($ele/..) = 'angularDist'))"><res:value/></xsl:when>
		<xsl:when test="($eleName = 'equScale')"><res:equScale/></xsl:when>
		<xsl:when test="($eleName = 'srcScale')"><res:srcScale/></xsl:when>
		<xsl:when test="($eleName = 'rfDenom')"><res:rfDenom/></xsl:when>
		<xsl:when test="($eleName = 'Scale')"><res:Scale/></xsl:when>
      <!-- ISO 19115-1 resolution info -->
		<xsl:when test="($eleName = 'verticalDist')"><res:verticalDist/></xsl:when>
		<xsl:when test="($eleName = 'angularDist')"><res:angularDist/></xsl:when>
		<xsl:when test="($eleName = 'levelOfDetail')"><res:levelOfDetail/></xsl:when>
		<!-- Unit of Measure -->
		<xsl:when test="($eleName = 'unitSymbol')"><res:unitSymbol/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'unitSymbol')"><res:unitSymbol_codespace/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanType')"><res:unitQuanType/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanRef')"><res:unitQuanRef/></xsl:when>
		<xsl:when test="($eleName = 'UomArea')"><res:UomArea/></xsl:when>
		<xsl:when test="($eleName = 'UomLength')"><res:UomLength/></xsl:when>
		<xsl:when test="($eleName = 'UomVolume')"><res:UomVolume/></xsl:when>
		<xsl:when test="($eleName = 'UomScale')"><res:UomScale/></xsl:when>
		<xsl:when test="($eleName = 'UomTime')"><res:UomTime/></xsl:when>
		<xsl:when test="($eleName = 'UomVelocity')"><res:UomVelocity/></xsl:when>
		<xsl:when test="($eleName = 'UomAngle')"><res:UomAngle/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:UomOtherwise/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOUnits/></xsl:when>
		<!-- GML attributes -->
		<xsl:when test="($eleName = 'gmlAttributes')"><res:gmlAttributes/></xsl:when>
		<xsl:when test="($eleName = 'gmlID')"><res:gmlID/></xsl:when>
		<xsl:when test="($eleName = 'gmlDesc')"><res:gmlDesc/></xsl:when>
		<xsl:when test="($eleName = 'gmlDescRef')"><res:gmlDescRef/></xsl:when>
		<xsl:when test="($eleName = 'gmlIdent')"><res:gmlIdent/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlIdent')"><res:gmlIdent_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlName')"><res:gmlName/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlName')"><res:gmlName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlRemarks')"><res:gmlRemarks/></xsl:when>
		<!-- Result File -->
		<xsl:when test="($eleName = 'resultFile')"><res:resultFile/></xsl:when>
		<xsl:when test="($eleName = 'mxFileName')"><res:mxFileName/></xsl:when>
		<xsl:when test="($eleName = 'mxFileDesc')"><res:mxFileDesc/></xsl:when>
		<xsl:when test="($eleName = 'mxFileType')"><res:mxFileType/></xsl:when>
		<xsl:when test="($eleName = 'value') and (name($ele/..) = 'mxFileType')"><res:mxMimeType/></xsl:when>
		<xsl:when test="($eleName = 'mxFeatType')"><res:mxFeatType/></xsl:when>
		<xsl:when test="($eleName = 'mxFileFormat')"><res:mxFileFormat/></xsl:when>
		<!-- Format -->
		<xsl:when test="($eleName = 'formatName')"><res:formatName/></xsl:when>
		<xsl:when test="($eleName = 'formatVer')"><res:formatVer/></xsl:when>
		<xsl:when test="($eleName = 'formatAmdNum')"><res:formatAmdNum/></xsl:when>
		<xsl:when test="($eleName = 'formatSpec')"><res:formatSpec/></xsl:when>
		<xsl:when test="($eleName = 'fileDecmTech')"><res:fileDecmTech/></xsl:when>
		<xsl:when test="($eleName = 'formatInfo')"><res:formatInfo/></xsl:when>
		<xsl:when test="($eleName = 'formatTech')"><res:formatTech/></xsl:when>
      <!-- ISO 19115-1 distributor info -->
		<xsl:when test="($eleName = 'fmtSpecCitation')"><res:fmtSpecCitation/></xsl:when>
		<xsl:when test="($eleName = 'medium')"><res:medium/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="contInfoElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Content - Vector -->
		<xsl:when test="($eleName = 'FetCatDesc')"><res:FetCatDesc/></xsl:when>
		<xsl:when test="($eleName = 'incWithDS')"><res:incWithDS/></xsl:when>
		<xsl:when test="($eleName = 'compCode')"><res:compCode/></xsl:when>
		<xsl:when test="($eleName = 'catLang')"><res:catLang/></xsl:when>
		<xsl:when test="($eleName = 'CharSetCd') and (name($ele/..) = 'catLang')"><res:catLang_charset/></xsl:when>
		<xsl:when test="($eleName = 'catFetTyps')"><res:catFetTyps/></xsl:when>
		<xsl:when test="($eleName = 'genericName') and (name($ele/..) = 'catFetTyps')"><res:catFetTyps/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'genericName')"><res:genericName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'aName') and (name($ele/..) = 'attributeType')"><res:attributeType/></xsl:when>
		<xsl:when test="($eleName = 'aName')"><res:aName/></xsl:when>
		<xsl:when test="($eleName = 'scope')"><res:scope/></xsl:when>
		<xsl:when test="($eleName = 'catCitation')"><res:catCitation/></xsl:when>
		<!-- Content - Raster - Coverage and Image Dimension -->
		<xsl:when test="($eleName = 'ContInfo')"><res:ContInfo/></xsl:when>
		<xsl:when test="($eleName = 'CovDesc')"><res:CovDesc/></xsl:when>
		<xsl:when test="($eleName = 'ImgDesc')"><res:ImgDesc/></xsl:when>
		<xsl:when test="($eleName = 'contentTyp')"><res:contentTyp/></xsl:when>
		<xsl:when test="($eleName = 'attDesc')"><res:attDesc/></xsl:when>
		<xsl:when test="($eleName = 'illElevAng')"><res:illElevAng/></xsl:when>
		<xsl:when test="($eleName = 'illAziAng')"><res:illAziAng/></xsl:when>
		<xsl:when test="($eleName = 'imagCond')"><res:imagCond/></xsl:when>
		<xsl:when test="($eleName = 'cloudCovPer')"><res:cloudCovPer/></xsl:when>
		<xsl:when test="($eleName = 'imagQuCode')"><res:imagQuCode/></xsl:when>
		<xsl:when test="($eleName = 'prcTypCde')"><res:prcTypCde/></xsl:when>
		<xsl:when test="($eleName = 'cmpGenQuan')"><res:cmpGenQuan/></xsl:when>
		<xsl:when test="($eleName = 'trianInd')"><res:trianInd/></xsl:when>
		<xsl:when test="($eleName = 'radCalDatAv')"><res:radCalDatAv/></xsl:when>
		<xsl:when test="($eleName = 'camCalInAv')"><res:camCalInAv/></xsl:when>
		<xsl:when test="($eleName = 'filmDistInAv')"><res:filmDistInAv/></xsl:when>
		<xsl:when test="($eleName = 'lensDistInAv')"><res:lensDistInAv/></xsl:when>
		<!-- Coverage - Raster - Range and Band Dimension -->
		<xsl:when test="($eleName = 'RangeDim')"><res:RangeDim/></xsl:when>
		<xsl:when test="($eleName = 'dimDescrp')"><res:dimDescrp/></xsl:when>
		<xsl:when test="($eleName = 'seqID')"><res:seqID/></xsl:when>
		<xsl:when test="($eleName = 'Band')"><res:Band/></xsl:when>
		<xsl:when test="($eleName = 'maxVal')"><res:maxVal/></xsl:when>
		<xsl:when test="($eleName = 'minVal')"><res:minVal/></xsl:when>
		<xsl:when test="($eleName = 'pkResp')"><res:pkResp/></xsl:when>
		<xsl:when test="($eleName = 'valUnit')"><res:valUnit/></xsl:when>
		<xsl:when test="($eleName = 'UOM') and ((name($ele/..) = 'valUnit') or (name($ele/..) = 'boundValUnit'))"><res:valUnit/></xsl:when>
		<xsl:when test="($eleName = 'bitsPerVal')"><res:bitsPerVal/></xsl:when>
		<xsl:when test="($eleName = 'toneGrad')"><res:toneGrad/></xsl:when>
		<xsl:when test="($eleName = 'sclFac')"><res:sclFac/></xsl:when>
		<xsl:when test="($eleName = 'offset')"><res:offset/></xsl:when>
      <!-- ISO 19115-1 band info -->
		<xsl:when test="($eleName = 'Sample')"><res:Sample/></xsl:when>
		<xsl:when test="($eleName = 'meanVal')"><res:meanVal/></xsl:when>
		<xsl:when test="($eleName = 'stdDeviation')"><res:stdDeviation/></xsl:when>
		<xsl:when test="($eleName = 'numberOfValues')"><res:numberOfValues/></xsl:when>
		<xsl:when test="($eleName = 'otherPropertyType')"><res:otherPropertyType/></xsl:when>
		<xsl:when test="($eleName = 'otherProperty')"><res:otherPropertyVal/></xsl:when>
		<xsl:when test="($eleName = 'boundMaxVal')"><res:boundMaxVal/></xsl:when>
		<xsl:when test="($eleName = 'boundMinVal')"><res:boundMinVal/></xsl:when>
		<xsl:when test="($eleName = 'boundValUnit')"><res:boundValUnit/></xsl:when>
		<!-- Unit of Measure -->
		<xsl:when test="($eleName = 'unitSymbol')"><res:unitSymbol/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'unitSymbol')"><res:unitSymbol_codespace/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanType')"><res:unitQuanType/></xsl:when>
		<xsl:when test="($eleName = 'unitQuanRef')"><res:unitQuanRef/></xsl:when>
		<xsl:when test="($eleName = 'UomArea')"><res:UomArea/></xsl:when>
		<xsl:when test="($eleName = 'UomLength')"><res:UomLength/></xsl:when>
		<xsl:when test="($eleName = 'UomVolume')"><res:UomVolume/></xsl:when>
		<xsl:when test="($eleName = 'UomScale')"><res:UomScale/></xsl:when>
		<xsl:when test="($eleName = 'UomTime')"><res:UomTime/></xsl:when>
		<xsl:when test="($eleName = 'UomVelocity')"><res:UomVelocity/></xsl:when>
		<xsl:when test="($eleName = 'UomAngle')"><res:UomAngle/></xsl:when>
		<xsl:when test="($eleName = 'uomName')"><res:UomOtherwise/></xsl:when>
		<xsl:when test="($eleName = 'conversionToISOstandardUnit')"><res:conversionToISOUnits/></xsl:when>
		<!-- GML attributes -->
		<xsl:when test="($eleName = 'gmlAttributes')"><res:gmlAttributes/></xsl:when>
		<xsl:when test="($eleName = 'gmlID')"><res:gmlID/></xsl:when>
		<xsl:when test="($eleName = 'gmlDesc')"><res:gmlDesc/></xsl:when>
		<xsl:when test="($eleName = 'gmlDescRef')"><res:gmlDescRef/></xsl:when>
		<xsl:when test="($eleName = 'gmlIdent')"><res:gmlIdent/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlIdent')"><res:gmlIdent_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlName')"><res:gmlName/></xsl:when>
		<xsl:when test="($eleName = 'codeSpace') and (name($ele/..) = 'gmlName')"><res:gmlName_codespace/></xsl:when>
		<xsl:when test="($eleName = 'gmlRemarks')"><res:gmlRemarks/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="appSchElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Application Schema -->
		<xsl:when test="($eleName = 'appSchInfo')"><res:ApplicationSchema/></xsl:when>
		<xsl:when test="($eleName = 'asName')"><res:asName/></xsl:when>
		<xsl:when test="($eleName = 'asSchLang')"><res:asSchLang/></xsl:when>
		<xsl:when test="($eleName = 'asCstLang')"><res:asCstLang/></xsl:when>
		<xsl:when test="($eleName = 'asAscii')"><res:asAscii/></xsl:when>
		<xsl:when test="($eleName = 'asGraFile')"><res:asGraFile/></xsl:when>
		<xsl:when test="($eleName = 'src') and (name($ele/..) = 'asGraFile')"><res:asGraFileSrc/></xsl:when>
		<xsl:when test="($eleName = 'asSwDevFile')"><res:asSwDevFile/></xsl:when>
		<xsl:when test="($eleName = 'src') and (name($ele/..) = 'asSwDevFile')"><res:asSwDevFileSrc/></xsl:when>
		<xsl:when test="($eleName = 'asSwDevFiFt')"><res:asSwDevFiFt/></xsl:when>
		<xsl:when test="($eleName = 'featCatSup')"><res:featCatSup/></xsl:when>
		<xsl:when test="($eleName = 'featTypeList')"><res:featTypeList/></xsl:when>
		<xsl:when test="($eleName = 'spatObj')"><res:spatObj/></xsl:when>
		<xsl:when test="($eleName = 'spatSchName')"><res:spatSchName/></xsl:when>
		<xsl:when test="($eleName = 'featCatSup')"><res:featCatSup/></xsl:when>
		<xsl:when test="($eleName = 'featCatSup')"><res:featCatSup/></xsl:when>
      <!-- ISO 19115-1 application schema info -->
		<xsl:when test="($eleName = 'graFileOnline')"><res:graFileOnline/></xsl:when>
		<xsl:when test="($eleName = 'swFileOnline')"><res:swFileOnline/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="extensionElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Extensions -->
		<xsl:when test="($eleName = 'mdExtInfo')"><res:IDMetaExtInfo/></xsl:when>
		<xsl:when test="($eleName = 'extEleInfo')"><res:extEleInfo/></xsl:when>
		<xsl:when test="($eleName = 'extEleName')"><res:extEleName/></xsl:when>
		<xsl:when test="($eleName = 'extShortName')"><res:extShortName/></xsl:when>
		<xsl:when test="($eleName = 'extDomCode')"><res:extDomCode/></xsl:when>
		<xsl:when test="($eleName = 'extEleDef')"><res:extEleDef/></xsl:when>
		<xsl:when test="($eleName = 'extEleOb')"><res:extEleOb/></xsl:when>
		<xsl:when test="($eleName = 'extEleCond')"><res:extEleCond/></xsl:when>
		<xsl:when test="($eleName = 'extEleMxOc')"><res:extEleMxOc/></xsl:when>
		<xsl:when test="($eleName = 'eleDataType')"><res:eleDataType/></xsl:when>
		<xsl:when test="($eleName = 'extEleDomVal')"><res:extEleDomVal/></xsl:when>
		<xsl:when test="($eleName = 'extEleParEnt')"><res:extEleParEnt/></xsl:when>
		<xsl:when test="($eleName = 'extEleRule')"><res:extEleRule/></xsl:when>
		<xsl:when test="($eleName = 'extEleRat')"><res:extEleRat/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="oldCoordsysElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<xsl:when test="($eleName = 'MdCoRefSys') and (name($ele/..) = 'refSysInfo')"><res:refSysID/></xsl:when>
		<xsl:when test="($eleName = 'projection')"><res:projection/></xsl:when>
		<xsl:when test="($eleName = 'ellipsoid')"><res:ellipsoid/></xsl:when>
		<xsl:when test="($eleName = 'datum')"><res:datum/></xsl:when>
		<xsl:when test="($eleName = 'projParas')"><res:projParas/></xsl:when>
		<xsl:when test="($eleName = 'zone')"><res:zone/></xsl:when>
		<xsl:when test="($eleName = 'stanParal')"><res:stanParal/></xsl:when>
		<xsl:when test="($eleName = 'longCntMer')"><res:longCntMer/></xsl:when>
		<xsl:when test="($eleName = 'latProjOri')"><res:latProjOri/></xsl:when>
		<xsl:when test="($eleName = 'sclFacEqu')"><res:sclFacEqu/></xsl:when>
		<xsl:when test="($eleName = 'hgtProsPt')"><res:hgtProsPt/></xsl:when>
		<xsl:when test="($eleName = 'latProjCnt')"><res:latProjCnt/></xsl:when>
		<xsl:when test="($eleName = 'longProjCnt')"><res:longProjCnt/></xsl:when>
		<xsl:when test="($eleName = 'sclFacCnt')"><res:sclFacCnt/></xsl:when>
		<xsl:when test="($eleName = 'stVrLongPl')"><res:stVrLongPl/></xsl:when>
		<xsl:when test="($eleName = 'sclFacPrOr')"><res:sclFacPrOr/></xsl:when>
		<xsl:when test="($eleName = 'falEastng')"><res:falEastng/></xsl:when>
		<xsl:when test="($eleName = 'falNorthng')"><res:falNorthng/></xsl:when>
		<xsl:when test="($eleName = 'falENUnits')"><res:falENUnits/></xsl:when>
		<xsl:when test="($eleName = 'obLnAziPars')"><res:obLnAziPars/></xsl:when>
		<xsl:when test="($eleName = 'aziAngle')"><res:aziAngle/></xsl:when>
		<xsl:when test="($eleName = 'aziPtLong')"><res:aziPtLong/></xsl:when>
		<xsl:when test="($eleName = 'obLnPtPars')"><res:obLnPtPars/></xsl:when>
		<xsl:when test="($eleName = 'obLineLat')"><res:obLineLat/></xsl:when>
		<xsl:when test="($eleName = 'obLineLong')"><res:obLineLong/></xsl:when>
		<xsl:when test="($eleName = 'ellParas')"><res:ellParas/></xsl:when>
		<xsl:when test="($eleName = 'semiMajAx')"><res:semiMajAx/></xsl:when>
		<xsl:when test="($eleName = 'axisUnits')"><res:axisUnits/></xsl:when>
		<xsl:when test="($eleName = 'denFlatRat')"><res:denFlatRat/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="spdoinfoElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Feature Classes -->
		<xsl:when test="($eleName = 'esriterm')"><res:ESRIFeatureClass/></xsl:when>
		<xsl:when test="($eleName = 'Name') and (name($ele/..) = 'esriterm')"><res:FeatureClass/></xsl:when>
		<xsl:when test="($eleName = 'efeatyp')"><res:efeatyp/></xsl:when>
		<xsl:when test="($eleName = 'efeageom')"><res:efeageom/></xsl:when>
		<xsl:when test="($eleName = 'code') and (name($ele/..) = 'efeageom')"><res:efeageom/></xsl:when>
		<xsl:when test="($eleName = 'esritopo')"><res:esritopo/></xsl:when>
		<xsl:when test="($eleName = 'efeacnt')"><res:efeacnt/></xsl:when>
		<xsl:when test="($eleName = 'spindex')"><res:spindex/></xsl:when>
		<xsl:when test="($eleName = 'linrefer')"><res:linrefer/></xsl:when>
		<xsl:when test="($eleName = 'netwrole')"><res:netwrole/></xsl:when>
		<xsl:when test="($eleName = 'featdesc')"><res:featdesc/></xsl:when>
		<xsl:when test="($eleName = 'XYRank')"><res:XYRank/></xsl:when>
		<xsl:when test="($eleName = 'ZRank')"><res:ZRank/></xsl:when>
		<xsl:when test="($eleName = 'topoWeight')"><res:topoWeight/></xsl:when>
		<xsl:when test="($eleName = 'validateEvents')"><res:validateEvents/></xsl:when>
		<xsl:when test="($eleName = 'partTopoRules')"><res:partTopoRules/></xsl:when>
		<!-- Geometric Network Properties -->
		<xsl:when test="($eleName = 'netinfo')"><res:ESRIGeometricNetwork/></xsl:when>
		<xsl:when test="($eleName = 'nettype')"><res:nettype/></xsl:when>
		<xsl:when test="($eleName = 'connrule')"><res:connrule/></xsl:when>
		<xsl:when test="($eleName = 'ruletype')"><res:ruletype/></xsl:when>
		<xsl:when test="($eleName = 'rulecat')"><res:rulecat/></xsl:when>
		<xsl:when test="($eleName = 'rulehelp')"><res:rulehelp/></xsl:when>
		<xsl:when test="($eleName = 'rulefeid')"><res:rulefeid/></xsl:when>
		<xsl:when test="($eleName = 'rulefest')"><res:rulefest/></xsl:when>
		<xsl:when test="($eleName = 'ruleteid')"><res:ruleteid/></xsl:when>
		<xsl:when test="($eleName = 'ruletest')"><res:ruletest/></xsl:when>
		<xsl:when test="($eleName = 'ruledjid')"><res:ruledjid/></xsl:when>
		<xsl:when test="($eleName = 'ruledjst')"><res:ruledjst/></xsl:when>
		<xsl:when test="($eleName = 'rulejunc')"><res:rulejunc/></xsl:when>
		<xsl:when test="($eleName = 'junctid')"><res:junctid/></xsl:when>
		<xsl:when test="($eleName = 'junctst')"><res:junctst/></xsl:when>
		<xsl:when test="($eleName = 'ruleeid')"><res:ruleeid/></xsl:when>
		<xsl:when test="($eleName = 'ruleest')"><res:ruleest/></xsl:when>
		<xsl:when test="($eleName = 'ruleemnc')"><res:ruleemnc/></xsl:when>
		<xsl:when test="($eleName = 'ruleemxc')"><res:ruleemxc/></xsl:when>
		<xsl:when test="($eleName = 'rulejid')"><res:rulejid/></xsl:when>
		<xsl:when test="($eleName = 'rulejst')"><res:rulejst/></xsl:when>
		<xsl:when test="($eleName = 'rulejmnc')"><res:rulejmnc/></xsl:when>
		<xsl:when test="($eleName = 'rulejmxc')"><res:rulejmxc/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="fieldsElementText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- Fields -->
		<xsl:when test="($eleName = 'detailed')"><res:detailed/></xsl:when>
		<xsl:when test="($eleName = 'enttypt')"><res:enttypt/></xsl:when>
		<xsl:when test="($eleName = 'enttypc')"><res:RowCount/></xsl:when>
		<xsl:when test="($eleName = 'enttypd')"><res:enttypd/></xsl:when>
		<xsl:when test="($eleName = 'enttypds')"><res:enttypds/></xsl:when>
		<xsl:when test="($eleName = 'attr') and (name($ele/..) = 'detailed')"><res:Field/></xsl:when>
		<xsl:when test="($eleName = 'attalias')"><res:attalias/></xsl:when>
		<xsl:when test="($eleName = 'attrtype')"><res:attrtype/></xsl:when>
		<xsl:when test="($eleName = 'attwidth')"><res:attwidth/></xsl:when>
		<xsl:when test="($eleName = 'atprecis')"><res:atprecis/></xsl:when>
		<xsl:when test="($eleName = 'attscale')"><res:attscale/></xsl:when>
		<xsl:when test="($eleName = 'atoutwid')"><res:atoutwid/></xsl:when>
		<xsl:when test="($eleName = 'atnumdec')"><res:atnumdec/></xsl:when>
		<xsl:when test="($eleName = 'atindex')"><res:atindex/></xsl:when>
		<xsl:when test="($eleName = 'attrdef')"><res:attrdef/></xsl:when>
		<xsl:when test="($eleName = 'attrdefs')"><res:attrdefs/></xsl:when>
		<xsl:when test="($eleName = 'edom')"><res:edom/></xsl:when>
		<xsl:when test="($eleName = 'edomv')"><res:edomv/></xsl:when>
		<xsl:when test="($eleName = 'edomvd')"><res:edomvd/></xsl:when>
		<xsl:when test="($eleName = 'edomvds')"><res:edomvds/></xsl:when>
		<xsl:when test="($eleName = 'attr') and (name($ele/..) = 'edom')"><res:edom_attr/></xsl:when>
		<xsl:when test="($eleName = 'codesetd')"><res:codesetd/></xsl:when>
		<xsl:when test="($eleName = 'codesetn')"><res:codesetn/></xsl:when>
		<xsl:when test="($eleName = 'codesets')"><res:codesets/></xsl:when>
		<xsl:when test="($eleName = 'rdom')"><res:rdom/></xsl:when>
		<xsl:when test="($eleName = 'rdommin')"><res:rdommin/></xsl:when>
		<xsl:when test="($eleName = 'rdommax')"><res:rdommax/></xsl:when>
		<xsl:when test="($eleName = 'rdommean')"><res:rdommean/></xsl:when>
		<xsl:when test="($eleName = 'rdomstdv')"><res:rdomstdv/></xsl:when>
		<xsl:when test="($eleName = 'attrunit')"><res:attrunit/></xsl:when>
		<xsl:when test="($eleName = 'attrmres')"><res:attrmres/></xsl:when>
		<xsl:when test="($eleName = 'attr') and (name($ele/..) = 'rdom')"><res:rdom_attr/></xsl:when>
		<xsl:when test="($eleName = 'udom')"><res:udomDesc/></xsl:when>
		<xsl:when test="($eleName = 'begdatea')"><res:begdatea/></xsl:when>
		<xsl:when test="($eleName = 'enddatea')"><res:enddatea/></xsl:when>
		<xsl:when test="($eleName = 'attrvai')"><res:attrvai/></xsl:when>
		<xsl:when test="($eleName = 'attrva')"><res:attrva/></xsl:when>
		<xsl:when test="($eleName = 'attrvae')"><res:attrvae/></xsl:when>
		<xsl:when test="($eleName = 'attrmfrq')"><res:attrmfrq/></xsl:when>
		<xsl:when test="($eleName = 'overview')"><res:idOverviewDesc/></xsl:when>
		<xsl:when test="($eleName = 'eaover')"><res:idEntityAttribOverview/></xsl:when>
		<xsl:when test="($eleName = 'eadetcit')"><res:idEntityAttribDetailCitation/></xsl:when>
		<!-- Subtypes -->
		<xsl:when test="($eleName = 'subtype')"><res:subtype/></xsl:when>
		<xsl:when test="($eleName = 'stname')"><res:subtypeName/></xsl:when>
		<xsl:when test="($eleName = 'stflddv')"><res:subtypeDefaultValue/></xsl:when>
		<xsl:when test="($eleName = 'domname')"><res:stDomain/></xsl:when>
		<xsl:when test="($eleName = 'domtype')"><res:domtype/></xsl:when>
		<xsl:when test="($eleName = 'domdesc')"><res:domdesc/></xsl:when>
		<xsl:when test="($eleName = 'mrgtype')"><res:mrgtype/></xsl:when>
		<xsl:when test="($eleName = 'splttype')"><res:splttype/></xsl:when>
		<!-- Relationship Classes -->
		<xsl:when test="($eleName = 'relinfo')"><res:relinfo/></xsl:when>
		<xsl:when test="($eleName = 'reldesc')"><res:reldesc/></xsl:when>
		<xsl:when test="($eleName = 'relcard')"><res:relcard/></xsl:when>
		<xsl:when test="($eleName = 'relattr')"><res:relattr/></xsl:when>
		<xsl:when test="($eleName = 'relcomp')"><res:relcomp/></xsl:when>
		<xsl:when test="($eleName = 'relnodir')"><res:relnodir/></xsl:when>
		<xsl:when test="($eleName = 'otfcname')"><res:otfcname/></xsl:when>
		<xsl:when test="($eleName = 'otfcpkey')"><res:otfcpkey/></xsl:when>
		<xsl:when test="($eleName = 'otfcfkey')"><res:otfcfkey/></xsl:when>
		<xsl:when test="($eleName = 'dtfcname')"><res:dtfcname/></xsl:when>
		<xsl:when test="($eleName = 'dtfcpkey')"><res:dtfcpkey/></xsl:when>
		<xsl:when test="($eleName = 'dtfcfkey')"><res:dtfcfkey/></xsl:when>
		<xsl:when test="($eleName = 'relflab')"><res:relflab/></xsl:when>
		<xsl:when test="($eleName = 'relblab')"><res:relblab/></xsl:when>
		<!-- OTHERWISE -->
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>