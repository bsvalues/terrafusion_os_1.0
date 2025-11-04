


create procedure ARBInsertEvent
	@szARBType varchar(2),
	@lPropID int,
	@lYear numeric(4,0),
	@lCaseID int,
	@szEventTypeCode varchar(10),
	@lPacsUserID int,
	@szEventComment varchar(500),
	@dtEvent datetime = null
as

set nocount on

	/* The property ID will sometimes be sent as 0, so lookup if necessary */
	if (isnull(@lPropID, 0) = 0)
	begin
		if (@szARBType = 'AI')
		begin
			select
				@lPropID = prop_id
			from _arb_inquiry with(nolock)
			where
				case_id = @lCaseID and
				prop_val_yr = @lYear
		end
		else if (@szARBType = 'AP')
		begin
			select
				@lPropID = prop_id
			from _arb_protest with(nolock)
			where
				case_id = @lCaseID and
				prop_val_yr = @lYear
		end
		/* else - Currently not any other ARB type */
	end

	set @dtEvent = isnull(@dtEvent, getdate())

	insert _arb_event (
		lPropID, lYear, lCaseID, szARBType, szEventCode, dtEvent, lPacsUserID, szEventComment
	) values (
		@lPropID, @lYear, @lCaseID, @szARBType, @szEventTypeCode, @dtEvent, @lPacsUserID, @szEventComment
	)

set nocount off

	select
		lEventID = @@identity, dtEvent = @dtEvent

GO

