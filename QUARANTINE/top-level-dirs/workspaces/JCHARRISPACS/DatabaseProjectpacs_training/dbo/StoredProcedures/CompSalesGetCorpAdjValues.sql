

create procedure CompSalesGetCorpAdjValues
	@lYear numeric(4,0),
	@szSaleFinanceCode char(5),
	@szCompPropertyUse varchar(10),
	@szSubjectSubmarket varchar(10),
	@szCompSubmarket varchar(10),
	@szSubjectQuality varchar(10),
	@szCompQuality varchar(10),
	@szSubjectCVA varchar(10),
	@szCompCVA varchar(10),
	@lSubjectPropID int,
	@lCompPropID int
as

set nocount on

	/* The percentages of value attributed to land and improvements */
	declare
		@fPctBuildingArea float(24),
		@fPctLandArea float(24),
		@fPctBusinessValue float(24)

	select
		@fPctBuildingArea = fPctBuildingArea,
		@fPctLandArea = fPctLandArea,
		@fPctBusinessValue = fPctBusinessValue
	from comp_sales_config with(nolock)
	where
		lYear = @lYear

	/* The financing adjustment percentage */
	declare @fAdjPctFinance float(24)
	set @fAdjPctFinance = 0.0
	select
		@fAdjPctFinance = fAdjPct
	from comp_sales_adj_finance with(nolock)
	where
		lYear = @lYear and
		szFinanceCode = @szSaleFinanceCode
	
	/* Annual time adj % used in the time since sale adj */
	declare @fAdjPctAnnualTime float(24)
	set @fAdjPctAnnualTime = 0.0
	select
		@fAdjPctAnnualTime = fAdjPct
	from comp_sales_adj_annual_time with(nolock)
	where
		lYear = @lYear and
		szPropUse = @szCompPropertyUse

	/* Location adj % used when submarket's differ */
	declare @fAdjPctLocation float(24)
	declare @fAdjPctCompLocation float(24)
	declare @fAdjPctSubjectLocation float(24)
	set @fAdjPctCompLocation = 0.0
	select
		@fAdjPctCompLocation = fAdjPct
	from comp_sales_adj_location with(nolock)
	where
		lYear = @lYear and
		szSubmarket = @szCompSubmarket

	/* Check to see if we need to subtract submarket adj percentages */
	if
		exists (
			select
				szSubmarket
			from comp_sales_adj_location_config with(nolock)
			where
				lYear = @lYear and
				szSubmarket = @szSubjectSubmarket
		)
		and
		exists (
			select
				szSubmarket
			from comp_sales_adj_location_config with(nolock)
			where
				lYear = @lYear and
				szSubmarket = @szCompSubmarket
		)
	begin
		set @fAdjPctSubjectLocation = 0.0
		select
			@fAdjPctSubjectLocation = fAdjPct
		from comp_sales_adj_location with(nolock)
		where
			lYear = @lYear and
			szSubmarket = @szSubjectSubmarket
		
		/* Subtract */
		set @fAdjPctLocation = @fAdjPctCompLocation - @fAdjPctSubjectLocation
	end
	else
	begin
		/* Else - use only comp's adjustment % */
		set @fAdjPctLocation = @fAdjPctCompLocation
	end

	/* Quality adj amount used when qualities differ */
	declare @fAdjAmtQuality float(24)
	select
		@fAdjAmtQuality = adj_factor
	from imprv_sched_detail_quality_comp with(nolock)
	where
		imprv_yr = @lYear and
		szImprovMethod = 'C' and
		subject_quality_cd = @szSubjectQuality and
		comp_quality_cd = @szCompQuality

	if ( @fAdjAmtQuality is null )
	begin
		/* Determine the quality adjustment based on unit price difference */
		declare
			@fSubjectImprvUnitPrice numeric(14,2),
			@fCompImprvUnitPrice numeric(14,2)

		select @fSubjectImprvUnitPrice = pp.imprv_unit_price
		from property_profile as pp with(nolock)
		where
			prop_id = @lSubjectPropID and
			prop_val_yr = @lYear

		select @fCompImprvUnitPrice = pp.imprv_unit_price
		from property_profile as pp with(nolock)
		where
			prop_id = @lCompPropID and
			prop_val_yr = @lYear

		set @fAdjAmtQuality = @fSubjectImprvUnitPrice - @fCompImprvUnitPrice
	end
	
	set @fAdjAmtQuality = isnull(@fAdjAmtQuality, 0.0)

	/* C/V/A adj used when C/V/A differs */
	declare @fAdjPctCVA float(24)
	declare
		@fAdjPctCVASubject float(24),
		@fAdjPctCVAComp float(24)
	select
		@fAdjPctCVASubject = fAdjPct
	from comp_sales_adj_cva with(nolock)
	where
		lYear = @lYear and
		szCVA = @szSubjectCVA	/* The subject's CVA adj % */
	select
		@fAdjPctCVAComp = fAdjPct
	from comp_sales_adj_cva with(nolock)
	where
		lYear = @lYear and
		szCVA = @szCompCVA		/* The comp's CVA adj % */

	set @fAdjPctCVA = isnull(@fAdjPctCVASubject - @fAdjPctCVAComp, 0.0)

	/* The life expectancy for the comparable property, based on property use */
	/* Used in the age adjustment */
	declare @lLifeExpectancy int
	select
		@lLifeExpectancy = lLifeExpectancy
	from comp_sales_property_use_life_expectancy with(nolock)
	where
		lYear = @lYear and
		szPropUse = @szCompPropertyUse

set nocount off

	/* Output the values */
	select
		fPctBuildingArea = @fPctBuildingArea,
		fPctLandArea = @fPctLandArea,
		fAdjPctFinance = @fAdjPctFinance,
		fAdjPctAnnualTime = @fAdjPctAnnualTime,
		fAdjPctLocation = @fAdjPctLocation,
		fAdjPctCVA = @fAdjPctCVA,
		fAdjAmtQuality = @fAdjAmtQuality,
		lLifeExpectancy = @lLifeExpectancy,
		fPctBusinessValue = @fPctBusinessValue

GO

