
create procedure PopulatePropertyOwnerEntityStateCd
	@lYear numeric(4,0),
	@lSupNum int
as

delete property_owner_entity_state_cd with(tablock)
where
	year = @lYear and
	sup_num = @lSupNum

delete property_owner_entity_cad_state_cd with(tablock)
where
	year = @lYear and
	sup_num = @lSupNum

declare @lEntityID int

declare entity_cursor insensitive cursor
for
	select distinct entity_id
    from prop_owner_entity_val with(nolock)
    where
		sup_yr = @lYear and
		sup_num = @lSupNum
	order by 1 asc
for read only

open entity_cursor
fetch next from entity_cursor into @lEntityID

while ( @@fetch_status = 0 )
begin
	exec SetEntityStateCdVal @lYear, @lSupNum, @lEntityID
	exec SetEntityCADStateCdVal @lYear, @lSupNum, @lEntityID
	
	fetch next from entity_cursor into @lEntityID
end

close entity_cursor
deallocate entity_cursor

exec CalculateTaxableXCleanup @lYear, @lSupNum, 0
exec CalculateTaxableXCleanupCAD @lYear, @lSupNum, 0

GO

