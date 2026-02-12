



CREATE  procedure ProfileSetDefaultRun

@input_run_id		int

as 

declare @detail_id	int

DECLARE profile_run CURSOR FAST_FORWARD
FOR select detail_id
    from profile_run_list
    where run_id = @input_run_id


open profile_run
fetch next from profile_run into @detail_id

while (@@FETCH_STATUS = 0)
begin
	
	declare @prop_val_yr	numeric(4)
	declare @hood_cd	varchar(10)
	declare @region		varchar(10)
	declare @subset		varchar(10)
	declare @abs_subdv_cd	varchar(10)
	declare @run_type	varchar(5)
	
	select  @prop_val_yr  = prop_val_yr,
		@hood_cd      = hood_cd,    
		@region       = region,     
		@subset       = subset,     
		@abs_subdv_cd = abs_subdv_cd,
		@run_type     = run_type
	from profile_run_list
	where detail_id = @detail_id
	and   run_id    = @input_run_id
	
	if (@run_type = 'N' or 
 	    @run_type = 'QN') and (@hood_cd <> '')
	begin
		update profile_run_list
		set default_run = 'F'
		where prop_val_yr = @prop_val_yr
		and   hood_cd = (@hood_cd)
	end
	else if (@run_type = 'AS') and (@abs_subdv_cd <> '')
	begin
		update profile_run_list
		set default_run = 'F'
		where prop_val_yr = @prop_val_yr
		and   abs_subdv_cd = (@abs_subdv_cd)
	end
	else if (@run_type = 'R') and (@region <> '')
	begin
		update profile_run_list
		set default_run = 'F'
		where prop_val_yr = @prop_val_yr
		and   region = rtrim(@region)
	end
	else if (@run_type = 'S') and (@subset <> '')
	begin
		update profile_run_list
		set default_run = 'F'
		where prop_val_yr = @prop_val_yr
		and   subset = rtrim(@subset)
	end
	
	update profile_run_list
	set default_run = 'T'
	where detail_id = @detail_id
	and   run_id    = @input_run_id

	
	fetch next from profile_run into @detail_id
end

close profile_run
deallocate profile_run

GO

