
create view dbo.statement_fee_payment_group_vw
with schemabinding
as
	select
		year = isnull(f.year, 0),
		statement_id = isnull(f.statement_id, 0),
		payment_group_id = isnull(f.payment_group_id, 0),
		cnt = count_big(*)
	from dbo.fee as f
	where f.statement_id > 0
	group by isnull(f.year, 0), isnull(f.statement_id, 0), isnull(f.payment_group_id, 0)

GO

CREATE UNIQUE CLUSTERED INDEX [idx_statement_fee_payment_group_vw]
    ON [dbo].[statement_fee_payment_group_vw]([year] ASC, [statement_id] ASC, [payment_group_id] ASC) WITH (FILLFACTOR = 90);


GO

