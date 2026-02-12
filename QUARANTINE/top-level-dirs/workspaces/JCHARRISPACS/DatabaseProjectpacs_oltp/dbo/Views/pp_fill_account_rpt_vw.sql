


CREATE     view pp_fill_account_rpt_vw

as

SELECT distinct o.owner_id, 
		
		psa.owner_tax_yr AS sup_yr, 
		psa.sup_num, 
		o.owner_tax_yr, 
		case when aac.file_as_name is null and IsNull(ac.confidential_flag, 'F') = 'F' then ac.file_as_Name
	             when aac.file_as_name is null and IsNull(ac.confidential_flag, 'F') = 'T' then ac.confidential_file_as_Name
		     when aac.file_as_name is not null and IsNull(aac.confidential_flag, 'F') = 'F' then aac.file_as_Name
	             when aac.file_as_name is not null and IsNull(aac.confidential_flag, 'F') = 'T' then aac.confidential_file_as_Name
		end as file_as_name,


		case when aac.confidential_file_as_Name is null then ac.confidential_file_as_name else aac.confidential_file_as_Name end as confidential_file_as_name, 
		p.ref_id1, 
		p.ref_id2, 
		p.geo_id,
		p.simple_geo_id, 
		p.dba_name, 
		p.alt_dba_name, 
		p.prop_type_cd, 
		t.prop_type_desc, 
		pv.legal_desc, 
		pv.legal_desc_2, 
		pv.legal_acreage, 
		p.prop_id AS owner_prop_id, 
		pv.prop_inactive_dt, 
		pv.eff_size_acres, 
		pv.appr_company_id, 
		pv.appraised_val, 
	        p.prop_sic_cd,
		case when aac.file_as_name is null then 'O' else 'A' end as doc_type,
		case when aac.file_as_name is null then ac.acct_id else aac.acct_id end as doc_acct_id,
		case when ac.confidential_file_as_name is not null then ac.confidential_file_as_name else ac.file_as_name end as doc_owner_name,
		situs_display,
		udi_parent,
		market as market_val,
		ppgav.prop_group_cd

 
		

FROM property_val as pv

INNER JOIN prop_supp_assoc as psa
ON pv.prop_id = psa.prop_id
AND pv.prop_val_yr = psa.owner_tax_yr
AND pv.sup_num = psa.sup_num

INNER JOIN property as p
ON pv.prop_id = p.prop_id
and p.prop_type_cd = 'P'

INNER JOIN property_type as t
ON p.prop_type_cd = t.prop_type_cd

INNER JOIN owner as o
ON pv.prop_id = o.prop_id
AND pv.prop_val_yr = o.owner_tax_yr
AND pv.sup_num = o.sup_num

INNER JOIN account as ac
ON o.owner_id = ac.acct_id

left outer join agent_assoc aa
on   o.prop_id     = aa.prop_id
and  o.owner_id     = aa.owner_id
and  o.owner_tax_yr = aa.owner_tax_yr
and  aa.ca_mailings = 'T' 

left outer join account aac
on   aa.agent_id = aac.acct_id

left outer join situs s
on   pv.prop_id = s.prop_id
and  s.primary_situs = 'Y'

left outer join prop_group_assoc_Vn_top_one_vw ppgav
on pv.prop_id = ppgav.prop_id

GO

