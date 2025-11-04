
create procedure dbo.nbhd_CostCalibSelectAnalisysProps 
	@detail_id int 
as

SELECT  
[run_id], 
[chg_of_owner_id], 
[prop_id], 
[is_outlier], 
[living_area], 
[land_total_val], 
[imprv_val], 
[sale_cont_imprv_val], 
[ind_nbhd_adj], 
[sale_psf], 
[land_to_sale_ratio], 
[appr_to_sale_ratio], 
[rev_imprv_val], 
[rev_appr_val], 
[rev_appr_psf], 
[rev_appr_to_sale_ratio], 

[sale_date], 
[sale_price], 
[latest_sale_date], 
[latest_sale_price]/*, 
[situs], 
[grade], 
[condition] */
FROM 
[nbhd_cost_calc_capture_props_vw]
WHERE
[profile_run_list_detail_id] = @detail_id

	 
return(@@rowcount)

set nocount off

GO

