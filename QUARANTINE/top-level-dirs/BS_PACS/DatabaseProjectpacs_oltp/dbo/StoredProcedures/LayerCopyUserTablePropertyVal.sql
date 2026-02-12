create procedure LayerCopyUserTablePropertyVal
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	insert dbo.user_property_val with(rowlock) (
		prop_val_yr, sup_num, prop_id,is_primary,sum_acres,benefit_acres,benefit_acre_sum,nwa_type,nwa_acres,nwa_supplemental,nwa_aggregate_pid,displaytext_exemption,displaytext_massadj,crid_acres,weed_acres,drain_acres
	)
	select
		@lYear_To, @lSupNum_To, @lPropID_To,is_primary,sum_acres,benefit_acres,benefit_acre_sum,nwa_type,nwa_acres,nwa_supplemental,nwa_aggregate_pid,displaytext_exemption,displaytext_massadj,crid_acres,weed_acres,drain_acres
	from dbo.user_property_val with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From

GO

