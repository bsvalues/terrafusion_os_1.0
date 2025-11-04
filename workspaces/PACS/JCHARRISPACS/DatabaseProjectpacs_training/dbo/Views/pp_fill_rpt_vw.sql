


CREATE view pp_fill_rpt_vw

as


select 0 as seg_id, ppss.prop_id,  ppss.prop_val_yr, segment, IsNull(ppss.pp_yr_aquired,0) as pp_yr_aquired, sum(IsNull(ppss.pp_orig_cost, 0)) as pp_orig_cost, sum(IsNull(ppss.pp_rendered_val,0)) as pp_rendered_val, NULL as GFE
from pers_prop_sub_seg ppss,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm,
     pers_prop_seg pps
where ppss.prop_id = psa.prop_id
and   ppss.sup_num = psa.sup_num
and   ppss.prop_val_yr = psa.owner_tax_yr
and   ppss.pp_type_cd = prrm.type
and   ppss.prop_id = pps.prop_id
and   ppss.sup_num = pps.sup_num
and   ppss.prop_val_yr = pps.prop_val_yr
and   ppss.pp_seg_id = pps.pp_seg_id
and   pps.pp_active_flag = 'T'

and   ppss.pp_type_cd not in (select type From pp_rendition_report_maintenance
where segment = 'Vehicles & Trailers' or segment = 'Opinion of Value')
group by ppss.prop_id, segment, ppss.pp_yr_aquired, ppss.prop_val_yr

union

select 0 as seg_id, pps.prop_id,  pps.prop_val_yr, segment, IsNull(pp_yr_aquired,0) as pp_yr_aquired, IsNull(pp_orig_cost,0) as pp_orig_cost, IsNull(pp_rendered_val,0) as pp_rendered_val, NULL as GFE
from pers_prop_seg pps,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm
where pps.prop_id = psa.prop_id
and   pps.sup_num = psa.sup_num
and   pps.prop_val_yr = psa.owner_tax_yr
and   pps.pp_type_cd  = prrm.type
and   pps.pp_active_flag = 'T'
and   not exists (select * from pers_prop_sub_seg ppss
		  where ppss.prop_id = pps.prop_id
		  and   ppss.sup_num = pps.sup_num
		  and   ppss.prop_val_yr = pps.prop_val_yr
		  and   ppss.pp_seg_id = pps.pp_seg_id)
and   pps.pp_type_cd not in (select type From pp_rendition_report_maintenance
where segment = 'Vehicles & Trailers' or segment = 'Opinion of Value')

union

select ppss.pp_sub_seg_id as seg_id, ppss.prop_id,  ppss.prop_val_yr, segment, IsNull(ppss.pp_yr_aquired,0) as pp_yr_aquired, (IsNull(ppss.pp_orig_cost, 0)) as pp_orig_cost, (IsNull(ppss.pp_rendered_val,0)) as pp_rendered_val, NULL as GFE
from pers_prop_sub_seg ppss,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm,
     pers_prop_seg pps
where ppss.prop_id = psa.prop_id
and   ppss.sup_num = psa.sup_num
and   ppss.prop_val_yr = psa.owner_tax_yr
and   ppss.pp_type_cd = prrm.type
and   ppss.prop_id = pps.prop_id
and   ppss.sup_num = pps.sup_num
and   ppss.prop_val_yr = pps.prop_val_yr
and   ppss.pp_seg_id = pps.pp_seg_id
and   pps.pp_active_flag = 'T'
and   ppss.pp_type_cd  in (select type From pp_rendition_report_maintenance
where segment = 'Vehicles & Trailers')


union

select 0 as seg_id, pps.prop_id, pps.prop_val_yr, segment, IsNull(pp_yr_aquired,0) as pp_yr_aquired, IsNull(pp_orig_cost,0) as pp_orig_cost, IsNull(pp_rendered_val,0) as pp_rendered_val, NULL as GFE
from pers_prop_seg pps,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm
where pps.prop_id = psa.prop_id
and   pps.sup_num = psa.sup_num
and   pps.prop_val_yr = psa.owner_tax_yr
and   pps.pp_type_cd  = prrm.type
and   pps.pp_active_flag = 'T'
and   not exists (select * from pers_prop_sub_seg ppss
		  where ppss.prop_id = pps.prop_id
		  and   ppss.sup_num = pps.sup_num
		  and   ppss.prop_val_yr = pps.prop_val_yr
		  and   ppss.pp_seg_id = pps.pp_seg_id)
and   pps.pp_type_cd  in (select type From pp_rendition_report_maintenance
where segment = 'Vehicles & Trailers')



union
select ppss.pp_sub_seg_id as seg_id, ppss.prop_id,  ppss.prop_val_yr,  pp_type.pp_type_desc as segment, IsNull(ppss.pp_yr_aquired,0) as pp_yr_aquired, null as pp_orig_cost, (IsNull(ppss.pp_rendered_val,0)) as pp_rendered_val, (IsNull(ppss.pp_orig_cost, 0)) as GFE
from pers_prop_sub_seg ppss,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm,
     pers_prop_seg pps,
     pp_type
where ppss.prop_id = psa.prop_id
and   ppss.sup_num = psa.sup_num
and   ppss.prop_val_yr = psa.owner_tax_yr
and   ppss.pp_type_cd = prrm.type
and   ppss.prop_id = pps.prop_id
and   ppss.sup_num = pps.sup_num
and   ppss.prop_val_yr = pps.prop_val_yr
and   ppss.pp_seg_id = pps.pp_seg_id
and   pps.pp_active_flag = 'T'
and   ppss.pp_type_cd = pp_type.pp_type_cd
and   ppss.pp_type_cd  in (select type From pp_rendition_report_maintenance
where segment = 'Opinion of Value')


union

select 0 as seg_id,  pps.prop_id, pps.prop_val_yr, pp_type.pp_type_desc as segment, IsNull(pp_yr_aquired,0) as pp_yr_aquired, null as pp_orig_cost, IsNull(pp_rendered_val,0) as pp_rendered_val, (IsNull(pp_orig_cost, 0)) as GFE
from pers_prop_seg pps,
     prop_supp_assoc psa,
     pp_rendition_report_maintenance prrm,
     pp_type
where pps.prop_id = psa.prop_id
and   pps.sup_num = psa.sup_num
and   pps.prop_val_yr = psa.owner_tax_yr
and   pps.pp_type_cd  = prrm.type
and   pps.pp_active_flag = 'T'
and   pps.pp_type_cd = pp_type.pp_type_cd
and   not exists (select * from pers_prop_sub_seg ppss
		  where ppss.prop_id = pps.prop_id
		  and   ppss.sup_num = pps.sup_num
		  and   ppss.prop_val_yr = pps.prop_val_yr
		  and   ppss.pp_seg_id = pps.pp_seg_id)
and   pps.pp_type_cd  in (select type From pp_rendition_report_maintenance
where segment = 'Opinion of Value')

GO

