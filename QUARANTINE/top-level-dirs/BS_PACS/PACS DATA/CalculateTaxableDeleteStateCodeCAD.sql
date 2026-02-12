
create procedure CalculateTaxableDeleteStateCodeCAD
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit,
	@lRowsPerDelete int = 0
as

set nocount on

	if ( @bUseList = 1 )
	begin
		if ( @lSupNum = 0 )
		begin
			delete poecsc
			from property_owner_entity_cad_state_cd as poecsc with(holdlock)
			where
				poecsc.year = @lYear and
				poecsc.sup_num = @lSupNum and
				poecsc.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
				poecsc.prop_id in (select t2.prop_id from #totals_prop_list as t2)
		end
		else
		begin
			delete poecsc
			from property_owner_entity_cad_state_cd as poecsc with(holdlock)
			left outer join property_val as pv with(nolock) on
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum and
				pv.prop_id = poecsc.prop_id
			where
				poecsc.year = @lYear and
				poecsc.sup_num = @lSupNum and
				poecsc.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
				poecsc.prop_id in (select t2.prop_id from #totals_prop_list as t2) and
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
				delete poecsc
				from property_owner_entity_cad_state_cd as poecsc with(tablock, holdlock)
				where
					poecsc.year = @lYear and
					poecsc.sup_num = @lSupNum
			end
			else
			begin
				delete poecsc
				from property_owner_entity_cad_state_cd as poecsc with(tablock, holdlock)
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = @lYear and
					pv.sup_num = @lSupNum and
					pv.prop_id = poecsc.prop_id
				where
					poecsc.year = @lYear and
					poecsc.sup_num = @lSupNum and
					pv.accept_create_id is null
			end

			if ( @@rowcount = 0 )
			begin
				break
			end
		end

		set rowcount 0
	end

GO

