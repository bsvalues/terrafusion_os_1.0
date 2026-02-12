
CREATE VIEW report_arb_protest_vw

AS

select ap.closed_pacs_user_id,
		ap.prot_appraisal_staff,
		ap.prot_assigned_panel,
		ap.prot_type,
		ap.prop_val_yr,
		ap.case_id,
		ap.prop_id,
		a.file_as_name,
		p.geo_id,
		app.appraiser_nm,
		convert(varchar(50), aphd.docket_start_date_time) as hearing_date,
		ap.prot_status,
		pv.appraised_val
from _arb_protest as ap
with (nolock)

inner join prop_supp_assoc as psa
with (nolock)
on ap.prop_id = psa.prop_id
and ap.prop_val_yr = psa.owner_tax_yr

inner join property_val as pv
with (nolock)
on ap.prop_id = pv.prop_id
and ap.prop_val_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num

inner join owner as o
with (nolock)
on ap.prop_id = o.prop_id
and ap.prop_val_yr = o.owner_tax_yr
and psa.sup_num = o.sup_num

inner join property as p
with (nolock)
on ap.prop_id = p.prop_id

inner join account as a
with (nolock)
on o.owner_id = a.acct_id

inner join appraiser as app
with (nolock)
on ap.prot_hearing_appraisal_staff = app.appraiser_id

inner join _arb_protest_hearing_docket as aphd
with (nolock)
on ap.docket_id = aphd.docket_id

GO

