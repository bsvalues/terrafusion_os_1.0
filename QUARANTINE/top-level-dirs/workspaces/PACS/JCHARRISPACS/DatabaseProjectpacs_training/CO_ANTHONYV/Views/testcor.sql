create view [CO\ANTHONYV].testcor as
SELECT DISTINCT TOP 0  pv.prop_id, p.geo_id, pv.cycle,
ta.tax_area_number as 'tca', 
replace(ac.file_as_name, ',', '') as 'owner',
a.addr_line1, a.addr_line2, a.addr_line3, 
a.addr_city, a.addr_state, a.addr_zip,
s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix,
s.situs_city, s.situs_state, s.situs_zip, s.situs_unit,
pv.township_section as 'section', pv.township_code as 'township', 
pv.range_code as 'range', pv.township_q_section as '1/4 section',
(pv.imprv_hstd_val + pv.imprv_non_hstd_val) as 'imprv value',
(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market) as 'land val', 
pv.market, pp.imprv_type_cd, pv.property_use_cd as 'primary use code',
pu.property_use_desc as 'primary use code desc', 
dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions
from property_val pv with (nolock)
inner join prop_supp_assoc psa with (nolock) on
                pv.prop_id = psa.prop_id 
                and pv.prop_val_yr = psa.owner_tax_yr 
                and pv.sup_num = psa.sup_num
inner join property p with (nolock) on
                pv.prop_id = p.prop_id
inner join owner o with (nolock) on
                pv.prop_id = o.prop_id
                and pv.prop_val_yr = o.owner_tax_yr
                and pv.sup_num = o.sup_num
inner join account ac with (nolock) on
                o.owner_id = ac.acct_id
inner join address a with (nolock) on
                ac.acct_id = a.acct_id
                and isnull(a.primary_addr, 0) = 'y'
inner join property_tax_area pta with (nolock) on
                pv.prop_id = pta.prop_id
                and pv.prop_val_yr = pta.year
                and pv.sup_num = pta.sup_num 
inner join tax_area ta with (nolock) on
                pta.tax_area_id = ta.tax_area_id
inner join property_profile pp with (nolock) on
                pv.prop_id = pp.prop_id
                and pv.prop_val_yr = pp.prop_val_yr
inner join property_use pu with (nolock) on
                pv.property_use_cd = pu.property_use_cd
left outer join situs s with (nolock) on
                pv.prop_id = s.prop_id
                and isnull(s.primary_situs, 'n') = 'y'
where pv.prop_val_yr = 2020---you can change year as needed
and pv.prop_inactive_dt is null
and ((pv.township_code = '10' and pv.range_code = '28' and pv.township_section <> '31')
or (pv.township_code = '09' and pv.range_code = '28' and pv.township_section not in ('6', '7', '18'))
or (pv.township_code = '08' and pv.range_code = '28' and pv.township_section between '01' and '12')
or (pv.township_code = '09' and pv.range_code = '29' and pv.township_section in ('18', '19', '20', '29', '30'))
or (pv.township_code = '10' and pv.range_code = '27' and pv.township_section in ('01', '02', '11', '12', '13', '14', '23', '24', '25'))
or (pv.township_code = '11' and pv.range_code = '28' and pv.township_section in ('33', '34')))
order by pv.township_section, pv.township_code, pv.range_code

GO

