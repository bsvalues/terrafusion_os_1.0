

create procedure CompSalesSetCorpLoadDefaults
	@lPacsUserID int
as

set nocount on

	begin transaction

	/* Start over */
	delete comp_sales_corp_load_criteria with(rowlock)
	where
		lPacsUserID = @lPacsUserID


	insert comp_sales_corp_load_criteria with(rowlock)
	(
		lPacsUserID,
		bQuality,
		bSubmarket,
		bPropertyUse,
		bCVA,
		bAge,
		lAgeRange,
		bBldgArea,
		lBldgAreaRange,
		bLandArea,
		lLandAreaRange,
		bNumUnits,
		lNumUnitsRange,
		bSaleDateRange,
		szSaleDateMin,
		szSaleDateMax,
		szSaleRatioCodes,
		bEffectiveAge,
		lEffectiveAgeRange,
		bNRA,
		lNRARange,
		bRegion,
		bAbsSubdivision,
		bNeighborhood,
		bSubset,
		bSchool,
		bCity,
		bStateCode,
		bPGI,
		lPGIRange,
		bEGI,
		lEGIRange,
		bNOI,
		lNOIRange,
		bEXP,
		lEXPRange,
		bVacancy,
		lVacancyRange,
		bAppraised,
		lAppraisedRange,
		bIncomeClass,
		bCapRate,
		lCapRateRange,
		bSubQuality
	)
	select
		@lPacsUserID,
		bQuality,
		bSubmarket,
		bPropertyUse,
		bCVA,
		bAge,
		lAgeRange,
		bBldgArea,
		lBldgAreaRange,
		bLandArea,
		lLandAreaRange,
		bNumUnits,
		lNumUnitsRange,
		bSaleDateRange,
		szSaleDateMin,
		szSaleDateMax,
		szSaleRatioCodes,
		bEffectiveAge,
		lEffectiveAgeRange,
		bNRA,
		lNRARange,
		bRegion,
		bAbsSubdivision,
		bNeighborhood,
		bSubset,
		bSchool,
		bCity,
		bStateCode,
		bPGI,
		lPGIRange,
		bEGI,
		lEGIRange,
		bNOI,
		lNOIRange,
		bEXP,
		lEXPRange,
		bVacancy,
		lVacancyRange,
		bAppraised,
		lAppraisedRange,
		bIncomeClass,
		bCapRate,
		lCapRateRange,
		bSubQuality
	from comp_sales_corp_load_criteria with(nolock)
	where
		lPacsUserID = 0

	-- Just in case system defaults don't exist 
	if @@rowcount = 0
	begin
		declare
			@szSaleDateMin varchar(16),
			@szSaleDateMax varchar(16),
			@dtNow datetime

		set @dtNow = getdate()

		set @szSaleDateMax = convert(varchar(16), @dtNow, 101)
		set @szSaleDateMin = convert(varchar(16), dateadd(dd, -90, @dtNow), 101)

		insert comp_sales_corp_load_criteria with(rowlock)
		(
			lPacsUserID,
			bQuality,
			bSubmarket,
			bPropertyUse,
			bCVA,
			bAge,
			lAgeRange,
			bBldgArea,
			lBldgAreaRange,
			bLandArea,
			lLandAreaRange,
			bNumUnits,
			lNumUnitsRange,
			bSaleDateRange,
			szSaleDateMin,
			szSaleDateMax,
			szSaleRatioCodes,
			bEffectiveAge,
			lEffectiveAgeRange,
			bNRA,
			lNRARange,
			bRegion,
			bAbsSubdivision,
			bNeighborhood,
			bSubset,
			bSchool,
			bCity,
			bStateCode,
			bPGI,
			lPGIRange,
			bEGI,
			lEGIRange,
			bNOI,
			lNOIRange,
			bEXP,
			lEXPRange,
			bVacancy,
			lVacancyRange,
			bAppraised,
			lAppraisedRange,
			bIncomeClass,
			bCapRate,
			lCapRateRange,
			bSubQuality
		) values (
			@lPacsUserID,
			1,
			1,
			1,
			0,
			0,
			5,
			0,
			15,
			0,
			25,
			0,
			0,
			1,
			@szSaleDateMin,
			@szSaleDateMax,
			null,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		)
	end
	commit transaction

set nocount off

GO

