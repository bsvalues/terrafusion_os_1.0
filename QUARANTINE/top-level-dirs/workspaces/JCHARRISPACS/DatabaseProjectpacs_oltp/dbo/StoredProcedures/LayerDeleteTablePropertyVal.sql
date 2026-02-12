
create procedure LayerDeleteTablePropertyVal
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	if
	not exists (
		select prop_val_yr
		from dbo.imprv with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			sale_id > 0 and
			prop_id = @lPropID

	)
	and
	not exists (
		select prop_val_yr
		from dbo.land_detail with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			sale_id > 0 and
			prop_id = @lPropID
	)
	begin
		exec dbo.LayerDeleteUserTablePropertyVal @lYear, @lSupNum, @lPropID
		
		-- property_legal_description
		delete dbo.property_legal_description
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID
			
		-- Delete the state specific property_val table
		declare @szRegion varchar(2)
		select @szRegion = szConfigValue
		from core_config with(nolock)
		where szGroup = 'SYSTEM' and szConfigName = 'REGION'
		
		declare @szSQL varchar(8000)
		set @szSQL = 'exec ' + @szRegion + 'LayerDeleteTablePV ' +
			convert(varchar(12), @lYear) + ',' +
			convert(varchar(12), @lSupNum) + ',' +
			convert(varchar(12), @lPropID)
		exec(@szSQL)	
		
		-- If this is the region is WA, then delete the wash_prop_owner_* tables
		if @szRegion = 'WA'
		begin
			set @szSQL = 'exec LayerDeleteTablesWashPropOwner ' + 
			convert(varchar(12), @lYear) + ',' +
			convert(varchar(12), @lSupNum) + ',' +
			convert(varchar(12), @lPropID)
			
			exec(@szSQL)
		end

		-- Delete the regular property_val table
		delete
		from dbo.property_val with(rowlock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID
	end

	return(0)

GO

