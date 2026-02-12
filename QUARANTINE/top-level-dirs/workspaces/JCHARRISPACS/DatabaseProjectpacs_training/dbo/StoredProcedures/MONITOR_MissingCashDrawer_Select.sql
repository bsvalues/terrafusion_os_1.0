

CREATE procedure [dbo].[MONITOR_MissingCashDrawer_Select]

/****

This monitor will select payment records in a specified batch where cash drawer id is NULL.

{CALL MONITOR_MissingCashDrawer_Select (4438)}

****/

@batch_id			int

as 


select * from payment
where batch_id = @batch_id
and cash_drawer_id is NULL

GO

