
create view appr_method_improvement_vw
as

	select
		i.prop_val_yr,
		i.sup_num,
		i.sale_id,
		i.prop_id,
		i.imprv_id,
		value = case pv.appr_method
			when 'C' then isnull(i.imprv_val, 0)
			when 'I' then isnull(i.income_val, 0)
			when 'A' then isnull(i.arb_val, 0)
			when 'D' then isnull(i.dist_val, 0)
			when 'G' then isnull(i.mktappr_val, 0)
			else 0 -- Should not happen but putting in else clause so this column is definitely always non null
		end,
		hs_flag = convert(bit, case when i.imprv_homesite in ('T','Y') then 1 else 0 end),
		i.hs_pct_override,
		hs_pct = isnull(i.hs_pct, 100.0) / 100.0
	from imprv as i with(nolock)
	join property_val as pv with(nolock) on
		pv.prop_val_yr = i.prop_val_yr and
		pv.sup_num = i.sup_num and
		pv.prop_id = i.prop_id

GO

