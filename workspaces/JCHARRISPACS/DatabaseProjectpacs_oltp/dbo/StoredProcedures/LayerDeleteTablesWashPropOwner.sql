
create procedure LayerDeleteTablesWashPropOwner
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

		delete dbo.wash_prop_owner_exemption
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID


		delete dbo.wash_prop_owner_proration
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID


		delete dbo.wash_prop_owner_levy_assoc
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID


		delete dbo.wash_prop_owner_tax_area_assoc
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID


		delete dbo.wash_prop_owner_tax_district_assoc
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID


		delete dbo.wash_prop_owner_val
		where
			[year] = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID

GO

