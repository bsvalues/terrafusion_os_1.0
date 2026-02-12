<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:esri="http://www.esri.com/metadata/" xmlns:res="http://www.esri.com/metadata/res/">

<!-- An XSLT template for displaying metadata in ArcGIS stored in the ArcGIS metadata format.
     Copyright (c) 2014, Esri, Inc. All rights reserved.
     Revision History: Created 5/20/2014 avienneau
-->

  <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'" />
  <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />
	
<!-- templates for handling ArcGIS elements containing coded values specific to units of measure -->

	<xsl:template name="arcgisMeasures">
	<xsl:param name="ele" />
    <dt>
	<xsl:choose>
		<xsl:when test="$ele/@uom">
			<xsl:if test="$ele/@Sync = 'TRUE'">
			<span class="sync">*</span>&#x2009;</xsl:if><span class="esriElement">
				<xsl:call-template name="elementText">
					<xsl:with-param name="ele" select="$ele" />
				</xsl:call-template>
			</span>&#x2003;<xsl:value-of select="."/><xsl:for-each select="./@uom">&#160;<xsl:call-template name="ucum_units">
					<xsl:with-param name="unit" select="." />
				</xsl:call-template>
			</xsl:for-each>
		</xsl:when>
	</xsl:choose>
	</dt>
</xsl:template>


<!-- templates for handling ucum measure codes -->

	<xsl:template name="ucum_units">
		<xsl:param name="unit"/>
		<xsl:variable name="lowerCaseUnit">
      <xsl:value-of select="translate($unit, $upper, $lower)"/>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="($unit = 'Ym')"><xsl:value-of select="$unit"/> (<res:idYotta/>)</xsl:when>
			<xsl:when test="($unit = 'Zm')"><xsl:value-of select="$unit"/> (<res:idZetta/>)</xsl:when>
			<xsl:when test="($unit = 'Em')"><xsl:value-of select="$unit"/> (<res:idExa/>)</xsl:when>
			<xsl:when test="($unit = 'Pm')"><xsl:value-of select="$unit"/> (<res:idPeta/>)</xsl:when>
			<xsl:when test="($unit = 'Tm')"><xsl:value-of select="$unit"/> (<res:idTera/>)</xsl:when>
			<xsl:when test="($unit = 'Gm')"><xsl:value-of select="$unit"/> (<res:idGiga/>)</xsl:when>
			<xsl:when test="($unit = 'Mm')"><xsl:value-of select="$unit"/> (<res:idMega/>)</xsl:when>
			<xsl:when test="($unit = 'km')"><xsl:value-of select="$unit"/> (<res:idKilo/>)</xsl:when>
			<xsl:when test="($unit = 'hm')"><xsl:value-of select="$unit"/> (<res:idHecto/>)</xsl:when>
			<xsl:when test="($unit = 'dam')"><xsl:value-of select="$unit"/> (<res:idDeka/>)</xsl:when>
			<xsl:when test="($unit = 'dm')"><xsl:value-of select="$unit"/> (<res:idDeci/>)</xsl:when>
			<xsl:when test="($unit = 'cm')"><xsl:value-of select="$unit"/> (<res:idCenti/>)</xsl:when>
			<xsl:when test="($unit = 'mm')"><xsl:value-of select="$unit"/> (<res:idMilli/>)</xsl:when>
			<xsl:when test="($unit = 'um')"><xsl:value-of select="$unit"/> (<res:idMicro/>)</xsl:when>
			<xsl:when test="($unit = 'nn')"><xsl:value-of select="$unit"/> (<res:idNano/>)</xsl:when>
			<xsl:when test="($unit = 'pm')"><xsl:value-of select="$unit"/> (<res:idPico/>)</xsl:when>
			<xsl:when test="($unit = 'fm')"><xsl:value-of select="$unit"/> (<res:idFemto/>)</xsl:when>
			<xsl:when test="($unit = 'am')"><xsl:value-of select="$unit"/> (<res:idAtto/>)</xsl:when>
			<xsl:when test="($unit = 'zm')"><xsl:value-of select="$unit"/> (<res:idZepto/>)</xsl:when>
			<xsl:when test="($unit = 'ym')"><xsl:value-of select="$unit"/> (<res:idYocto/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'm')"><xsl:value-of select="$unit"/> (<res:idMeter/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 's')"><xsl:value-of select="$unit"/> (<res:idSecond/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'g')"><xsl:value-of select="$unit"/> (<res:idGram/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'rad')"><xsl:value-of select="$unit"/> (<res:idRadian/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'k')"><xsl:value-of select="$unit"/> (<res:idKelvin/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'c')"><xsl:value-of select="$unit"/> (<res:idCoulomb/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cd')"><xsl:value-of select="$unit"/> (<res:idCandela/>)</xsl:when>
			<xsl:when test="($unit = '10*')"><xsl:value-of select="$unit"/> (<res:idTenArbPowsStar/>)</xsl:when>
			<xsl:when test="($unit = '10^')"><xsl:value-of select="$unit"/> (<res:idTenArbPowsCarat/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pi]')"><xsl:value-of select="$unit"/> (<res:idPi/>)</xsl:when>
			<xsl:when test="($unit = '%')"><xsl:value-of select="$unit"/> (<res:idPercent/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ppth]')"><xsl:value-of select="$unit"/> (<res:idPPTh/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ppm]')"><xsl:value-of select="$unit"/> (<res:idPPM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ppb]')"><xsl:value-of select="$unit"/> (<res:idPPB/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pptr]')"><xsl:value-of select="$unit"/> (<res:idPPTr/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mol')"><xsl:value-of select="$unit"/> (<res:idMole/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'sr')"><xsl:value-of select="$unit"/> (<res:idSteradian/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'hz')"><xsl:value-of select="$unit"/> (<res:idHertz/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'n')"><xsl:value-of select="$unit"/> (<res:idNewton/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'pa') or ($lowerCaseUnit = 'pal')"><xsl:value-of select="$unit"/> (<res:idPascal/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'j')"><xsl:value-of select="$unit"/> (<res:idJoule/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'w')"><xsl:value-of select="$unit"/> (<res:idWatt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'a')"><xsl:value-of select="$unit"/> (<res:idAmp/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'v')"><xsl:value-of select="$unit"/> (<res:idVolt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'f')"><xsl:value-of select="$unit"/> (<res:idFarad/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ohm')"><xsl:value-of select="$unit"/> <res:idOhm/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 's') or ($lowerCaseUnit = 'sie')"><xsl:value-of select="$unit"/> (<res:idSiemens/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'wb')"><xsl:value-of select="$unit"/> (<res:idWeber/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cel')"><xsl:value-of select="$unit"/> (<res:idDegCelsius/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 't')"><xsl:value-of select="$unit"/> (<res:idTesla/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'h')"><xsl:value-of select="$unit"/> (<res:idHenry/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'lm')"><xsl:value-of select="$unit"/> (<res:idLumen/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'lx')"><xsl:value-of select="$unit"/> (<res:idLux/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bq')"><xsl:value-of select="$unit"/> (<res:idBecquerel/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gy')"><xsl:value-of select="$unit"/> (<res:idGray/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'sv')"><xsl:value-of select="$unit"/> (<res:idSievert/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gon')"><xsl:value-of select="$unit"/> (<res:idGonGrade/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'deg')"><xsl:value-of select="$unit"/> (<res:idDegree/>)</xsl:when>
			<xsl:when test='($unit = "&apos;")'><xsl:value-of select="$unit"/> (<res:idMinute/>)</xsl:when>
			<xsl:when test="($unit = '&quot;')"><xsl:value-of select="$unit"/> (<res:idSecond_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'l')"><xsl:value-of select="$unit"/> (<res:idLiter/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ar')"><xsl:value-of select="$unit"/> (<res:idAre/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'min')"><xsl:value-of select="$unit"/> (<res:idMinute_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'h')"><xsl:value-of select="$unit"/> (<res:idHour/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'd')"><xsl:value-of select="$unit"/> (<res:idDay/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'a_t') or ($lowerCaseUnit = 'ann_t')"><xsl:value-of select="$unit"/> (<res:idTropicalYear/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'a_j') or ($lowerCaseUnit = 'ann_j')"><xsl:value-of select="$unit"/> (<res:idMeanJulianYear/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'a_g') or ($lowerCaseUnit = 'ann_g')"><xsl:value-of select="$unit"/> (<res:idMeanGregorianYear/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'a') or ($lowerCaseUnit = 'ann')"><xsl:value-of select="$unit"/> (<res:idYear/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'wk')"><xsl:value-of select="$unit"/> (<res:idWeek/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mo_s')"><xsl:value-of select="$unit"/> (<res:idSynodalMonth/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mo_j')"><xsl:value-of select="$unit"/> (<res:idMeanJulianMonth/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mo_g')"><xsl:value-of select="$unit"/> (<res:idMeanGregorianMonth/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mo')"><xsl:value-of select="$unit"/> (<res:idMonth/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 't') or ($lowerCaseUnit = 'tne')"><xsl:value-of select="$unit"/> (<res:idTonne/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bar')"><xsl:value-of select="$unit"/> (<res:idBar/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'u') or ($lowerCaseUnit = 'amu')"><xsl:value-of select="$unit"/> (<res:idAMU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ev')"><xsl:value-of select="$unit"/> (<res:idEV/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'au') or ($lowerCaseUnit = 'asu')"><xsl:value-of select="$unit"/> (<res:idAU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'pc') or ($lowerCaseUnit = 'prs')"><xsl:value-of select="$unit"/> (<res:idParsec/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[c]')"><xsl:value-of select="$unit"/> (<res:idVelocityOfLight/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[h]')"><xsl:value-of select="$unit"/> (<res:idPlanckConstant/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[k]')"><xsl:value-of select="$unit"/> (<res:idBoltzmannConstant/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[eps_0]')"><xsl:value-of select="$unit"/> (<res:idPermittivityOfVacuum/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mu_0]')"><xsl:value-of select="$unit"/> (<res:idPermeabilityOfVacuum/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[e]')"><xsl:value-of select="$unit"/> (<res:idElementaryCharge/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[m_e]')"><xsl:value-of select="$unit"/> (<res:idElectronMass/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[m_p]')"><xsl:value-of select="$unit"/> (<res:idProtonMass/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[g]') or ($lowerCaseUnit = '[gc]')"><xsl:value-of select="$unit"/> (<res:idNewtonGravConstant/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[g]')"><xsl:value-of select="$unit"/> (<res:idStdFreefallAccel/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'atm')"><xsl:value-of select="$unit"/> (<res:idStdAtmo/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ly]')"><xsl:value-of select="$unit"/> (<res:idLightyear/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gf')"><xsl:value-of select="$unit"/> (<res:idGramForce/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lbf_av]')"><xsl:value-of select="$unit"/> (<res:idPoundForce/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ky')"><xsl:value-of select="$unit"/> (<res:idKayser/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gal') or ($lowerCaseUnit = 'gl')"><xsl:value-of select="$unit"/> (<res:idGal/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'dyn')"><xsl:value-of select="$unit"/> (<res:idDyne/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'erg')"><xsl:value-of select="$unit"/> (<res:idErg/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'p')"><xsl:value-of select="$unit"/> (<res:idPoise/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bi')"><xsl:value-of select="$unit"/> (<res:idBiot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'st')"><xsl:value-of select="$unit"/> (<res:idStokes/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mx')"><xsl:value-of select="$unit"/> (<res:idMaxwell/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'g') or ($lowerCaseUnit = 'gs')"><xsl:value-of select="$unit"/> (<res:idGauss/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'oe')"><xsl:value-of select="$unit"/> (<res:idOersted/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gb')"><xsl:value-of select="$unit"/> (<res:idGilbert/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'sb')"><xsl:value-of select="$unit"/> (<res:idStilb/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'lmb')"><xsl:value-of select="$unit"/> (<res:idLambert/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ph') or ($lowerCaseUnit = 'pht')"><xsl:value-of select="$unit"/> (<res:idPhot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ci')"><xsl:value-of select="$unit"/> (<res:idCurie/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'r') or ($lowerCaseUnit = 'roe')"><xsl:value-of select="$unit"/> (<res:idRoentgen/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'rad') or ($lowerCaseUnit = '[rad]')"><xsl:value-of select="$unit"/> (<res:idRadiationAbsorbedDose/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'rem') or ($lowerCaseUnit = '[rem]')"><xsl:value-of select="$unit"/> (<res:idRadiationEquivalentMan/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[in_i]')"><xsl:value-of select="$unit"/> (<res:idInch/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ft_i]')"><xsl:value-of select="$unit"/> (<res:idFoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[yd_i]')"><xsl:value-of select="$unit"/> (<res:idYard/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mi_i]')"><xsl:value-of select="$unit"/> (<res:idStatuteMile/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fth_i]')"><xsl:value-of select="$unit"/> (<res:idFathom/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[nmi_i]')"><xsl:value-of select="$unit"/> (<res:idNauticalMile/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[kn_i]')"><xsl:value-of select="$unit"/> (<res:idKnot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[sin_i]')"><xsl:value-of select="$unit"/> (<res:idSquareInch/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[sft_i]')"><xsl:value-of select="$unit"/> (<res:idSquareFoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[syd_i]')"><xsl:value-of select="$unit"/> (<res:idSquareYard/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cin_i]')"><xsl:value-of select="$unit"/> (<res:idCubicInch/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cft_i]')"><xsl:value-of select="$unit"/> (<res:idCubicFoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cyd_i]')"><xsl:value-of select="$unit"/> (<res:idCubicYard/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[bf_i]')"><xsl:value-of select="$unit"/> (<res:idBoardFoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cr_i]')"><xsl:value-of select="$unit"/> (<res:idCord/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mil_i]')"><xsl:value-of select="$unit"/> (<res:idMil/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cml_i]')"><xsl:value-of select="$unit"/> (<res:idCircularMil/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[hd_i]')"><xsl:value-of select="$unit"/> (<res:idHand/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ft_us]')"><xsl:value-of select="$unit"/> (<res:idFoot_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[yd_us]')"><xsl:value-of select="$unit"/> (<res:idYard_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[in_us]')"><xsl:value-of select="$unit"/> (<res:idInch_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[rd_us]')"><xsl:value-of select="$unit"/> (<res:idRod/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ch_us]')"><xsl:value-of select="$unit"/> (<res:idGunterSurveyorChain/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lk_us]')"><xsl:value-of select="$unit"/> (<res:idGunterChainLink/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[rch_us]')"><xsl:value-of select="$unit"/> (<res:idRamdenEngineerChain/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[rlk_us]')"><xsl:value-of select="$unit"/> (<res:idRamdenChainLink/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fth_us]')"><xsl:value-of select="$unit"/> (<res:idFathom_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fur_us]')"><xsl:value-of select="$unit"/> (<res:idFurlong/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mi_us]')"><xsl:value-of select="$unit"/> <res:idMile/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[acr_us]')"><xsl:value-of select="$unit"/> (<res:idAcre/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[srd_us]')"><xsl:value-of select="$unit"/> (<res:idSquareRod/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[smi_us]')"><xsl:value-of select="$unit"/> (<res:idSquareMile/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[sct]')"><xsl:value-of select="$unit"/> (<res:idSection/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[twp]')"><xsl:value-of select="$unit"/> (<res:idTownship/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mil_us]')"><xsl:value-of select="$unit"/> (<res:idMil_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[in_br]')"><xsl:value-of select="$unit"/> (<res:idInch_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ft_br]')"><xsl:value-of select="$unit"/> (<res:idFoot_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[rd_br]')"><xsl:value-of select="$unit"/> (<res:idRod_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ch_br]')"><xsl:value-of select="$unit"/> (<res:idGunterChain/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lk_br]')"><xsl:value-of select="$unit"/> (<res:idGunterChainLink_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fth_br]')"><xsl:value-of select="$unit"/> (<res:idFathom_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pc_br]')"><xsl:value-of select="$unit"/> (<res:idPace/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[yd_br]')"><xsl:value-of select="$unit"/> (<res:idYard_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mi_br]')"><xsl:value-of select="$unit"/> (<res:idMile_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[nmi_br]')"><xsl:value-of select="$unit"/> (<res:idNauticalMile_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[kn_br]')"><xsl:value-of select="$unit"/> (<res:idKnot_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[acr_br]')"><xsl:value-of select="$unit"/> (<res:idAcre_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gal_us]')"><xsl:value-of select="$unit"/> (<res:idQueenAnneWineGallon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[bbl_us]')"><xsl:value-of select="$unit"/> (<res:idBarrel/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[qt_us]')"><xsl:value-of select="$unit"/> (<res:idQuart/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pt_us]')"><xsl:value-of select="$unit"/> (<res:idPint/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gil_us]')"><xsl:value-of select="$unit"/> (<res:idGill/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[foz_us]')"><xsl:value-of select="$unit"/> (<res:idFluidOunce/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fdr_us]')"><xsl:value-of select="$unit"/> (<res:idFluidDram/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[min_us]')"><xsl:value-of select="$unit"/> (<res:idMinim/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[crd_us]')"><xsl:value-of select="$unit"/> (<res:idCord_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[bu_us]')"><xsl:value-of select="$unit"/> (<res:idBushel/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gal_wi]')"><xsl:value-of select="$unit"/> (<res:idHistWinchesterGallon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pk_us]')"><xsl:value-of select="$unit"/> (<res:idPeck/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[dqt_us]')"><xsl:value-of select="$unit"/> (<res:idDryQuart/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[dpt_us]')"><xsl:value-of select="$unit"/> (<res:idDryPint/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[tbs_us]')"><xsl:value-of select="$unit"/> (<res:idTablespoon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[tsp_us]')"><xsl:value-of select="$unit"/> (<res:idTeaspoon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cup_us]')"><xsl:value-of select="$unit"/> (<res:idCup/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gal_br]')"><xsl:value-of select="$unit"/> (<res:idGallon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pk_br]')"><xsl:value-of select="$unit"/> (<res:idPeck_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[bu_br]')"><xsl:value-of select="$unit"/> (<res:idBushel_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[qt_br]')"><xsl:value-of select="$unit"/> (<res:idQuart_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pt_br]')"><xsl:value-of select="$unit"/> (<res:idPint_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gil_br]')"><xsl:value-of select="$unit"/> (<res:idGill_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[foz_br]')"><xsl:value-of select="$unit"/> (<res:idFluidOunce_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[fdr_br]')"><xsl:value-of select="$unit"/> (<res:idFluidDram_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[min_br]')"><xsl:value-of select="$unit"/> (<res:idMinim_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[gr]')"><xsl:value-of select="$unit"/> (<res:idGrain/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lb_av]')"><xsl:value-of select="$unit"/> (<res:idPound/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[oz_av]')"><xsl:value-of select="$unit"/> (<res:idOunce/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[dr_av]')"><xsl:value-of select="$unit"/> (<res:idDram/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[scwt_av]')"><xsl:value-of select="$unit"/> (<res:idShortUSHundredweight/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lcwt_av]')"><xsl:value-of select="$unit"/> (<res:idLongBritishHundredweight/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ston_av]')"><xsl:value-of select="$unit"/> (<res:idShortUSTon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lton_av]')"><xsl:value-of select="$unit"/> (<res:idLongBritishTon/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[stone_av]') "><xsl:value-of select="$unit"/> (<res:idBritishStone/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pwt_tr]')"><xsl:value-of select="$unit"/> (<res:idPennyweight/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[oz_tr]')"><xsl:value-of select="$unit"/> (<res:idOunce_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lb_tr]')"><xsl:value-of select="$unit"/> (<res:idPound_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[sc_ap]')"><xsl:value-of select="$unit"/> (<res:idScruple/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[dr_ap]')"><xsl:value-of select="$unit"/> (<res:idDramDrachm/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[oz_ap]')"><xsl:value-of select="$unit"/> (<res:idOunce_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lb_ap]')"><xsl:value-of select="$unit"/> (<res:idPound_auxUCUM_0/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lne]')"><xsl:value-of select="$unit"/> (<res:idLine/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pnt]')"><xsl:value-of select="$unit"/> (<res:idPoint_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pca]')"><xsl:value-of select="$unit"/> (<res:idPica/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pnt_pr]')"><xsl:value-of select="$unit"/> (<res:idPrinterPoint/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pca_pr]')"><xsl:value-of select="$unit"/> (<res:idPrinterPica/>))</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pied]')"><xsl:value-of select="$unit"/> (<res:idPiedFrenchFoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pouce]')"><xsl:value-of select="$unit"/> (<res:idPouceFrenchInch/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ligne]')"><xsl:value-of select="$unit"/> (<res:idLigneFrenchLine/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[didot]')"><xsl:value-of select="$unit"/> (<res:idDidotPoint/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cicero]')"><xsl:value-of select="$unit"/> (<res:idCiceroDidotPica/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[degf]')"><xsl:value-of select="$unit"/> (<res:idDegreeFahrenheit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal_[15]')"><xsl:value-of select="$unit"/> (<res:idCalorieAt15C/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal_[20]')"><xsl:value-of select="$unit"/> (<res:idCalorieAt20C/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal_m')"><xsl:value-of select="$unit"/> (<res:idMeanCalorie/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal_it')"><xsl:value-of select="$unit"/> (<res:idIntlTableCalorie/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal_th')"><xsl:value-of select="$unit"/> (<res:idThermochemCalorie/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'cal')"><xsl:value-of select="$unit"/> (<res:idCalorie/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cal]')"><xsl:value-of select="$unit"/> (<res:idNutritionLabelCalories/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_39]')"><xsl:value-of select="$unit"/> (<res:idBTUAt39F/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_59]')"><xsl:value-of select="$unit"/> (<res:idBTUAt59F/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_60]')"><xsl:value-of select="$unit"/> (<res:idBTUAt60F/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_m]')"><xsl:value-of select="$unit"/> (<res:idMeanBTU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_it]')"><xsl:value-of select="$unit"/> (<res:idIntlTableBTU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu_th]')"><xsl:value-of select="$unit"/> (<res:idThermochemBTU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[btu]')"><xsl:value-of select="$unit"/> (<res:idBTU/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[hp]')"><xsl:value-of select="$unit"/> (<res:idHorsepower/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'm[h2o]')"><xsl:value-of select="$unit"/> (<res:idMeterOfWaterColumn/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'm[hg]')"><xsl:value-of select="$unit"/> (<res:idMeterOfMercuryColumn/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[in_i&apos;h2o]")'><xsl:value-of select="$unit"/> (<res:idInchOfWaterColumn/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[in_i&apos;hg]")'><xsl:value-of select="$unit"/> (<res:idInchOfMercuryColumn/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pru]')"><xsl:value-of select="$unit"/> (<res:idPeripheralVascularResistanceUnit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[diop]')"><xsl:value-of select="$unit"/> (<res:idDiopter/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[p&apos;diop]")'><xsl:value-of select="$unit"/> (<res:idPrismDiopter/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '%[slope]')"><xsl:value-of select="$unit"/> (<res:idPercentOfSlope/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[mesh_i]')"><xsl:value-of select="$unit"/> (<res:idMesh/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ch]')"><xsl:value-of select="$unit"/> (<res:idCharriereFrench/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[drp]')"><xsl:value-of select="$unit"/> (<res:idDrop/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[hnsf&apos;u]")'><xsl:value-of select="$unit"/> (<res:idHounsfieldUnit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[met]')"><xsl:value-of select="$unit"/> (<res:idMetabolicEquivalent/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[hp_x]')"><xsl:value-of select="$unit"/> (<res:idHomeopathicPotencyOfDecimalSeries/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[hp_c]')"><xsl:value-of select="$unit"/> (<res:idHomeopathicPotencyOfCentesimalSeries/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'eq')"><xsl:value-of select="$unit"/> (<res:idEquivalents/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'osm')"><xsl:value-of select="$unit"/> (<res:idOsmole/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ph]')"><xsl:value-of select="$unit"/> (<res:idPh/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'g%')"><xsl:value-of select="$unit"/> (<res:idGramPercent/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[s]')"><xsl:value-of select="$unit"/> (<res:idSvedbergUnit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[hpf]')"><xsl:value-of select="$unit"/> (<res:idHighPowerField/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[lpf]')"><xsl:value-of select="$unit"/> (<res:idLowPowerField/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'kat')"><xsl:value-of select="$unit"/> (<res:idKatal/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'u')"><xsl:value-of select="$unit"/> (<res:idUnit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[iu]')"><xsl:value-of select="$unit"/> (<res:idIntlUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[arb&apos;u]")'><xsl:value-of select="$unit"/> (<res:idArbitaryUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[usp&apos;u]")'><xsl:value-of select="$unit"/> (<res:idUnitedStatesPharmacopeiaUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[gpl&apos;u]")'><xsl:value-of select="$unit"/> (<res:idGPLUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[mpl&apos;u]")'><xsl:value-of select="$unit"/> (<res:idMPLUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[apl&apos;u]")'><xsl:value-of select="$unit"/> (<res:idAPLUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[beth&apos;u]")'><xsl:value-of select="$unit"/> (<res:idBethesdaUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[todd&apos;u]")'><xsl:value-of select="$unit"/> (<res:idToddUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[dye&apos;u]")'><xsl:value-of select="$unit"/> (<res:idDyeUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[smgy&apos;u]")'><xsl:value-of select="$unit"/> (<res:idSomogyiUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[bdsk&apos;u]")'><xsl:value-of select="$unit"/> (<res:idBodanskyUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[ka&apos;u]")'><xsl:value-of select="$unit"/> (<res:idKingArmstrongUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[knk&apos;u]")'><xsl:value-of select="$unit"/> (<res:idKunkelUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[mclg&apos;u]")'><xsl:value-of select="$unit"/> (<res:idMacLaganUnit/>)</xsl:when>
			<xsl:when test='($lowerCaseUnit = "[tb&apos;u]")'><xsl:value-of select="$unit"/> (<res:idTuberculinUnit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ccid_50]')"><xsl:value-of select="$unit"/> (<res:id50PctCellCultureInfectiousDose/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[tcid_50]')"><xsl:value-of select="$unit"/> (<res:id50PctTissueCultureInfectiousDose/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[pfu]')"><xsl:value-of select="$unit"/> (<res:idPlaqueFormingUnits/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[ffu]')"><xsl:value-of select="$unit"/> (<res:idImmunofocusFormingUnits/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[cfu]')"><xsl:value-of select="$unit"/> (<res:idColonyFormingUnits/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'np') or ($lowerCaseUnit = 'nep')"><xsl:value-of select="$unit"/> (<res:idNeper/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b')"><xsl:value-of select="$unit"/> (<res:idBel/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[spl]')"><xsl:value-of select="$unit"/> (<res:idBelSoundPressure/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[v]')"><xsl:value-of select="$unit"/> (<res:idBelVolt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[mv]')"><xsl:value-of select="$unit"/> (<res:idBelMillivolt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[uv]')"><xsl:value-of select="$unit"/> (<res:idBelMicrovolt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[w]')"><xsl:value-of select="$unit"/> (<res:idBelWatt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b[kw]')"><xsl:value-of select="$unit"/> (<res:idBelKilowatt/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'st') or ($lowerCaseUnit = 'str')"><xsl:value-of select="$unit"/> (<res:idStere/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ao')"><xsl:value-of select="$unit"/> (<res:idAngstrom/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'b') or ($lowerCaseUnit = 'brn')"><xsl:value-of select="$unit"/> (<res:idBarn/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'att')"><xsl:value-of select="$unit"/> (<res:idTechAtmo/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mho')"><xsl:value-of select="$unit"/> (<res:idMho/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[psi]')"><xsl:value-of select="$unit"/> (<res:idPoundPerSqareInch/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'circ')"><xsl:value-of select="$unit"/> (<res:idCircle/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'sph')"><xsl:value-of select="$unit"/> (<res:idSpere/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[car_m]')"><xsl:value-of select="$unit"/> (<res:idMetricCarat/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[car_au]')"><xsl:value-of select="$unit"/> (<res:idCaratOfGoldAlloys/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = '[smoot]')"><xsl:value-of select="$unit"/> (<res:idSmoot/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bit_s')"><xsl:value-of select="$unit"/> (<res:idBit/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bit')"><xsl:value-of select="$unit"/> (<res:idBit_auxUCUM/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'by')"><xsl:value-of select="$unit"/> (<res:idByte/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'bd')"><xsl:value-of select="$unit"/> (<res:idBaud/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ki') or ($lowerCaseUnit = 'kib')"><xsl:value-of select="$unit"/> (<res:idKibi/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'mi') or ($lowerCaseUnit = 'mib')"><xsl:value-of select="$unit"/> (<res:idMebi/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'gi') or ($lowerCaseUnit = 'gib')"><xsl:value-of select="$unit"/> (<res:idGibi/>)</xsl:when>
			<xsl:when test="($lowerCaseUnit = 'ti') or ($lowerCaseUnit = 'tib')"><xsl:value-of select="$unit"/> (<res:idTebi/>)</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="."/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>