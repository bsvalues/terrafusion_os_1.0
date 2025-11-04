
create procedure ARBAutoScheduleMeeting
	@lYear numeric(4,0),
	@lCaseID int,
	@lPropID int,
	@lSupNum int
as

declare @szRealResident   char(10)
declare @szRealCommercial char(10)
declare @szPersonal       char(10)
declare @szMineral        char(10)
declare @szAuto           char(10)
declare @nMeetingAhead    int
declare @nHearingAhead    int
declare @bAutoSchedule    int

DECLARE @szPropertyType char(5)
DECLARE @bHasAgent int
DECLARE @cCommercial char(1)

declare @sztype varchar(12)
declare @lDocketID int
declare @lHearingDocketID int

set nocount on

select  @sztype = pro_appr_meeting_type 
FROM _arb_inquiry_options 
WHERE machine_name = ''

--if they are not doing docket processing for appraiser
if(@sztype <> 'Docket')
begin

	execute  ARBAutoSchedule @lYear, @lCaseID, @lPropID, @lSupNum, 0, @lHearingDocketID OUTPUT
	if(@lHearingDocketID is not null)
	BEGIN
		select RetVal = 1, lDocketID = 0, lHearingDocketID = @lHearingDocketID
	END
	else   -- hearing docket not set
	BEGIN
		select RetVal = -30
	END
	
	return
end
else
begin
	/* Get the property type and whether or not it is commercial */
	select
	    @szPropertyType = rtrim(p.prop_type_cd),
	    @cCommercial = isnull(sc.commercial_acct_flag, 'F')
	from property_profile as pp with(nolock)
	    join property as p with(nolock) on pp.prop_id = p.prop_id
	    join state_code as sc with(nolock) on pp.state_cd = sc.state_cd
	where pp.prop_id = @lPropID
	    and pp.prop_val_yr = @lYear
	    and pp.sup_num = @lSupNum

	SELECT @bHasAgent = count(*)
	FROM agent_assoc
	WHERE prop_id = @lPropID
	    AND owner_tax_yr = @lYear

	SELECT
	    @szRealResident   = mass_sched_real_res_type,
	    @szRealCommercial = mas_sched_real_com_type,
	    @szPersonal       = mass_sched_personal_type,
	    @szMineral        = mass_sched_mineral_type,
	    @szAuto           = mass_sched_auto_type,
	    @nMeetingAhead    = appr_SchedMeetingDays,
	    @nHearingAhead    = appr_SchedHearingDays,
	    @bAutoSchedule    = appr_auto_schedule
	FROM _arb_inquiry_options WHERE machine_name = ''

	-- Test the Real property
	if @szPropertyType = 'R' or @szPropertyType = 'MH'
	begin
	    if @cCommercial = 'T'
	    begin   -- this is Real(commercial) property
	        if @szRealCommercial = 'none'
        	begin
	            select RetVal = -1
        	    return
	        end
        	else if @szRealCommercial = 'w/o agent'
	        begin
        	    if @bHasAgent > 0
	            begin
        	        select RetVal = -2
                	return
	            end
        	end
	        goto schedule_meeting
	    end
	    else
	    begin   -- This is Real(residential) property
	        if @szRealResident = 'none'
	        begin
	            select RetVal = -3
        	    return
	        end
        	else if @szRealResident = 'w/o agent'
	        begin
        	    if @bHasAgent > 0
	            begin
        	        select RetVal = -4
                	return
	            end
        	end
	        goto schedule_meeting
	    end
	end

	-- test Personal property
	if @szPropertyType = 'P'
	begin
	    if @szPersonal = 'none'
	    begin
        	select RetVal = -5
	        return
	    end
	    else if @szPersonal = 'w/o agent'
	    begin
        	if @bHasAgent > 0
	        begin
        	    select RetVal = -6
	            return
        	end
	    end
	    goto schedule_meeting
	end

	-- test Mineral property
	if @szPropertyType = 'M'
	begin
	    if @szMineral = 'none'
	    begin
        	select RetVal = -7
	        return
	    end
	    else if @szMineral = 'w/o agent'
	    begin
        	if @bHasAgent > 0
	        begin
        	    select RetVal = -8
	            return
        	end
	    end
	    goto schedule_meeting
	end

	-- test Auto property
	if @szPropertyType = 'A'
	begin
	    if @szAuto = 'none'
	    begin
        	select RetVal = -9
	        return
	    end
	    else if @szAuto = 'w/o agent'
	    begin
        	if @bHasAgent > 0
	        begin
        	    select RetVal = -10
	            return
        	end
	    end
	    goto schedule_meeting
	end

	schedule_meeting:
	set nocount on
--25947 moved above	declare @lDocketID int

	/* Find out if this property already has another meeting with a docket assigned */
	select @lDocketID = prot_appr_docket_id
	from _arb_protest with(nolock)
	where prop_id = @lPropID
	    and prop_val_yr = @lYear
	    and prot_appr_docket_id is not null

	if ( @lDocketID is not null )
	begin   /* It does, so recycle the docket */
	    update _arb_protest with(rowlock) set prot_appr_docket_id = @lDocketID
	    where prop_id = @lPropID
	    and prop_val_yr = @lYear
	    and case_id = @lCaseID
	end
	else
	begin
	    declare @dtMin datetime
	    /* We don't care about the time, just the number of days in advance */
	    set @dtMin = dateadd(day, @nMeetingAhead, convert(varchar(32), getdate(), 101))

	    declare @lCount int
	    declare @dtDocketStart datetime
	    declare @dtActualTime datetime

	    begin transaction
	    /* Find the first available docket (after the configured amount of time) */
        	select top 1
	            @lDocketID = d.docket_id, @dtActualTime = d.docket_start_date_time
        	from _arb_protest_hearing_docket as d with(rowlock, holdlock, updlock)
	            join _arb_protest_hearing as h with(nolock) on d.lHearingID = h.lHearingID
        	where d.docket_start_date_time >= @dtMin
	            AND d.scheduled_protest_count < d.maximum_hearing_count
        	    AND h.szHearingType = 'AP'
	            AND @szPropertyType in
        	    (
                	select distinct apt.szPropertyType
	                from _arb_protest_hearing_property_type as apt with(nolock)
        	        where apt.lHearingID = h.lHearingID
	            )
        	    AND
	            (
        	        h.cAccountType = @cCommercial or
                	isnull(h.cAccountType, '') = '' or
	                @szPropertyType <> 'R' /* Docket commercial flags do not apply to non-real property */
        	    )
	        order by d.docket_start_date_time asc

	    /* Find the first available docket (after the configured amount of time) */
	--        select top 1
	--            @lDocketID = d.docket_id, @dtActualTime = d.docket_start_date_time
	--       from _arb_protest_hearing_docket as d with(rowlock, holdlock, updlock)
	--            join _arb_protest_hearing as h with(nolock) on d.lHearingID = h.lHearingID
	--        where d.docket_start_date_time >= @dtMin
	--            and d.scheduled_protest_count < d.maximum_hearing_count
	--            and h.szHearingType = 'AP'
	--        order by d.docket_start_date_time asc

		/* Update */
	        if ( @lDocketID is not null )
        	begin
	            update _arb_protest with(rowlock)
        	    set prot_appr_docket_id = @lDocketID
	            where prop_id = @lPropID
        	        and prop_val_yr = @lYear
                	and case_id = @lCaseID
	        end
		else
		begin
        	    ROLLBACK TRANSACTION
	            select RetVal = -30
		    return
		end

	        if @bAutoSchedule <> 0    -- Do we auto schedule a protest hearing?
		begin
        	declare @dtHearing datetime

	        /* We don't care about the time, just the number of days in advance */
        	    set @dtHearing = dateadd(day, @nHearingAhead, convert(varchar(32), @dtActualTime, 101))

	        /* Find the first hearing docket available (after the configured amount of time) */
        	    select top 1
                	@lHearingDocketID = d.docket_id
	            from _arb_protest_hearing_docket as d with(rowlock, holdlock, updlock)
        	        join _arb_protest_hearing as h with(nolock) on d.lHearingID = h.lHearingID
	            where d.docket_start_date_time >= @dtHearing
        	        AND d.scheduled_protest_count < d.maximum_hearing_count
                	AND h.szHearingType = 'P'
	                AND @szPropertyType in
        	        (
                	    select distinct apt.szPropertyType
	                    from _arb_protest_hearing_property_type as apt with(nolock)
        	            where apt.lHearingID = h.lHearingID
                	)
	                AND
        	        (
                	    h.cAccountType = @cCommercial or
	                    isnull(h.cAccountType, '') = '' or
        	            @szPropertyType <> 'R' /* Docket commercial flags do not apply to non-real property */
                	)
	            order by d.docket_start_date_time asc

	        /* Find the first hearing docket available (after the configured amount of time) */
	--            select top 1
	--                @lHearingDocketID = d.docket_id
	--            from _arb_protest_hearing_docket as d with(rowlock, holdlock, updlock)
	--                join _arb_protest_hearing as h with(nolock) on d.lHearingID = h.lHearingID
	--            where d.docket_start_date_time >= @dtHearing
	--                and d.scheduled_protest_count < d.maximum_hearing_count
	--                and h.szHearingType = 'P'
	--            order by d.docket_start_date_time asc

	        /* Update */
        	    if ( @lHearingDocketID is not null )
	            begin
        	        update _arb_protest with(rowlock)
                	set docket_id = @lHearingDocketID
	                where prop_id = @lPropID
        	            and prop_val_yr = @lYear
                	    and case_id = @lCaseID

	                commit transaction
        	        select RetVal = 1, lDocketID = @lDocketID, lHearingDocketID = @lHearingDocketID
			return
	            end
        	    else
	            begin
        	        ROLLBACK TRANSACTION
                	select RetVal = -20
			return
	            end
        	end -- end auto schedule
	    commit transaction
	end
end --Docket
set nocount off

  select RetVal = 0, lDocketID = @lDocketID

GO

