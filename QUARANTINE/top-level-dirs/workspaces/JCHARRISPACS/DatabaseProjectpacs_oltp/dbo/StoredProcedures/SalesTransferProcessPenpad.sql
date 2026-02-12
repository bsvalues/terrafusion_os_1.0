create procedure dbo.SalesTransferProcessPenpad
	@lOwnerChangeInfoID int,
	@lPropID int,
	@lAccountID int,
	@szFileAsName varchar(70),
	@bType bit
as

set nocount on

	-- If zero, we need to create an account from the information checked in from the penpad
	if ( @lAccountID = 0 )
	begin
		exec dbo.GetUniqueID 'account', @lAccountID output, 1, 0
	
		-- Add the account record
		insert account with(rowlock) (acct_id, file_as_name)
		values (@lAccountID, @szFileAsName)	
	end

	if ( @bType = 0 )
	begin
		insert into seller_assoc
		(seller_id, chg_of_owner_id, prop_id)
		values (@lAccountID, @lOwnerChangeInfoID, @lPropID)

		update penpad_sales_change with(rowlock)
		set bWizardComplete = 1
		where 
			lOwnerChangeInfoID = @lOwnerChangeInfoID
			and lPropID = @lPropID
			and bMode=0
			and szFileAsName = '' + @szFileAsName + ''
	end
	else
	begin
		insert into buyer_assoc
		(chg_of_owner_id, buyer_id)
		values (@lOwnerChangeInfoID, @lAccountID)

		update penpad_sales_change with(rowlock)
		set bWizardComplete = 1
		where 
			lOwnerChangeInfoID = @lOwnerChangeInfoID
			and lPropID = @lPropID
			and bMode=1
			and szFileAsName = '' + @szFileAsName + ''

	end

GO

