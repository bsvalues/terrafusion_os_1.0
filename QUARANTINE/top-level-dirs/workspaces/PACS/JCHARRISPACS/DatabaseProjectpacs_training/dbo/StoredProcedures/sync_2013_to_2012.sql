

--begin tran
--rollback tran
--commit tran


--exec sync_2013_to_2012




CREATE procedure sync_2013_to_2012

as




--Disable Triggers
alter table imprv_det_adj disable trigger all 
alter table imprv_detail  disable trigger all
alter table imprv_adj  disable trigger all
alter table imprv_attr disable trigger all
alter table imprv  disable trigger all
alter table land_adj  disable trigger all
alter table land_detail  disable trigger all


print 'Cleanup...'


--Delete
delete from imprv_det_adj where prop_val_yr = 2012
delete from imprv_attr where prop_val_yr = 2012
delete from imprv_detail where prop_val_yr = 2012
delete from imprv_adj where prop_val_yr = 2012
delete from imprv_owner_assoc where prop_val_yr = 2012
delete from imprv where prop_val_yr = 2012
delete from land_adj where prop_val_yr = 2012
delete from land_owner_assoc where prop_val_yr = 2012
delete from land_detail where prop_val_yr = 2012


--insert new land_type codes
insert land_type
select 'HS','History HS','F',null,null,0,null
union
select 'NHS','History NHS','F',null,null,0,null
union
select 'AG','History AG/TIM','F',null,null,0,null



print 'Insert land...'

IF OBJECT_ID (N'dbo.PACS_SYNC_LAND', N'U') IS NOT NULL
	drop table PACS_SYNC_LAND


select
--CAST( ROW_NUMBER() OVER( ORDER BY prop_id ) AS INT) + (SELECT ISNULL(MAX(land_seg_id),999) FROM land_detail WITH(NOLOCK)) as land_seg_id,
p.prop_id,						
2012 as prop_val_yr,			
0		as sup_num,				
0		as sale_id,				
null	as ls_mkt_id,
null	as ls_ag_id,
'HS' as land_type_cd,
null as land_seg_desc,
'N'		as land_seg_sl_lock,		--sales lock
CASE WHEN LEFT(LTRIM(RTRIM(property_use_cd)),2) is not null then LEFT(LTRIM(RTRIM(property_use_cd)),2) else 'CNV' end as state_cd,
'T' as land_seg_homesite,		--T/F Homesite
0 as size_acres,	
0 as size_square_feet,	
0 as effective_front,
null	as effective_depth,
0 as mkt_unit_price,
pv.land_hstd_val as land_seg_mkt_val,
pv.land_hstd_val as mkt_flat_val,
null	as mkt_calc_val,
null	as mkt_adj_val,
null	as ag_loss,
'F'	as mkt_val_source,		--(A)Adjusted,(F)Flat
NULL as ag_use_cd,
0  as ag_unit_price,
'F' as ag_apply,	
0 as ag_val,
null	as ag_calc_val,
null	as ag_adj_val,
0 as ag_flat_val,  --??
null	as ag_val_type,
null	as ag_timb_conv_dt,
'F'	as ag_val_source,
null	as ag_eff_tax_year,
null	as land_seg_comment,	
null	as ag_apply_yr,
null	as land_seg_orig_val,
null	as land_seg_up,			--
null	as land_adj_type_cd,	
NULL	as width_front,
null	as width_back,
null	as depth_right,
null	as depth_left,
NULL	as eff_size_acres,
null	as land_adj_amt,
NULL	as land_adj_factor,
null	as land_mass_adj_factor,
null	as effective_tax_year,
null	as land_new_val,
'F'		as late_ag_apply,	-- T/F
convert(varchar(20),p.ref_id1)	as ref_id1,
null	as oa_mkt_val,
null	as oa_ag_val,
'F'		as eff_size_acres_override,	-- T/F
0 as num_lots,
'F'		as new_ag,					-- T/F
null	as new_ag_prev_val,
null	as new_ag_prev_val_override,			-- T/F
null	as appraisal_cd,
null	as arb_val,
NULL as land_class_code,		
null	as land_influence_code,	
0.00	as size_useable_acres,
null	as size_useable_square_feet,
0		as dist_val,
null	as timber_78_val,
null	as timber_78_val_pct,
null	as hs_pct,
0		as hs_pct_override,
null	as land_soil_code,    --land use 2
null	as ag_land_type_cd,  --tim or 1d1  ??
null	as prev_st_land_type_cd,
'Converted flat value'	as flat_value_comment,
null	as flat_value_user_id,
null	as flat_value_dt,
null	as misc_value,
null	as new_construction_flag,
null	as new_construction_value,
null	as new_construction_value_override,
null	as last_import_date,
null	as last_import_user_id,
null	as assessment_yr_qualified,
null	as current_use_effective_acres,
NULL	as primary_use_cd,
0 as primary_use_override,  --set if rpmst.rplu1 is different than land
null as sub_use_cd,
null	as use_type_schedule,  --??
null as type_schedule,    --??
null	as application_number,
null	as recording_number

into [PACS_SYNC_LAND]

--select top 20 pv.*
from property_val pv
join property p on p.prop_id=pv.prop_id
where pv.prop_val_yr=2013 and pv.land_hstd_val > 0
 

union
select
--CAST( ROW_NUMBER() OVER( ORDER BY prop_id ) AS INT) + (SELECT ISNULL(MAX(land_seg_id),999) FROM land_detail WITH(NOLOCK)) as land_seg_id,
p.prop_id,						
2012 as prop_val_yr,			
0		as sup_num,				
0		as sale_id,				
null	as ls_mkt_id,
null	as ls_ag_id,
'NHS' as land_type_cd,
null as land_seg_desc,
'N'		as land_seg_sl_lock,		--sales lock
CASE WHEN LEFT(LTRIM(RTRIM(property_use_cd)),2) is not null then LEFT(LTRIM(RTRIM(property_use_cd)),2) else 'CNV' end as state_cd,
'F' as land_seg_homesite,		--T/F Homesite
0 as size_acres,	
0 as size_square_feet,	
0 as effective_front,
null	as effective_depth,
0 as mkt_unit_price,
pv.land_non_hstd_val as land_seg_mkt_val,
pv.land_non_hstd_val as mkt_flat_val,
null	as mkt_calc_val,
null	as mkt_adj_val,
null	as ag_loss,
'F'	as mkt_val_source,		--(A)Adjusted,(F)Flat
NULL as ag_use_cd,
0  as ag_unit_price,
'F' as ag_apply,	
0 as ag_val,
null	as ag_calc_val,
null	as ag_adj_val,
0 as ag_flat_val, 
null	as ag_val_type,
null	as ag_timb_conv_dt,
'F'	as ag_val_source,
null	as ag_eff_tax_year,
null	as land_seg_comment,	
null	as ag_apply_yr,
null	as land_seg_orig_val,
null	as land_seg_up,	
null	as land_adj_type_cd,	
NULL	as width_front,
null	as width_back,
null	as depth_right,
null	as depth_left,
NULL	as eff_size_acres,
null	as land_adj_amt,
NULL	as land_adj_factor,
null	as land_mass_adj_factor,
null	as effective_tax_year,
null	as land_new_val,
'F'		as late_ag_apply,	-- T/F
convert(varchar(20),p.ref_id1)	as ref_id1,
null	as oa_mkt_val,
null	as oa_ag_val,
'F'		as eff_size_acres_override,	-- T/F
0 as num_lots,
'F'		as new_ag,					-- T/F
null	as new_ag_prev_val,
null	as new_ag_prev_val_override,			-- T/F
null	as appraisal_cd,
null	as arb_val,
NULL as land_class_code,		
null	as land_influence_code,	
0.00	as size_useable_acres,
null	as size_useable_square_feet,
0		as dist_val,
null	as timber_78_val,
null	as timber_78_val_pct,
null	as hs_pct,
0		as hs_pct_override,
null	as land_soil_code,    --land use 2
null	as ag_land_type_cd,  --tim or 1d1  ??
null	as prev_st_land_type_cd,
'Converted flat value'	as flat_value_comment,
null	as flat_value_user_id,
null	as flat_value_dt,
null	as misc_value,
null	as new_construction_flag,
null	as new_construction_value,
null	as new_construction_value_override,
null	as last_import_date,
null	as last_import_user_id,
null	as assessment_yr_qualified,
null	as current_use_effective_acres,
NULL	as primary_use_cd,
0 as primary_use_override,
null as sub_use_cd,
null	as use_type_schedule,  --??
null as type_schedule,    --??
null	as application_number,
null	as recording_number

--select top 20 pv.*
from property_val pv
join property p on p.prop_id=pv.prop_id
where pv.prop_val_yr=2013 and pv.land_non_hstd_val > 0
 

union
select
--CAST( ROW_NUMBER() OVER( ORDER BY prop_id ) AS INT) + (SELECT ISNULL(MAX(land_seg_id),999) FROM land_detail WITH(NOLOCK)) as land_seg_id,
p.prop_id,						
2012 as prop_val_yr,			
0		as sup_num,				
0		as sale_id,				
null	as ls_mkt_id,
null	as ls_ag_id,
'AG' as land_type_cd,
null as land_seg_desc,
'N'		as land_seg_sl_lock,		--sales lock
CASE WHEN LEFT(LTRIM(RTRIM(property_use_cd)),2) is not null then LEFT(LTRIM(RTRIM(property_use_cd)),2) else 'CNV' end as state_cd,
'F' as land_seg_homesite,		--T/F Homesite
pv.eff_size_acres as size_acres,
0 as size_square_feet,	
0 as effective_front,
null	as effective_depth,
0 as mkt_unit_price,
pv.ag_market as land_seg_mkt_val,
pv.ag_market as mkt_flat_val,
null	as mkt_calc_val,
null	as mkt_adj_val,
null	as ag_loss,
'F'	as mkt_val_source,		--(A)Adjusted,(F)Flat
'AG' as ag_use_cd,
0  as ag_unit_price,
'T' as ag_apply,	
pv.ag_use_val as ag_val,
null	as ag_calc_val,
null	as ag_adj_val,
pv.ag_use_val as ag_flat_val,  
null	as ag_val_type,
null	as ag_timb_conv_dt,
'F'	as ag_val_source,
null	as ag_eff_tax_year,
null	as land_seg_comment,	
2012	as ag_apply_yr,
null	as land_seg_orig_val,
null	as land_seg_up,			--
null	as land_adj_type_cd,	
NULL	as width_front,
null	as width_back,
null	as depth_right,
null	as depth_left,
pv.eff_size_acres as eff_size_acres,
null	as land_adj_amt,
NULL	as land_adj_factor,
null	as land_mass_adj_factor,
null	as effective_tax_year,
null	as land_new_val,
'F'		as late_ag_apply,	-- T/F
convert(varchar(20),p.ref_id1)	as ref_id1,
null	as oa_mkt_val,
null	as oa_ag_val,
'F'		as eff_size_acres_override,	-- T/F
0 as num_lots,
'F'		as new_ag,					-- T/F
null	as new_ag_prev_val,
null	as new_ag_prev_val_override,			-- T/F
null	as appraisal_cd,
null	as arb_val,
NULL as land_class_code,		
null	as land_influence_code,	
pv.eff_size_acres as size_useable_acres,
null	as size_useable_square_feet,
0		as dist_val,
null	as timber_78_val,
null	as timber_78_val_pct,
null	as hs_pct,
0		as hs_pct_override,
null	as land_soil_code,    --land use 2
null	as ag_land_type_cd,  --tim or 1d1  ??
null	as prev_st_land_type_cd,
'Converted flat value'	as flat_value_comment,
null	as flat_value_user_id,
null	as flat_value_dt,
null	as misc_value,
null	as new_construction_flag,
null	as new_construction_value,
null	as new_construction_value_override,
null	as last_import_date,
null	as last_import_user_id,
null	as assessment_yr_qualified,
null	as current_use_effective_acres,
NULL	as primary_use_cd,
0 as primary_use_override,  --set if rpmst.rplu1 is different than land
null as sub_use_cd,
null	as use_type_schedule,  --??
null as type_schedule,    --??
null	as application_number,
null	as recording_number

--select top 20 pv.*
from property_val pv
join property p on p.prop_id=pv.prop_id
where pv.prop_val_yr=2013 and pv.ag_market > 0
 

--set land_seg_id
select 
cast( row_number() over( order by prop_id ) as int) + (select isnull(max(land_seg_id),999) from land_detail with(nolock)) as land_seg_id,
*
into PACS_SYNC_LAND2
from PACS_SYNC_LAND

insert into land_detail
(
land_seg_id,
prop_id,
prop_val_yr,
sup_num,
sale_id,
ls_mkt_id,
ls_ag_id,
land_type_cd,
land_seg_desc,
land_seg_sl_lock,
state_cd,
land_seg_homesite,
size_acres,
size_square_feet,
effective_front,
effective_depth,
mkt_unit_price,
land_seg_mkt_val,
mkt_calc_val,
mkt_adj_val,
mkt_flat_val,
ag_loss,
mkt_val_source,		
ag_use_cd,			
ag_unit_price,
ag_apply,				
ag_val,
ag_calc_val,
ag_adj_val,
ag_flat_val,
ag_val_type,
ag_timb_conv_dt,
ag_val_source,
ag_eff_tax_year,
land_seg_comment,	
ag_apply_yr,
land_seg_orig_val,
land_seg_up,			
land_adj_type_cd,	
width_front,
width_back,
depth_right,
depth_left,
eff_size_acres,
land_adj_amt,
land_adj_factor,
land_mass_adj_factor,
effective_tax_year,
land_new_val,
late_ag_apply,	-- T/F
ref_id1,
oa_mkt_val,
oa_ag_val,
eff_size_acres_override,	-- T/F
num_lots,
new_ag,					-- T/F
new_ag_prev_val,
new_ag_prev_val_override,			-- T/F
appraisal_cd,
arb_val,
land_class_code,		
land_influence_code,	
size_useable_acres,
size_useable_square_feet,
dist_val,
timber_78_val,
timber_78_val_pct,
hs_pct,
hs_pct_override,
land_soil_code,   
ag_land_type_cd,  
prev_st_land_type_cd,
flat_value_comment,
flat_value_user_id,
flat_value_dt,
misc_value,
new_construction_flag,
new_construction_value,
new_construction_value_override,
last_import_date,
last_import_user_id,
assessment_yr_qualified,
current_use_effective_acres,
primary_use_cd,
primary_use_override,  
sub_use_cd,
use_type_schedule,
type_schedule,
application_number,
recording_number 
)
select 
land_seg_id,
prop_id,
prop_val_yr,
sup_num,
sale_id,
ls_mkt_id,
ls_ag_id,
land_type_cd,
land_seg_desc,
land_seg_sl_lock,
state_cd,
land_seg_homesite,
size_acres,
size_square_feet,
effective_front,
effective_depth,
mkt_unit_price,
land_seg_mkt_val,
mkt_calc_val,
mkt_adj_val,
mkt_flat_val,
ag_loss,
mkt_val_source,		
ag_use_cd,			
ag_unit_price,
ag_apply,				
ag_val,
ag_calc_val,
ag_adj_val,
ag_flat_val,
ag_val_type,
ag_timb_conv_dt,
ag_val_source,
ag_eff_tax_year,
land_seg_comment,	
ag_apply_yr,
land_seg_orig_val,
land_seg_up,			
land_adj_type_cd,	
width_front,
width_back,
depth_right,
depth_left,
eff_size_acres,
land_adj_amt,
land_adj_factor,
land_mass_adj_factor,
effective_tax_year,
land_new_val,
late_ag_apply,	-- T/F
ref_id1,
oa_mkt_val,
oa_ag_val,
eff_size_acres_override,	-- T/F
num_lots,
new_ag,					-- T/F
new_ag_prev_val,
new_ag_prev_val_override,			-- T/F
appraisal_cd,
arb_val,
land_class_code,		
land_influence_code,	
size_useable_acres,
size_useable_square_feet,
dist_val,
timber_78_val,
timber_78_val_pct,
hs_pct,
hs_pct_override,
land_soil_code,   
ag_land_type_cd,  
prev_st_land_type_cd,
flat_value_comment,
flat_value_user_id,
flat_value_dt,
misc_value,
new_construction_flag,
new_construction_value,
new_construction_value_override,
last_import_date,
last_import_user_id,
assessment_yr_qualified,
current_use_effective_acres,
primary_use_cd,
primary_use_override,  
sub_use_cd,
use_type_schedule,
type_schedule,
application_number,
recording_number
from PACS_SYNC_LAND2


print 'Insert Imps.....'

-- IMPRV
IF OBJECT_ID (N'dbo.PACS_SYNC_IMP', N'U') IS NOT NULL
	drop table PACS_SYNC_IMP


select
p.prop_id as prop_id,
2012 as prop_val_yr,  
--CAST( ROW_NUMBER() OVER( ORDER BY p.prop_id ) AS INT) + (SELECT ISNULL(MAX(imprv_id),999) FROM imprv WITH(NOLOCK)) as imprv_id,
0 as sup_num,
0 as sale_id,
left(p.prop_type_cd,1) as imprv_type_cd,
'N' as imprv_sl_locked,
NULL as primary_imprv,
CASE WHEN LTRIM(RTRIM(pv.property_use_cd)) <> '' THEN left(LTRIM(RTRIM(pv.property_use_cd)),2) ELSE 'CNV' end as imprv_state_cd,   
'T' as imprv_homesite,
'HISTORY HS IMP' as imprv_desc,
pv.imprv_hstd_val as imprv_val,
NULL as misc_cd,
NULL as imp_new_yr,
0 as imp_new_val,
NULL as imp_new_val_override,
0 as original_val,
NULL as base_val,
NULL as calc_val,
0 as adjusted_val,
0 as living_area_up,
NULL as err_flag,
NULL as imprv_image_url,
NULL as imprv_cmnt,
NULL as mbl_hm_make,
NULL as mbl_hm_model,
NULL as mbl_hm_sn,
NULL as mbl_hm_hud_num,
NULL as mbl_hm_title_num,
NULL as imp_new_pc,
pv.imprv_hstd_val as flat_val,
NULL as value_type,
0 as imprv_adj_amt,
0 as imprv_adj_factor,
0 as imprv_mass_adj_factor,
'F' as imprv_val_source,
100 as economic_pct,
100 as physical_pct,
100 as functional_pct,
NULL as economic_cmnt,
NULL as physical_cmnt,
NULL as functional_cmnt,
NULL as  effective_yr_blt,
100 as percent_complete,
NULL as percent_complete_cmnt,
LTRIM(RTRIM(p.ref_id1)) as ref_id1,
0 as num_imprv,
NULL as mbl_hm_sn_2,
NULL as mbl_hm_sn_3,
NULL as mbl_hm_hud_num_2,
NULL as mbl_hm_hud_num_3,
1 as stories,
NULL as arb_val,
100 as dep_pct,
NULL as dep_cmnt,
0 as dist_val,
NULL as hs_pct,
0 as hs_pct_override,
LTRIM(RTRIM(pv.property_use_cd)) as primary_use_cd,
0 as primary_use_override,
NULL as secondary_use_cd,
0 as secondary_use_override,
NULL as actual_year_built,
NULL as building_number,
NULL as building_name,
'History Flat Value' as flat_value_comment,
NULL as flat_value_user_id,
NULL as flat_value_date,
NULL as building_id

into PACS_SYNC_IMP

--select pv.*
from property_val pv
join property p on p.prop_id=pv.prop_id
where pv.prop_val_yr=2013 and pv.imprv_hstd_val > 0
	
union
select
p.prop_id as prop_id,
2012 as prop_val_yr,  
--CAST( ROW_NUMBER() OVER( ORDER BY p.prop_id ) AS INT) + (SELECT ISNULL(MAX(imprv_id),999) FROM imprv WITH(NOLOCK)) as imprv_id,
0 as sup_num,
0 as sale_id,
left(p.prop_type_cd,1) as imprv_type_cd,
'N' as imprv_sl_locked,
NULL as primary_imprv,
CASE WHEN LTRIM(RTRIM(pv.property_use_cd)) <> '' THEN left(LTRIM(RTRIM(pv.property_use_cd)),2) ELSE 'CNV' end as imprv_state_cd,   
'F' as imprv_homesite,
'HISTORY NONHS IMP' as imprv_desc,
pv.imprv_non_hstd_val as imprv_val,
NULL as misc_cd,
NULL as imp_new_yr,
0 as imp_new_val,
NULL as imp_new_val_override,
0 as original_val,
NULL as base_val,
NULL as calc_val,
0 as adjusted_val,
0 as living_area_up,
NULL as err_flag,
NULL as imprv_image_url,
NULL as imprv_cmnt,
NULL as mbl_hm_make,
NULL as mbl_hm_model,
NULL as mbl_hm_sn,
NULL as mbl_hm_hud_num,
NULL as mbl_hm_title_num,
NULL as imp_new_pc,
pv.imprv_non_hstd_val as flat_val,
NULL as value_type,
0 as imprv_adj_amt,
0 as imprv_adj_factor,
0 as imprv_mass_adj_factor,
'F' as imprv_val_source,
100 as economic_pct,
100 as physical_pct,
100 as functional_pct,
NULL as economic_cmnt,
NULL as physical_cmnt,
NULL as functional_cmnt,
NULL as  effective_yr_blt,
100 as percent_complete,
NULL as percent_complete_cmnt,
LTRIM(RTRIM(p.ref_id1)) as ref_id1,
0 as num_imprv,
NULL as mbl_hm_sn_2,
NULL as mbl_hm_sn_3,
NULL as mbl_hm_hud_num_2,
NULL as mbl_hm_hud_num_3,
1 as stories,
NULL as arb_val,
100 as dep_pct,
NULL as dep_cmnt,
0 as dist_val,
NULL as hs_pct,
0 as hs_pct_override,
LTRIM(RTRIM(pv.property_use_cd)) as primary_use_cd,
0 as primary_use_override,
NULL as secondary_use_cd,
0 as secondary_use_override,
NULL as actual_year_built,
NULL as building_number,
NULL as building_name,
'History Flat Value' as flat_value_comment,
NULL as flat_value_user_id,
NULL as flat_value_date,
NULL as building_id

--select pv.*
from property_val pv
join property p on p.prop_id=pv.prop_id
where pv.prop_val_yr=2013 and pv.imprv_non_hstd_val > 0

IF OBJECT_ID (N'dbo.PACS_SYNC_IMP2', N'U') IS NOT NULL
	drop table PACS_SYNC_IMP2

--set imprv_id
select 
cast( row_number() over( order by prop_id ) as int) + (select isnull(max(imprv_id),999) from imprv with(nolock)) as imprv_id,
*
into PACS_SYNC_IMP2
from PACS_SYNC_IMP


-----------codes
insert into imprv_type(imprv_type_cd,imprv_type_desc)
select distinct imprv_type_cd,imprv_type_cd
from PACS_SYNC_IMP 
where imprv_type_cd not in (select imprv_type_cd from imprv_type)

--insert into imprv
insert imprv
(
prop_id,
prop_val_yr,
imprv_id,
sup_num,
sale_id,
imprv_type_cd,
imprv_sl_locked,
primary_imprv,
imprv_state_cd,
imprv_homesite,
imprv_desc,
imprv_val,
misc_cd,
imp_new_yr,
imp_new_val,
imp_new_val_override,
original_val,
base_val,
calc_val,
adjusted_val,
living_area_up,
err_flag,
imprv_image_url,
imprv_cmnt,
mbl_hm_make,
mbl_hm_model,
mbl_hm_sn,
mbl_hm_hud_num,
mbl_hm_title_num,
imp_new_pc,
flat_val,
value_type,
imprv_adj_amt,
imprv_adj_factor,
imprv_mass_adj_factor,
imprv_val_source,
economic_pct,
physical_pct,
functional_pct,
economic_cmnt,
physical_cmnt,
functional_cmnt,
effective_yr_blt,
percent_complete,
percent_complete_cmnt,
ref_id1,
num_imprv,
mbl_hm_sn_2,
mbl_hm_sn_3,
mbl_hm_hud_num_2,
mbl_hm_hud_num_3,
stories,
arb_val,
dep_pct,
dep_cmnt,
dist_val,
hs_pct,
hs_pct_override,
primary_use_cd,
primary_use_override,
secondary_use_cd,
secondary_use_override,
actual_year_built,
building_number,
building_name,
flat_value_comment,
flat_value_user_id,
flat_value_date,
building_id
)
select 
prop_id,
prop_val_yr,
imprv_id,
sup_num,
sale_id,
imprv_type_cd,
imprv_sl_locked,
primary_imprv,
imprv_state_cd,
imprv_homesite,
imprv_desc,
imprv_val,
misc_cd,
imp_new_yr,
imp_new_val,
imp_new_val_override,
original_val,
base_val,
calc_val,
adjusted_val,
living_area_up,
err_flag,
imprv_image_url,
imprv_cmnt,
mbl_hm_make,
mbl_hm_model,
mbl_hm_sn,
mbl_hm_hud_num,
mbl_hm_title_num,
imp_new_pc,
flat_val,
value_type,
imprv_adj_amt,
imprv_adj_factor,
imprv_mass_adj_factor,
imprv_val_source,
economic_pct,
physical_pct,
functional_pct,
economic_cmnt,
physical_cmnt,
functional_cmnt,
effective_yr_blt,
percent_complete,
percent_complete_cmnt,
ref_id1,
num_imprv,
mbl_hm_sn_2,
mbl_hm_sn_3,
mbl_hm_hud_num_2,
mbl_hm_hud_num_3,
stories,
arb_val,
dep_pct,
dep_cmnt,
dist_val,
hs_pct,
hs_pct_override,
primary_use_cd,
primary_use_override,
secondary_use_cd,
secondary_use_override,
actual_year_built,
building_number,
building_name,
flat_value_comment,
flat_value_user_id,
flat_value_date,
building_id
from PACS_SYNC_IMP2



print 'Insert PP segs ...'

alter table pers_prop_sub_seg disable trigger all
alter table pers_prop_seg disable trigger all

delete from pers_prop_sub_seg where prop_val_yr=2012
delete from pers_prop_seg where prop_val_yr=2012

drop table PACS_2013_SEGS
select * into PACS_2013_SEGS from pers_prop_seg where prop_val_yr=2013
update PACS_2013_SEGS set prop_val_yr=2012

--insert new 2012 records
insert into pers_prop_seg
(
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	sale_id,
	pp_sched_cd,
	pp_table_meth_cd,
	pp_type_cd,
	pp_class_cd,
	pp_density_cd,
	pp_adj_cd,
	pp_area,
	pp_unit_count,
	pp_yr_aquired,
	pp_dep_method,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_rendered_val,
	pp_prior_yr_val,
	pp_last_notice_val,
	pp_method_val,
	pp_appraised_val,
	pp_appraise_meth,
	pp_new_val,
	pp_new_val_yr,
	pp_mkt_val,
	pp_comment,
	pp_unit_price,
	pp_qual_cd,
	pp_description,
	pp_sic_cd,
	pp_mkt_val_cd,
	pp_state_cd,
	pp_deprec_type_cd,
	pp_deprec_deprec_cd,
	pp_deprec_override,
	pp_deprec_pct,
	pp_active_flag,
	pp_make,
	pp_model,
	pp_vin,
	pp_matching_status,
	pp_matching_dt,
	pp_year,
	pp_license,
	pp_condition_cd,
	arb_val,
	pp_special_val,
	pp_subseg_val,
	sp_method,
	sp_per_unit_val,
	sp_per_area_val,
	sp_units_area_number,
	dist_val,
	pp_new_val_override,
	pp_new_val_yr_override,
	pp_new_segment,
	farm_asset,
	locked_val
)
select
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	sale_id,
	pp_sched_cd,
	pp_table_meth_cd,
	pp_type_cd,
	pp_class_cd,
	pp_density_cd,
	pp_adj_cd,
	pp_area,
	pp_unit_count,
	pp_yr_aquired,
	pp_dep_method,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_rendered_val,
	pp_prior_yr_val,
	pp_last_notice_val,
	pp_method_val,
	pp_appraised_val,
	pp_appraise_meth,
	pp_new_val,
	pp_new_val_yr,
	pp_mkt_val,
	pp_comment,
	pp_unit_price,
	pp_qual_cd,
	pp_description,
	pp_sic_cd,
	pp_mkt_val_cd,
	pp_state_cd,
	pp_deprec_type_cd,
	pp_deprec_deprec_cd,
	pp_deprec_override,
	pp_deprec_pct,
	pp_active_flag,
	pp_make,
	pp_model,
	pp_vin,
	pp_matching_status,
	pp_matching_dt,
	pp_year,
	pp_license,
	pp_condition_cd,
	arb_val,
	pp_special_val,
	pp_subseg_val,
	sp_method,
	sp_per_unit_val,
	sp_per_area_val,
	sp_units_area_number,
	dist_val,
	pp_new_val_override,
	pp_new_val_yr_override,
	pp_new_segment,
	farm_asset,
	locked_val
from PACS_2013_SEGS
 
drop table PACS_2013_SUBSEGS
select * into PACS_2013_SUBSEGS from pers_prop_sub_seg where prop_val_yr=2013
update PACS_2013_SUBSEGS set prop_val_yr=2012,calc_method_flag='F'

--insert new records
insert into pers_prop_sub_seg
(
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	pp_sub_seg_id,
	descrip,
	pp_orig_cost,
	pp_yr_aquired,
	pp_new_used,
	pp_type_cd,
	pp_dep_pct,
	pp_pct_good,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_rendered_val,
	pp_mkt_val,
	calc_method_flag,
	pp_sic_cd,
	pp_sic_desc,
	pp_dep_type_cd,
	pp_dep_deprec_cd,
	pp_veh_year,
	pp_veh_make,
	pp_veh_model,
	pp_veh_vin,
	pp_veh_license,
	asset_id
)
select
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	pp_sub_seg_id,
	descrip,
	pp_orig_cost,
	pp_yr_aquired,
	pp_new_used,
	pp_type_cd,
	pp_dep_pct,
	pp_pct_good,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_rendered_val,
	pp_mkt_val,
	calc_method_flag,
	pp_sic_cd,
	pp_sic_desc,
	pp_dep_type_cd,
	pp_dep_deprec_cd,
	pp_veh_year,
	pp_veh_make,
	pp_veh_model,
	pp_veh_vin,
	pp_veh_license,
	asset_id
from PACS_2013_SUBSEGS


alter table pers_prop_sub_seg enable trigger all
alter table pers_prop_seg enable trigger all



/*legals if needed

alter table property_val disable trigger all

update pv set legal_desc_2=null
--select legal_desc,legal_desc_2 
from property_val pv
where prop_val_yr=2013
and legal_desc=legal_desc_2

select top 100 pv.legal_desc,pv2.legal_desc,pv.legal_desc_2,pv2.legal_desc_2
from property_val pv
join property_val pv2 on pv2.prop_val_yr=2012 and pv2.prop_id=pv.prop_id
where pv.prop_val_yr=2013
and pv.legal_desc<>isnull(pv2.legal_desc,'')

alter table property_val enable trigger all
*/

--exemptions
drop table PACS_SYNC_EXEMPTIONS
select pe.* into PACS_SYNC_EXEMPTIONS
from property_exemption pe
left join property_exemption pe2 on pe2.owner_tax_yr=2012 and pe2.prop_id=pe.prop_id 
	and pe2.owner_id=pe.owner_id
	and pe2.exmpt_type_cd=pe.exmpt_type_cd
where pe.owner_tax_yr=2013
and pe2.prop_id is null

update PACS_SYNC_EXEMPTIONS set owner_tax_yr=2012,exmpt_tax_yr=2012

alter table property_exemption disable trigger all

insert property_exemption
select * from PACS_SYNC_EXEMPTIONS

alter table property_exemption enable trigger all


--nextids
--exec updatenextids


print 'Done...'

 
--Enable Triggers
alter table imprv_det_adj enable trigger all 
alter table imprv_detail  enable trigger all
alter table imprv_adj  enable trigger all
alter table imprv_attr  enable trigger all
alter table imprv  enable trigger all
alter table land_adj  enable trigger all
alter table land_detail  enable trigger all




set ANSI_NULLS ON

GO

