
create procedure dbo.CertToTaxrollReport
	@year int,
	@dataset_id int,
	@sup_num int,
	@filter_tax_districts varchar(max) = null,
	@filter_levies varchar(max) = null,
	@filter_tax_areas varchar(max) = null,
	@filter_pending_tax_areas varchar(max) = null,
	@include_levies_not_in_cert bit = 0

as

set nocount on

-- Debugging
declare @DEBUG_ENABLED bit = 0					-- 1 enables logging. NEVER EVER CHECK THIS CODE IN WITH A VALUE OF 1
declare @DEBUG_LEVYCD varchar(20) = null	-- quote of the single levy_cd you are researching
declare @DEBUG_PROPID varchar(100) = null --'17053,26603,58464,68511'	-- quote of a comma separated LIST of properties you are investigating

declare @DEBUG_WHERE varchar(200) = null	
declare @DEBUG_SQL varchar(500) = null
if (@DEBUG_LEVYCD is not null or @DEBUG_PROPID is not null) set @DEBUG_WHERE = ' WHERE ' 
if (@DEBUG_LEVYCD is not null)  set @DEBUG_WHERE = @DEBUG_WHERE + ' levy_cd = ''' + @DEBUG_LEVYCD  + ''' '
if (@DEBUG_PROPID is not null)  begin
	if (@DEBUG_LEVYCD is not null) set @DEBUG_WHERE = @DEBUG_WHERE + ' and prop_id in (' + @DEBUG_PROPID  + ')'
	else set @DEBUG_WHERE = @DEBUG_WHERE + ' prop_id in(' + @DEBUG_PROPID  + ')'
end


--cleanup
delete from ##CertToTaxrollReport where dataset_id  = @dataset_id 
delete from ##CertToTaxrollReport_GrandTotal where dataset_id  = @dataset_id 


-- remove local temp tables if they exist
if object_id('tempdb..#levy') is not null 
	drop table #levy
if object_id('tempdb..#results') is not null 
	drop table #results
if object_id('tempdb..#prop_sup_nums') is not null 
	drop table #prop_sup_nums
if object_id('tempdb..#as_of_supnum') is not null 
	drop table #as_of_supnum

if object_id('tempdb..#bill_entries') is not null 
	drop table #bill_entries
if object_id('tempdb..#levy_totals_ba') is not null 
	drop table #levy_totals_ba
if object_id('tempdb..#added_bills') is not null 
	drop table #added_bills
if object_id('tempdb..#levy_totals_add') is not null 
	drop table #levy_totals_add
if object_id('tempdb..#ba_bill_id') is not null 
	drop table #ba_bill_id
if object_id('tempdb..#ba_prev_taxable') is not null 
	drop table #ba_prev_taxable
if object_id('tempdb..#base') is not null 
	drop table #base

if object_id('tempdb..#captured_value') is not null 
	drop table #captured_value
if object_id('tempdb..#prop_supp_assoc') is not null 
	drop table #prop_supp_assoc
if object_id('tempdb..#pv') is not null 
	drop table #pv

if object_id('tempdb..#taxroll') is not null 
	drop table #taxroll

if object_id('tempdb..#value_added_to_roll_assessed_value') is not null 
	drop table #value_added_to_roll_assessed_value
if object_id('tempdb..#value_added_to_roll_taxroll_value') is not null 
	drop table #value_added_to_roll_taxroll_value

if object_id('tempdb..#value_removed_from_roll_assessed_value') is not null 
	drop table #value_removed_from_roll_assessed_value
if object_id('tempdb..#value_removed_from_roll_taxroll_value') is not null 
	drop table #value_removed_from_roll_taxroll_value

if object_id('tempdb..#value_changes_to_roll_assessed_value') is not null 
	drop table #value_changes_to_roll_assessed_value	
if object_id('tempdb..#value_changes_to_roll_taxroll_value') is not null 
	drop table #value_changes_to_roll_taxroll_value



-- get the accepted levy cert run for the report year
declare @levy_cert_run_id int
declare @captured_value_run_id int
declare @certification_sup_num int

set @levy_cert_run_id = -1
set @captured_value_run_id = -1
set @certification_sup_num = -1

select @levy_cert_run_id = max(levy_cert_run_id)
from levy_cert_run lcr with(nolock)
where lcr.accepted_date is not null
and lcr.year = @year

select @captured_value_run_id = lcr.captured_value_run_id
from levy_cert_run lcr with(nolock)
where lcr.levy_cert_run_id = @levy_cert_run_id
and lcr.year = @year

select @certification_sup_num = cvr.as_of_sup_num
from captured_value_run cvr with(nolock) 
where cvr.captured_value_run_id = @captured_value_run_id
and cvr.year = @year



--------------------------------------------------------------------------------
-- Collect information about the levies we are interested in
--------------------------------------------------------------------------------
create table #levy
(
	[year] numeric(4, 0),
	tax_district_id int,
	levy_cd varchar(10),
	levy_description varchar(50),
	voted bit,  -- This field is no longer used in decision making.  Instead it is replaced by levy.timber_assessed_enable
	levy_rate numeric(13, 10),
	senior_levy_rate numeric(13, 10),
	timber_assessed_value numeric(14, 2),
	priority int,
	tax_district_desc varchar(50),
	exempts_senior bit,
	exempts_farm bit,
	is_tif_originator bit,
	is_tif_sponsor bit,
	primary key clustered ([year], tax_district_id, levy_cd)
)

--------------------------------------------------------------------------------
-- Create a table to collect calculation results for populating the report
--------------------------------------------------------------------------------
create table #results (
	priority int,
	row_num int,
	line_item varchar(255),
	[year] numeric(4, 0),
	tax_district_id int,
	tax_district_name varchar(50),
	levy_cd varchar(10),
	levy_description varchar(50),
	assessed_value numeric(16, 0),
	senior_assessed_value numeric(16, 0),
	levy_rate numeric(13, 10),
	senior_levy_rate numeric(13, 10),
	total_levy numeric(14, 2),
	destroyed_property bit,
	prorated_property bit
)


-- selected levies
insert into #levy
([year], tax_district_id, levy_cd, levy_description, voted, levy_rate, senior_levy_rate, timber_assessed_value,
 priority, tax_district_desc, exempts_senior, exempts_farm, is_tif_originator, is_tif_sponsor)
select
	l.[year], l.tax_district_id, l.levy_cd, l.levy_description, l.timber_assessed_enable, l.levy_rate,
	case when (l.senior_levy_rate > 0) and (l.senior_levy_rate < l.levy_rate) then l.senior_levy_rate else null end,
	-- include timber assessed value in levies based on the timber assessed code if enabled
	case when l.timber_assessed_enable = 1 and l.timber_assessed_cd = 'FULL' then
		isnull(l.timber_assessed_full, 0)
		when l.timber_assessed_enable = 1 and l.timber_assessed_cd = 'HALF/ROLL'
			and isnull(l.timber_assessed_half, 0) >= isnull(l.timber_assessed_roll, 0) then
		isnull(l.timber_assessed_half, 0)
		when l.timber_assessed_enable = 1 and l.timber_assessed_cd = 'HALF/ROLL'
			and isnull(l.timber_assessed_half, 0) < isNull(l.timber_assessed_roll, 0) then
		isnull(l.timber_assessed_roll, 0)
	else 0 -- do not include timber assessed value
	end,
	tdt.priority, td.tax_district_desc,
	case when le_snr.exmpt_type_cd = 'SNR/DSBL' then 1 else 0 end,
	case when le_frm.exmpt_type_cd = 'FARM' then 1 else 0 end,
	0, 0
from levy as l with (nolock)
join tax_district as td with (nolock) on
	td.tax_district_id = l.tax_district_id
join tax_district_type as tdt with (nolock) on
	tdt.tax_district_type_cd = td.tax_district_type_cd
left join levy_exemption as le_snr with (nolock) on
		le_snr.[year] = l.[year]
	and le_snr.tax_district_id = l.tax_district_id
	and le_snr.levy_cd = l.levy_cd
	and le_snr.exmpt_type_cd = 'SNR/DSBL'
left join levy_exemption as le_frm with (nolock) on
		le_frm.[year] = l.[year]
	and le_frm.tax_district_id = l.tax_district_id
	and le_frm.levy_cd = l.levy_cd
	and le_frm.exmpt_type_cd = 'FARM'			
			
where l.[year] = @year
and (@include_levies_not_in_cert = 1 or l.include_in_levy_certification = 1)
and (@filter_tax_districts is null or l.tax_district_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_tax_districts)))
and (@filter_levies is null or l.levy_cd in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_levies)))

and (@filter_tax_areas is null or exists(
	select 1 from tax_area_fund_assoc tafa with(nolock)
	join tax_area ta with(nolock) 
		on ta.tax_area_id = tafa.tax_area_id
	where tafa.tax_district_id = l.tax_district_id
		and l.[year] = tafa.[year]
		and l.levy_cd = tafa.levy_cd
		and ta.tax_area_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_tax_areas))
))

and (@filter_pending_tax_areas is null or exists(
	select 1 from tax_area_fund_assoc tafa with(nolock)
	join tax_area ta with(nolock) 
		on ta.tax_area_id = tafa.tax_area_id
	where tafa.tax_district_id = l.tax_district_id
		and l.[year] = tafa.[year]
		and l.levy_cd = tafa.levy_cd
		and ta.tax_area_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_pending_tax_areas))
))



-- mark LTIF originating levies
update lt
set is_tif_originator = 1
from #levy lt
where exists (
	select 1 from levy_cert_tif lct
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	and lct.tax_district_id = lt.tax_district_id
	and lct.levy_cd = lt.levy_cd
)

-- mark LTIF sponsoring levies, and copy the originating levy's rate
update lt
set is_tif_sponsor = 1,
	levy_rate = x.levy_rate,
	senior_levy_rate = x.senior_levy_rate
from #levy lt
cross apply (
	select top 1 ol.*
	from levy_cert_tif lct with(nolock)
	join tif_area_levy tal with(nolock)
		on lct.tif_area_id = tal.tif_area_id
		and lct.tax_district_id = tal.tax_district_id
		and lct.levy_cd = tal.levy_cd
		and lct.year = tal.year
	join levy ol with(nolock)
		on ol.tax_district_id = lct.tax_district_id
		and ol.levy_cd = lct.levy_cd
		and ol.year = lct.year
	where lct.levy_cert_run_id = @levy_cert_run_id
		and lct.year = @year
		and tal.linked_tax_district_id = lt.tax_district_id
		and tal.linked_levy_cd = lt.levy_cd
		and tal.year = lt.year
	order by ol.levy_rate desc
)x


--------------------------------------------------------------------------------
-- Collect Certified taxable value from the Levy Certification data
--------------------------------------------------------------------------------
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	1 as row_num,
	'Certification' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case when l.voted = 1 then
		cvs_vw.taxable_value + l.timber_assessed_value
	else
		cvs_vw.taxable_value
	end,
	case when (l.levy_rate > l.senior_levy_rate) then cvs_vw.senior_value else null end,
	l.levy_rate,
	l.senior_levy_rate
from #levy l
join captured_value_local_summary_vw cvs_vw with(nolock)
	on cvs_vw.[year] = l.[year]
	and cvs_vw.tax_district_id = l.tax_district_id
	and cvs_vw.levy_cd = l.levy_cd
	and cvs_vw.captured_value_run_id = @captured_value_run_id


-- Override the assessed values for LTIF Originating levies
update r
set 
	assessed_value = assessed_value - (isnull(sum_tif_non_senior_increment,0) + isnull(sum_tif_senior_increment,0)),
	senior_assessed_value = senior_assessed_value - isnull(sum_tif_senior_increment,0)
from #results r
join (
	select lct.year, lct.tax_district_id, lct.levy_cd, 
		sum(isnull(tif_non_senior_increment,0)) sum_tif_non_senior_increment, sum(isnull(lct.tif_senior_increment,0)) sum_tif_senior_increment
	from levy_cert_tif lct with(nolock)
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	group by lct.year, lct.tax_district_id, lct.levy_cd
) sums
	on sums.year = r.year
	and sums.tax_district_id = r.tax_district_id
	and sums.levy_cd = r.levy_cd
where r.row_num = 1


-- Set assessed value for LTIF Sponsoring levies
update r
set 
	assessed_value = isnull(sum_tif_non_senior_increment,0) + isnull(sum_tif_senior_increment,0),
	senior_assessed_value = isnull(sum_tif_senior_increment,0)
from #results r
join (
	select tal.year, tal.linked_tax_district_id, tal.linked_levy_cd, 
		sum(isnull(tif_non_senior_increment,0)) sum_tif_non_senior_increment, sum(isnull(lct.tif_senior_increment,0)) sum_tif_senior_increment
	from levy_cert_tif lct with(nolock)
	join tif_area_levy tal with(nolock)
		on lct.tif_area_id = tal.tif_area_id
		and lct.tax_district_id = tal.tax_district_id
		and lct.levy_cd = tal.levy_cd
		and lct.year = tal.year
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	group by tal.year, tal.linked_tax_district_id, tal.linked_levy_cd
) sums
	on sums.year = r.year
	and sums.linked_tax_district_id = r.tax_district_id
	and sums.linked_levy_cd = r.levy_cd
where r.row_num = 1



-- Include a line for levies with no captured certified value
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	1 as row_num,
	'Certification' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	0,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l
left join #results as r 
	on r.[year] = l.[year]
	and r.tax_district_id = l.tax_district_id
	and r.levy_cd = l.levy_cd
	and r.line_item = 'Certification'
where r.line_item is null



-- create a temporary table to hold all captured value broken out by category
create table #captured_value
(
	[year] numeric(4,0),
	sup_num int,
	prop_id int,
	tax_district_id int,
	levy_cd varchar(10),
	fund_id int,
	tax_area_id int,
	appraised_classified numeric(16, 0) not null,
	appraised_non_classified numeric(16, 0) not null,
	real_pers_value_non_annex numeric(14, 0) not null,
	state_value_non_annex numeric(14, 0) not null,
	senior_value_non_annex numeric(14, 0) not null,
	new_const_value_non_annex numeric(14, 0) not null,
	opinion_of_value_highly_disputed numeric(14, 0) not null,
	real_pers_value_annex numeric(14, 0) not null,
	state_value_annex numeric(14, 0) not null,
	senior_value_annex numeric(14, 0) not null,
	new_const_value_annex numeric(14, 0) not null,
	real_value numeric(16, 0) not null,
	personal_value numeric(16, 0) not null,
	senior_real_value numeric(16, 0) not null,
	senior_personal_value numeric(16, 0) not null,
	exempt_senior_value_non_annex numeric(16, 0) not null,
	exempt_senior_value_annex numeric(16, 0) not null,
	is_annexation_value bit,
	ioll bit
)


-- create a 'fake' prop_supp_assoc from wash_prop_owner_val
select [year], max(sup_num) as sup_num, prop_id
into #prop_supp_assoc
from wash_prop_owner_val with (nolock)
where [year] = @year and sup_num <= @sup_num
group by [year], prop_id 

create index #ndx_prop_supp_assoc on #prop_supp_assoc([year],sup_num ,prop_id )


-- update the fund_id to reflect the fund associated with any pending tax areas
-- whose active annexations take effect as of January 1, {Tex Year}
declare @as_of_date datetime
set @as_of_date = convert(datetime, '1/1/' + cast((@year + 1) as varchar))


create table #pv(prop_val_yr numeric(4,0),sup_num int,prop_id int,state_assessed_utility bit, ioll bit)

-- set up pv table for performance on insert to #captured_value
insert into #pv
select pv.prop_val_yr, pv.sup_num, pv.prop_id,pst.state_assessed_utility, pst.imp_leased_land
from #prop_supp_assoc psa join
	property_val as pv with (nolock) 
	on pv.prop_val_yr = @year 
	and psa.[year] = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
	and psa.prop_id = pv.prop_id
left join property_sub_type as pst with (nolock) on
		pst.property_sub_cd = pv.sub_type

create index idx_tmp_pv on #pv(prop_val_yr, sup_num, prop_id,state_assessed_utility)


-- populate the temp table with all values for the current year
insert into #captured_value
(
	[year],
	sup_num,
	prop_id,
	tax_district_id,
	levy_cd,
	fund_id, 
	tax_area_id,
	appraised_classified,
	appraised_non_classified,
	real_pers_value_non_annex,
	state_value_non_annex,
	senior_value_non_annex,
	new_const_value_non_annex,
	opinion_of_value_highly_disputed,
	real_pers_value_annex,
	state_value_annex,
	senior_value_annex,
	new_const_value_annex,
	real_value,
	personal_value,
	senior_real_value,
	senior_personal_value,
	exempt_senior_value_non_annex,
	exempt_senior_value_annex,
	is_annexation_value,
	ioll
)
select
	@year, -- year
	psa.sup_num, -- sup_num
	psa.prop_id, -- prop_id
	tafa.tax_district_id, -- tax_district_id
	tafa.levy_cd, -- levy_cd
	tafa.fund_id, -- fund_id
	tafa.tax_area_id, -- tax_area_id
	isnull(wpov.appraised_classified, 0),	-- appraised_classified
	isnull(wpov.appraised_non_classified, 0), -- appraised_non_classified	
	isnull(wpov.taxable_non_classified, 0), -- real_pers_value_non_annex
	case									-- state_value_non_annex 
		when pv.state_assessed_utility = 1 then isnull(wpov.taxable_non_classified, 0)
		else 0  
	end as state_assessed,	
	isnull(wpov.taxable_classified, 0), -- senior_value_non_annex
	isnull(wpov.new_val_hs, 0) + isnull(wpov.new_val_nhs, 0) + isnull(wpov.new_val_p, 0), -- new_const_value_non_annex
	isnull(ap.opinion_of_value, 0), -- opinion_of_value_highly_disputed
	0, -- real_pers_value_annex
	0, -- state_value_annex
	0, -- senior_value_annex
	0, -- new_const_value_annex
	0, -- real_value
	0, -- personal_value
	0, -- senior_real_value
	0, -- senior_personal_value
	0, -- exempt_senior_value_non_annex
	0, -- exempt_senior_value_annex
	0, -- is_annexation_value
	isnull(pv.ioll, 0) -- ioll
from wash_prop_owner_val as wpov with (nolock)
join #prop_supp_assoc as psa on
		wpov.[year] = @year
	and psa.[year] = @year
	and	psa.[year] = wpov.[year]
	and psa.sup_num = wpov.sup_num
	and psa.prop_id = wpov.prop_id
join property_tax_area as pta on
		pta.[year] = @year
	and	pta.[year] = wpov.[year]
	and pta.sup_num = wpov.sup_num
	and pta.prop_id = wpov.prop_id
join tax_area_fund_assoc as tafa with (nolock) on
		tafa.[year] = @year
	and	tafa.[year] = pta.[year]
	and tafa.tax_area_id = pta.tax_area_id
join fund as f with (nolock) on
		f.[year] = @year
	and	f.[year] = tafa.[year]
	and f.tax_district_id = tafa.tax_district_id
	and f.levy_cd = tafa.levy_cd
	and f.fund_id = tafa.fund_id
	and @as_of_date >= convert(datetime, convert(varchar, f.begin_date, 101), 101)
	and @as_of_date < dateadd(day, 1, convert(datetime, convert(varchar, isnull(f.end_date, '1/1/9999'), 101), 101))
join #pv as pv with (nolock) on
		pv.prop_val_yr = @year
	and psa.[year] = @year
	and	psa.[year] = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
	and psa.prop_id = pv.prop_id
join #levy l with(nolock) on
		l.tax_district_id = tafa.tax_district_id
	and l.levy_cd = tafa.levy_cd
	and l.year = tafa.year
left join _arb_protest as ap with (nolock) on
		ap.prop_val_yr = @year
	and ap.prop_id = pv.prop_id
	and ap.highly_disputed_property = 1
where not (
	-- count LTIF sponsoring levy value on LTIF properties only 
	l.is_tif_sponsor = 1
	and not exists(
		select 1 
		from tif_area_bill_values tabv with(nolock)
		join tif_area_levy tal with(nolock)
			on tal.tif_area_id = tabv.tif_area_id
			and tal.year = tabv.year
			and tal.tax_district_id = tabv.tax_district_id
			and tal.levy_cd = tabv.levy_cd
		where tabv.prop_id = psa.prop_id
			and tabv.year = psa.year
			and tabv.sup_num = psa.sup_num
			and tal.linked_tax_district_id = l.tax_district_id
			and tal.linked_levy_cd = l.levy_cd
	)
)


-- Override taxable values for LTIF properties with originating levies
update cv
set real_pers_value_non_annex = tabv.remainder_nc, 
	senior_value_non_annex = tabv.remainder_c,
	state_value_non_annex = 0
from #captured_value cv
join tif_area_bill_values tabv with(nolock)
	on tabv.prop_id = cv.prop_id
	and tabv.year = cv.year
	and tabv.sup_num = cv.sup_num
	and tabv.tax_district_id = cv.tax_district_id
	and tabv.levy_cd = cv.levy_cd
		
-- Override taxable values for LTIF properties with sponsoring levies
update cv
set real_pers_value_non_annex = tabv.increment_nc, 
	senior_value_non_annex = tabv.increment_c,
	state_value_non_annex = 0
from #captured_value cv
join tif_area_levy tal
	on tal.linked_tax_district_id = cv.tax_district_id
	and tal.linked_levy_cd = cv.levy_cd
	and tal.year = cv.year
join tif_area_bill_values tabv with(nolock)
	on tabv.prop_id = cv.prop_id
	and tabv.year = cv.year
	and tabv.sup_num = cv.sup_num
	and tabv.tax_district_id = tal.tax_district_id
	and tabv.levy_cd = tal.levy_cd
	and tabv.tif_area_id = tal.tif_area_id

-- if state assessed value exists, then zero out the non-classified value
update #captured_value set 
	real_pers_value_non_annex = 0 
where state_value_non_annex > 0


-- copy classified value to the exempt_senior_value column for later use
update data set -- RBK
--		appraised_non_classified = appraised_non_classified + appraised_classified,
--		real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex
	exempt_senior_value_non_annex = senior_value_non_annex,
	senior_value_non_annex = 0
from #captured_value data
inner join property p with (nolock) on
	data.prop_id = p.prop_id
	and prop_type_cd in ('R', 'MH')
inner join levy_exemption le with (nolock) on
		le.[year]				= data.[year]
	and le.tax_district_id		= data.tax_district_id
	and le.levy_cd				= data.levy_cd
	and le.exmpt_type_cd		= 'SNR/DSBL'


-- Although Personal Property may have classified value, a levy may not necessarily
-- exempt classified value for Farm.  If it does however,  
-- copy classified value to the exempt_senior_value column for later use
update #captured_value set
--		appraised_non_classified = appraised_non_classified + appraised_classified,
--		real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex
	exempt_senior_value_non_annex = senior_value_non_annex,
	senior_value_non_annex = 0		
where prop_id in (select prop_id from [property] where prop_type_cd not in ('R', 'MH'))
and exists (
	select * from levy_exemption as le with (nolock) where
		le.[year]				= #captured_value.[year]
	and le.tax_district_id		= #captured_value.tax_district_id
	and le.levy_cd				= #captured_value.levy_cd
	and le.exmpt_type_cd		= 'FARM'
)


-- Per Bug 8867, any senior value for personal property that is non-exempt
-- should be shifted to the real_pers_value column and zeroed out
-- leave the IOLL properties 
update #captured_value set
	real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex,
	senior_value_non_annex = 0
where senior_value_non_annex > 0
and prop_id in (select prop_id from [property] where (prop_type_cd not in ('R', 'MH')))

create index idx_tmp_prop_id on #captured_value(prop_id,real_pers_value_non_annex,senior_value_non_annex)

	
-- Classify taxable property value into real property or personal property for reporting
	
update #captured_value set
	real_value = real_pers_value_non_annex,
	senior_real_value = senior_value_non_annex
where 
	prop_id in (select prop_id from [property] where prop_type_cd in ('R', 'MH'))
	and  #captured_value.ioll = 0

	
update #captured_value set
	personal_value = real_pers_value_non_annex,
	senior_personal_value = senior_value_non_annex
where 
	(prop_id in (select prop_id from [property] where (prop_type_cd not in ('R', 'MH'))) or #captured_value.ioll = 1)


-- now update the annex values for any properties involved in an active 
-- annexation for the current year
update #captured_value set
	real_pers_value_annex = real_pers_value_non_annex,
	state_value_annex = state_value_non_annex,
	senior_value_annex = senior_value_non_annex,
	exempt_senior_value_annex = exempt_senior_value_non_annex,
	new_const_value_annex = new_const_value_non_annex,
	is_annexation_value = 1
from #captured_value as cv
join (
	select distinct apa.prop_id, a.start_year as [year], pta_child.tax_area_id, a.tax_district_id
	from annexation as a with (nolock)
	join annexation_property_assoc as apa with (nolock) on
			apa.annexation_id = a.annexation_id
	join tax_area_mapping as tam with (nolock) on
			tam.annexation_id = a.annexation_id
	join #prop_supp_assoc as psa on
			psa.[year] = a.start_year
		and psa.prop_id = apa.prop_id
	join property_tax_area as pta_child with (nolock) on
			pta_child.prop_id = apa.prop_id
		and pta_child.[year] = a.start_year
		and pta_child.is_annex_value = 1
		and pta_child.tax_area_id = tam.tax_area_destination_id
		and pta_child.sup_num = psa.sup_num
	where a.start_year = @year
	and a.annexation_status = 1
) as pta on
		pta.prop_id			= cv.prop_id
	and pta.[year]			= cv.[year]
	and pta.tax_area_id		= cv.tax_area_id
	and pta.tax_district_id = cv.tax_district_id


-- clear new construction non-annex value for property that was annexed.
-- We don't want new construction value to be summed in the the total new construction value 
update #captured_value set
	new_const_value_non_annex = 0
where is_annexation_value = 1
and new_const_value_annex > 0



--------------------------------------------------------------------------------
-- Collect Taxroll taxable value from the levy bill data
--------------------------------------------------------------------------------

----creating a temp table to get the minimum sup num for each bill that was supplemented after the given sup_num.  That is needed
----to so we can get the correct previous taxable value from bill_adjustment.  If a bill was supplemented after the specified supp, 
----levy_bill.taxable_val will be set to the latest sup_num.

create table #ba_prev_taxable
(
	bill_id int,
	bill_adj_id int
)

insert into #ba_prev_taxable
select bill_adjustment.bill_id, 
	min(bill_adjustment.bill_adj_id) -- RBK
from bill_adjustment with (nolock)
join bill with (nolock) 
	on bill.bill_id = bill_adjustment.bill_id
where bill.[year] = @year
	and bill_adjustment.sup_num > @sup_num -- RBK
	and bill_adjustment.transaction_id is not null
	and bill_calc_type_cd = 'SM'
group by bill_adjustment.bill_id


select
	lb.bill_id,
	l.priority,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case	
		when senior_levy_rate is null
			then null
		when current_levy = 0 
			then 0
		when has_levy_ex = 1 
			then 0
		when has_prop_senior_ex = 1
			-- select senior assessed value from LTIF originating levy remainder, LTIF sponsoring levy increment, or regular WPOV taxable classified
			then isnull(orig.remainder_c, isnull(spon.increment_c, isnull(wpov.taxable_classified, 0)))
		else 0
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate
into #taxroll
from #levy as l
join levy_bill as lb with (nolock) on lb.[year] = @year
	and lb.[year] = l.[year]
	and lb.tax_district_id = l.tax_district_id
	and lb.levy_cd = l.levy_cd
join bill as b with (nolock) on 
		b.bill_id = lb.bill_id
	and b.[year] = lb.[year]
	and b.bill_type not in ('R', 'RR' )
join levy_supp_assoc as lsa with (nolock) on
		lsa.prop_id = b.prop_id
	and lsa.sup_yr = b.[year]
	and lsa.type = 'L'
left join property_val pvc
	on pvc.prop_id = b.prop_id
	and pvc.prop_val_yr = b.year
	and pvc.prop_inactive_dt is null
	and pvc.sup_num = (
		select max(sup_num)
		from property_val pv with(nolock)
		where pv.prop_id = b.prop_id
		and pv.prop_val_yr = b.year
		and pv.sup_num <= @sup_num
	)
join (
	select prop_id, prop_val_yr, max(sup_num) sup_num from property_val where sup_num <= @sup_num group by prop_id, prop_val_yr having prop_val_yr = @year
) sup_check
	on sup_check.prop_val_yr = pvc.prop_val_yr
	and sup_check.prop_id = pvc.prop_id
	and sup_check.sup_num = pvc.sup_num
left join wash_prop_owner_val as wpovc with (nolock)
	on wpovc.prop_id = pvc.prop_id
	and wpovc.year = pvc.prop_val_yr
	and wpovc.sup_num = pvc.sup_num
	--and wpovc.owner_id = ( -- RBK
	--	select top 1 oc.owner_id
	--	from owner oc with(nolock)
	--	where oc.prop_id = pvc.prop_id
	--	and oc.owner_tax_yr = pvc.prop_val_yr
	--	and oc.sup_num = pvc.sup_num
	--)
cross apply (
	select case when exists(
		select 1 from wash_prop_owner_levy_assoc wpolac with(nolock)
		where wpolac.year = wpovc.year
		and wpolac.sup_num = wpovc.sup_num
		and wpolac.prop_id = wpovc.prop_id
		and wpolac.owner_id = wpovc.owner_id
		and wpolac.levy_cd = lb.levy_cd
		and wpolac.tax_district_id = lb.tax_district_id
	) then 1 else 0 end current_levy
) cl
join wash_prop_owner_val wpov with(nolock) on
	wpov.prop_id = b.prop_id
	--and wpov.owner_id = b.owner_id
	and wpov.year = b.year
	and wpov.sup_num = sup_check.sup_num
cross apply (
	select case when exists (
		select 1 from levy_exemption le with(nolock)
		join property_exemption pe with(nolock)
			on pe.exmpt_type_cd = le.exmpt_type_cd
			and pe.exmpt_tax_yr = le.year
			and pe.owner_tax_yr = le.year
		where le.year = b.year
			and le.tax_district_id = l.tax_district_id
			and le.levy_cd = l.levy_cd
			and pe.prop_id = b.prop_id
			and pe.termination_dt is null -- RBK
			--and pe.owner_id = b.owner_id RBK
			and pe.sup_num = sup_check.sup_num 								
	)
	then 1 else 0 end as has_levy_ex,
	case when exists (
		select 1 from property_exemption pe with(nolock)
		where pe.prop_id = b.prop_id
		--and pe.owner_id = b.owner_id -- RBK
		and pe.exmpt_tax_yr = b.year
		and pe.owner_tax_yr = b.year
		and pe.sup_num = sup_check.sup_num
		and pe.termination_dt is null -- RBK
		and pe.exmpt_type_cd = 'SNR/DSBL' 	
	)
	then 1 else 0 end as has_prop_senior_ex
)ex
outer apply (
	select top 1 tabv.*
	from tif_area_bill_values tabv with(nolock)
	where tabv.prop_id = pvc.prop_id
	and tabv.year = pvc.prop_val_yr
	and tabv.sup_num = pvc.sup_num
	and tabv.tax_district_id = lb.tax_district_id
	and tabv.levy_cd = lb.levy_cd
) orig
outer apply (
	select top 1 tabv.*
	from tif_area_bill_values tabv with(nolock)
	join tif_area_levy tal with(nolock)
		on tal.tif_area_id = tabv.tif_area_id
		and tal.year = tabv.year
		and tal.tax_district_id = tabv.tax_district_id
		and tal.levy_cd = tabv.levy_cd
	where tabv.prop_id = pvc.prop_id
	and tabv.year = pvc.prop_val_yr
	and tabv.sup_num = pvc.sup_num
	and tal.linked_tax_district_id = lb.tax_district_id
	and tal.linked_levy_cd = lb.levy_cd
) spon
where l.[year] = @year



if (@DEBUG_ENABLED = 1) begin
	select 'taxroll'
	set @DEBUG_SQL = 'select * from #taxroll' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end


insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description, senior_assessed_value, levy_rate, senior_levy_rate)
select 
	priority,
	2 as row_num,
	'Taxroll' as line_item,
	year,
	tax_district_id,
	tax_district_desc,
	levy_cd,
	levy_description,
	sum(convert(numeric(16,0), senior_assessed_value)) senior_assessed_value,
	levy_rate,
	senior_levy_rate
from #taxroll   
group by
	priority,
	year,
	tax_district_id,
	tax_district_desc,
	levy_cd,
	levy_description,
	levy_rate,
	senior_levy_rate


--return

update #results set assessed_value = 0
where line_item = 'Taxroll' and assessed_value is null


----------------------------------------------------------------------
---- BEGIN Calculate Total Levy based on coll_transaction entries ----
----------------------------------------------------------------------

----Create tables to get adjustment transactions for bills created in levy AND created after levy (added).
----Joining levy_supp_assoc will exclude any bills added after levy

create table #bill_entries
(
	bill_id int,
	levy_cd varchar(10),
	transaction_id int
)

create table #levy_totals_ba
(
	levy_cd varchar(10),
	amount numeric(14,2)
)

create table #ba_bill_id
(
	bill_id int,
	transaction_id int
)

create table #added_bills
(
	bill_id int,
	levy_cd varchar(10),
	transaction_id  int,
	assessed_value numeric(16, 0)
)

create table #levy_totals_add
(
	levy_cd varchar(10),
	amount numeric(14,2),
	assessed_value numeric(16, 0)
)

insert into #ba_bill_id
select bill_adjustment.bill_id, max(bill_adjustment.transaction_id)
from bill_adjustment with (nolock)
join bill with (nolock) on bill.bill_id = bill_adjustment.bill_id
where bill.[year] = @year
and bill_adjustment.[sup_num] in
	(select max(sup_num) from bill_adjustment
	where bill_id = bill.bill_id
	and sup_num <= @sup_num)
and bill_adjustment.transaction_id is not null
and bill_calc_type_cd = 'SM'
group by bill_adjustment.bill_id

-- Now get the bill adjustment totals and add them to the results
truncate table #bill_entries
insert into #bill_entries
select ba_max.bill_id, l.levy_cd, ba_max.transaction_id
from #levy as l
join levy_bill as lb with (nolock) on
					lb.[year] = @year
	and lb.[year] = l.[year]
	and lb.tax_district_id = l.tax_district_id
	and lb.levy_cd = l.levy_cd
join bill as b with (nolock) on
					b.bill_id = lb.bill_id
	and b.[year] = lb.[year]
	and isnull(b.is_active, 0)      = 1
	and b.bill_type not in ('R', 'RR' )
join levy_supp_assoc as lsa with (nolock) on
					lsa.prop_id = b.prop_id
	and lsa.sup_yr = b.[year]
	and lsa.type = 'L'
join #ba_bill_id as ba_max on
	ba_max.bill_id = lb.bill_id
where l.[year] = @year

insert into #levy_totals_ba
select be.levy_cd, sum(ct.base_amount)
from #bill_entries be
join coll_transaction ct (nolock)
on ct.trans_group_id = be.bill_id
and ct.transaction_id = be.transaction_id
group by levy_cd


----now get bills created on properties that do not exist in levy_supp_assoc
insert into #added_bills
select ba_max.bill_id, l.levy_cd, ba_max.transaction_id, (isnull(ba.previous_taxable_val, lb.taxable_val)) 
from #levy as l
join levy_bill as lb with (nolock) on
		lb.[year] = @year
	and lb.[year] = l.[year]
	and lb.tax_district_id = l.tax_district_id
	and lb.levy_cd = l.levy_cd
join bill as b with (nolock) on
		b.bill_id = lb.bill_id
	and b.[year] = lb.[year]
	and isnull(b.is_active, 0)      = 1
	and b.bill_type not in ('R', 'RR' )
left join levy_supp_assoc as lsa with (nolock) on
		lsa.prop_id = b.prop_id
	and lsa.sup_yr = b.[year]
	and lsa.type = 'L'
join #ba_bill_id as ba_max on ba_max.bill_id = lb.bill_id
left join #ba_prev_taxable as ba_prev on
	ba_prev.bill_id = lb.bill_id
left join bill_adjustment as ba with (nolock) on
	ba.bill_adj_id = ba_prev.bill_adj_id
where l.[year] = @year
and lsa.prop_id is NULL


insert into #levy_totals_add
select ab.levy_cd, NULL, sum(assessed_value)			---changed sum(amount) to NULL 6/6
from #ba_bill_id ba_max
join #added_bills ab
on ab.bill_id = ba_max.bill_id
--join coll_transaction ct (nolock)							----commented out 6/6
--on ct.trans_group_id = ba_max.bill_id
--and ct.transaction_id = ba_max.transaction_id
group by ab.levy_cd


select ab.levy_cd, sum(ct.base_amount) base				---added 6/6
into #base
from #added_bills ab 
join bill_adjustment ba with(nolock)
	on ba.bill_id = ab.bill_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = ab.bill_id
	and ba.transaction_id = ab.transaction_id
where ba.bill_calc_type_cd = 'sm'
and ba.transaction_id is not NULL
and ba.sup_num <= @sup_num
group by ab.levy_cd

update #levy_totals_add						---added 6/6
set amount = base
from #base 
where isnull(#levy_totals_add.levy_cd, 0) = isnull(#base.levy_cd, 0)


-- Taxroll assessed and levy
update res
set 
	assessed_value = sum_assessed,
	total_levy = sum_levy
from #results res
join (
	select cv.levy_cd, 
		sum(round((cv.real_pers_value_non_annex + cv.state_value_non_annex + cv.senior_value_non_annex), 2)) sum_assessed,
		sum(round((cv.real_pers_value_non_annex + cv.state_value_non_annex) * l.levy_rate * 0.001 + cv.senior_value_non_annex * isnull(l.senior_levy_rate, l.levy_rate) * 0.001, 2)) sum_levy 
	from #captured_value cv
	join #levy l 
		on l.tax_district_id = cv.tax_district_id
		and l.levy_cd = cv.levy_cd 
		and l.year = cv.year
	group by cv.levy_cd
) data
on data.levy_cd = res.levy_cd
where res.row_num = 2



-- Include a line for levies with no bills
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	2 as row_num,
	'Taxroll' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	0,
	case when l.senior_levy_rate is null then null else 0 end,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l
left join #results as r 
	on r.[year] = l.[year]
	and r.tax_district_id = l.tax_district_id
	and r.levy_cd = l.levy_cd
	and r.line_item = 'Taxroll'
where r.line_item is null

----------------------------------------------------------------------
----  END Calculate Total Levy based on coll_transaction entries  ----
----------------------------------------------------------------------

--------------------------------------------------------------------------------
-- Record Timber Assessed Value
--------------------------------------------------------------------------------
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	8 as row_num,
	'TAV-Private Harvest Timber Tax' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	l.timber_assessed_value,
	case when l.senior_levy_rate is null then null else 0 end,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l with (nolock)
where l.[year] = @year

--------------------------------------------------------------------------------
-- Record Adjustments
--------------------------------------------------------------------------------
-- We need to know the sup_num of each property at the time of certification
-- and at the time of bill creation that actually changed
create table #prop_sup_nums
(
	[year] numeric(4, 0),
	prop_id int,
	prop_type_cd char(5),
	cert_sup_num int,
	tr_sup_num int
	primary key clustered ([year], prop_id)
)

insert into #prop_sup_nums
([year], prop_id, prop_type_cd, cert_sup_num, tr_sup_num)
select
 wpov.[year], wpov.prop_id, p.prop_type_cd, max(wpov.sup_num), null
from wash_prop_owner_val as wpov with (nolock)
join [property] as p with (nolock) on
				p.prop_id = wpov.prop_id
where wpov.[year] = @year and wpov.sup_num <= @certification_sup_num
group by wpov.[year], wpov.prop_id, p.prop_type_cd


-- If a property has a supplement that is greater than the selected
-- supplement selected by the user then we want to exclude those
select prop_val_Yr, prop_id, sup_num = max(sup_num)
into #as_of_supnum
from wash_property_val with (nolock)
where sup_num <= @sup_num
and prop_val_yr = @year
group by prop_val_yr, prop_id


-- The above queries didn't catch property added to the
-- taxroll that didn't exist at certification
insert into #prop_sup_nums
([year], prop_id, prop_type_cd, cert_sup_num, tr_sup_num)
select
 lsa.year, lsa.prop_id, p.prop_type_cd, null, max(lsa.sup_num)
from wash_prop_owner_levy_assoc as lsa with (nolock)
left join [property] as p with (nolock) on
	p.prop_id = lsa.prop_id
left join #prop_sup_nums on
			#prop_sup_nums.[year] = lsa.year
	and #prop_sup_nums.prop_id = lsa.prop_id
where lsa.year = @year
	and #prop_sup_nums.prop_id is null
and lsa.sup_num <= @sup_num
group by lsa.year, lsa.prop_id, p.prop_type_cd

-- now update the #prop_sup_nums.tr_sup_num value based on it's
-- relationship to the levy_sup_assoc and as of sup num
update #prop_sup_nums 
	set tr_sup_num = aosn.sup_num
from #prop_sup_nums
join #as_of_supnum as aosn on
	aosn.prop_val_yr = #prop_sup_nums.[year]
	and aosn.prop_id = #prop_sup_nums.prop_id

-- property counts
delete from ##CertToTaxrollReport_propcount where dataset_id = @dataset_id

insert into ##CertToTaxrollReport_propcount (dataset_id, row_num, line_item, propCount)
select @dataset_id, 1, 'CERT', count(*)
from #prop_sup_nums psa
join property_val pv with(nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.year
and pv.sup_num = psa.cert_sup_num
where pv.prop_inactive_dt is null 

insert into ##CertToTaxrollReport_propcount (dataset_id, row_num, line_item, propCount)
select @dataset_id, 2, 'SUP', count(*)
from #prop_sup_nums psa
join property_val pv with(nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.year
and pv.sup_num = psa.tr_sup_num
where pv.prop_inactive_dt is null 

insert into ##CertToTaxrollReport_propcount (dataset_id, row_num, line_item, propCount)
select @dataset_id, 3, 'ALL', count(*)
from #prop_sup_nums psa

-- now delete any records where the sup_num didn't change
delete from #prop_sup_nums
where isnull(cert_sup_num, -1) = isnull(tr_sup_num, -1)

--------------------------------------------------------------------------------
-- Value Added To Roll
--------------------------------------------------------------------------------

----Value Added to a levy's roll is determined by the existence of the property in property_val for the 
----property_val.prev_sup_num where prop_inactive_dt is NULL.  If property_val.prop_inactive_dt is not NULL (deleted), 
----and the property is recovered in a later supplement, we treat that as an add just like creating a new property
select
	pv.prop_id,
	pv.sup_num,
	l.priority,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case
		when psa.prop_type_cd is null then
			0 -- We will assume for now that such properties were never included in certification either.
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then
			wpov.taxable_non_classified
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then
			wpov.taxable_non_classified
		else
			wpov.taxable_non_classified + wpov.taxable_classified
	end assessed_value,
	case
		when l.senior_levy_rate is null then null
		when psa.prop_type_cd is null then 0
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then 0
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then 0
		when has_senior_ex = 1 then wpov.taxable_classified
		else 0
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate
into #value_added_to_roll_assessed_value
from #prop_sup_nums as psa
cross apply (
	select top 1 *
	from property_val pvi with(nolock)
	where pvi.prop_val_yr = psa.year
	and pvi.prop_id = psa.prop_id
	and pvi.sup_num > @certification_sup_num
	and pvi.sup_num <= @sup_num
	order by sup_num asc
) pv
join wash_prop_owner_val as wpov with(nolock)
	on wpov.[year] = pv.[prop_val_yr]
	and wpov.prop_id = pv.prop_id
	and wpov.sup_num = pv.sup_num
	--and wpov.owner_id = ( -- RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv.prop_id
	--	and owner.owner_tax_yr = pv.prop_val_yr
	--	and owner.sup_num = pv.sup_num
	--)

join wash_prop_owner_levy_assoc as wpola with(nolock)
	on wpola.[year] = wpov.[year]
	and wpola.prop_id = wpov.prop_id
	and wpola.sup_num = wpov.sup_num
	--and wpola.owner_id = wpov.owner_id -- RBK
join #levy as l 
	on l.[year] = psa.[year]
	and l.tax_district_id = wpola.tax_district_id
	and l.levy_cd = wpola.levy_cd
cross apply (
	select case when exists(
		select 1 from property_exemption pe with(nolock)
		where pe.prop_id = wpov.prop_id
		--and pe.owner_id = wpov.owner_id -- RBK
		and pe.exmpt_tax_yr = wpov.year
		and pe.owner_tax_yr = wpov.year
		and pe.sup_num = wpov.sup_num
		and pe.exmpt_type_cd = 'SNR/DSBL'
	) then 1 else 0 end as has_senior_ex
) propex
where pv.prop_inactive_dt is NULL
and not exists (select * from property_val as pv2 with(nolock)
	where pv.prop_id = pv2.prop_id
	and pv.prop_val_yr = pv2.prop_val_yr
	and pv.prev_sup_num = pv2.sup_num
	and pv2.prop_inactive_dt is NULL)

UNION ALL 

-- If a property is moved to another tax area, count this as added value for levies 
-- that are in the new tax area but not the old one.
select 
	pv.prop_id,
	pv.sup_num,
	l.priority,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case
		when psa.prop_type_cd is null then
			0 -- We will assume for now that such properties were never included in certification either.
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then
			wpov.taxable_non_classified
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then
			wpov.taxable_non_classified
		else
			wpov.taxable_non_classified + wpov.taxable_classified
		end assessed_value,
	case
		when l.senior_levy_rate is null then null
		when psa.prop_type_cd is null then 0
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then 0
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then 0
		when has_senior_ex = 1 then wpov.taxable_classified
		else 0
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate 

from #prop_sup_nums psa
cross apply (
	select top 1 *
	from property_val pvi with(nolock)
	where pvi.prop_val_yr = psa.year
	and pvi.prop_id = psa.prop_id
	and pvi.sup_num > @certification_sup_num
	and pvi.sup_num <= @sup_num
	order by sup_num asc
) pv
join wash_prop_owner_val wpov with(nolock)
	on wpov.[year] = pv.[prop_val_yr]
	and wpov.prop_id = pv.prop_id
	and wpov.sup_num = pv.sup_num
	--and wpov.owner_id = ( -- RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv.prop_id
	--	and owner.owner_tax_yr = pv.prop_val_yr
	--	and owner.sup_num = pv.sup_num
	--)
join wash_prop_owner_levy_assoc wpola with(nolock)
	on wpola.[year] = wpov.[year]
	and wpola.prop_id = wpov.prop_id
	and wpola.sup_num = wpov.sup_num
	--and wpola.owner_id = wpov.owner_id -- RBK
join property_val pv2 with(nolock)
	on pv.prop_id = pv2.prop_id
	and pv.prop_val_yr = pv2.prop_val_yr
	and pv.prev_sup_num = pv2.sup_num
join wash_prop_owner_val wpov2 with(nolock)
	on wpov2.[year] = pv2.[prop_val_yr]
	and wpov2.prop_id = pv2.prop_id
	and wpov2.sup_num = pv2.sup_num
	--and wpov2.owner_id = ( -- RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv2.prop_id
	--	and owner.owner_tax_yr = pv2.prop_val_yr
	--	and owner.sup_num = pv2.sup_num
	--)
join #levy l
	on l.[year] = psa.[year]
	and l.tax_district_id = wpola.tax_district_id
	and l.levy_cd = wpola.levy_cd
cross apply (
	select case when exists(
		select 1 from property_exemption pe with(nolock)
		where pe.prop_id = wpov.prop_id
		--and pe.owner_id = wpov.owner_id --rBK
		and pe.exmpt_tax_yr = wpov.year
		and pe.owner_tax_yr = wpov.year
		and pe.sup_num = wpov.sup_num
		and pe.exmpt_type_cd = 'SNR/DSBL'
	) then 1 else 0 end as has_senior_ex
) propex

where pv.prop_inactive_dt is null
and pv2.prop_inactive_dt is null
and not exists(
	select 1 from wash_prop_owner_levy_assoc wpola2 with(nolock)
	where wpola2.[year] = wpov2.year
	and wpola2.prop_id = wpov2.prop_id
	and wpola2.sup_num = wpov2.sup_num
	--and wpola2.owner_id = wpov2.owner_id -- RBK
	and wpola2.tax_district_id = wpola.tax_district_id
	and wpola2.levy_cd = wpola.levy_cd
)



if (@DEBUG_ENABLED = 1) begin
	select 'value_added_to_roll_assessed_value'
	set @DEBUG_SQL = 'select * from #value_added_to_roll_assessed_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end


insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)

select priority, 4, '� Value Added To Roll', year, 
	tax_district_id, tax_district_desc, levy_cd, levy_description, sum(assessed_value), sum(senior_assessed_value), levy_rate, senior_levy_rate
from #value_added_to_roll_assessed_value
group by [priority], [year], tax_district_id, tax_district_desc, levy_cd, levy_description, levy_rate, senior_levy_rate


-- Include a line for levies with no added value
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	4 as row_num,
	'� Value Added To Roll' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	0,
	case when l.senior_levy_rate is null then null else 0 end,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l
left join #results as r on
		r.[year] = l.[year]
	and r.tax_district_id = l.tax_district_id
	and r.levy_cd = l.levy_cd
	and r.line_item = '� Value Added To Roll'
where r.line_item is null


--------------------------------------------------------------------------------
-- Value Removed From Roll
--------------------------------------------------------------------------------

select
	pv.prop_id,
	pv.sup_num,
	l.priority,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case
		when psa.prop_type_cd is null then
			0 -- We will assume for now that such properties were never included in certification either.
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then
			(wpov.taxable_non_classified - wpov2.taxable_non_classified)
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then
			(wpov.taxable_non_classified - wpov2.taxable_non_classified)
		else
			((wpov.taxable_non_classified + wpov.taxable_classified) - (wpov2.taxable_non_classified + wpov2.taxable_classified))
	end assessed_value,
	case
		when l.senior_levy_rate is null then null
		when psa.prop_type_cd is null then 0
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then 0
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then 0
		else (case when has_senior_ex = 1 then wpov.taxable_classified else 0 end) - 
			(case when has_senior_ex2 = 1 then wpov2.taxable_classified else 0 end)
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate
into #value_removed_from_roll_assessed_value
from #prop_sup_nums as psa
join property_val as pv with (nolock)
	on pv.[prop_val_yr] = psa.[year]
	and pv.prop_id = psa.prop_id
	and pv.[sup_num] > @certification_sup_num
	and pv.sup_num <= @sup_num
join (
	select prop_id, prop_val_yr, max(sup_num) sup_num from property_val where sup_num <= @sup_num group by prop_id, prop_val_yr having prop_val_yr = @year
) sup_check
	on sup_check.prop_val_yr = pv.[prop_val_yr]
	and sup_check.prop_id = pv.prop_id
	and sup_check.sup_num = pv.sup_num
join wash_prop_owner_val wpov with(nolock)
	on wpov.[year] = pv.[prop_val_yr]
	and wpov.prop_id = pv.prop_id
	and wpov.sup_num = pv.sup_num
	--and wpov.owner_id = ( -- RBK
	--	select top 1 owner_id 
	--	from owner with(nolock)
	--	where owner.prop_id = pv.prop_id
	--	and owner.owner_tax_yr = pv.prop_val_yr
	--	and owner.sup_num = pv.sup_num
	--)
join wash_prop_owner_levy_assoc wpola with(nolock)
	on wpola.[year] = wpov.[year]
	and wpola.prop_id = wpov.prop_id
	and wpola.sup_num = wpov.sup_num
	--and wpola.owner_id = wpov.owner_id --RBK
join property_val pv2 with(nolock)
	on pv.prop_id = pv2.prop_id
	and pv.prop_val_yr = pv2.prop_val_yr
	and pv.prev_sup_num = pv2.sup_num
join wash_prop_owner_val wpov2 with(nolock)
	on wpov2.[year] = pv2.[prop_val_yr]
	and wpov2.prop_id = pv2.prop_id
	and wpov2.sup_num = pv2.sup_num
	--and wpov2.owner_id = ( --RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv2.prop_id
	--	and owner.owner_tax_yr = pv2.prop_val_yr
	--	and owner.sup_num = pv2.sup_num
	--)
join #levy as l 
	on l.[year] = psa.[year]
	and l.tax_district_id = wpola.tax_district_id
	and l.levy_cd = wpola.levy_cd
cross apply (
	select case when exists(
		select 1 from property_exemption pe with(nolock)
		where pe.prop_id = wpov.prop_id
		--and pe.owner_id = wpov.owner_id --RBK
		and pe.exmpt_tax_yr = wpov.year
		and pe.owner_tax_yr = wpov.year
		and pe.sup_num = wpov.sup_num
		and pe.exmpt_type_cd = 'SNR/DSBL'
	) then 1 else 0 end as has_senior_ex,
	case when exists(
		select 1 from property_exemption pe2 with(nolock)
		where pe2.prop_id = wpov2.prop_id
		--and pe2.owner_id = wpov2.owner_id --RBK
		and pe2.exmpt_tax_yr = wpov2.year
		and pe2.owner_tax_yr = wpov2.year
		and pe2.sup_num = wpov2.sup_num
		and pe2.exmpt_type_cd = 'SNR/DSBL'
	) then 1 else 0 end as has_senior_ex2
) propex

where pv.prop_inactive_dt is not NULL
and pv2.prop_inactive_dt is NULL

UNION ALL 

-- If a property is moved to another tax area, count this as removed value for levies 
-- that are in the old tax area but not the new one.
select 
	pv.prop_id,
	pv.sup_num,
	l.priority,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case
		when psa.prop_type_cd is null then
			0 -- We will assume for now that such properties were never included in certification either.
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then
			-wpov2.taxable_non_classified
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then
			-wpov2.taxable_non_classified
		else
			-(wpov2.taxable_non_classified + wpov2.taxable_classified)
		end assessed_value,
	case
		when l.senior_levy_rate is null then null
		when psa.prop_type_cd is null then 0
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then 0
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then 0
		when has_senior_ex2 = 1 then -wpov2.taxable_classified
		else 0
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate 

from #prop_sup_nums psa
join property_val pv with(nolock)
	on pv.[prop_val_yr] = psa.[year]
	and pv.prop_id = psa.prop_id
	and pv.[sup_num] > @certification_sup_num
	and pv.sup_num <= @sup_num
join (
	select prop_id, prop_val_yr, max(sup_num) sup_num from property_val where sup_num <= @sup_num group by prop_id, prop_val_yr having prop_val_yr = @year
) sup_check
	on sup_check.prop_val_yr = pv.[prop_val_yr]
	and sup_check.prop_id = pv.prop_id
	and sup_check.sup_num = pv.sup_num
join wash_prop_owner_val wpov with(nolock)
	on wpov.[year] = pv.[prop_val_yr]
	and wpov.prop_id = pv.prop_id
	and wpov.sup_num = pv.sup_num
	--and wpov.owner_id = ( --RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv.prop_id
	--	and owner.owner_tax_yr = pv.prop_val_yr
	--	and owner.sup_num = pv.sup_num
	--)
join property_val pv2 with(nolock)
	on pv.prop_id = pv2.prop_id
	and pv.prop_val_yr = pv2.prop_val_yr
	and pv.prev_sup_num = pv2.sup_num
join wash_prop_owner_val wpov2 with(nolock)
	on wpov2.[year] = pv2.[prop_val_yr]
	and wpov2.prop_id = pv2.prop_id
	and wpov2.sup_num = pv2.sup_num
	--and wpov2.owner_id = (  --RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv2.prop_id
	--	and owner.owner_tax_yr = pv2.prop_val_yr
	--	and owner.sup_num = pv2.sup_num
	--)
join wash_prop_owner_levy_assoc wpola2 with(nolock)
	on wpola2.[year] = wpov2.[year]
	and wpola2.prop_id = wpov2.prop_id
	and wpola2.sup_num = wpov2.sup_num
	--and wpola2.owner_id = wpov2.owner_id --RBK
join #levy l
	on l.[year] = psa.[year]
	and l.tax_district_id = wpola2.tax_district_id
	and l.levy_cd = wpola2.levy_cd
cross apply (
	select case when exists(
		select 1 from property_exemption pe2 with(nolock)
		where pe2.prop_id = wpov2.prop_id
		--and pe2.owner_id = wpov2.owner_id --RBK
		and pe2.exmpt_tax_yr = wpov2.year
		and pe2.owner_tax_yr = wpov2.year
		and pe2.sup_num = wpov2.sup_num
		and pe2.exmpt_type_cd = 'SNR/DSBL'
	) then 1 else 0 end as has_senior_ex2
) propex
where pv.prop_inactive_dt is null
and pv2.prop_inactive_dt is null
and not exists(
	select 1 from wash_prop_owner_levy_assoc wpola with(nolock)
	where wpola.[year] = wpov.year
	and wpola.prop_id = wpov.prop_id
	and wpola.sup_num = wpov.sup_num
	--and wpola.owner_id = wpov.owner_id  --RBK
	and wpola.tax_district_id = wpola2.tax_district_id
	and wpola.levy_cd = wpola2.levy_cd
)

if (@DEBUG_ENABLED = 1) begin
	select 'value_removed_from_roll_assessed_value'
	set @DEBUG_SQL = 'select * from #value_removed_from_roll_assessed_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end



insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)

SELECT priority, 5, '� Value Removed From Roll', year,
	tax_district_id, tax_district_desc, levy_cd, levy_description, sum(assessed_value), sum(senior_assessed_value), levy_rate, senior_levy_rate
from  #value_removed_from_roll_assessed_value
group by [priority], [year], tax_district_id, tax_district_desc, levy_cd, levy_description, levy_rate, senior_levy_rate


-- Include a line for levies with no removed value
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	5 as row_num,
	'� Value Removed From Roll' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	0,
	case when l.senior_levy_rate is null then null else 0 end,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l
left join #results as r on
		r.[year] = l.[year]
	and r.tax_district_id = l.tax_district_id
	and r.levy_cd = l.levy_cd
	and r.line_item = '� Value Removed From Roll'
where r.line_item is null



--------------------------------------------------------------------------------
-- Value Changes To Roll
--------------------------------------------------------------------------------
----Value Changes will have records where property_val.prop_inactive_dt is NULL (property is active)
----in both the current sup_num and prev_sup_num.

select
	pv.prop_id,
	pv.sup_num,
	l.priority,
	6 as row_num,
	'� Value Changes To Roll' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	case
		when psa.prop_type_cd is null then
			0 -- We will assume for now that such properties were never included in certification either.
		--when l.exempts_senior = 1 and has_senior_ex = 0 and has_senior_ex2 = 0 and psa.prop_type_cd in ('R', 'MH') then -- RBK
			--(wpov.taxable_non_classified - wpov2.taxable_non_classified)
		--when l.exempts_senior = 1 and has_senior_ex = 1 and has_senior_ex2 = 1 and psa.prop_type_cd in ('R', 'MH') then -- RBK
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then -- RBK
			(wpov.taxable_non_classified - wpov2.taxable_non_classified)
		--when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then --RBK
			--(wpov.taxable_classified) -- this handles when exemption was prorated and no longer applies. the wpov values do not change but the assessed value needs to be included
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then
			(wpov.taxable_non_classified - wpov2.taxable_non_classified)
		else
			((wpov.taxable_non_classified + wpov.taxable_classified) - (wpov2.taxable_non_classified + wpov2.taxable_classified))
	end assessed_value,
	case
		when l.senior_levy_rate is null then null
		when psa.prop_type_cd is null then 0
		when l.exempts_senior = 1 and psa.prop_type_cd in ('R', 'MH') then 0
		when l.exempts_farm = 1 and psa.prop_type_cd not in ('R', 'MH') then 0
		else (case when has_senior_ex = 1 then wpov.taxable_classified else 0 end) - 
			(case when has_senior_ex2 = 1 then wpov2.taxable_classified else 0 end)
	end senior_assessed_value,
	l.levy_rate,
	l.senior_levy_rate,
	case when dp.prop_id is not null then 1 else 0 end destroyed_property,
	case when wpov.prorate_type is not null then 1 else 0 end prorated_property
	--sum(iad1.levy_amount_due) levy_amt
	--sum(convert(numeric(14, 2),iad1.current_amount_due) - convert(numeric(14, 2),iad1.initial_amount_due))  levy_amt
into #value_changes_to_roll_assessed_value		
from #prop_sup_nums as psa
join property_val as pv with (nolock) on
		pv.[prop_val_yr] = psa.[year]
	and pv.prop_id = psa.prop_id
	and pv.[sup_num] > @certification_sup_num
	and pv.sup_num <= @sup_num
join (
	select prop_id, prop_val_yr, max(sup_num) sup_num from property_val where sup_num <= @sup_num group by prop_id, prop_val_yr having prop_val_yr = @year
) sup_check
	on sup_check.prop_val_yr = pv.[prop_val_yr]
	and sup_check.prop_id = pv.prop_id
	and sup_check.sup_num = pv.sup_num
--join bill b on
--	b.prop_id = sup_check.prop_id and
--	b.year = sup_check.prop_val_yr and
--	--b.sup_num = sup_check.sup_num and
--	b.bill_type = 'L'
--join bill_adjustment ba on
--	ba.bill_id = b.bill_id and
--	ba.sup_num = sup_check.sup_num
--join levy_bill lb on
--	lb.bill_id = b.bill_id and
--	lb.year = b.year and
--	b.bill_type not in ('R', 'RR' )
join wash_prop_owner_val wpov with(nolock)
	on wpov.[year] = pv.[prop_val_yr]
	and wpov.prop_id = pv.prop_id
	and wpov.sup_num = pv.sup_num
	--and wpov.owner_id = ( --RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv.prop_id
	--	and owner.owner_tax_yr = pv.prop_val_yr
	--	and owner.sup_num = pv.sup_num
	--)
join wash_prop_owner_levy_assoc as wpola with (nolock) 
	on wpola.[year] = wpov.[year]
	and wpola.prop_id = wpov.prop_id
	and wpola.sup_num = wpov.sup_num
	--and wpola.owner_id = wpov.owner_id --RBK
join property_val pv2 with(nolock)
	on pv.prop_id = pv2.prop_id
	and pv.prop_val_yr = pv2.prop_val_yr
	--and pv.prev_sup_num = pv2.sup_num
--	and pv2.[sup_num] <= @certification_sup_num
	--and pv2.[sup_num] = (select  min(sup_num) sup_num from property_val group by prop_id, prop_val_yr having prop_val_yr = @year and prop_id = pv.prop_id)
	and pv2.[sup_num] = ( -- have to match this sup_num with the highest sup_num prior to certification but ALSO include earliest sup_num to any  ADDED properties which were later changed
		select  max(sup_num) sup_num from (
			select prop_id, prop_val_yr, max(sup_num) sup_num from property_val where sup_num <= @certification_sup_num group by prop_id, prop_val_yr having prop_val_yr = @year and prop_id = pv.prop_id
			union
			select prop_id, prop_val_yr, min(sup_num) sup_num from property_val group by prop_id, prop_val_yr having prop_val_yr = @year and prop_id = pv.prop_id
		) SUPPLOGIC
		group by prop_id
	)
join wash_prop_owner_val wpov2 with(nolock)
	on wpov2.[year] = pv2.[prop_val_yr]
	and wpov2.prop_id = pv2.prop_id
	and wpov2.sup_num = pv2.sup_num
	--and wpov2.owner_id = ( --RBK
	--	select top 1 owner_id
	--	from owner with(nolock)
	--	where owner.prop_id = pv2.prop_id
	--	and owner.owner_tax_yr = pv2.prop_val_yr
	--	and owner.sup_num = pv2.sup_num
	--)
join #levy as l 
	on l.[year] = @year
	and l.[year] = psa.[year]
	and l.tax_district_id = wpola.tax_district_id
	and l.levy_cd = wpola.levy_cd 
	--and l.levy_cd = lb.levy_cd
--left join (
--	--select prop_id, b.year, sup_num, sum(initial_amount_due) initial_amount_due, sum(current_amount_due)  current_amount_due, lb.levy_cd from bill as b with (nolock) -- RBK
--	--inner join levy_bill lb on 
--	--    b.bill_id = lb.bill_id
--	--	and b.bill_type not in ('R', 'RR' )
--	--group by prop_id, b.year, sup_num, lb.levy_cd
--	--having sup_num < @sup_num -- RBK
--	select prop_id, b.year, b.sup_num, case when ba.sup_num is null then sum(current_amount_due - initial_amount_due) else sum(base_tax - previous_base_tax) end levy_amount_due, lb.levy_cd
--	from bill as b with (nolock) -- RBK
--	left join levy_bill lb on 
--	    b.bill_id = lb.bill_id
--		and b.bill_type not in ('R', 'RR' )
--	left join #ba_prev_taxable as ba_prev 
--	   on ba_prev.bill_id = b.bill_id
--    left join bill_adjustment as ba with (nolock) on
--	    ba.bill_adj_id = ba_prev.bill_adj_id
--	group by prop_id, b.year, b.sup_num, ba.sup_num, lb.levy_cd
--	having b.sup_num <= @sup_num and b.year = @year
--) iad1 on
--iad1.prop_id = pv.prop_id
--and iad1.year = pv.prop_val_yr
--and iad1.levy_cd = l.levy_cd
--and iad1.sup_num <= sup_check.sup_num -- RBK
cross apply (
	select case when exists(
		select 1 from property_exemption pe with(nolock)
		where pe.prop_id = wpov.prop_id
		--and pe.owner_id = wpov.owner_id --RBK
		and pe.exmpt_tax_yr = wpov.year
		and pe.owner_tax_yr = wpov.year
		and pe.sup_num = wpov.sup_num
		and pe.exmpt_type_cd = 'SNR/DSBL'
		and pe.termination_dt is null -- RBK
	) then 1 else 0 end as has_senior_ex,
	case when exists(
		select 1 from property_exemption pe2 with(nolock)
		where pe2.prop_id = wpov2.prop_id
		--and pe2.owner_id = wpov2.owner_id --RBK
		and pe2.exmpt_tax_yr = wpov2.year
		and pe2.owner_tax_yr = wpov2.year
		and pe2.sup_num = wpov2.sup_num
		and pe2.exmpt_type_cd = 'SNR/DSBL'
		and pe2.termination_dt is null -- RBK
	) then 1 else 0 end as has_senior_ex2
) propex
left join destroyed_property dp on
	dp.prop_id = sup_check.prop_id and
	dp.sup_num = sup_check.sup_num and
	dp.prop_val_yr = sup_check.prop_val_yr
where pv.prop_inactive_dt is NULL
and pv2.prop_inactive_dt is NULL
and exists( 
	select 1 from wash_prop_owner_levy_assoc wpola2 with(nolock)
	where wpola2.[year] = wpov2.year
	and wpola2.prop_id = wpov2.prop_id
	and wpola2.sup_num = wpov2.sup_num
	--and wpola2.owner_id = wpov2.owner_id --RBK
	and wpola2.tax_district_id = wpola.tax_district_id
	and wpola2.levy_cd = wpola.levy_cd
)
--and pv.prop_id in ( 22837)

--select * from #value_changes_to_roll_assessed_value data  where data.prop_id = 26603 and data.levy_cd = 654201

----HANDLE PRORATIONS?
--select * from #value_changes_to_roll_assessed_value data
--join wash_prop_owner_val wpov on
-- data.prop_id = wpov.prop_id and 
-- data.year = wpov.year and
-- data.sup_num = wpov.sup_num and
-- wpov.prorate_begin is not null
-- where data.prop_id = 26603 and data.levy_cd = 654201

if (@DEBUG_ENABLED = 1) begin
	select 'value_changes_to_roll_assessed_value'
	set @DEBUG_SQL = 'select * from #value_changes_to_roll_assessed_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end

insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate,destroyed_property,prorated_property)
select  priority, 6, '� Value Changes To Roll', year,
	tax_district_id, tax_district_desc, levy_cd, levy_description, sum(assessed_value), sum(senior_assessed_value), levy_rate, senior_levy_rate, case when sum(destroyed_property) > 0 then 1 else 0 end, case when sum(prorated_property) > 0 then 1 else 0 end
from #value_changes_to_roll_assessed_value
group by priority, [year], tax_district_id, tax_district_desc, levy_cd, levy_description, levy_rate, senior_levy_rate
--having  count(psa.prop_id) = 1



drop table #bill_entries -- RBK
drop table #levy_totals_ba
drop table #added_bills
drop table #levy_totals_add
drop table #ba_bill_id
drop table #ba_prev_taxable
drop table #base


-- Include a line for levies with no changed value
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	l.priority,
	6 as row_num,
	'� Value Changes To Roll' as line_item,
	l.[year],
	l.tax_district_id,
	l.tax_district_desc,
	l.levy_cd,
	l.levy_description,
	0,
	case when l.senior_levy_rate is null then null else 0 end,
	l.levy_rate,
	l.senior_levy_rate
from #levy as l
left join #results as r on
		r.[year] = l.[year]
	and r.tax_district_id = l.tax_district_id
	and r.levy_cd = l.levy_cd
	and r.line_item = '� Value Changes To Roll'
where r.line_item is null



select sup_check.prop_id, year,sup_check.levy_cd, ba.sup_num,case when ba.sup_num <= @sup_num then sum(ba.base_tax - ba.previous_base_tax) else 0 end as amount 
into #value_added_to_roll_taxroll_value
from bill_adjustment ba inner join
(
	select ba.bill_id,b.prop_id, min(ba.sup_num) sup_num, b.year,lb.levy_cd from bill b -- MUST BE MIN SO AS TO ONLY ADD LEVY HERE FOR INITITALLY CREATED PROPERTY
	inner join bill_adjustment ba on
		b.bill_id = ba.bill_id 
		and ba.sup_num <= @sup_num
	inner join levy_bill lb on
		b.bill_id = lb.bill_id and b.year=lb.year and ba.bill_calc_type_cd = 'SM'
	left join property_val pv on
		pv.prop_id = b.prop_id and pv.prop_val_yr = b.year and pv.sup_num <= @certification_sup_num -- THIS CONFIRMS THE PROPERTY DID NOT EXIST BEFORE CERTIFICATION
	group by ba.bill_id,b.prop_id, b.year,lb.levy_cd,  pv.prop_id,  bill_type
		having --b.prop_id in (20104,27906, 68481,68488,68516) /*10030, 10105, 10259, 20104, 27906,28643,32755,38260,38261,39137) and */ and lb.levy_cd = 654170 and 
		b.year = @year and pv.prop_id is null and bill_type = 'L'
		--and count(b.prop_id) = 1 -- NEEDED SO AS TO NOT INCLUDE PREVIOUSLY ADDED SUPS WHICH HAVE BEEN SUBSEQUNTLY MODFIED AGAIN, IS NOW A CHANGE
) sup_check
on ba.bill_id = sup_check.bill_id and ba.sup_num = sup_check.sup_num 
group by sup_check.levy_cd,ba.sup_num,sup_check.prop_id, year

if (@DEBUG_ENABLED = 1) begin
	select 'value_added_to_roll_taxroll_value'
	set @DEBUG_SQL = 'select * from #value_added_to_roll_taxroll_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end


--set taxroll for ADDED properties
update #results
set total_levy = convert(numeric(14, 2), amount) from 
#results inner join
(
	select levy_cd, sum(amount) as amount from 
	#value_added_to_roll_taxroll_value
	group by levy_cd
)
AMOUNT on AMOUNT.levy_cd = #results.levy_cd 
where row_num = 4


select sup_check.prop_id, year,sup_check.levy_cd, ba.sup_num,case when ba.sup_num <= @sup_num then sum(ba.base_tax - ba.previous_base_tax) else 0 end as amount 
into #value_removed_from_roll_taxroll_value
from bill_adjustment ba inner join
(
	select ba.bill_id,b.prop_id, max(ba.sup_num) sup_num, b.year,lb.levy_cd from bill b
	inner join bill_adjustment ba on
		b.bill_id = ba.bill_id 
		and ba.sup_num <= @sup_num
		and ba.bill_calc_type_cd = 'SM'
	inner join levy_bill lb on
		b.bill_id = lb.bill_id and b.year=lb.year
	inner join property_val pv on
		pv.prop_id = b.prop_id and pv.prop_val_yr = b.year and pv.sup_num  = ba.sup_num and pv.prop_inactive_dt is not null
	group by ba.bill_id,b.prop_id, b.year,lb.levy_cd,  bill_type 
		having --b.prop_id in (20104,27906, 68219) /*10030, 10105, 10259, 20104, 27906,28643,32755,38260,38261,39137) and */ and lb.levy_cd = 654170 and 
		b.year = @year and bill_type = 'L'
) sup_check
	on ba.bill_id = sup_check.bill_id and ba.sup_num = sup_check.sup_num 
group by sup_check.levy_cd,ba.sup_num, sup_check.prop_id, year

if (@DEBUG_ENABLED = 1) begin
	select 'value_removed_from_roll_taxroll_value'
	set @DEBUG_SQL = 'select * from #value_removed_from_roll_taxroll_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end


--set taxroll for REMOVED properties
update #results
set total_levy = convert(numeric(14, 2),amount) from 
#results inner join
(
	select levy_cd, sum(amount) as amount from 
	#value_removed_from_roll_taxroll_value
	group by levy_cd
)
AMOUNT on AMOUNT.levy_cd = #results.levy_cd 
where row_num = 5


--insert TOTAL ADJUSTMENTS line
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate)
select
	rA.priority,
	7 as row_num,
	'Total Adjustments' as line_item,
	rA.[year] as [year],
	rA.tax_district_id,
	rA.tax_district_name,
	rA.levy_cd,
	rA.levy_description,
	rA.assessed_value + rR.assessed_value + rC.assessed_value,
	rA.senior_assessed_value + rR.senior_assessed_value + rC.senior_assessed_value,
	rA.levy_rate,
	rA.senior_levy_rate
from #results rA
join #results rR on
		rR.[year] = rA.[year]
	and rR.tax_district_id = rA.tax_district_id
	and rR.levy_cd = rA.levy_cd
	and rR.line_item = '� Value Removed From Roll'
join #results rC on
		rC.[year] = rA.[year]
	and rC.tax_district_id = rA.tax_district_id
	and rC.levy_cd = rA.levy_cd
	and rC.line_item = '� Value Changes To Roll'
where rA.line_item = '� Value Added To Roll'



select sup_check.prop_id, year,sup_check.levy_cd, sup_check.max_sup,sup_check.min_sup,case when ba.sup_num <= @sup_num  then sum(ba.base_tax - ba2.previous_base_tax) else 0 end as amount 
	into #value_changes_to_roll_taxroll_value
from bill_adjustment ba inner join (
	select ba.bill_id,b.prop_id, max(ba.sup_num) max_sup, min(ba.sup_num) min_sup, b.year,lb.levy_cd 
	from bill b
	inner join bill_adjustment ba on
		b.bill_id = ba.bill_id 
		and ba.sup_num <= @sup_num
		and ba.bill_calc_type_cd = 'SM'
		and not (ba.taxable_val = 0 and base_tax > 0) -- RBK needed when adjusmtment shows value but there is no taxlable (like on a prorated exemption)
	inner join levy_bill lb on
		b.bill_id = lb.bill_id and b.year=lb.year
	left join property_val pv on -- RBK TRY THIS TO ALLOW MULTIPLE SUPS AS LONG AS THEY WERE *NOT* CREATED NEW
		pv.prop_id = b.prop_id and
		pv.prop_val_yr = b.year and
		pv.sup_num = 0
	group by  ba.bill_id,b.prop_id, b.year,lb.levy_cd,  bill_type,pv.prop_id--, ADDEDPROP.prop_id 
		having --b.prop_id in (18621)  and 	lb.levy_cd = 654201 and 
		b.year = @year and bill_type = 'L' and
		(count(b.prop_id) = 1 or pv.prop_id is not null)-- NEEDED SO AS TO NOT INCLUDE PREVIOUSLY ADDED SUPS WHICH HAVE BEEN SUBSEQUNTLY MODFIED AGAIN
) sup_check
on ba.bill_id = sup_check.bill_id and ba.sup_num = sup_check.max_sup 
inner join  bill_adjustment ba2 on ba2.bill_id = sup_check.bill_id and ba2.sup_num = sup_check.min_sup and ba.bill_id = ba2.bill_id and ba2.bill_calc_type_cd = 'SM' and ba.bill_calc_type_cd = ba2.bill_calc_type_cd
group by sup_check.levy_cd,ba.sup_num,sup_check.prop_id,year, sup_check.max_sup,sup_check.min_sup


if (@DEBUG_ENABLED = 1) begin
	select 'value_changes_to_roll_taxroll_value'
	set @DEBUG_SQL = 'select * from #value_changes_to_roll_taxroll_value' + @DEBUG_WHERE
	exec(@DEBUG_SQL)
end


--set taxroll for ADJUSTED properties (THE TAXROL COLUMN)
update #results
set total_levy = convert(numeric(14, 2),amount) from 
#results inner join
(
	select levy_cd, sum(amount) as amount from
	#value_changes_to_roll_taxroll_value sup_check
	group by levy_cd
)
AMOUNT on AMOUNT.levy_cd = #results.levy_cd 
where row_num = 7


--------------------------------------------------------------------------------
-- Calculate the total levy value in the results
--------------------------------------------------------------------------------

update #results 
set total_levy = convert(numeric(14, 2),
	case when (senior_assessed_value is not null) and (senior_levy_rate is not null)
		then (senior_assessed_value * senior_levy_rate + (assessed_value - senior_assessed_value) * levy_rate) / 1000
	else
		(assessed_value * levy_rate) / 1000
	end
	)
where total_levy is null
and line_item <> '� Value Changes To Roll'


--calculate taxroll for CHANGED properties (TOTALS - ADDS - REMOVES)
update rC 
set total_levy = convert(numeric(14, 2),isnull(rT.total_levy,0)) - convert(numeric(14, 2),isnull(rR.total_levy,0)) - convert(numeric(14, 2),isnull(rA.total_levy,0))
from #results rC
inner join #results rT on
		rT.[year] = rC.[year]
	and rT.tax_district_id = rC.tax_district_id
	and rT.levy_cd = rC.levy_cd
	and rT.line_item = 'Total Adjustments'
join #results rR on
		rR.[year] = rC.[year]
	and rR.tax_district_id = rC.tax_district_id
	and rR.levy_cd = rC.levy_cd
	and rR.line_item = '� Value Removed From Roll'
join #results rA on
		rA.[year] = rC.[year]
	and rA.tax_district_id = rC.tax_district_id
	and rA.levy_cd = rC.levy_cd
	and rA.line_item = '� Value Added To Roll'
where rC.line_item = '� Value Changes To Roll'


--------------------------------------------------------------------------------
-- Calculate the difference between Certified and Taxroll Value
--------------------------------------------------------------------------------
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate, total_levy)
select
	rC.priority,
	3 as row_num,
	'Difference' as line_item,
	rC.[year] as [year],
	rC.tax_district_id,
	rC.tax_district_name,
	rC.levy_cd,
	rC.levy_description,
	rT.assessed_value - rC.assessed_value,
	rT.senior_assessed_value - rC.senior_assessed_value,
	rC.levy_rate,
	rC.senior_levy_rate,
	rT.total_levy - rC.total_levy
from #results rC
join #results rT on
	rC.[year] = rT.[year]
	and rC.tax_district_id = rT.tax_district_id
	and rC.levy_cd = rT.levy_cd
	and rC.line_item = 'Certification'
	and rT.line_item = 'Taxroll'


--------------------------------------------------------------------------------
-- Calculate the Variance
--------------------------------------------------------------------------------
insert into #results
(priority, row_num, line_item, [year], tax_district_id, tax_district_name, levy_cd, levy_description,
 assessed_value, senior_assessed_value, levy_rate, senior_levy_rate, total_levy)
select
	rD.priority,
	9 as row_num,
	'Variance' as line_item,
	rD.[year] as [year],
	rD.tax_district_id,
	rD.tax_district_name,
	rD.levy_cd,
	rD.levy_description,
	rD.assessed_value + rT.assessed_value - rA.assessed_value,
	rD.senior_assessed_value + rT.senior_assessed_value - rA.senior_assessed_value,
	rD.levy_rate,
	rD.senior_levy_rate,
	rD.total_levy + rT.total_levy - rA.total_levy
from #results rD
join #results rA on
		rA.[year] = rD.[year]
	and rA.tax_district_id = rD.tax_district_id
	and rA.levy_cd = rD.levy_cd
	and rA.line_item = 'Total Adjustments'
	and rD.line_item = 'Difference'
join #results rT on
		rT.[year] = rD.[year]
	and rT.tax_district_id = rD.tax_district_id
	and rT.levy_cd = rD.levy_cd
	and rT.line_item = 'TAV-Private Harvest Timber Tax'
	and rD.line_item = 'Difference'


delete from ##CertToTaxrollReport where dataset_id = @dataset_id
delete from ##CertToTaxrollReport_GrandTotal where dataset_id = @dataset_id

if exists(
	select * 
	from tempdb.INFORMATION_SCHEMA.COLUMNS
	where TABLE_NAME = '##CertToTaxrollReport'
	and COLUMN_NAME = 'senior_levy_rate'
)
begin
	-- Build 9.0.50.1048 and later report table, with senior fields
	insert into ##CertToTaxrollReport
		(dataset_id, priority, row_num, line_item, [year], tax_district_id, tax_district_name,
		levy_cd, levy_description, senior_assessed_value, senior_levy_rate, assessed_value, levy_rate, total_levy,destroyed_property,prorated_property)
	select
		@dataset_id, priority, row_num, line_item, [year], tax_district_id, tax_district_name,
		levy_cd, levy_description, senior_assessed_value, senior_levy_rate, assessed_value, levy_rate, total_levy,destroyed_property,prorated_property
	from #results
end
else begin
	-- old version
	insert into ##CertToTaxrollReport
		(dataset_id, priority, row_num, line_item, [year], tax_district_id, tax_district_name,
		levy_cd, levy_description, assessed_value, levy_rate, total_levy,destroyed_property,prorated_property)
	select
		@dataset_id, priority, row_num, line_item, [year], tax_district_id, tax_district_name,
		levy_cd, levy_description, assessed_value, levy_rate, total_levy,destroyed_property,prorated_property
	from #results
end


--If any row for that levy_cd is prorated, all rows should be
update REPORT
set REPORT.prorated_property = 1 
from ##CertToTaxrollReport REPORT
inner join (
	select dataset_id, year, levy_cd from ##CertToTaxrollReport where dataset_id = @dataset_id and prorated_property = 1 
) PRORATES
on REPORT.dataset_id = PRORATES.dataset_id and
REPORT.year = PRORATES.year and
REPORT.levy_cd = PRORATES.levy_cd

--If any row for that levy_cd is destroyed, all rows should be
update REPORT
set REPORT.destroyed_property = 1 
from ##CertToTaxrollReport REPORT
inner join (
	select dataset_id, year, levy_cd from ##CertToTaxrollReport where dataset_id = @dataset_id and destroyed_property = 1 
) DESTROYED
on REPORT.dataset_id = DESTROYED.dataset_id and
REPORT.year = DESTROYED.year and
REPORT.levy_cd = DESTROYED.levy_cd


insert into ##CertToTaxrollReport_GrandTotal
( dataset_id, row_num, line_item,
		total_assessed_value, total_levy )
select dataset_id, row_num, line_item, sum(Assessed_value), sum(total_levy)
from ##CertToTaxrollReport
where dataset_id = @dataset_id
group by dataset_id, row_num, line_item
order by row_num

drop table #levy
drop table #results
drop table #prop_sup_nums
drop table #as_of_supnum


if (@DEBUG_ENABLED = 1) begin
	select 'FINAL REPORT RESULTS'

	--NO PROPERTIES HERE SO RESET THE WHERE CLAUSE
	if (@DEBUG_LEVYCD is not null) set @DEBUG_WHERE = ' WHERE levy_cd = ''' + @DEBUG_LEVYCD  + ''' '

	set @DEBUG_SQL = 'select * from ##CertToTaxrollReport ' + @DEBUG_WHERE + ' order by priority, tax_district_name, levy_description, row_num'
	exec(@DEBUG_SQL)
end

GO

