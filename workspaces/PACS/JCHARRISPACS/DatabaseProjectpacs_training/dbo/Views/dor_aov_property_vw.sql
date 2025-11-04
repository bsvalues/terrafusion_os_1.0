
create view dor_aov_property_vw
as

	select
		pv.prop_val_yr,
		pv.sup_num,
		pv.prop_id,
		p.prop_type_cd,
		
		u500_flag = case when pe_u500.exmpt_tax_yr is not null then 1 else 0 end,
		snr_flag = case when pe_snr.exmpt_tax_yr is not null then 1 else 0 end,
		hof_flag = case when pe_hof.exmpt_tax_yr is not null then 1 else 0 end,
		ex_flag = case when pe_ex.exmpt_tax_yr is not null then 1 else 0 end,
		
		num_exemptions =
			case when pe_u500.exmpt_tax_yr is not null then 1 else 0 end +
			case when pe_snr.exmpt_tax_yr is not null then 1 else 0 end +
			case when pe_hof.exmpt_tax_yr is not null then 1 else 0 end +
			case when pe_ex.exmpt_tax_yr is not null then 1 else 0 end
		,
		
		is_state_assessed = case when pst.state_assessed_utility = 1 then 1 else 0 end,
		is_local_assessed = case when pst.local_assessed_utility = 1 then 1 else 0 end,
		
		has_invalid_asset_type_code = case
			when pp_seg_invalid_vw.prop_val_yr is not null then 1 else 0
		end,
		
		is_reference_not_deleted = case
			when p.reference_flag = 'T' and pv.prop_inactive_dt is null then 1 else 0
		end,
		
		is_pp_sum_wrong = case
			when p.prop_type_cd in ('A','P') and isnull(pp_sum.pp_mkt_sum, 0) <> isnull(pv.market, 0)
			then 1
			else 0
		end,
		
		is_wrong_pp_appr_method = case
			when p.prop_type_cd in ('A','P') and not pv.appr_method in ('C','D','A')
			then 1
			else 0
		end,
		
		has_pp_farm_and_u500 = case
			when
				p.prop_type_cd in ('A','P') and
				pp_farm_properties.prop_val_yr is not null and
				pe_u500.exmpt_tax_yr is not null
			then 1
			else 0
		end,
		
		has_pp_farm_and_ex = case
			when
				p.prop_type_cd in ('A','P') and
				pp_farm_properties.prop_val_yr is not null and
				pe_ex.exmpt_tax_yr is not null
			then 1
			else 0
		end,
		
		has_pp_farm_code_invalid = case
			when
				p.prop_type_cd in ('A','P') and
				pp_farm_code_invalid.prop_val_yr is not null
				then 1
				else 0
		end,

		has_rmh_invalid_dor_code = case
			when rmh_invalid_dor_code.prop_val_yr is not null
			then 1
			else 0
		end
		
	from property_val as pv with(nolock)
	join property as p with(nolock) on
		p.prop_id = pv.prop_id
	left outer join property_exemption as pe_u500 with(nolock) on
		pe_u500.exmpt_tax_yr = pv.prop_val_yr and
		pe_u500.owner_tax_yr = pv.prop_val_yr and
		pe_u500.sup_num = pv.sup_num and
		pe_u500.prop_id = pv.prop_id and
		pe_u500.exmpt_type_cd = 'U500'
	left outer join property_exemption as pe_snr with(nolock) on
		pe_snr.exmpt_tax_yr = pv.prop_val_yr and
		pe_snr.owner_tax_yr = pv.prop_val_yr and
		pe_snr.sup_num = pv.sup_num and
		pe_snr.prop_id = pv.prop_id and
		pe_snr.exmpt_type_cd = 'SNR/DSBL'
	left outer join property_exemption as pe_hof with(nolock) on
		pe_hof.exmpt_tax_yr = pv.prop_val_yr and
		pe_hof.owner_tax_yr = pv.prop_val_yr and
		pe_hof.sup_num = pv.sup_num and
		pe_hof.prop_id = pv.prop_id and
		pe_hof.exmpt_type_cd = 'HOF'
	left outer join property_exemption as pe_ex with(nolock) on
		pe_ex.exmpt_tax_yr = pv.prop_val_yr and
		pe_ex.owner_tax_yr = pv.prop_val_yr and
		pe_ex.sup_num = pv.sup_num and
		pe_ex.prop_id = pv.prop_id and
		pe_ex.exmpt_type_cd = 'EX'
	left outer join property_sub_type as pst with(nolock) on
		pst.property_sub_cd = pv.sub_type
	left outer join (
			select distinct
				pps.prop_val_yr,
				pps.sup_num,
				pps.prop_id
			from pers_prop_seg as pps with(nolock)
			left outer join pp_type as pt with(nolock) on
				pt.pp_type_cd = pps.pp_type_cd
			where
				pps.pp_active_flag = 'T' and
				not pt.asset_listing_type_cd in ('A','I','O','S','F','T','P')
				
	) as pp_seg_invalid_vw on
		pp_seg_invalid_vw.prop_val_yr = pv.prop_val_yr and
		pp_seg_invalid_vw.sup_num = pv.sup_num and
		pp_seg_invalid_vw.prop_id = pv.prop_id
	left outer join (
		select distinct
				pps.prop_val_yr,
				pps.sup_num,
				pps.prop_id,
				pp_mkt_sum = sum(
					isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end, 0)
				)
		from pers_prop_seg as pps with(nolock)
		join property_val as pv with(nolock) on
			pps.prop_val_yr = pv.prop_val_yr and
			pps.sup_num = pv.sup_num and
			pps.prop_id = pv.prop_id
		where
			pps.pp_active_flag = 'T'
		group by pps.prop_val_yr, pps.sup_num, pps.prop_id
	) as pp_sum on
		pp_sum.prop_val_yr = pv.prop_val_yr and
		pp_sum.sup_num = pv.sup_num and
		pp_sum.prop_id = pv.prop_id
	left outer join (
		select distinct
			pps.prop_val_yr,
			pps.sup_num,
			pps.prop_id
		from pers_prop_seg as pps with(nolock)
		where
			pps.pp_active_flag = 'T' and
			pps.farm_asset = 1
	) as pp_farm_properties on
		pp_farm_properties.prop_val_yr = pv.prop_val_yr and
		pp_farm_properties.sup_num = pv.sup_num and
		pp_farm_properties.prop_id = pv.prop_id
	left outer join (
		select distinct
			pps.prop_val_yr,
			pps.sup_num,
			pps.prop_id
		from pers_prop_seg as pps with(nolock)
		left outer join pp_type as pt with(nolock) on
				pt.pp_type_cd = pps.pp_type_cd
		where
			pps.pp_active_flag = 'T' and
			pps.farm_asset = 1 and
			isnull(pt.asset_listing_type_cd, '') <> 'A'
	) as pp_farm_code_invalid on
		pp_farm_code_invalid.prop_val_yr = pv.prop_val_yr and
		pp_farm_code_invalid.sup_num = pv.sup_num and
		pp_farm_code_invalid.prop_id = pv.prop_id
	left outer join (
		select
			pv.prop_val_yr,
			pv.sup_num,
			pv.prop_id
		from property_val as pv with(nolock)
		join property as p with(nolock) on
			p.prop_id = pv.prop_id and
			p.prop_type_cd in ('R','MH')
		left outer join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		left outer join dor_land_use_code as dluc with(nolock) on
			dluc.code = pu.dor_use_code
		where dluc.code is null
	) as rmh_invalid_dor_code on
		rmh_invalid_dor_code.prop_val_yr = pv.prop_val_yr and
		rmh_invalid_dor_code.sup_num = pv.sup_num and
		rmh_invalid_dor_code.prop_id = pv.prop_id
	where
		pv.prop_inactive_dt is null

GO

