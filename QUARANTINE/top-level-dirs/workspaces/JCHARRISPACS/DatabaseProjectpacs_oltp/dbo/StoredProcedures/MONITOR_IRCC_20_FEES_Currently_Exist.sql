


Create procedure [dbo].MONITOR_IRCC_20_FEES_Currently_Exist



---- These properties already have the fees already exist for the year specified.
----- {CALL MONITOR_IRCC_20_FEES_Currently_Exist('2021')}



@year numeric (4,0)


as 


---- These properties already have the fees already exist and will not have an IRCC Fee Created on them
---- Provide this listing to the client

 

select fpa.prop_id, f.year, f.fee_type_cd, f.statement_id, f.current_amount_due, f.amount_paid, f.fee_create_date
from fee f
left join fee_prop_assoc fpa
on fpa.fee_id = f.fee_id
where f.fee_type_cd = 'IRCC'
and f.year = @year
order by prop_id

GO

