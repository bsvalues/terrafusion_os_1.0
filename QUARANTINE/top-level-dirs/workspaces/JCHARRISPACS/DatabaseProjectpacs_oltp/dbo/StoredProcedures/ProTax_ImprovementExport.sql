
CREATE procedure ProTax_ImprovementExport

	@lYear numeric(4,0),
	@szGroupCode varchar(20)

as

set nocount on

if @szGroupCode <> 'ALL'
begin
	select
		i.prop_id,
		i.prop_val_yr,
		i.sup_num,
		i.imprv_id,
		rtrim(i.imprv_type_cd) as imprv_type_cd,
		rtrim(i.imprv_state_cd) as imprv_state_cd,
		i.imprv_homesite,
		i.effective_yr_blt,
		case when len(i.imprv_desc) > 0 then replace(replace(isnull(i.imprv_desc,''),char(13),''),char(10),'') else null end as imprv_desc,
		i.num_imprv,
		case when len(i.imprv_cmnt) > 0 then replace(replace(isnull(i.imprv_cmnt,''),char(13),''),char(10),'') else null end as imprv_cmnt,
		i.stories,
		i.dep_pct,
		i.dep_cmnt,
		i.physical_pct,
		i.physical_cmnt,
		i.functional_pct,
		i.functional_cmnt,
		i.economic_pct,
		i.economic_cmnt,
		i.percent_complete,
		i.percent_complete_cmnt,
		(select sum(iii.imprv_det_val)
			from imprv_detail as iii
			with (nolock)
			where prop_id = i.prop_id
			and prop_val_yr = i.prop_val_yr
			and sup_num = i.sup_num
			and imprv_id = i.imprv_id
			and sale_id = 0) as total_detail_value,
		i.imprv_val,
		i.imprv_val_source,
		dbo.fn_ProTax_ImprovementEntityPct(i.prop_id,i.prop_val_yr,i.sup_num,i.imprv_id) as entity_pct,
		dbo.fn_ProTax_ImprvAdjustments(i.prop_id,i.prop_val_yr,i.sup_num,i.imprv_id) as imprv_adjust,
		ii.imprv_det_id,
		ii.num_units,
		ii.num_stories,
		rtrim(ii.imprv_det_class_cd) as imprv_det_class_cd,
		rtrim(ii.imprv_det_meth_cd) as imprv_det_meth_cd,
		rtrim(ii.imprv_det_sub_class_cd) as imprv_det_sub_class_cd,
		ii.unit_price,
		ii.add_factor,
		case when ii.imprv_det_area_type = 'C' then ii.calc_area else ii.sketch_area end as area,
		ii.dep_pct as det_dep_pct,
		ii.physical_pct as det_physical_pct,
		ii.physical_cmnt as det_physical_cmnt,
		ii.functional_pct as det_functional_pct,
		ii.functional_cmnt as det_functional_cmnt,
		ii.economic_pct as det_economic_pct,
		ii.economic_cmnt as det_economic_cmnt,
		ii.size_adj_pct,
		ii.percent_complete as det_percent_complete,
		ii.percent_complete_cmnt as det_percent_complete_cmnt,
		ii.imprv_det_val,
		ii.imprv_det_val_source,
		ii.use_up_for_pct_base,
		ii.stories_multiplier,
		ii.imprv_det_calc_val,
		rtrim(ii.condition_cd) as condition_cd,
		ii.yr_built,
		ii.depreciation_yr,
		ii.yr_built - ii.depreciation_yr as age,
		dbo.fn_ProTax_ImprvDetailAdjustments(i.prop_id,	i.prop_val_yr,	i.sup_num, i.imprv_id, ii.imprv_det_id) as det_imprv_adjust
	from
		imprv as i with (nolock)
	join
		prop_supp_assoc as psa with (nolock)
		on i.prop_id = psa.prop_id
		and i.prop_val_yr = psa.owner_tax_yr
		and i.sup_num = psa.sup_num
	left outer join
		imprv_detail as ii with (nolock)
		on i.prop_id = ii.prop_id
		and i.prop_val_yr = ii.prop_val_yr
		and i.sup_num = ii.sup_num
		and i.imprv_id = ii.imprv_id
		and i.sale_id = ii.sale_id
	join
		prop_group_assoc as pga	with (nolock)
		on i.prop_id = pga.prop_id
		and pga.prop_group_cd = @szGroupCode
	where
		i.prop_val_yr = @lYear
		and i.sale_id = 0
	order by
		i.prop_id
end
else
begin


	select
		i.prop_id,
		i.prop_val_yr,
		i.sup_num,
		i.imprv_id,
		rtrim(i.imprv_type_cd) as imprv_type_cd,
		rtrim(i.imprv_state_cd) as imprv_state_cd,
		i.imprv_homesite,
		i.effective_yr_blt,
		case when len(i.imprv_desc) > 0 then replace(replace(isnull(i.imprv_desc,''),char(13),''),char(10),'') else null end as imprv_desc,
		i.num_imprv,
		case when len(i.imprv_cmnt) > 0 then replace(replace(isnull(i.imprv_cmnt,''),char(13),''),char(10),'') else null end as imprv_cmnt,
		i.stories,
		i.dep_pct,
		i.dep_cmnt,
		i.physical_pct,
		i.physical_cmnt,
		i.functional_pct,
		i.functional_cmnt,
		i.economic_pct,
		i.economic_cmnt,
		i.percent_complete,
		i.percent_complete_cmnt,
		(select sum(iii.imprv_det_val)
			from imprv_detail as iii
			with (nolock)
			where prop_id = i.prop_id
			and prop_val_yr = i.prop_val_yr
			and sup_num = i.sup_num
			and imprv_id = i.imprv_id
			and sale_id = 0) as total_detail_value,
		i.imprv_val,
		i.imprv_val_source,
		dbo.fn_ProTax_ImprovementEntityPct(i.prop_id,i.prop_val_yr,i.sup_num,i.imprv_id) as entity_pct,
		dbo.fn_ProTax_ImprvAdjustments(i.prop_id,i.prop_val_yr,i.sup_num,i.imprv_id) as imprv_adjust,
		ii.imprv_det_id,
		ii.num_units,
		ii.num_stories,
		rtrim(ii.imprv_det_class_cd) as imprv_det_class_cd,
		rtrim(ii.imprv_det_meth_cd) as imprv_det_meth_cd,
		rtrim(ii.imprv_det_sub_class_cd) as imprv_det_sub_class_cd,
		ii.unit_price,
		ii.add_factor,
		case when ii.imprv_det_area_type = 'C' then ii.calc_area else ii.sketch_area end as area,
		ii.dep_pct as det_dep_pct,
		ii.physical_pct as det_physical_pct,
		ii.physical_cmnt as det_physical_cmnt,
		ii.functional_pct as det_functional_pct,
		ii.functional_cmnt as det_functional_cmnt,
		ii.economic_pct as det_economic_pct,
		ii.economic_cmnt as det_economic_cmnt,
		ii.size_adj_pct,
		ii.percent_complete as det_percent_complete,
		ii.percent_complete_cmnt as det_percent_complete_cmnt,
		ii.imprv_det_val,
		ii.imprv_det_val_source,
		ii.use_up_for_pct_base,
		ii.stories_multiplier,
		ii.imprv_det_calc_val,
		rtrim(ii.condition_cd) as condition_cd,
		ii.yr_built,
		ii.depreciation_yr,
		ii.yr_built - ii.depreciation_yr as age,
		dbo.fn_ProTax_ImprvDetailAdjustments(i.prop_id,	i.prop_val_yr,	i.sup_num, i.imprv_id, ii.imprv_det_id) as det_imprv_adjust
	from
		imprv as i with (nolock)
	join
		prop_supp_assoc as psa with (nolock)
		on i.prop_id = psa.prop_id
		and i.prop_val_yr = psa.owner_tax_yr
		and i.sup_num = psa.sup_num
	left outer join
		imprv_detail as ii with (nolock)
		on i.prop_id = ii.prop_id
		and i.prop_val_yr = ii.prop_val_yr
		and i.sup_num = ii.sup_num
		and i.imprv_id = ii.imprv_id
		and i.sale_id = ii.sale_id
	order by
		i.prop_id

end

GO

