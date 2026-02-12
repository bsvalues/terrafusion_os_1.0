
create procedure TAOperatorSelect

as

	select
		lOperatorID,
		szOperatorName,
		szOperatorEmail
	from tb_ta_operator with(nolock)
	order by lOperatorID asc

	return( @@rowcount )

GO

