
create procedure TATransactionComponentSelectConfig
	@lEnvironmentID tinyint = null,
	@lTransactionComponentID int = null,
	@szConfigName varchar(63) = null
as

	if ( @lEnvironmentID is null )
	begin
		select tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName, tcc.szConfigValue, tcc.bReadOnce
		from tb_ta_transaction_component_config as tcc with(nolock)
		join tb_ta_transaction_component as tc with(nolock) on
			tc.lEnvironmentID = tcc.lEnvironmentID and
			tc.lTransactionComponentID = tcc.lTransactionComponentID
		join tb_ta_transaction_environment as te with(nolock) on
			tcc.lEnvironmentID = te.lEnvironmentID
		where
			tc.bEnabled = 1 and
			te.bEnabled = 1
		order by tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName
	end
	else
	begin
		if ( @lTransactionComponentID is null )
		begin
			select tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName, tcc.szConfigValue, tcc.bReadOnce
			from tb_ta_transaction_component_config as tcc with(nolock)
			join tb_ta_transaction_component as tc with(nolock) on
				tc.lEnvironmentID = tcc.lEnvironmentID and
				tc.lTransactionComponentID = tcc.lTransactionComponentID
			join tb_ta_transaction_environment as te with(nolock) on
				tcc.lEnvironmentID = te.lEnvironmentID
			where
				tcc.lEnvironmentID = @lEnvironmentID and
				tc.bEnabled = 1 and
				te.bEnabled = 1
			order by tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName
		end
		else
		begin
			select tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName, tcc.szConfigValue, tcc.bReadOnce
			from tb_ta_transaction_component_config as tcc with(nolock)
			join tb_ta_transaction_component as tc with(nolock) on
				tc.lEnvironmentID = tcc.lEnvironmentID and
				tc.lTransactionComponentID = tcc.lTransactionComponentID
			join tb_ta_transaction_environment as te with(nolock) on
				tcc.lEnvironmentID = te.lEnvironmentID
			where
				tcc.lEnvironmentID = @lEnvironmentID and
				tc.bEnabled = 1 and
				te.bEnabled = 1 and
				tcc.lTransactionComponentID = @lTransactionComponentID and
				(
					@szConfigName is null or
					tcc.szConfigName = @szConfigName
				)
			order by tcc.lEnvironmentID, tcc.lTransactionComponentID, tcc.szConfigName
		end
	end

	return( @@rowcount )

GO

