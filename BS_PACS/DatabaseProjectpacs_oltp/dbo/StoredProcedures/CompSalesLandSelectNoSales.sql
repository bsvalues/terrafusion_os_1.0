


create procedure CompSalesLandSelectNoSales
	@subject_prop_id int,
	@subject_prop_year numeric(4,0),
	@input_user_id int,
	@lLandScoreMethodType int,
	@where_clause varchar(2048),
	@where_clause_sales varchar(2048),
	@debug_flag varchar(1) = 'F'
as

set nocount on

--Declare stored procedure variables
declare @exec_sql varchar(8000)

/* Table to hold the selection results */
create table #sales_comp_land
(
	score numeric(14,4) null,
	prop_id int not null,
	prop_val_year numeric(4,0) not null,
	geo_id varchar(50) null,
	situs varchar(150) null,
	sale_id int null,
	sale_type varchar(5) null,
	sale_ratio_code varchar(5) null,
	sale_date datetime null,
	total_acres numeric(18,4) null,
	total_square_feet numeric(18,2) null,
	total_useable_acres numeric(18,4) null,
	total_useable_square_feet numeric(18,2) null,
	total_land_market_value numeric(14,0) null,
	land_type varchar(10) null,
	land_unit_price numeric(14,2) null,
	land_acres numeric(18,4) null,
	land_square_feet numeric(18,2) null,
	land_useable_acres numeric(18,4) null,
	land_useable_square_feet numeric(18,2) null,
	land_market_value numeric(14,0) null,
	abstract_subdivision varchar(10) null,
	state_cd varchar(10) null,
	neighborhood varchar(10) null,
	region varchar(10) null,
	subset varchar(10) null,
	map_id varchar(20) null,
	utilities varchar(50) null,
	topography varchar(50) null,
	road_access varchar(50) null,
	zoning varchar(50) null,
	sub_market varchar(10) null,
	property_use varchar(10) null,
	visibility_access varchar(10) null,
	school varchar(5) null,
	city varchar(5) null,
	last_appraisal_dt datetime null
)


--Prepare the SQL to be executed
set @exec_sql = '
insert into #sales_comp_land with(tablockx)
(
	score,
	prop_id,
	prop_val_year,
	geo_id,
	situs,
	sale_id,
	sale_type,
	sale_ratio_code,
	sale_date,
	total_acres,
	total_square_feet,
	total_useable_acres,
	total_useable_square_feet,
	total_land_market_value,
	land_type,
	land_unit_price,
	land_acres,
	land_square_feet,
	land_useable_acres,
	land_useable_square_feet,
	land_market_value,
	abstract_subdivision,
	state_cd,
	neighborhood,
	region,
	subset,
	map_id,
	utilities,
	topography,
	road_access,
	zoning,
	sub_market,
	property_use,
	visibility_access,
	school,
	city,
	last_appraisal_dt
)
select
	0,
	property_profile.prop_id,
	property_profile.prop_val_yr,
	property.geo_id,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	property_profile.land_type_cd,
	property_profile.land_unit_price,
	property_profile.land_acres,
	property_profile.land_sqft,
	isnull(property_profile.land_useable_acres, isnull(property_profile.land_acres, 0)) as land_useable_acres,
	isnull(property_profile.land_useable_sqft, isnull(property_profile.land_sqft, 0)) as land_useable_sqft,
	(isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_market, 0)) as land_market_value,
	property_profile.abs_subdv,
	property_profile.state_cd,
	property_profile.neighborhood,
	property_profile.region,
	property_profile.subset,
	property_profile.map_id,
	property_profile.utilities,
	property_profile.topography,
	property_profile.road_access,
	property_profile.zoning,
	property_profile.sub_market_cd,
	property_profile.property_use_cd,
	property_profile.visibility_access_cd,
	school_entity.entity_cd,
	city_entity.entity_cd,
	property_profile.last_appraisal_dt
from property_profile with(nolock)
inner join prop_supp_assoc with(nolock) on
	property_profile.prop_id = prop_supp_assoc.prop_id and 
	property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr and
	property_profile.sup_num = prop_supp_assoc.sup_num
inner join property_val with(nolock) on
	prop_supp_assoc.prop_id = property_val.prop_id and
	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
	prop_supp_assoc.sup_num = property_val.sup_num
inner join property with(nolock) on
	prop_supp_assoc.prop_id = property.prop_id 
left outer join entity as city_entity with(nolock) on
	property_profile.city_id = city_entity.entity_id
left outer join entity as school_entity with(nolock) on
	property_profile.school_id = school_entity.entity_id
where ' + @where_clause + ' ' + '
and (isnull(property_val.prop_inactive_dt, '''') = '''' or isnull(property_val.udi_parent, '''') = ''T'')
order by property_profile.prop_id
'

--Insert records
exec(@exec_sql)

--Update additional fields
update #sales_comp_land with(tablockx)
set
	situs = cast(
		case
			when
				situs.situs_num is not null
			then
				situs.situs_num
			else
				''
		end + 
		case
			when
				situs.situs_street_prefx is not null
			then
				' ' + situs.situs_street_prefx
			else
				''
		end +
		case
			when
				situs.situs_street is not null
			then
				' ' + situs.situs_street
			else
				''
		end +
		case
			when
				situs.situs_street_sufix is not null
			then
				' ' + situs.situs_street_sufix
			else
				''
		end +
		case
			when
				situs.situs_city is not null
			then
				' ' + situs.situs_city
			else
				''
		end + 
		case
			when
				situs.situs_state is not null
			then
				', ' + situs.situs_state
			else
				''
		end +
		case
			when
				situs.situs_zip is not null
			then
				' ' + situs.situs_zip
			else
				''
		end as varchar(50)
	)
from #sales_comp_land with(tablockx)
left outer join situs with(nolock) on
	#sales_comp_land.prop_id = situs.prop_id
where
	situs.primary_situs = 'Y'

--Update the Sales Information if necessary
if len(@where_clause_sales) > 0
begin
	declare @exec_sales_sql varchar(8000)
	
	set @exec_sales_sql = 'update #sales_comp_land
	set
		#sales_comp_land.sale_id = comp_sales_land_sale_vw.chg_of_owner_id,
		#sales_comp_land.sale_type = comp_sales_land_sale_vw.sl_type_cd,
		#sales_comp_land.sale_ratio_code = comp_sales_land_sale_vw.sl_ratio_type_cd,
		#sales_comp_land.sale_date = comp_sales_land_sale_vw.sl_dt,
		#sales_comp_land.total_acres = comp_sales_land_sale_vw.total_acres,
		#sales_comp_land.total_square_feet = comp_sales_land_sale_vw.total_square_feet,
		#sales_comp_land.total_useable_acres = comp_sales_land_sale_vw.total_useable_acres,
		#sales_comp_land.total_useable_square_feet = comp_sales_land_sale_vw.total_useable_square_feet,
		#sales_comp_land.total_land_market_value = comp_sales_land_sale_vw.total_land_market

	from
		chg_of_owner_prop_assoc
	
	inner join
		comp_sales_land_sale_vw
	on
		chg_of_owner_prop_assoc.chg_of_owner_id = comp_sales_land_sale_vw.chg_of_owner_id
	
	where
		' + @where_clause_sales + ' ' + '
	and	#sales_comp_land.prop_id = chg_of_owner_prop_assoc.prop_id'

	--Update records
	exec(@exec_sales_sql)
end


declare
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
	@fScore numeric(14,4)

declare curComps cursor
for
	select
		school,
		city,
		state_cd,
		abstract_subdivision,
		neighborhood,
		land_type,
		zoning,
		sale_ratio_code,
		total_useable_square_feet,
		total_useable_acres,
		sale_date,
		last_appraisal_dt
	from
		#sales_comp_land
for update of score

open curComps
fetch next from curComps into
	@szSchool,
	@szCity,
	@szState,
	@szAbsSubdv,
	@szNeighborhood,
	@szLandType,
	@szZoning,
	@szSaleRatioCode,
	@fLandUseableSqft,
	@fLandUseableAcres,
	@dtSaleDate,
	@dtLastAppraisalDate

while @@fetch_status = 0
begin
	exec CompSalesScoreLandProperty @subject_prop_id,
					@subject_prop_year,
					@input_user_id,
					@lLandScoreMethodType,
					@szSchool,
					@szCity,
					@szState,
					@szAbsSubdv,
					@szNeighborhood,
					@szLandType,
					@szZoning,
					@szSaleRatioCode,
					@fLandUseableSqft,
					@fLandUseableAcres,
					@dtSaleDate,
					@dtLastAppraisalDate,
					@fScore output


	update	#sales_comp_land
	set
		score = @fScore
	where
		current of curComps

	fetch next from curComps into
		@szSchool,
		@szCity,
		@szState,
		@szAbsSubdv,
		@szNeighborhood,
		@szLandType,
		@szZoning,
		@szSaleRatioCode,
		@fLandUseableSqft,
		@fLandUseableAcres,
		@dtSaleDate,
		@dtLastAppraisalDate
end

close curComps
deallocate curComps


select
	score,
	prop_id,
	prop_val_year,
	geo_id,
	situs,
	sale_id,
	sale_type,
	sale_ratio_code,
	sale_date,
	total_acres,
	total_square_feet,
	total_useable_acres,
	total_useable_square_feet,
	total_land_market_value,
	land_type,
	land_unit_price,
	land_acres,
	land_square_feet,
	land_useable_acres,
	land_useable_square_feet,
	land_market_value,
	abstract_subdivision,
	state_cd,
	neighborhood,
	region,
	subset,
	map_id,
	utilities,
	topography,
	road_access,
	zoning,
	sub_market,
	property_use,
	visibility_access,
	school,
	city,
	last_appraisal_dt
from #sales_comp_land
order by score desc


/* We don't need this anymore */
drop table #sales_comp_land

GO

