

create procedure LitigationSetAdjCode
	@lLitigationID int,
	@szAdjCode varchar(10)
as

set nocount on

	update bill with(rowlock) set
		adjustment_code = @szAdjCode
	where
		bill_id in (
			select bill_id
			from litigation_bill_assoc
			where
				litigation_id = @lLitigationID
		)

set nocount off

GO

