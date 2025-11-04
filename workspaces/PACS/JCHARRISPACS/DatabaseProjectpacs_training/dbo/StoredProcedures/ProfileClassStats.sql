
create procedure ProfileClassStats

@input_run_id		int,
@input_detail_id	int

as

declare @class_cd	varchar(10)
declare @input_type	varchar(5)

set @input_type = ''

delete from profile_class_stats
where detail_id = @input_detail_id
and run_id = @input_run_id

declare class_profile  CURSOR FAST_FORWARD
for select distinct rtrim(isnull(pp.class_cd, ''))
from profile_prop_list as pp with(nolock)
where pp.detail_id = @input_detail_id
and pp.run_id = @input_run_id

open class_profile
fetch next from class_profile into @class_cd

while (@@FETCH_STATUS = 0)
begin
	/****************************/
	/* process class statistics */
	/****************************/
	declare @count	int		
	declare @low	numeric(18,5)	
	declare @high	numeric(18,5)	
	declare @avg	numeric(18,5)	
	declare @median	numeric(18,5)	
	declare @cod	numeric(18,5)	
	declare @cov	numeric(18,5)	
	declare @aad	numeric(18,5)	
	declare @stdev	numeric(18,5)	
	
	select (pp.market) as value into #stats_list
	from profile_prop_list as pp with(nolock)
	where pp.detail_id = @input_detail_id
	and   pp.run_id = @input_run_id
	and   rtrim(isnull(pp.class_cd,'')) = @class_cd

	
	exec GetStats    @input_type,
			@count	output, 
			@low	output, 
			@high	output, 
			@avg	output, 
			@median output, 
			@cod	output, 
			@cov	output,
			@aad	output,
			@stdev  output

	drop table #stats_list

	
	insert into profile_class_stats
	(
	run_id,
	detail_id,
	class_cd,
	num_props,
	max_mkt_value,
	mid_mkt_value,
	min_mkt_value,
	avg_mkt_value	
	)
	values
	(
	@input_run_id,
	@input_detail_id,
	@class_cd,
	@count,
	@high,
	@median,
	@low,
	@avg
	)
	
	fetch next from class_profile into @class_cd
end

close class_profile
deallocate class_profile

GO

