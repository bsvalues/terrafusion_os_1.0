
create procedure CalculateTaxableDeleteVal
	@lPacsUserID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit,
	@lRowsPerDelete int = 0
as

set nocount on

	if ( @lPacsUserID = 0 )
	begin
		if ( @bUseList = 1 )
		begin
			if ( @lSupNum = 0 )
			begin
				delete poev
				from prop_owner_entity_val as poev with(holdlock)
				where
					poev.sup_yr = @lYear and
					poev.sup_num = @lSupNum and
					poev.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
					poev.prop_id in (select t2.prop_id from #totals_prop_list as t2)
			end
			else
			begin
				delete poev
				from prop_owner_entity_val as poev with(holdlock)
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = @lYear and
					pv.sup_num = @lSupNum and
					pv.prop_id = poev.prop_id
				where
					poev.sup_yr = @lYear and
					poev.sup_num = @lSupNum and
					poev.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
					poev.prop_id in (select t2.prop_id from #totals_prop_list as t2) and
					pv.accept_create_id is null
			end
		end
		else
		begin
			set rowcount @lRowsPerDelete

			while ( 0 = 0 )
			begin
				if ( @lSupNum = 0 )
				begin
					delete poev
					from prop_owner_entity_val as poev with(tablock, holdlock)
					where
						poev.sup_yr = @lYear and
						poev.sup_num = @lSupNum
				end
				else
				begin
					delete poev
					from prop_owner_entity_val as poev with(tablock, holdlock)
					left outer join property_val as pv with(nolock) on
						pv.prop_val_yr = @lYear and
						pv.sup_num = @lSupNum and
						pv.prop_id = poev.prop_id
					where
						poev.sup_yr = @lYear and
						poev.sup_num = @lSupNum and
						pv.accept_create_id is null
				end

				if ( @@rowcount = 0 )
				begin
					break
				end
			end

			set rowcount 0
		end
	end
	else
	begin
		delete prop_owner_entity_val_preview
		where pacs_user_id = @lPacsUserID
	end

GO

