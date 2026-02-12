create procedure LayerCopyUserTablePropertySpecialAssessment
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	insert dbo.user_property_special_assessment with(rowlock) (
		[year], sup_num, prop_id, agency_id,nwa_forestparcel_count,nwa_nonforestparcel_count,nwa_forestacres_sum,nwa_nonforestacres_sum
	)
	select
		@lYear_To, @lSupNum_To, @lPropID_To, agency_id,nwa_forestparcel_count,nwa_nonforestparcel_count,nwa_forestacres_sum,nwa_nonforestacres_sum
	from dbo.user_property_special_assessment with(nolock)
	where
		[year] = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From

GO

