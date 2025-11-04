



create view exception_assessed_vw

as

select p.prop_id, p.prop_type_cd, p.geo_id, pv.legal_desc, pv.legal_desc_2,
	a.file_as_name, pv.assessed_val, pv.prop_val_yr,
        addr.zip, addr.cass, addr.route, addr.addr_zip, addr.zip_4_2
from property p,
     property_val pv,
     prop_supp_assoc psa,
     owner o,
     account a,
     address addr
where p.prop_id = pv.prop_id
and   pv.prop_id = psa.prop_id
and   pv.sup_num = psa.sup_num
and   pv.prop_val_yr = psa.owner_tax_yr
and   pv.prop_id = o.prop_id
and   pv.sup_num = o.sup_num
and   pv.prop_val_yr = o.owner_tax_yr
and   o.owner_id = a.acct_id
and   pv.prop_inactive_dt is null
and   a.acct_id = addr.acct_id

GO

