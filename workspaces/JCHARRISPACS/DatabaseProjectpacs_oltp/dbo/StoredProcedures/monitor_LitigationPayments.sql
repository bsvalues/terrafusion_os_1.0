
    



    



    



    



---here is how you set up the monitor call:  {Call monitor_LitigationPayments ('1/1/2017', '1/31/2017', 1)}    



      

/*

This monitor was written for Benton to provide a list of all payments made to properties
associated with a litigation record.  The inputs are beginning date, ending date and litigation ID. 
The dates are inclusive.

*/

          



          



CREATE procedure [dbo].[monitor_LitigationPayments]          



          



          



@begin_date  datetime,

@end_date datetime,
@litigation_id	int



          



        



as          



          



          



          



set nocount on          



select distinct p.geo_id,
	p.prop_id,
	a.file_as_name,
	l.cause_num,

	ba.balance_dt, 

	b.display_year,

	pmt.payment_id,

	pmt.amount_paid

from bill b with(nolock)

join property p with(nolock)

	on p.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id

join litigation_prop_assoc lpa with(nolock)

	on lpa.prop_id = p.prop_id
join litigation l with(nolock)
	on l.litigation_id = lpa.litigation_id

join coll_transaction ct with(nolock)

	on ct.trans_group_id = b.bill_id

join payment_transaction_assoc pta with(nolock)

	on pta.transaction_id = ct.transaction_id

join payment pmt with(nolock)

	on pmt.payment_id = pta.payment_id

join batch ba with(nolock)

	on ba.batch_id = pmt.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and lpa.litigation_id = @litigation_id

order by pmt.payment_id



set nocount off

GO

