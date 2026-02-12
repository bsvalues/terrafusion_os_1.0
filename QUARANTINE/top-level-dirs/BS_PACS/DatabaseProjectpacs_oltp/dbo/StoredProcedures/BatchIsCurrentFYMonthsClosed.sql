


create procedure BatchIsCurrentFYMonthsClosed
	@lEntityID int,
	@bClosed bit = 0 output,
	@bOutputRS bit = 1
as

set nocount on

	/* Get the current fiscal year */
	declare @szFY varchar(20)
	select @szFY = max(fiscal_year)
	from recap_fiscal with(nolock)
	where
		entity_id = @lEntityID

set nocount off

	exec BatchIsFYMonthsClosed @lEntityID, @szFY, @bClosed output, @bOutputRS

GO

