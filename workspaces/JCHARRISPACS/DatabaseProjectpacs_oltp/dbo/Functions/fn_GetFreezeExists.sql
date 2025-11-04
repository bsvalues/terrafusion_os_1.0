
create function fn_GetFreezeExists (@input_prop_id int, @input_year numeric(4,0), @input_sup_num int, @input_owner_id int)
returns bit
as
begin

	declare @freeze_count int


	select
		@freeze_count = count(*)
	from
		owner as o with (nolock)
	inner join
		property_val as pv with (nolock)
	on
		pv.prop_id = o.prop_id
	and	pv.prop_val_yr = o.owner_tax_yr
	and	pv.sup_num = o.sup_num
	inner join
		property_exemption as pe with (nolock)
	on
		pe.prop_id = o.prop_id
	and	pe.owner_id = o.owner_id
	and	pe.owner_tax_yr = o.owner_tax_yr
	and	pe.exmpt_tax_yr = o.owner_tax_yr
	and	pe.sup_num = o.sup_num
	inner join
		entity_prop_assoc as epa with (nolock)
	on
		epa.prop_id = pe.prop_id
	and	epa.tax_yr = pe.owner_tax_yr
	and	epa.tax_yr = pe.exmpt_tax_yr
	and	epa.sup_num = pe.sup_num
	inner join
		entity_exmpt as ee with (nolock)
	on
		ee.entity_id = epa.entity_id
	and	ltrim(rtrim(ee.exmpt_type_cd)) = ltrim(rtrim(pe.exmpt_type_cd))
	and	ee.exmpt_tax_yr = epa.tax_yr
	and	ee.freeze_flag = 1
	inner join
		property_freeze as pf with (nolock)
	on
		pf.prop_id = pe.prop_id
	and	pf.owner_id = pe.owner_id
	and	pf.entity_id = epa.entity_id
	and	pf.owner_tax_yr = pe.owner_tax_yr
	and	pf.exmpt_tax_yr = pe.exmpt_tax_yr
	and	pf.sup_num = pe.sup_num
	and	ltrim(rtrim(pf.exmpt_type_cd)) = ltrim(rtrim(pe.exmpt_type_cd))
	and	pf.use_freeze = 'T'
	and	pf.freeze_ceiling >= 0.0
	and	pf.freeze_yr > 0
	where
		o.owner_id = @input_owner_id
	and	o.prop_id = @input_prop_id
	and	o.owner_tax_yr = @input_year
	and	o.sup_num = @input_sup_num


	declare @freeze_exists bit

	if (@freeze_count > 0)
		set @freeze_exists = 1
	else
		set @freeze_exists = 0


	return @freeze_exists
end

GO

