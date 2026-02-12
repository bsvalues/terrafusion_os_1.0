



CREATE procedure [dbo].[MONITOR_MissingCashDrawer_Update]

/****

This monitor will update payment records in a specified batch to a specified cash drawer ID if the cash drawer id is NULL.

{CALL MONITOR_MissingCashDrawer_Update (4438, 1255)}

****/

@batch_id			int,
@cash_drawer_id		int

as 

SET NOCOUNT ON

SET ANSI_WARNINGS OFF

begin

if exists (select * from cash_drawer 

			where drawer_id = @cash_drawer_id
			and close_dt is not NULL)

	select 'CASH DRAWER IS CLOSED. PLEASE SELECT OPEN DRAWER.' as result

	
else 

	
	
		update payment
		set cash_drawer_id = @cash_drawer_id
		where batch_id = @batch_id
		and cash_drawer_id is NULL

		select 'SUCCESS' as result

	

end

GO

