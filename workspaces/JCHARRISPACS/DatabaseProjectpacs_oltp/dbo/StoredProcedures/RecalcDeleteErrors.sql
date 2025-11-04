
create procedure RecalcDeleteErrors
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@bDeleteIncome bit,
	@bDeleteOnlyPTD bit
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
			delete prop_recalc_errors
			from prop_recalc_errors
			join recalc_prop_list_current_division as rpl with(nolock) on
				prop_recalc_errors.prop_id = rpl.prop_id and
				prop_recalc_errors.sup_yr = rpl.sup_yr and
				prop_recalc_errors.sup_num = rpl.sup_num and
				rpl.pacs_user_id = @lPacsUserID
			where
				(@bDeleteOnlyPTD = 0 or error_type in ('PTDRD','PTDRV'))
			
			if ( @bDeleteIncome = 1 )
			begin
				delete income_recalc_errors
				from income_recalc_errors
				join recalc_income_list_current_division as ril with(nolock) on
					income_recalc_errors.income_id = ril.income_id and
					income_recalc_errors.income_yr = ril.income_yr and
					income_recalc_errors.sup_num = ril.sup_num and
					ril.pacs_user_id = @lPacsUserID
			end
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete prop_recalc_errors with(tablock)
			where
				sup_yr = @lYear and
				sup_num = @lSupNum and
				(@bDeleteOnlyPTD = 0 or error_type in ('PTDRD','PTDRV'))
			
			if ( @bDeleteIncome = 1 )
			begin
				delete income_recalc_errors with(tablock)
				where
					income_yr = @lYear and
					sup_num = @lSupNum
			end
		end
		else
		begin
			delete prop_recalc_errors
			where
				prop_id = @lPropID and
				sup_yr = @lYear and
				sup_num = @lSupNum and
				(@bDeleteOnlyPTD = 0 or error_type in ('PTDRD','PTDRV'))

			if ( @bDeleteIncome = 1 )
			begin
				delete income_recalc_errors
				from income_recalc_errors
				join recalc_income_list_current_division as ril with(nolock) on
					income_recalc_errors.income_id = ril.income_id and
					income_recalc_errors.income_yr = ril.income_yr and
					income_recalc_errors.sup_num = ril.sup_num and
					ril.pacs_user_id = @lPacsUserID
			end
		end
	end

GO

