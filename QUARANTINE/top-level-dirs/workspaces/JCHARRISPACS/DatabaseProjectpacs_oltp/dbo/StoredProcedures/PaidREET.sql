

    



    



    



    



---here is how you set up the monitor call:  {Call PaidREET ('1/1/2017', '1/31/2017')}    



      



          



          



CREATE procedure [dbo].[PaidREET]          



          



          



@begin_date  datetime,

@end_date datetime          



          



        



as          



          



          



          



set nocount on          



    select p.geo_id,

	r.excise_number,

	r.sale_date,
	
	isnull(s.name, 'NO SELLER SPECIFIED') as seller_name,

	s.addr_line1 as seller_addr1,

	s.addr_line2 as seller_addr2,

	s.addr_line3 as seller_addr3,

	s.addr_city as seller_city,

	s.addr_state as seller_state,

	s.addr_zip as seller_zip,

	isnull(b.name, 'NO BUYER SPECIFIED') as buyer_name,

	b.addr_line1 as buyer_addr1,

	b.addr_line2 as buyer_addr2,

	b.addr_line3 as buyer_addr3,

	b.addr_city as buyer_city,

	b.addr_state as buyer_state,

	b.addr_zip as buyer_zip,

	r.sale_price as sale_amount,

	r.excise_amount_paid

from reet r with(nolock)

join reet_import_property rip with(nolock)

	on r.reet_id = rip.reet_id

join property p with(nolock)

	on p.prop_id = rip.prop_id

left join reet_import_account s with(nolock)

	on s.reet_id = r.reet_id

	and s.account_type_cd = 'S'

left join reet_import_account b with(nolock)

	on b.reet_id = r.reet_id

	and b.account_type_cd = 'B'

join payment pmt with(nolock)

	on pmt.payment_id = r.payment_id

join batch ba with(nolock)

	on ba.batch_id = pmt.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and r.excise_number is not NULL

order by r.excise_number



set nocount off

GO

