

create procedure ARBReport_Protest
	@lPacsUserID int,
	@szFilter varchar(8000)
as

set nocount on

	delete _arb_rpt_protest_report with(rowlock)
	where
		pacs_user_id = @lPacsUserID

	declare @szSQL varchar(8000)

	set @szSQL = '
	insert _arb_rpt_protest_report (
		pacs_user_id, file_as_name, appraised_val, prop_id, prop_val_yr,
		case_id, prot_type, prot_status, prot_assigned_panel, 
		appraiser_meeting_date_time, docket_start_date_time, geo_id, 
		appraiser_nm, meeting_appraiser_nm, sup_num, owner_id, property_use_cd, agent_list
	)
	SELECT DISTINCT
	' + convert(varchar(16), @lPacsUserID) + ', ' +
	'	account.file_as_name,
		property_val.appraised_val,
		_arb_protest.prop_id, _arb_protest.prop_val_yr, _arb_protest.case_id, _arb_protest.prot_type, 
		_arb_protest.prot_status, _arb_protest.prot_assigned_panel, _arb_protest.appraiser_meeting_date_time,
		_arb_protest_hearing_docket.docket_start_date_time,
		property.geo_id,
		appraiser.appraiser_nm,
		appraiser_2.appraiser_nm,
		prop_supp_assoc.sup_num,
		owner.owner_id,
		property_val.property_use_cd,
		dbo.fn_GetAgents(owner.prop_id, owner.owner_tax_yr,owner.sup_num,owner.owner_id) as agent_list
	from _arb_protest with(nolock)
	join prop_supp_assoc with(nolock) on
		prop_supp_assoc.prop_id = _arb_protest.prop_id and
		prop_supp_assoc.owner_tax_yr = _arb_protest.prop_val_yr
	join property_val with(nolock) on
		property_val.prop_id = prop_supp_assoc.prop_id and
		property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr and
		property_val.sup_num = prop_supp_assoc.sup_num
	join owner with(nolock) on
		owner.prop_id = prop_supp_assoc.prop_id and
		owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr and
		owner.sup_num = prop_supp_assoc.sup_num
	join account with(nolock) on
		owner.owner_id = account.acct_id
	join property with(nolock) on
		property.prop_id = prop_supp_assoc.prop_id
	left outer join appraiser with(nolock) on
		appraiser.appraiser_id = _arb_protest.prot_hearing_appraisal_staff
	left outer join appraiser as appraiser_2 with(nolock) on
		appraiser_2.appraiser_id = _arb_protest.appraiser_meeting_appraiser_id
	left outer join _arb_protest_hearing_docket with(nolock) on
		_arb_protest_hearing_docket.docket_id = _arb_protest.docket_id
	'

	if ( @szFilter <> '' )
	begin
		set @szSQL = @szSQL + ' WHERE ' + @szFilter
	end

	exec(@szSQL)

GO

