


create procedure ARBRemoveAppraiserMeeting
	@lMeetingID int
as

set nocount on

	update _arb_inquiry with(rowlock) set
		appraiser_meeting_id = null,
		appraiser_meeting_date_time = null
	where
		appraiser_meeting_id = @lMeetingID

	update _arb_protest with(rowlock) set
		appraiser_meeting_id = null,
		appraiser_meeting_date_time = null
	where
		appraiser_meeting_id = @lMeetingID

	delete _arb_appraiser_meeting_schedule with(rowlock)
	where
		meeting_id = @lMeetingID

GO

