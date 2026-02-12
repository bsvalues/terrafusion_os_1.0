
create procedure TATransactionEnvironmentCopy
	@lEnvironmentID tinyint,
	@szEnvironmentName varchar(63),
	@szEnvironmentPath varchar(255),
	@szSQLServerName varchar(128),
	@szSQLServerDBName varchar(128),
	@szSQLServerLogin varchar(128),
	@szSQLServerPassword varchar(128),
	@bEnabled bit,
	@lNewEnvironmentID tinyint = null
as

set nocount on

	begin transaction
	
	if ( @lNewEnvironmentID is null )
	begin
		select @lNewEnvironmentID = max(lEnvironmentID)
		from tb_ta_transaction_environment with(tablockx, holdlock)

		set @lNewEnvironmentID = @lNewEnvironmentID + 1
	end

	insert tb_ta_transaction_environment (
		lEnvironmentID, szEnvironmentName, szEnvironmentPath,
		szSQLServerName, szSQLServerDBName, szSQLServerLogin, szSQLServerPassword, bEnabled,
		szSQLLoginNonPrivy, szSQLPasswordNonPrivy
	)
	select
		@lNewEnvironmentID, @szEnvironmentName, @szEnvironmentPath,
		@szSQLServerName, @szSQLServerDBName, @szSQLServerLogin, @szSQLServerPassword, @bEnabled,
		szSQLLoginNonPrivy, szSQLPasswordNonPrivy
	from tb_ta_transaction_environment
	where lEnvironmentID = @lEnvironmentID

	commit transaction

	insert tb_ta_transaction_component (
		lEnvironmentID, lTransactionComponentID, uuidTransactionComponent,
		szTransactionComponentName, szDLLName, lDefaultPriority, bCreateStaticInstance, bThreadPerInstance, bCreateStaticInstanceMasterOnly, bEnabled, bProfile, bProfileSQL
	)
	select
		@lNewEnvironmentID, lTransactionComponentID, uuidTransactionComponent,
		szTransactionComponentName, szDLLName, lDefaultPriority, bCreateStaticInstance, bThreadPerInstance, bCreateStaticInstanceMasterOnly, bEnabled, bProfile, bProfileSQL
	from tb_ta_transaction_component
	where lEnvironmentID = @lEnvironmentID

	insert tb_ta_transaction_component_config (
		lEnvironmentID, lTransactionComponentID, szConfigName, szConfigValue,
		lConfigValueType, bAllowUIEdit, bReadOnce, szDescription
	)
	select
		@lNewEnvironmentID, lTransactionComponentID, szConfigName, szConfigValue,
		lConfigValueType, bAllowUIEdit, bReadOnce, szDescription
	from tb_ta_transaction_component_config
	where lEnvironmentID = @lEnvironmentID

	insert tb_ta_transaction_component_config_valid_values (
		lEnvironmentID, lTransactionComponentID, szConfigName, szValidValue
	)
	select
		@lNewEnvironmentID, lTransactionComponentID, szConfigName, szValidValue
	from tb_ta_transaction_component_config_valid_values
	where lEnvironmentID = @lEnvironmentID

	insert tb_ta_profile_config (
		lEnvironmentID, szFilter, bProfileSQL, bEnabled
	)
	select
		@lNewEnvironmentID, szFilter, bProfileSQL, bEnabled
	from tb_ta_profile_config
	where lEnvironmentID = @lEnvironmentID
	
set nocount off

	select "New Environment ID" = @lNewEnvironmentID

GO

