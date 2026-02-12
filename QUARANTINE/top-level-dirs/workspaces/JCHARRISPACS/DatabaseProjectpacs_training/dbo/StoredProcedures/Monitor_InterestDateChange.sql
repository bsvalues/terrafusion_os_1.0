    
/****** This monitor ws written for Benton Treasurer.  This monitor returns the   
payments that were made with a posting date of a different month than the system date
for a specified date range


  Monitor Command  {Call [Monitor_InterestDateChange] ('7/1/2016','8/1/2016')}  ******/    
    
CREATE PROCEDURE [dbo].[Monitor_InterestDateChange]    
    
@begin_date  datetime,    
@end_date  datetime    
    
as    
    
    

select distinct pta.payment_id, pta.prop_id, (pta.year + 1) tax_yr, p.date_paid, p.post_date, 
	ba.batch_id, ba.description, ba.balance_dt, pu.full_name
from payment_transaction_assoc pta with(nolock)
join payment p with(nolock)
	on p.payment_id = pta.payment_id
join pacs_user pu with(nolock)
	on pu.pacs_user_id = p.pacs_user_id
join batch ba with(nolock)
	on ba.batch_id = p.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and datepart(mm, p.date_paid) <> datepart(mm, p.post_date)
order by pta.payment_id, pta.prop_id

GO

