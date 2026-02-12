
CREATE view prop_taxable_vw

as

select

prop_id, 
owner_id, 
sup_num, 
poev.entity_id, 
sup_yr,
entity_cd,

poev.assessed_val as assessed_val,

dbo.fn_GetTaxableExemptions(poev.prop_id, poev.owner_id, poev.entity_id, poev.sup_yr, poev.sup_num) as exemptions , 

IsNUll(  (select sum(local_amt) from property_entity_exemption pee
					     where pee.prop_id = poev.prop_id
					     and   pee.owner_id = poev.owner_id
					     and   pee.sup_num  = poev.sup_num
					     and   pee.entity_id = poev.entity_id
					     and   pee.owner_tax_yr = poev.sup_yr),0) as local_amt,
IsNull((select sum(state_amt) from property_entity_exemption pee
					     where pee.prop_id = poev.prop_id
					     and   pee.owner_id = poev.owner_id
					     and   pee.sup_num  = poev.sup_num
					     and   pee.entity_id = poev.entity_id
					     and   pee.owner_tax_yr = poev.sup_yr),0) as state_amt,
poev.taxable_Val as taxable_Val,
dbo.fn_GetCalculatedTax ( poev.prop_id, poev.owner_id, poev.entity_id, poev.sup_yr, poev.sup_num ) as tax,

freeze_type,
freeze_ceiling,
freeze_yr
From prop_owner_entity_val poev, 
     entity
where poev.entity_id = entity.entity_id

GO

