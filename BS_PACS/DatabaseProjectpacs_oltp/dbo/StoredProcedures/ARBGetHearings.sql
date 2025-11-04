




create procedure ARBGetHearings
	@lYear numeric(4,0),
	@szHearingType varchar(10)
as

set nocount on

if (@lYear is not null)
begin
	declare	@szMin varchar(10),
		@szMax varchar(10)

	set @szMin = '01/01/' + convert(varchar(4), @lYear)
	set @szMax = '01/01/' + convert(varchar(4), @lYear + 1)

	select	lHearingID,
		dtDay,
		cAccountType
	from	_arb_protest_hearing
	where	dtDay >= @szMin
	and	dtDay < @szMax
	and	isnull(szHearingType, '') = @szHearingType
	order by	dtDay asc,
			lHearingID asc
end
else
begin
	select	lHearingID,
		dtDay,
		cAccountType
	from	_arb_protest_hearing
	where	isnull(szHearingType, '') = @szHearingType
	order by	dtDay asc,
			lHearingID asc
end

set nocount off

GO

