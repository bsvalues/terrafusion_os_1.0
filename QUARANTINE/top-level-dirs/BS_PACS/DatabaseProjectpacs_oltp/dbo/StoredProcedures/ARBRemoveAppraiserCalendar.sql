


create procedure ARBRemoveAppraiserCalendar
	@lAppraiserID int,
	@dtBegin datetime,
	@dtEnd datetime
as

set nocount on

	declare
		@lCalendarID int,
		@dtCalBegin datetime,
		@dtCalEnd datetime

	begin transaction

	/* Find the item */
	select
		@lCalendarID = calendar_id,
		@dtCalBegin = calendar_start_time,
		@dtCalEnd = calendar_end_time
	from _arb_appraiser_meeting_calendar with(rowlock, holdlock, updlock)
	where
		appraiser_id = @lAppraiserID and
		calendar_start_time <= @dtBegin and
		calendar_end_time >= @dtEnd

	if ( @lCalendarID is not null )
	begin
		/* Item found ... determine how to manage the slot */

		if ( @dtCalBegin = @dtBegin and @dtCalEnd = @dtEnd )
		begin
			/* Time slot to remove matches perfectly ... remove it altogether */
			delete _arb_appraiser_meeting_calendar with(rowlock)
			where
				calendar_id = @lCalendarID
		end
		else if ( @dtCalBegin = @dtBegin )
		begin
			/* Time slot to remove is aligned at beginning */

			/* Chop off said beginning */
			update _arb_appraiser_meeting_calendar with(rowlock) set
				calendar_start_time = @dtEnd
			where
				calendar_id = @lCalendarID
		end
		else if ( @dtCalEnd = @dtEnd )
		begin
			/* Time slot to remove is aligned at the end */

			/* Chop off said end */
			update _arb_appraiser_meeting_calendar with(rowlock) set
				calendar_end_time = @dtBegin
			where
				calendar_id = @lCalendarID
		end
		else
		begin
			/* Item is in the middle somewhere */

			/* Make the item the "left side item" by chopping off the "middle" */
			update _arb_appraiser_meeting_calendar with(rowlock) set
				calendar_end_time = @dtBegin
			where
				calendar_id = @lCalendarID

			/* Add the "right side" item */
			insert _arb_appraiser_meeting_calendar with(rowlock) (
				appraiser_id, calendar_start_time, calendar_end_time
			) values (
				@lAppraiserID, @dtEnd, @dtCalEnd
			)
		end
	end

	commit transaction

set nocount off

GO

