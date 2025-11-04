








CREATE PROCEDURE GetPPSchedQualityDensity
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @input_quality_cd	char(5),
 @input_density_cd	char(5),
 @unit_price		numeric(14,2) output
AS

declare @qd_unit_price 		numeric(14,2)
declare @qd_percent		numeric(5,2)
declare @pure_match_found	char(1)
declare @quality_found		char(1)
declare @density_found		char(1)

select @pure_match_found 	= 'F'
select @quality_found		= 'F'
select @density_found		= 'F'

--First we are going to look for a pure match on the quality/density combination.
IF EXISTS (select pp_schedule_quality_density.quality_cd, pp_schedule_quality_density.density_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.quality_cd 	= @input_quality_cd
						and   	pp_schedule_quality_density.density_cd 	= @input_density_cd)
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.quality_cd 	= @input_quality_cd
	and   	pp_schedule_quality_density.density_cd 	= @input_density_cd

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end

	select @pure_match_found = 'T'
end


--Then we will search for a match on the quality code...
if (@pure_match_found <> 'T')
begin
IF EXISTS (select pp_schedule_quality_density.quality_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.quality_cd 	= @input_quality_cd
						and	pp_schedule_quality_density.density_cd	is null)
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.quality_cd 	= @input_quality_cd
	and	pp_schedule_quality_density.density_cd	is null

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end

	select @quality_found = 'T'
end
end


--If we can't find a match on the quality code, we'll look for the wildcard (*) value
if (@pure_match_found <> 'T' and @quality_found <> 'T')
begin
IF EXISTS (select pp_schedule_quality_density.quality_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.quality_cd 	= '*'
						and	pp_schedule_quality_density.density_cd is null)
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.quality_cd 	= '*'
	and	pp_schedule_quality_density.density_cd is null

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end

	select @quality_found = 'T'
end
end


--Now try to match on the density code.
if (@pure_match_found <> 'T')

begin
IF EXISTS (select pp_schedule_quality_density.density_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.density_cd 	= @input_density_cd
						and	pp_schedule_quality_density.quality_cd is null)
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.density_cd 	= @input_density_cd
	and	pp_schedule_quality_density.quality_cd is null

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end

	select @density_found = 'T'
end
end


--If we can't find a match on the density code, we'll look for the wildcard (*) value
if (@pure_match_found <> 'T' and @density_found <> 'T')
begin
IF EXISTS (select pp_schedule_quality_density.density_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.density_cd 	= '*'
						and	pp_schedule_quality_density.quality_cd is null)
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.density_cd 	= '*'
	and	pp_schedule_quality_density.quality_cd is null

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end
	
	select @density_found = 'T'
end
end


--If we can't find a match on the density code or quality code, we'll look for the wildcard (*) values
if (@pure_match_found <> 'T' and @density_found <> 'T' and @quality_found <> 'T')
begin
IF EXISTS (select pp_schedule_quality_density.density_cd from pp_schedule_quality_density
						where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_quality_density.year	= @input_sup_yr
						and	pp_schedule_quality_density.density_cd 	= '*'
						and	pp_schedule_quality_density.quality_cd	= '*')
begin
	select  @qd_unit_price 	= pp_schedule_quality_density.qd_unit_price, 
		@qd_percent 	= pp_schedule_quality_density.qd_percent
	from  pp_schedule_quality_density
	where 	pp_schedule_quality_density.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_quality_density.year	= @input_sup_yr
	and	pp_schedule_quality_density.density_cd 	= '*'
	and	pp_schedule_quality_density.quality_cd	= '*'

	if (@qd_unit_price is not null)
	begin
		select @unit_price = @unit_price + @qd_unit_price
	end
	else if (@qd_percent is not null)
	begin
		select @unit_price = @unit_price * (@qd_percent/100)
	end

end
end

GO

