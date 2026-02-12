




    

    

    

    

---here is how you set up the monitor call:  {Call ChartofAccounts}  

/* 


*/

      

          

          

CREATE procedure [dbo].[ChartofAccounts]          

          

          
        

as          

          

          

          

set nocount on     

     
SELECT DISTINCT fin_account_id, account_number, account_description, account_type_cd
from fin_account
where active = 1
order by account_number


set nocount off

GO

