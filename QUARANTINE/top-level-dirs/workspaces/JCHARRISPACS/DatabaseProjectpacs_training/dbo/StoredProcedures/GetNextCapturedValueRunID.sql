

CREATE PROCEDURE GetNextCapturedValueRunID
	@next_run_id int output,
	@bOutputRS bit = 0
AS
	set nocount on

	begin transaction
		select @next_run_id = next_captured_value_run_id
		from dbo.next_captured_value_run_id with(tablockx, holdlock, updlock)

		update dbo.next_captured_value_run_id with(tablockx, holdlock)
		set next_captured_value_run_id = @next_run_id + 1
	commit transaction

	set nocount off

	if ( @bOutputRS = 1 )
	begin
		select next_run_id = @next_run_id
	end

GO

