

create procedure CompSalesRemoveUserLoadCriteria
	@lPacsUserID int
as

set nocount on

	delete comp_sales_corp_load_criteria with(rowlock)
	where
		lPacsUserID = @lPacsUserID

set nocount off

GO

