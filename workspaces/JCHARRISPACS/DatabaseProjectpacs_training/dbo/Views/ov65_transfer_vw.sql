
create view ov65_transfer_vw
as
select
	pf.prop_id,
	pf.owner_id,
	pf.exmpt_tax_yr,
	pe.prop_type_cd, 
	pf.exmpt_type_cd,
	pf.prev_tax_due,
	pf.prev_tax_nofrz, 
	pf.transfer_pct,
	pf.transfer_pct_override,
	e.entity_cd,
	e.entity_type_cd, 
	poev.taxable_val,
	pv.legal_desc,
	a.file_as_name,
	a.confidential_file_as_name,
	p.geo_id, 
        pf.sup_num,
	poev.frz_taxable_val,
	poev.frz_actual_tax, 
        poev.frz_tax_rate,
	sa.system_type,
	sa.addr_line2,
	sa.addr_line3, 
        sa.city,
	sa.state,
	sa.zip,
	sa.cad_id_code,
	sa.phone_num, 
        sa.phone_num2,
	sa.fax_num,
	sa.chief_appraiser,
	sa.county_name, 
        sa.office_name,
	sa.url
from
	prop_owner_entity_val as poev with (nolock)
inner join
	entity as e with (nolock)
on
	poev.entity_id = e.entity_id
inner join
	property_exemption as pe with (nolock)
on
	poev.prop_id = pe.prop_id
and	poev.owner_id = pe.owner_id
and	poev.sup_num = pe.sup_num
and	poev.sup_yr = pe.owner_tax_yr
inner join
	property_freeze as pf with (nolock)
on
	pe.prop_id = pf.prop_id
and	pe.owner_id = pf.owner_id
and	poev.entity_id = pf.entity_id
and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
and	pe.owner_tax_yr = pf.owner_tax_yr
and	pe.sup_num = pf.sup_num
and	pe.exmpt_type_cd = pf.exmpt_type_cd
inner join
	account as a with (nolock)
on
	pe.owner_id = a.acct_id
inner join
	property_val as pv with (nolock)
on
	pe.prop_id = pv.prop_id
and	pe.owner_tax_yr = pv.prop_val_yr
and	pe.sup_num = pv.sup_num
inner join
	property as p with (nolock)
on
	pv.prop_id = p.prop_id
cross join
	system_address as sa
where
	pe.exmpt_type_cd in ('OV65', 'OV65S')
and	sa.system_type = 'A'

GO

