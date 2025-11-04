
create procedure FiscalTaxCollectionsReport
	@dataset_id int,
	@end_date datetime

as

set nocount on

-- get fiscal years and months containing the transactions that will be reported on
if object_id('tempdb..#fiscal_year') is not null
begin
	drop table #fiscal_year
end

select 
	fy.fiscal_year_id,
	fy.district_id,
	fm_begin.begin_date as fiscal_year_begin_date,
	isnull(fm_end.end_date, '12/31/9999') as fiscal_year_end_date
into #fiscal_year
from fiscal_year as fy with (nolock) 
join tax_district as td with (nolock) on
		td.tax_district_id = fy.district_id
join fiscal_month as fm_begin with (nolock) on
		fm_begin.tax_year = fy.begin_tax_year 
	and fm_begin.tax_month = fy.begin_tax_month
left join fiscal_month as fm_end with (nolock) on
		fm_end.tax_year = fy.end_tax_year 
	and fm_end.tax_month = fy.end_tax_month
where fm_begin.begin_date <= @end_date
	and isnull(fm_end.end_date, '12/31/9999') >= @end_date

create index #ndx_fiscal_year on #fiscal_year(fiscal_year_id, district_id)

if object_id('tempdb..#fiscal_month') is not null
begin
	drop table #fiscal_month
end

select 
	fy.fiscal_year_id,
	fy.district_id,
	fm.tax_month,
	fm.tax_year,
	fm.begin_date,
	isNull(fm.end_date, @end_date) as end_date
into #fiscal_month
from #fiscal_year as fy
join fiscal_month as fm with (nolock) on
		fm.begin_date >= fy.fiscal_year_begin_date
	and fm.begin_date <= @end_date
	and isNull(fm.end_date, @end_date) <= fy.fiscal_year_end_date

create index #ndx_fiscal_month on #fiscal_month(district_id, begin_date, end_date)

-- Since the date provided in (a) doesn't have to fall on the end_date of the last
-- fiscal month, we need to update the end_date of the last fiscal month so that
-- subsequent queries that use the date range will exclude records past the end_date
declare @last_fiscal_month_tax_month int
declare @last_fiscal_month_tax_year numeric(4, 0)

set nocount on
select 
	@last_fiscal_month_tax_month = tax_month,
	@last_fiscal_month_tax_year = tax_year
from fiscal_month with (nolock) 
where begin_date = (
	select max(begin_date) 
	from fiscal_month with (nolock)
	where begin_date <= @end_date
)

update #fiscal_month
set end_date = @end_date
where tax_month = @last_fiscal_month_tax_month
	and tax_year = @last_fiscal_month_tax_year


-- Create a table to store the values we will be collecting
if object_id('tempdb..#values') is not null
begin 
	drop table #values
end

create table #values (
	fiscal_year_id int,
	bill_year int,
	original_balance numeric(14,2),
	receipts numeric(14,2),
	adjustments_up numeric(14,2),
	adjustments_down numeric(14,2),
	ending_balance numeric(14,2)
)

create index #ndx_values on #values(fiscal_year_id, bill_year)

declare @min_pct_id int
select @min_pct_id = min(posted_transaction_id) 
from posted_coll_transaction where effective_date >= (select min(fiscal_year_begin_date) from #fiscal_year)


-- gather values, grouped by fiscal year ID and bill year
insert into #values (
	fiscal_year_id,
	bill_year,
	receipts,
	adjustments_up,
	adjustments_down
)

select 
	fm.fiscal_year_id,
	b.year,
	sum(case when pct.is_adjustment = 0 then pct.base_amount_pd
		else 0 end) as receipts,
	sum(case when pct.is_adjustment = 1 and pct.base_amount > 0 then pct.base_amount 
		else 0 end) as adjustments_up,
	sum(case when pct.is_adjustment = 1 and pct.base_amount < 0 then -pct.base_amount 
		else 0 end) as adjustments_down

from #fiscal_month fm with(nolock)

cross apply (
	select pt.transaction_id, pt.trans_group_id, lbta.fund_id,
		convert(bit, case when tt.core_transaction_type = 3 then 1 else 0 end) is_adjustment,
		sum(pt.base_amount) base_amount, sum(pt.base_amount_pd) base_amount_pd
	from posted_coll_transaction pt with(nolock)

	join transaction_type tt with(nolock)
	on tt.transaction_type = pt.transaction_type
	and tt.core_transaction_type <> 1

	join levy_bill_transaction_assoc as lbta with(nolock) 
	on lbta.posted_transaction_id = pt.posted_transaction_id

	where pt.posted_transaction_id >= @min_pct_id
	and effective_date between fm.begin_date and fm.end_date
	
	group by pt.transaction_id, pt.trans_group_id, lbta.fund_id,
		convert(bit, case when tt.core_transaction_type = 3 then 1 else 0 end) 
) pct

join levy_bill lb with(nolock)
on lb.tax_district_id = fm.district_id
and lb.bill_id = pct.trans_group_id

join bill b with(nolock)
on b.bill_id = lb.bill_id

join fund f with(nolock)
on f.[year] = lb.[year]
and f.tax_district_id = lb.tax_district_id
and f.levy_cd = lb.levy_cd
and f.fund_id = pct.fund_id

group by fm.fiscal_year_id, b.year 


-- fill in the fiscal years where no collections activity occurred
insert into #values (
	fiscal_year_id,
	bill_year,
	receipts,
	adjustments_up,
	adjustments_down
)
select distinct
	fm.fiscal_year_id,
	bb.collection_year,
	0 as receipts,
	0 as adjustments_up,
	0 as adjustments_down

from #fiscal_month as fm with(nolock)

join fiscal_year_collection_year_begin_balance_due bb
on bb.fiscal_year_id = fm.fiscal_year_id

where not exists (
	select 1 from #values v
	where v.fiscal_year_id = fm.fiscal_year_id
	and v.bill_year = bb.collection_year
)


-- add original balances
update v
set original_balance = isnull(bb.balance_due, 0)
from #values v
left join fiscal_year_collection_year_begin_balance_due bb with(nolock)
on v.fiscal_year_id = bb.fiscal_year_id
and v.bill_year = bb.collection_year

-- add ending balances
update #values
set ending_balance = original_balance + adjustments_up - receipts - adjustments_down


-- arrange the data and insert it into the report table
declare @max_year int
select @max_year = max(bill_year) from #values

if @max_year is null 
	set @max_year = datepart(year, @end_date)

declare @rollup_year int
set @rollup_year = @max_year - 5

delete ##fiscal_tax_collections
where dataset_id = @dataset_id

-- rollup year
insert ##fiscal_tax_collections
(dataset_id, group_by, year_due, uncollected_balance_begin, additions_balance,
	collections_balance, cancellations_balance, uncollected_balance_end)
select @dataset_id, 1, convert(varchar(5), @rollup_year +1) + ' and all prior',
	isnull(sum(original_balance),0), isnull(sum(adjustments_up),0), 
	isnull(sum(receipts),0), isnull(sum(adjustments_down),0), isnull(sum(ending_balance),0)
from #values v
where bill_year <= @rollup_year

-- other years
insert ##fiscal_tax_collections
(dataset_id, group_by, year_due, uncollected_balance_begin, additions_balance,
	collections_balance, cancellations_balance, uncollected_balance_end)
select @dataset_id, case when bill_year = @max_year then 2 else 1 end,
	convert(varchar(5), bill_year +1) + ' Roll',
	isnull(sum(original_balance),0), isnull(sum(adjustments_up),0), 
	isnull(sum(receipts),0), isnull(sum(adjustments_down),0), isnull(sum(ending_balance),0)
from #values v
where bill_year > @rollup_year
group by bill_year

GO

