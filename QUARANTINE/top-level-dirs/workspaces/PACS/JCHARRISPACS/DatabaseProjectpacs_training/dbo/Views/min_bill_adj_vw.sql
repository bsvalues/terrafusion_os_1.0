
create view min_bill_adj_vw
as

	select
		bill_id,
		bill_adj_id = min(bill_adj_id)
	from bill_adjustment
	group by bill_id

GO

