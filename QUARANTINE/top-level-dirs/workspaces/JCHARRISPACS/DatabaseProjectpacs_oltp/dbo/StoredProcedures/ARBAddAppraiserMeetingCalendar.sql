
create procedure ARBAddAppraiserMeetingCalendar
	@lAppraiserID int,
	@dtDayBegin datetime,
	@dtDayEnd datetime,
	@dtTimeFrom datetime,
	@dtTimeTo datetime,
	@bExcludeWeekends bit,
	@bExcludeHolidays bit
as

set nocount on

	set @dtDayEnd = dateadd(day, 1, @dtDayEnd)

	/* Configure datepart() */
	set datefirst 1

	while ( @dtDayBegin < @dtDayEnd )
	begin
		if (
			(@bExcludeWeekends = 0 or (@bExcludeWeekends = 1 and datepart(weekday, @dtDayBegin) not in (6,7)))
			and
			(
				@bExcludeHolidays = 0 or not exists (
					select holiday
					from _arb_holiday with(nolock)
					where
						holiday = @dtDayBegin
				)
			)
		)
		begin
			insert _arb_appraiser_meeting_calendar (
				appraiser_id, calendar_start_time, calendar_end_time
			) values (
				@lAppraiserID,
				dateadd(day, datediff(day, @dtTimeFrom, @dtDayBegin), @dtTimeFrom),
				dateadd(day, datediff(day, @dtTimeTo, @dtDayBegin), @dtTimeTo)
			)
		end
		
		set @dtDayBegin = dateadd(day, 1, @dtDayBegin)
	end

set nocount off

GO

