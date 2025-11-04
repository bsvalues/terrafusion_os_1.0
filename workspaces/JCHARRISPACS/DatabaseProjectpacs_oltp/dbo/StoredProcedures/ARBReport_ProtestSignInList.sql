

create procedure ARBReport_ProtestSignInList
	@lPacsUserID int,
	@szFilter varchar(8000)
as

set nocount on

	delete _arb_rpt_protest_sign_in_list with(rowlock)
	where
		pacs_user_id = @lPacsUserID

	declare @szSQL varchar(8000)

	set @szSQL = '
	insert _arb_rpt_protest_sign_in_list (
		pacs_user_id, owner_name, agent_name, prot_type, prop_id, legal_desc, 
		prop_val_yr, case_id, docket_start_year, docket_start_month, 
		docket_start_day, docket_start_hour, docket_start_minute,
		prot_assigned_panel, meeting_appraiser_nm, property_use_cd
	)
	SELECT 
	' + convert(varchar(16), @lPacsUserID) + ', ' +
	'
		owner_name, agent_name, prot_type, prop_id, legal_desc, prop_val_yr, case_id,
		docket_start_year, docket_start_month, docket_start_day, docket_start_hour, docket_start_minute,
		prot_assigned_panel, appraiser.appraiser_nm, property_use_cd
	FROM arb_protest_sign_in_list_vw
	LEFT OUTER JOIN appraiser ON
		arb_protest_sign_in_list_vw.appraiser_meeting_appraiser_id = appraiser.appraiser_id
	'

	if ( @szFilter <> '' )
	begin
		set @szSQL = @szSQL + ' WHERE ' + @szFilter
	end

	exec(@szSQL)

set nocount off

GO

