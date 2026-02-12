
CREATE procedure GetNextSupplementID
	@lSupplementID int output,
	@lSupplementYear int,
	@bOutputRS bit = 0
as

set nocount on

	begin transaction

	select @lSupplementID = next_sup_id
	from dbo.next_supp_id with(tablockx, holdlock, updlock)
	where sup_year = @lSupplementYear 

	update dbo.next_supp_id with(tablockx, holdlock)
	set next_sup_id = @lSupplementID + 1
	where sup_year = @lSupplementYear 

	commit transaction

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select supID = @lSupplementID
	end

GO

