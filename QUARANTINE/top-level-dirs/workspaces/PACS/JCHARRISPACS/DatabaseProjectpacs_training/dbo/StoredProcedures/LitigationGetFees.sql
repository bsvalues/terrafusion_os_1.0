
create procedure LitigationGetFees
	@lLitigationID int
as

	select
		fla.fee_id,
		f.year,
		f.fee_create_date,
		f.fee_type_cd,
		isnull(current_amount_due,0) as fee_balance
	from fee_litigation_assoc as fla with(nolock)
	join fee as f with(nolock) on
		fla.fee_id = f.fee_id
	where
		fla.litigation_id = @lLitigationID
	order by
		fla.fee_id

GO

