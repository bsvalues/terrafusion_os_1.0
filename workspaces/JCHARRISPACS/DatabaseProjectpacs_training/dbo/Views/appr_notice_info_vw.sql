

create view dbo.appr_notice_info_vw
as
select
	anpl.notice_yr,
	anpl.prop_id,
	anpl.owner_id, 
	anpl.notice_owner_name, 
	anpl.notice_owner_id, 
	anpl.file_as_name,
	anpl.pct_ownership,
	anpl.percent_type,
	rtrim(anpl.addr_line1) as addr_line1, 
	rtrim(anpl.addr_line2) as addr_line2, 
	rtrim(anpl.addr_line3) as addr_line3, 
	rtrim(anpl.addr_city) as addr_city, 
	rtrim(anpl.addr_state) as addr_state, 
	rtrim(anpl.addr_zip) as addr_zip, 
	rtrim(anpl.addr_country) as addr_country,
	case when rtrim(c.country_name) = 'US' then NULL else rtrim(c.country_name) end as addr_country_desc,
	anpl.an_imprv_hstd_val, 
	anpl.an_imprv_non_hstd_val, 
	anpl.an_land_hstd_val, 
	anpl.an_land_non_hstd_val, 
	anpl.an_ag_market, 
	anpl.an_ag_land_mkt_val, 
	anpl.an_ag_land_use_val, 
	anpl.an_timber_market, 
	anpl.an_timber_use, 
	anpl.an_pers_prop_mineral_value,
	anpl.an_appraised_val, 
	anpl.an_assessed_val,
	anpl.an_market_val,
	anpl.an_ten_percent_cap, 
	anpl.an_prev_imprv_hstd_val, 
	anpl.an_prev_imprv_non_hstd_val, 
	anpl.an_prev_land_hstd_val, 
	anpl.an_prev_land_non_hstd_val, 
	anpl.an_prev_ag_market_val, 
	anpl.an_prev_ag_land_mkt_val, 
	anpl.an_prev_ag_land_use_val, 
	anpl.an_prev_timber_market_val, 
	anpl.an_prev_timber_use, 
	anpl.an_prev_pers_prop_mineral_value,
	anpl.an_prev_appraised_val, 
	anpl.an_prev_assessed_val, 
	anpl.an_prev_market_val, 
	anpl.an_prev_ten_percent_cap, 
	anpl.an_prev_yr,
	anpl.an_5yr,
	anpl.an_5yr_assessed_val,
	anpl.an_5yr_assessed_val_pct_change,
	anpl.geo_id, 
	anpl.ref_id1,
	anpl.ref_id2,
	anpl.legal_desc, 
	anpl.legal_acreage, 
	anpl.dba_name, 
	anpl.situs_num, 
	anpl.situs_street_prefx, 
	anpl.situs_street, 
	anpl.situs_street_sufix, 
	anpl.situs_city, 
	anpl.situs_state, 
	anpl.situs_zip, 
	anpl.situs_display,
	anpl.last_appraiser_id, 
	anpl.last_appraiser_nm, 
	anpl.agent_copy,
	isnull(sa.office_name,'') as office_name,
	anpl.sys_addr_line1, 
	anpl.sys_addr_line3, 
	anpl.sys_addr_city, 
	anpl.sys_addr_state, 
	anpl.sys_addr_zip, 
	anpl.sys_phone_num, 
	isnull(sa.phone_num2,'')as phone_num2,
	anpl.sys_fax_num, 
	anpl.exemption,
	anpl.prev_exemption,
	anpl.sys_addr_line2, 
	isnull(sa.url,'') as url,
	ansc.notice_line2, 
	ansc.notice_line1, 
	ansc.notice_line3, 
	ansc.arb_hearing_dt, 
	ansc.arb_protest_due_dt, 
	ansc.arb_location, 
	ansc.print_prop_id_19a, 
	ansc.print_prior_year_19a, 
	ansc.print_appraiser_19a, 
	ansc.print_tax_due_19a,
	ansc.print_hs_cap_value_19a,
	ansc.print_freeze_year_19a,
	ansc.print_id_type_19a,
	anpl.notice_num, 
	anpl.sup_yr, 
	anpl.sup_num, 
	ansc.print_dt, 
	anpl.sys_chief_appraiser, 
	ps.client_name,
	ancm.notice_of_protest_flag,
	anpl.zip_4_2,
	anpl.special_group_id,
	sg.name as special_group_name,
	RTRIM(p.prop_type_cd) as prop_type_cd,
	anpl.timber_78 as timber_78,
	isnull(ps.use_timber_78_values, 0) as use_timber_78_values,
	 anpl.is_international,
	CASE anpl.percent_type
		WHEN 'S' THEN 'The owner of this property has his or her ownership reflected at the segment level.' 
		ELSE NULL 
	END
	AS not_comment,
	CASE
		WHEN sp.pacs_prop_id IS NULL then 0
		else 1
	END
	AS overlap_indicator,
	CASE 
		WHEN sp.pacs_prop_id IS NULL THEN NULL
		ELSE sp.cad_sup_comment
	END
	AS overlap_comment  
	
	
from
	appr_notice_prop_list as anpl with (nolock)
inner join
	appr_notice_selection_criteria as ansc with (nolock)
on
	ansc.notice_yr = anpl.notice_yr
and	ansc.notice_num = anpl.notice_num
inner join
	appr_notice_config_maint as ancm with (nolock)
on
	ancm.notice_yr = anpl.notice_yr
inner join
	system_address as sa with (nolock)
on
	sa.system_type in ('A', 'B') 
inner join
	pacs_system as ps with (nolock)
on
	ps.system_type in ('A', 'B')
left outer join
	country as c with (nolock)
on
	c.country_cd = anpl.addr_country
left outer join
	special_group as sg with (nolock)
on
	sg.special_group_id = anpl.special_group_id
left outer join
	property as p with (nolock)
on
	p.prop_id = anpl.prop_id

left outer join shared_prop as sp with (nolock)  
on 	sp.pacs_prop_id = anpl.prop_id
and	sp.shared_year = anpl.sup_yr
and 	sp.sup_num = anpl.sup_num

GO

