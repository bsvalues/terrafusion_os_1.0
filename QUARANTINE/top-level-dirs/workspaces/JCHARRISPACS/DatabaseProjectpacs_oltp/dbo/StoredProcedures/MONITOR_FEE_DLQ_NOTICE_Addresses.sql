

--- This monitor will provide a list of properties that have a $10.00 DLQ NOTICE FEE
--- for the specified year and with the due date > = than the due date entered 

----- {CALL MONITOR_FEE_DLQ_NOTICE_Addresses ('2021', '10/312022')}


CREATE procedure [dbo].[MONITOR_FEE_DLQ_NOTICE_Addresses]


@year numeric (4,0),
@date datetime

as  

SET NOCOUNT ON   


select fpa.prop_id, p.geo_id, f.year, f.fee_type_cd, f.current_amount_due, f.effective_due_date, p.col_owner_id,  
ac.file_as_name, addr.addr_line1, addr.addr_line2, addr.addr_line3, addr.addr_city, addr.addr_state, addr.addr_zip
from fee f with (nolock)
join fee_prop_assoc fpa with (nolock)
on f.fee_id = fpa.fee_id
join property p with (nolock)
on fpa.prop_id = p.prop_id
join account ac with (nolock)
on p.col_owner_id = ac.acct_id
join address addr with (nolock)
on ac.acct_id = addr.acct_id
and addr.primary_addr = 'Y'
where f.fee_type_cd = 'DLQ NOTICE'
and f.year = @year 
and effective_due_date >= @date

GO

