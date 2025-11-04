

CREATE  PROCEDURE UpdateTransferAppraisalInfoTotals

as

declare @sup_count int

select @sup_count = count(distinct sup_num) from transfer_appraisal_info_supp_assoc

-- if count is greater than 1 then indicates they are running this as of a supplement, which means
-- do not include deleted property

if @sup_count > 1
begin
	insert into transfer_appraisal_info_totals
	(
	entity_id,   
	entity_cd,                                                            
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	tim_use_val,     
	ag_market_val,   
	tim_market_val,  
	taxable_val,      
	mineral_val,      
	personal_val,     
	auto_val,         
	real_mobile_val,  
	num_real_mobile, 
	num_personal, 
	num_mineral, 
	num_auto,    
	num_records, 
	market_value,     
	hs_cap_count, 
	hs_cap,           
	hs_count,    
	hs_local_amt,     
	hs_state_amt,     
	ov65_count,  
	ov65_amt,         
	dp_count,    
	dp_amt,           
	dv_count,    
	dv_amt,           
	ab_count,    
	ab_amt,           
	fr_count,    
	fr_amt,           
	pc_count,    
	pc_amt,           
	ex366_count, 
	ex366_amt,        
	ht_count,    
	ht_amt,           
	so_count,    
	so_amt,           
	ex_count,    
	ex_amt,           
	ag_late_count, 
	ag_late_loss,     
	freeport_late_count, 
	freeport_late_loss 
	)
	select entity_id,
	       entity_cd,
		sum(taei.land_hstd_val),    
		sum(taei.land_non_hstd_val), 
		sum(taei.imprv_hstd_val),   
		sum(taei.imprv_non_hstd_val), 
		sum(taei.ag_use_val),       
		sum(taei.tim_use_val),      
		sum(taei.ag_market_val),    
		sum(taei.tim_market_val),  
		sum(taei.taxable_val),
		sum(case when tai.prop_type_cd = 'MN' then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'P'  then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'A'  then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'R' or tai.prop_type_cd = 'MH' then taei.market_value else 0 end),
		sum(case when tai.prop_type_cd = 'R' or tai.prop_type_cd = 'MH' then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'P'  then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'MN' then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'A'  then 1 else 0 end),
		sum(1),
		sum(taei.market_value),
		sum(case when taei.hs_cap > 0 then 1 else 0 end),
		sum(taei.hs_cap),
		sum(case when taei.hs_exempt = 'T' then 1 else 0 end),
		sum(taei.hs_local_amt),
		sum(taei.hs_state_amt),
		sum(case when taei.ov65_exempt = 'T' then 1 else 0 end),
		sum(taei.ov65_amt),
		sum(case when taei.dp_exempt = 'T' then 1 else 0 end),
		sum(taei.dp_amt),
		sum(case when taei.dv_exempt = 'T' then 1 else 0 end),
		sum(taei.dv_amt),
		sum(case when taei.ab_exempt = 'T' then 1 else 0 end),
		sum(taei.ab_amt),
		sum(case when taei.fr_exempt = 'T' then 1 else 0 end),
		sum(taei.fr_amt),
		sum(case when taei.pc_exempt = 'T' then 1 else 0 end),
		sum(taei.pc_amt),
		sum(case when taei.ex366_exempt = 'T' then 1 else 0 end),
		sum(taei.ex366_amt),
		sum(case when taei.ht_exempt = 'T' then 1 else 0 end),
		sum(taei.ht_amt),
		sum(case when taei.so_exempt = 'T' then 1 else 0 end),
		sum(taei.so_amt),
		sum(case when taei.ex_exempt = 'T' then 1 else 0 end),
		sum(taei.ex_amt),
		sum(case when taei.ag_late_loss > 0 then 1 else 0 end),
		sum(taei.ag_late_loss),
		sum(case when taei.freeport_late_loss > 0 then 1 else 0 end),
		sum(taei.freeport_late_loss)
		
		 
		 
	from transfer_appraisal_entity_info taei 
	with (nolock)
	inner join transfer_appraisal_info tai 
	with (nolock)
	on 	taei.prop_id = tai.prop_id
	and   taei.owner_id = tai.owner_id
	and   taei.sup_num  = tai.sup_num
	and   taei.prop_val_yr = tai.prop_val_yr
	inner join property_val as pv
	with (nolock)
	on tai.prop_id = pv.prop_id
	and tai.prop_val_yr = pv.prop_val_yr
	and tai.sup_num = pv.sup_num
	and pv.prop_inactive_dt IS NULL
	group by entity_id,
	       entity_cd
end
else
begin
	insert into transfer_appraisal_info_totals
	(
	entity_id,   
	entity_cd,                                                            
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	tim_use_val,     
	ag_market_val,   
	tim_market_val,  
	taxable_val,      
	mineral_val,      
	personal_val,     
	auto_val,         
	real_mobile_val,  
	num_real_mobile, 
	num_personal, 
	num_mineral, 
	num_auto,    
	num_records, 
	market_value,     
	hs_cap_count, 
	hs_cap,           
	hs_count,    
	hs_local_amt,     
	hs_state_amt,     
	ov65_count,  
	ov65_amt,         
	dp_count,    
	dp_amt,           
	dv_count,    
	dv_amt,           
	ab_count,    
	ab_amt,           
	fr_count,    
	fr_amt,           
	pc_count,    
	pc_amt,           
	ex366_count, 
	ex366_amt,        
	ht_count,    
	ht_amt,           
	so_count,    
	so_amt,           
	ex_count,    
	ex_amt,           
	ag_late_count, 
	ag_late_loss,     
	freeport_late_count, 
	freeport_late_loss 
	)
	select entity_id,
	       entity_cd,
		sum(taei.land_hstd_val),    
		sum(taei.land_non_hstd_val), 
		sum(taei.imprv_hstd_val),   
		sum(taei.imprv_non_hstd_val), 
		sum(taei.ag_use_val),       
		sum(taei.tim_use_val),      
		sum(taei.ag_market_val),    
		sum(taei.tim_market_val),  
		sum(taei.taxable_val),
		sum(case when tai.prop_type_cd = 'MN' then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'P'  then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'A'  then taei.market_value else 0 end), 
		sum(case when tai.prop_type_cd = 'R' or tai.prop_type_cd = 'MH' then taei.market_value else 0 end),
		sum(case when tai.prop_type_cd = 'R' or tai.prop_type_cd = 'MH' then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'P'  then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'MN' then 1 else 0 end),
		sum(case when tai.prop_type_cd = 'A'  then 1 else 0 end),
		sum(1),
		sum(taei.market_value),
		sum(case when taei.hs_cap > 0 then 1 else 0 end),
		sum(taei.hs_cap),
		sum(case when taei.hs_exempt = 'T' then 1 else 0 end),
		sum(taei.hs_local_amt),
		sum(taei.hs_state_amt),
		sum(case when taei.ov65_exempt = 'T' then 1 else 0 end),
		sum(taei.ov65_amt),
		sum(case when taei.dp_exempt = 'T' then 1 else 0 end),
		sum(taei.dp_amt),
		sum(case when taei.dv_exempt = 'T' then 1 else 0 end),
		sum(taei.dv_amt),
		sum(case when taei.ab_exempt = 'T' then 1 else 0 end),
		sum(taei.ab_amt),
		sum(case when taei.fr_exempt = 'T' then 1 else 0 end),
		sum(taei.fr_amt),
		sum(case when taei.pc_exempt = 'T' then 1 else 0 end),
		sum(taei.pc_amt),
		sum(case when taei.ex366_exempt = 'T' then 1 else 0 end),
		sum(taei.ex366_amt),
		sum(case when taei.ht_exempt = 'T' then 1 else 0 end),
		sum(taei.ht_amt),
		sum(case when taei.so_exempt = 'T' then 1 else 0 end),
		sum(taei.so_amt),
		sum(case when taei.ex_exempt = 'T' then 1 else 0 end),
		sum(taei.ex_amt),
		sum(case when taei.ag_late_loss > 0 then 1 else 0 end),
		sum(taei.ag_late_loss),
		sum(case when taei.freeport_late_loss > 0 then 1 else 0 end),
		sum(taei.freeport_late_loss)
		
		 
		 
	from transfer_appraisal_entity_info taei with (nolock),
	     transfer_appraisal_info tai with (nolock)
	where taei.prop_id = tai.prop_id
	and   taei.owner_id = tai.owner_id
	and   taei.sup_num  = tai.sup_num
	and   taei.prop_val_yr = tai.prop_val_yr
	group by entity_id,
	       entity_cd
end


update transfer_appraisal_entity_info
set entity_name = file_as_name
from account with (nolock)
where transfer_appraisal_entity_info.entity_id = account.acct_id

update transfer_appraisal_info_totals
set entity_name = file_as_name
from account with (nolock)
where transfer_appraisal_info_totals.entity_id = account.acct_id

GO

