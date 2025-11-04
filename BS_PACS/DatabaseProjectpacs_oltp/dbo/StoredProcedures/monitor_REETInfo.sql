






















---here is how you set up the monitor call:  {Call monitor_REETInfo2 ('1/1/2017', '1/31/2017')}    







/*  







This monitor was created for Benton to mimic the excise detail report but to include all payments



related to REET in a given month including voids.







*/







CREATE procedure [dbo].[monitor_REETInfo]          






@begin_date		datetime,
@end_date		datetime








as          









select distinct r.reet_id, r.excise_number, case when ria.account_type_cd = 'B' then 'Buyer' else 'Seller' end as buyer_seller, 
ria.name, ria.addr_line1, ria.addr_line2, ria.addr_line3, 
ria.addr_city, ria.addr_state, ria.addr_zip, rip.situs_display, rip.prop_id, r.sale_price, 
r.base_excise_due, r.excise_amount_paid, r.sale_date, 
 max(pm.image_id) as image_id, pm.rec_type, pm.location, pm.scan_dt, pm.image_dt, pm.ref_id, r.instrument_type_cd 

from reet_import_property rip

inner join reet r
on rip.reet_id = r.reet_id

inner join reet_import_account ria
on r.reet_id = ria.reet_id

left outer join pacs_image pm
on r.reet_id = pm.ref_id
and pm.image_type = 'REET'
and pm.ref_type = 'RT'

where completion_date >= @begin_date

and completion_date <= @end_date

group by r.reet_id, r.excise_number, ria.account_type_cd, 
ria.name, ria.addr_line1, ria.addr_line2, ria.addr_line3, 
ria.addr_city, ria.addr_state, ria.addr_zip, rip.situs_display, rip.prop_id, r.sale_price, 
r.base_excise_due, r.excise_amount_paid, r.sale_date, 
 pm.image_id, pm.rec_type, pm.location, pm.scan_dt, pm.image_dt, pm.ref_id, r.instrument_type_cd 

order by r.reet_id

GO

