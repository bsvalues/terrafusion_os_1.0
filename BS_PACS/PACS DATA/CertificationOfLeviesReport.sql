
create procedure dbo.CertificationOfLeviesReport
	@dataset_id int,
	@levy_cert_run_id int,
	@year int,
	@filter_tax_districts varchar(max) = null

as

set nocount on

declare @captured_value_run_id int
declare @as_of_sup_num int

select @captured_value_run_id = lcr.captured_value_run_id
from levy_cert_run lcr
where lcr.levy_cert_run_id = @levy_cert_run_id

select @as_of_sup_num = cvr.as_of_sup_num
from captured_value_run cvr
where cvr.captured_value_run_id = @captured_value_run_id


-- temporary tables
if object_id('tempdb..#levy') is not null
	drop table #levy
if object_id('tempdb..#CertOfLeviesReport') is not null
	drop table #CertOfLeviesReport

create table #CertOfLeviesReport
(
	[dataset_id] [int],
	[year] [numeric](4, 0),
	[as_of_sup_num] [int],
	[tax_district_type_priority] [int],
	[tax_district_type_cd] [varchar](10),
	[tax_district_type_desc] [varchar](50),
	[tax_district_id] [int],
	[tax_district_cd] [varchar](20),
	[tax_district_name] [varchar](50),
	[parent_levy_description] [varchar](120),
	[is_linked] [bit],
	[levy_cd] [varchar](10),
	[levy_description] [varchar](120),
	[has_separate_senior] bit,
	[levy_rate] [numeric](13, 10),
	[senior_levy_rate] [numeric](13, 10),
	[fund_number] [varchar](255),
	[taxable_value] [numeric](16, 2),
	[nonsenior_taxable_value] [numeric](16, 2),
	[senior_taxable_value] [numeric](16, 2),
	[tav_value] [numeric](16, 2),
	[total_taxes] [decimal](16, 2),
	[nonsenior_total_taxes] [decimal](16, 2),
	[senior_total_taxes] [decimal](16, 2),
	[tav_total_taxes] [numeric](16, 2),
	[run_id] [int],	
	[status] [varchar](20),
	[is_parent] [bit],
	[group_number] [int],
	[voted] bit,
	[timber_assessed_cd] varchar(10),
	[summarize_av] bit,
	[summarize_tav] bit,
	[is_tif_orig] bit,
	[is_tif_spon] bit,
	[orig_tif_area_id] int,
	[orig_tax_district_id] int,
	[orig_levy_cd] varchar(10)
) 


-- Make a list of levies in the certification, and identify the LTIF originators and sponsors,
-- with separate records when a sponsor receives value from multiple originators.
select lcrd.tax_district_id, lcrd.levy_cd, is_tif_orig, is_tif_spon, 
	spon.tif_area_id as orig_tif_area_id, spon.tax_district_id orig_tax_district_id, spon.levy_cd orig_levy_cd
into #levy
from levy_cert_run_detail lcrd

outer apply (
	select case when exists(
		select 1 from levy_cert_tif lct
		where lct.tax_district_id = lcrd.tax_district_id
			and lct.levy_cd = lcrd.levy_cd
			and lct.year = lcrd.year
		)
		then 1 else 0 end as is_tif_orig
) orig

outer apply (
	select lct.*
	from levy_cert_tif lct
	join tif_area_levy tal
		on lct.tax_district_id = tal.tax_district_id
		and lct.levy_cd = tal.levy_cd
		and lct.year = tal.year
		and lct.tif_area_id = tal.tif_area_id
	where tal.linked_tax_district_id = lcrd.tax_district_id
		and tal.linked_levy_cd = lcrd.levy_cd
		and tal.year = lcrd.year
)spon

outer apply (
	select case when spon.tif_area_id is not null then 1 else 0 end as is_tif_spon
) x

where lcrd.levy_cert_run_id = @levy_cert_run_id
and lcrd.year = @year
and (@filter_tax_districts is null or lcrd.tax_district_id in (select ID from dbo.fn_ReturnTableFromCommaSepValues(@filter_tax_districts)))


-- preliminary report output
insert into #CertOfLeviesReport
(
	dataset_id, year, as_of_sup_num,
	tax_district_type_priority, tax_district_type_cd, tax_district_type_desc, 
	tax_district_id, tax_district_cd, tax_district_name,
	levy_cd,  
	run_id, status, is_parent, group_number, voted, timber_assessed_cd, summarize_av, summarize_tav,
	is_tif_orig, is_tif_spon, orig_tif_area_id, orig_tax_district_id, orig_levy_cd
)


select
	@dataset_id as dataset_id,
	l.[year], 
	@as_of_sup_num,
	tdt.priority as tax_district_type_priority,
	tdt.tax_district_type_cd,
	tdt.tax_district_desc as tax_district_type_desc,
	td.tax_district_id, td.tax_district_cd,
	td.tax_district_desc as tax_district_name,
	l.levy_cd,
	lcr.levy_cert_run_id as run_id,
	lcr.status as status,
	case when exists (select * from levy_link where year = 2020 and levy_cd = l.levy_cd)
		then 1 else 0 end as is_parent,
	0 as group_number,
	convert(bit, isnull(l.voted, 0)) as voted,
	isNull(l.timber_assessed_cd, 'NOT_USED') timber_assessed_cd,
	convert(bit, 0) as summarize_av,
	convert(bit, 0) as summarize_tav,
	tl.is_tif_orig, tl.is_tif_spon, tl.orig_tif_area_id, tl.orig_tax_district_id, tl.orig_levy_cd

from #levy tl
join tax_district td with(nolock)
	on tl.tax_district_id = td.tax_district_id
join levy as l with (nolock)
	on l.tax_district_id = tl.tax_district_id
	and l.levy_cd = tl.levy_cd
	and l.year = @year
join tax_district_type tdt with(nolock)
	on td.tax_district_type_cd = tdt.tax_district_type_cd
join levy_cert_run lcr with(nolock) 
	on lcr.[year] = l.[year]
	and lcr.levy_cert_run_id = @levy_cert_run_id


-- levies rates and descriptions
update col
set levy_description = case when col.is_tif_spon = 1 then l.levy_description + ' (from ' + ol.levy_description + ')'
		else l.levy_description end,
	levy_rate = case when col.is_tif_spon = 1 then isnull(olcrd.final_levy_rate, 0) else isnull(lcrd.final_levy_rate, 0) end,
	senior_levy_rate = case when col.is_tif_spon = 1 then isnull(olcrd.final_senior_levy_rate, 0) else isnull(lcrd.final_senior_levy_rate, 0) end
from #CertOfLeviesReport col
join levy l
	on col.tax_district_id = l.tax_district_id
	and col.levy_cd = l.levy_cd
	and col.year = l.year
join levy_cert_run_detail lcrd with(nolock)
	on lcrd.[year] = l.[year]
	and lcrd.tax_district_id = l.tax_district_id
	and lcrd.levy_cd = l.levy_cd
	and lcrd.levy_cert_run_id = col.run_id
left join levy ol
	on col.orig_tax_district_id = ol.tax_district_id
	and col.orig_levy_cd = ol.levy_cd
	and col.year = ol.year
left join levy_cert_run_detail olcrd with(nolock)
	on olcrd.[year] = ol.[year]
	and olcrd.tax_district_id = ol.tax_district_id
	and olcrd.levy_cd = ol.levy_cd
	and olcrd.levy_cert_run_id = col.run_id


-- timber value
update col
set tav_value =	case
	when (l.timber_assessed_enable = 0 or isNull(l.timber_assessed_cd, 'NOT_USED') = 'NOT_USED') then 0
	when (l.timber_assessed_enable = 1 and l.timber_assessed_cd = 'FULL') then
		isNull(l.timber_assessed_full, 0)
	when (l.timber_assessed_enable = 1
		and l.timber_assessed_cd = 'HALF/ROLL'
		and isNull(l.timber_assessed_half, 0) > isNull(l.timber_assessed_roll, 0)) then
			isNull(l.timber_assessed_half, 0)
	when (l.timber_assessed_enable = 1
		and l.timber_assessed_cd = 'HALF/ROLL'
		and isNull(l.timber_assessed_half, 0) <= isNull(l.timber_assessed_roll, 0)) then
			isNull(l.timber_assessed_roll, 0)
	else 0
end
from #CertOfLeviesReport col
join levy l
	on l.tax_district_id = col.tax_district_id
	and l.levy_cd = col.levy_cd
	and l.year = col.year
where col.is_tif_spon = 0


update col
set tav_value =	case
	when (l.timber_assessed_enable = 0 or isNull(l.timber_assessed_cd, 'NOT_USED') = 'NOT_USED') then 0
	when (l.timber_assessed_enable = 1 and l.timber_assessed_cd = 'FULL') then
		isNull(l.timber_assessed_full, 0)
	when (l.timber_assessed_enable = 1
		and l.timber_assessed_cd = 'HALF/ROLL'
		and isNull(l.timber_assessed_half, 0) > isNull(l.timber_assessed_roll, 0)) then
			isNull(l.timber_assessed_half, 0)
	when (l.timber_assessed_enable = 1
		and l.timber_assessed_cd = 'HALF/ROLL'
		and isNull(l.timber_assessed_half, 0) <= isNull(l.timber_assessed_roll, 0)) then
			isNull(l.timber_assessed_roll, 0)
	else 0
end
from #CertOfLeviesReport col
join levy l
	on l.tax_district_id = col.orig_tax_district_id
	and l.levy_cd = col.orig_levy_cd
	and l.year = col.year
where col.is_tif_spon = 1


-- levy links
update col
set parent_levy_description = isnull(lll.levy_description, col.levy_description),
	is_linked = case when isnull(ll.levy_cd, col.levy_cd) = col.levy_cd then 0 else 1 end
from #CertOfLeviesReport col
left join levy_link ll with(nolock)
	on ll.[year] = col.[year]
	and ll.tax_district_id = col.tax_district_id
	and ll.levy_cd_linked = col.levy_cd
left join levy lll with(nolock)
	on lll.[year] = ll.[year]
	and lll.tax_district_id = ll.tax_district_id
	and lll.levy_cd = ll.levy_cd


-- values and funds
update col
set fund_number = x.fund_number,
	taxable_value = x.taxable_value,
	nonsenior_taxable_value = x.nonsenior_taxable_value,
	senior_taxable_value = x.senior_taxable_value
from #CertOfLeviesReport col
join (
	select l.tax_district_id, l.levy_cd,
		dbo.CommaListConcatenate(f.display_fund_number) fund_number,
		sum(isnull(cv.taxable_value,0)) as taxable_value,
		sum(isnull(cv.taxable_value,0) - isnull(cv.senior_value,0)) as nonsenior_taxable_value,
		sum(isnull(cv.senior_value,0)) as senior_taxable_value
	from #levy l
	join captured_value_by_fund cv with(nolock)
		on cv.captured_value_run_id = @captured_value_run_id
		and cv.[year] = @year
		and cv.tax_district_id = l.tax_district_id
		and cv.levy_cd = l.levy_cd
	join fund f with(nolock) 
		on f.[year] = cv.[year]
		and f.tax_district_id = cv.tax_district_id
		and f.levy_cd = cv.levy_cd
		and f.fund_id = cv.fund_id
	where cv.is_joint_district_value = 0
	group by l.tax_district_id, l.levy_cd
)x
on x.tax_district_id = col.tax_district_id
and x.levy_cd = col.levy_cd


-- remove diverted values from LTIF originators
update col
set 
	nonsenior_taxable_value = nonsenior_taxable_value - isnull(sum_tif_non_senior_increment,0),
	senior_taxable_value = senior_taxable_value - isnull(sum_tif_senior_increment,0),
	taxable_value = (nonsenior_taxable_value - isnull(sum_tif_non_senior_increment,0)) + (senior_taxable_value - isnull(sum_tif_senior_increment,0))
from #CertOfLeviesReport col
join (
	select lct.year, lct.tax_district_id, lct.levy_cd, 
		sum(isnull(tif_non_senior_increment,0)) sum_tif_non_senior_increment, sum(isnull(lct.tif_senior_increment,0)) sum_tif_senior_increment
	from levy_cert_tif lct with(nolock)
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	group by lct.year, lct.tax_district_id, lct.levy_cd
) sums
	on sums.year = col.year
	and sums.tax_district_id = col.tax_district_id
	and sums.levy_cd = col.levy_cd
where col.is_tif_orig = 1
 

-- set diverted values on LTIF sponsors
update col
set 
	nonsenior_taxable_value = isnull(sum_tif_non_senior_increment, 0),
	senior_taxable_value = isnull(sum_tif_senior_increment, 0),
	taxable_value = isnull(sum_tif_non_senior_increment,0) + isnull(sum_tif_senior_increment, 0)
from #CertOfLeviesReport col
join (
	select lct.year, lct.tax_district_id, lct.levy_cd, lct.tif_area_id,
		sum(isnull(tif_non_senior_increment,0)) sum_tif_non_senior_increment, sum(isnull(lct.tif_senior_increment,0)) sum_tif_senior_increment
	from levy_cert_tif lct with(nolock)
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	group by lct.year, lct.tax_district_id, lct.levy_cd, lct.tif_area_id
) sums
	on sums.year = col.year
	and sums.tax_district_id = col.orig_tax_district_id
	and sums.levy_cd = col.orig_levy_cd
	and sums.tif_area_id = col.orig_tif_area_id
where col.is_tif_spon = 1


-- dependent values
update col set 
	has_separate_senior = case when (senior_levy_rate > 0) and (senior_levy_rate <> levy_rate) then 1 else 0 end,
	tav_total_taxes = round(tav_value * levy_rate * 0.001, 2),
	nonsenior_total_taxes = round(nonsenior_taxable_value * levy_rate * 0.001, 2),
	senior_total_taxes = round(senior_taxable_value * senior_levy_rate * 0.001, 2),
	total_taxes = round(taxable_value * levy_rate * 0.001, 2)
from #CertOfLeviesReport col



/*

left join captured_value_joint_summary_vw as cv_jd with (nolock) on
	cv_jd.captured_value_run_id = lcr.captured_value_run_id
	and cv_jd.[year] = l.[year]
	and cv_jd.tax_district_id = l.tax_district_id
	and cv_jd.levy_cd = l.levy_cd
*/


-- clean report output tables
delete ##CertOfLeviesReport
where dataset_id = @dataset_id

delete ##CertOfLeviesReportGroup
where dataset_id = @dataset_id

delete ##CertOfLeviesReportGroupCode
where dataset_id = @dataset_id


-- report output

insert ##CertOfLeviesReport
(
	dataset_id, year, as_of_sup_num, 
	tax_district_type_priority, tax_district_type_cd, tax_district_type_desc, 
	tax_district_id, tax_district_cd, tax_district_name,
	parent_levy_description, is_linked, levy_cd, levy_description,
	levy_rate, fund_number, taxable_value, tav_value,
	total_taxes, tav_total_taxes,
	run_id, status, is_parent, group_number, voted, timber_assessed_cd, summarize_av, summarize_tav
)

-- normal levies
select
	dataset_id, year, as_of_sup_num, 
	tax_district_type_priority, tax_district_type_cd, tax_district_type_desc, 
	tax_district_id, tax_district_cd, tax_district_name,
	parent_levy_description, is_linked, levy_cd, levy_description, 
	levy_rate, fund_number, taxable_value, tav_value,
	total_taxes, tav_total_taxes,
	run_id, status, is_parent, group_number, voted, timber_assessed_cd, summarize_av, summarize_tav
from #CertOfLeviesReport
where has_separate_senior = 0

UNION

-- levies with a separate senior rate, non-senior portion
select
	dataset_id, year, as_of_sup_num, 
	tax_district_type_priority, tax_district_type_cd, tax_district_type_desc, 
	tax_district_id, tax_district_cd, tax_district_name,
	parent_levy_description, is_linked, levy_cd, levy_description, 
	levy_rate, fund_number, nonsenior_taxable_value as taxable_value, tav_value,
	nonsenior_total_taxes as total_taxes, tav_total_taxes,
	run_id, status, is_parent, group_number, voted, timber_assessed_cd, summarize_av, summarize_tav
from #CertOfLeviesReport
where has_separate_senior = 1

UNION

-- levies with a separate senior rate, senior portion
select
	dataset_id, year, as_of_sup_num, 
	tax_district_type_priority, tax_district_type_cd, tax_district_type_desc, 
	tax_district_id, tax_district_cd, tax_district_name,
	parent_levy_description, is_linked, levy_cd, levy_description + ' (Senior)' as levy_description, 
	senior_levy_rate as levy_rate, fund_number, senior_taxable_value as taxable_value, tav_value,
	senior_total_taxes as total_taxes, tav_total_taxes,
	run_id, status, is_parent, group_number, voted, timber_assessed_cd, summarize_av, summarize_tav
from #CertOfLeviesReport
where has_separate_senior = 1

order by
	year, tax_district_type_priority, as_of_sup_num, tax_district_type_cd, tax_district_name,
	parent_levy_description, is_linked, levy_description, fund_number


insert into ##CertOfLeviesReportGroup
select distinct [dataset_id], [tax_district_id], [tax_district_type_cd], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
from ##CertOfLeviesReport
where dataset_id = @dataset_id

exec CertificationOfLeviesData @dataset_id

GO

