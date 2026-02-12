
create procedure RecalcSelectIncome
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	/* Since SQL Server upon occasion gets stupid (terrible execution plans) with the income tables, give a quick exit if possible */
	if ( @lPropID <> 0 )
	begin
		if not exists (
			select top 1 prop_val_yr
			from income_prop_assoc with(nolock)
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		)
		begin
			/* Return an empty recordset */
			select dummy_income_id = 0
			where 0 = 1

			return(0)
		end
	end
	else
	begin
		if not exists (
			select top 1 income_yr
			from income with(nolock)
		)
		begin
			/* Return an empty recordset */
			select dummy_income_id = 0
			where 0 = 1

			return(0)
		end
	end

	declare @lRet int
	exec @lRet = dbo.RecalcSelectIncomeData @lPacsUserID, @lPropID, @lYear, @lSupNum

	return( @lRet )

GO

