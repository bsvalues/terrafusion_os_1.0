

create procedure CompSalesCorpScoreProperty
	@lSubjectPropID int,
	@lCompPropID int,
	@lPacsUserID int,
	@lYear numeric(4,0),
	@dtAppraisal datetime = null,
	@fScore float(24) = 0.0 output,
	@bOutputRS bit = 1
as

set nocount on

	-- Set appraisal date to beginning of year if not specified
	if @dtAppraisal is null
	begin
		declare @lApprYear numeric(4,0)
		exec GetApprYear @lApprYear output
		
		set @dtAppraisal = '01/01/' + convert(varchar(4), @lApprYear)
	end

	-- Variables describing a subject property
	declare
		@lEffYearBuilt numeric(4,0),
		@lBldgSize numeric(14,0),
		@szCVA varchar(10),
		@fLandSize numeric(18,2),
		@szSubmarket varchar(10),
		@szQuality varchar(10),
		@szAbstractSubdivision varchar(10),
		@lCity int,
		@szNeighborhood varchar(10),
		@lNRA numeric(14,0),
		@szRegion varchar(10),
		@lSchool int,
		@szStateCode varchar(10),
		@szSubset varchar(10)

	-- Variables describing a comparable property
	declare
		@lCompEffYearBuilt numeric(4,0),
		@lCompBldgSize numeric(14,0),
		@szCompCVA varchar(10),
		@fCompLandSize numeric(18,2),
		@szCompSubmarket varchar(10),
		@szCompQuality varchar(10),
		@dtCompSale datetime,
		@szCompAbstractSubdivision varchar(10),
		@lCompCity int,
		@szCompNeighborhood varchar(10),
		@lCompNRA numeric(14,0),
		@szCompRegion varchar(10),
		@lCompSchool int,
		@szCompStateCode varchar(10),
		@szCompSubset varchar(10)

	-- Variables used in scoring
	declare
		@lMaxScoreAge int,
		@lMaxScoreBldgSize int,
		@lMaxScoreCVA int,
		@lMaxScoreLandSize int,
		@lMaxScoreSubmarket int,
		@lMaxScoreTimeSinceSale int,
		@lMaxScoreQuality int,
		@lMaxScoreAbstractSubdivision int,
		@lMaxScoreCity int,
		@lMaxScoreNeighborhood int,
		@lMaxScoreNRA int,
		@lMaxScoreRegion int,
		@lMaxScoreSchool int,
		@lMaxScoreStateCode int,
		@lMaxScoreSubset int
	
	declare
		@lScoreAge int,
		@lScoreBldgSize int,
		@lScoreCVA int,
		@lScoreLandSize int,
		@lScoreSubmarket int,
		@lScoreTimeSinceSale int,
		@lScoreQuality int,
		@lScoreAbstractSubdivision int,
		@lScoreCity int,
		@lScoreNeighborhood int,
		@lScoreNRA int,
		@lScoreRegion int,
		@lScoreSchool int,
		@lScoreStateCode int,
		@lScoreSubset int

	declare @lMaxScore int
	declare @lPointsSubject int
	declare @lPointsComp int

	-- Get the scoring information
	select
		@lMaxScoreAge = lAge,
		@lMaxScoreBldgSize = lBldgSize,
		@lMaxScoreCVA = lCVA,
		@lMaxScoreLandSize = lLandSize,
		@lMaxScoreSubmarket = lLocation,
		@lMaxScoreTimeSinceSale = lTimeSale,
		@lMaxScoreQuality = lQuality,
		@lMaxScoreAbstractSubdivision = lAbstractSubdivision,
		@lMaxScoreCity = lCity,
		@lMaxScoreNeighborhood = lNeighborhood,
		@lMaxScoreNRA = lNRA,
		@lMaxScoreRegion = lRegion,
		@lMaxScoreSchool = lSchool,
		@lMaxScoreStateCode = lStateCode,
		@lMaxScoreSubset = lSubset
	from comp_sales_corp_score with(nolock)
	where
		lPacsUserID = @lPacsUserID

	set @lMaxScore =
		@lMaxScoreAge + @lMaxScoreBldgSize + @lMaxScoreCVA + @lMaxScoreLandSize +
		@lMaxScoreSubmarket + @lMaxScoreTimeSinceSale  + @lMaxScoreQuality +
		@lMaxScoreAbstractSubdivision + @lMaxScoreCity + @lMaxScoreNeighborhood +
		@lMaxScoreNRA + @lMaxScoreRegion + @lMaxScoreSchool + @lMaxScoreStateCode +
		@lMaxScoreSubset

	-- Get the subject property information
	select
		@lEffYearBuilt = ppv.eff_yr_blt,
		@lBldgSize = isnull(ppv.living_area, 0),
		@szCVA = pv.visibility_access_cd,
		@fLandSize = isnull(ppv.land_sqft, 0),
		@szSubmarket = pv.sub_market_cd,
		@szQuality = ppv.class_cd,
		@szAbstractSubdivision = ppv.abs_subdv,
		@lCity = ppv.city_id,
		@szNeighborhood = ppv.neighborhood,
		@lNRA = isnull(ipv.NRA, 0),
		@szRegion = ppv.region,
		@lSchool = ppv.school_id,
		@szStateCode = ppv.state_cd,
		@szSubset = ppv.subset
	from prop_supp_assoc as psa with(nolock)
	join property_profile_vw as ppv with(nolock) on
		ppv.prop_id = psa.prop_id and
		ppv.prop_val_yr = psa.owner_tax_yr and
		ppv.sup_num = psa.sup_num
	join property_val as pv with(nolock) on
		ppv.prop_id = pv.prop_id and
		ppv.prop_val_yr = pv.prop_val_yr and
		ppv.sup_num = pv.sup_num
	left outer join income_prop_vw as ipv with(nolock) on
		pv.prop_id = ipv.prop_id and 
		pv.prop_val_yr = ipv.prop_val_yr and
		pv.sup_num = ipv.sup_num and
		ipv.active_valuation = 'T' 
	where
		psa.prop_id = @lSubjectPropID and
		psa.owner_tax_yr = @lYear

	-- Get the comparable property information
	select
		@lCompEffYearBuilt = ppv.eff_yr_blt,
		@lCompBldgSize = ppv.living_area,
		@szCompCVA = pv.visibility_access_cd,
		@fCompLandSize = ppv.land_sqft,
		@szCompSubmarket = pv.sub_market_cd,
		@szCompQuality = ppv.class_cd,
		@szCompAbstractSubdivision = ppv.abs_subdv,
		@lCompCity = ppv.city_id,
		@szCompNeighborhood = ppv.neighborhood,
		@lCompNRA = ipv.NRA,
		@szCompRegion = ppv.region,
		@lCompSchool = ppv.school_id,
		@szCompStateCode = ppv.state_cd,
		@szCompSubset = ppv.subset
	from prop_supp_assoc as psa with(nolock)
	join property_profile_vw as ppv with(nolock) on
		ppv.prop_id = psa.prop_id and
		ppv.prop_val_yr = psa.owner_tax_yr and
		ppv.sup_num = psa.sup_num
	join property_val as pv with(nolock) on
		ppv.prop_id = pv.prop_id and
		ppv.prop_val_yr = pv.prop_val_yr and
		ppv.sup_num = pv.sup_num
	left outer join income_prop_vw as ipv with(nolock) on
		pv.prop_id = ipv.prop_id and 
		pv.prop_val_yr = ipv.prop_val_yr and
		pv.sup_num = ipv.sup_num and
		ipv.active_valuation = 'T' 
	where
		psa.prop_id = @lCompPropID and
		psa.owner_tax_yr = @lYear

	-- Get the sale date of the comparable
	select top 1
		@dtCompSale = s.sl_dt
	from chg_of_owner_prop_assoc as c with(nolock)
	join sale as s with(nolock) on
		c.chg_of_owner_id = s.chg_of_owner_id
	where
		c.prop_id = @lCompPropID and
		isnull(s.sl_price, 0) > 0
	order by
		c.chg_of_owner_id desc

	/**************************************************************************
		Begin scoring individual items
	***************************************************************************/
	
	-- Age
	set @lScoreAge = 0
	select top 1
		@lScoreAge = lPoints
	from comp_sales_point_age with(nolock)
	where
		lYear = @lYear and
		lAgeDiff >= (@lEffYearBuilt - @lCompEffYearBuilt)
	order by
		lAgeDiff asc

	if (@lScoreAge > @lMaxScoreAge)
	begin
		set @lScoreAge = @lMaxScoreAge
	end

	-- Building size
	set @lScoreBldgSize = 0
	select top 1
		@lScoreBldgSize = lPoints
	from comp_sales_point_bldg_size with(nolock)
	where
		lYear = @lYear and
		lBldgSizeDiff >= (@lBldgSize - @lCompBldgSize)
	order by
		lBldgSizeDiff asc

	if (@lScoreBldgSize > @lMaxScoreBldgSize)
	begin
		set @lScoreBldgSize = @lMaxScoreBldgSize
	end

	-- C/V/A
	set @lScoreCVA = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_cva with(nolock)
	where
		lYear = @lYear and
		szCVA = @szCVA

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_cva with(nolock)
	where
		lYear = @lYear and
		szCVA = @szCompCVA

	select top 1
		@lScoreCVA = lPoints
	from comp_sales_point_cva with(nolock)
	where
		lYear = @lYear and
		lPointDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lPointDiff asc

	if (@lScoreCVA > @lMaxScoreCVA)
	begin
		set @lScoreCVA = @lMaxScoreCVA
	end

	-- Land size
	set @lScoreLandSize = 0
	select top 1
		@lScoreLandSize = lPoints
	from comp_sales_point_land_size with(nolock)
	where
		lYear = @lYear and
		lLandSizeDiff >= (@fLandSize - @fCompLandSize)
	order by
		lLandSizeDiff asc

	if (@lScoreLandSize > @lMaxScoreLandSize)
	begin
		set @lScoreLandSize = @lMaxScoreLandSize
	end

	-- Submarket
	set @lScoreSubmarket = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_location with(nolock)
	where
		lYear = @lYear and
		szSubmarket = @szSubmarket

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_location with(nolock)
	where
		lYear = @lYear and
		szSubmarket = @szCompSubmarket

	select top 1
		@lScoreSubmarket = lPoints
	from comp_sales_point_location with(nolock)
	where
		lYear = @lYear and
		lLocationDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lLocationDiff asc

	if (@lScoreSubmarket > @lMaxScoreSubmarket)
	begin
		set @lScoreSubmarket = @lMaxScoreSubmarket
	end

	-- Time since sale
	set @lScoreTimeSinceSale = 0
	select top 1
		@lScoreTimeSinceSale = lPoints
	from comp_sales_point_time_sale with(nolock)
	where
		lYear = @lYear and
		lTimeSale >= datediff(month, @dtCompSale, @dtAppraisal)
	order by
		lTimeSale asc

	if (@lScoreTimeSinceSale > @lMaxScoreTimeSinceSale)
	begin
		set @lScoreTimeSinceSale = @lMaxScoreTimeSinceSale
	end
	
	-- Quality
	set @lScoreQuality = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_quality with(nolock)
	where
		lYear = @lYear and
		szQuality = @szQuality

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_quality with(nolock)
	where
		lYear = @lYear and
		szQuality = @szCompQuality

	select top 1
		@lScoreQuality = lPoints
	from comp_sales_point_quality with(nolock)
	where
		lYear = @lYear and
		lQualityDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lQualityDiff asc

	if (@lScoreQuality > @lMaxScoreQuality)
	begin
		set @lScoreQuality = @lMaxScoreQuality
	end

	-- Abstract / Subdivision
	set @lScoreAbstractSubdivision = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_abstract_subdivision with(nolock)
	where
		lYear = @lYear and
		szAbstractSubdivision = @szAbstractSubdivision

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_abstract_subdivision with(nolock)
	where
		lYear = @lYear and
		szAbstractSubdivision = @szCompAbstractSubdivision

	select top 1
		@lScoreAbstractSubdivision = lPoints
	from comp_sales_point_abstract_subdivision with(nolock)
	where
		lYear = @lYear and
		lAbstractSubdivisionDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lAbstractSubdivisionDiff asc

	if (@lScoreAbstractSubdivision > @lMaxScoreAbstractSubdivision)
	begin
		set @lScoreAbstractSubdivision = @lMaxScoreAbstractSubdivision
	end

	-- City
	set @lScoreCity = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_city with(nolock)
	where
		lYear = @lYear and
		lCity = @lCity

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_city with(nolock)
	where
		lYear = @lYear and
		lCity = @lCompCity

	select top 1
		@lScoreCity = lPoints
	from comp_sales_point_city with(nolock)
	where
		lYear = @lYear and
		lCityDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lCityDiff asc

	if (@lScoreCity > @lMaxScoreCity)
	begin
		set @lScoreCity = @lMaxScoreCity
	end

	-- Neighborhood
	set @lScoreNeighborhood = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_neighborhood with(nolock)
	where
		lYear = @lYear and
		szNeighborhood= @szNeighborhood

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_neighborhood with(nolock)
	where
		lYear = @lYear and
		szNeighborhood = @szCompNeighborhood

	select top 1
		@lScoreNeighborhood = lPoints
	from comp_sales_point_neighborhood with(nolock)
	where
		lYear = @lYear and
		lNeighborhoodDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lNeighborhoodDiff asc

	if (@lScoreNeighborhood > @lMaxScoreNeighborhood)
	begin
		set @lScoreNeighborhood = @lMaxScoreNeighborhood
	end

	-- NRA
	set @lScoreNRA = 0
	if (@lNRA <> 0)
	begin
		select top 1
			@lScoreNRA = lPoints
		from comp_sales_point_nra with (nolock)
		where
			lYear = @lYear and
			lNRADiff >= abs(cast((((@lNRA - @lCompNRA) / @lNRA) * 100) as numeric(14,0)))
		order by
			lNRADiff asc
	end

	if (@lScoreNRA > @lMaxScoreNRA)
	begin
		set @lScoreNRA = @lMaxScoreNRA
	end

	-- Region
	set @lScoreRegion = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_region with(nolock)
	where
		lYear = @lYear and
		szRegion= @szRegion

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_region with(nolock)
	where
		lYear = @lYear and
		szRegion = @szCompRegion

	select top 1
		@lScoreRegion = lPoints
	from comp_sales_point_region with(nolock)
	where
		lYear = @lYear and
		lRegionDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lRegionDiff asc

	if (@lScoreRegion > @lMaxScoreRegion)
	begin
		set @lScoreRegion = @lMaxScoreRegion
	end

	-- School
	set @lScoreSchool = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_school with(nolock)
	where
		lYear = @lYear and
		lSchool = @lSchool

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_school with(nolock)
	where
		lYear = @lYear and
		lSchool = @lCompSchool

	select top 1
		@lScoreSchool = lPoints
	from comp_sales_point_school with(nolock)
	where
		lYear = @lYear and
		lSchoolDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lSchoolDiff asc

	if (@lScoreSchool > @lMaxScoreSchool)
	begin
		set @lScoreSchool = @lMaxScoreSchool
	end

	-- State Code
	set @lScoreStateCode = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_state_code with(nolock)
	where
		lYear = @lYear and
		szStateCode = @szStateCode

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_state_code with(nolock)
	where
		lYear = @lYear and
		szStateCode = @szCompStateCode

	select top 1
		@lScoreStateCode = lPoints
	from comp_sales_point_state_code with(nolock)
	where
		lYear = @lYear and
		lStateCodeDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lStateCodeDiff asc

	if (@lScoreStateCode > @lMaxScoreStateCode)
	begin
		set @lScoreStateCode = @lMaxScoreStateCode
	end

	-- Subset
	set @lScoreSubset = 0
	select
		@lPointsSubject = lPoints
	from comp_sales_corp_score_subset with(nolock)
	where
		lYear = @lYear and
		szSubset = @szSubset

	select
		@lPointsComp = lPoints
	from comp_sales_corp_score_subset with(nolock)
	where
		lYear = @lYear and
		szSubset = @szCompSubset

	select top 1
		@lScoreSubset = lPoints
	from comp_sales_point_subset with(nolock)
	where
		lYear = @lYear and
		lSubsetDiff >= (@lPointsSubject - @lPointsComp)
	order by
		lSubsetDiff asc

	if (@lScoreSubset > @lMaxScoreSubset)
	begin
		set @lScoreSubset = @lMaxScoreSubset
	end

	/**************************************************************************
		End scoring individual items
	***************************************************************************/

	if @lMaxScore <> 0
	begin
		set @fScore =
			convert(
				float(24),
				@lScoreAge + @lScoreBldgSize + @lScoreCVA + @lScoreLandSize +
				@lScoreSubmarket + @lScoreTimeSinceSale  + @lScoreQuality +
				@lScoreAbstractSubdivision + @lScoreCity + @lScoreNeighborhood +
				@lScoreNRA + @lScoreRegion + @lScoreSchool +
				@lScoreStateCode + @lScoreSubset
			) / convert( float(24), @lMaxScore ) * convert( float(24), 100.0 )
	end
	else
	begin
		set @fScore = -1.0
	end

set nocount off

	if @bOutputRS = 1
	begin
		select
			fScore = @fScore,
			lScoreAge = @lScoreAge,
			lScoreBldgSize = @lScoreBldgSize,
			lScoreCVA = @lScoreCVA,
			lScoreLandSize = @lScoreLandSize,
			lScoreSubmarket = @lScoreSubmarket,
			lScoreTimeSinceSale = @lScoreTimeSinceSale,
			lScoreQuality = @lScoreQuality,
			lScoreAbstractSubdivision = @lScoreAbstractSubdivision,
			lScoreCity = @lScoreCity,
			lScoreNeighborhood = @lScoreNeighborhood,
			lScoreNRA = @lScoreNRA,
			lScoreRegion = @lScoreRegion,
			lScoreSchool = @lScoreSchool,
			lScoreStateCode = @lScoreStateCode,
			lScoreSubset = @lScoreSubset,
			lScoreMaxPoints = @lMaxScore
	end

GO

