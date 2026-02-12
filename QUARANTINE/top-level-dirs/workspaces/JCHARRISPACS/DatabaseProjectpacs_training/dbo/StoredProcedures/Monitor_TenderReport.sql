
    
/****** This monitor was written for Benton Treasurer.  This monitor returns the   
all tenders within a batch for a given date range and returns subtotals for each batch
and grand totals by tender for each batch and overall

    
  Monitor Command  {Call Monitor_TenderReport ('5/10/2017','5/10/2017')}  ******/    
    
CREATE PROCEDURE [dbo].[Monitor_TenderReport]    
    
@begin_date  datetime,    
@end_date  datetime    
    
as    
    
SET NOCOUNT ON

select  1 as record, ba.balance_dt, ba.batch_id, ba.description, tt.tender_type_desc, sum(t.amount) tender_amount
into #batch_totals
from payment p with(nolock)
join batch ba with(nolock)
	on ba.batch_id = p.batch_id
join tender t with(nolock)
	on t.payment_id = p.payment_id
join tender_type tt with(nolock)
	on tt.tender_type_cd = t.tender_type_cd
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by ba.balance_dt, ba.batch_id, ba.description, tt.tender_type_desc
order by ba.balance_dt, ba.batch_id, tt.tender_type_desc

insert into #batch_totals
select 2 as record, t.balance_dt, t.batch_id, t.description, 'All Tender' as tender_type_desc, sum(tender_amount) tender_amount
from #batch_totals t
group by t.balance_dt, t.batch_id, t.description

insert into #batch_totals
select 3 as record, balance_dt, 9999999 as batch_id, 'All Batches' description, tender_type_desc, sum(tender_amount) tender_amount
from #batch_totals
group by balance_dt, tender_type_desc

insert into #batch_totals
select 4 as record, balance_dt, 9999999 as batch_id, 'All Batches' description, 'All Tenders' as tender_type_desc, sum(tender_amount) tender_amount
from #batch_totals
group by balance_dt

select * from #batch_totals
order by balance_dt, batch_id, record, tender_type_desc

GO

