

create procedure ARBReport_PanelDecisions
	@lPacsUserID int,
	@szFilter varchar(8000)
as

set nocount on

	delete _arb_rpt_panel_decisions with(rowlock)
	where
		pacs_user_id = @lPacsUserID

	declare @szSQL varchar(8000)

	set @szSQL = '
	insert _arb_rpt_panel_decisions (
		pacs_user_id,
		owner_name, agent_name, prop_id, geo_id, legal_desc, prop_val_yr, case_id,
		appraiser_nm, situs, first_decision, second_decision,
		prot_second_motion_decision_dt, prot_first_motion_decision_dt, prot_first_motion_decision_cd,
		prot_second_motion_decision_cd, meeting_appraiser_nm,
		property_use_cd
	)
	SELECT 
	' + convert(varchar(16), @lPacsUserID) + ', ' +
	'
		owner_name, agent_name, prop_id, geo_id, legal_desc, prop_val_yr, case_id,
		arb_panel_decisions_report_vw.appraiser_nm, situs, first_decision, second_decision,
		prot_second_motion_decision_dt, prot_first_motion_decision_dt, prot_first_motion_decision_cd,
		prot_second_motion_decision_cd, appraiser.appraiser_nm,
		property_use_cd
	FROM arb_panel_decisions_report_vw
	LEFT OUTER JOIN appraiser ON
		arb_panel_decisions_report_vw.appraiser_meeting_appraiser_id = appraiser.appraiser_id 
	'
	
	if ( @szFilter <> '' )
	begin
		set @szSQL = @szSQL + ' WHERE ' + @szFilter
	end

	exec(@szSQL)

set nocount off

GO

