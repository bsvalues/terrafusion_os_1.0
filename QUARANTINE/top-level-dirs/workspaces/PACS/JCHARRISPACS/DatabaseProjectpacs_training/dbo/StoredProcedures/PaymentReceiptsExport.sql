
        
        
        
        
        
        
---here is how you set up the monitor call:  {Call PaymentReceiptsExport (1862)}        
              
              
CREATE PROCEDURE [dbo].[PaymentReceiptsExport]              
              
              
@distribution_id  int              
              
   /* 

   JW
   
   Edited for Benton 2/24/2017 per Sam and Teri request     
   
   Currently the distribution export for Benton is handled thru a monitor the following monitors are what is used for Payments and Misc. Receipts
1.	Misc. Receipts Export
2.	Payments Receipts Export
 
For the Payments Receipts Export all cash entries need to be striped—the GL handles these transactions as part of the upload process.  Cash transactions are all entries which are ID 0000101.111.10—ID 7902
Also for the Payment Receipts Export any entry related to ID 8666,8667,8668,8669,8664,8670 should be coded as an B in the export file rather than an R
      
Also converted debit amounts to negative numbers...


4/10/2017: Barb modified the script to exclude another cash account (8852: 0128101.111.10) per HS 169362.
 */             
              
as              
              
              
              
set nocount on              
              
        
select         
    
(        
case when fin_event_cd like 'TD-RCPT' then 'crtaxes'     
 when fin_event_cd like 'SA-RCPT' then 'crtaxes'    
 else 'cr'  end + char(124) +        
 convert(varchar, transaction_date, 101) + char(124) +        
 'GLExport PACS' + char(124) +        
 'informix' + char(124) +         
 '' + char(124) +        
 convert(varchar, transaction_date, 101) + char(124) +        
 ''  + char(124) +        
 'N' + char(124) +         
 'Y' + char(124) +        
 case when ft.fin_account_id in ( 8666,8667,8668,8669,8664,8670  )then 'B' else 'R' end + char(124) +        
 fa.account_number + char(124) +        
 '' + char(124) +        
 case when ft.debit_amount is not NULL then cast(ft.debit_amount*-1 as varchar(20))        
   else cast(ft.credit_amount as varchar(20)) end   + char(124) +          
 ''   + char(124) +         
 'O' + char(124) +        
 '' + char(124) +        
 ''        
)        
--select *
from fin_transaction ft with(nolock)          
join fin_account fa with(nolock)          
 on fa.fin_account_id = ft.fin_account_id        
where 1=1
and ft.create_process_id = @distribution_id        
and ft.fin_account_id not in (-1, 7902, 8852)       

/*

orignial select jw 2/24/2017

select         
    
(        
case when fin_event_cd like 'TD-RCPT' then 'crtaxes'     
 when fin_event_cd like 'SA-RCPT' then 'crtaxes'    
 else 'cr'  end + char(124) +        
 convert(varchar, transaction_date, 101) + char(124) +        
 'GLExport PACS' + char(124) +        
 'informix' + char(124) +         
 '' + char(124) +        
 convert(varchar, transaction_date, 101) + char(124) +        
 ''  + char(124) +        
 'N' + char(124) +         
 'Y' + char(124) +        
'R'  + char(124) +        
 fa.account_number + char(124) +        
 '' + char(124) +        
 case when ft.debit_amount is not NULL then cast(ft.debit_amount as varchar(20))        
   else cast(ft.credit_amount as varchar(20)) end   + char(124) +          
 ''   + char(124) +         
 'O' + char(124) +        
 '' + char(124) +        
 ''        
)        
from fin_transaction ft with(nolock)          
join fin_account fa with(nolock)          
 on fa.fin_account_id = ft.fin_account_id        
where ft.create_process_id = @distribution_id        
--and ft.fin_account_id not in (-1, 2320)        

*/ 
        
        
        
set nocount off

GO

