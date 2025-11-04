

create procedure MineralImportMergeExemption
	@pacs_user_id int,
	@run_id int
as

set nocount on


delete
	property_exemption 
from
	mineral_import_property as mip with (nolock)
where
	property_exemption.prop_id = mip.prop_id
and	property_exemption.owner_tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	property_special_entity_exemption 
from
	mineral_import_property as mip with (nolock)
where
	property_special_entity_exemption.prop_id = mip.prop_id 
and	property_special_entity_exemption.owner_tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


insert into property_exemption
(
	prop_id,     
	owner_id,    
	exmpt_tax_yr, 
	owner_tax_yr, 
	prop_type_cd, 
	exmpt_type_cd, 
	sup_num,     
	sp_value_type, 
	sp_value_option 
)
select distinct
	prop_id,
	owner_id,    
	exmpt_tax_yr, 
	owner_tax_yr, 
	prop_type_cd, 
	exmpt_type_cd, 
	sup_num,     
	sp_value_type, 
	sp_value_option 
from
	mineral_import_exemption as mie with (nolock)
where
	not exists
(
	select
		*
	from
		property_exemption as pe with (nolock)
	where
		pe.prop_id = mie.prop_id
	and	pe.owner_id = mie.owner_id
	and	pe.sup_num  = mie.sup_num
	and	pe.owner_tax_yr = mie.owner_tax_yr
	and	pe.exmpt_tax_yr = mie.exmpt_tax_yr
	and	pe.exmpt_type_cd = mie.exmpt_type_cd
)
and	mie.run_id = @run_id


insert into property_special_entity_exemption
(
	prop_id,     
	owner_id,    
	sup_num,     
	exmpt_tax_yr, 
	owner_tax_yr, 
	exmpt_type_cd, 
	entity_id,   
	sp_amt,           
	sp_pct,     
	sp_value_type, 
	sp_value_option 
)
select
	misee.prop_id,     
	misee.owner_id,    
	misee.sup_num,     
	misee.exmpt_tax_yr, 
	misee.owner_tax_yr, 
	misee.exmpt_type_cd, 
	misee.entity_id,   
	misee.sp_amt,           
	misee.sp_pct,
	mie.sp_value_type,
	mie.sp_value_option     
from
	mineral_import_special_entity_exemption as misee with (nolock)
inner join
	mineral_import_exemption as mie with (nolock)
on
	mie.run_id = misee.run_id
and	mie.prop_id = misee.prop_id
and	mie.owner_id = misee.owner_id
and	mie.exmpt_tax_yr = misee.exmpt_tax_yr
and	mie.owner_tax_yr = misee.owner_tax_yr
and	mie.sup_num = misee.sup_num
and	mie.exmpt_type_cd = misee.exmpt_type_cd
where
	misee.run_id = @run_id
and	misee.entity_id <> 0
and	not exists
(
	select
		*
	from
		property_special_entity_exemption as psee with (nolock)
	where
		psee.prop_id = misee.prop_id
	and	psee.owner_id = misee.owner_id
	and	psee.sup_num = misee.sup_num
	and	psee.owner_tax_yr = misee.owner_tax_yr
	and	psee.exmpt_tax_yr = misee.exmpt_tax_yr
	and	psee.exmpt_type_cd = misee.exmpt_type_cd
	and	psee.entity_id = misee.entity_id
)

GO

