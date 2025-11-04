
create procedure AnnualFinancialReport
	@dataset_id int,
	@end_date datetime

as

--declare @dataset_id int
--declare @end_date datetime
--set @dataset_id = 99990
--set @end_date = '6/30/2009'

set nocount on

declare @year int
set @year = year(@end_date) - 1

declare @begin_date datetime
set @begin_date = dateadd(year, year(@end_date) - 1980, '1/1/1980')


-- values table
if object_id('tempdb..#values') is not null
begin 
	drop table #values
end

create table #values (
	fund_id int,
	levy_cd varchar(10),
	bill_year numeric(4,0),
	tax_district_id int,

	tax_district_type_priority int,
	tax_district_type_desc varchar(50),
	account_number varchar(259),
	fund_description varchar(50),
	levy_rate numeric(13,10),

	original_balance numeric(14,2),
	levied numeric(14,2),
	receipts numeric(14,2),
	adjustments_up numeric(14,2),
	adjustments_down numeric(14,2),
	ending_balance numeric(14,2)
)

-- generate values
insert into #values (
	fund_id, levy_cd, bill_year, tax_district_id,
	levied, receipts, adjustments_up, adjustments_down
)

select lbta.fund_id, lb.levy_cd, lb.year, lb.tax_district_id,

sum(
	case when tt.core_transaction_type = 1	
	then isnull(pct.base_amount, 0) 
	else 0 end
) as levied,

sum(
	case when tt.core_transaction_type in (2, 4)
	then pct.base_amount_pd else 0 end
) as receipts,

sum(
	case when tt.core_transaction_type = 3 and isnull(pct.base_amount, 0) > 0	
	then pct.base_amount 
	else 0 end
) as adjustments_up,

sum(
	case when tt.core_transaction_type = 3 and isnull(pct.base_amount, 0) < 0
	then -pct.base_amount 
	else 0 end
) as adjustments_down

from posted_coll_transaction pct with(nolock) 

join levy_bill lb with(nolock)
on lb.bill_id = pct.trans_group_id

join levy_bill_transaction_assoc lbta with(nolock)
on lbta.posted_transaction_id = pct.posted_transaction_id

join transaction_type tt with(nolock)
on tt.transaction_type = pct.transaction_type

where pct.effective_date between @begin_date and @end_date
group by lbta.fund_id, lb.levy_cd, lb.year, lb.tax_district_id


-- original balances table
if object_id('tempdb..#original_balances') is not null
begin 
	drop table #original_balances
end

create table #original_balances (
	fund_id int,
	levy_cd varchar(10),
	bill_year numeric(4,0),
	tax_district_id int,

	original_balance numeric(14,2),
)


-- original balances
insert into #original_balances (
	fund_id, levy_cd, bill_year, tax_district_id, original_balance
)

select lbta.fund_id, lb.levy_cd, lb.year, lb.tax_district_id,
sum(pct.base_amount - pct.base_amount_pd) as original

from posted_coll_transaction pct with(nolock) 

join levy_bill lb with(nolock)
on lb.bill_id = pct.trans_group_id

join levy_bill_transaction_assoc lbta with(nolock)
on lbta.posted_transaction_id = pct.posted_transaction_id

where pct.effective_date < @begin_date

group by lbta.fund_id, lb.levy_cd, lb.year, lb.tax_district_id


-- create value rows for keys that had original balances but no transactions
insert into #values (
	fund_id, levy_cd, bill_year, tax_district_id,
	levied, receipts, adjustments_up, adjustments_down
)

select fund_id, levy_cd, bill_year, tax_district_id,
	0, 0, 0, 0

from #original_balances ob

where not exists
(
	select 1 from #values v
	where v.fund_id = ob.fund_id
	and v.levy_cd = ob.levy_cd
	and v.bill_year = ob.bill_year
	and v.tax_district_id = ob.tax_district_id
)


-- copy original balances into the values
update v
set original_balance = ob.original_balance
from #values v
join #original_balances ob
on v.fund_id = ob.fund_id
and v.levy_cd = ob.levy_cd
and v.bill_year = ob.bill_year
and v.tax_district_id = ob.tax_district_id


-- fix null values
update #values set 
	levy_rate = isnull(levy_rate, 0),
	original_balance = isnull(original_balance, 0),
	levied = isnull(levied, 0),
	receipts = isnull(receipts, 0),
	adjustments_up = isnull(adjustments_up, 0),
	adjustments_down = isnull(adjustments_down, 0)

-- ending balances
update #values
set ending_balance = original_balance + levied - receipts + adjustments_up - adjustments_down

-- fund description
update v
set fund_description = f.fund_description
from #values v

join fund f with(nolock)
on f.year = v.bill_year
and f.tax_district_id = v.tax_district_id
and f.levy_cd = v.levy_cd
and f.fund_id = v.fund_id

-- tax district type
update v
set tax_district_type_priority = tdt.priority,
	tax_district_type_desc = tdt.tax_district_desc
from #values v

join tax_district td with(nolock)
on td.tax_district_id = v.tax_district_id

join tax_district_type tdt with(nolock)
on td.tax_district_type_cd = tdt.tax_district_type_cd

-- levy rate
update v
set levy_rate = l.levy_rate
from #values v

cross apply
(
	select top 1 levy_rate, year
	from levy with(nolock)
	where levy.tax_district_id = v.tax_district_id
	and levy.levy_cd = v.levy_cd
	and levy.year < year(@end_date)
	and levy_rate is not null
	order by levy.year desc
) l

-- account number
update v
set account_number = fa.account_number
from #values v

join fin_event_fund_assoc fefa with(nolock)
on fefa.levy_cd = v.levy_cd
and fefa.year = v.bill_year
and fefa.tax_district_id = v.tax_district_id
and fefa.event_cd = 'TD-RCPT'
and fefa.is_primary_account = 1
and fefa.fund_id = v.fund_id

join fin_account fa with(nolock)
on fa.fin_account_id = fefa.fin_account_id

-- trim account numbers to just the first segment
update #values
set account_number = case when charindex('.', account_number) > 0
	then left(account_number, charindex('.', account_number) - 1) 
	else account_number end

update #values
set account_number = case when isnumeric(account_number) = 1 then account_number else '0' end

-- copy values to the report table
delete ##annual_financial_report
where dataset_id = @dataset_id

insert ##annual_financial_report
(dataset_id, year, tax_district_desc, priority, 
	fi_account_id, fund_description, 
	balance_due, levy_rate, initial_amount_due, base_amount_pd,
	tax_adj_increase, tax_adj_decrease, end_year_balance_due)

select @dataset_id, year(@end_date), tax_district_type_desc, tax_district_type_priority, 
	account_number, fund_description,
	sum(original_balance), levy_rate, sum(levied), sum(receipts),
	sum(adjustments_up), sum(adjustments_down), sum(ending_balance)

from #values v
group by tax_district_type_priority, tax_district_type_desc, account_number, fund_description, levy_rate
order by tax_district_type_priority

--select * from ##annual_financial_report
--where dataset_id = @dataset_id
--order by priority

GO

