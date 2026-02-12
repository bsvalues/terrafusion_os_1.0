


create view entity_list_test_vw

as

select property_val.prop_id, property_val.prop_val_yr, property_val.sup_num, 
county, jail, fm_fc, road, school, entity_list.city, college, water, fire, emergency, municipal, cad_flag,
(case when county <> '' then rtrim(county) + ', ' else '' end + 
case when jail <> '' then rtrim(jail) + ', ' else '' end + 
case when fm_fc <> '' then rtrim(fm_fc) + ', ' else '' end + 
case when road <> '' then rtrim(road) + ', ' else '' end + 
case when school <> '' then rtrim(school) + ', ' else '' end + 
case when city <> '' then rtrim(city) + ', ' else '' end + 
case when college <> '' then rtrim(college) + ', ' else '' end + 
case when water <> '' then rtrim(water) + ', ' else '' end +
case when fire <> '' then rtrim(fire) + ', ' else '' end + 
case when emergency <> '' then rtrim(emergency) + ', ' else '' end + 
case when municipal <> '' then rtrim(municipal) + ', ' else '' end + 
case when cad_flag <> '' then rtrim(cad_flag) + ', ' else '' end ) as entities
from property_val
left outer join (
	select prop_id, tax_yr, sup_num,
	max(case when entity_type_cd = 'G' and ptd_multi_unit = 'A' then entity_cd else '' end) as county,
	max(case when entity_type_cd = 'G' and ptd_multi_unit = 'B' then entity_cd else '' end) as jail,
	max(case when entity_type_cd = 'G' and ptd_multi_unit = 'C' then entity_cd else '' end) as fm_fc,
	max(case when entity_type_cd = 'R' then entity_cd else '' end) as road,
	max(case when entity_type_cd = 'S' then entity_cd else '' end) as school,
	max(case when entity_type_cd = 'C' then entity_cd else '' end) as city,
	max(case when entity_type_cd = 'J' then entity_cd else '' end) as college,
	max(case when entity_type_cd = 'W' then entity_cd else '' end) as water,
	max(case when entity_type_cd = 'F' then entity_cd else '' end) as fire,
	max(case when entity_type_cd = 'E' then entity_cd else '' end) as emergency,
	max(case when entity_type_cd = 'M' then entity_cd else '' end) as municipal,
	max(case when entity_type_cd = 'A' then entity_cd else '' end) as cad_flag
	from entity_prop_assoc
	inner join entity on
		entity_prop_assoc.entity_id = entity.entity_id
	group by prop_id, tax_yr, sup_num) entity_list on
	property_val.prop_id = entity_list.prop_id and
	property_val.prop_val_yr = entity_list.tax_yr and 
	property_val.sup_num = entity_list.sup_num

GO

