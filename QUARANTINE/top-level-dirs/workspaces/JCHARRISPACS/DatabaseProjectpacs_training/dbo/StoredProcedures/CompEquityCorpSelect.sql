
/*  03062005 RK  Changed Income_value to come from income_prop_assoc.income_value..  was coming from income_prop_vw.prop_income_value */
/*  11292005 RK  Changed the joins per HS 31389  was getting duplicate income valuations. */

create procedure CompEquityCorpSelect
	@lSubjectPropID int,
	@lSubjectYear numeric(4,0),
	@lPacsUserID int,
	@szWhereClause varchar(8000),
	@bOutputRS bit = 1
as

set nocount on

/* Table to hold the selection results */
create table #comp_equity_commercial
(
	prop_id int not null,
	year numeric(4,0) not null,
	score float(24) null,
	market numeric(14,0) null,
	living_area numeric(14,0) null,
	NRA numeric(14,0) null,
	yr_blt numeric(4,0) null,
	eff_yr_blt numeric(4,0) null,
	appr_method varchar(5) null,
	value_method varchar(5) null,
	geo_id varchar(50) null,
	school varchar(5) null,
	city varchar(5) null,
	state_cd varchar(10) null,
	owner varchar(70) null,
	situs varchar(150) null,
	region varchar(10) null,
	abs_subdv varchar(10) null,
	neighborhood varchar(10) null,
	subset varchar(10) null,
	map_id varchar(20) null,
	class_cd varchar(10) null,
	imprv_unit_price numeric(14,2) null,
	imprv_val numeric(14,0) null,
	imprv_add_val numeric(14,0) null,
	land_type_cd varchar(10) null,
	land_sqft numeric(18,2) null,
	land_acres numeric(18,4) null,
	land_front_feet numeric(18,2) null,
	land_lot varchar(1) null,
	land_unit_price numeric(14,2) null,
	land_value numeric(14,0) null,
	ls_table varchar(25) null,
	condition_cd varchar(5) null,
	percent_complete numeric(5,2) null,
	main_land_unit_price numeric(14,2) null,
	main_land_total_adj numeric(8,6) null,
	size_adj_pct numeric(5,2) null,
	effective_land_price numeric(14,2) null,
	heat_ac_code varchar(75) null,
	GPIRSF numeric(14,2) null,
	EGIRSF numeric(14,2) null,
	VR numeric(5,2) null,
	EXPRSF numeric(14,2) null,
	NOIRSF numeric(14,2) null,
	CAPR numeric(5,2) null,
	IND numeric(14,0) null,
	GBA numeric(14,0) null,
	income_value numeric(14,0) null,
	lu_cost numeric(14,0) null,
	land numeric(14,0) null,
	PERS numeric(14,0) null,
	sub_class_cd varchar(10) null,
	cost_value numeric(14,2) null,
	szSubmarket varchar(10) null,
    szDBAName varchar(50) null
)

-- The current appraisal year
if @lSubjectYear < 0
begin
	exec GetApprYear @lSubjectYear output
end

/* To hold the SQL for selecting comparables */
declare @szSQL varchar(8000)

set @szSQL = '
insert into #comp_equity_commercial with(tablockx)
(
	prop_id,
	year,
	score,
	market,
	living_area,
	NRA,
	yr_blt,
	eff_yr_blt,
	appr_method,
	value_method,
	geo_id,
	school,
	city,
	state_cd,
	owner,
	situs,
	region,
	abs_subdv,
	neighborhood,
	subset,
	map_id,
	class_cd,
	imprv_unit_price,
	imprv_val,
	imprv_add_val,
	land_type_cd,
	land_sqft,
	land_acres,
	land_front_feet,
	land_lot,
	land_unit_price,
	land_value,
	ls_table,
	condition_cd,
	percent_complete,
	main_land_unit_price,
	main_land_total_adj,
	size_adj_pct,
	effective_land_price,
	heat_ac_code,
	GPIRSF,
	EGIRSF,
	VR,
	EXPRSF,
	NOIRSF,
	CAPR,
	IND,
	GBA,
	income_value,
	lu_cost,
	land,
	PERS,
	sub_class_cd,
	cost_value,
	szSubmarket ,
    szDBAName 
)
select
	property_profile.prop_id,
	property_profile.prop_val_yr,
	0,
	isnull(property_val.market,0),
	property_profile.living_area,
	income_prop_vw.NRA,
	property_profile.yr_blt,
	property_profile.eff_yr_blt,
	rtrim(isnull(property_val.appr_method, '''')),
	income_prop_vw.value_method,
	property.geo_id,
	rtrim(isnull(school_entity.entity_cd, '''')),
	rtrim(isnull(city_entity.entity_cd, '''')),
	rtrim(isnull(property_profile.state_cd, '''')),
	account.file_as_name,
	null,
	property_profile.region,
	property_profile.abs_subdv,
	property_profile.neighborhood,
	property_profile.subset,
	property_profile.map_id,
	rtrim(isnull(property_profile.class_cd, '''')),
	property_profile.imprv_unit_price,
	(isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)),
	property_profile.imprv_add_val,
	rtrim(isnull(property_profile.land_type_cd, '''')),
	property_profile.land_sqft,
	property_profile.land_acres,
	property_profile.land_front_feet,
	property_profile.land_lot,
	property_profile.land_unit_price,
	(isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_market, 0)),
	rtrim(isnull(property_profile.ls_table, '''')),
	rtrim(isnull(property_profile.condition_cd, '''')),
	property_profile.percent_complete,
	property_profile.main_land_unit_price,
	property_profile.main_land_total_adj,
	property_profile.size_adj_pct,
	cast((isnull(property_profile.main_land_unit_price, 0) * isnull(property_profile.main_land_total_adj, 0)) as numeric(14,2)),
	property_profile.heat_ac_code,
	income_prop_vw.GPIRSF,
	income_prop_vw.EGIRSF,
	income_prop_vw.VR,
	income_prop_vw.EXPRSF,
	income_prop_vw.NOIRSF,
	income_prop_vw.CAPR,
	income_prop_vw.IND,
	income_prop_vw.GBA,
	income_prop_assoc.income_value,
	income_prop_vw.lu_cost,
	income_prop_vw.land,
	income_prop_vw.PERS,
	rtrim(isnull(property_profile.imprv_det_sub_class_cd, '''')),
	isnull(property_val.cost_value,0),
    property_val.sub_market_cd,
    property.dba_name 
from property_profile with(nolock)
inner join prop_supp_assoc with(nolock) on
	prop_supp_assoc.prop_id = property_profile.prop_id and
	prop_supp_assoc.owner_tax_yr = property_profile.prop_val_yr 
inner join property_val with(nolock) on
	prop_supp_assoc.prop_id = property_val.prop_id and
	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
	prop_supp_assoc.sup_num = property_val.sup_num
inner join property with(nolock) on
	prop_supp_assoc.prop_id = property.prop_id 
inner join owner with(nolock) on
	prop_supp_assoc.prop_id = owner.prop_id and 
	prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr and 
	prop_supp_assoc.sup_num = owner.sup_num
inner join account with(nolock) on 
	account.acct_id = owner.owner_id 
left outer join income_prop_vw with(nolock) on
	prop_supp_assoc.prop_id = income_prop_vw.prop_id and 
	prop_supp_assoc.owner_tax_yr = income_prop_vw.prop_val_yr and
	prop_supp_assoc.sup_num = income_prop_vw.sup_num and
	income_prop_vw.income_id = dbo.fn_GetCompIncome (income_prop_vw.prop_id, income_prop_vw.prop_val_yr, income_prop_vw.sup_num)
left outer join income_prop_assoc with(nolock) on
	property_profile.prop_id = income_prop_assoc.prop_id and 
	property_profile.prop_val_yr = income_prop_assoc.prop_val_yr and
	property_profile.sup_num = income_prop_assoc.sup_num and
	income_prop_vw.income_id = income_prop_assoc.income_id

/* 31389
inner join prop_supp_assoc with(nolock)
inner join property_val with(nolock) on
	prop_supp_assoc.prop_id = property_val.prop_id and
	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
	prop_supp_assoc.sup_num = property_val.sup_num
inner join property with(nolock) on
	prop_supp_assoc.prop_id = property.prop_id on 
	property_profile.prop_id = prop_supp_assoc.prop_id and 
	property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr and
	property_profile.sup_num = prop_supp_assoc.sup_num
inner join account with(nolock)
inner join owner with(nolock) on
	account.acct_id = owner.owner_id on 
	property_val.prop_id = owner.prop_id and 
	property_val.prop_val_yr = owner.owner_tax_yr and 
	property_val.sup_num = owner.sup_num
left outer join income_prop_vw with(nolock) on
	property_val.prop_id = income_prop_vw.prop_id and 
	property_val.prop_val_yr = income_prop_vw.prop_val_yr and
	prop_supp_assoc.sup_num = income_prop_vw.sup_num and
	income_prop_vw.income_id = dbo.fn_GetCompIncome (income_prop_vw.prop_id, income_prop_vw.prop_val_yr, income_prop_vw.sup_num)
left outer join income_prop_assoc with(nolock) on
	property_val.prop_id = income_prop_assoc.prop_id and 
	property_val.prop_val_yr = income_prop_assoc.prop_val_yr and
	prop_supp_assoc.sup_num = income_prop_assoc.sup_num
31389*/
left outer join entity as city_entity with(nolock) on
	property_profile.city_id = city_entity.entity_id
left outer join entity as school_entity with(nolock) on
	property_profile.school_id = school_entity.entity_id
where ' + @szWhereClause + '
and (isnull(property_val.prop_inactive_dt, '''') = '''' or isnull(property_val.udi_parent, '''') = ''T'')
order by property_profile.prop_id
'


exec(@szSQL)


--Update additional fields
update
	#comp_equity_commercial with(tablockx)
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
from #comp_equity_commercial with(tablockx)
left outer join situs with(nolock) on
	#comp_equity_commercial.prop_id = situs.prop_id
where
	situs.primary_situs = 'Y'


declare curComps cursor
for
	select
		prop_id
	from #comp_equity_commercial
for update of score

declare @lPropID int
declare @fScore float(24)

open curComps
fetch next from curComps into @lPropID

/* For each comparable */
while @@fetch_status = 0
begin
	exec CompSalesCorpScoreProperty @lSubjectPropID, @lPropID, @lPacsUserID, @lSubjectYear, null, @fScore output, 0

	update #comp_equity_commercial set
		score = @fScore
	where
		current of curComps

	fetch next from curComps into @lPropID
end

close curComps
deallocate curComps

/* If requested, output the list into the caller's temporary table */
if (object_id('tempdb..#tmp_arb_comps') is not null)
begin
	insert #tmp_arb_comps (
		lPropID, lSaleID, fScore
	)
	select
		prop_id, null, score
	from #comp_equity_commercial
	order by
		score desc
end

set nocount off

if (@bOutputRS = 1)
begin
	select
		prop_id,
		year,
		score,
		market,
		living_area,
		NRA,
		yr_blt,
		eff_yr_blt,
		appr_method,
		value_method,
		geo_id,
		school,
		city,
		state_cd,
		owner,
		situs,
		region,
		abs_subdv,
		neighborhood,
		subset,
		map_id,
		class_cd,
		imprv_unit_price,
		imprv_val,
		imprv_add_val,
		land_type_cd,
		land_sqft,
		land_acres,
		land_front_feet,
		land_lot,
		land_unit_price,
		land_value,
		ls_table,
		condition_cd,
		percent_complete,
		main_land_unit_price,
		main_land_total_adj,
		size_adj_pct,
		effective_land_price,
		heat_ac_code,
		GPIRSF,
		EGIRSF,
		VR,
		EXPRSF,
		NOIRSF,
		CAPR,
		IND,
		GBA,
		income_value,
		lu_cost,
		land,
		PERS,
		sub_class_cd,
		cost_value,
        szSubmarket,
		szDBAName

	from #comp_equity_commercial
	order by
		score desc
end

/* We don't need this anymore */
drop table #comp_equity_commercial

GO

