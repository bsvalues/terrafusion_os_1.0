
create procedure SalesSetPrimaryPID
	@lChgOfOwnerID int,
	@lPropID int
as

set nocount on

	update chg_of_owner_prop_assoc
	set
		bPrimary = case
		when prop_id = @lPropID
		then 1
		else 0
		end
	where
		chg_of_owner_id = @lChgOfOwnerID

GO

