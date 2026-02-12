



create view exception_imprv_vw

as

select p.prop_id, p.prop_type_cd, p.geo_id, pv.legal_desc, pv.legal_desc_2,
	a.file_as_name, imprv.imprv_type_cd, imprv_type.imprv_type_desc,
	imprv.imprv_val, pv.prop_val_yr, imprv.imprv_state_cd,
        addr.zip, addr.cass, addr.route, addr.addr_zip, addr.zip_4_2
from property p,
     property_val pv,
     prop_supp_assoc psa,
     owner o,
     account a,
     imprv,
     imprv_type,
     address addr
where p.prop_id = pv.prop_id
and   pv.prop_id = psa.prop_id
and   pv.sup_num = psa.sup_num
and   pv.prop_val_yr = psa.owner_tax_yr
and   pv.prop_id = o.prop_id
and   pv.sup_num = o.sup_num
and   pv.prop_val_yr = o.owner_tax_yr
and   o.owner_id = a.acct_id
and   imprv.prop_id = pv.prop_id
and   imprv.sup_num = pv.sup_num
and   imprv.prop_val_yr = pv.prop_val_yr
and   imprv.sale_id = 0
and   imprv.imprv_type_cd = imprv_type.imprv_type_cd
and   pv.prop_inactive_dt is null
and   addr.acct_id = a.acct_id

GO

