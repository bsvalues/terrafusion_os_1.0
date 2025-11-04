



CREATE  procedure ProfileSetDefault 

@input_run_id		int,
@input_detail_id	int

as 

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
where detail_id = @input_detail_id
and   run_id    = @input_run_id

if (@run_type = 'N' or
    @run_type = 'QN')
begin
	update profile_run_list
	set default_run = 'F'
	where prop_val_yr = @prop_val_yr
	and   hood_cd = @hood_cd
end
else if (@run_type = 'AS')
begin
	update profile_run_list
	set default_run = 'F'
	where prop_val_yr = @prop_val_yr
	and   abs_subdv_cd = @abs_subdv_cd
end
else if (@run_type = 'R')
begin
	update profile_run_list
	set default_run = 'F'
	where prop_val_yr = @prop_val_yr
	and   region = @region
end
else if (@run_type = 'S')
begin
	update profile_run_list
	set default_run = 'F'
	where prop_val_yr = @prop_val_yr
	and   subset = @subset
end

update profile_run_list
set default_run = 'T'
where detail_id = @input_detail_id
and   run_id    = @input_run_id

GO

