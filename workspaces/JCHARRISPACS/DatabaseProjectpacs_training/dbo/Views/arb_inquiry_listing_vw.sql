
CREATE VIEW dbo.arb_inquiry_listing_vw
AS
SELECT ai.prop_id, ai.prop_val_yr, ai.case_id, psa.sup_num, 
				ai.inq_taxpayer_comments, pv.land_non_hstd_val, pv.imprv_hstd_val, pv.land_hstd_val, 
				pv.imprv_non_hstd_val, pv.appraised_val, pv.assessed_val, pv.ag_use_val, 
				pv.ag_market, pv.timber_use, pv.timber_market, pv.ten_percent_cap, 
				pv.legal_desc, p.geo_id, o.owner_id, o.pct_ownership, p.prop_type_cd, 
				ai.inq_type, ai.inq_appraisal_staff as inq_appraisal_staff,app_staff.appraiser_full_name as inq_appraisal_staff_name,
				 ai.inq_status, ai.inq_complete_dt, 
				ai.appraiser_meeting_date_time, pv.last_appraiser_id, ai.appraiser_meeting_appraiser_id, app.appraiser_nm,
				pv.property_use_cd, a.file_as_name, ad.addr_line1, ad.addr_line2, ad.addr_line3,
				ad.addr_city, ad.addr_state, ad.addr_zip, ad.is_international, c.country_name,
				ai.inq_nature,pv.hood_cd
FROM _arb_inquiry as ai
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on ai.prop_val_yr = psa.owner_tax_yr
and ai.prop_id = psa.prop_id
join property as p
with (nolock)
on ai.prop_id = p.prop_id
join property_val as pv
with (nolock)
on psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num
and psa.prop_id = pv.prop_id
join owner as o
with (nolock)
on psa.owner_tax_yr = o.owner_tax_yr
and psa.sup_num = o.sup_num
and psa.prop_id = o.prop_id
join account as a
with (nolock)
on ai.inq_by_id = a.acct_id
left outer join address as ad
with (nolock)
on a.acct_id = ad.acct_id
and ad.primary_addr = 'Y'
left outer join country as c
with (nolock)
on ad.country_cd = c.country_cd
left outer join appraiser as app
with (nolock)
ON ai.appraiser_meeting_appraiser_id = app.appraiser_id
left outer join appraiser as app_staff
with (nolock)
ON ai.inq_appraisal_staff = app_staff.appraiser_id

GO

