
create procedure TATransactionComponentAlertSelect

as

	select
		tca.lEnvironmentID,
		tca.lTransactionComponentID,
		tca.lOperatorID,
		tca.lLogThreshold
	from tb_ta_transaction_component_alert as tca with(nolock)
	join tb_ta_transaction_environment as te with(nolock) on
		te.lEnvironmentID = tca.lEnvironmentID
	where
		te.bEnabled = 1
	order by 
		tca.lEnvironmentID asc,
		tca.lTransactionComponentID asc,
		tca.lOperatorID asc

	return( @@rowcount )

GO

