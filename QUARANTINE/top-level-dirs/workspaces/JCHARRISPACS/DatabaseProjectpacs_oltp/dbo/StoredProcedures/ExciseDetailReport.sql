
CREATE  procedure ExciseDetailReport

@begin_date datetime,
@end_date datetime,
@dataset_id numeric,
@includeVoid bit = 0

as

if object_id('tempdb..#excise') is not null drop table #excise
if object_id('tempdb..#fees') is not null drop table #fees

create table #excise
(
	reet_id int,
	payment_id int,
	transaction_id int,
	tax_area_id int,
	state_excise numeric(14,2),
	local_excise numeric(14,2),
	state_interest numeric(14,2),
	local_interest numeric(14,2),
	penalty numeric(14,2),
	overage numeric(14,2),
	tech_fee numeric(14,2),
	proc_fee numeric(14,2),
	voided_or_voiding bit

	primary key (reet_id, payment_id, transaction_id, tax_area_id,voided_or_voiding)
)

create table #fees
(
	reet_id int,
	payment_id int,
	tax_area_id int,
	tech_fee numeric(14,2),
	overage numeric(14,2),
	proc_fee numeric(14,2),
	voided_or_voiding bit

	primary key (reet_id, payment_id, tax_area_id)
)

-- get the affidavit processing fee type
declare @aff_proc_fee_type varchar(10)
set @aff_proc_fee_type = null

select @aff_proc_fee_type = left(isnull(szConfigValue, ''), 10)
from pacs_config
where szGroup = 'REET'
and szConfigName = 'Affidavit Processing Fee'


-- Excise amounts paid
insert #excise
(reet_id, payment_id, transaction_id, tax_area_id, state_excise, local_excise, state_interest, local_interest,
	penalty, overage, tech_fee, proc_fee, voided_or_voiding)
	select reet_id, payment_id, transaction_id, tax_area_id, sum(state_excise_paid) state_excise, sum(local_excise_paid) local_excise, sum(state_interest) state_interest, sum(local_interest) local_interest,
	sum(penalty_paid) penalty, sum(over_under_amount) overage, 0, 0, voided_or_voiding from (
	select distinct
		r.reet_id,
		pta.payment_id,
		pta.transaction_id,
		isnull(r.tax_area_id,rtdt.tax_area_id) tax_area_id,
		case when rrt.local_or_state = 0 then ct.base_amount_pd else 0 end as state_excise_paid,
		case when rrt.local_or_state = 1 then ct.base_amount_pd else 0 end as local_excise_paid,
		case when rrt.local_or_state = 0 then ct.interest_amount_pd else 0 end as state_interest,
		case when rrt.local_or_state = 1 then ct.interest_amount_pd else 0 end as local_interest,
		ct.penalty_amount_pd as penalty_paid,
		ct.overage_amount_pd - ct.underage_amount_pd as over_under_amount,
		0 tech_fee,
		0 proc_fee,
		case when pta.voided = 0 and ct.transaction_type <> 'VOID' then 0 else 1 end voided_or_voiding,
		ct.transaction_type
	from reet_tax_district_transaction rtdt with(nolock)
	join reet r with(nolock)
		on r.reet_id = rtdt.reet_id
	join property_reet_assoc pra with(nolock) on
		pra.reet_id = r.reet_id
        and (pra.tax_area_id = rtdt.tax_area_id or rtdt.tax_area_id is null or rtdt.tax_area_id = 0)
	join reet_rate rr with(nolock)
		on rtdt.reet_rate_id = rr.reet_rate_id
		--and rtdt.tax_district_id = rr.tax_district_id
	join reet_rate_type rrt (nolock)
		on rrt.rate_type_cd = rr.rate_type_cd
	join coll_transaction ct with(nolock)
		on rtdt.trans_group_id = ct.trans_group_id
	join batch bb with(nolock)
		on bb.batch_id = ct.batch_id
	join payment_transaction_assoc pta with(nolock)
		on pta.transaction_id = ct.transaction_id
	where bb.balance_dt >= @begin_date
	and bb.balance_dt <= @end_date
	and r.excise_number is not null
) DATA
group by reet_id, payment_id, transaction_id, voided_or_voiding, tax_area_id,tax_area_id,
	case when voided_or_voiding = 0 and transaction_type <> 'VOID' then 0 else 1 end


-- excise fee amounts paid
insert #fees
(reet_id, payment_id, tax_area_id, tech_fee, overage, proc_fee, voided_or_voiding)
select 
	rfa.reet_id,
	pta.payment_id,
	r.tax_area_id,
	sum(case when ft.technology_fee = 1 then base_amount_pd else 0 end) as tech_fee,
	sum(isnull(ct.overage_amount_pd,0) - isnull(ct.underage_amount_pd,0)) overage,
	sum(case when f.fee_type_cd = @aff_proc_fee_type then base_amount_pd else 0 end) as proc_fee,
	case when pta.voided = 0 and ct.transaction_type <> 'VOID' then 0 else 1 end
from reet_fee_assoc as rfa with(nolock)
join coll_transaction as ct with(nolock)
	on ct.trans_group_id = rfa.fee_id
join batch bb with(nolock)
	on bb.batch_id = ct.batch_id
join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
join reet as r with(nolock)
	on r.reet_id = rfa.reet_id
join fee as f with(nolock)
	on f.fee_id = rfa.fee_id
join fee_type as ft with(nolock)
	on ft.fee_type_cd = f.fee_type_cd
where bb.balance_dt >= @begin_date
and bb.balance_dt <= @end_date
and r.excise_number is not null
and r.tax_area_id is not null
group by rfa.reet_id, pta.payment_id,r.tax_area_id,
	case when pta.voided = 0 and ct.transaction_type <> 'VOID' then 0 else 1 end

-- combine excise and fees
update e
set tech_fee = f.tech_fee,
	proc_fee = f.proc_fee,
	e.overage = e.overage + f.overage
from #excise e
join (
	select  reet_id, payment_id, min(transaction_id) transaction_id from #excise e group by reet_id, payment_id
) ej on
	e.reet_id = ej.reet_id and
	e.payment_id = ej.payment_id and
	e.transaction_id = ej.transaction_id
join #fees f
on f.reet_id = e.reet_id
and f.payment_id = e.payment_id 
and (f.tax_area_id = e.tax_area_id or e.tax_area_id = 0)

insert #excise
(reet_id, payment_id, transaction_id, tax_area_id, state_excise, local_excise, state_interest, local_interest,
	penalty, overage, tech_fee, proc_fee, voided_or_voiding) 
select f.reet_id, f.payment_id, 0, tax_area_id,
	0, 0, 0, 0, 0, 0,
	f.tech_fee, f.proc_fee, f.voided_or_voiding
from #fees f with(nolock)
where not exists(
	select 1 from #excise e
	where f.reet_id = e.reet_id
	and f.payment_id = e.payment_id
)

if (@includeVoid = 0) begin
	delete #excise where voided_or_voiding = 1
end

-- build report output
delete ##excise_detail
where dataset_id = @dataset_id

insert ##excise_detail
(dataset_id, reet_id, excise_number, balance_dt, completion_date, sale_date, Total_Paid,
	property_type, geo_id, prop_id, tax_area, sale_price, taxable_value,
	state_excise_paid, local_excise_paid, state_interest, local_interest, penalty,
	state_tech_fee, proc_fee, over_under_amount, voided_or_voiding)
select 
	@dataset_id as dataset_id,
	e.reet_id,
	r.excise_number,
	b.balance_dt,
	r.completion_date,
	r.sale_date,
	sum(e.state_excise + e.local_excise + e.state_interest + e.local_interest +
		e.penalty + e.overage + e.tech_fee + e.proc_fee) as total_paid,
	case when rtc.mobile_home = 1 then 'MH' else 'R' end as property_type,
	p.geo_id,
	p.prop_id,
    ta.tax_area_number tax_area_number,
    case when voided_or_voiding = 0 and rip.sale_price is null then isnull(r.sale_price,0) 
	else case when voided_or_voiding = 0 and isnull(rip.sale_price,0) = 0 then isnull(r.sale_price,0) 
	else 0 end end sale_price,
	case when voided_or_voiding = 0 then pra.taxable_value else 0 end,
	sum(e.state_excise),
	sum(e.local_excise),
	sum(e.state_interest),
	sum(e.local_interest),
	sum(e.penalty),
	sum(e.tech_fee),
	sum(e.proc_fee),
	sum(e.overage),
	e.voided_or_voiding
from #excise e with(nolock)
join reet r with(nolock)
	on r.reet_id = e.reet_id
join payment pmt with(nolock)
	on pmt.payment_id = e.payment_id
join batch b with(nolock)
	on pmt.batch_id = b.batch_id
join reet_type_code rtc with(nolock)
	on rtc.reet_type_cd = r.reet_type_cd
cross apply (
	select min(prop_id) first_prop_id, 
		sum(taxable_classified + taxable_non_classified) as taxable_value,
		min(tax_area_id) tax_area_id
	from property_reet_assoc pra with(nolock)
	where pra.reet_id = r.reet_id
) pra
left join (
	select reet_id, min(prop_id) first_prop_id, 
		sale_price as sale_price
	from reet_import_property rip with(nolock)
	group by reet_id, sale_price
) rip
on rip.reet_id = r.reet_id
and rip.first_prop_id = pra.first_prop_id
join property p with(nolock)
	on p.prop_id = pra.first_prop_id
join tax_area ta with(nolock)
	on (ta.tax_area_id = e.tax_area_id or e.tax_area_id = 0)
--	and ta.tax_area_id = pra.tax_area_id
group by e.reet_id, r.excise_number, b.balance_dt, r.completion_date, r.sale_date, rtc.mobile_home, p.geo_id, p.prop_id, ta.tax_area_number, e.voided_or_voiding, rip.sale_price, r.sale_price, pra.taxable_value
order by e.reet_id

if (@includeVoid = 0) begin
	--when the excise was voided but later paid, those records offset and are not needed on the report (for the void)
	update v
	set v.geo_id = '-1'
	from  ##excise_detail as v-- voided 
	inner join ##excise_detail as a -- active
	on v.dataset_id = a.dataset_id and
	v.reet_id = a.reet_id and
	v.excise_number = a.excise_number and
	v.prop_id = a.prop_id and
	v.tax_area = a.tax_area and
	v.voided_or_voiding = 1 and
	a.voided_or_voiding = 0 and
	v.Total_Paid + a.Total_Paid = 0

	--when the excise was voided but later paid, those records offset and are not needed on the report (for the active)
	update a
	set a.geo_id = '-1'
	from  ##excise_detail as v-- voided 
	inner join ##excise_detail as a -- active
	on v.dataset_id = a.dataset_id and
	v.reet_id = a.reet_id and
	v.excise_number = a.excise_number and
	v.prop_id = a.prop_id and
	v.tax_area = a.tax_area and
	v.voided_or_voiding = 1 and
	a.voided_or_voiding = 0 and
	v.Total_Paid + a.Total_Paid = 0

	--remove unecessary rows
	delete from ##excise_detail where geo_id = '-1'
end
--SET THE multi_property_reet VALUES FOR THE REPORT
update ##excise_detail set multi_property_reet = 0 where dataset_id = @dataset_id

update ##excise_detail set multi_property_reet = 1 where dataset_id = @dataset_id and reet_id in (
	select pra.reet_id from ##excise_detail data
	inner join property_reet_assoc pra on
	data.reet_id = pra.reet_id
	group by pra.reet_id, dataset_id
	having count(pra.prop_id) > 1 and dataset_id = @dataset_id
)

insert ##excise_detail
(dataset_id, reet_id, excise_number, balance_dt, completion_date, sale_date, Total_Paid,
	property_type, geo_id, prop_id, tax_area, sale_price, taxable_value,
	state_excise_paid, local_excise_paid, state_interest, local_interest, penalty,
	state_tech_fee, proc_fee, over_under_amount)
select
	@dataset_id as dataset_id,
	e.reet_id,
	r.excise_number,
	b.balance_dt,
	r.completion_date,
	r.sale_date,
	e.state_excise + e.local_excise + e.state_interest + e.local_interest +
		e.penalty + e.overage + e.tech_fee + e.proc_fee as total_paid,
	case when rtc.mobile_home = 1 then 'MH' else 'R' end as property_type,
	p.geo_id,
	p.prop_id,
    ta2.tax_area_number tax_area_number,
    case when e.voided_or_voiding = 0 then isnull(rip.sale_price, isnull(r.sale_price,0)) else 0 end sale_price,
	case when e.voided_or_voiding = 0 then pra.taxable_value else 0 end,
	e.state_excise,
	e.local_excise,
	e.state_interest,
	e.local_interest,
	e.penalty,
	e.tech_fee,
	e.proc_fee,
	e.overage
from #excise e with(nolock)
left join #excise e2 with(nolock) on
	e.reet_id = e2.reet_id and
	e.payment_id = e2.payment_id and
	e.tax_area_id = e2.tax_area_id and
	e.state_excise = e2.state_excise and
	e.local_excise = e2.local_excise
join reet r with(nolock)
	on r.reet_id = e.reet_id
join payment pmt with(nolock)
	on pmt.payment_id = e.payment_id
join batch b with(nolock)
	on pmt.batch_id = b.batch_id
join reet_type_code rtc with(nolock)
	on rtc.reet_type_cd = r.reet_type_cd
cross apply (
	select min(prop_id) first_prop_id, --year, sup_num,
		sum(taxable_classified + taxable_non_classified) as taxable_value,
		tax_area_id
	from property_reet_assoc pra with(nolock)
	where pra.reet_id = r.reet_id
	group by tax_area_id--, year, sup_num
) pra
left join (
	select reet_id, min(prop_id) first_prop_id, --year, sup_num,
		sum(sale_price) as sale_price
	from reet_import_property rip with(nolock)
	group by reet_id, location_cd--, year, sup_num
) rip
on rip.reet_id = r.reet_id
and rip.first_prop_id = pra.first_prop_id
--and rip.year = pra.year
--and rip.sup_num = pra.sup_num
join property p with(nolock)
	on p.prop_id = pra.first_prop_id
	join tax_area ta2 with(nolock)
	on ta2.tax_area_id = r.tax_area_id
	and ta2.tax_area_id = pra.tax_area_id
where e2.reet_id is null
order by e.reet_id


if object_id('tempdb..#excise') is not null drop table #excise
if object_id('tempdb..#fees') is not null drop table #fees

GO

