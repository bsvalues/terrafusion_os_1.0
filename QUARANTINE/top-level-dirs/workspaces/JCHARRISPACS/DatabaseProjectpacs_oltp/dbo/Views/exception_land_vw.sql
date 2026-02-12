



create view exception_land_vw

as

select p.prop_id, p.prop_type_cd, p.geo_id, pv.legal_desc, pv.legal_desc_2,
	a.file_as_name, land_detail.land_type_cd, land_type.land_type_desc,
	land_detail.land_seg_mkt_val, land_detail.ag_val, pv.prop_val_yr,
        addr.zip, addr.cass, addr.route, addr.addr_zip, addr.zip_4_2
from property p,
     property_val pv,
     prop_supp_assoc psa,
     owner o,
     account a,
     land_detail,
     land_type,
     address addr
where p.prop_id = pv.prop_id
and   pv.prop_id = psa.prop_id
and   pv.sup_num = psa.sup_num
and   pv.prop_val_yr = psa.owner_tax_yr
and   pv.prop_id = o.prop_id
and   pv.sup_num = o.sup_num
and   pv.prop_val_yr = o.owner_tax_yr
and   o.owner_id = a.acct_id
and   land_detail.prop_id = pv.prop_id
and   land_detail.sup_num = pv.sup_num
and   land_detail.prop_val_yr = pv.prop_val_yr
and   land_detail.sale_id = 0
and   land_detail.land_type_cd = land_type.land_type_cd
and   pv.prop_inactive_dt is null
and   a.acct_id = addr.acct_id

GO

