<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:res="http://www.esri.com/metadata/res/" xmlns:gmd="http://www.isotc211.org/2005/gmd" >

<!-- An XSLT template for displaying metadata in ArcGIS stored in the ArcGIS metadata format.
     Copyright (c) 2014, Esri, Inc. All rights reserved.
     Revision History: Created 5/20/2014 avienneau
-->

<!-- templates for handling ArcGIS elements containing coded values -->
<xsl:template name="codeText">
	<xsl:param name="ele" />
	<xsl:variable name="eleName"><xsl:value-of select="name($ele)" /></xsl:variable>
	<xsl:choose>
		<!-- some codes are stored in an @value on a subelement -->
		<xsl:when test="($eleName = 'DateTypCd')">
			<xsl:call-template name="CI_DateTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'OnFunctCd') or ($eleName = 'dataSetFn')">
			<xsl:call-template name="CI_OnLineFunctionCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'PresFormCd')">
			<xsl:call-template name="CI_PresentationFormCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'fgdcGeoform')">
		</xsl:when>
		<xsl:when test="($eleName = 'RoleCd')">
			<xsl:call-template name="CI_RoleCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'EvalMethTypeCd')">
			<xsl:call-template name="DQ_EvaluationMethodTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'AscTypeCd')">
			<xsl:call-template name="DS_AssociationTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'InitTypCd')">
			<xsl:call-template name="DS_InitiativeTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'CellGeoCd')">
			<xsl:call-template name="MD_CellGeometryCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'CharSetCd')">
			<xsl:call-template name="MD_CharSetCd">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ClasscationCd')">
			<xsl:call-template name="MD_ClassificationCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ContentTypCd')">
			<xsl:call-template name="MD_CoverageContentTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'DatatypeCd')">
			<xsl:call-template name="MD_DatatypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'DimNameTypCd')">
			<xsl:call-template name="MD_DimensionNameTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'GeoObjTypCd')">
			<xsl:call-template name="MD_GeometricObjectTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ImgCondCd')">
			<xsl:call-template name="MD_ImagingConditionCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'MaintFreqCd')">
			<xsl:call-template name="MD_MaintenanceFrequencyCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'MedFormCd')">
			<xsl:call-template name="MD_MediumFormatCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'MedNameCd')">
			<xsl:call-template name="MD_MediumNameCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ObCd')">
			<xsl:call-template name="MD_ObligationCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'PixOrientCd')">
			<xsl:call-template name="MD_PixelOrientationCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ProgCd')">
			<xsl:call-template name="MD_ProgressCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'RestrictCd')">
			<xsl:call-template name="MD_RestrictionCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'RefSysTypeCd')">
			<xsl:call-template name="MD_ReferenceSystemTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ScopeCd')">
			<xsl:call-template name="MD_ScopeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'SpatRepTypCd')">
			<xsl:call-template name="MD_SpatialRepresentationTypeCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'TopicCatCd')">
			<xsl:call-template name="MD_TopicCategoryCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'TopoLevCd')">
			<xsl:call-template name="MD_TopologyLevelCode">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'CouplTypCd')">
			<xsl:call-template name="SV_CouplTypCd">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'DCPListCd')">
			<xsl:call-template name="SV_DCPList">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ParamDirCd')">
			<xsl:call-template name="SV_ParamDirCd">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<!-- some codes are stored directly in an element or attribute -->
		<xsl:when test="($eleName = 'type') and (name($ele/..) = 'axisDimension')">
			<xsl:call-template name="MD_DimensionNameTypeCode">
				<xsl:with-param name="code" select="." />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'attrmfrq')">
			<xsl:call-template name="MD_MaintenanceFrequencyCode">
				<xsl:with-param name="code" select="." />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'orDesc') or (name() = 'imsContentType')">
			<xsl:call-template name="ArcIMS_ContentTypeCode">
				<xsl:with-param name="code" select="." />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'type') and ((name($ele/..) = 'report') or (name($ele/..) = 'dqReport') or (name($ele/..) = 'derivedElement') or (name($ele/..) = 'relatedElement') or (name($ele/..) = 'elementReport'))">
			<xsl:call-template name="DataQuality_ReportTypeCode">
				<xsl:with-param name="code" select="$ele" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'inspectionType')">
			<xsl:call-template name="EvaluationMethod_ClassCode">
				<xsl:with-param name="code" select="@type" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'PublicAccessCd')">
			<xsl:call-template name="Inspire_LimitationsOnPublicAccess_Code">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="($eleName = 'ConditionsAccUseCd')">
			<xsl:call-template name="Inspire_ConditionsApplyingToAccessAndUse_Code">
				<xsl:with-param name="code" select="@value" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise><span class="unknownElement"><xsl:value-of select="$eleName" /></span></xsl:otherwise>
	</xsl:choose>
</xsl:template>


<!-- templates for handling individual ISO 19115 code lists -->

<xsl:template name="CI_DateTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCreation/></xsl:when>
		<xsl:when test="$code = '002'"><res:idPub/></xsl:when>
		<xsl:when test="$code = '003'"><res:idRev/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="CI_OnLineFunctionCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDownload/></xsl:when>
		<xsl:when test="$code = '002'"><res:idInfo/></xsl:when>
		<xsl:when test="$code = '003'"><res:idOfflineAccess/></xsl:when>
		<xsl:when test="$code = '004'"><res:idOrder/></xsl:when>
		<xsl:when test="$code = '005'"><res:idSearch/></xsl:when>
		<xsl:when test="$code = '006'"><res:idUpload/></xsl:when>
		<xsl:when test="$code = '007'"><res:idWebService/></xsl:when>
		<xsl:when test="$code = '008'"><res:idEmailService/></xsl:when>
		<xsl:when test="$code = '009'"><res:idBrowsing/></xsl:when>
		<xsl:when test="$code = '010'"><res:idFileAccess/></xsl:when>
		<xsl:when test="$code = '011'"><res:idWebMapService/></xsl:when>
		<xsl:when test="$code = '012'"><res:idCompleteMetadata/></xsl:when>
		<xsl:when test="$code = '013'"><res:idBrowseGraphicFunction/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="CI_PresentationFormCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDigitalDoc/></xsl:when>
		<xsl:when test="$code = '002'"><res:idHardcopyDoc/></xsl:when>
		<xsl:when test="$code = '003'"><res:idDigitalImg/></xsl:when>
		<xsl:when test="$code = '004'"><res:idHardcopyImg/></xsl:when>
		<xsl:when test="$code = '005'"><res:idDigitalMap/></xsl:when>
		<xsl:when test="$code = '006'"><res:idHardcopyMap/></xsl:when>
		<xsl:when test="$code = '007'"><res:idDigitalModel/></xsl:when>
		<xsl:when test="$code = '008'"><res:idHardcopyModel/></xsl:when>
		<xsl:when test="$code = '009'"><res:idDigitalProfile/></xsl:when>
		<xsl:when test="$code = '010'"><res:idHardcopyProfile/></xsl:when>
		<xsl:when test="$code = '011'"><res:idDigitalTable/></xsl:when>
		<xsl:when test="$code = '012'"><res:idHardcopyTable/></xsl:when>
		<xsl:when test="$code = '013'"><res:idDigitalVid/></xsl:when>
		<xsl:when test="$code = '014'"><res:idHardcopyVid/></xsl:when>
		<xsl:when test="$code = '015'"><res:idDigitalAudio/></xsl:when>
		<xsl:when test="$code = '016'"><res:idHardcopyAudio/></xsl:when>
		<xsl:when test="$code = '017'"><res:idDigitalMultiMed/></xsl:when>
		<xsl:when test="$code = '018'"><res:idHardcopyMultiMed/></xsl:when>
		<xsl:when test="$code = '019'"><res:idDigitalDiagram/></xsl:when>
		<xsl:when test="$code = '020'"><res:idHardcopyDiagram/></xsl:when>
		<xsl:when test="$code = '021'"><res:idPhysicalObject/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="CI_RoleCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idResProv/></xsl:when>
		<xsl:when test="$code = '002'"><res:idCustodian/></xsl:when>
		<xsl:when test="$code = '003'"><res:idOwner/></xsl:when>
		<xsl:when test="$code = '004'"><res:idUser/></xsl:when>
		<xsl:when test="$code = '005'"><res:idDistrib_codelists/></xsl:when>
		<xsl:when test="$code = '006'"><res:idOrigin/></xsl:when>
		<xsl:when test="$code = '007'"><res:idPtContact/></xsl:when>
		<xsl:when test="$code = '008'"><res:idPrincipalInvestigator/></xsl:when>
		<xsl:when test="$code = '009'"><res:idProcessor/></xsl:when>
		<xsl:when test="$code = '010'"><res:idPublisher_codelists/></xsl:when>
		<xsl:when test="$code = '011'"><res:idAuthor/></xsl:when>
		<xsl:when test="$code = '012'"><res:idCollaborator/></xsl:when>
		<xsl:when test="$code = '013'"><res:idEditor/></xsl:when>
		<xsl:when test="$code = '014'"><res:idMediator/></xsl:when>
		<xsl:when test="$code = '015'"><res:idRightsHolder/></xsl:when>
		<xsl:when test="$code = '016'"><res:idSponsor/></xsl:when>
		<xsl:when test="$code = '017'"><res:idCoAuthor/></xsl:when>
		<xsl:when test="$code = '018'"><res:idContributor/></xsl:when>
		<xsl:when test="$code = '019'"><res:idFunder/></xsl:when>
		<xsl:when test="$code = '020'"><res:idStakeholder/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="DQ_EvaluationMethodTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDirectInternal/></xsl:when>
		<xsl:when test="$code = '002'"><res:idDirectExternal/></xsl:when>
		<xsl:when test="$code = '003'"><res:idIndirect/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="DS_AssociationTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCrossRef_codelists/></xsl:when>
		<xsl:when test="$code = '002'"><res:idLargerWorkCitation_codelists/></xsl:when>
		<xsl:when test="$code = '003'"><res:idPartSeamlessDb/></xsl:when>
		<xsl:when test="$code = '004'"><res:idSrc/></xsl:when>
		<xsl:when test="$code = '005'"><res:idStereoMate/></xsl:when>
		<xsl:when test="$code = '006'"><res:idIsComposedOf/></xsl:when>
		<xsl:when test="$code = '007'"><res:idCollectiveTitleCode/></xsl:when>
		<xsl:when test="$code = '008'"><res:idSeriesAssociation/></xsl:when>
		<xsl:when test="$code = '009'"><res:idDependency/></xsl:when>
		<xsl:when test="$code = '010'"><res:idRevisionOf/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="DS_InitiativeTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCampaign/></xsl:when>
		<xsl:when test="$code = '002'"><res:idColl/></xsl:when>
		<xsl:when test="$code = '003'"><res:idEx/></xsl:when>
		<xsl:when test="$code = '004'"><res:idExperiment/></xsl:when>
		<xsl:when test="$code = '005'"><res:idInvestigation/></xsl:when>
		<xsl:when test="$code = '006'"><res:idMission/></xsl:when>
		<xsl:when test="$code = '007'"><res:idSensor/></xsl:when>
		<xsl:when test="$code = '008'"><res:idOperation/></xsl:when>
		<xsl:when test="$code = '009'"><res:idPlatform/></xsl:when>
		<xsl:when test="$code = '010'"><res:idProc/></xsl:when>
		<xsl:when test="$code = '011'"><res:idProg/></xsl:when>
		<xsl:when test="$code = '012'"><res:idProj/></xsl:when>
		<xsl:when test="$code = '013'"><res:idStudy/></xsl:when>
		<xsl:when test="$code = '014'"><res:idTask/></xsl:when>
		<xsl:when test="$code = '015'"><res:idTrial/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_CellGeometryCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idPt/></xsl:when>
		<xsl:when test="$code = '002'"><res:idArea/></xsl:when>
		<xsl:when test="$code = '003'"><res:idVoxel/></xsl:when>
		<xsl:when test="$code = '004'"><res:idStratumGeom/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_CharSetCd">
	<xsl:param name="code" />
    <xsl:choose>
        <xsl:when test="$code = '001'"><res:idUCS2/></xsl:when>
        <xsl:when test="$code = '002'"><res:idUCS4/></xsl:when>
        <xsl:when test="$code = '003'"><res:idUTF7/></xsl:when>
        <xsl:when test="$code = '004'"><res:idUTF8/></xsl:when>
        <xsl:when test="$code = '005'"><res:idUTF16/></xsl:when>
        <xsl:when test="$code = '006'"><res:id8859p1/></xsl:when>
        <xsl:when test="$code = '007'"><res:id8859p2/></xsl:when>
        <xsl:when test="$code = '008'"><res:id8859p3/></xsl:when>
        <xsl:when test="$code = '009'"><res:id8859p4/></xsl:when>
        <xsl:when test="$code = '010'"><res:id8859p5/></xsl:when>
        <xsl:when test="$code = '011'"><res:id8859p6/></xsl:when>
        <xsl:when test="$code = '012'"><res:id8859p7/></xsl:when>
        <xsl:when test="$code = '013'"><res:id8859p8/></xsl:when>
        <xsl:when test="$code = '014'"><res:id8859p9/></xsl:when>
        <xsl:when test="$code = '015'"><res:id8859p10/></xsl:when>
        <xsl:when test="$code = '016'"><res:id8859p11/></xsl:when>
        <xsl:when test="$code = '017'"><res:idReservedFutureUse/></xsl:when>
        <xsl:when test="$code = '018'"><res:id8859p13/></xsl:when>
        <xsl:when test="$code = '019'"><res:id8859p14/></xsl:when>
        <xsl:when test="$code = '020'"><res:id8859p15/></xsl:when>
        <xsl:when test="$code = '021'"><res:id8859p16/></xsl:when>
        <xsl:when test="$code = '022'"><res:idJIS/></xsl:when>
        <xsl:when test="$code = '023'"><res:idShiftJIS/></xsl:when>
        <xsl:when test="$code = '024'"><res:idEUCJP/></xsl:when>
        <xsl:when test="$code = '025'"><res:idUSASCII/></xsl:when>
        <xsl:when test="$code = '026'"><res:idebcdic/></xsl:when>
        <xsl:when test="$code = '027'"><res:idEUCKR/></xsl:when>
        <xsl:when test="$code = '028'"><res:idBIG5/></xsl:when>
        <xsl:when test="$code = '029'"><res:idGB2312/></xsl:when>
        <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
</xsl:template>

<xsl:template name="MD_ClassificationCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idUnclass/></xsl:when>
		<xsl:when test="$code = '002'"><res:idRestr/></xsl:when>
		<xsl:when test="$code = '003'"><res:idConfid/></xsl:when>
		<xsl:when test="$code = '004'"><res:idSecret/></xsl:when>
		<xsl:when test="$code = '005'"><res:idTopSecret/></xsl:when>
		<xsl:when test="$code = '006'"><res:idSensitive/></xsl:when>
		<xsl:when test="$code = '007'"><res:idForOfficialUseOnly/></xsl:when>
		<xsl:when test="$code = '008'"><res:idProtected/></xsl:when>
		<xsl:when test="$code = '009'"><res:idLimitedDistribution/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_CoverageContentTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idImg/></xsl:when>
		<xsl:when test="$code = '002'"><res:idThematicClass/></xsl:when>
		<xsl:when test="$code = '003'"><res:idPhysMeas/></xsl:when>
		<xsl:when test="$code = '004'"><res:idAuxilliaryInformation/></xsl:when>
		<xsl:when test="$code = '005'"><res:idQualityInformation/></xsl:when>
		<xsl:when test="$code = '006'"><res:idReferenceInformation/></xsl:when>
		<xsl:when test="$code = '007'"><res:idModelResult/></xsl:when>
		<xsl:when test="$code = '008'"><res:idCoordinate/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_DatatypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idClass/></xsl:when>
		<xsl:when test="$code = '002'"><res:idCodelist/></xsl:when>
		<xsl:when test="$code = '003'"><res:idEnum/></xsl:when>
		<xsl:when test="$code = '004'"><res:idCodelistElem/></xsl:when>
		<xsl:when test="$code = '005'"><res:idAbstractClass/></xsl:when>
		<xsl:when test="$code = '006'"><res:idAggregateClass/></xsl:when>
		<xsl:when test="$code = '007'"><res:idSpecClass/></xsl:when>
		<xsl:when test="$code = '008'"><res:idDatatypeClass/></xsl:when>
		<xsl:when test="$code = '009'"><res:idInterfaceClass/></xsl:when>
		<xsl:when test="$code = '010'"><res:idUnionClass/></xsl:when>
		<xsl:when test="$code = '011'"><res:idMetaClass/></xsl:when>
		<xsl:when test="$code = '012'"><res:idTypeClass/></xsl:when>
		<xsl:when test="$code = '013'"><res:idCharString/></xsl:when>
		<xsl:when test="$code = '014'"><res:idInt/></xsl:when>
		<xsl:when test="$code = '015'"><res:idAssoc/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_DimensionNameTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idRowYaxis/></xsl:when>
		<xsl:when test="$code = '002'"><res:idColXaxis/></xsl:when>
		<xsl:when test="$code = '003'"><res:idVertZaxis/></xsl:when>
		<xsl:when test="$code = '004'"><res:idTrack/></xsl:when>
		<xsl:when test="$code = '005'"><res:idCrossTrack/></xsl:when>
		<xsl:when test="$code = '006'"><res:idSensorScanLine/></xsl:when>
		<xsl:when test="$code = '007'"><res:idSampleAlongScanLine/></xsl:when>
		<xsl:when test="$code = '008'"><res:idTimeDur/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_GeometricObjectTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idComplex/></xsl:when>
		<xsl:when test="$code = '002'"><res:idComposite/></xsl:when>
		<xsl:when test="$code = '003'"><res:idCurve/></xsl:when>
		<xsl:when test="$code = '004'"><res:idPoint/></xsl:when>
		<xsl:when test="$code = '005'"><res:idSolid/></xsl:when>
		<xsl:when test="$code = '006'"><res:idSurface/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_ImagingConditionCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idBlurredImg/></xsl:when>
		<xsl:when test="$code = '002'"><res:idCloud/></xsl:when>
		<xsl:when test="$code = '003'"><res:idDegradingObliquity/></xsl:when>
		<xsl:when test="$code = '004'"><res:idFog/></xsl:when>
		<xsl:when test="$code = '005'"><res:idHeavySmokeDust/></xsl:when>
		<xsl:when test="$code = '006'"><res:idNight/></xsl:when>
		<xsl:when test="$code = '007'"><res:idRain/></xsl:when>
		<xsl:when test="$code = '008'"><res:idSemidark/></xsl:when>
		<xsl:when test="$code = '009'"><res:idShadow/></xsl:when>
		<xsl:when test="$code = '010'"><res:idSnow/></xsl:when>
		<xsl:when test="$code = '011'"><res:idTerrainMask/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_KeywordTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDiscipline/></xsl:when>
		<xsl:when test="$code = '002'"><res:idPlace_codelists/></xsl:when>
		<xsl:when test="$code = '003'"><res:idStratum_codelists/></xsl:when>
		<xsl:when test="$code = '004'"><res:idTemporal_codelists/></xsl:when>
		<xsl:when test="$code = '005'"><res:idTheme_codelists/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_MaintenanceFrequencyCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCont/></xsl:when>
		<xsl:when test="$code = '002'"><res:idDaily/></xsl:when>
		<xsl:when test="$code = '003'"><res:idWeekly/></xsl:when>
		<xsl:when test="$code = '004'"><res:idFortnightly/></xsl:when>
		<xsl:when test="$code = '005'"><res:idMonthly/></xsl:when>
		<xsl:when test="$code = '006'"><res:idQuarterly/></xsl:when>
		<xsl:when test="$code = '007'"><res:idBiannually/></xsl:when>
		<xsl:when test="$code = '008'"><res:idAnnually/></xsl:when>
		<xsl:when test="$code = '009'"><res:idAsNeeded/></xsl:when>
		<xsl:when test="$code = '010'"><res:idIrregular/></xsl:when>
		<xsl:when test="$code = '011'"><res:idNotPlanned/></xsl:when>
		<xsl:when test="$code = '012'"><res:idUnkn/></xsl:when>
		<xsl:when test="$code = '013'"><res:idSemiMonthly/></xsl:when>
		<xsl:when test="$code = '014'"><res:idPeriodic/></xsl:when>
		<xsl:when test="$code = '015'"><res:idBiennially/></xsl:when>
		<xsl:when test="$code = '998'"><res:idUnkn/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_MediumFormatCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCpio/></xsl:when>
		<xsl:when test="$code = '002'"><res:idTar/></xsl:when>
		<xsl:when test="$code = '003'"><res:idHighSierraFileSys/></xsl:when>
		<xsl:when test="$code = '004'"><res:idIso9660Cdrom/></xsl:when>
		<xsl:when test="$code = '005'"><res:idIso9660RockRidgeUnix/></xsl:when>
		<xsl:when test="$code = '006'"><res:idIso9660AppleHfs/></xsl:when>
		<xsl:when test="$code = '007'"><res:idUDF/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_MediumNameCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCdrom/></xsl:when>
		<xsl:when test="$code = '002'"><res:idDvd/></xsl:when>
		<xsl:when test="$code = '003'"><res:idDvdrom/></xsl:when>
		<xsl:when test="$code = '004'"><res:id3.5InFDD/></xsl:when>
		<xsl:when test="$code = '005'"><res:id5.25InFDD/></xsl:when>
		<xsl:when test="$code = '006'"><res:id7TrackTape/></xsl:when>
		<xsl:when test="$code = '007'"><res:id9TrackTape/></xsl:when>
		<xsl:when test="$code = '008'"><res:id3480CartridgeTape/></xsl:when>
		<xsl:when test="$code = '009'"><res:id3490CartridgeTape/></xsl:when>
		<xsl:when test="$code = '010'"><res:id3580CartridgeTape/></xsl:when>
		<xsl:when test="$code = '011'"><res:id4mmCartridgeTape/></xsl:when>
		<xsl:when test="$code = '012'"><res:id8mmCartridgeTape/></xsl:when>
		<xsl:when test="$code = '013'"><res:id0.25InCartridgeTape/></xsl:when>
		<xsl:when test="$code = '014'"><res:idDigitalLinearTape/></xsl:when>
		<xsl:when test="$code = '015'"><res:idOnlineLink/></xsl:when>
		<xsl:when test="$code = '016'"><res:idSatLink/></xsl:when>
		<xsl:when test="$code = '017'"><res:idTelephoneLink/></xsl:when>
		<xsl:when test="$code = '018'"><res:idHardcopy/></xsl:when>
		<xsl:when test="$code = '019'"><res:idHardcopyDiazoPolyester08/></xsl:when>
		<xsl:when test="$code = '020'"><res:idHardcopyCardMicrofilm/></xsl:when>
		<xsl:when test="$code = '021'"><res:idHardcopyMicrofilm240/></xsl:when>
		<xsl:when test="$code = '022'"><res:idHardcopyMicrofilm35/></xsl:when>
		<xsl:when test="$code = '023'"><res:idHardcopyMicrofilm70/></xsl:when>
		<xsl:when test="$code = '024'"><res:idHardcopyMicrofilmGeneral/></xsl:when>
		<xsl:when test="$code = '025'"><res:idHardcopyMicrofilmMicrofiche/></xsl:when>
		<xsl:when test="$code = '026'"><res:idHardcopyNegativePhoto/></xsl:when>
		<xsl:when test="$code = '027'"><res:idHardcopyPaper/></xsl:when>
		<xsl:when test="$code = '028'"><res:idHardcopyDiazo/></xsl:when>
		<xsl:when test="$code = '029'"><res:idHardcopyPhoto/></xsl:when>
		<xsl:when test="$code = '030'"><res:idHardcopyTracedPaper/></xsl:when>
		<xsl:when test="$code = '031'"><res:idHardDisk/></xsl:when>
		<xsl:when test="$code = '032'"><res:idUSBFlashDrive/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- enumeration -->
<xsl:template name="MD_ObligationCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idMandatory/></xsl:when>
		<xsl:when test="$code = '002'"><res:idOptional/></xsl:when>
		<xsl:when test="$code = '003'"><res:idConditional/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- enumeration -->
<xsl:template name="MD_PixelOrientationCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCenter/></xsl:when>
		<xsl:when test="$code = '002'"><res:idLowerLeft/></xsl:when>
		<xsl:when test="$code = '003'"><res:idLowerRight/></xsl:when>
		<xsl:when test="$code = '004'"><res:idUpperRight/></xsl:when>
		<xsl:when test="$code = '005'"><res:idUpperLeft/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_ProgressCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCompleted/></xsl:when>
		<xsl:when test="$code = '002'"><res:idHistArchive/></xsl:when>
		<xsl:when test="$code = '003'"><res:idObsolete/></xsl:when>
		<xsl:when test="$code = '004'"><res:idOngoing/></xsl:when>
		<xsl:when test="$code = '005'"><res:idPlanned/></xsl:when>
		<xsl:when test="$code = '006'"><res:idReqd/></xsl:when>
		<xsl:when test="$code = '007'"><res:idUnderDev/></xsl:when>
		<xsl:when test="$code = '008'"><res:idProposed/></xsl:when>
		<xsl:when test="$code = '009'"><res:idFinal/></xsl:when>
		<xsl:when test="$code = '010'"><res:idPending/></xsl:when>
		<xsl:when test="$code = '011'"><res:idRetired/></xsl:when>
		<xsl:when test="$code = '012'"><res:idSuperseded/></xsl:when>
		<xsl:when test="$code = '013'"><res:idTentative/></xsl:when>
		<xsl:when test="$code = '014'"><res:idValid/></xsl:when>
		<xsl:when test="$code = '015'"><res:idAccepted/></xsl:when>
		<xsl:when test="$code = '016'"><res:idNotAccepted/></xsl:when>
		<xsl:when test="$code = '017'"><res:idWithdrawn/></xsl:when>
		<xsl:when test="$code = '018'"><res:idDeprecated/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_ReferenceSystemTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCmpdEngPara/></xsl:when>
		<xsl:when test="$code = '002'"><res:idCmpdEngParaTemp/></xsl:when>
		<xsl:when test="$code = '003'"><res:idCmpdEngTemp/></xsl:when>
		<xsl:when test="$code = '004'"><res:idCmpdEngVert/></xsl:when>
		<xsl:when test="$code = '005'"><res:idCmpdEngVertTemp/></xsl:when>
		<xsl:when test="$code = '006'"><res:idCmpdGeo2DPara/></xsl:when>
		<xsl:when test="$code = '007'"><res:idCmpdGeo2DParaTemp/></xsl:when>
		<xsl:when test="$code = '008'"><res:idCmpdGeo2DTemp/></xsl:when>
		<xsl:when test="$code = '009'"><res:idCmpdGeo2DVert/></xsl:when>
		<xsl:when test="$code = '010'"><res:idCmpdGeo2DVertTemp/></xsl:when>
		<xsl:when test="$code = '011'"><res:idCmpdGeo3DTemp/></xsl:when>
		<xsl:when test="$code = '012'"><res:idCmpdPrj2DPara/></xsl:when>
		<xsl:when test="$code = '013'"><res:idCmpdPrj2DParaTemp/></xsl:when>
		<xsl:when test="$code = '014'"><res:idCmpdPrj2DTemp/></xsl:when>
		<xsl:when test="$code = '015'"><res:idCmpdPrj2DVert/></xsl:when>
		<xsl:when test="$code = '016'"><res:idCmpdPrj2DVertTemp/></xsl:when>
		<xsl:when test="$code = '017'"><res:idEng/></xsl:when>
		<xsl:when test="$code = '018'"><res:idEngDesign/></xsl:when>
		<xsl:when test="$code = '019'"><res:idEngImage/></xsl:when>
		<xsl:when test="$code = '020'"><res:idGeodeticGeocentric/></xsl:when>
		<xsl:when test="$code = '021'"><res:idGeodeticGeographic2D/></xsl:when>
		<xsl:when test="$code = '022'"><res:idGeodeticGeographic3D/></xsl:when>
		<xsl:when test="$code = '023'"><res:idGeographicID/></xsl:when>
		<xsl:when test="$code = '024'"><res:idLinear/></xsl:when>
		<xsl:when test="$code = '025'"><res:idParametric/></xsl:when>
		<xsl:when test="$code = '026'"><res:idProjected/></xsl:when>
		<xsl:when test="$code = '027'"><res:idTemporal/></xsl:when>
		<xsl:when test="$code = '028'"><res:idVertical/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_RestrictionCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCopyright/></xsl:when>
		<xsl:when test="$code = '002'"><res:idPatent/></xsl:when>
		<xsl:when test="$code = '003'"><res:idPatentPending/></xsl:when>
		<xsl:when test="$code = '004'"><res:idTrademark/></xsl:when>
		<xsl:when test="$code = '005'"><res:idLicense/></xsl:when>
		<xsl:when test="$code = '006'"><res:idIntellectualPropRights/></xsl:when>
		<xsl:when test="$code = '007'"><res:idRestr_codelists/></xsl:when>
		<xsl:when test="$code = '008'"><res:idOtherRestr/></xsl:when>
		<xsl:when test="$code = '009'"><res:idLicenseUnrestricted/></xsl:when>
		<xsl:when test="$code = '010'"><res:idLicenseEndUser/></xsl:when>
		<xsl:when test="$code = '011'"><res:idLicenseDistributor/></xsl:when>
		<xsl:when test="$code = '012'"><res:idPrivacy/></xsl:when>
		<xsl:when test="$code = '013'"><res:idStatutory/></xsl:when>
		<xsl:when test="$code = '014'"><res:idConfidential/></xsl:when>
		<xsl:when test="$code = '015'"><res:idSensitivity/></xsl:when>
		<xsl:when test="$code = '016'"><res:idUnrestricted/></xsl:when>
		<xsl:when test="$code = '017'"><res:idInConfidence/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_ScopeCode">
	<xsl:param name="code" />
    <xsl:choose>
        <xsl:when test="$code = '001'"><res:idAttrib_codelists/></xsl:when>
        <xsl:when test="$code = '002'"><res:idAttribType/></xsl:when>
        <xsl:when test="$code = '003'"><res:idCollHw/></xsl:when>
        <xsl:when test="$code = '004'"><res:idCollSession/></xsl:when>
        <xsl:when test="$code = '005'"><res:idDataset/></xsl:when>
        <xsl:when test="$code = '006'"><res:idSeries_codelists/></xsl:when>
        <xsl:when test="$code = '007'"><res:idNongeoDataset/></xsl:when>
        <xsl:when test="$code = '008'"><res:idDimGrp/></xsl:when>
        <xsl:when test="$code = '009'"><res:idFeature/></xsl:when>
        <xsl:when test="$code = '010'"><res:idFeatureType/></xsl:when>
        <xsl:when test="$code = '011'"><res:idPropType/></xsl:when>
        <xsl:when test="$code = '012'"><res:idFieldSession/></xsl:when>
        <xsl:when test="$code = '013'"><res:idSw/></xsl:when>
        <xsl:when test="$code = '014'"><res:idService/></xsl:when>
        <xsl:when test="$code = '015'"><res:idModel/></xsl:when>
        <xsl:when test="$code = '016'"><res:idTile/></xsl:when>
        <xsl:when test="$code = '017'"><res:idInitiative/></xsl:when>
        <xsl:when test="$code = '018'"><res:idStereomate_scope/></xsl:when>
        <xsl:when test="$code = '019'"><res:idSensor_scope/></xsl:when>
        <xsl:when test="$code = '020'"><res:idPlatformSeries/></xsl:when>
        <xsl:when test="$code = '021'"><res:idSensorSeries/></xsl:when>
        <xsl:when test="$code = '022'"><res:idProductionSeries/></xsl:when>
        <xsl:when test="$code = '023'"><res:idTransferAggregate/></xsl:when>
        <xsl:when test="$code = '024'"><res:idOtherAggregate/></xsl:when>
        <xsl:when test="$code = '025'"><res:idMetadataScope/></xsl:when>
        <xsl:when test="$code = '026'"><res:idSampleScope/></xsl:when>
        <xsl:when test="$code = '027'"><res:idDocumentScope/></xsl:when>
        <xsl:when test="$code = '028'"><res:idRepositoryScope/></xsl:when>
        <xsl:when test="$code = '029'"><res:idAggregateScope/></xsl:when>
        <xsl:when test="$code = '030'"><res:idProductScope/></xsl:when>
        <xsl:when test="$code = '031'"><res:idCollectionScope/></xsl:when>
        <xsl:when test="$code = '032'"><res:idCoverageScope/></xsl:when>
        <xsl:when test="$code = '033'"><res:idApplicationScope/></xsl:when>
        <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
</xsl:template>

<xsl:template name="MD_SpatialRepresentationTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idVec/></xsl:when>
		<xsl:when test="$code = '002'"><res:idGrid/></xsl:when>
		<xsl:when test="$code = '003'"><res:idTextTable/></xsl:when>
		<xsl:when test="$code = '004'"><res:idTin/></xsl:when>
		<xsl:when test="$code = '005'"><res:idStereoModel/></xsl:when>
		<xsl:when test="$code = '006'"><res:idVid/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- enumeration -->
<xsl:template name="MD_TopicCategoryCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idFarmingDisplay/></xsl:when>
    <xsl:when test="$code = '002'"><res:idBiotaDisplay/></xsl:when>
    <xsl:when test="$code = '003'"><res:idBoundsDisplay/></xsl:when>
    <xsl:when test="$code = '004'"><res:idCMADisplay/></xsl:when>
    <xsl:when test="$code = '005'"><res:idEconDisplay/></xsl:when>
    <xsl:when test="$code = '006'"><res:idElevDisplay/></xsl:when>
    <xsl:when test="$code = '007'"><res:idEnvDisplay/></xsl:when>
    <xsl:when test="$code = '008'"><res:idGSIDisplay/></xsl:when>
    <xsl:when test="$code = '009'"><res:idHealthDisplay/></xsl:when>
    <xsl:when test="$code = '010'"><res:idImageryBMECDisplay/></xsl:when>
    <xsl:when test="$code = '011'"><res:idIntelMilDisplay/></xsl:when>
    <xsl:when test="$code = '012'"><res:idInlandwatersDisplay/></xsl:when>
    <xsl:when test="$code = '013'"><res:idLocationDisplay/></xsl:when>
    <xsl:when test="$code = '014'"><res:idOceansDisplay/></xsl:when>
    <xsl:when test="$code = '015'"><res:idPlancadastreDisplay/></xsl:when>
    <xsl:when test="$code = '016'"><res:idSocietyDisplay/></xsl:when>
    <xsl:when test="$code = '017'"><res:idStructureDisplay/></xsl:when>
    <xsl:when test="$code = '018'"><res:idTransportationDisplay/></xsl:when>
    <xsl:when test="$code = '019'"><res:idUtilsCommDisplay/></xsl:when>
    <xsl:when test="$code = '020'"><res:idExtraTerrestrial/></xsl:when>
    <xsl:when test="$code = '021'"><res:idDisaster/></xsl:when>
    <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="MD_TopologyLevelCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idGeoOnly/></xsl:when>
		<xsl:when test="$code = '002'"><res:idTopo1d/></xsl:when>
		<xsl:when test="$code = '003'"><res:idPlanarGraph/></xsl:when>
		<xsl:when test="$code = '004'"><res:idFullPlanarGraph/></xsl:when>
		<xsl:when test="$code = '005'"><res:idSurfaceGraph/></xsl:when>
		<xsl:when test="$code = '006'"><res:idFullSurfaceGraph/></xsl:when>
		<xsl:when test="$code = '007'"><res:idTopo3d/></xsl:when>
		<xsl:when test="$code = '008'"><res:idFullTopo3d/></xsl:when>
		<xsl:when test="$code = '009'"><res:idAbstract_codelists/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- ArcGIS code lists -->

<xsl:template name="ArcIMS_ContentTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idLiveDataMaps/></xsl:when>
		<xsl:when test="$code = '002'"><res:idDlData/></xsl:when>
		<xsl:when test="$code = '003'"><res:idOfflineData/></xsl:when>
		<xsl:when test="$code = '004'"><res:idStaticMapImages/></xsl:when>
		<xsl:when test="$code = '005'"><res:idOtherDocs/></xsl:when>
		<xsl:when test="$code = '006'"><res:idApps/></xsl:when>
		<xsl:when test="$code = '007'"><res:idGeoSvcs/></xsl:when>
		<xsl:when test="$code = '008'"><res:idClearinghouses/></xsl:when>
		<xsl:when test="$code = '009'"><res:idMapFiles/></xsl:when>
		<xsl:when test="$code = '010'"><res:idGeoActivities/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="GeometryTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = 0"><res:idGeomNull /></xsl:when>
		<xsl:when test="$code = 1"><res:idGeomPt /></xsl:when>
		<xsl:when test="$code = 2"><res:idGeomMultipt /></xsl:when>
		<xsl:when test="$code = 3"><res:idGeomPolyln /></xsl:when>
		<xsl:when test="$code = 4"><res:idGeomPolygn /></xsl:when>
		<xsl:when test="$code = 5"><res:idGeomEnv /></xsl:when>
		<xsl:when test="$code = 6"><res:idGeomPath /></xsl:when>
		<xsl:when test="$code = 7"><res:idGeomAny /></xsl:when>
		<xsl:when test="$code = 9"><res:idGeomMultiptch /></xsl:when>
		<xsl:when test="$code = 11"><res:idGeomRing /></xsl:when>
		<xsl:when test="$code = 13"><res:idGeomLine /></xsl:when>
		<xsl:when test="$code = 14"><res:idGeomCircArc /></xsl:when>
		<xsl:when test="$code = 15"><res:idGeomBez /></xsl:when>
		<xsl:when test="$code = 16"><res:idGeomEllArc /></xsl:when>
		<xsl:when test="$code = 17"><res:idGeomBag /></xsl:when>
		<xsl:when test="$code = 18"><res:idGeomTriStr /></xsl:when>
		<xsl:when test="$code = 19"><res:idGeomTriFan /></xsl:when>
		<xsl:when test="$code = 20"><res:idGeomRay /></xsl:when>
		<xsl:when test="$code = 21"><res:idGeomSph /></xsl:when>
		<xsl:when test="$code = 22"><res:idGeomTri /></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="DataQuality_ReportTypeCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = 'DQCompComm'"><res:DQCompComm/></xsl:when>
		<xsl:when test="$code = 'DQCompOm'"><res:DQCompOm/></xsl:when>
		<xsl:when test="$code = 'DQConcConsis'"><res:DQConcConsis/></xsl:when>
		<xsl:when test="$code = 'DQDomConsis'"><res:DQDomConsis/></xsl:when>
		<xsl:when test="$code = 'DQFormConsis'"><res:DQFormConsis/></xsl:when>
		<xsl:when test="$code = 'DQTopConsis'"><res:DQTopConsis/></xsl:when>
		<xsl:when test="$code = 'DQAbsExtPosAcc'"><res:DQAbsExtPosAcc/></xsl:when>
		<xsl:when test="$code = 'DQGridDataPosAcc'"><res:DQGridDataPosAcc/></xsl:when>
		<xsl:when test="$code = 'DQRelIntPosAcc'"><res:DQRelIntPosAcc/></xsl:when>
		<xsl:when test="$code = 'DQAccTimeMeas'"><res:DQAccTimeMeas/></xsl:when>
		<xsl:when test="$code = 'DQTempConsis'"><res:DQTempConsis/></xsl:when>
		<xsl:when test="$code = 'DQTempValid'"><res:DQTempValid/></xsl:when>
		<xsl:when test="$code = 'DQThemClassCor'"><res:DQThemClassCor/></xsl:when>
		<xsl:when test="$code = 'DQNonQuanAttAcc'"><res:DQNonQuanAttAcc/></xsl:when>
		<xsl:when test="$code = 'DQQuanAttAcc'"><res:DQQuanAttAcc/></xsl:when>
		<xsl:when test="$code = 'DQUsabilityEle'"><res:DQUsabilityEle/></xsl:when>
		<xsl:when test="$code = 'DQConfidence'"><res:DQConfidence/></xsl:when>
		<xsl:when test="$code = 'DQRepresentativity'"><res:DQRepresentativity/></xsl:when>
		<xsl:when test="$code = 'DQHomogeneity'"><res:DQHomogeneity/></xsl:when>
		<xsl:otherwise><res:DQOtherwise /> <xsl:value-of select="$code" /></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="EvaluationMethod_ClassCode">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = 'DQFullInspection'"><res:DQFullInspection/></xsl:when>
		<xsl:when test="$code = 'DQSampleBasedInspection'"><res:DQSampleBasedInspection/></xsl:when>
		<xsl:when test="$code = 'DQIndirectEvaluation'"><res:DQIndirectEvaluation/></xsl:when>
		<xsl:when test="$code = 'DQAggregationDerivation'"><res:DQAggregationDerivation/></xsl:when>
		<xsl:when test="$code = 'DQEvaluationMethod'"><res:DQEvaluationMethod/></xsl:when>
		<xsl:when test="$code = 'DQDataInspection'"><res:DQDataInspection/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code" /></xsl:otherwise>
   </xsl:choose>
</xsl:template>


<!-- language codes from ISO 639 -->
<xsl:template name="ISO639_LanguageCode">
	<xsl:param name="code" />
    <xsl:choose>
      <xsl:when test="string-length($code) = 2">
        <xsl:call-template name="lang639_2letter">
          <xsl:with-param name="code" select="$code" />
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="string-length($code) = 3">
        <xsl:call-template name="lang639_3letter">
          <xsl:with-param name="code" select="$code" />
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
</xsl:template>

<!-- country codes from ISO 3166 -->
<xsl:template name="ISO3166_CountryCode">
	<xsl:param name="code" />
    <xsl:choose>
      <xsl:when test="string-length($code) = 2">
        <xsl:call-template name="cntry3166_2letter">
          <xsl:with-param name="code" select="$code" />
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="string-length($code) = 3">
        <xsl:call-template name="cntry3166_3letter">
          <xsl:with-param name="code" select="$code" />
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
</xsl:template>

<!-- codes from ISO 19119 -->

<xsl:template name="SV_CouplTypCd">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idCouplLoose /></xsl:when>
		<xsl:when test="$code = '002'"><res:idCouplMixed /></xsl:when>
		<xsl:when test="$code = '003'"><res:idCouplTight /></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="SV_DCPList">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDcpXml /></xsl:when>
		<xsl:when test="$code = '002'"><res:idDcpCorba /></xsl:when>
		<xsl:when test="$code = '003'"><res:idDcpJava /></xsl:when>
		<xsl:when test="$code = '004'"><res:idDcpCom /></xsl:when>
		<xsl:when test="$code = '005'"><res:idDcpSql /></xsl:when>
		<xsl:when test="$code = '006'"><res:idDcpWebSvc /></xsl:when>
		<xsl:when test="$code = '007'"><res:idDcpSoap /></xsl:when>
		<xsl:when test="$code = '008'"><res:idDcpZ3950 /></xsl:when>
		<xsl:when test="$code = '009'"><res:idDcpHttp /></xsl:when>
		<xsl:when test="$code = '010'"><res:idDcpFtp /></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="SV_ParamDirCd">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:idDirIn /></xsl:when>
		<xsl:when test="$code = '002'"><res:idDirOut /></xsl:when>
		<xsl:when test="$code = '003'"><res:idDirInOut /></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- INSPIRE-specific code lists -->

<xsl:template name="Inspire_LimitationsOnPublicAccess_Code">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:INSPIRE_LOPA_noLimits/></xsl:when>
		<xsl:when test="$code = '002'"><res:INSPIRE_LOPA_sectionA/></xsl:when>
		<xsl:when test="$code = '003'"><res:INSPIRE_LOPA_sectionB/></xsl:when>
		<xsl:when test="$code = '004'"><res:INSPIRE_LOPA_sectionC/></xsl:when>
		<xsl:when test="$code = '005'"><res:INSPIRE_LOPA_sectionD/></xsl:when>
		<xsl:when test="$code = '006'"><res:INSPIRE_LOPA_sectionE/></xsl:when>
		<xsl:when test="$code = '007'"><res:INSPIRE_LOPA_sectionF/></xsl:when>
		<xsl:when test="$code = '008'"><res:INSPIRE_LOPA_sectionG/></xsl:when>
		<xsl:when test="$code = '009'"><res:INSPIRE_LOPA_sectionH/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code" /></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="Inspire_ConditionsApplyingToAccessAndUse_Code">
	<xsl:param name="code" />
	<xsl:choose>
		<xsl:when test="$code = '001'"><res:INSPIRE_CAAU_noLimits/></xsl:when>
		<xsl:when test="$code = '002'"><res:INSPIRE_CAAU_conditionsUnknown/></xsl:when>
		<xsl:otherwise><xsl:value-of select="$code" /></xsl:otherwise>
   </xsl:choose>
</xsl:template>

</xsl:stylesheet>