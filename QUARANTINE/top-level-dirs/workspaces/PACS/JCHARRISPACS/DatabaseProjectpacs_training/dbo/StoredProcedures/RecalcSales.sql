
CREATE PROCEDURE RecalcSales
	@prop_id int,
	@sup_yr  numeric(4,0),
	@sup_num int,
	@sale_id int
AS 

	exec dbo.RecalcProperty @prop_id, @sup_yr, @sup_num, 'F', 0, 0, 0, @sale_id

GO

