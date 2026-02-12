
create procedure RecalcDeleteStateCode
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		delete property_val_state_cd
		from property_val_state_cd
		join recalc_prop_list_current_division as rpl with(nolock) on
			property_val_state_cd.prop_id = rpl.prop_id and
			property_val_state_cd.prop_val_yr = rpl.sup_yr and
			property_val_state_cd.sup_num = rpl.sup_num and
			rpl.pacs_user_id = @lPacsUserID

		delete property_val_cad_state_cd
		from property_val_cad_state_cd
		join recalc_prop_list_current_division as rpl with(nolock) on
			property_val_cad_state_cd.prop_id = rpl.prop_id and
			property_val_cad_state_cd.prop_val_yr = rpl.sup_yr and
			property_val_cad_state_cd.sup_num = rpl.sup_num and
			rpl.pacs_user_id = @lPacsUserID
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete property_val_state_cd with(tablock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum

			delete property_val_cad_state_cd with(tablock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
		else
		begin
			/*
				We hold the lock on individual property recalculation
				because the component has begun a transaction in which
				it will both delete and insert
			*/
			delete property_val_state_cd with(rowlock, holdlock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				prop_id = @lPropID

			delete property_val_cad_state_cd with(rowlock, holdlock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				prop_id = @lPropID
		end
	end

GO

