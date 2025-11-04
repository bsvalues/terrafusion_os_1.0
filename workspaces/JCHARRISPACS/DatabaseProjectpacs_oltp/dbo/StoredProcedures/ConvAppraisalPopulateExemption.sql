







CREATE PROCEDURE ConvAppraisalPopulateExemption

as

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
select prop_id,     
	owner_id,    
	exmpt_tax_yr, 
	owner_tax_yr, 
	prop_type_cd, 
	exmpt_type_cd, 
	sup_num,     
	sp_value_type, 
	sp_value_option 
from collections_exemption_cv
where not exists (select * from property_exemption as p1 
		  where p1.prop_id 	 = collections_exemption_cv.prop_id
		  and   p1.owner_id 	 = collections_exemption_cv.owner_id
		  and   p1.sup_num  	 = collections_exemption_cv.sup_num
		  and   p1.owner_tax_yr  = collections_exemption_cv.owner_tax_yr
		  and   p1.exmpt_tax_yr  = collections_exemption_cv.exmpt_tax_yr
		  and   p1.exmpt_type_cd = collections_exemption_cv.exmpt_type_cd)


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
sp_pct       
)
select 	prop_id,     
	owner_id,    
	sup_num,     
	exmpt_tax_yr, 
	owner_tax_yr, 
	exmpt_type_cd, 
	entity_id,   
	sp_amt,           
	sp_pct     
from collections_sp_ent_ex_cv
where not exists (select * from property_special_entity_exemption as p1 
		  where p1.prop_id       = collections_sp_ent_ex_cv.prop_id
		  and   p1.owner_id      = collections_sp_ent_ex_cv.owner_id
		  and   p1.sup_num       = collections_sp_ent_ex_cv.sup_num
		  and   p1.owner_tax_yr  = collections_sp_ent_ex_cv.owner_tax_yr
		  and   p1.exmpt_tax_yr  = collections_sp_ent_ex_cv.exmpt_tax_yr
		  and   p1.exmpt_type_cd = collections_sp_ent_ex_cv.exmpt_type_cd
		  and   p1.entity_id     = collections_sp_ent_ex_cv.entity_id)

GO

