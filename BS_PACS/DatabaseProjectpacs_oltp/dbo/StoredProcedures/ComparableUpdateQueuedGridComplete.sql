
create procedure ComparableUpdateQueuedGridComplete
	@lYear numeric(4,0),
	@lPropID int,
	@lCaseID int,
	@bARBInquiry bit
as

set nocount on

	if ( @bARBInquiry = 1 )
	begin
		update _arb_inquiry with(rowlock)
		set bGridComplete = 1
		where
			prop_val_yr = @lYear and
			prop_id = @lPropID and
			case_id = @lCaseID
	end
	else
	begin
		update _arb_protest with(rowlock)
		set bGridComplete = 1
		where
			prop_val_yr = @lYear and
			prop_id = @lPropID and
			case_id = @lCaseID
	end

GO

