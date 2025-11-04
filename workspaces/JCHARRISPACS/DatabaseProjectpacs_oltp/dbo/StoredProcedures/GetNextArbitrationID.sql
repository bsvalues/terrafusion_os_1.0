
create procedure GetNextArbitrationID
	@lYear numeric(4,0),
	@lNextCaseID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	begin transaction

	select @lNextCaseID = next_arbitration_id
	from next_arbitration_id with(holdlock, rowlock, updlock)
	where prop_val_yr = @lYear

	if ( @@rowcount = 0 )
	begin
		insert next_arbitration_id with(holdlock, rowlock, xlock) (
			prop_val_yr, next_arbitration_id
		) values (
			@lYear, 2
		)
		set @lNextCaseID = 1
	end
	else
	begin
		update next_arbitration_id with(holdlock, rowlock, updlock)
		set next_arbitration_id = @lNextCaseID + 1
		where prop_val_yr = @lYear
	end
	
	commit transaction

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select lNextID = @lNextCaseID
	end

GO

