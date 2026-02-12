


CREATE procedure [dbo].[monitor_refundstatus]


@mincheck	varchar(1000),

@maxcheck	varchar(1000)

as  

SET NOCOUNT ON   


select distinct r.check_number, r.refund_amount, r.status,r.refund_date, rta.prop_id
from refund r
join refund_transaction_assoc rta
on r.refund_id = rta.refund_id
where r.voided = 0
and r.check_number >=  @mincheck
and check_number <= @maxcheck
--and r.check_number between @mincheck and @maxcheck
and r.orig_refund_id is NULL
order by r.check_number

GO

