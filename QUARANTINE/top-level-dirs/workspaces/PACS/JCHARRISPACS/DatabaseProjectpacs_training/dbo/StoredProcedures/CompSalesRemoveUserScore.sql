

create procedure CompSalesRemoveUserScore
	@lPacsUserID int
as

set nocount on

	begin transaction

	delete sales_comp_score_improv with(rowlock)
	where
		lPacsUserID = @lPacsUserID

	delete sales_comp_score_land with(rowlock)
	where
		lPacsUserID = @lPacsUserID

	delete comp_sales_corp_score with(rowlock)
	where
		lPacsUserID = @lPacsUserID

	commit transaction

set nocount off

GO

