

create procedure FeeGetIDs
	@lFeeID int
as

set nocount on

	select
		isnull(fpa.prop_id, 0),
		isnull(faa.acct_id, 0),
		isnull(fla.litigation_id, 0)
	from fee as f with(nolock)
	left outer join fee_prop_assoc as fpa with(nolock) on
		f.fee_id = fpa.fee_id
	left outer join fee_acct_assoc as faa with(nolock) on
		f.fee_id = faa.fee_id
	left outer join fee_litigation_assoc as fla with(nolock) on
		f.fee_id = fla.fee_id
	where
		f.fee_id = @lFeeID

set nocount off

GO

