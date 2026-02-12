
CREATE procedure ProTax_PropDataExport

	@lYear numeric(4,0),
	@szGroupCode varchar(20)

as

set nocount on

if @szGroupCode <> 'ALL'
begin
	select
		pp.prop_id,
		pp.prop_val_yr,
		pp.yr_blt,
		pp.living_area,
		pp.land_sqft,
		pp.land_acres,
		pp.region,
		pp.neighborhood,
		pp.map_id,
		pp.land_num_lots,
		pp.eff_yr_blt,
		pp.num_imprv,
		alast.appraiser_nm as last_appraiser,
		anext.appraiser_nm as next_appraiser,
		aland.appraiser_nm as land_appraiser,
		avalue.appraiser_nm as value_appraiser,
		ahood.appraiser_nm as neighborhood_appraiser,
		asub.appraiser_nm as subdivision_appraiser,
		acat.appraiser_nm as category_appraiser,
		replace(pv.next_appraisal_rsn,	char(13)+char(10), ' ') as next_appraisal_rsn,
		replace(p.prop_cmnt,		char(13)+char(10), ' ') as prop_cmnt,
		replace(p.remarks,		char(13)+char(10), ' ') as remarks,
		pv.appr_method as appr_method

	from property_profile as pp
	with (nolock)
	join property_val as pv
	with (nolock)
	on pp.prop_id = pv.prop_id
	and pp.prop_val_yr = pv.prop_val_yr
	and pp.sup_num = pv.sup_num
	join property as p
	with (Nolock)
	on pp.prop_id = p.prop_id
	left outer join appraiser as alast
	with (nolock)
	on pv.last_appraiser_id = alast.appraiser_id
	left outer join appraiser as anext
	with (nolock)
	on pv.next_appraiser_id = anext.appraiser_id
	left outer join appraiser as aland
	with (nolock)
	on pv.land_appraiser_id = aland.appraiser_id
	left outer join appraiser as avalue
	with (nolock)
	on pv.value_appraiser_id = avalue.appraiser_id
	left outer join profile_type_desc as phood
	with (nolock)
	on pv.hood_cd = phood.code
	and phood.type = 'N'
	left outer join appraiser as ahood
	with (nolock)
	on phood.appraiser_id = ahood.appraiser_id
	left outer join profile_type_desc as psub
	with (nolock)
	on pv.abs_subdv_cd = psub.code
	and psub.type = 'AS'
	left outer join appraiser as asub
	with (nolock)
	on psub.appraiser_id = asub.appraiser_id
	left outer join sic_code as s
	with (nolock)
	on p.prop_sic_cd = s.sic_cd
	left outer join appraiser as acat
	with (nolocK)
	on s.category_appraiser = acat.appraiser_id
	join prop_group_assoc as pga
	with (nolock)
	on pp.prop_id = pga.prop_id
	and pga.prop_group_cd = @szGroupCode
	where pp.prop_val_yr = @lYear
	order by pp.prop_id
end
else
begin
	select
		pp.prop_id,
		pp.prop_val_yr,
		pp.yr_blt,
		pp.living_area,
		pp.land_sqft,
		pp.land_acres,
		pp.region,
		pp.neighborhood,
		pp.map_id,
		pp.land_num_lots,
		pp.eff_yr_blt,
		pp.num_imprv,
		alast.appraiser_nm as last_appraiser,
		anext.appraiser_nm as next_appraiser,
		aland.appraiser_nm as land_appraiser,
		avalue.appraiser_nm as value_appraiser,
		ahood.appraiser_nm as neighborhood_appraiser,
		asub.appraiser_nm as subdivision_appraiser,
		acat.appraiser_nm as category_appraiser,
		replace(pv.next_appraisal_rsn,	char(13)+char(10), ' ') as next_appraisal_rsn,
		replace(p.prop_cmnt,		char(13)+char(10), ' ') as prop_cmnt,
		replace(p.remarks,		char(13)+char(10), ' ') as remarks,
		pv.appr_method as appr_method

	from property_profile as pp
	with (nolock)
	join property_val as pv
	with (nolock)
	on pp.prop_id = pv.prop_id
	and pp.prop_val_yr = pv.prop_val_yr
	and pp.sup_num = pv.sup_num
	join property as p
	with (Nolock)
	on pp.prop_id = p.prop_id
	left outer join appraiser as alast
	with (nolock)
	on pv.last_appraiser_id = alast.appraiser_id
	left outer join appraiser as anext
	with (nolock)
	on pv.next_appraiser_id = anext.appraiser_id
	left outer join appraiser as aland
	with (nolock)
	on pv.land_appraiser_id = aland.appraiser_id
	left outer join appraiser as avalue
	with (nolock)
	on pv.value_appraiser_id = avalue.appraiser_id
	left outer join profile_type_desc as phood
	with (nolock)
	on pv.hood_cd = phood.code
	and phood.type = 'N'
	left outer join appraiser as ahood
	with (nolock)
	on phood.appraiser_id = ahood.appraiser_id
	left outer join profile_type_desc as psub
	with (nolock)
	on pv.abs_subdv_cd = psub.code
	and psub.type = 'AS'
	left outer join appraiser as asub
	with (nolock)
	on psub.appraiser_id = asub.appraiser_id
	left outer join sic_code as s
	with (nolock)
	on p.prop_sic_cd = s.sic_cd
	left outer join appraiser as acat
	with (nolocK)
	on s.category_appraiser = acat.appraiser_id
	where pp.prop_val_yr = @lYear
	order by pp.prop_id
end

GO

