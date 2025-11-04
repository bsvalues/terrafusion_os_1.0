



CREATE  procedure BatchEntityFYRollover
	@lEntityID int,
	@lAsOfTaxYear numeric(4,0),
	@lAsOfTaxMonth int
as

set nocount on

	declare @szFY varchar(20)
	/* Get the most recent fiscal year */
	select @szFY = max(fiscal_year)
	from recap_fiscal with(nolock)
	where
		entity_id = @lEntityID

	declare
		@dtBegin datetime,
		@dtEnd datetime
	/* Get the begin and end dates for said fiscal year */
	select
		@dtBegin = begin_date,
		@dtEnd = end_date
	from recap_fiscal with(nolock)
	where
		entity_id = @lEntityID and
		fiscal_year = @szFY

	/* Set the values for the new fiscal year */
	declare @szNewFY varchar(20)
	set @dtBegin = dateadd(year, 1, @dtBegin)
	set @dtEnd = dateadd(year, 1, @dtEnd)
	if ( datepart(year, @dtBegin) <> datepart(year, @dtEnd) )
	begin
		/* Ex: 2003-2004 */
		set @szNewFY = convert(varchar(4), datepart(year, @dtBegin)) + '-' + convert(varchar(4), datepart(year, @dtEnd))
	end
	else
	begin
		/* Ex: 2004 */
		set @szNewFY = convert(varchar(4), datepart(year, @dtBegin))
	end

	/* Add a new row for the new fiscal year */
	insert recap_fiscal with(rowlock) (
		entity_id, fiscal_year, begin_date, end_date
	) values (
		@lEntityID, @szNewFY, @dtBegin, @dtEnd
	)




	/* Rollover the balances from the specified FY into the new FY */
	insert recap_fiscal_totals with(rowlock) (
		entity_id, fiscal_year, coll_year, beg_mno, beg_ins
	)
	select
		@lEntityID, @szNewFY, coll_year, balance_mno, balance_ins
	from recap_fiscal_balance
	where
		entity_id = @lEntityID and
		tax_month = @lAsOfTaxMonth and
		tax_year = @lAsOfTaxYear

set nocount off

GO

