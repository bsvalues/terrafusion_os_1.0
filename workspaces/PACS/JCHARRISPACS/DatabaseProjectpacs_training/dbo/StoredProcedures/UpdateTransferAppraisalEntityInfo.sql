


CREATE  procedure UpdateTransferAppraisalEntityInfo

@input_appr_yr		numeric(4),
@input_sup_num	int

WITH RECOMPILE

as

--Revision History
--1.0 Creation
--1.1 EricZ; 03/09/2004 - Added sum() to DV exemption amounts to cover the case where a property/owner has multiple DV exemptions

If (@input_sup_num <> 0)
begin
	declare @sup_count int
	
	select @sup_count = count(distinct sup_num) from transfer_appraisal_info_supp_assoc

	-- if count is greater than 1 then indicates they are running this as of a supplement, which means
	-- do not include deleted property
	if (@sup_count > 1)
	begin
		set @input_sup_num = 0
	end
end

if (@input_sup_num = 0)
begin
	insert into transfer_appraisal_entity_info
	(
	prop_id,     
	prop_val_yr, 
	sup_num,     
	owner_id,    
	entity_id,   
	entity_cd,  
	entity_name,    
	entity_prop_id,                                                        
	entity_pct,      
	assessed_val,     
	taxable_val,      
	ab_amt,           
	en_amt,           
	fr_amt,           
	ht_amt,           
	pro_amt,          
	pc_amt,           
	so_amt,           
	ex366_amt,
	hs_amt,           
	ov65_amt,         
	dp_amt ,          
	dv_amt ,          
	ex_amt ,
	market_value,	
	appraised_value,
	hs_cap,
	ag_late_loss,
	freeport_late_loss,
	hs_state_amt,
	hs_local_amt,
	ab_exempt,
	en_exempt,
	fr_exempt,
	ht_exempt,
	pro_exempt,
	pc_exempt,
	so_exempt,
	ex366_exempt,
	hs_exempt,
	ov65_exempt,
	dp_exempt,
	dv_exempt,
	ex_exempt,
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	ag_market_val,    
	tim_use_val,      
	tim_market_val,
	partial_entity
	)
	select                                     
	prop_id,     
	sup_yr, 
	sup_num,     
	owner_id,  
	tae.entity_id, 
	tae.entity_cd, 
	file_as_name,
	cast(entity_prop_id as varchar(20)),
	entity_prop_pct,       
	assessed_val,   
	taxable_val,  
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL, 
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	market_val,	
	appraised_val,
	ten_percent_cap,
	ag_late_loss,
	freeport_late_loss,
	0,
	0,
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	ag_market,    
	timber_use,      
	timber_market,
	'F'     
	from transfer_current_entity_vw with (nolock)
	inner join transfer_appraisal_entity as tae
	ON transfer_current_entity_vw.entity_id = tae.entity_id
	
	where sup_yr = @input_appr_yr	

	update transfer_appraisal_entity_info 
	set   ab_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'AB'
	
	update transfer_appraisal_entity_info 
	set   en_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EN'
	
	update transfer_appraisal_entity_info 
	set   fr_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'FR'
	
	update transfer_appraisal_entity_info 
	set   ht_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HT'
	
	update transfer_appraisal_entity_info 
	set   pro_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'PRO'
	
	update transfer_appraisal_entity_info 
	set   pc_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'PC'
	
	update transfer_appraisal_entity_info 
	set   so_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'SO'
	
	update transfer_appraisal_entity_info 
	set   ex366_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EX366'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'
	
	
	update transfer_appraisal_entity_info 
	set  ov65_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd like 'OV65%'
	
	
	update transfer_appraisal_entity_info 
	set  dp_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'DP'
	
	--1.1 Covers multiple DV exemptions; Modified by EricZ 03/09/2004
	--BEGIN NEW DV CODE

	/* OLD CODE
	update transfer_appraisal_entity_info 
	set  dv_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd like 'DV%'
	*/

	if object_id('tempdb..#tmp_pee_dv') is not null
	begin
		drop table #tmp_pee_dv
	end

	select pee.prop_id,
		pee.owner_id,
		pee.sup_num,
		pee.owner_tax_yr,
		pee.entity_id,
		sum(pee.local_amt + pee.state_amt) as dv_amt
	into #tmp_pee_dv
	from property_entity_exemption pee with (nolock),
		transfer_appraisal_entity_info taei with (nolock)
	where pee.prop_id = taei.prop_id
		and   pee.owner_id = taei.owner_id
		and   pee.sup_num = taei.sup_num
		and   pee.owner_tax_yr = taei.prop_val_yr
		and   pee.entity_id    = taei.entity_id
		and   pee.exmpt_type_cd like 'DV%'
	group by pee.prop_id,
		pee.owner_id,
		pee.sup_num,
		pee.owner_tax_yr,
		pee.entity_id
	
	update transfer_appraisal_entity_info 
	set  transfer_appraisal_entity_info.dv_amt = #tmp_pee_dv.dv_amt
	from  #tmp_pee_dv
	where #tmp_pee_dv.prop_id 	= transfer_appraisal_entity_info.prop_id
		and   #tmp_pee_dv.owner_id 	= transfer_appraisal_entity_info.owner_id
		and   #tmp_pee_dv.sup_num 	= transfer_appraisal_entity_info.sup_num
		and   #tmp_pee_dv.owner_tax_yr 	= transfer_appraisal_entity_info.prop_val_yr
		and   #tmp_pee_dv.entity_id    	= transfer_appraisal_entity_info.entity_id

	--END NEW DV CODE
	
	update transfer_appraisal_entity_info 
	set  ex_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EX'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_state_amt = (property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_local_amt = (property_entity_exemption.local_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'

end
else
begin
	/* we have to split this out because the supplemental export 
	   must include deleted properties, so whoever can properly handle it */
	insert into transfer_appraisal_entity_info
	(
	prop_id,     
	prop_val_yr, 
	sup_num,     
	owner_id,    
	entity_id,   
	entity_cd,  
	entity_name,    
	entity_prop_id,                                                        
	entity_pct,      
	assessed_val,     
	taxable_val,      
	ab_amt,           
	en_amt,           
	fr_amt,           
	ht_amt,           
	pro_amt,          
	pc_amt,           
	so_amt,           
	ex366_amt,
	hs_amt,           
	ov65_amt,         
	dp_amt ,          
	dv_amt ,          
	ex_amt ,
	market_value,	
	appraised_value,
	hs_cap,
	ag_late_loss,
	freeport_late_loss,
	hs_state_amt,
	hs_local_amt,
	ab_exempt,
	en_exempt,
	fr_exempt,
	ht_exempt,
	pro_exempt,
	pc_exempt,
	so_exempt,
	ex366_exempt,
	hs_exempt,
	ov65_exempt,
	dp_exempt,
	dv_exempt,
	ex_exempt,
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	ag_market_val,    
	tim_use_val,      
	tim_market_val, 
	partial_entity      
	)
	select                                     
	prop_id,     
	sup_yr, 
	sup_num,     
	owner_id,  
	tae.entity_id, 
	tae.entity_cd, 
	file_as_name,
	entity_prop_id,
	entity_prop_pct,       
	assessed_val,   
	taxable_val,  
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL, 
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	market_val,	
	appraised_val,
	ten_percent_cap,
	ag_late_loss,
	freeport_late_loss,
	0,
	0,
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	ag_market,    
	timber_use,      
	timber_market,
	'F'           
	from transfer_supp_current_entity_vw with (nolock)
	inner join transfer_appraisal_entity  as tae with (nolock)
	ON transfer_supp_current_entity_vw.entity_id = tae.entity_id
	
	where sup_yr = @input_appr_yr	
	and   ((sup_action <> 'D') or (sup_action is null)) --NEW
	--and   sup_action <> 'D' --OLD (INCORRECT - ERICZ 07/08/2003)
	
	update transfer_appraisal_entity_info 
	set   ab_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'AB'
	
	update transfer_appraisal_entity_info 
	set   en_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption  with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EN'
	
	update transfer_appraisal_entity_info 
	set   fr_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'FR'
	
	update transfer_appraisal_entity_info 
	set   ht_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HT'
	
	update transfer_appraisal_entity_info 
	set   pro_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'PRO'
	
	update transfer_appraisal_entity_info 
	set   pc_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'PC'
	
	update transfer_appraisal_entity_info 
	set   so_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'SO'
	
	update transfer_appraisal_entity_info 
	set   ex366_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EX366'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'
	
	
	update transfer_appraisal_entity_info 
	set  ov65_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd like 'OV65%'
	
	
	update transfer_appraisal_entity_info 
	set  dp_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'DP'
	
	--1.1 Covers multiple DV exemptions; Modified by EricZ 03/09/2004
	--BEGIN NEW DV CODE

	/* OLD CODE
	update transfer_appraisal_entity_info 
	set  dv_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd like 'DV%'
	*/

	if object_id('tempdb..#tmp_pee_dv2') is not null
	begin
		drop table #tmp_pee_dv2
	end

	select pee.prop_id,
		pee.owner_id,
		pee.sup_num,
		pee.owner_tax_yr,
		pee.entity_id,
		sum(pee.local_amt + pee.state_amt) as dv_amt
	into #tmp_pee_dv2
	from property_entity_exemption pee with (nolock),
		transfer_appraisal_entity_info taei with (nolock)
	where pee.prop_id = taei.prop_id
		and   pee.owner_id = taei.owner_id
		and   pee.sup_num = taei.sup_num
		and   pee.owner_tax_yr = taei.prop_val_yr
		and   pee.entity_id    = taei.entity_id
		and   pee.exmpt_type_cd like 'DV%'
	group by pee.prop_id,
		pee.owner_id,
		pee.sup_num,
		pee.owner_tax_yr,
		pee.entity_id
	
	update transfer_appraisal_entity_info 
	set  transfer_appraisal_entity_info.dv_amt = #tmp_pee_dv2.dv_amt
	from  #tmp_pee_dv2
	where #tmp_pee_dv2.prop_id 			= transfer_appraisal_entity_info.prop_id
		and   #tmp_pee_dv2.owner_id 		= transfer_appraisal_entity_info.owner_id
		and   #tmp_pee_dv2.sup_num 		= transfer_appraisal_entity_info.sup_num
		and   #tmp_pee_dv2.owner_tax_yr 	= transfer_appraisal_entity_info.prop_val_yr
		and   #tmp_pee_dv2.entity_id    	= transfer_appraisal_entity_info.entity_id

	--END NEW DV CODE
	
	update transfer_appraisal_entity_info 
	set  ex_amt = (property_entity_exemption.local_amt + property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'EX'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_state_amt = (property_entity_exemption.state_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'
	
	
	
	update transfer_appraisal_entity_info 
	set  hs_local_amt = (property_entity_exemption.local_amt)
	from  property_entity_exemption with (nolock)
	where property_entity_exemption.prop_id = transfer_appraisal_entity_info.prop_id
	and   property_entity_exemption.owner_id = transfer_appraisal_entity_info.owner_id
	and   property_entity_exemption.sup_num = transfer_appraisal_entity_info.sup_num
	and   property_entity_exemption.owner_tax_yr = transfer_appraisal_entity_info.prop_val_yr
	and   property_entity_exemption.entity_id    = transfer_appraisal_entity_info.entity_id
	and   property_entity_exemption.exmpt_type_cd = 'HS'


	/* now include a "0" value entry for the deleted accounts */
	insert into transfer_appraisal_entity_info
	(
	prop_id,     
	prop_val_yr, 
	sup_num,     
	owner_id,    
	entity_id,   
	entity_cd,  
	entity_name,    
	entity_prop_id,                                                        
	entity_pct,      
	assessed_val,     
	taxable_val,      
	ab_amt,           
	en_amt,           
	fr_amt,           
	ht_amt,           
	pro_amt,          
	pc_amt,           
	so_amt,           
	ex366_amt,
	hs_amt,           
	ov65_amt,         
	dp_amt ,          
	dv_amt ,          
	ex_amt ,
	market_value,	
	appraised_value,
	hs_cap,
	ag_late_loss,
	freeport_late_loss,
	hs_state_amt,
	hs_local_amt,
	ab_exempt,
	en_exempt,
	fr_exempt,
	ht_exempt,
	pro_exempt,
	pc_exempt,
	so_exempt,
	ex366_exempt,
	hs_exempt,
	ov65_exempt,
	dp_exempt,
	dv_exempt,
	ex_exempt,
	land_hstd_val,    
	land_non_hstd_val, 
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	ag_use_val,       
	ag_market_val,    
	tim_use_val,      
	tim_market_val,
	partial_entity	         
	)
	select                                     
	prop_id,     
	sup_yr, 
	sup_num,     
	owner_id,  
	tae.entity_id, 
	tae.entity_cd, 
	file_as_name,
	entity_prop_id,
	entity_prop_pct,       
	0,   
	0,  
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL, 
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	0,	
	0,
	0,
	0,
	0,
	0,
	0,
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	'F',
	0,    
	0, 
	0,   
	0, 
	0,       
	0,    
	0,      
	0,
	'F'           
	from transfer_supp_current_entity_vw with (nolock)
	inner join transfer_appraisal_entity  as tae with (nolock)
	ON transfer_supp_current_entity_vw.entity_id = tae.entity_id
	where sup_yr = @input_appr_yr	
	and   sup_action = 'D'end

	



update transfer_appraisal_entity_info 
set   	ab_exempt 	= case when ab_amt is not null    then 'T' else 'F' end,
   	en_exempt 	= case when en_amt is not null    then 'T' else 'F' end,
   	fr_exempt 	= case when fr_amt is not null    then 'T' else 'F' end,
   	ht_exempt 	= case when ht_amt is not null    then 'T' else 'F' end,
   	pro_exempt 	= case when pro_amt is not null   then 'T' else 'F' end,
   	pc_exempt 	= case when pc_amt is not null    then 'T' else 'F' end,
   	so_exempt 	= case when so_amt is not null    then 'T' else 'F' end,
   	ex366_exempt 	= case when ex366_amt is not null then 'T' else 'F' end,
   	hs_exempt 	= case when hs_amt is not null    then 'T' else 'F' end,
   	ov65_exempt 	= case when ov65_amt is not null  then 'T' else 'F' end,
   	dp_exempt 	= case when dp_amt is not null    then 'T' else 'F' end,
   	dv_exempt 	= case when dv_amt is not null    then 'T' else 'F' end,
   	ex_exempt 	= case when ex_amt is not null    then 'T' else 'F' end


update transfer_appraisal_entity_info 
set   	ab_amt    = IsNull(ab_amt, 0),
   	en_amt    = IsNull(en_amt, 0),
   	fr_amt    = IsNull(fr_amt, 0),
   	ht_amt    = IsNull(ht_amt, 0),
   	pro_amt   = IsNull(pro_amt, 0),
   	pc_amt    = IsNull(pc_amt, 0),
   	so_amt    = IsNull(so_amt, 0),
   	ex366_amt = IsNull(ex366_amt, 0),
   	hs_amt    = IsNull(hs_amt, 0),
   	ov65_amt  = IsNull(ov65_amt, 0),
   	dp_amt    = IsNull(dp_amt, 0),
   	dv_amt    = IsNull(dv_amt, 0),
   	ex_amt    = IsNull(ex_amt, 0)

GO

