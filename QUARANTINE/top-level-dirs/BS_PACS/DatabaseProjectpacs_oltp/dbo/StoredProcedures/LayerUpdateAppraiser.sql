
create procedure LayerUpdateAppraiser
	@lFromYear numeric(4,0),
	@lFromSupNum int,
	@lFromPropID int,
	@lToYear numeric(4,0),
	@lToSupNum int,
	@lToPropID int
as

set nocount on

	update pv
	set next_appraisal_rsn = curr.next_appraisal_rsn,
		last_appraiser_id = curr.last_appraiser_id,
		next_appraiser_id = curr.next_appraiser_id,
		land_appraiser_id = curr.land_appraiser_id,
		value_appraiser_id = curr.value_appraiser_id,
		last_appraisal_yr = curr.last_appraisal_yr,
		hscap_prev_reappr_yr = curr.hscap_prev_reappr_yr,
		last_appraisal_dt = curr.last_appraisal_dt,
		next_appraisal_dt = curr.next_appraisal_dt
	from property_val as pv
	join property_val as curr
	with (nolock)
	on pv.prop_id = curr.prop_id
	where pv.prop_val_yr = @lToYear
	and pv.sup_num = @lToSupNum
	and curr.prop_val_yr = @lFromYear
	and curr.sup_num = @lFromSupNum
	and pv.prop_id = @lToPropID
	and curr.prop_id = @lFromPropID

	return(0)

GO

