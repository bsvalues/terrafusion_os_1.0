--land_type_size_acres
create view __land_type_size as 

select pv.prop_id, pv.prop_val_yr, pv.sup_num, ld.land_type_cd, lt.land_type_desc, SUM(ld.size_acres) total_acres	---71044
--into #tmp2
from property_val pv with(nolock)
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
join land_detail ld with(nolock)
	on ld.prop_id = pv.prop_id
	and ld.prop_val_yr = pv.prop_val_yr
	and ld.sup_num = pv.sup_num
	and ld.sale_id = 0
join land_type lt with(nolock)
	on lt.land_type_cd = ld.land_type_cd
join (select ld2.prop_id, ld2.prop_val_yr, ld2.sup_num, max(ld2.size_acres) acres
		from land_detail ld2 with(nolock) 
		join prop_supp_assoc psa2 with(nolock)
			on psa2.prop_id = ld2.prop_id
			and psa2.owner_tax_yr = ld2.prop_val_yr
			and psa2.sup_num = ld2.sup_num
			and ld2.sale_id = 0
		where ld2.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)
		group by ld2.prop_id, ld2.prop_val_yr, ld2.sup_num) l
	on l.prop_id = pv.prop_id
	and l.prop_val_yr = pv.prop_val_yr
	and l.sup_num = pv.sup_num
	and ld.size_acres = l.acres
where pv.prop_inactive_dt is NULL
and pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)--or use this for previous year (select appr_yr-1 from pacs_oltp.dbo.pacs_system) or (select tax_yr from pacs_oltp.dbo.pacs_system)
--and pv.prop_id = 306668
group by pv.prop_id, pv.prop_val_yr, pv.sup_num, ld.land_type_cd, lt.land_type_desc

GO

