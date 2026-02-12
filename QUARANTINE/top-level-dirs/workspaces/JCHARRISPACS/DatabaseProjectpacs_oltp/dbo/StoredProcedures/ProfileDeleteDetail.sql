


CREATE procedure ProfileDeleteDetail

@input_detail_id	int

as

/* get the run number for the detail_id */
declare @run_id		int
declare @code		varchar(10)
declare @temp_detail_id	int

select  @run_id = run_id,
	@code = code
from profile_run_list
where detail_id = @input_detail_id

delete from profile_class_stats where detail_id = @input_detail_id
delete from profile_sale_stats  where detail_id = @input_detail_id
delete from profile_sale_ct     where detail_id = @input_detail_id
delete from profile_prop_list   where detail_id = @input_detail_id
delete from profile_prop_list_sales   where detail_id = @input_detail_id
delete from profile_run_list where detail_id = @input_detail_id

delete from nbhd_cost_calc_capture where profile_run_list_detail_id = @input_detail_id
delete from nbhd_cost_calc_capture_props where profile_run_list_detail_id = @input_detail_id


-- now delete any linked profiles

declare detail_list scroll cursor
for  select detail_id
from profile_run_list 
where run_id = @run_id 
and linked_to = @code

open detail_list
fetch next from detail_list into @temp_detail_id

while (@@FETCH_STATUS = 0)
begin
	
	delete from profile_class_stats where run_id = @run_id and detail_id = @temp_detail_id
	delete from profile_sale_stats  where run_id = @run_id  and detail_id = @temp_detail_id
	delete from profile_sale_ct     where run_id = @run_id  and detail_id = @temp_detail_id
	delete from profile_prop_list   where run_id = @run_id  and detail_id = @temp_detail_id
	delete from profile_prop_list_sales   where run_id = @run_id  and detail_id = @temp_detail_id
	delete from profile_run_list    where run_id = @run_id and detail_id =@temp_detail_id

	delete from nbhd_cost_calc_capture where run_id = @run_id and profile_run_list_detail_id = @temp_detail_id
	delete from nbhd_cost_calc_capture_props where run_id = @run_id and profile_run_list_detail_id = @temp_detail_id

	fetch next from detail_list into @temp_detail_id
end

close detail_list
deallocate detail_list



/* check to see if there are anymore detail items for this run.. If not,
   then delete the options associated with the run */
if not exists (select * from profile_run_list where run_id = @run_id)
begin
	delete from profile_run_list_options where run_id = @run_id
end

GO

