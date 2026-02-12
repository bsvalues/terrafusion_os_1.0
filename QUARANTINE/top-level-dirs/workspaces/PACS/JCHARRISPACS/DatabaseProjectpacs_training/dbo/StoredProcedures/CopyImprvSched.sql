
CREATE procedure CopyImprvSched 

@from_method_cd		varchar(10),
@from_class_cd		varchar(10),
@from_type_cd		varchar(10),
@from_yr		numeric(4),
@from_sub_class_cd  varchar(10),
@to_method_cd		varchar(10),
@to_class_cd		varchar(10),
@to_type_cd		varchar(10),
@to_yr			numeric(4),
@to_sub_class_cd varchar(10)

as

insert into imprv_sched
(
imprv_det_meth_cd, 
imprv_det_type_cd,
imprv_det_class_cd,
imprv_yr,
imprv_pc_of_base, 
imprv_interpolate, 
imprv_use_mult, 
imprv_sched_area_type_cd, 
imprv_sched_mult_type, 
imprv_sched_mult_form,
imprv_sched_mult_quality_cd, 
imprv_sched_mult_section_cd, 
imprv_sched_mult_local_quality_cd,
imprv_sched_deprec_cd,
imprv_sched_slope_intercept,
imprv_sched_value_type,
imprv_det_sub_class_cd
)
select  
@to_method_cd, 
@to_type_cd,
@to_class_cd,
@to_yr,
imprv_pc_of_base, 
imprv_interpolate, 
imprv_use_mult, 
imprv_sched_area_type_cd, 
imprv_sched_mult_type, 
imprv_sched_mult_form,
imprv_sched_mult_quality_cd, 
imprv_sched_mult_section_cd, 
imprv_sched_mult_local_quality_cd,
imprv_sched_deprec_cd,
imprv_sched_slope_intercept,
imprv_sched_value_type,
@to_sub_class_cd
from  imprv_sched
with (nolock)
where imprv_det_meth_cd  = @from_method_cd
and   imprv_det_class_cd = @from_class_cd
and   imprv_det_type_cd  = @from_type_cd
and   imprv_yr		 = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd

insert into imprv_sched_detail
(
imprv_det_meth_cd, 
imprv_det_type_cd,
imprv_det_class_cd, 
imprv_yr, 
range_max,            
range_price,      
range_pc, 
range_adj_price,  
range_interpolate_inc,
imprv_det_sub_class_cd
)
select 
@to_method_cd, 
@to_type_cd, 
@to_class_cd, 
@to_yr, 
range_max,            
range_price,      
range_pc, 
range_adj_price,  
range_interpolate_inc,
@to_sub_class_cd
from  imprv_sched_detail
with (nolock)
where imprv_det_meth_cd  = @from_method_cd
and   imprv_det_class_cd = @from_class_cd
and   imprv_det_type_cd  = @from_type_cd
and   imprv_yr		 = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd

insert into imprv_sched_attr
(
imprv_det_meth_cd, 
imprv_det_type_cd, 
imprv_det_class_cd, 
imprv_yr, 
imprv_attr_id,
use_up_for_pct_base,
imprv_det_sub_class_cd
)
select 
@to_method_cd, 
@to_type_cd, 
@to_class_cd, 
@to_yr, 
imprv_attr_id,
use_up_for_pct_base,
@to_sub_class_cd
from  imprv_sched_attr
with (nolock)
where imprv_det_meth_cd  = @from_method_cd
and   imprv_det_class_cd = @from_class_cd
and   imprv_det_type_cd  = @from_type_cd
and   imprv_yr		 = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd

insert into imprv_attr_val
(
imprv_attr_id, 
imprv_attr_val_cd, 
imprv_det_meth_cd, 
imprv_det_type_cd, 
imprv_det_class_cd, 
imprv_yr,                                                          
imprv_attr_base_up, 
imprv_attr_up,    
imprv_attr_base_incr, 
imprv_attr_incr,  
imprv_attr_pct,
imprv_attr_adj_factor,
imprv_attr_unit_cost,
imprv_det_sub_class_cd
)
select 
imprv_attr_id, 
imprv_attr_val_cd,                                                           
@to_method_cd, 
@to_type_cd, 
@to_class_cd, 
@to_yr, 
imprv_attr_base_up, 
imprv_attr_up,    
imprv_attr_base_incr, 
imprv_attr_incr,  
imprv_attr_pct,
imprv_attr_adj_factor,
imprv_attr_unit_cost,
@to_sub_class_cd
from imprv_attr_val
with (nolock)
where imprv_det_meth_cd  = @from_method_cd
and   imprv_det_class_cd = @from_class_cd
and   imprv_det_type_cd  = @from_type_cd
and   imprv_yr		 = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd


insert into imprv_sched_matrix_assoc
(
imprv_det_meth_cd, 
imprv_det_type_cd, 
imprv_det_class_cd, 
imprv_yr,
matrix_id,
matrix_order,
adj_factor,
imprv_det_sub_class_cd
)
select
@to_method_cd, 
@to_type_cd, 
@to_class_cd, 
@to_yr,
matrix_id,
matrix_order,
adj_factor,
@to_sub_class_cd
from imprv_sched_matrix_assoc
with (nolock)
where imprv_det_meth_cd  = @from_method_cd
and   imprv_det_class_cd = @from_class_cd
and   imprv_det_type_cd  = @from_type_cd
and   imprv_yr		 = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd

insert into imprv_sched_detail_comp
(
imprv_det_meth_cd,
imprv_seg_type_cd,
imprv_seg_quality_cd,
imprv_yr,
sqft_max,
system_adj_factor,
user_adj_factor,
use_system_flag,
midpoint_flag,
szMethod,
imprv_det_sub_class_cd
)
select
@to_method_cd,
@to_type_cd,
@to_class_cd,
@to_yr,
sqft_max,
system_adj_factor,
user_adj_factor,
use_system_flag,
midpoint_flag,
szMethod,
@to_sub_class_cd
from imprv_sched_detail_comp
with (nolock)
where imprv_det_meth_cd = @from_method_cd
and   imprv_seg_type_cd = @from_type_cd
and   imprv_seg_quality_cd = @from_class_cd
and   imprv_yr = @from_yr
and   imprv_det_sub_class_cd = @from_sub_class_cd

GO

