
create procedure RecalcDeleteStateCodeCAD
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		delete property_val_cad_state_cd with(holdlock)
		from property_val_cad_state_cd with(holdlock)
		join #recalc_prop_list as rpl with(nolock) on
			property_val_cad_state_cd.prop_val_yr = rpl.sup_yr and
			property_val_cad_state_cd.prop_id = rpl.prop_id and
			property_val_cad_state_cd.sup_num = rpl.sup_num
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete property_val_cad_state_cd with(tablock, holdlock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
		else
		begin
			delete property_val_cad_state_cd with(holdlock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				prop_id = @lPropID
		end
	end

GO

