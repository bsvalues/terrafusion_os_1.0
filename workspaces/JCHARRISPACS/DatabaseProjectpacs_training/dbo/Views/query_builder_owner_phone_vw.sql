
create view query_builder_owner_phone_vw
as

	select
		o.owner_id, o.owner_tax_yr, o.prop_id, o.updt_dt, o.pct_ownership, o.owner_cmnt, o.over_65_defer, o.over_65_date, o.ag_app_filed, o.apply_pct_exemptions, o.sup_num, o.type_of_int, o.hs_prop, o.birth_dt, o.roll_exemption, o.roll_state_code, o.roll_entity, o.pct_imprv_hs, o.pct_imprv_nhs, o.pct_land_hs, o.pct_land_nhs, o.pct_ag_use, o.pct_ag_mkt, o.pct_tim_use, o.pct_tim_mkt, o.pct_pers_prop, o.udi_child_prop_id, o.percent_type,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from owner as o with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = o.owner_id

GO

