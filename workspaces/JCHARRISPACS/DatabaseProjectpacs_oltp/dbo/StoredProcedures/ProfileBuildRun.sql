
CREATE procedure ProfileBuildRun

@input_pacs_user_id	int,
@input_type		char(5),
@input_desc		varchar(100),
@input_run_id		int,
@input_yr		numeric(4),
@input_hood_cd		varchar(10),
@input_region		varchar(10),
@input_subset		varchar(10),
@input_abs_subdv_cd	varchar(10),
@input_query		varchar(4096),
@default_run		char(1) = 'F',
@input_build_query	varchar(4096) = '',
@input_linked_to	varchar(10) = ''

as

/*
Version History
1.0 Creation
1.1 EricZ 04/14/2004; Added 'with (nolock)' hints for insert to avoid deadlocks.
1.2 SamS 2/2/2006 - now this procedure just creates the header and calls
					ProfileRecalcDetail to actually create the profile.  That way,
					PACS can call ProfileRecalcDetail directly to update an existing
					profile.
*/
										
insert into profile_run_list
(   
pacs_user_id,
run_type, 
run_desc,   
run_id,                  
prop_val_yr, 
hood_cd,    
region,     
subset,     
abs_subdv_cd, 
query,
default_run,
build_query,
linked_to
)
values
(
@input_pacs_user_id,
@input_type,
@input_desc,
@input_run_id,
@input_yr,
@input_hood_cd,
@input_region,
@input_subset,
@input_abs_subdv_cd,
@input_query,
@default_run,
@input_build_query,
@input_linked_to
)     


declare @detail_id	int
select @detail_id = @@identity                                                                                        

exec ProfileRecalcDetail @detail_id

GO

