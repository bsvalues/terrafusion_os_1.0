

create procedure CompSalesGetCorpPropLoadCriteria
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lPacsUserID int,
	@szClassCode varchar(10) = '' output,
	@szSubmarket varchar(10) = '' output,
	@szPropertyUse varchar(10) = '' output,
	@szCVA varchar(10) = '' output,
	@szYearBuiltFrom varchar(4) = '' output,
	@szYearBuiltTo varchar(4) = '' output,
	@szBldgSQFTFrom varchar(16) = '' output,
	@szBldgSQFTTo varchar(16) = '' output,
	@szLandSQFTFrom varchar(16) = '' output,
	@szLandSQFTTo varchar(16) = '' output,
	@szNumUnitsFrom varchar(16) = '' output,
	@szNumUnitsTo varchar(16) = '' output,
	@szSaleDateMin varchar(16) = '' output,
	@szSaleDateMax varchar(16) = '' output,
	@szSaleRatioCodes varchar(255) = '' output,
	@szEffectiveYearBuiltFrom varchar(4) = '' output,
	@szEffectiveYearBuiltTo varchar(4) = '' output,
	@szNRAFrom varchar(16) = '' output,
	@szNRATo varchar(16) = '' output,
	@szAbsSubdivision varchar(10) = '' output,
	@szNeighborhood varchar(10) = '' output,
	@szSubset varchar(10) = '' output,
	@szSchool char(5) = '' output,
	@szCity char(5) = '' output,
	@szStateCode varchar(10) = '' output,
	@szPGIFrom varchar(16) = '' output,
	@szPGITo varchar(16) = '' output,
	@szEGIFrom varchar(16) = '' output,
	@szEGITo varchar(16) = '' output,
	@szNOIFrom varchar(16) = '' output,
	@szNOITo varchar(16) = '' output,
	@szEXPFrom varchar(16) = '' output,
	@szEXPTo varchar(16) = '' output,
	@szVacancyFrom varchar(16) = '' output,
	@szVacancyTo varchar(16) = '' output,
	@szAppraisedFrom varchar(16) = '' output,
	@szAppraisedTo varchar(16) = '' output,
	@szIncomeClass varchar(10) = '' output,
	@szCapRateFrom varchar(16) = '' output,
	@szCapRateTo varchar(16) = '' output
as

set nocount on

	declare
		@bQuality bit,
		@bSubmarket bit,
		@bPropertyUse bit,
		@bCVA bit,
		@bAge bit,
		@lAgeRange int,
		@bBldgArea bit,
		@lBldgAreaRange int,
		@bLandArea bit,
		@lLandAreaRange int,
		@bNumUnits bit,
		@lNumUnitsRange int,
		@bSaleDateRange bit,
		@bEffectiveAge bit,
		@lEffectiveAgeRange int,
		@bNRA bit,
		@lNRARange int,
		@bRegion bit,
		@bAbsSubdivision bit,
		@bNeighborhood bit,
		@bSubset bit,
		@bSchool bit,
		@bCity bit,
		@bStateCode bit,
		@bPGI bit,
		@lPGIRange int,
		@bEGI bit,
		@lEGIRange int,
		@bNOI bit,
		@lNOIRange int,
		@bEXP bit,
		@lEXPRange int,
		@bVacancy bit,
		@lVacancyRange int,
		@bAppraised bit,
		@lAppraisedRange int,
		@bIncomeClass bit,
		@bCapRate bit,
		@lCapRateRange int

	select
		@bQuality = bQuality,
		@bSubmarket = bSubmarket,
		@bPropertyUse = bPropertyUse,
		@bCVA = bCVA,
		@bAge = bAge,
		@lAgeRange = lAgeRange,
		@bBldgArea = bBldgArea,
		@lBldgAreaRange = lBldgAreaRange,
		@bLandArea = bLandArea,
		@lLandAreaRange = lLandAreaRange,
		@bNumUnits = bNumUnits,
		@lNumUnitsRange = lNumUnitsRange,
		@bSaleDateRange = bSaleDateRange,
		@szSaleDateMin = szSaleDateMin,
		@szSaleDateMax = szSaleDateMax,
		@szSaleRatioCodes = szSaleRatioCodes,
		@bEffectiveAge = bEffectiveAge,
		@lEffectiveAgeRange = lEffectiveAgeRange,
		@bNRA = bNRA,
		@lNRARange = lNRARange,
		@bRegion = bRegion,
		@bAbsSubdivision = bAbsSubdivision,
		@bNeighborhood = bNeighborhood,
		@bSubset = bSubset,
		@bSchool = bSchool,
		@bCity = bCity,
		@bStateCode = bStateCode,
		@bPGI = bPGI,
		@lPGIRange = lPGIRange,
		@bEGI = bEGI,
		@lEGIRange = lEGIRange,
		@bNOI = bNOI,
		@lNOIRange = lNOIRange,
		@bEXP = bEXP,
		@lEXPRange = lEXPRange,
		@bVacancy = bVacancy,
		@lVacancyRange = lVacancyRange,
		@bAppraised = bAppraised,
		@lAppraisedRange = lAppraisedRange,
		@bIncomeClass = bIncomeClass,
		@bCapRate = bCapRate,
		@lCapRateRange = lCapRateRange
		
	from comp_sales_corp_load_criteria with(nolock)
	where
		lPacsUserID = @lPacsUserID

	declare @szSitus varchar(512)
	declare @szFinanceCode char(5)
	declare @szSaleDate varchar(16)
	declare @lLivingArea numeric(14,0)
	declare @fLandSizeSQFT numeric(18,2)
	declare @lEffYearBuilt numeric(4,0)
	declare @lNumUnits int
	declare @lMarket numeric(14,0)
	declare @lSalePrice numeric(14,0)
	declare @lYearBuilt numeric(4,0)
	declare @szImagePath varchar(255)
	declare @fPctLandVal float(24)
	declare @fPctImprovVal float(24)
	declare @cInCounty char(1)
	declare @fPctBusinessValue float(24)
	declare @szDBAName varchar(50)
	declare @lSaleAdjustmentAmount numeric(14,0)
	declare @fSaleAdjustmentPct numeric(8,4)
	declare @szSaleAdjustmentReason varchar(50)
	declare @lAdjustedSalePrice numeric(14,0)
	declare @szRegion varchar(10)
	declare @szSubdivision varchar(10)
	declare @lNRA numeric(14,0)
	declare @lEffectiveYear numeric(4,0)
	declare @lPGI numeric(14,2)
	declare @lEGI numeric(14,2)
	declare @lNOI numeric(14,2)
	declare @lCapRate numeric(5,2)
	declare @lEXP numeric(14,2)
	declare @lVAC numeric(5,2)
	declare @lAppraisedVal numeric(14,2)

	exec CompSalesGetCorpPropInfo
		@lPropID,
		NULL,
		@lYear,
		0,
		@szSitus output,
		@szClassCode output,
		@szSubmarket output,
		@szPropertyUse output,
		@szFinanceCode output,
		@szSaleDate output,
		@lLivingArea output,
		@fLandSizeSQFT output,
		@lEffYearBuilt output,
		@szCVA output,
		@lNumUnits output,
		@lMarket output,
		@lSalePrice output,
		@lYearBuilt output,
		@szImagePath output,
		@fPctLandVal output,
		@fPctImprovVal output,
		@cInCounty output,
		@fPctBusinessValue output,
		@szDBAName output,
		@lSaleAdjustmentAmount output,
		@fSaleAdjustmentPct output,
		@szSaleAdjustmentReason output,
		@lAdjustedSalePrice output,
		@szRegion output,
		@szSubdivision output,
		@szNeighborhood output,
		@szSubset output,
		@szSchool output,
		@szCity output,
		@szStateCode output,
		@lNRA output,
		@lEffectiveYear output,
		@lPGI output,
		@lEGI output,
		@lNOI output,
		@lCapRate output,
		@lEXP output,
		@lVAC output,
		@lAppraisedVal output,
		@szIncomeClass output

	declare @lRange numeric(14,0)

	if (@bQuality = 0)
	begin
		set @szClassCode = ''
	end
	
	if (@bSubmarket = 0)
	begin
		set @szSubmarket = ''
	end
	
	if (@bPropertyUse = 0)
	begin
		set @szPropertyUse = ''
	end
	
	if (@bCVA = 0)
	begin
		set @szCVA = ''
	end
	
	if (@bAge = 0)
	begin
		set @szYearBuiltFrom = ''
		set @szYearBuiltTo = ''
	end
	else
	begin
		set @szYearBuiltFrom = convert(varchar(4), @lYearBuilt - @lAgeRange)
		set @szYearBuiltTo = convert(varchar(4), @lYearBuilt + @lAgeRange)
	end

	if (@bBldgArea = 0)
	begin
		set @szBldgSQFTFrom = ''
		set @szBldgSQFTTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lBldgAreaRange) / 100.0 * convert(float(24), @lLivingArea)
		
		set @szBldgSQFTFrom = convert(varchar(16), @lLivingArea - @lRange)
		set @szBldgSQFTTo = convert(varchar(16), @lLivingArea + @lRange)
	end

	if (@bLandArea = 0)
	begin
		set @szLandSQFTFrom = ''
		set @szLandSQFTTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lLandAreaRange) / 100.0 * @fLandSizeSQFT

		set @szLandSQFTFrom = convert(varchar(16), @fLandSizeSQFT - @lRange)
		set @szLandSQFTTo = convert(varchar(16), @fLandSizeSQFT + @lRange)
	end

	if (@bNumUnits = 0)
	begin
		set @szNumUnitsFrom = ''
		set @szNumUnitsTo = ''
	end
	else
	begin
		set @szNumUnitsFrom = convert(varchar(16), @lNumUnits - @lNumUnitsRange)
		set @szNumUnitsTo = convert(varchar(16), @lNumUnits + @lNumUnitsRange)
	end

	if (@bSaleDateRange = 0)
	begin
		set @szSaleDateMin = ''
		set @szSaleDateMax = ''
	end

	if (@bEffectiveAge = 0)
	begin
		set @szEffectiveYearBuiltFrom = ''
		set @szEffectiveYearBuiltTo = ''
	end
	else
	begin
		set @szEffectiveYearBuiltFrom = convert(varchar(4), @lEffYearBuilt - @lEffectiveAgeRange)
		set @szEffectiveYearBuiltTo = convert(varchar(4), @lEffYearBuilt + @lEffectiveAgeRange)
	end

	if (@bNRA = 0)
	begin
		set @szNRAFrom = ''
		set @szNRATo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lNRARange / 100.0 * convert(float(24), @lNRA))

		set @szNRAFrom = convert(varchar(16), @lNRA - @lRange)
		set @szNRATo = convert(varchar(16), @lNRA + @lRange)
	end

	if (@bRegion = 0)
	begin
		set @szRegion = ''
	end

	if (@bAbsSubdivision = 0)
	begin
		set @szAbsSubdivision = ''
	end

	if (@bSubset = 0)
	begin
		set @szSubset = ''
	end

	if (@bSchool = 0)
	begin
		set @szSchool = ''
	end

	if (@bCity = 0)
	begin
		set @szCity = ''
	end

	if (@bStateCode = 0)
	begin
		set @szStateCode = ''
	end

	if (@bNeighborhood = 0)
	begin
		set @szNeighborhood = ''
	end

	if (@bPGI = 0)
	begin
		set @szPGIFrom = ''
		set @szPGITo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lPGIRange / 100.0 * convert(float(24), @lPGI))

		set @szPGIFrom = convert(varchar(16), @lPGI - @lRange)
		set @szPGITo = convert(varchar(16), @lPGI + @lRange)
	end

	if (@bEGI = 0)
	begin
		set @szEGIFrom = ''
		set @szEGITo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lEGIRange / 100.0 * convert(float(24), @lEGI))

		set @szEGIFrom = convert(varchar(16), @lEGI - @lRange)
		set @szEGITo = convert(varchar(16), @lEGI + @lRange)
	end

	if (@bNOI = 0)
	begin
		set @szNOIFrom = ''
		set @szNOITo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lNOIRange / 100.0 * convert(float(24), @lNOI))

		set @szNOIFrom = convert(varchar(16), @lNOI - @lRange)
		set @szNOITo = convert(varchar(16), @lNOI + @lRange)
	end

	if (@bEXP = 0)
	begin
		set @szEXPFrom = ''
		set @szEXPTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lEXPRange / 100.0 * convert(float(24), @lEXP))

		set @szEXPFrom = convert(varchar(16), @lEXP - @lRange)
		set @szEXPTo = convert(varchar(16), @lEXP + @lRange)
	end

	if (@bVacancy = 0)
	begin
		set @szVacancyFrom = ''
		set @szVacancyTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lVacancyRange / 100.0 * convert(float(24), @lVAC))

		set @szVacancyFrom = convert(varchar(16), @lVAC - @lRange)
		set @szVacancyTo = convert(varchar(16), @lVAC + @lRange)
	end

	if (@bAppraised = 0)
	begin
		set @szAppraisedFrom = ''
		set @szAppraisedTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lAppraisedRange / 100.0 * convert(float(24), @lAppraisedVal))

		set @szAppraisedFrom = convert(varchar(16), @lAppraisedVal - @lRange)
		set @szAppraisedTo = convert(varchar(16), @lAppraisedVal + @lRange)
	end

	if (@bIncomeClass = 0)
	begin
		set @szIncomeClass = ''
	end

	if (@bCapRate = 0)
	begin
		set @szCapRateFrom = ''
		set @szCapRateTo = ''
	end
	else
	begin
		set @lRange = convert(float(24), @lCapRateRange / 100.0 * convert(float(24), @lCapRate))

		set @szCapRateFrom = convert(varchar(16), @lCapRate - @lRange)
		set @szCapRateTo = convert(varchar(16), @lCapRate + @lRange)
	end

set nocount off

GO

