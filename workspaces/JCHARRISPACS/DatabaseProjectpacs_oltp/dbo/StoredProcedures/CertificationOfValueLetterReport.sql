
create procedure CertificationOfValueLetterReport
	@dataset_id int,
	@year numeric(4,0),
	@supnum int,
	@taxDistrictList varchar(max),
	@levyList varchar(max)

as

set nocount on

delete ##certification_of_value_supp_assoc where dataset_id = @dataset_id
delete ##certification_of_value_grouping where dataset_id = @dataset_id
delete ##certification_of_value_levy_description where dataset_id = @dataset_id
delete ##certification_of_value_letter where dataset_id = @dataset_id
delete ##certification_of_value_letter_info where dataset_id = @dataset_id
delete ##certification_of_value_letter_newly_annexed where dataset_id = @dataset_id
delete ##certification_of_value_letter_tax_area_info where dataset_id = @dataset_id
delete ##certification_of_value_letter_levy_info where dataset_id = @dataset_id

declare @taxyear numeric(4,0)
set @taxyear = @year + 1


insert ##certification_of_value_supp_assoc 
(dataset_id, [year], sup_num, prop_id, tax_district_id) 

select distinct @dataset_id, wpov.[year], wpov.sup_num, wpov.prop_id, wpola.tax_district_id
from (
	select prop_val_yr [year], prop_id, max(sup_num) sup_num
	from property_val with(nolock)
	where prop_val_yr = @year 
		and sup_num <= @supnum
		and isnull(udi_parent,'') = ''
	group by prop_val_yr, prop_id
) wpov
join property_val pv with(nolock)
	on wpov.year = pv.prop_val_yr
	and wpov.sup_num = pv.sup_num 
	and wpov.prop_id = pv.prop_id 
	and pv.prop_inactive_dt is null 
join wash_prop_owner_levy_assoc wpola with(nolock)
	on wpov.year = wpola.year
	and wpov.sup_num = wpola.sup_num
	and wpov.prop_id = wpola.prop_id
where wpola.tax_district_id in (
	select td.tax_district_id from fn_ReturnTableFromCommaSepValues(@taxDistrictList) LIST
	join tax_district td with(nolock)
	on LIST.ID = td.tax_district_cd
)
and wpola.levy_cd in (select ID from fn_ReturnTableFromCommaSepValues(@levyList))


insert ##certification_of_value_grouping 
(dataset_id, tax_district_id, tax_areas) 

select @dataset_id dataset_id, td.tax_district_id, ta.tax_areas
from
(
	select distinct tax_district_id
	from ##certification_of_value_supp_assoc with(nolock) 
	where dataset_id = @dataset_id
) td

cross apply (
	select dbo.CommaListConcatenate(tafa.tax_area_id) tax_areas
	from tax_area_fund_assoc tafa with(nolock) 
	join fund f with(nolock) 
		on tafa.year = f.year 
		and tafa.tax_district_id = f.tax_district_id 
		and tafa.levy_cd = f.levy_cd 
		and tafa.fund_id = f.fund_id 
		and (f.end_date is null or CONVERT(DATETIME, CONVERT(CHAR(8), @year)) < f.end_date)
	where tafa.year = @year
		and tafa.tax_district_id = td.tax_district_id
)ta


insert ##certification_of_value_letter 
(dataset_id, tax_district_id, group_id, tax_district_name, tax_district_desc, tax_district_addr1, 
tax_district_addr2, tax_district_addr3, tax_district_csz, year, 
email_address, priority, sup_num) 

select distinct cvg.dataset_id, cvg.tax_district_id, cvg.group_id, a.file_as_name, 
	td.tax_district_desc, isnull(ad.addr_line1,''), isnull(ad.addr_line2,''), isnull(ad.addr_line3,''),
	isnull(ad.addr_city, '') + ', ' + isnull(ad.addr_state, '') + ' ' + isnull(ad.addr_zip, ''), 
	@year, 
	(
		select dbo.CommaListConcatenate(t.contact_text) 
		from (
			select top 2 wc.acct_id, wc.contact_text 
			from web_contact wc with(nolock)
			where wc.acct_id = aca.acct_contact_id 
				and wc.web_contact_type_cd = 'EM' 
		) t 
		group by t.acct_id 
	), 
	tdt.priority,
	@supnum 
from ##certification_of_value_grouping cvg with(nolock) 
join tax_district td with(nolock) 
	on cvg.tax_district_id = td.tax_district_id 
join tax_district_type tdt with(nolock) 
	on td.tax_district_type_cd = tdt.tax_district_type_cd 
left join account_contact_assoc aca with(nolock) 
	on cvg.tax_district_id = aca.acct_id 
	and aca.is_primary = 1 
left join account a with(nolock) 
	on aca.acct_contact_id = a.acct_id 
left join address ad with(nolock) 
	on a.acct_id = ad.acct_id 
	and ad.primary_addr = 'Y' 
where cvg.dataset_id = @dataset_id


insert ##certification_of_value_levy_description 
(dataset_id, group_id, tax_district_id, levy_descriptions) 
select @dataset_id, cvg.group_id, t.tax_district_id, 
	dbo.CommaListConcatenate(l.levy_description) 
from 
( 
	select tafa.year, tafa.tax_district_id, tafa.levy_cd 
	from tax_area_fund_assoc tafa with(nolock) 
	join fund f with(nolock) 
		on tafa.year = f.year 
		and tafa.tax_district_id = f.tax_district_id 
		and tafa.levy_cd = f.levy_cd 
		and tafa.fund_id = f.fund_id 
		and (f.end_date is null or CONVERT(DATETIME, CONVERT(CHAR(8), @year)) < f.end_date)
	where tafa.year = @year
	and tafa.tax_district_id in 
	( 
		select distinct tax_district_id 
		from ##certification_of_value_letter with(nolock) 
		where dataset_id = @dataset_id 
	) 
	group by tafa.year, tafa.levy_cd, tafa.tax_district_id 
) t 
join levy l with(nolock) 
	on t.year = l.year 
	and t.tax_district_id = l.tax_district_id 
	and t.levy_cd = l.levy_cd 
join ##certification_of_value_grouping cvg with(nolock)
	on t.tax_district_id = cvg.tax_district_id 
where cvg.dataset_id = @dataset_id 
group by t.tax_district_id, cvg.group_id 
order by t.tax_district_id


update covl
set levy_descriptions = covld.levy_descriptions 
from ##certification_of_value_letter covl 
join ##certification_of_value_levy_description covld with(nolock) 
	on covl.dataset_id = covld.dataset_id 
	and covl.group_id = covld.group_id 
	and covl.tax_district_id = covld.tax_district_id 
where covl.dataset_id = @dataset_id 


insert ##certification_of_value_letter_info 
(dataset_id, assessor_name, office_name, addr_line1, addr_line2, addr_line3, city, 
state, zip, phone, fax, url, levy_year, tax_year) 

select distinct @dataset_id, chief_appraiser, office_name, addr_line1, 
	addr_line2, addr_line3, city, state, zip, phone_num, fax_num, url, 
	@year, @taxyear 
from system_address sa with(nolock) 
where system_type = 'A'


if object_id (N'tempdb..#levy_parts') IS NOT NULL 
	drop table #levy_parts


--Get list of all the state levy2 properties with SNR/DSBL exemptions
select csa.prop_id, csa.year, csa.[sup_num], csa.tax_district_id
into #levy_parts 
from ##certification_of_value_supp_assoc csa
join dbo.property_exemption pe1 with(nolock)
	on pe1.[exmpt_tax_yr] = csa.year
	and pe1.[owner_tax_yr] = csa.year
	and pe1.[prop_id] = csa.[prop_id]
	and pe1.[sup_num] = csa.[sup_num]
	and	pe1.exmpt_type_cd = 'SNR/DSBL'
join ##certification_of_value_grouping cvg with(nolock) 
	on csa.dataset_id = cvg.dataset_id 
	and csa.tax_district_id = cvg.tax_district_id 
join levy l with(nolock)
	on cvg.tax_district_id = l.tax_district_id 
	and l.year = @year
join levy_type lt with(nolock)
	on l.levy_type_cd = lt.levy_type_cd
	and lt.levy_part = 2
where csa.dataset_id = @dataset_id


insert ##certification_of_value_letter_newly_annexed 
(dataset_id, tax_area_id) 
select distinct @dataset_id, tam.tax_area_destination_id 
from annexation an with(nolock) 
join tax_area_mapping tam with(nolock) 
	on an.annexation_id = tam.annexation_id 
where an.start_year = @year


insert ##certification_of_value_letter_tax_area_info 
(
	dataset_id, 
	tax_district_id, 
	group_id, 
	tax_area_id, 
	tax_area_number, 
	newly_annexed, 
	total_assessed_value, 
	taxable_regular_levy, 
	taxable_excess_levy, 
	senior_assessed_value, 
	new_construction_value
) 
select dataset_id, tax_district_id, group_id, tax_area_id, tax_area_number, newly_annexed,
	sum(total_assessed_value) total_assessed_value,
	sum(taxable_regular_levy) taxable_regular_levy,
	sum(taxable_excess_levy) taxable_excess_levy,
	sum(senior_assessed_value) senior_assessed_value,
	sum(isnull(new_construction_value,0)) new_construction_value
from (
	select distinct 
		@dataset_id dataset_id,
		csa.tax_district_id,
		cvg.group_id,
		wta.tax_area_id,
		ta.tax_area_number,
		-- newly_annexed
		case when isnull(annex.tax_area_id, 0) > 0 then 1
			else 0 end newly_annexed, 
		-- total_assessed_value
		sum(
			case when isnull(pst.state_assessed_utility, 0) = 0 then
				wpov.land_hstd_val + 
				wpov.land_non_hstd_val + wpov.imprv_hstd_val + 
				wpov.imprv_non_hstd_val + wpov.ag_hs_market + 
				wpov.ag_market
			else 0 end +
			case when p.prop_type_cd = 'P' and isnull(pst.state_assessed_utility, 0) = 0 then wpov.appraised_non_classified + wpov.appraised_classified
			else 0 end +
			case when p.prop_type_cd in ('MN','A') and isnull(pst.state_assessed_utility, 0) = 0 then wpov.market else 0 end +
			case when isnull(pst.state_assessed_utility,0) = 1 then wpov.market else 0 end
		) total_assessed_value,

		-- taxable_regular_levy
		SUM(isnull(wpov.taxable_classified,0) + isnull(wpov.taxable_non_classified,0)) taxable_regular_levy,
		--taxable_excess_levy
		0 taxable_excess_levy,
		-- senior_assessed_value
		0 senior_assessed_value,
		-- new_construction_value
		case when isnull(lp.year,-1) <> -1 or has_u500_ex = 1 then 0
			else sum(isnull(wpov.new_val_hs,0) + isnull(wpov.new_val_nhs,0) + isnull(wpov.new_val_p,0)) 
			end new_construction_value

	from ##certification_of_value_supp_assoc csa with(nolock) 
	join ##certification_of_value_grouping cvg with(nolock) 
		on csa.dataset_id = cvg.dataset_id 
		and csa.tax_district_id = cvg.tax_district_id 
	join property_tax_area wta with(nolock) 
		on csa.year = wta.year 
		and csa.sup_num = wta.sup_num 
		and csa.prop_id = wta.prop_id 
		and ( 
			charindex(',' + convert(varchar, wta.tax_area_id) + ',', cvg.tax_areas) > 0 
			or cvg.tax_areas = convert(varchar, wta.tax_area_id)
			or left(cvg.tax_areas, len(convert(varchar, wta.tax_area_id)) + 1) = convert(varchar, wta.tax_area_id) + ',' 
			or right(cvg.tax_areas, len(convert(varchar, wta.tax_area_id)) + 1) = ',' + convert(varchar, wta.tax_area_id) 
		) 
	join wash_prop_owner_val wpov with(nolock) 
		on csa.year = wpov.year 
		and csa.sup_num = wpov.sup_num 
		and csa.prop_id = wpov.prop_id 
		and wpov.owner_id = (
			select top 1 o.owner_id
			from owner o with(nolock)
			where o.prop_id = csa.prop_id
			and o.owner_tax_yr = csa.year
			and o.sup_num = csa.sup_num
		)
	join property_val pv with(nolock) 
		on wpov.year = pv.prop_val_yr 
		and wpov.sup_num = pv.sup_num 
		and wpov.prop_id = pv.prop_id 
	join tax_area ta with(nolock) 
		on wta.tax_area_id = ta.tax_area_id 
	join property p with(nolock) 
		on csa.prop_id = p.prop_id 
	left join property_sub_type pst with(nolock) 
		on pv.sub_type = pst.property_sub_cd 
	left join ##certification_of_value_letter_newly_annexed annex with(nolock) 
		on csa.dataset_id = annex.dataset_id 
		and wta.tax_area_id = annex.tax_area_id 
	left join #levy_parts lp
		on lp.year = csa.year
		and lp.[prop_id] = csa.[prop_id]
		and lp.[sup_num] = csa.[sup_num]
		and lp.tax_district_id = csa.tax_district_id

	cross apply (
		select case when exists(
			select 1 from wash_prop_owner_exemption e with(nolock)
			where wpov.prop_id = e.prop_id
			and wpov.year = e.year
			and wpov.sup_num = e.sup_num
			and wpov.owner_id = e.owner_id
			and e.exmpt_type_cd = 'U500'
		) then 1 else 0 end has_u500_ex
	) ex	

	where csa.dataset_id = @dataset_id 
	group by csa.tax_district_id, cvg.group_id, wta.tax_area_id, ta.tax_area_number, annex.tax_area_id, lp.year, ex.has_u500_ex

) SUBQUERY
group by dataset_id, tax_district_id, group_id, tax_area_id, tax_area_number, newly_annexed


if object_id (N'tempdb..#levy_parts') IS NOT NULL 
	drop table #levy_parts


--SET THE BASE EXCESS VALUE WHICH WE WILL THEN REDUCE FROM AS NEEDED
update ##certification_of_value_letter_tax_area_info 
set taxable_excess_levy = taxable_regular_levy 
where dataset_id = @dataset_id


--THIS DEDUCTS THE *FARM* VALUES FOR LEVY PART 1 (STATE) AND 2 (STATE2)
update covltai 
set covltai.taxable_excess_levy = covltai.taxable_excess_levy - isnull(RESULTS.taxable_classified,0)
from ##certification_of_value_letter_tax_area_info covltai
join (
	select dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year, 
		sum(taxable_classified) taxable_classified 
	from (
		-- SELECT DISTINCT BECAUSE PERS_PROP_SEG CAN HAVE MULTIPLE ROWS PER PROPERTY/SUP_NUM AND WE ONLY WANT TO COUNT IT ONCE
		select distinct csa.dataset_id, ta.tax_area_id, l.levy_cd, cvg.tax_district_id, cvg.group_id, ta.tax_area_number, v.year, 
			v.sup_num, v.taxable_classified

		from ##certification_of_value_supp_assoc csa with(nolock) 
		join ##certification_of_value_grouping cvg with(nolock) 
			on csa.dataset_id = cvg.dataset_id 
			and csa.tax_district_id = cvg.tax_district_id
		join wash_prop_owner_val v with(nolock)
			on v.prop_id = csa.prop_id
			and v.year = csa.year
			and v.sup_num = csa.sup_num
			and v.owner_id = (
				select top 1 o.owner_id
				from owner o with(nolock)
				where o.prop_id = csa.prop_id
				and o.owner_tax_yr = csa.year
				and o.sup_num = csa.sup_num
			)
		join wash_prop_owner_levy_assoc la with(nolock)
			on la.prop_id = v.prop_id
			and la.year = v.year
			and la.sup_num = v.sup_num
			and la.owner_id = v.owner_id
			and la.tax_district_id = csa.tax_district_id
		join levy l with(nolock)
			on l.levy_cd = la.levy_cd
			and l.levy_cd in (select ID from fn_ReturnTableFromCommaSepValues(@levyList))
			and l.year = la.year
		join property_tax_area pta with(nolock)
			on pta.prop_id = csa.prop_id
			and pta.year = csa.year
			and pta.sup_num = csa.sup_num
		join tax_area ta with(nolock)
			on ta.tax_area_id = pta.tax_area_id	
		join levy_type lt with(nolock)
			on l.levy_type_cd = lt.levy_type_cd
			and lt.levy_part in (1, 2)
				
		where csa.year = @year
		and csa.dataset_id = @dataset_id
		and exists(
			select 1 from pers_prop_seg pps with(nolock)
			where pps.prop_id = csa.prop_id
			and pps.prop_val_yr = csa.year
			and pps.sup_num = csa.sup_num					
			and pps.farm_asset = 1
		)

	) SUBQUERY
	group by dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year

) RESULTS
ON
covltai.dataset_id = RESULTS.dataset_id
and covltai.tax_district_id = RESULTS.tax_district_id
and covltai.group_id = RESULTS.group_id
and covltai.tax_area_id = RESULTS.tax_area_id
and covltai.tax_area_number = RESULTS.tax_area_number


--THIS DEDUCTS THE *SNR/DSBL* VALUES FOR LEVY PART 0 (OTHER) AND 2 (STATE2)
update covltai 
set covltai.taxable_excess_levy = covltai.taxable_excess_levy - isnull(RESULTS.taxable_classified,0)
from ##certification_of_value_letter_tax_area_info covltai
join (
	select dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year,
		sum(taxable_classified) taxable_classified
	from (
		select csa.dataset_id, ta.tax_area_id, l.levy_cd, cvg.tax_district_id, cvg.group_id, ta.tax_area_number, 
			v.year, v.sup_num, v.taxable_classified
		from ##certification_of_value_supp_assoc csa with(nolock) 
		join ##certification_of_value_grouping cvg with(nolock) 
			on csa.dataset_id = cvg.dataset_id 
			and csa.tax_district_id = cvg.tax_district_id 
		join wash_prop_owner_val v with(nolock)
			on v.prop_id = csa.prop_id
			and v.year = csa.year
			and v.sup_num = csa.sup_num
			and v.owner_id = (
				select top 1 o.owner_id
				from owner o with(nolock)
				where o.prop_id = csa.prop_id
				and o.owner_tax_yr = csa.year
				and o.sup_num = csa.sup_num
			)
		join wash_prop_owner_levy_assoc la with(nolock)
			on la.prop_id = v.prop_id
			and la.year = v.year
			and la.sup_num = v.sup_num
			and la.owner_id = v.owner_id
			and la.tax_district_id = csa.tax_district_id
		join levy l with(nolock)
			on l.levy_cd = la.levy_cd
		-- and l.levy_cd = cvg.levy_cd	
			and l.year = la.year
		join property_tax_area pta with(nolock)
			on pta.prop_id = csa.prop_id
			and pta.year = csa.year
			and pta.sup_num = csa.sup_num
		join tax_area ta with(nolock)
			on ta.tax_area_id = pta.tax_area_id
		join wash_prop_owner_exemption e
			on v.prop_id = e.prop_id
			and v.year = e.year
			and v.sup_num = e.sup_num
			and v.owner_id = e.owner_id
			and e.exmpt_type_cd in ('SNR/DSBL')
		join levy_type lt with(nolock)
			on l.levy_type_cd = lt.levy_type_cd
			and lt.levy_part in (0, 2)			
		where csa.year = @year
		and csa.dataset_id = @dataset_id

		--NOTE: We comment this out because even though there is no mapping we still want these amounts reduced from the excess just ""beacuse""
		--and l.levy_cd in (select Distinct levy_cd from levy_exemption where year =@year and exmpt_type_cd = 'SNR/DSBL')

	) SUBQUERY
	group by dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year

) RESULTS
ON
covltai.dataset_id = RESULTS.dataset_id
and covltai.tax_district_id = RESULTS.tax_district_id
and covltai.group_id = RESULTS.group_id
and covltai.tax_area_id = RESULTS.tax_area_id
and covltai.tax_area_number = RESULTS.tax_area_number


--ONLY ADD THIS LOGIC FOR LEVY PART 0 (OTHER) AND 2 (STATE2)
update covltai 
set covltai.senior_assessed_value = covltai.senior_assessed_value + isnull(RESULTS2.senior_assessed_value, 0)
from ##certification_of_value_letter_tax_area_info covltai
join (
	select dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year, 
		sum(taxable_classified) senior_assessed_value
	from (
		select distinct csa.dataset_id, ta.tax_area_id, l.levy_cd, cvg.tax_district_id, cvg.group_id, ta.tax_area_number, v.year, v.sup_num, v.taxable_classified
		from ##certification_of_value_supp_assoc csa with(nolock) 
		join ##certification_of_value_grouping cvg with(nolock) 
			on csa.dataset_id = cvg.dataset_id 
			and csa.tax_district_id = cvg.tax_district_id 
		join wash_prop_owner_val v with(nolock)
			on v.prop_id = csa.prop_id
			and v.year = csa.year
			and v.sup_num = csa.sup_num
			and v.owner_id = (
				select top 1 o.owner_id
				from owner o with(nolock)
				where o.prop_id = csa.prop_id
				and o.owner_tax_yr = csa.year
				and o.sup_num = csa.sup_num
			)
		join wash_prop_owner_levy_assoc la with(nolock)
			on la.prop_id = v.prop_id
			and la.year = v.year
			and la.sup_num = v.sup_num
			and la.owner_id = v.owner_id
			and la.tax_district_id = csa.tax_district_id
		join levy l with(nolock)
			on l.levy_cd = la.levy_cd
		--and l.levy_cd = cvg.levy_cd	
			and l.year = la.year
		join property_tax_area pta with(nolock)
			on pta.prop_id = csa.prop_id
			and pta.year = csa.year
			and pta.sup_num = csa.sup_num
		join tax_area ta with(nolock)
			on ta.tax_area_id = pta.tax_area_id
		join levy_type lt with(nolock)
			on l.levy_type_cd = lt.levy_type_cd
			and lt.levy_part in (0, 2)
			
		where csa.year = @year
		and csa.dataset_id = @dataset_id
		and exists(
			select 1 from pers_prop_seg pps with(nolock)
			where pps.prop_id = csa.prop_id
			and pps.prop_val_yr = csa.year
			and pps.sup_num = csa.sup_num					
			and pps.farm_asset = 1
		)

	) SUBQUERY
	group by dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year

) RESULTS2
ON
covltai.dataset_id = RESULTS2.dataset_id
and covltai.tax_district_id = RESULTS2.tax_district_id
and covltai.group_id = RESULTS2.group_id
and covltai.tax_area_id = RESULTS2.tax_area_id
and covltai.tax_area_number = RESULTS2.tax_area_number


--ADD THIS LOGIC FOR ALL BUCKETS
update covltai 
set covltai.senior_assessed_value = covltai.senior_assessed_value + isnull(RESULTS.senior_assessed_value, 0)
from ##certification_of_value_letter_tax_area_info covltai
join (
	select dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year, 
		sum(taxable_classified) senior_assessed_value 
	from (
		select csa.dataset_id, ta.tax_area_id, l.levy_cd, cvg.tax_district_id, cvg.group_id, ta.tax_area_number, v.year, v.sup_num, v.taxable_classified
		from ##certification_of_value_supp_assoc csa with(nolock) 
		join ##certification_of_value_grouping cvg with(nolock) 
			on csa.dataset_id = cvg.dataset_id 
			and csa.tax_district_id = cvg.tax_district_id 
		join wash_prop_owner_val v with(nolock)
			on v.prop_id = csa.prop_id
			and v.year = csa.year
			and v.sup_num = csa.sup_num
			and v.owner_id = (
				select top 1 o.owner_id
				from owner o with(nolock)
				where o.prop_id = csa.prop_id
				and o.owner_tax_yr = csa.year
				and o.sup_num = csa.sup_num
			)
		join wash_prop_owner_levy_assoc la with(nolock)
			on la.prop_id = v.prop_id
			and la.year = v.year
			and la.sup_num = v.sup_num
			and la.owner_id = v.owner_id
			and la.tax_district_id = csa.tax_district_id
		join levy l with(nolock)
			on l.levy_cd = la.levy_cd
			--and l.levy_cd = cvg.levy_cd	
			and l.year = la.year
		join property_tax_area pta with(nolock)
			on pta.prop_id = csa.prop_id
			and pta.year = csa.year
			and pta.sup_num = csa.sup_num
		join tax_area ta with(nolock)
			on ta.tax_area_id = pta.tax_area_id
		join wash_prop_owner_exemption e
			on v.prop_id = e.prop_id
			and v.year = e.year
			and v.sup_num = e.sup_num
		join levy_type lt with(nolock)
			on l.levy_type_cd = lt.levy_type_cd
			and lt.levy_part in (0, 1, 2)
	
		where csa.year = @year
		and e.exmpt_type_cd in ('SNR/DSBL')
		and csa.dataset_id = @dataset_id

	) SUBQUERY
	group by dataset_id, tax_area_id, levy_cd, tax_district_id, group_id, tax_area_number, year

) RESULTS
ON
covltai.dataset_id = RESULTS.dataset_id
and covltai.tax_district_id = RESULTS.tax_district_id
and covltai.group_id = RESULTS.group_id
and covltai.tax_area_id = RESULTS.tax_area_id
and covltai.tax_area_number = RESULTS.tax_area_number
		

insert ##certification_of_value_letter_levy_info 
(dataset_id, tax_district_id, group_id, [year], levy_cd, levy_description, levy_type_desc, 
full_tav, half_tav, timber_roll) 

select distinct @dataset_id, t.tax_district_id, cvg.group_id, @year, 
	l.levy_cd, l.levy_description, lt.levy_type_desc, 
	isnull(l.timber_assessed_full, 0), isnull(l.timber_assessed_half, 0), 
	isnull(l.timber_assessed_roll, 0) 
from 
(
	select tafa.year, tafa.tax_district_id, tafa.levy_cd 
	from tax_area_fund_assoc tafa with(nolock) 
	join fund f with(nolock) 
		on tafa.year = f.year 
		and tafa.tax_district_id = f.tax_district_id 
		and tafa.levy_cd = f.levy_cd 
		and tafa.fund_id = f.fund_id 
		and (f.end_date is null or CONVERT(DATETIME, CONVERT(CHAR(8), @year)) < f.end_date)
	where tafa.year = @year 
	and tafa.tax_district_id in 
	( 
		select distinct tax_district_id 
		from ##certification_of_value_letter with(nolock) 
		where dataset_id = @dataset_id 
	) 
	group by tafa.year, tafa.levy_cd, tafa.tax_district_id 
) t

join levy l with(nolock) 
	on t.year = l.year 
	and t.tax_district_id = l.tax_district_id 
	and t.levy_cd = l.levy_cd 
join levy_type lt with(nolock) 
	on l.levy_type_cd = lt.levy_type_cd 
join ##certification_of_value_grouping cvg with(nolock) 
	on t.tax_district_id = cvg.tax_district_id 
where cvg.dataset_id = @dataset_id

GO

