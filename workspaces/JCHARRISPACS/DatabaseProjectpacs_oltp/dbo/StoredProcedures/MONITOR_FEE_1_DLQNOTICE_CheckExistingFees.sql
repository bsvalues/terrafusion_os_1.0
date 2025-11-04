




CREATE procedure [dbo].[MONITOR_FEE_1_DLQNOTICE_CheckExistingFees]



--- This monitor will provide a list of properties that will need to add the $10.00 DLQ NOTICE FEE
--- FOR Props that DO NOT have a Benton Irrigation Dist SA Bill on them that are due
----- {CALL MONITOR_FEE_1_DLQNOTICE_CheckExistingFees('2021', '05/01/2022')}


@year numeric (4,0),
@date datetime


as 


Select fpa.prop_id, f.fee_type_cd, f.year, f.current_amount_due, f.effective_due_date, f.last_modified
from fee_prop_assoc fpa with (nolock)
join fee f with (nolock)
on fpa.fee_id = f.fee_id
where f.year = @year ------- Not Display Year
and f.fee_type_cd = 'DLQ NOTICE'
and effective_due_date > = @date 
order by fpa.prop_id

GO

