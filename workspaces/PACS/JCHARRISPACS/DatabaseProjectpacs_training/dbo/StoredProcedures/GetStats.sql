



CREATE        procedure GetStats

@input_type		varchar(5),
@output_count		int		= 0 output, 
@output_low		numeric(18,5)	= 0 output, 
@output_high		numeric(18,5)	= 0 output, 
@output_avg		numeric(18,5)	= 0 output, 
@output_median		numeric(18,5)	= 0 output, 
@output_cod		numeric(18,5)	= 0 output, 
@output_cov		numeric(18,5)	= 0 output,
@output_aad		numeric(18,5)	= 0 output,
@output_stdev		numeric(18,5)	= 0 output,
@output_wt_mean		numeric(18,5)	= 0 output,
@output_prd		numeric(18,5)	= 0 output,
@output_pop_var		numeric(18,5)	= 0 output,
@input_report_type	varchar(5)	= ''

as

/* temp variables */
declare @mid_count	int
declare @sql		varchar(512)
declare @aad		numeric(18,5)
declare @stdev		numeric(18,5)

if exists (select * from #stats_list)
begin
	select @output_count = count(*),
	       @output_low   = min(value),
	       @output_high  = max(value),
	       @output_avg   = avg(value)
	from #stats_list
end
else
begin
	set @output_count  = 0
	set @output_low    = 0
	set @output_high   = 0
	set @output_avg    = 0
	set @output_median = 0
	set @output_cod    = 0
	set @output_cov    = 0
	
	return
end

/* calculate median */
set @mid_count = @output_count/2

create table #stats_mid
(
value numeric(18, 5) null
)


create table #stats_mid_high
(
value numeric(18, 5) null
)


create table #stats_mid_low
(
value numeric(18, 5) null
)


/* indicates it is an even number so take the middle 2 numbers and then take 
   the average for the median */
if (@output_count%2 = 0)
begin
	declare @low_mid	numeric(18, 5)
	declare @high_mid	numeric(18, 5)

	set @sql = 'insert into #stats_mid_high (value) select top ' + convert(varchar(10), @mid_count+1) 
	set @sql = @sql + ' value from #stats_list order by value'
	exec (@sql)

	set @sql = 'insert into #stats_mid_low (value) select top ' + convert(varchar(10), @mid_count) 
	set @sql = @sql + ' value from #stats_list order by value'
	exec (@sql)
	
	select @high_mid = IsNull(max(value), 0)
	from #stats_mid_high

	select @low_mid = IsNull(max(value), 0)
	from #stats_mid_low

	set @output_median = (@high_mid + @low_mid)/2
	
	if (@output_median is null)
	begin
		set @output_median = @output_low
	end


end
else 
begin
	set @sql = 'insert into #stats_mid (value) select top ' + convert(varchar(10), @mid_count + 1) 
	set @sql = @sql + ' value from #stats_list order by value'
	exec (@sql)
	
	select @output_median = max(value)
	from #stats_mid
	
	if (@output_median is null)
	begin
		set @output_median = @output_low
	end
end

drop table #stats_mid
drop table #stats_mid_high
drop table #stats_mid_low


/* calculate the cod */
select @output_aad = sum(abs(@output_median - value))
from #stats_list


if (@output_count > 0)
begin
	set @output_aad = @output_aad/@output_count
end
else
begin
	set @output_aad = 0
end

if (@output_median > 0)
begin
	set @output_cod = (@output_aad/@output_median) * 100
end
else
begin	
	set @output_cod = 0
end


/* calculate the cov */
select @output_stdev = IsNull(stdev(value), 0)
from #stats_list

if (@output_avg > 0)
begin
	set @output_cov = (@output_stdev/@output_avg) * 100
end
else
begin
	set @output_cov = 0
end

/* only calculate the below fields if this is a 
   sales ratio calculation */
if (@input_type = 'SR')
begin
	declare @sum_sale_price numeric(25,10)
	declare @sum_appr_value numeric(25,10)
	declare @sum_land_value numeric(25,10)

	select @sum_sale_price = SUM(ISNULL(sale_price,0))
	from #stats_sale_price

	select @sum_appr_value = SUM(ISNULL(appr_value,0))
	from #stats_appr_value

	select @sum_land_value = SUM(ISNULL(land_value,0))
	from #stats_land_value

	if (@sum_sale_price > 0)
	begin
		if (@input_report_type = 'LP')
			set @output_wt_mean = @sum_land_value/@sum_sale_price -- vacant land
		else
			set @output_wt_mean = @sum_appr_value/@sum_sale_price -- other
	end
	else
	begin
		set @output_wt_mean = 0
	end

	if (@output_wt_mean > 0)
	begin
		set @output_prd = @output_avg/@output_wt_mean
	end
	else
	begin
		set @output_prd = 0
	end

	set @output_pop_var = @output_stdev * @output_stdev
end
else
begin
	set @output_wt_mean = 0
	set @output_prd	    = 0
	set @output_pop_var = 0
end

GO

