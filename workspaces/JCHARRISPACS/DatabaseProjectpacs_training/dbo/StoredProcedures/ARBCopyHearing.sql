
create procedure ARBCopyHearing
	@lHearingID int,
	@szHearingType varchar(10),
	@cAccountType char(1),
	@dtFrom datetime,
	@dtTo datetime,
	@bExcludeWeekends bit
as

set nocount on

	declare
		@dtDocketStart datetime,
		@dtDocketEnd datetime,
		@lDocketID int,
		@lNewHearingID int,
		@lMax int,
		@offsite bit

	set @dtTo = dateadd(day, 1, @dtTo)

	/* Configure datepart() */
	set datefirst 1

	while ( @dtFrom < @dtTo )
	begin
		/* Exclude Sat & Sun if requested */
		if ( @bExcludeWeekends = 0 or datepart(weekday, @dtFrom) < 6 )
		begin
			/* Get a new hearing ID */
			exec ARBInsertHearing @dtFrom, @szHearingType, @cAccountType, @lNewHearingID output, 0

			/* Copy the property types to the new hearing */
			insert _arb_protest_hearing_property_type (
				lHearingID, szPropertyType
			)
			select
				@lNewHearingID, szPropertyType
			from _arb_protest_hearing_property_type
			where
				lHearingID = @lHearingID

			declare curDockets insensitive cursor
			for
				select
					docket_start_date_time, docket_end_date_time, maximum_hearing_count, offsite
				from _arb_protest_hearing_docket
				where
					lHearingID = @lHearingID
				order by
					docket_start_date_time, docket_end_date_time
			for read only

			open curDockets
			fetch next from curDockets into
				@dtDocketStart, @dtDocketEnd, @lMax, @offsite

			/* For each docket in the hearing we are to copy */
			while ( @@fetch_status = 0 )
			begin
				/* Get a new docket ID */
				exec dbo.GetUniqueID '_arb_protest_hearing_docket', @lDocketID output, 1, 0

				/* Add the docket */
				insert _arb_protest_hearing_docket (
					lHearingID, docket_id,
					docket_start_date_time,
					docket_end_date_time,
					maximum_hearing_count,
					offsite
				) values (
					@lNewHearingID, @lDocketID,
					dateadd(day, datediff(day, @dtDocketStart, @dtFrom), @dtDocketStart),
					dateadd(day, datediff(day, @dtDocketEnd, @dtFrom), @dtDocketEnd),
					@lMax, @offsite
				)

				fetch next from curDockets into
					@dtDocketStart, @dtDocketEnd, @lMax, @offsite
			end

			close curDockets
			deallocate curDockets
		end

		/* Go to the next day */
		set @dtFrom = dateadd(day, 1, @dtFrom)
	end

set nocount off

GO

