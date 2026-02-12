

create procedure LitigationInsert
	@lLitigationID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	insert litigation with(rowlock) (
		cause_num
	) values (
		null
	)
	
	set @lLitigationID = @@identity

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select litigation_id = @lLitigationID
	end

GO

