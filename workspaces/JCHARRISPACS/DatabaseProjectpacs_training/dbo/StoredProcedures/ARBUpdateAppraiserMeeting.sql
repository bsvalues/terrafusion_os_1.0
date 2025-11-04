


create procedure ARBUpdateAppraiserMeeting
	@lMeetingID int,
	@dtBegin datetime,
	@dtEnd datetime
as

set nocount on

	update _arb_inquiry with(rowlock) set
		appraiser_meeting_date_time = @dtBegin
	where
		appraiser_meeting_id = @lMeetingID

	update _arb_protest with(rowlock) set
		appraiser_meeting_date_time = @dtBegin
	where
		appraiser_meeting_id = @lMeetingID

	update _arb_appraiser_meeting_schedule with(rowlock) set
		meeting_start_time = @dtBegin,
		meeting_end_time = @dtEnd
	where
		meeting_id = @lMeetingID

	/* Find out how many cases are associated with this meeting */
	declare
		@lInqCount int,
		@lProCount int

	select @lInqCount = count(*)
	from _arb_inquiry with(nolock)
	where
		appraiser_meeting_id = @lMeetingID

	select @lProCount = count(*)
	from _arb_protest with(nolock)
	where
		appraiser_meeting_id = @lMeetingID

	if ( (@lInqCount + @lProCount) > 1 )
	begin
		update _arb_appraiser_meeting_schedule set
			meeting_description = 'Multiple'
		where
			meeting_id = @lMeetingID
	end

set nocount off

GO

