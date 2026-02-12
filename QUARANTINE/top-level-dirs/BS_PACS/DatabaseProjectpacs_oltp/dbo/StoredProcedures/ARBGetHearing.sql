

create procedure ARBGetHearing
	@lHearingID int
as

	select distinct
		h.lHearingID, h.dtDay, h.cAccountType, h.szHearingType,
		sum(scheduled_protest_count),
		sum(scheduled_agent_count),
		sum(assigned_agent_count)
	from _arb_protest_hearing as h with(nolock)
	left outer join _arb_protest_hearing_docket as d with(nolock) on
		d.lHearingID = @lHearingID
	where
		h.lHearingID = @lHearingID
	group by
		h.lHearingID, h.dtDay, h.cAccountType, h.szHearingType

GO

