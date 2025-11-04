


    



    



    



    



---here is how you set up the monitor call:  {Call OverpaymentCreditByUser ('12/8/2016')}    



      



          



          



CREATE procedure [dbo].[OverpaymentCreditByUser]          



          



          



@begin_date		datetime,
@end_date		datetime



          



          



          



          



as          



          



          



          



set nocount on          



          



		  



select opc.prop_id, opc.acct_id, p.payment_id, r.refund_id, ba.balance_dt, pu.pacs_user_name, ct.transaction_type, ct.base_amount_pd,
	ct.other_amount_pd remit_interest



from coll_transaction ct with(nolock)



join overpayment_credit opc with(nolock)



	on opc.overpmt_credit_id = ct.trans_group_id



join trans_group tg with(nolock)



	on tg.trans_group_id = ct.trans_group_id 



left join payment_transaction_assoc pta with(nolock)



	on pta.transaction_id = ct.transaction_id



left join payment p with(nolock)



	on p.payment_id = pta.payment_id
left join refund_transaction_assoc rta with(nolock)
	on rta.transaction_id = ct.transaction_id
left join refund r with(nolock)
	on r.refund_id = rta.refund_id



join batch ba with(nolock)



	on ba.batch_id = ct.batch_id



join pacs_user pu with(nolock)



	on pu.pacs_user_id = ct.pacs_user_id



where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date



order by pacs_user_name, ct.transaction_id











set nocount off

GO

