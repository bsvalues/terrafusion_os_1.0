
---here is how you set up the monitor call:  {Call monitorRefundByCheckNum}    

/*

This monitor was written for Benton to provide a list of all payments made to properties
associated with a litigation record.  The inputs are beginning date, ending date and litigation ID. 
The dates are inclusive.

*/


CREATE  procedure [dbo].[Call monitorRefundByCheckNum]       


@stc	varchar(1000)


as          


--set nocount on          

select distinct r.check_number, r.refund_date, r.refund_amount, 
r.refund_to_name, r.refund_to_address1,r.refund_to_address2,
r.refund_to_address3, r.refund_to_city, r.refund_to_state,
r.refund_to_zip, r.refund_to_country_cd, p.geo_id
from refund r with (nolock)
	inner join refund_transaction_assoc rta with (nolock)
	on r.refund_id = rta.refund_id
	inner join property p with (nolock)
	on rta.prop_id = p.prop_id
where r.check_number = @stc

GO

