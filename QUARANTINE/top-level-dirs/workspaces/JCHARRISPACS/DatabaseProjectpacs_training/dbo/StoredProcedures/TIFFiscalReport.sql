
create procedure dbo.TIFFiscalReport
	@dataset_id int,
	@end_date datetime,
	@filter_tif_areas varchar(max) = null
as

set nocount on

-- select LTIF Areas for the report
delete ##tif_fiscal
where dataset_id = @dataset_id

insert ##tif_fiscal
(dataset_id, tif_area_id, tif_area_name)
select @dataset_id, ta.tif_area_id, ta.name
from tif_area ta with(nolock)
where (@filter_tif_areas is null or ta.tif_area_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_tif_areas)))

-- make a table of active sponsoring levies for those TIF areas
if object_id('tempdb..#fiscal_levies') is not null
	drop table #fiscal_levies

create table #fiscal_levies
(
	tif_area_id int,
	year numeric(4,0),
	tax_district_id int,
	levy_cd varchar(10)
)

insert #fiscal_levies 
(tif_area_id, year, tax_district_id, levy_cd)

select tal.tif_area_id, tal.year, tal.linked_tax_district_id tax_district_id, tal.linked_levy_cd levy_cd
from ##tif_fiscal tf
join tif_area_levy tal with(nolock)
	on tf.tif_area_id = tal.tif_area_id
where tf.dataset_id = @dataset_id
and linked_tax_district_id is not null
and linked_levy_cd is not null

create index #ndx_fiscal_levies on #fiscal_levies (tif_area_id, year, tax_district_id, levy_cd)


-- remove any TIF areas with no levies to report on
delete tf
from ##tif_fiscal tf
where not exists(
	select 1 from #fiscal_levies fl
	where tf.tif_area_id = fl.tif_area_id
)


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
	drop table #values

create table #values (
	tif_area_id int,
	fiscal_year_id int,
	tax_district_id int,
	levy_cd varchar(10),
	bill_year int,
	original_balance numeric(14,2),
	receipts numeric(14,2),
	adjustments_up numeric(14,2),
	adjustments_down numeric(14,2),
	ending_balance numeric(14,2)
)

create index #ndx_values on #values(tif_area_id, fiscal_year_id, bill_year)

declare @min_pct_id int
select @min_pct_id = min(posted_transaction_id) 
from posted_coll_transaction where effective_date >= (select min(fiscal_year_begin_date) from #fiscal_year)


-- gather values, grouped by TIF area ID, fiscal year ID, and bill year
insert into #values (
	tif_area_id,
	fiscal_year_id,
	tax_district_id,
	levy_cd,
	bill_year,
	receipts,
	adjustments_up,
	adjustments_down
)

select 
	fl.tif_area_id,
	fm.fiscal_year_id,
	lb.tax_district_id,
	lb.levy_cd,
	lb.year,
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
on lb.bill_id = pct.trans_group_id
and lb.tax_district_id = fm.district_id

join #fiscal_levies fl with(nolock)
on fl.year = lb.year
and fl.tax_district_id = lb.tax_district_id
and fl.levy_cd = lb.levy_cd

join bill b with(nolock)
on b.bill_id = lb.bill_id

join fund f with(nolock)
on f.[year] = lb.[year]
and f.tax_district_id = lb.tax_district_id
and f.levy_cd = lb.levy_cd
and f.fund_id = pct.fund_id

where exists (
	select 1 from tif_area_prop_assoc tapa with(nolock)
	where tapa.tif_area_id = fl.tif_area_id
	and tapa.prop_id = b.prop_id
	and tapa.year = b.year
)

group by fl.tif_area_id, fm.fiscal_year_id, lb.tax_district_id, lb.levy_cd, lb.year 



-- fill in the fiscal years where no collections activity occurred
insert into #values (
	tif_area_id,
	fiscal_year_id,
	tax_district_id,
	levy_cd,
	bill_year,
	receipts,
	adjustments_up,
	adjustments_down
)
select distinct
	fl.tif_area_id,
	fm.fiscal_year_id,
	fl.tax_district_id,
	fl.levy_cd,
	bbl.collection_year,
	0 as receipts,
	0 as adjustments_up,
	0 as adjustments_down
from #fiscal_month as fm with(nolock)

join fiscal_year_collection_year_begin_balance_due_levy bbl with(nolock)
on bbl.fiscal_year_id = fm.fiscal_year_id

join #fiscal_levies fl
on fl.levy_cd = bbl.levy_cd
and fl.year = collection_year

where not exists (
	select 1 from #values v
	where v.tif_area_id = fl.tif_area_id 
	and v.fiscal_year_id = fm.fiscal_year_id
	and v.tax_district_id = fl.tax_district_id
	and v.levy_cd = fl.levy_cd
	and v.bill_year = bbl.collection_year
)


-- add original balances
update v
set original_balance = isnull(bbl.balance_due, 0)
from #values v
left join fiscal_year_collection_year_begin_balance_due_levy bbl with(nolock)
on v.fiscal_year_id = bbl.fiscal_year_id
and v.bill_year = bbl.collection_year
and v.levy_cd = bbl.levy_cd


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

delete ##tif_fiscal_area
where dataset_id = @dataset_id

-- rollup year
insert ##tif_fiscal_area
(dataset_id, tif_area_id, year_due, group_by, 
	uncollected_balance_begin, additions_balance,
	collections_balance, cancellations_balance, uncollected_balance_end)
select @dataset_id, v.tif_area_id, convert(varchar(5), @rollup_year + 1) + ' and all prior', 1, 
	isnull(sum(original_balance), 0), isnull(sum(adjustments_up), 0), 
	isnull(sum(receipts), 0), isnull(sum(adjustments_down), 0), isnull(sum(ending_balance), 0)
from #values v
where v.bill_year <= @rollup_year
group by v.tif_area_id

-- other years
insert ##tif_fiscal_area
(dataset_id, tif_area_id, year_due, group_by, 
	uncollected_balance_begin, additions_balance,
	collections_balance, cancellations_balance, uncollected_balance_end)
select @dataset_id, v.tif_area_id,
	convert(varchar(5), bill_year + 1) + ' Roll',
	case when bill_year = @max_year then 2 else 1 end,
	isnull(sum(original_balance),0), isnull(sum(adjustments_up),0), 
	isnull(sum(receipts),0), isnull(sum(adjustments_down),0), isnull(sum(ending_balance),0)
from #values v
where v.bill_year > @rollup_year
group by v.tif_area_id, bill_year

GO

