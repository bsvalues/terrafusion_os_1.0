    

    

    

    

---here is how you set up the monitor call:  {Call TendersByBalanceDt ('12/16/2016', '12/31/2016')}    

      
/* 

Created this temp table to hold the data.

create table monitor_tenders
(
pacs_user_id			int,
pacs_user_name			varchar(30),
tender_type_cd			varchar(50),
tender_type_desc		varchar(255),
amount					numeric(14,2),
balance_dt				datetime
)

*/
          

          

CREATE procedure [dbo].[TendersByBalanceDt]          
         

          

@begin_date datetime,
@end_date datetime


as          
          

set nocount on    

set Ansi_warnings off

delete from monitor_tenders


insert into monitor_tenders
select pu.pacs_user_id, pu.pacs_user_name, t.tender_type_cd, tt.tender_type_desc,
	sum(t.amount) amount, ba.balance_dt 
from payment p with(nolock)
join tender t with(nolock)
	on t.payment_id = p.payment_id
join tender_type tt with(nolock)
	on tt.tender_type_cd = t.tender_type_cd
join batch ba with(Nolock)
	on ba.batch_id = p.batch_id
join pacs_user pu with(nolock)
	on pu.pacs_user_id = p.pacs_user_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by pu.pacs_user_id, pu.pacs_user_name, t.tender_type_cd, tt.tender_type_desc, ba.balance_dt
order by pu.pacs_user_name


insert into monitor_tenders
select '', 'Grand Totals', '', '', sum(t.amount), NULL
from payment p with(nolock)
join tender t with(nolock)
	on t.payment_id = p.payment_id
join tender_type tt with(nolock)
	on tt.tender_type_cd = t.tender_type_cd
join batch ba with(Nolock)
	on ba.batch_id = p.batch_id
join pacs_user pu with(nolock)
	on pu.pacs_user_id = p.pacs_user_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date

select * from monitor_tenders

set nocount off

GO

