



CREATE procedure ProfileDeleteRun

@input_run_id	int

as

delete from profile_class_stats where run_id = @input_run_id
delete from profile_sale_stats  where run_id = @input_run_id
delete from profile_sale_ct     where run_id = @input_run_id
delete from profile_prop_list   where run_id = @input_run_id
delete from profile_run_list 	where run_id = @input_run_id
delete from profile_run_list_options where run_id = @input_run_id

delete from nbhd_cost_calc_capture where run_id = @input_run_id
delete from nbhd_cost_calc_capture_props where run_id = @input_run_id

GO

