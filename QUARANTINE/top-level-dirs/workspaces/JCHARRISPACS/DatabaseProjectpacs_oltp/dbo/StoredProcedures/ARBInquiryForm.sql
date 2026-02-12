

CREATE procedure ARBInquiryForm

@case_id	int,
@prop_val_yr	numeric(4)

as

select pv.prop_id,
       p.geo_id,
       appraiser.appraiser_nm,
       inq_create_dt,
       case_id,
       a.file_as_name,
       ad.addr_line1,
       ad.addr_line2,
       ad.addr_line3,
       ad.addr_city,
       ad.addr_state,
       ad.addr_zip,
       dbo.fn_getExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions,
       dbo.fn_getEntities(pv.prop_id, pv.prop_val_yr, pv.sup_num) as entities,
       inq_type,
       inq_nature,
       appraiser1.appraiser_nm as staff_appraiser,
       ai.prop_val_yr,
       ai.inq_taxpayer_comments
        
from _arb_inquiry ai
inner join property p           on ai.prop_id = p.prop_id
inner join prop_supp_assoc psa  on ai.prop_id = psa.prop_id
			        and ai.prop_val_yr = psa.owner_tax_yr
inner join property_val pv on psa.prop_id = pv.prop_id
			   and psa.sup_num = pv.sup_num
			   and psa.owner_tax_yr = pv.prop_val_yr
inner join owner o on pv.prop_id = o.prop_id
		   and pv.sup_num = o.sup_num
		   and pv.prop_val_yr = o.owner_tax_yr
inner join account a on o.owner_id = a.acct_id
left outer join address ad on a.acct_id = ad.acct_id and ad.primary_addr = 'Y'
left outer join appraiser on pv.last_appraiser_id = appraiser.appraiser_id
left outer join appraiser as appraiser1 on ai.inq_appraisal_staff = appraiser1.appraiser_id
where ai.case_id = @case_id
and   ai.prop_val_yr = @prop_val_yr

GO

