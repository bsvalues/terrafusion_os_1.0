    



    



    



    



---here is how you set up the monitor call:  {Call MiscReceiptsExport (1862)}    



      



          



          



CREATE procedure [dbo].[MiscReceiptsExport_ORIG]          



          



          



@distribution_id  int          



          



          



    /* edited for benton 2/24/2017 jw



	



	show actual recpt number







	convert debits to negative numbers







	edited 2/28/2017 jw field 2 is now recpt number too. 



	



	*/      



          



as          



          



          



          



set nocount on          



          



select     







 ('gr' + char(124) + 'RCT# ' + cast(pta.payment_id as varchar(9)) + char(124) +     



 'GLexport PACS'  + char(124) + 'informix'  + char(124) + ''  + char(124) +       



convert(varchar, ft.transaction_date, 101)  + char(124) + ''  + char(124) +       



'N'  + char(124) + 'Y'  + char(124) + 'R'  + char(124) +     



 fa.account_number  + char(124) + 'RCT# ' + cast(pta.payment_id as varchar(9))  + char(124) +      



 case when ft.debit_amount is not NULL then cast(ft.debit_amount*-1 as varchar(20))    



  else cast(ft.credit_amount as varchar(20)) end   + char(124) +      



  'O'  + char(124) + ''  + char(124) + ''  + char(124) + '' )     



from fin_transaction ft with(nolock)      



join fin_account fa with(nolock)      



 on fa.fin_account_id = ft.fin_account_id    



join payment_transaction_assoc pta with(nolock)    



      on pta.treasurer_rcpt_number = ft.reference_id    

join coll_transaction ct with(nolock)
	on ct.transaction_id = pta.transaction_id

join fee f with(nolock)
	on f.fee_id = ct.trans_group_id 

where 1=1



and ft.create_process_id = @distribution_id    



--and ft.fin_account_id not in (-1, 2320)    



    



set nocount off          







/*







original 







      



select     







 ('cr' + char(124) + 'RCT# ' + cast(ft.reference_id as varchar(9)) + char(124) +     



 'GLexport PACS'  + char(124) + 'informix'  + char(124) + ''  + char(124) +       



convert(varchar, transaction_date, 101)  + char(124) + ''  + char(124) +       



'N'  + char(124) + 'Y'  + char(124) + 'R'  + char(124) +     



 fa.account_number  + char(124) + 'RCT# ' + cast(ft.reference_id as varchar(9))  + char(124) +      



 case when ft.debit_amount is not NULL then cast(ft.debit_amount as varchar(20))    



  else cast(ft.credit_amount as varchar(20)) end   + char(124) +      



  'O'  + char(124) + ''  + char(124) + ''  + char(124) + '' )     



from fin_transaction ft with(nolock)      



join fin_account fa with(nolock)      



 on fa.fin_account_id = ft.fin_account_id    



join payment_transaction_assoc pta with(nolock)    



      on pta.treasurer_rcpt_number = ft.reference_id    



where ft.create_process_id = @distribution_id    



--and ft.fin_account_id not in (-1, 2320)    







*/

GO

