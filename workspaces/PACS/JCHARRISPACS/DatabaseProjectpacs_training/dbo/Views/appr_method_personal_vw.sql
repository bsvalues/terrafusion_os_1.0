
create view appr_method_personal_vw
as

	select
		pps.prop_val_yr,
		pps.sup_num,
		pps.prop_id,
		pps.pp_seg_id,
		value = case pv.appr_method
			when 'C' then isnull(pps.pp_mkt_val, 0)
			when 'A' then isnull(pps.arb_val, 0)
			when 'D' then isnull(pps.dist_val, 0)
			else 0 -- Should not happen but putting in else clause so this column is definitely always non null
		end
	from pers_prop_seg as pps with(nolock)
	join property_val as pv with(nolock) on
		pv.prop_val_yr = pps.prop_val_yr and
		pv.sup_num = pps.sup_num and
		pv.prop_id = pps.prop_id

GO

