

create view penpad_zero_improv_vw

as

	select distinct pc.run_id, pc.prop_id
	from penpad_checkout as pc
	join penpad_run as pr on
		pc.run_id = pr.run_id and
		pr.check_in_date is not null
	join pacs_system as ps on
		0 = 0 /* Always join */
	join imprv as i on
		pc.prop_id = i.prop_id and
		i.prop_val_yr = ps.appr_yr
	where
		i.imprv_val <= 0

GO

