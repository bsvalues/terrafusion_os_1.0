
create procedure WACalcTaxableSelectDOR
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as
	if ( @lPacsUserID <> 0 ) -- Properties in a temporary table
	begin
		select
			convert(smallint, pedd.exmpt_tax_yr) year,
			convert(smallint, pedd.sup_num) sup_num,
			pedd.prop_id, pedd.owner_id, pedd.item_type, pedd.item_id, 
			pedd.value_type, pedd.exmpt_amount, pedd.exmpt_percent, val.appraised_val
		from #taxable_property_list tpl with(nolock)
		join property_exemption_dor_detail pedd with(nolock)
			on tpl.year = pedd.exmpt_tax_yr
			and tpl.year = pedd.owner_tax_yr
			and tpl.sup_num = pedd.sup_num
			and tpl.prop_id = pedd.prop_id
		outer apply (
			select imprv_val
			from imprv i with(nolock)
			where pedd.item_type = 'I'
				and i.imprv_id = pedd.item_id
				and i.prop_id = pedd.prop_id
				and i.prop_val_yr = pedd.exmpt_tax_yr
				and i.prop_val_yr = pedd.owner_tax_yr
				and i.sup_num = pedd.sup_num
				and i.sale_id = 0
		) iv
		outer apply (
			select
				isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val 
					when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) land_market,	
				ld.ag_val land_ag_val,
				case when ld.ag_apply = 'T' and (au.dfl = 1 or au.timber = 1 or au.ag = 1 or au.osp = 1) then 1 else 0 end ag_apply
			from land_detail ld with(nolock)
			join property_val pv with(nolock)
				on pv.prop_id = ld.prop_id
				and pv.prop_val_yr = ld.prop_val_yr
				and pv.sup_num = ld.sup_num
			left join ag_use au with(nolock)
				on au.ag_use_cd = ld.ag_use_cd
			where pedd.item_type = 'L'
				and ld.land_seg_id = pedd.item_id
				and ld.prop_id = pedd.prop_id
				and ld.prop_val_yr = pedd.exmpt_tax_yr
				and ld.prop_val_yr = pedd.owner_tax_yr
				and ld.sup_num = pedd.sup_num
				and ld.sale_id = 0
		) lv
		cross apply (
			select convert(numeric(14,0), isnull(case 
				when iv.imprv_val is not null then iv.imprv_val
				when lv.land_ag_val < lv.land_market and ag_apply = 1 then land_ag_val
				else lv.land_market
			end, 0)) appraised_val
		) val
		order by 1, 2, 3, 4
	end

	else if ( @lPropID <> 0 ) -- Single property
	begin
		select
			convert(smallint, pedd.exmpt_tax_yr) year,
			convert(smallint, pedd.sup_num) sup_num,
			pedd.prop_id, pedd.owner_id, pedd.item_type, pedd.item_id, 
			pedd.value_type, pedd.exmpt_amount, pedd.exmpt_percent, val.appraised_val
		from property_exemption_dor_detail pedd with(nolock)
		outer apply (
			select imprv_val
			from imprv i with(nolock)
			where pedd.item_type = 'I'
				and i.imprv_id = pedd.item_id
				and i.prop_id = pedd.prop_id
				and i.prop_val_yr = pedd.exmpt_tax_yr
				and i.prop_val_yr = pedd.owner_tax_yr
				and i.sup_num = pedd.sup_num
				and i.sale_id = 0
		) iv
		outer apply (
			select
				isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val 
					when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) land_market,	
				ld.ag_val land_ag_val,
				case when ld.ag_apply = 'T' and (au.dfl = 1 or au.timber = 1 or au.ag = 1 or au.osp = 1) then 1 else 0 end ag_apply
			from land_detail ld with(nolock)
			join property_val pv with(nolock)
				on pv.prop_id = ld.prop_id
				and pv.prop_val_yr = ld.prop_val_yr
				and pv.sup_num = ld.sup_num
			left join ag_use au with(nolock)
				on au.ag_use_cd = ld.ag_use_cd
			where pedd.item_type = 'L'
				and ld.land_seg_id = pedd.item_id
				and ld.prop_id = pedd.prop_id
				and ld.prop_val_yr = pedd.exmpt_tax_yr
				and ld.prop_val_yr = pedd.owner_tax_yr
				and ld.sup_num = pedd.sup_num
				and ld.sale_id = 0
		) lv
		cross apply (
			select convert(numeric(14,0), isnull(case 
				when iv.imprv_val is not null then iv.imprv_val
				when lv.land_ag_val < lv.land_market and ag_apply = 1 then land_ag_val
				else lv.land_market
			end, 0)) appraised_val
		) val
		where
			pedd.exmpt_tax_yr = @lYear and
			pedd.owner_tax_yr = @lYear and
			pedd.sup_num = @lSupNum and
			pedd.prop_id = @lPropID
		order by 1, 2, 3, 4
	end

	else -- All properties
	begin
		select
			convert(smallint, pedd.exmpt_tax_yr) year,
			convert(smallint, pedd.sup_num) sup_num,
			pedd.prop_id, pedd.owner_id, pedd.item_type, pedd.item_id, 
			pedd.value_type, pedd.exmpt_amount, pedd.exmpt_percent, val.appraised_val
		from property_exemption_dor_detail pedd with(nolock)
		outer apply (
			select imprv_val
			from imprv i with(nolock)
			where pedd.item_type = 'I'
				and i.imprv_id = pedd.item_id
				and i.prop_id = pedd.prop_id
				and i.prop_val_yr = pedd.exmpt_tax_yr
				and i.prop_val_yr = pedd.owner_tax_yr
				and i.sup_num = pedd.sup_num
				and i.sale_id = 0
		) iv
		outer apply (
			select
				isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val 
					when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) land_market,	
				ld.ag_val land_ag_val,
				case when ld.ag_apply = 'T' and (au.dfl = 1 or au.timber = 1 or au.ag = 1 or au.osp = 1) then 1 else 0 end ag_apply
			from land_detail ld with(nolock)
			join property_val pv with(nolock)
				on pv.prop_id = ld.prop_id
				and pv.prop_val_yr = ld.prop_val_yr
				and pv.sup_num = ld.sup_num
			left join ag_use au with(nolock)
				on au.ag_use_cd = ld.ag_use_cd
			where pedd.item_type = 'L'
				and ld.land_seg_id = pedd.item_id
				and ld.prop_id = pedd.prop_id
				and ld.prop_val_yr = pedd.exmpt_tax_yr
				and ld.prop_val_yr = pedd.owner_tax_yr
				and ld.sup_num = pedd.sup_num
				and ld.sale_id = 0
		) lv
		cross apply (
			select convert(numeric(14,0), isnull(case 
				when iv.imprv_val is not null then iv.imprv_val
				when lv.land_ag_val < lv.land_market and ag_apply = 1 then land_ag_val
				else lv.land_market
			end, 0)) appraised_val
		) val
		where pedd.exmpt_tax_yr = @lYear
			and pedd.owner_tax_yr = @lYear
			and pedd.sup_num = @lSupNum
		order by 1, 2, 3, 4
	end

GO

