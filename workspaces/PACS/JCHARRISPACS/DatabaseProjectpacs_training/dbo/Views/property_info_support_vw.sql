


CREATE VIEW dbo.property_info_support_vw
AS
SELECT   pv.prop_id, 
                pv.prop_val_yr,
                pga.prop_group_cd,
                o.owner_id, 
                acc.file_as_name, 
                pv.legal_desc, 
                lt.land_type_desc, 
                ld.size_acres, 
                ls.ls_code,
                pv.udi_parent_prop_id 

                from property_val pv with (nolock) 
                inner join prop_supp_assoc psa with (nolock)
                on pv.prop_id = psa.prop_id
                and pv.prop_val_yr = psa.owner_tax_yr
                and pv.sup_num = psa.sup_num
                AND (pv.udi_parent_prop_id IS NULL OR pv.udi_parent_prop_id = 0 ) 
                inner join prop_group_assoc pga with (nolock)
                on pv.prop_id = pga.prop_id
                inner join owner o with (nolock)
                on pv.prop_id = o.prop_id
                and pv.prop_val_yr = o.owner_tax_yr
                and pv.sup_num = o.sup_num 
                inner join account acc with (nolock)
                on o.owner_id = acc.acct_id
                left outer join land_detail as ld with (nolock)
                on ld.prop_id = pv.prop_id
                and ld.prop_val_yr = pv.prop_val_yr
                and ld.sup_num = pv.sup_num
                left outer join land_sched as ls with (nolock)
                on ls.ls_id = ld.ls_ag_id
                and ls.ls_year = ld.prop_val_yr
                left outer join land_type lt with (nolock)
                on ld.land_type_cd = lt.land_type_cd 

UNION ALL 
       SELECT   pv.prop_id, 
                pv.prop_val_yr,
                pga.prop_group_cd,
                o.owner_id, 
                acc.file_as_name, 
                pv.legal_desc, 
                lt.land_type_desc, 
                ld.size_acres, 
                ls.ls_code,
                pv.udi_parent_prop_id 

                 from property_val pv with (nolock) 
                inner join prop_supp_assoc psa with (nolock)
                on pv.prop_id = psa.prop_id
                and pv.prop_val_yr = psa.owner_tax_yr
                and pv.sup_num = psa.sup_num
                AND (pv.udi_parent_prop_id IS NOT NULL AND pv.udi_parent_prop_id > 0 )
                inner join prop_group_assoc pga with (nolock)
                on pv.prop_id = pga.prop_id
                inner join owner o with (nolock)
                on pv.prop_id = o.prop_id
                and pv.prop_val_yr = o.owner_tax_yr
                and pv.sup_num = o.sup_num 
                inner join account acc with (nolock)
                on o.owner_id = acc.acct_id
                left outer join land_detail as ld with (nolock)
                on ld.prop_id = pv.udi_parent_prop_id
                and ld.prop_val_yr = pv.prop_val_yr
                and ld.sup_num = pv.sup_num
                left outer join land_sched as ls with (nolock)
                on ls.ls_id = ld.ls_ag_id
                and ls.ls_year = ld.prop_val_yr
                left outer join land_type lt with (nolock)
                on ld.land_type_cd = lt.land_type_cd

GO

