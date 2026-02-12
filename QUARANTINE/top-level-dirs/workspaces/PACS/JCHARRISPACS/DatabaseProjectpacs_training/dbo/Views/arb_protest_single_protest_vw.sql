
create view dbo.arb_protest_single_protest_vw
as

	select  arbp.case_id, arbp.prop_id as prop_id, arbp.prop_val_yr as prop_val_yr,
		convert(int, appbcv.protest_by_count) as protest_by_count, aphd.docket_start_date_time,
		isnull(aphd.docket_start_date_time, '12/31/9999') as dateorder,
		arbp.prot_create_dt, arbp.prot_complete_dt
	  from	_arb_protest as arbp with (nolock)
left outer join	arb_protest_protest_by_count_vw as appbcv with(nolock) 
   	    on	appbcv.case_id = arbp.case_id 
  	   and	appbcv.prop_val_yr = arbp.prop_val_yr 
left outer join	_arb_protest_hearing_docket as aphd with(nolock) 
   	    on	aphd.docket_id = arbp.docket_id

GO

