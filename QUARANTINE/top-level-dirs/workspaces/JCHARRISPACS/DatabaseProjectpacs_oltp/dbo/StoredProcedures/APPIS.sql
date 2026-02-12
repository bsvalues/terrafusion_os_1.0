
create procedure APPIS
	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end

declare @prop_id	int
declare @sup_num	int
declare @exemptions	varchar(200)

if @case_id > 0
begin
	select
		@prop_id = prop_id
	from
		_arb_protest as ap with (nolock)
	where
		ap.case_id = @case_id
	and	ap.prop_val_yr = @prop_val_yr
	
	
	select
		@sup_num = sup_num
	from
		prop_supp_assoc with (nolock)
	where
		prop_id = @prop_id
	and	owner_tax_yr = @prop_val_yr
	
	
	set @exemptions = ''
	select @exemptions = dbo.fn_GetExemptions(@prop_id, @prop_val_yr, @sup_num)
	
	select distinct
		ao.file_as_name as owner_name,
		pv.prop_id,
		pv.prop_val_yr,
		s.situs_display as situs,
		pp.neighborhood,
		left(convert(varchar(20), convert(money, pv.market), 1), charindex('.', convert(varchar(20), convert(money, pv.market), 1), 1) - 1) as market_val,
		left(convert(varchar(20), convert(money, pp.living_area), 1), charindex('.', convert(varchar(20), convert(money, pp.living_area), 1), 1) - 1) as living_area,
		cast
		(
			case when cast(isnull(pp.living_area, 0) as numeric(14,2)) > 0
			then
			(
				cast(isnull(pv.market, 0) as numeric(14,2)) / cast(pp.living_area as numeric(14,2))
			)
			else
				cast(pv.market as numeric(14,2))
			end as numeric(14,2)
		) as market_per_sq_ft,
		@exemptions as exemptions,
		ap.prot_type,
		left(convert(varchar(20), convert(money, isnull(pv.imprv_hstd_val,0) + isnull(pv.imprv_non_hstd_val,0)), 1), charindex('.', convert(varchar(20), convert(money, isnull(pv.imprv_hstd_val,0) + isnull(pv.imprv_non_hstd_val,0)), 1), 1) - 1) as imprv_val,
		left(convert(varchar(20), convert(money, pp.imprv_add_val), 1), charindex('.', convert(varchar(20), convert(money, pp.imprv_add_val), 1), 1) - 1) as imprv_add_val,
		pp.imprv_type_cd,
		pp.class_cd as imprv_class_cd,
		pp.imprv_det_sub_class_cd,
		left(convert(varchar(20), convert(money, pp.percent_complete), 1), charindex('.', convert(varchar(20), convert(money, pp.percent_complete), 1), 1) - 1) as percent_complete,
		pp.yr_blt,
		left(convert(varchar(20), convert(money, isnull(pv.ag_market,0) + ISNULL(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0)), 1), charindex('.', convert(varchar(20), convert(money, isnull(pv.ag_market,0) + ISNULL(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0)), 1), 1) - 1) as land_mkt_val,
		aa.agent_id as arb_agent_id,
		aaa.file_as_name as arb_agent_name,
		isnull(aa.auth_to_protest, 'F') as agent_auth_to_protest,
		isnull(aa.auth_to_resolve, 'F') as agent_auth_to_resolve,
		pv.mapsco
	from
		_arb_protest as ap with (nolock)
	inner join
		property as p with (nolock)
	on
		ap.prop_id = p.prop_id
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		ap.prop_id = psa.prop_id
	and	ap.prop_val_yr = psa.owner_tax_yr
	inner join
		owner as o with (nolock)
	on
		psa.prop_id = o.prop_id
	and	psa.owner_tax_yr = o.owner_tax_yr
	and	psa.sup_num = o.sup_num
	inner join
		account as ao with (nolock)
	on
		o.owner_id = ao.acct_id
	inner join
		property_val as pv with (nolock)
	on
		psa.prop_id = pv.prop_id
	and	psa.owner_tax_yr = pv.prop_val_yr
	and	psa.sup_num = pv.sup_num
	inner join
		property_profile as pp with (nolock)
	on
		pv.prop_id = pp.prop_id
	and	pv.prop_val_yr = pp.prop_val_yr
	left outer join
		situs as s with (nolock)
	on
		ap.prop_id = s.prop_id
	and	s.primary_situs = 'Y'
	left outer join
		agent_assoc as aa with (nolock)
	on
		o.prop_id = aa.prop_id
	and	o.owner_id = aa.owner_id
	and	o.owner_tax_yr = aa.owner_tax_yr
	left outer join
		account as aaa with (nolock)
	on
		aa.agent_id = aaa.acct_id
	where
		ap.case_id = @case_id
	and	ap.prop_val_yr = @prop_val_yr
end
else
begin
	select 
		'Owner Name' 			as owner_name,
		'Property ID' 			as prop_id,
		'Tax Year' 				as prop_val_yr,
		'Situs'					as situs,
		'Neighborhood'			as neighborhood,
		'Market Value' 			as market_val,
		'Living Area'			as living_area,
		'Market Value/Sq. Ft.'	as market_per_sq_ft,
		'Mapsco'				as mapsco,
		'Exemptions'			as exemptions,
		'Protest Type'			as prot_type,
		'Improvement Value'		as imprv_val,
		'Improvement Add. Value' as imprv_add_val,
		'Improvement Type Code'	as imprv_type_cd,
		'Improvement Class Code' as imprv_class_cd,
		'Improvement Detail Subclass Code' as imprv_det_sub_class_cd,
		'Percent Complete' 		as percent_complete,
		'Year Built' 			as yr_blt,
		'Land Market Value'		as land_mkt_val,
		'ARB Agent ID'			as arb_agent_id,
		'ARB Agent Name'		as arb_agent_name,
		'ARB Agent Authority to Protest Flag' as agent_auth_to_protest,
		'ARB Agent Authority to ResolveFlag' as agent_auth_to_resolve
end

GO

