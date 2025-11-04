



CREATE procedure UpdateSuppInfo

@input_sup_group int

as

delete from supp_roll_info
where sup_group_id = @input_sup_group

 delete from supp_roll_entity_info
where sup_group_id = @input_sup_group

insert supp_roll_info
(
sup_group_id,
prop_id,    
owner_id, 
sup_num,     
sup_yr, 
pct_ownership, 
sup_action, 
sup_cd, 
sup_reason,
curr_land_hs,     
curr_land_nhs,    
curr_imprv_hs,   
curr_imprv_nhs,   
curr_appr,        
curr_ag_use,      
curr_ag_mkt,      
curr_timb_mkt,    
curr_timb_use,    
legal_desc,                                                                                                                                                                                                                                                 
legal_acre,  
prev_sup_num,
prev_pct_ownership,
prev_land_hs,     
prev_land_nhs,    
prev_imprv_hs,    
prev_imprv_nhs,   
prev_appr,        
prev_ag_use,      
prev_ag_mkt,      
prev_timb_use,    
prev_timb_mkt,
curr_hs_cap,
prev_hs_cap,
curr_assessed,
prev_assessed
)
select 
@input_sup_group,
prop_id,    
owner_id, 
curr_sup_num,
prop_val_yr,      
IsNull(pct_ownership, 0),
curr_sup_action, 
curr_sup_cd, 
curr_sup_desc,
IsNull(curr_land_hs * pct_ownership/100,      0),
IsNull(curr_land_nhs * pct_ownership/100,     0),
IsNull(curr_imprv_hs * pct_ownership/100,    0),
IsNull(curr_imprv_nhs * pct_ownership/100,    0),
IsNull(curr_appr * pct_ownership/100,         0),
IsNull(curr_ag_use * pct_ownership/100,       0),
IsNull(curr_ag_mkt * pct_ownership/100,       0),
IsNull(curr_timb_mkt * pct_ownership/100,     0),
IsNull(curr_timb_use * pct_ownership/100,     0),
curr_legal_desc, 
curr_legal_acre,  
prev_sup_num,
IsNull(prev_pct_ownership, 0),
IsNull(prev_land_hs * prev_pct_ownership/100,      0),
IsNull(prev_land_nhs * prev_pct_ownership/100,     0),
IsNull(prev_imprv_hs * prev_pct_ownership/100,     0),
IsNull(prev_imprv_nhs * prev_pct_ownership/100,    0),
IsNull(prev_appr * prev_pct_ownership/100,         0),
IsNull(prev_ag_use * prev_pct_ownership/100,      0), 
IsNull(prev_ag_mkt * prev_pct_ownership/100,    0),   
IsNull(prev_timb_use * prev_pct_ownership/100,    0), 
IsNull(prev_timb_mkt * prev_pct_ownership/100, 0),
IsNull(curr_hs_cap,  0),
IsNull(prev_hs_cap, 0),
IsNull(curr_assessed * pct_ownership/100, 0),
IsNull(prev_assessed * prev_pct_ownership/100, 0)
from  supp_roll_info_vw
where sup_group_id = @input_sup_group

/* update set supp roll info values equal to 0 instead
   of null */
update supp_roll_info set curr_land_hs = 0
where  sup_group_id = @input_sup_group
and    curr_land_hs is null 
or       sup_action = 'D'

update supp_roll_info set curr_land_nhs = 0
where  sup_group_id = @input_sup_group
and    curr_land_nhs is null 
or       sup_action = 'D'

update supp_roll_info set curr_imprv_hs = 0
where  sup_group_id = @input_sup_group
and    curr_imprv_hs is null 
or       sup_action = 'D'

update supp_roll_info set curr_imprv_nhs = 0
where  sup_group_id = @input_sup_group
and    curr_imprv_nhs is null 
or       sup_action = 'D'
  
update supp_roll_info set curr_appr = 0
where  sup_group_id = @input_sup_group
and    curr_appr is null 
or       sup_action = 'D'
      
update supp_roll_info set curr_ag_use = 0
where  sup_group_id = @input_sup_group
and    curr_ag_use is null 
or       sup_action = 'D'
     
update supp_roll_info set curr_ag_mkt = 0
where  sup_group_id = @input_sup_group
and    curr_ag_mkt is null 
or       sup_action = 'D'
    
update supp_roll_info set curr_timb_mkt = 0
where  sup_group_id = @input_sup_group
and    curr_timb_mkt is null 
or       sup_action = 'D'
  
update supp_roll_info set curr_timb_use = 0
where  sup_group_id = @input_sup_group
and    curr_timb_use is null 
or       sup_action = 'D'
 
update supp_roll_info set prev_land_hs = 0
where  sup_group_id = @input_sup_group
and    prev_land_hs is null 

    
update supp_roll_info set prev_land_nhs = 0
where  sup_group_id = @input_sup_group
and    prev_land_nhs is null 
   
update supp_roll_info set prev_imprv_hs = 0 where  sup_group_id = @input_sup_group
and    prev_imprv_hs is null 
    
update supp_roll_info set prev_imprv_nhs = 0
where  sup_group_id = @input_sup_group
and    prev_imprv_nhs is null 
   
update supp_roll_info set prev_appr = 0
where  sup_group_id = @input_sup_group
and    prev_appr is null 
      
update supp_roll_info set prev_ag_use = 0
where  sup_group_id = @input_sup_group
and    prev_ag_use is null 
      
update supp_roll_info set prev_ag_mkt = 0
where  sup_group_id = @input_sup_group
and    prev_ag_mkt is null 
     
update supp_roll_info set prev_timb_use = 0
where  sup_group_id = @input_sup_group
and    prev_timb_use is null 
    
update supp_roll_info set prev_timb_mkt = 0
where  sup_group_id = @input_sup_group
and    prev_timb_mkt is null 

update supp_roll_info set curr_hs_cap = 0
where  sup_group_id = @input_sup_group
and    curr_hs_cap is null

update supp_roll_info set prev_hs_cap = 0
where  sup_group_id = @input_sup_group
and    prev_hs_cap is null

update supp_roll_info set prev_assessed = 0
where  sup_group_id = @input_sup_group
and    prev_assessed is null

update supp_roll_info set curr_assessed = 0
where  sup_group_id = @input_sup_group
and    curr_assessed is null
    

/* now we need to make adjustments for any previous owners that are not owners now */
insert supp_roll_info
(
sup_group_id,
prop_id,    
owner_id, 
sup_num,     
sup_yr, 
pct_ownership, 
sup_action, 
sup_cd,
sup_reason,
curr_land_hs,     
curr_land_nhs,    
curr_imprv_hs,   
curr_imprv_nhs,   
curr_appr,        
curr_ag_use,      
curr_ag_mkt,      
curr_timb_mkt,    
curr_timb_use,    
legal_desc,                                                                                                                                                                                                                                                 
legal_acre,  
prev_sup_num,
prev_pct_ownership,
prev_land_hs,     
prev_land_nhs,    
prev_imprv_hs,    
prev_imprv_nhs,   
prev_appr,        
prev_ag_use,      
prev_ag_mkt,      
prev_timb_use,    
prev_timb_mkt,
curr_hs_cap,
prev_hs_cap,
curr_assessed,
prev_assessed
)
select 
@input_sup_group,
property_val.prop_id,    
prev_owner.owner_id, 
property_val.sup_num,
property_val.prop_val_yr,      
0, 
property_val.sup_action, 
property_val.sup_cd,
property_val.sup_desc,
0,     
0,   
0,   
0,   
0,        
0,      
0,      
0,    
0,    
property_val.legal_desc,
property_val.legal_acreage,  
property_val.prev_sup_num,
IsNull(prev_owner.pct_ownership, 0) as prev_pct_ownership,
IsNull(prev_property_val.land_hstd_val * prev_owner.pct_ownership/100, 0),     
IsNull(prev_property_val.land_non_hstd_val * prev_owner.pct_ownership/100, 0),    
IsNull(prev_property_val.imprv_hstd_val * prev_owner.pct_ownership/100, 0),    
IsNull(prev_property_val.imprv_non_hstd_val * prev_owner.pct_ownership/100, 0),   
IsNull(prev_property_val.appraised_val * prev_owner.pct_ownership/100, 0),        
IsNull(prev_property_val.ag_use_val * prev_owner.pct_ownership/100, 0),      
IsNull(prev_property_val.ag_market * prev_owner.pct_ownership/100, 0),      
IsNull(prev_property_val.timber_use * prev_owner.pct_ownership/100, 0),    
IsNull(prev_property_val.timber_market * prev_owner.pct_ownership/100, 0),
0,
IsNull(prev_property_val.ten_percent_cap, 0),
0,
IsNull(prev_property_val.assessed_val * prev_owner.pct_ownership/100, 0)
from  supplement, property_val, property_val prev_property_val,  owner prev_owner
where supplement.sup_group_id   = @input_sup_group
and   property_val.sup_num      = supplement.sup_num
and   property_val.prop_val_yr  = supplement.sup_tax_yr
and   property_val.prop_id      = prev_owner.prop_id
and   property_val.prop_val_yr  = prev_owner.owner_tax_yr
and   property_val.prev_sup_num = prev_owner.sup_num
and   prev_owner.owner_id not in (select owner_id 
				  from   owner
				  where  owner.prop_id      = property_val.prop_id
				  and    owner.owner_tax_yr = property_val.prop_val_yr
				  and    owner.sup_num      = property_val.sup_num) 
and   property_val.prop_id      = prev_property_val.prop_id
and   property_val.prev_sup_num = prev_property_val.sup_num
and   property_val.prop_val_yr  = prev_property_val.prop_val_yr




/* set the current value information for the given property/owner/entity combonation */
insert into supp_roll_entity_info
(
sup_group_id, 
prop_id,    owner_id,    
entity_id,   
sup_num,     
sup_yr, 
curr_assessed,    
curr_taxable,     
curr_tax_amt,     
prev_assessed,    
prev_taxable,     
prev_tax_amt
)
select 
@input_sup_group,
prop_id,     
owner_id,    
entity_id,
sup_num,     
sup_yr,    
assessed_val, 
taxable_val, 
0, 
0, 
0, 
0
from supp_roll_entity_curr_val_vw 
where sup_group_id = @input_sup_group

/* set the tax amounts */
update supp_roll_entity_info
set curr_tax_amt = bill_adj_trans.curr_mno_tax + curr_ins_tax,
      prev_tax_amt = prev_mno_tax + prev_ins_tax
from bill_adj_trans
where supp_roll_entity_info.prop_id = bill_adj_trans.prop_id
and    supp_roll_entity_info.owner_id = bill_adj_trans.owner_id
and    supp_roll_entity_info.sup_num = bill_adj_trans.sup_num
and    supp_roll_entity_info.sup_yr = bill_adj_trans.sup_tax_yr
and    supp_roll_entity_info.entity_id = bill_adj_trans.entity_id
and    supp_roll_entity_info.sup_group_id = bill_adj_trans.sup_group_id
and    supp_roll_entity_info.sup_group_id = @input_sup_group

/* set the previous values for the entity */
update supp_roll_entity_info
set prev_assessed = supp_roll_entity_prev_val_vw.assessed_val,
    prev_taxable  = supp_roll_entity_prev_val_vw.taxable_val
from supp_roll_entity_prev_val_vw
where supp_roll_entity_info.sup_group_id = @input_sup_group
and   supp_roll_entity_info.sup_group_id = supp_roll_entity_prev_val_vw.sup_group_id
and   supp_roll_entity_info.prop_id	 = supp_roll_entity_prev_val_vw.prop_id
and   supp_roll_entity_info.owner_id     = supp_roll_entity_prev_val_vw.owner_id
and   supp_roll_entity_info.entity_id    = supp_roll_entity_prev_val_vw.entity_id
and   supp_roll_entity_info.sup_num      = supp_roll_entity_prev_val_vw.sup_num
and   supp_roll_entity_info.sup_yr       = supp_roll_entity_prev_val_vw.sup_yr
and   supp_roll_entity_prev_val_vw.prop_inactive_dt is null

update supp_roll_entity_info
set prev_assessed = 0,
    prev_taxable  = 0
from supp_roll_entity_prev_val_vw
where supp_roll_entity_info.sup_group_id = @input_sup_group
and   supp_roll_entity_info.sup_group_id = supp_roll_entity_prev_val_vw.sup_group_id
and   supp_roll_entity_info.prop_id	 = supp_roll_entity_prev_val_vw.prop_id
and   supp_roll_entity_info.owner_id     = supp_roll_entity_prev_val_vw.owner_id
and   supp_roll_entity_info.entity_id    = supp_roll_entity_prev_val_vw.entity_id
and   supp_roll_entity_info.sup_num      = supp_roll_entity_prev_val_vw.sup_num
and   supp_roll_entity_info.sup_yr       = supp_roll_entity_prev_val_vw.sup_yr
and   supp_roll_entity_prev_val_vw.prop_inactive_dt is not null

/* set information for previous owners */
insert supp_roll_entity_info
(
sup_group_id, 
prop_id,     
owner_id,    
entity_id,   
sup_num,     
sup_yr, 
curr_assessed,    
curr_taxable,     
curr_tax_amt,     
prev_assessed,    
prev_taxable,     
prev_tax_amt
)
    
select 
@input_sup_group,
supp_roll_info.prop_id,
supp_roll_info.owner_id,
prop_owner_entity_val.entity_id,
supp_roll_info.sup_num,
supp_roll_info.sup_yr,
0,
0,
0,
prop_owner_entity_val.assessed_val,
prop_owner_entity_val.taxable_val,
0
from supp_roll_info, prop_owner_entity_val
where supp_roll_info.owner_id not in (select owner_id 
				      from  owner
				      where owner.prop_id      = supp_roll_info.prop_id
				      and   owner.owner_id     = supp_roll_info.owner_id
				      and   owner.sup_num      = supp_roll_info.sup_num
				      and   owner.owner_tax_yr = supp_roll_info.sup_yr)
and supp_roll_info.sup_group_id = @input_sup_group
and supp_roll_info.prop_id      = prop_owner_entity_val.prop_id
and supp_roll_info.owner_id     = prop_owner_entity_val.owner_id
and supp_roll_info.prev_sup_num = prop_owner_entity_val.sup_num
and supp_roll_info.sup_yr       = prop_owner_entity_val.sup_yr

update supp_roll_entity_info set curr_assessed = 0
where  curr_assessed is null
and    sup_group_id = @input_sup_group
    
update supp_roll_entity_info set curr_taxable = 0
where  curr_taxable is null
and    sup_group_id = @input_sup_group
  
update supp_roll_entity_info set curr_tax_amt = 0     
where  curr_tax_amt is null
and    sup_group_id = @input_sup_group

update supp_roll_entity_info set prev_assessed = 0    
where  prev_assessed is null
and    sup_group_id = @input_sup_group

update supp_roll_entity_info set prev_taxable = 0     
where  prev_taxable is null
and    sup_group_id = @input_sup_group

update supp_roll_entity_info set prev_tax_amt = 0
where  prev_tax_amt is null
and    sup_group_id = @input_sup_group

/* if the entity_id is -1 then we will show info for all the entities, else we will only show properties that have the entity @input_entity_id */
/*
if (@input_entity_id <> -1)
begin
    	delete from supp_roll_entity_info 
              where entity_id <> @input_entity_id
	and pacs_user_id = @input_user_id
	and sup_group_id = @input_sup_group

	delete from supp_roll_info
	where sup_group_id = @input_sup_group
	and    pacs_user_id = @input_user_id
	and    prop_id not in (select prop_id 
                                               from supp_roll_entity_info 
 			       where sup_group_id = @input_sup_group and pacs_user_id = @input_user_id)
end
*/

GO

