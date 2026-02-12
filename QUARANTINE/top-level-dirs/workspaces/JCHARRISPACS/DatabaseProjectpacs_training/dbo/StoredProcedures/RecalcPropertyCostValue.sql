
CREATE procedure RecalcPropertyCostValue     

@prop_id			int, 
@sup_yr				numeric(4), 
@sup_num			int, 
@rounding_factor		numeric(1),
@input_land_apply_mass_factor	char(1),
@input_imprv_apply_mass_factor	char(1),
@cost_imprv_hstd_val		numeric(14) output,
@cost_imprv_non_hstd_val	numeric(14) output,
@cost_land_hstd_val		numeric(14) output,
@cost_land_non_hstd_val		numeric(14) output,
@cost_ag_use_val		numeric(14) output,
@cost_ag_market			numeric(14) output,
@cost_ag_loss			numeric(14) output,
@cost_timber_use		numeric(14) output,
@cost_timber_market		numeric(14) output,
@cost_timber_loss		numeric(14) output,
@cost_late_ag_loss		numeric(14) output,
@output_imprv_new_val_hs	numeric(14) output,
@output_imprv_new_val_nhs	numeric(14) output

as

exec RecalcLandValue 
@prop_id,
@sup_yr,
@sup_num,
0,    	
@rounding_factor,
@input_land_apply_mass_factor,
@cost_land_hstd_val	output,     	
@cost_land_non_hstd_val	output,	 	
@cost_ag_use_val	output,        	
@cost_ag_market		output,         	
@cost_ag_loss		output,           	
@cost_timber_use	output,        	
@cost_timber_market	output,     	
@cost_timber_loss     	output,
@cost_late_ag_loss	output

exec RecalcImpValue
@prop_id,
@sup_yr,
@sup_num,
0,    	
@rounding_factor,
@input_imprv_apply_mass_factor,
@cost_imprv_hstd_val		output,
@cost_imprv_non_hstd_val 	output,
@output_imprv_new_val_hs	output,
@output_imprv_new_val_nhs	output

GO

