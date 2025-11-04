create procedure LayerCopyUserTableOwner
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@lOwnerID int = null
as

set nocount on

	insert dbo.user_owner with(rowlock) (
		owner_tax_yr, sup_num, prop_id, owner_id,in_care_of,spouse_name
	)
	select
		@lYear_To, @lSupNum_To, @lPropID_To, owner_id,in_care_of,spouse_name
	from dbo.user_owner with(nolock)
	where
		owner_tax_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From and
		(@lOwnerID is null or owner_id = @lOwnerID)

GO

