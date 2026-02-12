


create procedure ARBAddAppraiserMeetingSchedule
	@lAppraiserID int,
	@lCaseID int,
	@lYear numeric(4,0),
	@bARBInquiry bit,
	@dtBegin datetime,
	@dtEnd datetime,
	@szDescription varchar(128),
	@lMeetingID int = null output
as

set nocount on

	insert _arb_appraiser_meeting_schedule with(rowlock) (
		appraiser_id, meeting_start_time, meeting_end_time, meeting_description
	) values (
		@lAppraiserID, @dtBegin, @dtEnd, @szDescription
	)
	set @lMeetingID = @@identity

	--declare @lOldMeetingID int

	--if ( @bARBInquiry = 1 )
	--begin
	--	select @lOldMeetingID = appraiser_meeting_id
	--	from _arb_inquiry with(rowlock)
	--	where
	--		prop_val_yr = @lYear and
	--		case_id = @lCaseID
			
	--	update _arb_inquiry with(rowlock) set
	--		appraiser_meeting_id = @lMeetingID,
	--		appraiser_meeting_appraiser_id = @lAppraiserID,
	--		appraiser_meeting_date_time = @dtBegin
	--	where
	--		prop_val_yr = @lYear and
	--		case_id = @lCaseID

		/* Remove the old meeting */
	--	delete _arb_appraiser_meeting_schedule with(rowlock)
	--	where
	--		meeting_id = @lOldMeetingID
	--end
	--else
	--begin
	--	select @lOldMeetingID = appraiser_meeting_id
	--	from _arb_protest with(rowlock)
	--	where
	--		prop_val_yr = @lYear and
	--		case_id = @lCaseID

	--	update _arb_protest with(rowlock) set
	--		appraiser_meeting_id = @lMeetingID,
	--		appraiser_meeting_appraiser_id = @lAppraiserID,
	--		appraiser_meeting_date_time = @dtBegin
	--	where
	--		prop_val_yr = @lYear and
	--		case_id = @lCaseID

		/* Remove the old meeting */
	--	delete _arb_appraiser_meeting_schedule with(rowlock)
	--	where
	--		meeting_id = @lOldMeetingID
	--end

set nocount off

	select lMeetingID = @lMeetingID

GO

