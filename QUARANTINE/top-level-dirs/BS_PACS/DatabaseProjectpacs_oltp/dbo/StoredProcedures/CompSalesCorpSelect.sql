

create procedure CompSalesCorpSelect
	@lSubjectPropID int,
	@lSubjectYear numeric(4,0),
	@lPacsUserID int,
	@szWhereClause varchar(8000),
	@bOutputRS bit = 1
as

set nocount on


/* Table to hold the selection results */
create table #tmp_comps
(
	fScore float(24) null,
	lPropID int not null,
	lYear numeric(4,0) not null,
	szQuality varchar(10) null,
	szSubmarket varchar(10) null,
	szPropertyUse varchar(10) null,
	szCVA varchar(10) null,
	lEffYearBuilt numeric(4,0) null,
	lLivingArea numeric(14,0) null,
	szStateCode varchar(10) null,
	lSalePrice numeric(14,0) null,
	dtSale datetime null,
	szSitusNum varchar(10) null,
	szSitusStreet varchar(64) null,
	szSitusCity varchar(32) null,
	lLandSize numeric(18,2) null,
	lNumUnits int null,
	lSaleID int null,
	szDBAName varchar(50) null,
	szSubClassCode varchar(10) null,
	IncomeValue numeric(14,0) null,
	CostValue numeric(14,0) null,
	NRA numeric(14,0) null
)

/* To hold the SQL for selecting comparables */
declare @szSQL varchar(8000)

-- The current appraisal year
/*
declare @lApprYear numeric(4,0)
exec GetApprYear @lApprYear output
*/
if @lSubjectYear < 0
begin
	exec GetApprYear @lSubjectYear output
end

set @szSQL =
'insert #tmp_comps
(
	lPropID,
	lYear,
	szQuality,
	szSubmarket,
	szPropertyUse,
	szCVA,
	lEffYearBuilt,
	lLivingArea,
	szStateCode,
	lSalePrice,
	dtSale,
	szSitusNum,
	szSitusStreet,
	szSitusCity,
	lLandSize,
	lSaleID,
	szDBAName,
	szSubClassCode,
	IncomeValue,
	CostValue,
	NRA
)
select distinct
	property_profile.prop_id,
	property_profile.prop_val_yr,
	property_profile.class_cd,
	property_val.sub_market_cd,
	property_val.property_use_cd,
	property_val.visibility_access_cd,
	property_profile.eff_yr_blt,
	property_profile.living_area,
	property_profile.state_cd,
	sale.sl_price,
	sale.sl_dt,
	situs.situs_num,
	situs.situs_street,
	situs.situs_city,
	property_profile.land_sqft,
	sale.chg_of_owner_id,
	property.dba_name,
	property_profile.imprv_det_sub_class_cd,
	isnull(income_prop_vw.income_value,0),
	isnull(property_val.cost_value,0),
	isnull(income_prop_vw.NRA,0)

from chg_of_owner_prop_assoc with(nolock)
join sale with(nolock) on
	chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
join property_profile with(nolock) on
	chg_of_owner_prop_assoc.prop_id = property_profile.prop_id and
	property_profile.prop_val_yr = ' + convert(varchar(4), @lSubjectYear) + ' and
	property_profile.sup_num = 0
join property_val with(nolock) on
	property_profile.prop_id = property_val.prop_id and
	property_val.prop_val_yr = ' + convert(varchar(4), @lSubjectYear) + ' and
	property_val.sup_num = 0
join property with(nolock) on
	property_profile.prop_id = property.prop_id
left outer join entity as city_entity with(nolock) on
	property_profile.city_id = city_entity.entity_id
left outer join entity as school_entity with(nolock) on
	property_profile.school_id = school_entity.entity_id
left outer join situs with(nolock) on
	property_profile.prop_id = situs.prop_id and
	situs.primary_situs = ''Y''
join state_code with(nolock) on
	property_profile.state_cd = state_code.state_cd and
	state_code.commercial_acct_flag = ''T''
left outer join income_prop_vw with(nolock) on
	property_val.prop_id = income_prop_vw.prop_id and 
	property_val.prop_val_yr = income_prop_vw.prop_val_yr and
	property_profile.sup_num = income_prop_vw.sup_num and
	income_prop_vw.active_valuation = ''T''
where ' + @szWhereClause + ' ' + '
and (isnull(property_val.prop_inactive_dt, '''') = '''' or isnull(property_val.udi_parent, '''') = ''T'')
order by property_profile.prop_id
'

/* RK 03/08/2005  This comment tells how to fix the income value to the correct value.  Os and Roy have decided not
	to make this change until the clients bring up this issue.  They DID want me to put the correct solution in while
	its fresh on my mind.

	From above replace :
		isnull(income_prop_vw.income_value,0),
	with 
		isnull(income_prop_assoc.income_value,0)

	and add this to the join section
		left outer join income_prop_assoc with(nolock) on
			property_val.prop_id		= income_prop_assoc.prop_id and 
			property_val.prop_val_yr	= income_prop_assoc.prop_val_yr and
			property_val.sup_num		= income_prop_assoc.sup_num

*/
exec(@szSQL)

declare @lNumUnits int
/* Score each of the comparables and determine the # of units */
declare @lPropID int
declare @fScore float(24)

declare curComps cursor
for
	select
		lPropID
	from #tmp_comps
for update of fScore, lNumUnits

open curComps
fetch next from curComps into @lPropID

/* For each comparable */
while @@fetch_status = 0
begin
	exec CompSalesCorpScoreProperty @lSubjectPropID, @lPropID, @lPacsUserID, @lSubjectYear, null, @fScore output, 0

	/* Determine the # of units */
	select
		@lNumUnits = sum(num_imprv)
	from imprv with(nolock)
	where
		prop_id = @lPropID and
		prop_val_yr = @lSubjectYear and
		sup_num = 0 and
		sale_id = 0

	update #tmp_comps set
		fScore = @fScore,
		lNumUnits = @lNumUnits
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
		lPropID, lSaleID, fScore
	from #tmp_comps
	order by
		3 desc
end

set nocount off

if (@bOutputRS = 1)
begin
	select                              /* WARNING the code that reads this in is positional dependent so order must follow list column layout  RK*/
		lSaleID,
		fScore,
		lPropID,
		isnull(szQuality, '') as szQuality,
		isnull(szSubClassCode, '') as szSubClassCode,
		szSubmarket,
		szPropertyUse,
		szCVA,
		lEffYearBuilt,
		lLivingArea,
		isnull(szStateCode, '') as szStateCode,
		lSalePrice,
		dtSale,
		szSitusNum + ' ' + szSitusStreet,
		szSitusCity,
		lLandSize,
		lNumUnits,
		szDBAName,
		IncomeValue,
		CostValue,
		NRA
	from #tmp_comps
	order by
		fScore desc
end

/* We don't need this anymore */
drop table #tmp_comps

GO

