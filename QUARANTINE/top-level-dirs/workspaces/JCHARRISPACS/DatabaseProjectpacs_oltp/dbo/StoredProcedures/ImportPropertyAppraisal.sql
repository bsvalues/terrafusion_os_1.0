






CREATE PROCEDURE ImportPropertyAppraisal
@input_prop_id	int,
@input_tax_year	numeric(4)

as

declare @state_code_method	varchar(10)
declare @temp_state_cd		varchar(10)
declare @temp_imprv_state_cd 	varchar(10)
declare @temp_land_state_cd 	varchar(10)
declare @temp_pp_state_cd	varchar(10)
declare @temp_imprv_val 	numeric(14,0)
declare @temp_land_val		numeric(14,0)
declare @temp_pp_val		numeric(14,0)
declare @temp_yr_built		numeric(4)
declare @temp_imprv_det_area	numeric(18,1)
declare @temp_imprv_unit_price	numeric(14,2)
declare @temp_imprv_class_cd	varchar(10)
declare @temp_land_acres	numeric(18,4)
declare @temp_land_sqft		numeric(18,2)
declare @temp_land_ff		numeric(18,2)
declare @temp_land_depth	numeric(18,2)
declare @temp_land_unit_price	numeric(14,2)
declare @temp_land_type_cd	varchar(10)
declare @temp_school_id		int
declare @temp_city_id		int
declare @temp_prop_id		int
declare @input_sup_yr   numeric(4)

-- If Record does not exists, create it

select @temp_prop_id = prop_id
from property_appraisal
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

if ( @temp_prop_id is null )
begin
  insert into property_appraisal (
  prop_id,
  prop_val_yr,
  sup_num)
  values (
  @input_prop_id,
  @input_tax_year,
  0)
end

-- If record exists, then set it to null

update property_appraisal set
	update_dt 		= getdate(),
	school_id		= null,
	city_id 		= null,
	state_cd		= null,
	class_cd		= null,
	land_type_cd		= null,
	yr_blt			= null,
	living_area		= null,
	imprv_unit_price	= null,
	land_sqft		= null,
	land_acres		= null,
	land_front_feet		= null,
	land_depth		= null,
	land_unit_price		= null
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year


--Set the state code retrieval method: INDIV or SUM
select @state_code_method = 'SUM'

--Initialize variables
select @temp_imprv_val 		= 0
select @temp_land_val  		= 0
select @temp_pp_val		= 0
select @temp_land_acres 	= 0
select @temp_land_sqft 		= 0
select @temp_land_unit_price 	= 0


--Here are all the fields in the property_appraisal table
/*
	[prop_id] [int] NOT NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[sup_num] [numeric](14, 0) NOT NULL ,
	[update_dt] [datetime] NULL ,
	[school_id] [int] NULL ,
	[city_id] [int] NULL ,
	[state_cd] [char] (5) NULL ,
	[class_cd] [char] (10) NULL ,
	[land_type_cd] [char] (10) NULL ,
	[yr_blt] [numeric](4, 0) NULL ,
	[living_area] [numeric](14, 0) NULL ,
	[imprv_unit_price] [numeric](14, 2) NULL ,
	[land_sqft] [numeric](18, 2) NULL ,
	[land_acres] [numeric](18, 4) NULL ,
	[land_front_feet] [numeric](18, 2) NULL ,
	[land_depth] [numeric](18, 2) NULL ,
	[land_unit_price] [numeric](14, 2) NULL 
*/

--Here we are going to push the School entity ID into the sales record ONLY IF IT IS NULL

select top 1 @temp_school_id = entity.entity_id
from entity_prop_assoc, entity,  property_val
where property_val.prop_id = @input_prop_id
and property_val.prop_val_yr = @input_tax_year  
and entity_prop_assoc.sup_num = 0
and entity_prop_assoc.entity_id = entity.entity_id
and property_val.prop_id = entity_prop_assoc.prop_id
and property_val.sup_num = entity_prop_assoc.sup_num
and property_val.prop_val_yr = entity_prop_assoc.tax_yr
and entity.entity_type_cd = 'S'
order by property_val.appraised_val desc

update property_appraisal set school_id = @temp_school_id
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

select top 1 @temp_city_id = entity.entity_id
from entity_prop_assoc, entity,  property_val
where property_val.prop_id = @input_prop_id
and property_val.prop_val_yr = @input_tax_year  
and entity_prop_assoc.sup_num = 0
and entity_prop_assoc.entity_id = entity.entity_id
and property_val.prop_id = entity_prop_assoc.prop_id
and property_val.sup_num = entity_prop_assoc.sup_num
and property_val.prop_val_yr = entity_prop_assoc.tax_yr
and entity.entity_type_cd = 'C'
order by property_val.appraised_val desc

update property_appraisal set city_id = @temp_city_id
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Here we are going to get the predominant state code on the property (land_detail, imprv, pers_prop_seg)
--If the property is Personal, then check the pers_prop_segs...

--This will find the state code with the highest cumulative value pers_prop_seg on a property...
select top 1 @temp_pp_state_cd = pp_state_cd,
	     @temp_pp_val      = pp_mkt_val
from pers_prop_seg
where pers_prop_seg.prop_id 		= @input_prop_id
and   pers_prop_seg.prop_val_yr 	= @input_tax_year
and   pers_prop_seg.sup_num 		= 0
and   pers_prop_seg.sale_id		= 0
and   pers_prop_seg.pp_active_flag 	= 'T'
and   pers_prop_seg.pp_state_cd is not null
group by pp_state_cd, pp_mkt_val
order by sum(pp_mkt_val) desc
	

--This will find the state code with the highest cumulative value improvements on a property...
select top 1 @temp_imprv_state_cd = imprv_state_cd,
	     @temp_imprv_val 	  = imprv_val
from imprv
where imprv.prop_id 		= @input_prop_id
and   imprv.prop_val_yr 	= @input_tax_year
and   imprv.sup_num 		= 0
and   imprv.sale_id		= 0
and   imprv.imprv_state_cd is not null
group by imprv_state_cd, imprv_val
order by sum(imprv_val) desc	
	
--This will find the state code with the highest cumulative value land on a property...
select top 1 @temp_land_state_cd  = state_cd,
	     @temp_land_val 	  = land_seg_mkt_val
from  land_detail
where land_detail.prop_id 		= @input_prop_id
and   land_detail.prop_val_yr 		= @input_tax_year
and   land_detail.sup_num 		= 0
and   land_detail.sale_id		= 0
and   land_detail.state_cd is not null
group by state_cd, land_seg_mkt_val
order by sum(land_seg_mkt_val) desc	

if (@temp_imprv_val >= @temp_land_val) and
   (@temp_imprv_val >= @temp_pp_val)
begin
	select @temp_state_cd = @temp_imprv_state_cd
end
else if ((@temp_land_val >= @temp_imprv_val) and
         (@temp_land_val >= @temp_pp_val))
begin
	select @temp_state_cd = @temp_land_state_cd
end
else if ((@temp_pp_val >= @temp_land_val) and
         (@temp_pp_val >= @temp_imprv_val))
begin
	select @temp_state_cd = @temp_pp_state_cd
end

--Update the state_cd field with the dominant state code on the property ONLY IF IT IS NULL...
update property_appraisal set state_cd = @temp_state_cd
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Set the actual year built (first MA segment)
select top 1 @temp_yr_built = yr_built 
from imprv_detail, imprv_det_type
where imprv_detail.prop_id 		= @input_prop_id
and   imprv_detail.prop_val_yr 		= @input_tax_year
and   imprv_detail.sup_num 		= 0
and   imprv_detail.sale_id 		= 0
and   imprv_detail.yr_built 		is not null
and   imprv_detail.yr_built 		> 0
and   imprv_detail.imprv_det_type_cd 	is not null
and   imprv_detail.imprv_det_type_cd 	= imprv_det_type.imprv_det_type_cd
and   imprv_det_type.main_area 		= 'T'
order by imprv_detail.imprv_det_val desc

--Now update the yr_blt field ONLY IF IT IS NULL
update property_appraisal set yr_blt = @temp_yr_built
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year


--Set the total MA area for all the MA details on a property
select top 1 @temp_imprv_det_area = sum(imprv_det_area)
from imprv_detail, imprv_det_type
where imprv_detail.prop_id 		= @input_prop_id
and   imprv_detail.prop_val_yr 		= @input_tax_year
and   imprv_detail.sup_num 		= 0
and   imprv_detail.sale_id 		= 0
and   imprv_detail.imprv_det_type_cd 	is not null
and   imprv_detail.imprv_det_type_cd 	= imprv_det_type.imprv_det_type_cd
and   imprv_det_type.main_area 		= 'T'
and   imprv_detail.imprv_det_area 	is not null

--Now update the living_area with the total area of all MA details on a property ONLY IF IT IS NULL
update property_appraisal set living_area = @temp_imprv_det_area
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year


--Set the base price per square foot, which is the first imprv.living_area_up found on the property
select top 1 @temp_imprv_unit_price  = sum(unit_price)
from imprv_detail, imprv_det_type
where imprv_detail.prop_id 		= @input_prop_id
and   imprv_detail.prop_val_yr 		= @input_tax_year
and   imprv_detail.sup_num 		= 0
and   imprv_detail.sale_id 		= 0
and   imprv_detail.imprv_det_type_cd 	is not null
and   imprv_detail.imprv_det_type_cd 	= imprv_det_type.imprv_det_type_cd
and   imprv_det_type.main_area 		= 'T'
and   imprv_detail.imprv_det_area 	is not null

--Now update the imprv_unit_price ONLY IF IT IS NULL
update property_appraisal set imprv_unit_price = @temp_imprv_unit_price
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--This will find the class code with the highest cumulative value improvement details on a property...
select top 1 @temp_imprv_class_cd = imprv_det_class_cd
from imprv_detail
where imprv_detail.prop_id 		      = @input_prop_id
and   imprv_detail.prop_val_yr 		      = @input_tax_year
and   imprv_detail.sup_num 		      = 0
and   imprv_detail.sale_id		      = 0
and   imprv_detail.imprv_det_class_cd 	      is not null
group by imprv_det_class_cd, imprv_det_val
order by sum(imprv_det_val) desc, sum(imprv_det_area) desc


--Update the class_cd field with the dominant state code on the property ONLY IF IT IS NULL...
update property_appraisal set class_cd = @temp_imprv_class_cd
where  prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Set the sum of land_acres if method is acres...
select @temp_land_acres = sum(land_detail.size_acres)
from land_detail,  land_sched
where land_detail.prop_id 	= @input_prop_id 
and land_detail.prop_val_yr 	= @input_tax_year
and land_detail.sup_num 	= 0
and land_detail.ls_mkt_id 	= land_sched.ls_id
and land_detail.prop_val_yr 	= land_sched.ls_year
and land_detail.sale_id		= 0
and land_sched.ls_method 	= 'A'
and land_detail.size_acres is not null

--Update the land_acres with @temp_land_acres ONLY IF IT IS NULL
update property_appraisal set land_acres = @temp_land_acres
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Set the sum of land_sqft if method is square feet...
select @temp_land_sqft = sum(land_detail.size_square_feet)
from land_detail, land_sched
where land_detail.prop_id 	= @input_prop_id 
and land_detail.prop_val_yr 	= @input_tax_year
and land_detail.sup_num 	= 0
and land_detail.ls_mkt_id 	= land_sched.ls_id
and land_detail.prop_val_yr 	= land_sched.ls_year
and land_detail.sale_id		= 0
and land_sched.ls_method 	= 'SQ'
and land_detail.size_square_feet is not null


--Update the land_sqft with @temp_land_sqft ONLY IF IT IS NULL
update property_appraisal set land_sqft = @temp_land_sqft
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Set the sum of land_detail.effective_front if method is front foot...
select @temp_land_ff = sum(land_detail.effective_front)
from land_detail, land_sched
where land_detail.prop_id 	= @input_prop_id 
and land_detail.prop_val_yr 	= @input_tax_year
and land_detail.sup_num 	= 0
and land_detail.ls_mkt_id 	= land_sched.ls_id
and land_detail.prop_val_yr 	= land_sched.ls_year
and land_detail.sale_id		= 0
and land_sched.ls_method 	= 'FF'
and land_detail.effective_front is not null


--Update the land_front_feet with @temp_land_ff ONLY IF IT IS NULL
update property_appraisal set land_front_feet = @temp_land_ff
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Set the average of the land_detail.effective_depth
select @temp_land_depth = avg(land_detail.effective_depth)
from land_detail, land_sched
where land_detail.prop_id 	= @input_prop_id 
and land_detail.prop_val_yr 	= @input_tax_year
and land_detail.sup_num 	= 0
and land_detail.ls_mkt_id 	= land_sched.ls_id
and land_detail.prop_val_yr 	= land_sched.ls_year
and land_detail.sale_id		= 0
and land_sched.ls_method 	= 'FF'
and land_detail.effective_depth is not null


--Update the land_depth with @temp_land_depth ONLY IF IT IS NULL
update property_appraisal set land_depth = @temp_land_depth
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--Get the average price per unit for a property (land_detail.mkt_unit_price)
select @temp_land_unit_price 	= avg(land_detail.mkt_unit_price)
from land_detail
where land_detail.prop_id 	= @input_prop_id 
and land_detail.prop_val_yr 	= @input_tax_year
and land_detail.sup_num 	= 0
and land_detail.sale_id		= 0
and land_detail.mkt_unit_price is not null

--Update the land_unit_price with @temp_land_unit_price ONLY IF IT IS NULL
update property_appraisal set land_unit_price = @temp_land_unit_price
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

--land_type_cd
--@temp_land_type_cd
--land.land_type_cd
--Set the dominant type code for the land details on the property

	--This will find the type code for the highest valued land details on a property...
select top 1 @temp_land_type_cd = land_type_cd
from land_detail
where land_detail.prop_id 		= @input_prop_id 
and   land_detail.prop_val_yr 		= @input_tax_year
and   land_detail.sup_num 		= 0
and   land_detail.sale_id		= 0
and   land_detail.land_type_cd is not null
order by land_seg_mkt_val desc

--Update the land_type_cd field with the dominant type code on the property ONLY IF IT IS NULL...
update property_appraisal set land_type_cd = @temp_land_type_cd
where prop_id = @input_prop_id
and prop_val_yr = @input_tax_year

GO

