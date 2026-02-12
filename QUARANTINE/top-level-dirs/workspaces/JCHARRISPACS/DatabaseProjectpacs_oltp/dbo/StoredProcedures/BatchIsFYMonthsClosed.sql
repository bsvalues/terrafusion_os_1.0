


create procedure BatchIsFYMonthsClosed
	@lEntityID int,
	@szFY varchar(20),
	@bClosed bit = 0 output,
	@bOutputRS bit = 1
as

set nocount on

	declare
		@dtBegin datetime,
		@dtEnd datetime

	/* Get the FY begin & end */
	select
		@dtBegin = begin_date,
		@dtEnd = end_date
	from recap_fiscal with(nolock)
	where
		entity_id = @lEntityID and
		fiscal_year = @szFY

	set @bClosed = 1
	/* For each month that is in the FY */
	while ( datediff(month, @dtBegin, @dtEnd) >= 0 )
	begin

		if(datediff(month, @dtBegin, @dtEnd) = 0 )
		begin	
			set @dtEnd = dateadd(day,1,@dtEnd)
			if(datediff(month, @dtBegin, @dtEnd) > 0 )
			begin	
				if not exists (
				select tax_month
				from recap_month with(nolock)
				where
					tax_yr = datepart(year, @dtBegin) and
					tax_month = datepart(month, @dtBegin)
				)
				begin
					/* Month is not closed */
					set @bClosed = 0
				end
			end
			break
		end

		else
		begin
			if not exists (
				select tax_month
				from recap_month with(nolock)
				where
					tax_yr = datepart(year, @dtBegin) and
					tax_month = datepart(month, @dtBegin)
			)
			begin
				/* Month is not closed */
				set @bClosed = 0
				break
			end
		end

		/* Next month */
		set @dtBegin = dateadd(month, 1, @dtBegin)
	end

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select bClosed = @bClosed
	end

GO

