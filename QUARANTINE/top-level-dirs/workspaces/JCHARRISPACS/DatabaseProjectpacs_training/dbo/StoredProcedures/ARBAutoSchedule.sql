

CREATE procedure [dbo].[ARBAutoSchedule]
	@lYear numeric(4,0),
	@lCaseID int,
	@lPropID int,
	@lSupNum int,
	@bOutputSelect bit = 1,
	@lDocketID int = null OUTPUT
as

set nocount on

	declare
--25947		@lDocketID int,
		@lAgentID int

	/* Find out if this property already has another protest with a docket assigned */
	select
		@lDocketID = docket_id
	from _arb_protest with(nolock)
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		docket_id is not null

	if ( @lDocketID is not null )
	begin
		/* It does, so recycle the docket */
		update _arb_protest with(rowlock) set
			docket_id = @lDocketID
		where
			prop_id = @lPropID and
			prop_val_yr = @lYear and
			case_id = @lCaseID
	end
	else
	begin
		/* Determine if the protest is by the agent or owner */
		declare
			@szProtestByType varchar(10),
			@lProtestByID int
		select
			@szProtestByType = appbapp.prot_by_type,
			@lProtestByID = appbapp.prot_by_id
		from _arb_protest as ap with(nolock)
		INNER JOIN _arb_protest_protest_by_assoc as appbapp WITH (NOLOCK) 
			ON appbapp.case_id = ap.case_id
			AND appbapp.prop_val_yr = ap.prop_val_yr
			AND appbapp.primary_protester = 1
		where
			ap.prop_id = @lPropID and
			ap.prop_val_yr = @lYear and
			ap.case_id = @lCaseID

		if (
			(
				select pro_bAssignAgentDocket
				from _arb_protest_options with(nolock)
				where
					machine_name = ''
			) = 'T'
		)
		begin
			/* The "Always assign agent properties to agent docket" option is on */

			if ( @szProtestByType = 'AG' )
			begin
				/* Protest was by an agent */

				/* Get the agent's docket ID */
				select
					@lDocketID = agent.arb_docket_id
				from agent with(nolock)
				where
					agent.agent_id = @lProtestByID
			end

			if ( @lDocketID is null )
			begin
				/* Protest was by owner or by an agent without a docket */

				/* Determine if the property has an agent, and if so, then get the agent's docket id */
				select top 1
					@lDocketID = agent.arb_docket_id,
					@lAgentID = agent.agent_id
				from agent_assoc with(nolock)
				join agent with(nolock) on
					agent_assoc.agent_id = agent.agent_id
				join account with(nolock) on
					agent_assoc.agent_id = account.acct_id
				where
					agent_assoc.prop_id = @lPropID and
					agent_assoc.owner_tax_yr = @lYear and
					( agent_assoc.arb_mailings = 'T' or agent_assoc.ca_mailings = 'T' )
				order by
					agent_assoc.agent_id asc
			end
		end

		if ( @lDocketID is not null )
		begin
			/* Assign to the agent's docket */
			update _arb_protest with(rowlock) set
				docket_id = @lDocketID
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				case_id = @lCaseID
		end
		else
		begin
			/* Find an available docket */

			declare
				@szPropType varchar(5),
				@cCommercial char(1)

			/* Get the property type and whether or not it is commercial */
			select
				@szPropType = rtrim(p.prop_type_cd),
				@cCommercial = isnull(sc.commercial_acct_flag, 'F')
			from property_profile as pp with(nolock)
			join property as p with(nolock) on
				pp.prop_id = p.prop_id
			left outer join state_code as sc with(nolock) on
				pp.state_cd = sc.state_cd
			where
				pp.prop_id = @lPropID and
				pp.prop_val_yr = @lYear
			/* James - Removed and sup_num = x b/c there is only 1 row per prop & year in property_profile */

			declare @lNumDays int
			/* Get the number of days until the first eligible hearing docket */
			select @lNumDays = pro_lNumDaysAutoSchedule
			from _arb_protest_options with(nolock)
			where machine_name = ''

			if ( @lNumDays is NULL )
			begin
				select @lNumDays = 15
			end

			declare @dtMin datetime
			/* We don't care about the time, just the number of days in advance */
			set @dtMin = dateadd(day, @lNumDays, convert(varchar(32), getdate(), 101))

			declare
				@lCount int,
				@dtDocketStart datetime,
				@lMaxDocketCount int

			begin transaction

			/*
				Find the first available docket (after the configured amount of time)
				for the property's type and commercial flag
			*/
			select top 1
				@lDocketID = d.docket_id
			from _arb_protest_hearing_docket as d with(rowlock, holdlock, updlock)
			join _arb_protest_hearing as h with(nolock) on
				d.lHearingID = h.lHearingID
			where
				d.docket_start_date_time >= @dtMin and
				d.scheduled_protest_count < d.maximum_hearing_count and
				h.szHearingType = 'P' and
				@szPropType in (
					select apt.szPropertyType
					from _arb_protest_hearing_property_type as apt with(nolock)
					where
						apt.lHearingID = h.lHearingID
				) and
				(
					h.cAccountType = @cCommercial or
					isnull(h.cAccountType, '') = '' or
					@szPropType <> 'R' /* Docket commercial flags do not apply to non-real property */
				)
			order by
				d.docket_start_date_time asc

			/* Update */
			if ( @lDocketID is not null )
			begin
				update _arb_protest with(rowlock) set
					docket_id = @lDocketID
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					case_id = @lCaseID
			end

			commit transaction
		end
	end

set nocount off
if( @bOutputSelect = 1)
BEGIN
	select lDocketID = @lDocketID
END




set ansi_nulls on
set quoted_identifier on

GO

