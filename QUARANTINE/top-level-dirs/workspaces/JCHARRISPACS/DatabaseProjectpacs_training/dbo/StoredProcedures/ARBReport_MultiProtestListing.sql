

CREATE procedure ARBReport_MultiProtestListing
	@lPacsUserID int,
	@szFilter varchar(8000)
as

set nocount on

	delete _arb_rpt_multi_protest_listing with(rowlock)
	where
		pacs_user_id = @lPacsUserID

	declare @szSQL varchar(8000)

	set @szSQL = '
	insert _arb_rpt_multi_protest_listing (
		pacs_user_id, prop_id, case_id, prop_val_yr, prot_status, prot_type, prot_by_type, prot_hearing_start_dt
	)
	SELECT 
	' + convert(varchar(16), @lPacsUserID) + ', ' +
	'
		_arb_protest.prop_id, _arb_protest.case_id, _arb_protest.prop_val_yr, _arb_protest.prot_status, _arb_protest.prot_type, 
		appba.prot_by_type, _arb_protest.prot_hearing_start_dt

	FROM _arb_protest 

	INNER JOIN (SELECT min(isnull(prot_by_type, ''OT'')) as prot_by_type, case_id, prop_val_yr, prop_id FROM _arb_protest_protest_by_assoc 
			WHERE primary_protester = 1
			group by case_id, prop_val_yr, prop_id) as appba
	ON appba.case_id = _arb_protest.case_id
	AND appba.prop_val_yr = _arb_protest.prop_val_yr
	AND appba.prop_id = _arb_protest.prop_id
	'

	if ( @szFilter <> '' )
	begin
		set @szSQL = @szSQL + ' WHERE ' + @szFilter
	end

	exec(@szSQL)

set nocount off

GO

