

create procedure ARBReport_Inquiry
	@lPacsUserID int,
	@szFilter varchar(8000)
as

set nocount on

	delete _arb_rpt_inquiry_report with(rowlock)
	where
		pacs_user_id = @lPacsUserID

	declare @szSQL varchar(8000)

	set @szSQL = '
	insert _arb_rpt_inquiry_report (
		pacs_user_id, file_as_name, appraised_val, prop_id, prop_val_yr, case_id, inq_type,
		inq_status, appraiser_meeting_date_time, geo_id, appraiser_nm, meeting_appraiser_nm,
		property_use_cd, owner_id
	)
	SELECT 
	' + convert(varchar(16), @lPacsUserID) + ', ' +
	'
		account.file_as_name,
		property_val.appraised_val,
		_arb_inquiry.prop_id,
		_arb_inquiry.prop_val_yr,
		_arb_inquiry.case_id,
		_arb_inquiry.inq_type,
		_arb_inquiry.inq_status,
		_arb_inquiry.appraiser_meeting_date_time,
		property.geo_id,
		appraiser.appraiser_nm,
		appraiser_2.appraiser_nm,
		property_val.property_use_cd,
		owner.owner_id
	FROM account account
	INNER JOIN owner ON
		account.acct_id = owner.owner_id
	INNER JOIN property_val ON
		owner.prop_id = property_val.prop_id AND
		owner.owner_tax_yr = property_val.prop_val_yr AND
		owner.sup_num = property_val.sup_num
	INNER JOIN prop_supp_assoc ON
		property_val.prop_id = prop_supp_assoc.prop_id AND
		property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
		property_val.sup_num = prop_supp_assoc.sup_num
	INNER JOIN _arb_inquiry ON
		property_val.prop_id = _arb_inquiry.prop_id AND
		property_val.prop_val_yr = _arb_inquiry.prop_val_yr
	INNER JOIN appraiser ON
		_arb_inquiry.inq_appraisal_staff = appraiser.appraiser_id
	LEFT OUTER JOIN appraiser AS appraiser_2 ON
		_arb_inquiry.appraiser_meeting_appraiser_id = appraiser_2.appraiser_id
	INNER JOIN property ON
		prop_supp_assoc.prop_id = property.prop_id
	'

	if ( @szFilter <> '' )
	begin
		set @szSQL = @szSQL + ' WHERE ' + @szFilter
	end

	exec(@szSQL)

set nocount off

GO

