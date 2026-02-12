
create procedure dbo.GetNextStatementID
	@lYear numeric(4,0),
	@lNextStatementID int = null output,
	@bOutputRS bit = 1,
	@lNumIDs int = 1
as

set nocount on

	begin transaction

	select @lNextStatementID = next_statement_id
	from next_statement_id with(holdlock, rowlock, updlock)
	where statement_yr = @lYear

	if ( @@rowcount = 0 )
	begin
		insert next_statement_id with(holdlock, rowlock, xlock) (
			statement_yr, next_statement_id
		)
		values (@lYear, 1 + @lNumIDs)

		set @lNextStatementID = 1
	end
	else
	begin
		update next_statement_id with(tablockx, holdlock)
		set next_statement_id = @lNextStatementID + @lNumIDs
		where statement_yr = @lYear
	end

	commit transaction

	set nocount off

	if ( @bOutputRS = 1 )
	begin
		select lNextID = @lNextStatementID
	end

GO

