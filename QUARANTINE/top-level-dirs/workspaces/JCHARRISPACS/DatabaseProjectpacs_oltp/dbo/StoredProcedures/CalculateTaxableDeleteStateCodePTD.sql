
create procedure CalculateTaxableDeleteStateCodePTD
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
			delete poesc
			from property_owner_entity_state_cd as poesc with(holdlock)
			where
				poesc.year = @lYear and
				poesc.sup_num = @lSupNum and
				poesc.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
				poesc.prop_id in (select t2.prop_id from #totals_prop_list as t2)
		end
		else
		begin
			delete poesc
			from property_owner_entity_state_cd as poesc with(holdlock)
			left outer join property_val as pv with(nolock) on
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum and
				pv.prop_id = poesc.prop_id
			where
				poesc.year = @lYear and
				poesc.sup_num = @lSupNum and
				poesc.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
				poesc.prop_id in (select t2.prop_id from #totals_prop_list as t2) and
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
				delete poesc
				from property_owner_entity_state_cd as poesc with(tablock, holdlock)
				where
					poesc.year = @lYear and
					poesc.sup_num = @lSupNum
			end
			else
			begin
				delete poesc
				from property_owner_entity_state_cd as poesc with(tablock, holdlock)
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = @lYear and
					pv.sup_num = @lSupNum and
					pv.prop_id = poesc.prop_id
				where
					poesc.year = @lYear and
					poesc.sup_num = @lSupNum and
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

