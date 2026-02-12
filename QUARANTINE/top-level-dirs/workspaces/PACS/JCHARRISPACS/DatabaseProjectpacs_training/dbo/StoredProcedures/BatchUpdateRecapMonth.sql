


create procedure BatchUpdateRecapMonth
	@lYear numeric(4,0),
	@lMonth int,
	@dtBegin datetime,
	@dtEnd datetime
as

set nocount on

	declare @lRet int

	select @lRet = count(*)
	from recap_month with(nolock)
	where
		(not tax_yr = @lYear or not tax_month = @lMonth)
		and
		(
			(begin_date >= @dtBegin and begin_date <= @dtEnd)
			or
			(end_date >= @dtBegin and end_date <= @dtEnd)
		)

	if ( @lRet = 0 )
	begin
		/* No date range conflict */

		update recap_month with(rowlock) set
			begin_date = @dtBegin,
			end_date = @dtEnd
		where
			tax_yr = @lYear and
			tax_month = @lMonth

		/* Row might not exist */
		if ( @@rowcount = 0 )
		begin
			insert recap_month with(rowlock) (
				tax_yr, tax_month, begin_date, end_date
			) values (
				@lYear, @lMonth, @dtBegin, @dtEnd
			)
		end
	end

set nocount off

	select lRet = @lRet

GO

