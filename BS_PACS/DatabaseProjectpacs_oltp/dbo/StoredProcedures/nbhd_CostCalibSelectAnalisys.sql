
create procedure dbo.nbhd_CostCalibSelectAnalisys 
	@detail_id int 
as

SELECT  
 [run_id], 
[locked], 
[appraisal_year], 
[nbhd_name] ,
[hood_cd], 
[sample_size],
[population], 
[sample_size_pct], 
[prev_nbhd_adj], 
[avg_land_sale], 
[mean_ratio_begin], 
[weighted_mean_begin], 
[median_ratio_begin], 
[avg_sale_begin], 
[avg_sale_tla_begin], 
[related_diff_begin], 
[c_of_d_begin], 
[mean_ratio_updated], 
[weighted_mean_updated], 
[median_ratio_updated], 
[avg_sale_updated], 
[avg_sale_tla_updated], 
[related_diff_updated], 
[c_of_d_updated], 
[adjust_mean], 
[adjust_median], 
[adjust_used], 
[target_ratio]  
FROM [dbo].[nbhd_cost_calc_capture_vw]
WHERE [profile_run_list_detail_id]  = @detail_id
	 
return(@@rowcount)

set nocount off

GO

