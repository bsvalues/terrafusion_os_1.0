
CREATE procedure [dbo].TaxDistrictSummaryReport
	@dataset_id int,
	@levy_cert_run_id int,
	@year int,
	@taxDistrictId varchar(2000)

as

set nocount on

if object_id('tempdb..#taxdistricts') is not null
begin
    drop table #taxdistricts
end

create table #taxdistricts
(
	tax_district_id int
)

insert into #taxdistricts (tax_district_id)
select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@taxDistrictId)

if object_id('tempdb..#cv') is not null
	drop table #cv
if object_id('tempdb..#cvt') is not null
	drop table #cvt

-- Sum captured values for each levy, from all tax areas
select
	lcr.levy_cert_run_id, v.captured_value_run_id,
	lcr.[status], v.[year], v.tax_district_id, v.levy_cd,
	v.real_pers_value,
	v.state_value,
	v.state_value_annex,
	v.senior_value,
	v.annex_value,
	v.new_const_value,
	v.senior_new_const_value,
	v.taxable_value,
	v.real_value,
	v.personal_value,
	v.senior_real_value,
	v.senior_personal_value,
	v.senior_annex_value
into #cv
from captured_value_summary_vw v
join levy_cert_run lcr with (nolock) 
	on lcr.captured_value_run_id = v.captured_value_run_id
	and lcr.[year] = v.[year]
where lcr.levy_cert_run_id = @levy_cert_run_id

-- captured values for the previous certified year
insert #cv
select
	lcr.levy_cert_run_id, v.captured_value_run_id,
	lcr.[status], v.[year], v.tax_district_id, v.levy_cd,
	v.real_pers_value,
	v.state_value,
	v.state_value_annex,
	v.senior_value,
	v.annex_value,
	v.new_const_value,
	v.senior_new_const_value,
	v.taxable_value,
	v.real_value,
	v.personal_value,
	v.senior_real_value,
	v.senior_personal_value,
	v.senior_annex_value
from captured_value_summary_vw v
join levy_cert_run lcr with(nolock) 
	on lcr.captured_value_run_id = v.captured_value_run_id
	and lcr.[year] = @year - 1
	and lcr.[status] in ('Accepted', 'Bills Created', 'Bills Activated')

-- Sum captured TIF values for each levy/TIF Area, from all tax areas
select
	v.tax_district_id, v.levy_cd, v.tif_area_id, 
	sum(v.tif_taxable_value) tif_taxable_value,
	sum(v.tif_senior_taxable_value) tif_senior_taxable_value,
	sum(v.tif_base_value) tif_base_value,
	sum(v.tif_senior_base_value) tif_senior_base_value,
	sum(v.tif_new_const_value) tif_new_const_value,
	sum(v.tif_senior_new_const_value) tif_senior_new_const_value,
	sum(v.tif_state_value) tif_state_value,
	sum(v.tif_prev_state_value) tif_prev_state_value
into #cvt
from captured_value_tif v
join levy_cert_run lcr with (nolock) 
	on lcr.captured_value_run_id = v.captured_value_run_id
	and lcr.[year] = v.[year]
where lcr.levy_cert_run_id = @levy_cert_run_id
group by v.tax_district_id, v.levy_cd, v.tif_area_id

delete from ##tax_district_summary where dataset_id = @dataset_id
delete from ##tax_district_summary_tif where dataset_id = @dataset_id

-- Collect initial values where no calculation is needed
insert ##tax_district_summary 
(dataset_id, dataset_dt, tax_district_id, tax_district_cd, tax_district_name, tax_district_type_cd,
	tax_district_type_desc, levy_cd, levy_description, levy_fund_no, levy_year, voted_levy_rate,
	budget_limit_exists, hll_limit_exists, stat_limit_exists, agg_limit_exists, const_limit_exists,
	lid_lift_exists, election_term_exists,
	calc_method_levy_year, nolift_calc_method_levy_year, calc_method_levy_amount, nolift_calc_method_levy_amount,
	general_limit_factor, senior_general_limit_factor, 
	pct_increase_levy_amount, lift_pct_increase_levy_amount, senior_pct_increase_levy_amount,
	new_const_value, lift_new_const_value, senior_new_const_value, 
	prior_year_levy_rate, senior_prior_year_levy_rate, 
	new_const_levy_amount, lift_new_const_levy_amount, senior_new_const_levy_amount, 
	non_annex_state_taxable_this_year, state_taxable_last_year, new_state_levy_amount, taxable_value, 
	annex_value, lift_annex_value, senior_annex_value,
	received_capacity, resolution_limit_factor, resolution_senior_limit_factor, prior_year_levy, senior_prior_year_levy,
	population_count, first_percent_amount, second_percent_amt, 
	resolution_pct_increase_levy_amount, resolution_senior_pct_increase_levy_amount,
	statutory_levy_rate, statutory_levy_amount, lift_statutory_levy_amount, senior_statutory_levy_amount, 
	budget_amount, final_levy_rate_sum, amount_recovered, corrections_year, 
	shift_diversion_reason, shift_diversion_amount, corrections_amount, refund_amount, banking_capacity, shift_to_levy_cd,
	aggregate_limit_rate_for_run, constitutional_limit_rate_for_run, aggregate_limit_rate_for_levy, constitutional_limit_rate_for_levy, lesser_of_aggregate_constitutional,
	budget_amount_for_levy, tax_base_for_levy, rate_computation_for_levy, 
	budget_admin_refund_linked, budget_non_admin_refund_linked, 
	tax_base_for_linked_levies, tax_base_for_non_admin_linked_levies, rate_linked_levies_non_admin, rate_computation_for_admin_refund_linked, 
	total_levy_rate_for_computation, total_levy_for_computation, final_or_voted_levy_rate, tax_base_for_run, total_levy_for_straight_rate,
	first_percent_enable, second_percent_enable,
	first_amount_requested, second_amount_requested,
	senior_levy_rate, senior_value, multiple_linked_levies,
	tif_active, prior_year_tif_levy_amount, non_senior_prior_year_tif_levy_amount, senior_prior_year_tif_levy_amount
)

select 
@dataset_id as [dataset_id], 
getdate() as [dataset_dt],
lcrd.[tax_district_id],
left(td.[tax_district_cd], 10), -- should be varchar(20) in the global temp table and report, but the report doesn't actually use this field
td.tax_district_desc as [tax_district_name],
tdt.[tax_district_type_cd],

tdt.tax_district_desc as [tax_district_type_desc],
lcrd.[levy_cd],
l.[levy_description], 
(
	select dbo.CommaListConcatenate(display_fund_number)
	from fund as f with (nolock)
	where	f.[year] = lcrd.[year]
		and f.tax_district_id = lcrd.tax_district_id
		and f.levy_cd = lcrd.levy_cd
		and year(f.begin_date) >= lcrd.[year] 
) as [levy_fund_no],
lcrd.[year] as [levy_year],
case 
	when lchll.lid_lift = 1 then isnull(lchll.highest_lawful_levy_rate, l.voted_levy_rate)
	else null
end as [voted_levy_rate],

case 
	when exists (
		select * from levy_limit as ll with (nolock) 
		where ll.[year] = lcrd.[year] and ll.tax_district_id = lcrd.tax_district_id and ll.levy_cd = lcrd.levy_cd
		and ll.levy_limit_type_cd = 'Budget'
	) then 1
	else 0
end as [budget_limit_exists],
case 
	when exists (
		select * from levy_limit as ll with (nolock) 
		where ll.[year] = lcrd.[year] and ll.tax_district_id = lcrd.tax_district_id and ll.levy_cd = lcrd.levy_cd
		and ll.levy_limit_type_cd = 'HLL'
	) then 1
	else 0
end as [hll_limit_exists],
case 
	when exists (
		select * from levy_limit as ll with (nolock) 
		where ll.[year] = lcrd.[year] and ll.tax_district_id = lcrd.tax_district_id and ll.levy_cd = lcrd.levy_cd
		and ll.levy_limit_type_cd = 'STATUTORY'
	) then 1
	else 0
end as [stat_limit_exists],
case 
	when exists (
		select * from levy_limit as ll with (nolock) 
		where ll.[year] = lcrd.[year] and ll.tax_district_id = lcrd.tax_district_id and ll.levy_cd = lcrd.levy_cd
		and ll.levy_limit_type_cd = 'AGGREGATE'
	) then 1
	else 0
end as [agg_limit_exists],
case 
	when exists (
		select * from levy_limit as ll with (nolock) 
		where ll.[year] = lcrd.[year] and ll.tax_district_id = lcrd.tax_district_id and ll.levy_cd = lcrd.levy_cd
		and ll.levy_limit_type_cd = 'CONST'
	) then 1
	else 0
end as [const_limit_exists],

isnull(lchll.lid_lift, 0) as [lid_lift_exists],
case 
	when exists (
		select * from levy as l with (nolock)
		where l.[year] = lcrd.[year] and l.tax_district_id = lcrd.tax_district_id and l.levy_cd = lcrd.levy_cd
		and isNull(election_term, 0) > 0
	) then 1 
	else 0 end as [election_term_exists],
					
-- [calc_method_levy_year] - [regular_property_tax_limit_with_annex], [received_capacity] and [regular_property_tax_limit_with_annex_rc] should be null if no 'HLL' limit
lchll.calc_method_levy_year				as [calc_method_levy_year],		-- Year of Highest Lawful Levy Since 1985
lchll.nolift_calc_method_levy_year		as [nolift_calc_method_levy_year],	
lchll.calc_method_levy_amount			as [calc_method_levy_amount],		-- Highest Lawful Levy Since 1985
lchll.nolift_calc_method_levy_amount	as [nolift_calc_method_levy_amount],	
isnull(lchll.levy_calc_limit_factor, l.factor) as [general_limit_factor],		-- Limit Factor used for Levy Calculation
isnull(lchll.senior_levy_calc_limit_factor, l.factor) as [senior_general_limit_factor],		
convert(numeric(14, 4), 
	(lchll.calc_method_levy_amount - isnull(lchll.prior_year_tif_levy_amount,0) - 0.001) * lchll.levy_calc_limit_factor) as [pct_increase_levy_amount], -- Percent Increase Levy Amount / Subtract .001 to account for Bankers Rounding which is the default in C#
convert(numeric(14, 4), 
	(lchll.calc_method_levy_amount - isnull(lchll.non_senior_prior_year_tif_levy_amount,0) - 0.001) * lchll.levy_calc_limit_factor) as [lift_pct_increase_levy_amount], -- Percent Increase Levy Amount / Subtract .001 to account for Bankers Rounding which is the default in C#
convert(numeric(14, 4), 
	(lchll.nolift_calc_method_levy_amount - isnull(lchll.senior_prior_year_tif_levy_amount,0) - 0.001) * lchll.senior_levy_calc_limit_factor) as [senior_pct_increase_levy_amount], -- Percent Increase Levy Amount / Subtract .001 to account for Bankers Rounding which is the default in C#
cv.new_const_value			as [new_const_value],		-- New Construction Taxable Assessed Value
cv.new_const_value - cv.senior_new_const_value as [lift_new_const_value],		
cv.senior_new_const_value	as [senior_new_const_value],	
lchll.prior_year_levy_rate	as [prior_year_levy_rate],		-- Last Year's Levy Rate
lchll.senior_prior_year_levy_rate as [senior_prior_year_levy_rate],	
    -- We cannot mutiply directly due to rounding errors, must extend the decimals to match what is in PACS
    -- For example 622.79 + 5022.60 = 5645.39 but PACS displays 5645.38 because that is what 622.788 + 5022.595 rounds to
convert(numeric(14, 4), cv.new_const_value * lchll.prior_year_levy_rate / 1000) as [new_const_levy_amount], -- New Construction Levy Amount
convert(numeric(14, 4), (cv.new_const_value - cv.senior_new_const_value) * lchll.prior_year_levy_rate / 1000) as [lift_new_const_levy_amount], 
convert(numeric(14, 4), cv.senior_new_const_value * lchll.senior_prior_year_levy_rate / 1000) as [senior_new_const_levy_amount], 
isnull(cv.state_value, 0) - isnull(cv.state_value_annex, 0)					as [non_annex_state_taxable_this_year],		-- Non-annexed State Assessed Taxable Value This Year
isnull(cv_last_year.state_value, 0) - isnull(cv_last_year.state_value_annex, 0)			as [state_taxable_last_year],		-- State Assessed Taxable Value Last Year
convert(numeric(14, 4), 0) as [new_state_levy_amount],		-- New State Assessed Value Levy Amount
cv.taxable_value					as [taxable_value],		-- Taxable Assessed Value (excludes Timber Assessed Value)
cv.annex_value as [annex_value],							-- Annexation Taxable Value
cv.annex_value - cv.senior_annex_value as [lift_annex_value],
cv.senior_annex_value as [senior_annex_value],
					
(
	select sum(banking_capacity)
	from levy_cert_hl_limit as lchll_rxcap with (nolock)
	where	lchll_rxcap.levy_cert_run_id = lcrd.levy_cert_run_id
		and lchll_rxcap.[year] = lcrd.[year]
		and lchll_rxcap.shift_to_tax_district_id = lchll.tax_district_id
		and lchll_rxcap.shift_to_levy_cd = lchll.levy_cd
)									as [received_capacity],		-- Received Capacity (NULL if zero)
lchll.limit_factor as [resolution_limit_factor],		-- Limit Factor used for Actual Rate Calc of HLL
lchll.senior_limit_factor as [resolution_senior_limit_factor],
lchll.prior_year_levy as [prior_year_levy],	-- Last Year's Actual Levy
lchll.senior_prior_year_levy as [senior_prior_year_levy],
isnull(l.population_count,0) as [population_count],		-- Population Count
case when l.first_percent_enable = 1 and l.first_percent_amt is not null
		then l.first_percent_amt
		else null 
end as [first_percent_amount],
case when l.second_percent_enable = 1 and l.second_percent_amt is not null 
		then l.second_percent_amt 
		else null 
end as [second_percent_amt],
convert(numeric(14, 2), ( lchll.prior_year_levy * lchll.limit_factor)) as [resolution_pct_increase_levy_amount], -- Resolution - Percent Increase Levy Amount
convert(numeric(14, 2), ( lchll.senior_prior_year_levy * lchll.senior_limit_factor)) as [resolution_senior_pct_increase_levy_amount], -- Resolution - Percent Increase Levy Amount
lcsld.calculated_limit + isnull(lcsld.linked_calculated_limit, 0) as [statutory_levy_rate], -- Statutory Levy Rate (NULL if no 'STATUTORY' limit)
convert(numeric(14,2), cv.taxable_value * (lcsld.calculated_limit + isnull(lcsld.linked_calculated_limit, 0)) / 1000) as [statutory_levy_amount],		-- Statutory Levy Amount (NULL if no 'STATUTORY' limit)
convert(numeric(14,2), (cv.taxable_value - cv.senior_value) * (lcsld.calculated_limit + isnull(lcsld.linked_calculated_limit, 0)) / 1000) as [lift_statutory_levy_amount],
convert(numeric(14,2), cv.senior_value * (lcsld.calculated_limit + isnull(lcsld.linked_calculated_limit, 0)) / 1000) as [senior_statutory_levy_amount],
lcrd.budget_amount					as [budget_amount],		-- Budget Amount (NULL if no 'HLL' limit)

(
    select sum(isnull(lcrd_linked.final_levy_rate,0))
    from levy_link as ll with (nolock)
    join levy_cert_run_detail as lcrd_linked with (nolock) on
        lcrd_linked.levy_cert_run_id = @levy_cert_run_id
        and lcrd_linked.[year] = ll.[year]
        and lcrd_linked.tax_district_id = ll.tax_district_id
        and lcrd_linked.levy_cd = ll.levy_cd_linked
    join #cv as cv_linked on
        cv_linked.captured_value_run_id = lcr.captured_value_run_id
        and   cv_linked.[year] = ll.[year]
        and cv_linked.tax_district_id = ll.tax_district_id
        and cv_linked.levy_cd = ll.levy_cd_linked
        and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
    where ll.[year] = @year
        and ll.tax_district_id = lcrd.tax_district_id
        and ll.levy_cd = lcrd.levy_cd
) as [final_levy_rate_sum],      -- Levy Amount for Linked Levies   

case lchll.use_recovered_amount 
	when 1 then lchll.recovered_amount
	else 0 
end									as [amount_recovered],		-- Amount Recovered
case lchll.use_prior_yr_corrections
	when 1 then lchll.corrections_year
	else NULL
end									as [corrections_year],		-- Corrections Year (NULL if no 'HLL' limit)

case when lchll.shift_diversion_flag = 1 then lchll.shift_diversion_reason else null end as shift_diversion_reason,
case when lchll.shift_diversion_flag = 1 then lchll.shift_diversion_amount else null end as shift_diversion_amount,
case lchll.use_prior_yr_corrections
	when 1 then lchll.corrections_amount
	else 0
end									as [corrections_amount],		-- Corrections Amount (NULL if no 'HLL' limit)
case lchll.use_refunded_amount
	when 1 then lchll.refunded_amount
	else 0
end									as [refund_amount],		-- Refund Amount (NULL if no 'HLL' limit or [lowest_of_limit_statutory_budget] = [budget_amount], ie no refund if lowest is budget amount)
case 
	when lchll.shift_to_levy_cd is not null and lchll.banking_capacity > 0 then -1*lchll.banking_capacity
	else NULL
end									as [banking_capacity],		-- Banking Capacity (Negated for subtraction to calc total_levy_after_corrections)
case 
	when lchll.shift_to_levy_cd is not null and lchll.banking_capacity > 0 then lchll.shift_to_levy_cd
	else NULL
end									as [shift_to_levy_cd],		-- [AT] Shift To Levy Code for Banking Capactiy (null if no banking capacity)

lcr.aggregate_limit					as [aggregate_limit_rate_for_run],		-- Aggregate Limit Rate for Run (NULL if no 'Aggregate' or 'Const' limit)
case 
	when lcr.real_prop_ratio > lcr.pers_prop_ratio then (lcr.real_prop_ratio / 10)
	else (lcr.pers_prop_ratio / 10)
end									as [constitutional_limit_rate_for_run],		-- Constitutional Limit for Run (NULL if no 'Aggregate' or 'Const' limit)
lcal.final_levy_rate				as [aggregate_limit_rate_for_levy],		-- Aggregate Limit Rate for Levy (NULL if no 'Aggregate' or 'Const' limit)
lccl.final_levy_rate				as [constitutional_limit_rate_for_levy],		-- Constitutional Limit Rate for Levy (NULL if no 'Aggregate' or 'Const' limit)
case
	when isnull(lcal.final_levy_rate, 999) < isnull(lccl.final_levy_rate, 999) then 
		case when isnull(lcal.levy_reduction, 0) > 0 then lcal.final_levy_rate else NULL end
	else 
		case 
			when isnull(lccl.levy_reduction, 0) = 0 and isnull(lcal.levy_reduction, 0) > 0 then lccl.final_levy_rate 
			when isnull(lccl.levy_reduction, 0) > 0 then lccl.final_levy_rate 
			else NULL end
end									as [lesser_of_aggregate_constitutional],		-- Less of Aggregate Limit Rate and Constitutional Limit Rate for Levy (NULL if no 'Aggregate' or 'Const' limit or no reduction) 

-- [budget_amount_for_levy], [tax_base_for_levy], [rate_computation_for_levy], [budget_admin_refund_linked], [tax_base_for_linked_levies], [budget_amount_for_levy], [total_levy_for_computation], and [total_levy_rate_for_computation] are NULL if no 'Budget' limit or anything in addition to 'Budget' limit)
lcrd.budget_amount					as [budget_amount_for_levy],		-- Budget Amount for Levy (NULL if no 'Budget' limit or anything in addition to 'Budget' limit)
case when lchll.levy_cert_run_id is not null then lchll.calculated_levy 
	else lcrd.tax_base end as [tax_base_for_levy],		-- Tax Base for Levy (includes Timber Assessed Value)
convert(numeric(14, 10),
	case when lchll.levy_cert_run_id is not null then lchll.highest_lawful_levy_rate
		when lcrd.tax_base = 0 then 0
		else 1000 * lcrd.budget_amount / lcrd.tax_base end) as [rate_computation_for_levy], -- Rate Computation for Levy

convert(numeric(14, 2), (
	select sum(case when lchll.levy_cert_run_id is not null then lchll.calculated_levy else lcrd_linked.budget_amount end)
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock) on
			lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked on
			cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and cv_linked.captured_value_run_id = lcr.captured_value_run_id
	join levy as l with (nolock) on
			l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
	left join levy_cert_hl_limit as lchll with (nolock) on
			lchll.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and lchll.[year] = lcrd_linked.[year]
		and lchll.tax_district_id = lcrd_linked.tax_district_id
		and lchll.levy_cd = lcrd_linked.levy_cd
	where ll.[year] = @year
		and ll.tax_district_id = lcrd.tax_district_id
		and ll.levy_cd = lcrd.levy_cd
		and l.levy_type_cd = 'AR' -- Administrative Relief
)) as [budget_admin_refund_linked],		-- Budget Amount for Admin Refund Linked Levies (NULL if no 'Budget' limit or anything in addition to 'Budget' limit)

convert(numeric(14, 2), (
	select sum(case when lchll.levy_cert_run_id is not null then lchll.calculated_levy else lcrd_linked.budget_amount end)
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock) on
			lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked on
			cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and cv_linked.captured_value_run_id = lcr.captured_value_run_id
	join levy as l with (nolock) on
			l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
	left join levy_cert_hl_limit as lchll with (nolock) on
			lchll.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and lchll.[year] = lcrd_linked.[year]
		and lchll.tax_district_id = lcrd_linked.tax_district_id
		and lchll.levy_cd = lcrd_linked.levy_cd
	where ll.[year] = @year
		and ll.tax_district_id = lcrd.tax_district_id
		and ll.levy_cd = lcrd.levy_cd
		and l.levy_type_cd <> 'AR' -- Non Administrative Relief
))									as [budget_non_admin_refund_linked],		-- Budget Amount for non Admin Refund Linked Levies (NULL if no 'Budget' limit or anything in addition to 'Budget' limit)

convert(numeric(14, 2), (
	select sum(lcrd_linked.tax_base)
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock) on
			lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked on
			cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and cv_linked.captured_value_run_id = lcr.captured_value_run_id
	join levy as l with (nolock) on
			l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
	where ll.[year] = @year
		and ll.tax_district_id = lcrd.tax_district_id
		and ll.levy_cd = lcrd.levy_cd
		and l.levy_type_cd ='AR' -- Administrative Relief

)) as [tax_base_for_linked_levies],		-- Tax Base for Linked Levies (includes Timber Assessed Value)

convert(numeric(14, 2), (
	select sum(lcrd_linked.tax_base)
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock) on
			lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked on
			cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
		and cv_linked.captured_value_run_id = lcr.captured_value_run_id
	join levy as l with (nolock) on
			l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
	where ll.[year] = @year
		and ll.tax_district_id = lcrd.tax_district_id
		and ll.levy_cd = lcrd.levy_cd
		and l.levy_type_cd <> 'AR' -- Administrative Relief

))as [tax_base_for_non_admin_linked_levies],		-- Tax Base for Linked Levies (includes Timber Assessed Value)

NULL as [rate_linked_levies_non_admin],		-- Rate Computation for non Admin Refund Linked Levies
NULL as [rate_computation_for_admin_refund_linked],		-- Rate Computation for Admin Refund Linked Levies
NULL as [total_levy_rate_for_computation],		-- Total Levy for Compuation = [budget_amount_for_levy] + [budget_admin_refund_linked]
NULL as [total_levy_for_computation],		-- Total Levy Rate for Computation = [rate_computation_for_levy] + [budget_amount_for_levy]

-- [final_or_voted_levy_rate], [tax_base_for_run], [total_levy_for_straight_rate] are null unless the levy has no limit calcs, or has a lid lift in the HLL calc
lcrd.final_levy_rate as [final_or_voted_levy_rate],		-- final levy_rate if no limit exists, voted_levy_rate if lid_lift_exists
lcrd.tax_base		 as [tax_base_for_run],		-- Tax Base for Levy (includes Timber Assessed Value)
NULL				 as [total_levy_for_straight_rate],		-- Total Levy for Straight Rate or Lid Lift Calculation
first_percent_enable,
second_percent_enable,
case when l.first_percent_enable = 1 and l.first_amount_requested is not null
	then l.first_amount_requested
	else null 
end as [first_amount_requested],
					
case when l.second_percent_enable = 1 and l.second_amount_requested is not null 
	then l.second_amount_requested 
	else null 
end as second_amount_requested,

isnull(lcrd.final_senior_levy_rate,0),
(
    select sum(isnull(senior_value,0))
    from #cv cv
    where cv.[year] = @year
		and cv.levy_cert_run_id = lcrd.levy_cert_run_id
        and cv.tax_district_id = lcrd.tax_district_id
        and cv.levy_cd = lcrd.levy_cd
) as senior_value,

(
	select case when count(*) > 1 then 1 else 0 end as multiple_linked_levies
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock) on
			lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked on
			cv_linked.captured_value_run_id = lcr.captured_value_run_id
		and	cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
	join levy as l with (nolock) on
			l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
	where ll.[year] = @year
		and ll.tax_district_id = lcrd.tax_district_id
		and ll.levy_cd_linked = cv_linked.levy_cd
		and l.levy_type_cd <> 'AR' -- Administrative Relief	
) multiple_linked_levies,

case when exists(
	select 1 from #cvt cvt
	where cvt.tax_district_id = cv.tax_district_id
	and cvt.levy_cd = cv.levy_cd
) then 1 else 0 end as tif_active,

lchll.prior_year_tif_levy_amount, lchll.non_senior_prior_year_tif_levy_amount, lchll.senior_prior_year_tif_levy_amount


from levy_cert_run_detail as lcrd with (nolock)
join levy_cert_run as lcr with (nolock) on
		lcr.levy_cert_run_id = lcrd.levy_cert_run_id
	and lcr.[year] = lcrd.[year]
join levy as l with (nolock) on
		l.[year] = lcrd.[year]
	and l.tax_district_id = lcrd.tax_district_id
	and l.levy_cd = lcrd.levy_cd
join tax_district as td with (nolock) on 
		td.tax_district_id = lcrd.tax_district_id
join tax_district_type as tdt with (nolock) on
		tdt.tax_district_type_cd = td.tax_district_type_cd
join #cv as cv on
		cv.levy_cert_run_id = lcr.levy_cert_run_id
	and cv.[year] = lcrd.[year]
	and cv.tax_district_id = lcrd.tax_district_id
	and cv.levy_cd = lcrd.levy_cd
left join #cv as cv_last_year on
		cv_last_year.[year] = lcrd.[year] - 1
	and cv_last_year.tax_district_id = lcrd.tax_district_id
	and cv_last_year.levy_cd = lcrd.levy_cd
left join levy_cert_stat_limit_detail as lcsld with (nolock) on
		lcsld.levy_cert_run_id = lcrd.levy_cert_run_id
	and lcsld.[year] = lcrd.[year]
	and lcsld.tax_district_id = lcrd.tax_district_id
	and lcsld.levy_cd = lcrd.levy_cd
left join levy_cert_hl_limit as lchll with (nolock) on
		lchll.levy_cert_run_id = lcrd.levy_cert_run_id
	and lchll.[year] = lcrd.[year]
	and lchll.tax_district_id = lcrd.tax_district_id
	and lchll.levy_cd = lcrd.levy_cd
left join levy_cert_agg_limit as lcal with (nolock) on
		lcal.levy_cert_run_id = lcrd.levy_cert_run_id
	and lcal.[year] = lcrd.[year]
	and lcal.tax_district_id = lcrd.tax_district_id
	and lcal.levy_cd = lcrd.levy_cd
left join levy_cert_const_limit as lccl with (nolock) on
		lccl.levy_cert_run_id = lcrd.levy_cert_run_id
	and lccl.[year] = lcrd.[year]
	and lccl.tax_district_id = lcrd.tax_district_id
	and lccl.levy_cd = lcrd.levy_cd
where	lcrd.[year] = @year
	and lcrd.levy_cert_run_id = @levy_cert_run_id
	and lcrd.tax_district_id in (select tax_district_id from #taxdistricts )
	and not exists (select * from levy_link where [year] = lcrd.[year] and tax_district_id = lcrd.tax_district_id and levy_cd_linked = lcrd.levy_cd)


-- Update [new_state_levy_amount] {New State Assessed Value Levy Amount}
update ##tax_district_summary set 
	[new_state_levy_amount]	= convert(numeric(14, 2), (([non_annex_state_taxable_this_year] - [state_taxable_last_year]) * [prior_year_levy_rate]) / 1000)
where dataset_id = @dataset_id and [non_annex_state_taxable_this_year] > [state_taxable_last_year]

-- Update Regular Property Tax Limit w/o Annexations
update ##tax_district_summary set 
	[regular_property_tax_limit] = convert(numeric(14, 4), round([pct_increase_levy_amount], 2) + 
		round([new_const_levy_amount], 2) + round([new_state_levy_amount], 2)),
	[lift_regular_property_tax_limit] = convert(numeric(14, 4), round([lift_pct_increase_levy_amount], 2) + 
		round([lift_new_const_levy_amount], 2) + round([new_state_levy_amount], 2)),
	[senior_regular_property_tax_limit] = convert(numeric(14, 4), round([senior_pct_increase_levy_amount], 2) + 
		round([senior_new_const_levy_amount], 2))
where dataset_id = @dataset_id

-- Update [annex_levy_rate] {Annexation Levy Rate}
update ##tax_district_summary set 
	[annex_levy_rate] = convert(numeric(14, 10), case when ([taxable_value] - [annex_value]) > 0
		then (1000 * [regular_property_tax_limit]) / ([taxable_value] - [annex_value]) else 0 end),
	[lift_annex_levy_rate] = convert(numeric(14, 10), case when (([taxable_value] - [senior_value]) - ([annex_value] - [senior_annex_value])) > 0
		then (1000 * [lift_regular_property_tax_limit]) / (([taxable_value] - [senior_value]) - ([annex_value] - [senior_annex_value])) else 0 end),
	[senior_annex_levy_rate] = convert(numeric(14, 10), case when (taxable_value - senior_annex_value) > 0
		then (1000 * (senior_pct_increase_levy_amount + senior_new_const_levy_amount)) / (taxable_value - senior_annex_value) else 0 end)
where dataset_id = @dataset_id

-- annex levy rates can't exceed the statutory levy rate
update ##tax_district_summary set
	[annex_levy_rate] = case when [annex_levy_rate] < [statutory_levy_rate] then [annex_levy_rate] else [statutory_levy_rate] end, 
	[lift_annex_levy_rate] = case when [lift_annex_levy_rate] < [statutory_levy_rate] then [lift_annex_levy_rate] else [statutory_levy_rate] end,
	[senior_annex_levy_rate] = case when [senior_annex_levy_rate] < [statutory_levy_rate] then [senior_annex_levy_rate] else [statutory_levy_rate] end 
where dataset_id = @dataset_id

-- Update [annex_levy_amount] {Annexation Levy Amount}
-- We cannot mutiply directly due to rounding errors, must extend the decimals to match what is in PACS
-- For example 622.79 + 5022.60 = 5645.39 but PACS displays 5645.38 because that is what 622.788 + 5022.595 rounds to
update ##tax_district_summary set 
	[annex_levy_amount]	= convert(numeric(14,4), ([annex_value] * [annex_levy_rate]) / 1000),
	[lift_annex_levy_amount]	= convert(numeric(14,4), ([lift_annex_value] * [lift_annex_levy_rate]) / 1000),
	[senior_annex_levy_amount]	= convert(numeric(14,4), ([senior_annex_value] * [senior_annex_levy_rate]) / 1000)
where dataset_id = @dataset_id

-- Update [resolution_limit_factor] and [resolution_pct_increase_levy_amount] to NULL so they will not display when there are no percentages present
update ##tax_district_summary set 
	[resolution_limit_factor] = NULL,
	[resolution_senior_limit_factor] = null,
	[resolution_pct_increase_levy_amount] = NULL, 
	[resolution_senior_pct_increase_levy_amount] = null
where [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0

-- Update Resolution - Regular Property Tax Limit w/o Annexations
update ##tax_district_summary set 
	[resolution_regular_property_tax_limit] =
		case when second_percent_enable is not null then -- if we have a second_percent_enable use it as the primary
			case when second_amount_requested is not null and second_amount_requested <> 0 and isnull(second_amount_requested, 0) + [prior_year_levy] < isnull([resolution_pct_increase_levy_amount],0) then isnull(second_amount_requested, 0) + [prior_year_levy] + [new_const_levy_amount] + [new_state_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(second_amount_requested, 0) + [prior_year_levy] + [new_const_levy_amount] + [new_state_levy_amount] -- if there is no percentage use the second amount
				else isnull([resolution_pct_increase_levy_amount],0) + [new_const_levy_amount] + [new_state_levy_amount] -- if there is a percentage use that calculated value
			end
		when first_percent_enable is not null  then -- if we only have a first_percent_enable use it instead
			case when first_amount_requested is not null and first_amount_requested <> 0 and isnull(first_amount_requested, 0) + [prior_year_levy] < isnull([resolution_pct_increase_levy_amount],0) or [resolution_limit_factor] is null then isnull(first_amount_requested, 0) + [prior_year_levy] + [new_const_levy_amount] + [new_state_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(first_amount_requested, 0) + [prior_year_levy] + [new_const_levy_amount] + [new_state_levy_amount] -- if there is no percentage use the first amount
				else isnull([resolution_pct_increase_levy_amount],0) + [new_const_levy_amount] + [new_state_levy_amount] -- if there is a percentage use that calculated value
			end
		else 
			convert(numeric(14, 2), isnull([resolution_pct_increase_levy_amount],0) + [new_const_levy_amount] + [new_state_levy_amount]) -- if no second or first enable just use the calculated value
		end,

		[resolution_lift_regular_property_tax_limit] =
		case when second_percent_enable is not null then -- if we have a second_percent_enable use it as the primary
			case when second_amount_requested is not null and second_amount_requested <> 0 and isnull(second_amount_requested, 0) + [prior_year_levy] < isnull([resolution_pct_increase_levy_amount],0) then isnull(second_amount_requested, 0) + [prior_year_levy] + [lift_new_const_levy_amount] + [new_state_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(second_amount_requested, 0) + [prior_year_levy] + [lift_new_const_levy_amount] + [new_state_levy_amount] -- if there is no percentage use the second amount
				else isnull([resolution_pct_increase_levy_amount],0) + [lift_new_const_levy_amount] + [new_state_levy_amount] -- if there is a percentage use that calculated value
			end
		when first_percent_enable is not null  then -- if we only have a first_percent_enable use it instead
			case when first_amount_requested is not null and first_amount_requested <> 0 and isnull(first_amount_requested, 0) + [prior_year_levy] < isnull([resolution_pct_increase_levy_amount],0) or [resolution_limit_factor] is null then isnull(first_amount_requested, 0) + [prior_year_levy] + [lift_new_const_levy_amount] + [new_state_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(first_amount_requested, 0) + [prior_year_levy] + [lift_new_const_levy_amount] + [new_state_levy_amount] -- if there is no percentage use the first amount
				else isnull([resolution_pct_increase_levy_amount],0) + [lift_new_const_levy_amount] + [new_state_levy_amount] -- if there is a percentage use that calculated value
			end
		else 
			convert(numeric(14, 2), isnull([resolution_pct_increase_levy_amount],0) + [lift_new_const_levy_amount] + [new_state_levy_amount]) -- if no second or first enable just use the calculated value
		end,

		[resolution_senior_regular_property_tax_limit] =
		case when second_percent_enable is not null then -- if we have a second_percent_enable use it as the primary
			case when second_amount_requested is not null and second_amount_requested <> 0 and isnull(second_amount_requested, 0) + [senior_prior_year_levy] < isnull([resolution_senior_pct_increase_levy_amount],0) then isnull(second_amount_requested, 0) + [senior_prior_year_levy] + [senior_new_const_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(second_amount_requested, 0) + [senior_prior_year_levy] + [senior_new_const_levy_amount] -- if there is no percentage use the second amount
				else isnull([resolution_senior_pct_increase_levy_amount],0) + [senior_new_const_levy_amount] -- if there is a percentage use that calculated value
			end
		when first_percent_enable is not null  then -- if we only have a first_percent_enable use it instead
			case when first_amount_requested is not null and first_amount_requested <> 0 and isnull(first_amount_requested, 0) + [senior_prior_year_levy] < isnull([resolution_senior_pct_increase_levy_amount],0) or [resolution_limit_factor] is null then isnull(first_amount_requested, 0) + [senior_prior_year_levy] + [senior_new_const_levy_amount] -- we want the lesser of these values
				when [resolution_limit_factor] is null or [resolution_limit_factor] = 0.0 then isnull(first_amount_requested, 0) + [senior_prior_year_levy] + [senior_new_const_levy_amount] -- if there is no percentage use the first amount
				else isnull([resolution_senior_pct_increase_levy_amount],0) + [senior_new_const_levy_amount] -- if there is a percentage use that calculated value
			end
		else 
			convert(numeric(14, 2), isnull([resolution_senior_pct_increase_levy_amount],0) + [senior_new_const_levy_amount]) -- if no second or first enable just use the calculated value
		end

    where dataset_id = @dataset_id

-- LTIF values
insert ##tax_district_summary_tif
(dataset_id, tax_district_id, levy_cd, tif_area_id, tif_area_name,
	tif_taxable_value, tif_lift_taxable_value, tif_senior_taxable_value,
	tif_base_value, tif_lift_base_value, tif_senior_base_value,
	tif_new_const_value, tif_lift_new_const_value, tif_senior_new_const_value, 
	tif_state_value)
select @dataset_id, tax_district_id, levy_cd, cvt.tif_area_id, ta.name,
	tif_taxable_value, tif_taxable_value - tif_senior_taxable_value, tif_senior_taxable_value,
	tif_base_value, tif_base_value - tif_senior_base_value, tif_senior_base_value,
	tif_new_const_value, tif_new_const_value - tif_senior_new_const_value, tif_senior_new_const_value,
	case when tif_state_value > tif_prev_state_value 
		then tif_state_value - tif_prev_state_value else 0 end as tif_state_value
from #cvt cvt
join tif_area ta
	on cvt.tif_area_id = ta.tif_area_id


update ##tax_district_summary_tif set
	tif_assessed_amount = case when tif_taxable_value - tif_base_value - tif_new_const_value - tif_state_value > 0
		then tif_taxable_value - tif_base_value - tif_new_const_value - tif_state_value else 0 end,
	tif_lift_assessed_amount = case when tif_lift_taxable_value - tif_lift_base_value - tif_lift_new_const_value - tif_state_value > 0
		then tif_lift_taxable_value - tif_lift_base_value - tif_lift_new_const_value - tif_state_value else 0 end,
	tif_senior_assessed_amount = case when tif_senior_taxable_value - tif_senior_base_value - tif_senior_new_const_value > 0
		then tif_senior_taxable_value - tif_senior_base_value - tif_senior_new_const_value else 0 end
where dataset_id = @dataset_id


update tdst
set tif_levy_amount = tdst.tif_assessed_amount * tds.prior_year_levy_rate * 0.001,
	tif_lift_levy_amount = tdst.tif_lift_assessed_amount * tds.prior_year_levy_rate * 0.001,
	tif_senior_levy_amount = tdst.tif_senior_assessed_amount * tds.prior_year_levy_rate * 0.001,
	tif_increment = lct.tif_non_senior_increment,
	tif_senior_increment = lct.tif_senior_increment
from ##tax_district_summary_tif tdst
join ##tax_district_summary tds
	on tdst.dataset_id = tds.dataset_id
	and tdst.tax_district_id = tds.tax_district_id
	and tdst.levy_cd = tds.levy_cd
left join levy_cert_tif as lct with (nolock)
	on lct.levy_cert_run_id = @levy_cert_run_id
	and lct.tax_district_id = tds.tax_district_id
	and lct.levy_cd = tds.levy_cd
	and lct.tif_area_id = tdst.tif_area_id
where tdst.dataset_id = @dataset_id


update tds
	set sum_tif_levy_amount = isnull(x.sum_tif_levy_amount, 0),
		sum_tif_lift_levy_amount = isnull(x.sum_tif_lift_levy_amount, 0),
		sum_tif_senior_levy_amount = isnull(x.sum_tif_senior_levy_amount, 0),
		sum_tif_increment = isnull(x.sum_tif_increment, 0),
		sum_tif_senior_increment = isnull(x.sum_tif_senior_increment, 0)
from ##tax_district_summary tds
cross apply (
	select sum(isnull(tif_levy_amount,0)) sum_tif_levy_amount,
		sum(isnull(tif_lift_levy_amount,0)) sum_tif_lift_levy_amount,
		sum(isnull(tif_senior_levy_amount,0)) sum_tif_senior_levy_amount,
		sum(isnull(tif_increment,0)) sum_tif_increment,
		sum(isnull(tif_senior_increment,0)) sum_tif_senior_increment
	from ##tax_district_summary_tif tdst
		where tdst.dataset_id = tds.dataset_id
		and tdst.tax_district_id = tds.tax_district_id
		and tdst.levy_cd = tds.levy_cd
)x
where tds.dataset_id = @dataset_id


-- Update [regular_property_tax_limit_with_annex] {Regular Property Tax Limit Including Annexation}
-- and resolution_amount_with_new_annex_tif { Resolution Amount }
update ##tax_district_summary set 
	[regular_property_tax_limit_with_annex]	= [regular_property_tax_limit] + [annex_levy_amount],
	[lift_regular_property_tax_limit_with_annex] = [lift_regular_property_tax_limit] + [lift_annex_levy_amount],
	[senior_regular_property_tax_limit_with_annex]	= [senior_regular_property_tax_limit] + [senior_annex_levy_amount],
	[resolution_amount_with_new_annex_tif] = [resolution_regular_property_tax_limit] + [annex_levy_amount] + sum_tif_levy_amount,
	[resolution_lift_amount_with_new_annex_tif] = [resolution_lift_regular_property_tax_limit] + [lift_annex_levy_amount] + sum_tif_lift_levy_amount,
	[resolution_senior_amount_with_new_annex_tif] = [resolution_senior_regular_property_tax_limit] + [senior_annex_levy_amount] + sum_tif_senior_levy_amount
where dataset_id = @dataset_id

update tds
set final_levy_rate = lcrd.final_levy_rate					
from ##tax_district_summary tds
join levy_cert_run_detail lcrd
	on lcrd.levy_cert_run_id = @levy_cert_run_id
	and lcrd.year = tds.levy_year
	and lcrd.tax_district_id = tds.tax_district_id
	and lcrd.levy_cd = tds.levy_cd
where tds.dataset_id = @dataset_id

--	Update [regular_property_tax_limit_with_annex_rc] {Regular Property Tax Limit Including Annexation, LTIF, and Received Capacity}
update ##tax_district_summary set 
	[regular_property_tax_limit_with_annex_rc] = [regular_property_tax_limit_with_annex] + sum_tif_levy_amount + isnull([received_capacity], 0),
	[lift_regular_property_tax_limit_with_annex_rc] = [lift_regular_property_tax_limit_with_annex] + sum_tif_lift_levy_amount + isnull([received_capacity], 0),
	[senior_regular_property_tax_limit_with_annex_rc] = [senior_regular_property_tax_limit_with_annex] + sum_tif_senior_levy_amount + isnull([received_capacity], 0)
where dataset_id = @dataset_id

-- Lowest of Levy Limit, limit with annex, statutory limit, budget amount, and resolution amount
update ##tax_district_summary set 
	[lowest_of_limit_statutory_budget] = case 
		when isnull([regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([statutory_levy_amount], 2147483647) 
			and isnull([regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([budget_amount], 2147483647) 
			then [regular_property_tax_limit_with_annex_rc] + isnull([refund_amount], 0) 
		when isnull([statutory_levy_amount], 2147483647) <= isnull([regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
			and isnull([statutory_levy_amount], 2147483647) <= isnull([budget_amount], 2147483647)
			then [statutory_levy_amount]
		when isnull([budget_amount], 2147483647) <= isnull([regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0)
			and isnull([budget_amount], 2147483647) <= isnull([statutory_levy_amount], 2147483647) + isnull([refund_amount], 0)
			then [budget_amount]
		else null end,
	[lift_lowest_of_limit_statutory_budget] = case 
		when isnull([lift_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([lift_statutory_levy_amount], 2147483647) 
			and isnull([lift_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([budget_amount], 2147483647) 
			then [lift_regular_property_tax_limit_with_annex_rc] + isnull([refund_amount], 0) 
		when isnull([lift_statutory_levy_amount], 2147483647) <= isnull([lift_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
			and isnull([lift_statutory_levy_amount], 2147483647) <= isnull([budget_amount], 2147483647)
			then [lift_statutory_levy_amount]
		when isnull([budget_amount], 2147483647) <= isnull([lift_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0)
			and isnull([budget_amount], 2147483647) <= isnull([lift_statutory_levy_amount], 2147483647) + isnull([refund_amount], 0)
			then [budget_amount]
		else null end,
	[senior_lowest_of_limit_statutory_budget] = case 
		when isnull([senior_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([senior_statutory_levy_amount], 2147483647) 
			and isnull([senior_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) <= isnull([budget_amount], 2147483647) 
			then [senior_regular_property_tax_limit_with_annex_rc] + isnull([refund_amount], 0) 
		when isnull([senior_statutory_levy_amount], 2147483647) <= isnull([senior_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
			and isnull([senior_statutory_levy_amount], 2147483647) <= isnull([budget_amount], 2147483647)
			then [senior_statutory_levy_amount]
		when isnull([budget_amount], 2147483647) <= isnull([senior_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0)
			and isnull([budget_amount], 2147483647) <= isnull([senior_statutory_levy_amount], 2147483647) + isnull([refund_amount], 0)
			then [budget_amount]
		else null end
where dataset_id = @dataset_id

update ##tax_district_summary set 
	[lowest_of_limit_statutory_budget] = [resolution_amount_with_new_annex_tif] + isnull([refund_amount], 0)
where dataset_id = @dataset_id and [lowest_of_limit_statutory_budget] > isnull([resolution_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0)

update ##tax_district_summary set 
	[lift_lowest_of_limit_statutory_budget] = [resolution_lift_amount_with_new_annex_tif] + isnull([refund_amount], 0)
where dataset_id = @dataset_id and [lift_lowest_of_limit_statutory_budget] > isnull([resolution_lift_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0)

update ##tax_district_summary set 
	[senior_lowest_of_limit_statutory_budget] = [resolution_senior_amount_with_new_annex_tif] + isnull([refund_amount], 0)
where dataset_id = @dataset_id and [senior_lowest_of_limit_statutory_budget] > isnull([resolution_senior_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0)


-- Update admin refund linked levy amount
update tds set 
	[admin_refund_linked_levy_amount] = x.admin_refund_linked_levy_amount,
	[lift_admin_refund_linked_levy_amount] = x.lift_admin_refund_linked_levy_amount,
	[senior_admin_refund_linked_levy_amount] = x.senior_admin_refund_linked_levy_amount,
	[admin_levy_taxable] = x.admin_levy_taxable,
	[lift_admin_levy_taxable] = x.lift_admin_levy_taxable,
	[senior_admin_levy_taxable] = x.senior_admin_levy_taxable,
	[hll_rate_admin_refund_linked] = x.hll_rate_admin_refund_linked,
	[lift_hll_rate_admin_refund_linked] = x.lift_hll_rate_admin_refund_linked,
	[senior_hll_rate_admin_refund_linked] = x.senior_hll_rate_admin_refund_linked
from ##tax_district_summary tds
cross apply (
	select
		admin_refund_linked_levy_amount = sum(convert(numeric(14, 2), lcrd_linked.final_levy_rate * cv_linked.taxable_value / 1000)),
		lift_admin_refund_linked_levy_amount = sum(convert(numeric(14, 2), lcrd_linked.final_levy_rate * (cv_linked.taxable_value - cv_linked.senior_value) / 1000)),
		senior_admin_refund_linked_levy_amount = sum(convert(numeric(14, 2), lcrd_linked.final_senior_levy_rate * cv_linked.senior_value / 1000)),
		admin_levy_taxable = sum(cv_linked.taxable_value),
		lift_admin_levy_taxable = sum(cv_linked.taxable_value - cv_linked.senior_value),
		senior_admin_levy_taxable = sum(cv_linked.senior_value),
		hll_rate_admin_refund_linked = sum(lcrd_linked.final_levy_rate),
		lift_hll_rate_admin_refund_linked = sum(lcrd_linked.final_levy_rate),
		senior_hll_rate_admin_refund_linked = sum(lcrd_linked.final_senior_levy_rate)
	from levy_link as ll with (nolock)
	join levy_cert_run_detail as lcrd_linked with (nolock)
		on lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv as cv_linked
		on cv_linked.captured_value_run_id = (select captured_value_run_id from levy_cert_run lcr where lcr.levy_cert_run_id = @levy_cert_run_id and lcr.year = @year)
		and	cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
	join levy as l with(nolock)
		on l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
		and l.levy_type_cd = 'AR' -- Administrative Relief		
	where ll.[year] = @year
		and ll.tax_district_id = tds.tax_district_id
		and ll.levy_cd = tds.levy_cd
)x
where dataset_id = @dataset_id 


-- update linked levy non-admin
update tds set
	[linked_levy_amount_non_admin] = x.linked_levy_amount_non_admin,
	[lift_linked_levy_amount_non_admin] = x.lift_linked_levy_amount_non_admin,
	[senior_linked_levy_amount_non_admin] = x.senior_linked_levy_amount_non_admin,
	[linked_levy_taxable] = x.linked_levy_taxable,
	[lift_linked_levy_taxable] = x.lift_linked_levy_taxable,
	[senior_linked_levy_taxable] = x.senior_linked_levy_taxable,
	[hll_rate_non_admin_refund_linked] = x.hll_rate_non_admin_refund_linked,
	[lift_hll_rate_non_admin_refund_linked] = x.lift_hll_rate_non_admin_refund_linked,
	[senior_hll_rate_non_admin_refund_linked] = x.senior_hll_rate_non_admin_refund_linked
from ##tax_district_summary tds
cross apply (
	select 
		linked_levy_amount_non_admin = sum(convert(numeric(14, 2), lcrd_linked.final_levy_rate * cv_linked.taxable_value / 1000)),
		lift_linked_levy_amount_non_admin = sum(convert(numeric(14, 2), lcrd_linked.final_levy_rate * (cv_linked.taxable_value - cv_linked.senior_value) / 1000)),
		senior_linked_levy_amount_non_admin = sum(convert(numeric(14, 2), lcrd_linked.final_senior_levy_rate * cv_linked.senior_value / 1000)),
		linked_levy_taxable = sum(cv_linked.taxable_value),
		lift_linked_levy_taxable = sum(cv_linked.taxable_value - cv_linked.senior_value),
		senior_linked_levy_taxable = sum(cv_linked.senior_value),
		hll_rate_non_admin_refund_linked = sum(lcrd_linked.final_levy_rate),
		lift_hll_rate_non_admin_refund_linked = sum(lcrd_linked.final_levy_rate),
		senior_hll_rate_non_admin_refund_linked = sum(lcrd_linked.final_senior_levy_rate)
	from levy_link ll with(nolock)
	join levy_cert_run_detail lcrd_linked with(nolock)
		on lcrd_linked.levy_cert_run_id = @levy_cert_run_id
		and lcrd_linked.[year] = ll.[year]
		and lcrd_linked.tax_district_id = ll.tax_district_id
		and lcrd_linked.levy_cd = ll.levy_cd_linked
	join #cv cv_linked
		on cv_linked.captured_value_run_id = (select captured_value_run_id from levy_cert_run lcr where lcr.levy_cert_run_id = @levy_cert_run_id and lcr.year = @year)
		and	cv_linked.[year] = ll.[year]
		and cv_linked.tax_district_id = ll.tax_district_id
		and cv_linked.levy_cd = ll.levy_cd_linked
		and cv_linked.levy_cert_run_id = lcrd_linked.levy_cert_run_id
	join levy l with(nolock)
		on l.year = lcrd_linked.year
		and l.tax_district_id = lcrd_linked.tax_district_id
		and l.levy_cd = lcrd_linked.levy_cd
		and l.levy_type_cd <> 'AR' -- Administrative Relief			
	where ll.[year] = @year
		and ll.tax_district_id = tds.tax_district_id
		and ll.levy_cd = tds.levy_cd
)x
where dataset_id = @dataset_id


update ##tax_district_summary set 
	[admin_refund_linked_levy_amount] = 0 
where dataset_id = @dataset_id and [admin_refund_linked_levy_amount] is null

update ##tax_district_summary set 
	[lift_admin_refund_linked_levy_amount] = 0 
where dataset_id = @dataset_id and [lift_admin_refund_linked_levy_amount] is null

update ##tax_district_summary set 
	[senior_admin_refund_linked_levy_amount] = 0 
where dataset_id = @dataset_id and [senior_admin_refund_linked_levy_amount] is null

update ##tax_district_summary set 
	[linked_levy_amount_non_admin] = 0 
where dataset_id = @dataset_id and [linked_levy_amount_non_admin] is null

update ##tax_district_summary set 
	[lift_linked_levy_amount_non_admin] = 0 
where dataset_id = @dataset_id and [lift_linked_levy_amount_non_admin] is null

update ##tax_district_summary set 
	[senior_linked_levy_amount_non_admin] = 0 
where dataset_id = @dataset_id and [senior_linked_levy_amount_non_admin] is null


-- Update [total_levy] {Total Levy before corrections}, [lowest_of_limit_statutory_budget_less_recovered] {Limit less Recovered Amount}
update ##tax_district_summary set 
	[total_levy] = [lowest_of_limit_statutory_budget] + isnull([admin_refund_linked_levy_amount], 0),
	[lift_total_levy] = [lift_lowest_of_limit_statutory_budget] + isnull([lift_admin_refund_linked_levy_amount], 0),
	[senior_total_levy] = [senior_lowest_of_limit_statutory_budget] + isnull([senior_admin_refund_linked_levy_amount], 0),
	[amount_recovered] = case when isnull([amount_recovered], 0) = 0 then null else [amount_recovered] end,
	[lowest_of_limit_statutory_budget_less_recovered] = case when isnull([amount_recovered], 0) = 0 then null else [lowest_of_limit_statutory_budget] - [amount_recovered] end,
	[lift_lowest_of_limit_statutory_budget_less_recovered] = case when isnull([amount_recovered], 0) = 0 then null else [lift_lowest_of_limit_statutory_budget] - [amount_recovered] end,
	[senior_lowest_of_limit_statutory_budget_less_recovered] = case when isnull([amount_recovered], 0) = 0 then null else [senior_lowest_of_limit_statutory_budget] - [amount_recovered] end
where dataset_id = @dataset_id 

-- Update [total_levy_after_corrections] {Total Levy After Corrections}. 
update ##tax_district_summary set 
	[total_levy_after_corrections] = case
        when isnull([budget_amount], 2147483647) <= isnull([regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
		and isnull([budget_amount], 2147483647) <= isnull([statutory_levy_amount], 2147483647)  
		and isnull([budget_amount], 2147483647) <= isnull([resolution_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0) 
			then -- Do not add REFUND to amount when BUDGET LIMIT is in use
				[budget_amount] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + isnull([admin_refund_linked_levy_amount], 0) + 
				isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)  
			else [lowest_of_limit_statutory_budget] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + 
				isnull([admin_refund_linked_levy_amount], 0) + isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)
		end,
	[lift_total_levy_after_corrections] = case
        when isnull([budget_amount], 2147483647) <= isnull([lift_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
		and isnull([budget_amount], 2147483647) <= isnull([lift_statutory_levy_amount], 2147483647)  
		and isnull([budget_amount], 2147483647) <= isnull([resolution_lift_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0) 
			then -- Do not add REFUND to amount when BUDGET LIMIT is in use
				[budget_amount] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + isnull([lift_admin_refund_linked_levy_amount], 0) + 
				isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)  
			else [lift_lowest_of_limit_statutory_budget] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + 
				isnull([lift_admin_refund_linked_levy_amount], 0) + isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)
		end,
	[senior_total_levy_after_corrections] = case
        when isnull([budget_amount], 2147483647) <= isnull([senior_regular_property_tax_limit_with_annex_rc], 2147483647) + isnull([refund_amount], 0) 
		and isnull([budget_amount], 2147483647) <= isnull([senior_statutory_levy_amount], 2147483647)  
		and isnull([budget_amount], 2147483647) <= isnull([resolution_senior_amount_with_new_annex_tif], 2147483647) + isnull([refund_amount], 0) 
			then -- Do not add REFUND to amount when BUDGET LIMIT is in use
				[budget_amount] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + isnull([senior_admin_refund_linked_levy_amount], 0) + 
				isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)  
			else [senior_lowest_of_limit_statutory_budget] - isnull([amount_recovered], 0) + isnull([corrections_amount], 0) + 
				isnull([senior_admin_refund_linked_levy_amount], 0) + isnull([banking_capacity], 0) + isnull([shift_diversion_amount], 0)
		end
where dataset_id = @dataset_id 

-- Limit to Statutory Levy Limit Amount
update ##tax_district_summary set 
	[total_levy_after_corrections]	= [statutory_levy_amount]
where dataset_id = @dataset_id and [total_levy_after_corrections] > isnull([statutory_levy_amount], 2147483647)

update ##tax_district_summary set 
	[lift_total_levy_after_corrections]	= [lift_statutory_levy_amount]
where dataset_id = @dataset_id and [lift_total_levy_after_corrections] > isnull([lift_statutory_levy_amount], 2147483647)

update ##tax_district_summary set 
	[senior_total_levy_after_corrections] = [senior_statutory_levy_amount]
where dataset_id = @dataset_id and [senior_total_levy_after_corrections] > isnull([senior_statutory_levy_amount], 2147483647)


-- Update Highest Lawful Levy Rates for General Levy, Linked Levies, and Combined Rate
update ##tax_district_summary set
	[hll_rate_general] = convert(numeric(14, 10), (1000 * ([total_levy_after_corrections] - [admin_refund_linked_levy_amount])) / [taxable_value]),
	[hll_rate_admin_refund_linked] = convert(numeric(14, 10), (1000 * [admin_refund_linked_levy_amount]) / [taxable_value]),
	[hll_rate_non_admin_refund_linked] = convert(numeric(14, 10), (1000 * [linked_levy_amount_non_admin]) / [taxable_value])
where dataset_id = @dataset_id and [taxable_value] > 0

update ##tax_district_summary set
	[lift_hll_rate_general] = convert(numeric(14, 10), (1000 * ([lift_total_levy_after_corrections] - [lift_admin_refund_linked_levy_amount])) / ([taxable_value] - [senior_value])),
	[lift_hll_rate_admin_refund_linked] = convert(numeric(14, 10), (1000 * [lift_admin_refund_linked_levy_amount]) / ([taxable_value] - [senior_value])),
	[lift_hll_rate_non_admin_refund_linked] = convert(numeric(14, 10), (1000 * [lift_linked_levy_amount_non_admin]) / ([taxable_value] - [senior_value]))
where dataset_id = @dataset_id and ([taxable_value] - [senior_value]) > 0

update ##tax_district_summary set
	[senior_hll_rate_general] = convert(numeric(14, 10), (1000 * ([senior_total_levy_after_corrections] - [senior_admin_refund_linked_levy_amount])) / [senior_value]),
	[senior_hll_rate_admin_refund_linked] = convert(numeric(14, 10), (1000 * [senior_admin_refund_linked_levy_amount]) / [senior_value]),
	[senior_hll_rate_non_admin_refund_linked] = convert(numeric(14, 10), (1000 * [senior_linked_levy_amount_non_admin]) / [senior_value])
where dataset_id = @dataset_id and [senior_value] > 0

update ##tax_district_summary set 
	[combined_hll_rate] = convert(numeric(14, 10),  isnull([hll_rate_general],0) + isnull([hll_rate_admin_refund_linked],0) + isnull([hll_rate_non_admin_refund_linked],0)),
	[lift_combined_hll_rate] = convert(numeric(14, 10),  isnull([lift_hll_rate_general],0) + isnull([lift_hll_rate_admin_refund_linked],0) + isnull([lift_hll_rate_non_admin_refund_linked],0)),
	[senior_combined_hll_rate] = convert(numeric(14, 10),  isnull([senior_hll_rate_general],0) + isnull([senior_hll_rate_admin_refund_linked],0) + isnull([senior_hll_rate_non_admin_refund_linked],0))
where dataset_id = @dataset_id and [taxable_value] > 0

-- to eliminate rounding issue, just override the levy rate where levy amounts match
update ##tax_district_summary set 
	[hll_rate_general] = [statutory_levy_rate]
where dataset_id = @dataset_id and [total_levy_after_corrections] - [admin_refund_linked_levy_amount] = [statutory_levy_amount]

update ##tax_district_summary set 
	[lift_hll_rate_general] = [statutory_levy_rate]
where dataset_id = @dataset_id and [lift_total_levy_after_corrections] - [lift_admin_refund_linked_levy_amount] = [lift_statutory_levy_amount]

update ##tax_district_summary set 
	[senior_hll_rate_general] = [statutory_levy_rate]
where dataset_id = @dataset_id and [senior_total_levy_after_corrections] - [senior_admin_refund_linked_levy_amount] = [senior_statutory_levy_amount]

update ##tax_district_summary set 
	[combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [total_levy_after_corrections] = [statutory_levy_amount]

update ##tax_district_summary set 
	[lift_combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [lift_total_levy_after_corrections] = [lift_statutory_levy_amount]

update ##tax_district_summary set 
	[senior_combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [senior_total_levy_after_corrections] = [senior_statutory_levy_amount]

-- Update [rate_computation_for_admin_refund_linked] {Rate Computation for Linked Levies}
update ##tax_district_summary set 
[rate_computation_for_admin_refund_linked] = convert(numeric(14, 10), 1000 * [budget_admin_refund_linked] / [tax_base_for_linked_levies]) -- Linked Levy Admin Refund
where dataset_id = @dataset_id and [tax_base_for_linked_levies] <> 0

-- Update [rate_linked_levies_non_admin] {Rate Computation for Linked Levies}
update ##tax_district_summary set 
[rate_linked_levies_non_admin] = convert(numeric(14, 10), 1000 * [budget_non_admin_refund_linked] / [tax_base_for_non_admin_linked_levies]) -- Linked Levy Non Admin Refund
where dataset_id = @dataset_id and [tax_base_for_non_admin_linked_levies] <> 0

-- Update Total Levy and Total Levy Rate Computiotns for School, Bond, and Excess Levies
update ##tax_district_summary set 
	[total_levy_rate_for_computation] = isnull([rate_computation_for_levy], 0) + isnull([rate_computation_for_admin_refund_linked], 0) + isnull([rate_linked_levies_non_admin], 0),
	[total_levy_for_computation] = isnull([budget_amount_for_levy], 0) + isnull([budget_admin_refund_linked], 0) + isnull(budget_non_admin_refund_linked, 0)
where dataset_id = @dataset_id 

-- Update the levy rate to use for Lid Lift Rate computation
update ##tax_district_summary set 
	[final_or_voted_levy_rate] = voted_levy_rate
where dataset_id = @dataset_id and lid_lift_exists = 1

-- Calculate Straight Rate
update ##tax_district_summary set 
	[total_levy_for_straight_rate] = convert(numeric(14, 2), [final_or_voted_levy_rate] * [tax_base_for_run] / 1000)
where dataset_id = @dataset_id 

-- Calculate Senior Rate
update ##tax_district_summary set 
    [senior_total_rate] = convert(numeric(14, 2), [senior_levy_rate] * [senior_value] / 1000)
where dataset_id = @dataset_id 

-- Limit to Statutory Levy Limit Rate
update ##tax_district_summary set 
	[hll_rate_general]	= [statutory_levy_rate]
where dataset_id = @dataset_id and [hll_rate_general] > [statutory_levy_rate]
				
update ##tax_district_summary set 
	[lift_hll_rate_general]	= [statutory_levy_rate]
where dataset_id = @dataset_id and [lift_hll_rate_general] > [statutory_levy_rate]
				
update ##tax_district_summary set 
	[senior_hll_rate_general]	= [statutory_levy_rate]
where dataset_id = @dataset_id and [senior_hll_rate_general] > [statutory_levy_rate]
				
update ##tax_district_summary set 
	[combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [combined_hll_rate] > [statutory_levy_rate]		

update ##tax_district_summary set 
	[lift_combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [lift_combined_hll_rate] > [statutory_levy_rate]		

update ##tax_district_summary set 
	[senior_combined_hll_rate] = [statutory_levy_rate]
where dataset_id = @dataset_id and [senior_combined_hll_rate] > [statutory_levy_rate]		

-- most recent election
update tds
set most_recent_election_start_year = mr.most_recent_election_start_year,
	most_recent_election_term = mr.most_recent_election_term,
	most_recent_election_is_senior_exempt = isnull(mr.most_recent_election_is_senior_exempt, 0)
from ##tax_district_summary tds
outer apply (
	select top 1 
		lp.year most_recent_election_start_year, 
		isnull(lp.election_term, 0) most_recent_election_term,
		lp.voted_levy_is_senior_exempt most_recent_election_is_senior_exempt
	from levy lp
	where lp.tax_district_id = tds.tax_district_id
	and lp.levy_cd = tds.levy_cd
	and lp.year <= tds.levy_year
	and lp.election_date is not null
	order by lp.year desc
) mr


-- NULL any values that should not be populated
update ##tax_district_summary set 
	[calc_method_levy_year] = NULL,
	[nolift_calc_method_levy_year] = NULL,
	[calc_method_levy_amount] = NULL,
	[general_limit_factor] = NULL,
	[senior_general_limit_factor] = NULL,
	[pct_increase_levy_amount] = NULL,
	[lift_pct_increase_levy_amount] = NULL,
	[new_const_value] = NULL,
	[lift_new_const_value] = NULL,
	[senior_new_const_value] = NULL,
	[new_const_levy_amount] = NULL,
	[lift_new_const_levy_amount] = NULL,
	[senior_new_const_levy_amount] = NULL,
	[non_annex_state_taxable_this_year] = NULL,
	[state_taxable_last_year] = NULL,
	[new_state_levy_amount] = NULL,
	[regular_property_tax_limit] = NULL,
	[lift_regular_property_tax_limit] = NULL,
	[senior_regular_property_tax_limit] = NULL,
	[annex_levy_rate] = NULL,
	[lift_annex_levy_rate] = NULL,
	[senior_annex_levy_rate] = NULL,
	[annex_value] = NULL,
	[lift_annex_value] = NULL,
	[senior_annex_value] = NULL,
	[annex_levy_amount] = NULL,
	[lift_annex_levy_amount] = NULL,
	[senior_annex_levy_amount] = NULL,
	[regular_property_tax_limit_with_annex] = NULL,
	[received_capacity] = NULL,
	[regular_property_tax_limit_with_annex_rc] = NULL,
	[resolution_limit_factor] = NULL,
	[resolution_senior_limit_factor] = NULL,
	[prior_year_levy] = NULL,
	[resolution_amount_with_new_annex_tif] = NULL,
	[resolution_lift_amount_with_new_annex_tif] = NULL,
	[resolution_senior_amount_with_new_annex_tif] = NULL,
	[population_count] = NULL,
	[first_percent_amount] = NULL,
	[second_percent_amt] = NULL,
	[resolution_pct_increase_levy_amount] = NULL,
	[resolution_senior_pct_increase_levy_amount] = null,
	[resolution_regular_property_tax_limit] = NULL,
	[budget_amount] = NULL,
	[total_levy] = NULL,
	[amount_recovered] = NULL,
	[lowest_of_limit_statutory_budget_less_recovered] = NULL,
	[lift_lowest_of_limit_statutory_budget_less_recovered] = NULL,
	[senior_lowest_of_limit_statutory_budget_less_recovered] = NULL,
	[corrections_year] = NULL,
	[corrections_amount] = NULL,
	[refund_amount] = NULL,
	[banking_capacity] = NULL,
	[shift_to_levy_cd] = NULL,
	[total_levy_after_corrections] = NULL,
	[lift_total_levy_after_corrections] = NULL,
	[senior_total_levy_after_corrections] = NULL,
	[hll_rate_general] = NULL,
	[lift_hll_rate_general] = NULL,
	[senior_hll_rate_general] = NULL,
	[hll_rate_admin_refund_linked] = NULL,
	[lift_hll_rate_admin_refund_linked] = NULL,
	[senior_hll_rate_admin_refund_linked] = NULL,
	[combined_hll_rate] = NULL,
	[lift_combined_hll_rate] = NULL,
	[senior_combined_hll_rate] = NULL,
	[linked_levy_amount_non_admin] = NULL,
	[lift_linked_levy_amount_non_admin] = NULL,
	[senior_linked_levy_amount_non_admin] = NULL,
	[hll_rate_non_admin_refund_linked] = NULL,
	[lift_hll_rate_non_admin_refund_linked] = NULL,
	[senior_hll_rate_non_admin_refund_linked] = NULL,
	tif_active = 0,
	prior_year_tif_levy_amount = null,
	non_senior_prior_year_tif_levy_amount = null,
	senior_prior_year_tif_levy_amount = null
from ##tax_district_summary
where dataset_id = @dataset_id and hll_limit_exists = 0

update ##tax_district_summary set 
	[statutory_levy_rate] = NULL,
	[statutory_levy_amount] = NULL
where dataset_id = @dataset_id and stat_limit_exists = 0

update ##tax_district_summary set 
	[lesser_of_aggregate_constitutional] = NULL
where dataset_id = @dataset_id and agg_limit_exists = 0 and const_limit_exists = 0

update ##tax_district_summary set 
	[budget_amount_for_levy] = NULL,
	[tax_base_for_levy] = NULL,
	[rate_computation_for_levy] = NULL,
	[budget_admin_refund_linked] = NULL,
	[tax_base_for_linked_levies] = NULL,
	[rate_computation_for_admin_refund_linked] = NULL,
	[total_levy_rate_for_computation] = NULL,
	[total_levy_for_computation] = NULL,
	[budget_non_admin_refund_linked] = NULL,
	[rate_linked_levies_non_admin] = NULL,
	[tax_base_for_non_admin_linked_levies] = NULL
where dataset_id = @dataset_id 
and hll_limit_exists = 1


update ##tax_district_summary set 
	[final_or_voted_levy_rate] = NULL,
	[tax_base_for_run] = NULL,
	[total_levy_for_straight_rate] = NULL,
	senior_levy_rate = 0.0,
	senior_value = 0,
	senior_total_rate = 0.0
where dataset_id = @dataset_id 
and (
		lid_lift_exists = 0 
	and (budget_limit_exists = 1 or stat_limit_exists = 1 or hll_limit_exists = 1 
			or agg_limit_exists = 1 or const_limit_exists = 1)
)


drop table #cv
drop table #cvt
drop table #taxdistricts

GO

