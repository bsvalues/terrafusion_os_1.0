
create procedure TATransactionComponentSelect
	@lEnvironmentID tinyint = null,
	@lTransactionComponentID int = null
as

	if ( @lEnvironmentID is null )
	begin
		select tc.lEnvironmentID, tc.lTransactionComponentID, tc.uuidTransactionComponent, tc.szTransactionComponentName, tc.szDLLName, tc.lDefaultPriority, tc.bCreateStaticInstance, tc.bDllRegisterServer, tc.bThreadPerInstance, tc.bCreateStaticInstanceMasterOnly, tc.bProfile, tc.bProfileSQL
		from tb_ta_transaction_component as tc with(nolock)
		join tb_ta_transaction_environment as te with(nolock) on
			tc.lEnvironmentID = te.lEnvironmentID
		where
			tc.bEnabled = 1 and
			te.bEnabled = 1
		order by tc.lEnvironmentID, tc.lTransactionComponentID
	end
	else
	begin
		select tc.lEnvironmentID, tc.lTransactionComponentID, tc.uuidTransactionComponent, tc.szTransactionComponentName, tc.szDLLName, tc.lDefaultPriority, tc.bCreateStaticInstance, tc.bDllRegisterServer, tc.bThreadPerInstance, tc.bCreateStaticInstanceMasterOnly, tc.bProfile, tc.bProfileSQL
		from tb_ta_transaction_component as tc with(nolock)
		join tb_ta_transaction_environment as te with(nolock) on
			tc.lEnvironmentID = te.lEnvironmentID
		where
			tc.bEnabled = 1 and
			te.bEnabled = 1 and
			tc.lEnvironmentID = @lEnvironmentID and
			(
				@lTransactionComponentID is null or
				tc.lTransactionComponentID = @lTransactionComponentID
			)
		order by tc.lTransactionComponentID
	end

	return( @@rowcount )

GO

