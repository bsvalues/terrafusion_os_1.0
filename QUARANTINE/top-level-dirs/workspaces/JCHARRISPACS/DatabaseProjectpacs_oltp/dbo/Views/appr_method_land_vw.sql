
create view appr_method_land_vw
as

	select
		ld.prop_val_yr,
		ld.sup_num,
		ld.sale_id,
		ld.prop_id,
		ld.land_seg_id,
		value = case pv.appr_method
			when 'C' then isnull(ld.land_seg_mkt_val, 0)
			when 'I' then isnull(ld.land_seg_mkt_val, 0)
			when 'A' then isnull(ld.arb_val, 0)
			when 'D' then isnull(ld.dist_val, 0)
			when 'G' then isnull(ld.mktappr_val, 0)
			else 0 -- Should not happen but putting in else clause so this column is definitely always non null
		end,
		ag_value = case
			when
				isnull(ld.ag_apply, 'F') <> 'T'
			then
				0
			when
				ld.ag_val <
					case pv.appr_method
						when 'C' then isnull(ld.land_seg_mkt_val, 0)
						when 'I' then isnull(ld.land_seg_mkt_val, 0)
						when 'A' then isnull(ld.arb_val, 0)
						when 'D' then isnull(ld.dist_val, 0)
						when 'G' then isnull(ld.mktappr_val, 0)
						else 0
					end
			then ld.ag_val
			else
					case pv.appr_method
						when 'C' then isnull(ld.land_seg_mkt_val, 0)
						when 'I' then isnull(ld.land_seg_mkt_val, 0)
						when 'A' then isnull(ld.arb_val, 0)
						when 'D' then isnull(ld.dist_val, 0)
						when 'G' then isnull(ld.mktappr_val, 0)
						else 0
					end
		end,
		hs_flag = convert(bit, case when ld.land_seg_homesite = 'T' then 1 else 0 end),
		ld.hs_pct_override,
		hs_pct = isnull(ld.hs_pct, 100.0) / 100.0
	from land_detail as ld with(nolock)
	join property_val as pv with(nolock) on
		pv.prop_val_yr = ld.prop_val_yr and
		pv.sup_num = ld.sup_num and
		pv.prop_id = ld.prop_id

GO

