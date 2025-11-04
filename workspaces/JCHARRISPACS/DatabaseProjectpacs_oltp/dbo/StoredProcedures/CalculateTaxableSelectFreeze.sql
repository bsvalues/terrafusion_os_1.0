
create procedure CalculateTaxableSelectFreeze
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

if (@bUseList = 1)
begin
	select
		pf.prop_id,
		pf.owner_id,
		pf.entity_id,
		upper(rtrim(pf.exmpt_type_cd)),
		isnull(pf.use_freeze, 'F'),
		convert(varchar(10), pf.transfer_dt, 101),
		isnull(pf.prev_tax_due, 0.0),
		isnull(pf.prev_tax_nofrz, 0.0),
		pf.freeze_ceiling,
		isnull(pf.transfer_pct, 0.0),
		upper(rtrim(pf.transfer_pct_override)),
		pf.freeze_yr
	from
		property_freeze as pf with(nolock)
	join
		exmpt_type as et with(nolock)
	on
		pf.exmpt_type_cd = et.exmpt_type_cd
	where
		pf.prop_id in
		(
		select
			prop_id
		from
			#totals_prop_list
		)
	and	pf.exmpt_tax_yr = @lYear
	and	pf.owner_tax_yr = @lYear
	and	pf.sup_num = @lSupNum
	order by
		pf.prop_id asc,
		pf.owner_id asc,
		pf.entity_id asc,
		pf.exmpt_type_cd asc
end
else
begin
	select
		pf.prop_id,
		pf.owner_id,
		pf.entity_id,
		upper(rtrim(pf.exmpt_type_cd)),
		isnull(pf.use_freeze, 'F'),
		convert(varchar(10), pf.transfer_dt, 101),
		isnull(pf.prev_tax_due, 0.0),
		isnull(pf.prev_tax_nofrz, 0.0),
		pf.freeze_ceiling,
		isnull(pf.transfer_pct, 0.0),
		upper(rtrim(pf.transfer_pct_override)),
		pf.freeze_yr
	from
		property_freeze as pf with(nolock)
	join
		exmpt_order as eo with(nolock)
	on
		pf.exmpt_type_cd = eo.exmpt_type_cd
	join
		exmpt_type as et with(nolock)
	on
		pf.exmpt_type_cd = et.exmpt_type_cd
	where
		pf.exmpt_tax_yr = @lYear
	and	pf.owner_tax_yr = @lYear
	and	pf.sup_num = @lSupNum
	order by
		pf.prop_id asc,
		pf.owner_id asc,
		pf.entity_id asc,
		pf.exmpt_type_cd asc
end

return(@@rowcount)

GO

