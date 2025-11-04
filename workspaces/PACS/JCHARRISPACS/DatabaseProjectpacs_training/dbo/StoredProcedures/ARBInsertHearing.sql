
create procedure ARBInsertHearing
	@dtDay datetime,
	@szHearingType varchar(10),
	@cAccountType char(1),
	@lHearingID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	exec dbo.GetUniqueID '_arb_protest_hearing', @lHearingID output, 1, 0

	insert _arb_protest_hearing (
		lHearingID, dtDay, szHearingType, cAccountType
	) values (
		@lHearingID, @dtDay, @szHearingType, @cAccountType
	)

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select lHearingID = @lHearingID
	end

GO

