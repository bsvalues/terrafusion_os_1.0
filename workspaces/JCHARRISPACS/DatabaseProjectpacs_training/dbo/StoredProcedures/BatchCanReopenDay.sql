


create procedure BatchCanReopenDay
	@dtDay datetime
as

set nocount on

	/* Chop off any hours, minutes, and seconds */
	set @dtDay = convert(varchar(24), @dtDay, 101)

	declare @bCanReopen bit
	
	if exists (
		select tax_yr
		from recap_month with(nolock)
		where
			begin_date <= @dtDay and
			end_date >= @dtDay
	)
	begin
		set @bCanReopen = 0
	end
	else
	begin
		set @bCanReopen = 1
	end

set nocount off

	select bCanReopen = @bCanReopen

GO

