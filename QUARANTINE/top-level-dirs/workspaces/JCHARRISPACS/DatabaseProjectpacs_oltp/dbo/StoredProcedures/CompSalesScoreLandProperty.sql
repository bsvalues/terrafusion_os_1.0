

create procedure CompSalesScoreLandProperty
	@lSubjectPropID int,
	@lSubjectPropYear numeric(4,0),
	@lPacsUserID int,
	@lLandScoreMethodType int,
	@szSchool varchar(50),
	@szCity varchar(50),
	@szState varchar(50),
	@szAbsSubdv varchar(50),
	@szNeighborhood varchar(50),
	@szLandType varchar(50),
	@szZoning varchar(50),
	@szSaleRatioCode varchar(50),
	@fLandUseableSqft numeric(18,2),
	@fLandUseableAcres numeric(18,4),
	@dtSaleDate datetime,
	@dtLastAppraisalDate datetime,
	@fScore numeric(14,4) output
as

set nocount on

declare	@fMaxScore numeric(14,4)
declare	@fElementScore numeric(14,4)

set @fScore = 0.0
set @fMaxScore = 0.0

/* Variables to determine how to score a comparable */
declare
	@lSchool int,
	@lCity int,
	@lState int,
	@lAbsSubdv int,
	@lNeighborhood int,
	@lLandType int,
	@lZoning int,
	@lSaleRatioCode int,
	@lLandAreaMax int,
	@lLandAreaDec int,
	@lLandAreaPer int,
	@lSaleDateMax int,
	@lSaleDateDec int,
	@lSaleDatePer int

/* Variables describing the subject property */
declare
	@szSchoolSubject varchar(50),
	@szCitySubject varchar(50),
	@szStateSubject varchar(50),
	@szAbsSubdvSubject varchar(50),
	@szNeighborhoodSubject varchar(50),
	@szLandTypeSubject varchar(50),
	@szZoningSubject varchar(50),
	@szSaleRatioCodeSubject varchar(50),
	@fLandUseableSqftSubject numeric(18,2),
	@fLandUseableAcresSubject numeric(18,4),
	@dtSaleDateSubject datetime,
	@dtLastAppraisalDateSubject datetime


select
	@lSchool = lSchool,
	@lCity = lCity,
	@lNeighborhood = lNeighborhood,
	@lAbsSubdv = lAbsSubdv,
	@lState = lState,
	@lLandType = lLandType,
	@lLandAreaMax = lLandAreaMax,
	@lLandAreaDec = lLandAreaDec,
	@lLandAreaPer = lLandAreaPer,
	@lZoning = lZoning,
	@lSaleRatioCode = lSaleRatioCode,
	@lSaleDateMax = lSaleDateMax,
	@lSaleDateDec = lSaleDateDec,
	@lSaleDatePer = lSaleDatePer
from sales_comp_score_land with(nolock)
where
	lPacsUserID = @lPacsUserID

/* Get the subject property information */
select
	@szSchoolSubject = ppv.school_entity_cd,
	@szCitySubject = ppv.city_entity_cd,
	@szStateSubject = ppv.state_cd,
	@szAbsSubdvSubject = ppv.abs_subdv,
	@szNeighborhoodSubject = ppv.neighborhood,
	@szLandTypeSubject = ppv.land_type_cd,
	@szZoningSubject = ppv.zoning,
	@szSaleRatioCodeSubject = ppv.sl_ratio_type_cd,
	@fLandUseableSqftSubject = ppv.land_useable_sqft,
	@fLandUseableAcresSubject = ppv.land_useable_acres,
	@dtSaleDateSubject = ppv.sl_dt,
	@dtLastAppraisalDateSubject = ppv.last_appraisal_dt
from
	prop_supp_assoc as psa with(nolock)
join
	property_profile_vw as ppv with(nolock)
on
	psa.prop_id = ppv.prop_id and
	psa.owner_tax_yr = ppv.prop_val_yr and
	psa.sup_num = ppv.sup_num
where
	psa.prop_id = @lSubjectPropID and
	psa.owner_tax_yr = @lSubjectPropYear

/* School */
if isnull(@szSchool, '') <> '' and isnull(@szSchoolSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lSchool

	if @szSchool = @szSchoolSubject
	begin
		set @fScore = @fScore + @lSchool
	end
end

/* City */
if isnull(@szCity, '') <> '' and isnull(@szCitySubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lCity

	if @szCity = @szCitySubject
	begin
		set @fScore = @fScore + @lCity
	end
end

/* State code */
if isnull(@szState, '') <> '' and isnull(@szStateSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lState

	if @szState = @szStateSubject
	begin
		set @fScore = @fScore + @lState
	end
end

/* Abstract / Subdivision */
if isnull(@szAbsSubdv, '') <> '' and isnull(@szAbsSubdvSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lAbsSubdv

	if @szAbsSubdv = @szAbsSubdvSubject
	begin
		set @fScore = @fScore + @lAbsSubdv
	end
end

/* Neighborhood */
if isnull(@szNeighborhood, '') <> '' and isnull(@szNeighborhoodSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lNeighborhood

	if @szNeighborhood = @szNeighborhoodSubject
	begin
		set @fScore = @fScore + @lNeighborhood
	end
end

/* Land type */
if isnull(@szLandType, '') <> '' and isnull(@szLandTypeSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lLandType

	if @szLandType = @szLandTypeSubject
	begin
		set @fScore = @fScore + @lLandType
	end
end

/* Zoning */
if isnull(@szZoning, '') <> '' and isnull(@szZoningSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lZoning

	if @szZoning = @szZoningSubject
	begin
		set @fScore = @fScore + @lZoning
	end
end

/* Sale Ratio Code */
if isnull(@szSaleRatioCode, '') <> '' and isnull(@szSaleRatioCodeSubject, '') <> ''
begin
	set @fMaxScore = @fMaxScore + @lSaleRatioCode

	if @szSaleRatioCode = @szSaleRatioCodeSubject
	begin
		set @fScore = @fScore + @lSaleRatioCode
	end
end

/* Land Area */
if @lLandScoreMethodType = 0
begin
	if isnull(@fLandUseableSqft, 0) > 0.0 and isnull(@fLandUseableSqftSubject, 0) > 0.0 and isnull(@lLandAreaPer, 0) <> 0
	begin
		set @fMaxScore = @fMaxScore + @lLandAreaMax

		set @fElementScore = cast(@lLandAreaMax as numeric(14, 4)) + 
			cast(@lLandAreaDec as numeric(14, 4)) * (
				abs( cast( (((@fLandUseableSqftSubject - @fLandUseableSqft) / @fLandUseableSqftSubject) * 100) as numeric(14, 4) ) )
				/
				cast( @lLandAreaPer as numeric(14, 4))
			)
		if @fElementScore > 0.0
		begin
			set @fScore = @fScore + @fElementScore
		end
	end
end
else if @lLandScoreMethodType = 1
begin
	if isnull(@fLandUseableAcres, 0) > 0.0 and isnull(@fLandUseableAcresSubject, 0) > 0.0 and isnull(@lLandAreaPer, 0) <> 0
	begin
		set @fMaxScore = @fMaxScore + @lLandAreaMax

		set @fElementScore = cast(@lLandAreaMax as numeric(14, 4)) + 
			cast(@lLandAreaDec as numeric(14, 4)) * (
				abs( cast( (((@fLandUseableAcresSubject - @fLandUseableAcres) / @fLandUseableAcresSubject) * 100) as numeric(14, 4) ) )
				/
				cast( @lLandAreaPer as numeric(14, 4))
			)
		if @fElementScore > 0.0
		begin
			set @fScore = @fScore + @fElementScore
		end
	end
end

if ((@dtSaleDate is not null) and (@dtLastAppraisalDate is not null) and (@lSaleDatePer <> 0))
begin
	set @fMaxScore = @fMaxScore + @lSaleDateMax

	set @fElementScore =	cast(@lSaleDateMax as numeric(14,4)) +
				cast(@lSaleDateDec as numeric(14,4)) *
					(abs(cast((datediff(mm, @dtSaleDate, @dtLastAppraisalDate)) as numeric(14,4))) /
				cast(@lSaleDatePer as numeric(14,4)))

	if @fElementScore > 0.0
	begin
		set @fScore = @fScore + @fElementScore
	end
end

/* Score can be no less than zero */
if @fScore < 0.0
begin
	set @fScore = 0.0
end

/* Update the table with the score */
if @fMaxScore <= 0.0
begin
	set @fScore = 0.0
end
else
begin
	set @fScore = (@fScore / @fMaxScore * 100.0)
end


set nocount off

GO

