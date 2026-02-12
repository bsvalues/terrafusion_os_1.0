
create procedure CalculateTaxableDeleteExemption
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
				delete peex
				from property_entity_exemption as peex with(holdlock)
				where
					peex.owner_tax_yr = @lYear and
					peex.exmpt_tax_yr = @lYear and
					peex.sup_num = @lSupNum and
					peex.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
					peex.prop_id in (select t2.prop_id from #totals_prop_list as t2)
			end
			else
			begin
				delete peex
				from property_entity_exemption as peex with(holdlock)
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = @lYear and
					pv.sup_num = @lSupNum and
					pv.prop_id = peex.prop_id
				where
					peex.owner_tax_yr = @lYear and
					peex.exmpt_tax_yr = @lYear and
					peex.sup_num = @lSupNum and
					peex.entity_id in (select t1.entity_id from #totals_entity_list as t1) and
					peex.prop_id in (select t2.prop_id from #totals_prop_list as t2) and
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
					delete peex
					from property_entity_exemption as peex with(tablock, holdlock)
					where
						peex.owner_tax_yr = @lYear and
						peex.exmpt_tax_yr = @lYear and
						peex.sup_num = @lSupNum
				end
				else
				begin
					delete peex
					from property_entity_exemption as peex with(tablock, holdlock)
					left outer join property_val as pv with(nolock) on
						pv.prop_val_yr = @lYear and
						pv.sup_num = @lSupNum and
						pv.prop_id = peex.prop_id
					where
						peex.owner_tax_yr = @lYear and
						peex.exmpt_tax_yr = @lYear and
						peex.sup_num = @lSupNum and
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
		delete property_entity_exemption_preview with(holdlock)
		where pacs_user_id = @lPacsUserID
	end

GO

