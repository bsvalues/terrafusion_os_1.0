

create procedure FeeUpdateIDs
	@lFeeID int,
	@lPropID int,
	@lAccountID int,
	@lLitigationID int
as

set nocount on

	if ( @lPropID > 0 )
	begin
		if not exists (
			select fee_id
			from fee_prop_assoc with(nolock)
			where fee_id = @lFeeID
		)
		begin
			insert fee_prop_assoc (
				fee_id, prop_id
			) values (
				@lFeeID, @lPropID
			)
		end
	end
	else if ( @lAccountID > 0 )
	begin
		if not exists (
			select fee_id
			from fee_acct_assoc with(nolock)
			where fee_id = @lFeeID
		)
		begin
			insert fee_acct_assoc (
				fee_id, acct_id
			) values (
				@lFeeID, @lAccountID
			)
		end
	end
	else if ( @lLitigationID > 0 )
	begin
		if not exists (
			select fee_id
			from fee_litigation_assoc with(nolock)
			where fee_id = @lFeeID
		)
		begin
			insert fee_litigation_assoc (
				fee_id, litigation_id
			) values (
				@lFeeID, @lLitigationID
			)
		end
	end

set nocount off

GO

