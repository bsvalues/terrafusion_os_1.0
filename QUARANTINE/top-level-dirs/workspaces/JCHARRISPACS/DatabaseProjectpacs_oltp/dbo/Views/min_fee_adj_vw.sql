
create view min_fee_adj_vw
as

	select
		fee_id,
		fee_adj_id = min(fee_adj_id)
	from fee_adjustment
	group by fee_id

GO

