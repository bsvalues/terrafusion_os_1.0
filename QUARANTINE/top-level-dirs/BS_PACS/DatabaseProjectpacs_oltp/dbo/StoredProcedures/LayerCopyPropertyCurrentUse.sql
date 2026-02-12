
CREATE procedure [dbo].[LayerCopyPropertyCurrentUse]
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	-- property_current_use_review
	insert property_current_use_review with(rowlock) (
		prop_id,
		year,
		sup_num,
		manual_select,
		auto_select,
		status_code,
		status_date,
		review_date,
		next_inspection_date,
		next_inspection_reason
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		manual_select,
		auto_select,
		status_code,
		status_date,
		review_date,
		next_inspection_date,
		next_inspection_reason
	from dbo.property_current_use_review as pcur with(nolock)
	where
		pcur.year = @lYear_From and
		pcur.sup_num = @lSupNum_From and
		pcur.prop_id = @lPropID_From

	-- property_current_use_removal
	insert property_current_use_removal with(rowlock) (
		prop_id,
		year,
		sup_num,
		manual_select,
		auto_select,
		removal_id,
		application_number,
		size_acres,
		removal_date
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		manual_select,
		auto_select,
		removal_id,
		application_number,
		size_acres,
		removal_date
	from dbo.property_current_use_removal as pcurem with(nolock)
	where
		pcurem.prop_id = @lPropID_From and
		pcurem.year = @lYear_From and
		pcurem.sup_num = @lSupNum_From

GO

