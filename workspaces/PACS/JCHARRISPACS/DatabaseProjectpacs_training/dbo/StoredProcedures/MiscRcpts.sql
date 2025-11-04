

    

    

    

    

---here is how you set up the monitor call:  {Call MiscRcpts ('1/1/2017', '1/31/2017')}    

      

          

          

CREATE procedure [dbo].[MiscRcpts]          

          

          

@begin_date  datetime,
@end_date datetime          

          

        

as          

          

          

          

set nocount on          

          
select fm.fee_id,
		fm.description,
		case when p.payment_code = 'vp' then -1*fm.amount else fm.amount end as amount,
		pta.voided as payment_voided,
		p.payment_id,
		p.receipt_num,
		p.payee_name,
		p.amount_paid,
		p.batch_id,
		fa.account_number,
		fa.account_description,
		ba.balance_dt
  FROM [fee_misc_rcpt_detail] fm
  join coll_transaction ct on
  fm.fee_id = ct.trans_group_id
  join payment_transaction_assoc pta on
  ct.transaction_id = pta.transaction_id
  join payment p on 
  pta.payment_id = p.payment_id
  join fin_account fa on
  fm.fin_account_id = fa.fin_account_id
  join batch ba on
  ba.batch_id = ct.batch_id
  where ba.balance_dt >= @begin_date
  and ba.balance_dt <= @end_date

set nocount off

GO

