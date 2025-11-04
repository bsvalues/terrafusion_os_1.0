

---here is how you set up the monitor call:  {Call monitor_Supplements}    

     



CREATE procedure [dbo].[monitor_Supplements]



          



        



as          



             



set nocount on     

select sup_group_id,sup_group_desc, 
sup_create_dt, sup_accept_dt, sup_accept_by_id, 
sup_bills_created_by_id,sup_bill_Create_dt,status_cd 
from sup_group

GO

