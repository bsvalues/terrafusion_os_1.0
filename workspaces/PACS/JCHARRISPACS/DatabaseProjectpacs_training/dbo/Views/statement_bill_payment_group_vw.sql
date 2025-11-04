
create view dbo.statement_bill_payment_group_vw
with schemabinding
as
	select
		year = isnull(b.year, 0),
		statement_id = isnull(b.statement_id, 0),
		payment_group_id = isnull(b.payment_group_id, 0),
		cnt = count_big(*)
	from dbo.bill as b
	where b.statement_id > 0
	group by isnull(b.year, 0), isnull(b.statement_id, 0), isnull(b.payment_group_id, 0)

GO

CREATE UNIQUE CLUSTERED INDEX [idx_statement_bill_payment_group_vw]
    ON [dbo].[statement_bill_payment_group_vw]([year] ASC, [statement_id] ASC, [payment_group_id] ASC) WITH (FILLFACTOR = 90);


GO
ALTER INDEX [idx_statement_bill_payment_group_vw]
    ON [dbo].[statement_bill_payment_group_vw] DISABLE;


GO

