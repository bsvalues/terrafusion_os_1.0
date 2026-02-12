
create procedure ImportSalesInformation
@input_sale_id	int,
@input_as_of_sale char(1) = 'F',
@input_import_land_imprv char(1) = 'F'

as

set nocount on

exec SetMachineLogChanges 0

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
declare @temp_imprv_type_cd varchar(5)
declare @temp_imprv_sub_class_cd varchar(10)
declare @temp_land_acres	numeric(18,4)
declare @temp_land_sqft		numeric(18,2)
declare @temp_land_ff		numeric(18,2)
declare @temp_land_depth	numeric(18,2)
declare @temp_land_unit_price	numeric(14,2)
declare @temp_land_type_cd	varchar(10)
declare @temp_school_id		int
declare @temp_city_id		int
declare @primary_use_cd varchar(10)
declare @secondary_use_cd varchar(10)
declare @appr_yr		numeric(4)

select @appr_yr = appr_yr
from   pacs_system

if (@input_import_land_imprv = 'T')
begin
	delete imprv_detail_cms_addition
	from imprv_detail_cms_addition
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							imprv_detail_cms_addition.sale_id = coopa.chg_of_owner_id and
							imprv_detail_cms_addition.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete imprv_detail_cms_component
	from imprv_detail_cms_component
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							imprv_detail_cms_component.sale_id = coopa.chg_of_owner_id and
							imprv_detail_cms_component.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete imprv_detail_cms_occupancy
	from imprv_detail_cms_occupancy
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							imprv_detail_cms_occupancy.sale_id = coopa.chg_of_owner_id and
							imprv_detail_cms_occupancy.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete imprv_detail_cms_section
	from imprv_detail_cms_section
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							imprv_detail_cms_section.sale_id = coopa.chg_of_owner_id and
							imprv_detail_cms_section.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete imprv_detail_cms_estimate
	from imprv_detail_cms_estimate
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							imprv_detail_cms_estimate.sale_id = coopa.chg_of_owner_id and
							imprv_detail_cms_estimate.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete imprv_attr
	from imprv_attr
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv_attr.sale_id = coopa.chg_of_owner_id and
	            imprv_attr.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete imprv_det_adj
	from imprv_det_adj
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv_det_adj.sale_id = coopa.chg_of_owner_id and
	            imprv_det_adj.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete imprv_detail
	from imprv_detail
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv_detail.sale_id = coopa.chg_of_owner_id and
	            imprv_detail.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete imprv_adj
	from imprv_adj
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv_adj.sale_id = coopa.chg_of_owner_id and
	            imprv_adj.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete imprv_sketch_note
	from imprv_sketch_note
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv_sketch_note.sale_id = coopa.chg_of_owner_id and
	            imprv_sketch_note.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete pacs_image
	from imprv with(nolock)
	join chg_of_owner_prop_assoc as coopa with(nolock) on
							imprv.sale_id = coopa.chg_of_owner_id and
							imprv.prop_id = coopa.prop_id
	inner join pacs_image with(nolock) on
							imprv.imprv_id = pacs_image.ref_id1 and
							imprv.prop_val_yr = pacs_image.ref_year and
							imprv.sup_num = pacs_image.ref_id2 and
							imprv.sale_id = pacs_image.ref_id3 and
							imprv.prop_id = pacs_image.ref_id and
							pacs_image.ref_type = 'SKTCH'
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete imprv_sketch
	from imprv with(nolock)
	join chg_of_owner_prop_assoc as coopa with(nolock) on
							imprv.sale_id = coopa.chg_of_owner_id and
							imprv.prop_id = coopa.prop_id
	inner join imprv_sketch with(nolock) on
							imprv.prop_val_yr = imprv_sketch.prop_val_yr and
							imprv.sup_num = imprv_sketch.sup_num and
							imprv.imprv_id = imprv_sketch.imprv_id and
							imprv.sale_id = imprv_sketch.sale_id and
							imprv.prop_id = imprv_sketch.prop_id	
	where
	            coopa.chg_of_owner_id = @input_sale_id
	            		
	delete imprv
	from imprv
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            imprv.sale_id = coopa.chg_of_owner_id and
	            imprv.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete land_adj
	from land_adj
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            land_adj.sale_id = coopa.chg_of_owner_id and
	            land_adj.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id

	delete land_detail_characteristic
	from land_detail_characteristic
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							land_detail_characteristic.sale_id = coopa.chg_of_owner_id and
							land_detail_characteristic.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id
							
	delete land_detail
	from land_detail
	join chg_of_owner_prop_assoc as coopa with(nolock) on
	            land_detail.sale_id = coopa.chg_of_owner_id and
	            land_detail.prop_id = coopa.prop_id
	where
	            coopa.chg_of_owner_id = @input_sale_id
	 
	delete property_land_misc_code
	from property_land_misc_code
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							property_land_misc_code.sale_id = coopa.chg_of_owner_id and
							property_land_misc_code.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id



		
	declare @prop_id	int
	declare @sup_num	int
	declare @sup_tax_yr	numeric(4)

	if (@input_as_of_sale = 'T')
	begin
		DECLARE property CURSOR FAST_FORWARD
		FOR select coopa.prop_id,
							 psa.sup_num,
							 coopa.sup_tax_yr
					from chg_of_owner_prop_assoc as coopa
					with (nolock)
					join prop_supp_assoc as psa
					with (nolock)
					on coopa.sup_tax_yr = psa.owner_tax_yr
					and coopa.prop_id = psa.prop_id
					where coopa.chg_of_owner_id = @input_sale_id
	end
	else
	begin
		DECLARE property CURSOR FAST_FORWARD
		FOR	select pv.prop_id, pv.sup_num , @appr_yr as sup_tax_yr
				from chg_of_owner_prop_assoc as coopa with (nolock)
				join prop_supp_assoc as psa with (nolock)
				on psa.owner_tax_yr = @appr_yr
				and psa.prop_id = coopa.prop_id
				join property_val as pv with (nolock)
				on pv.prop_val_yr = psa.owner_tax_yr
				and pv.sup_num = psa.sup_num
				and pv.prop_id = psa.prop_id
				where coopa.chg_of_owner_id = @input_sale_id
	end
		

	open property
	fetch next from property into @prop_id, @sup_num, @sup_tax_yr
		
	while (@@FETCH_STATUS = 0)
	begin

		exec CopyLand @prop_id, @sup_num, @sup_tax_yr, 0,
					@prop_id, @sup_num, @sup_tax_yr, @input_sale_id
		
		exec CopyImprovement @prop_id, @sup_num, @sup_tax_yr, 0,
   				 @prop_id, @sup_num, @sup_tax_yr, @input_sale_id


			update chg_of_owner_prop_assoc
			set sup_tax_yr = @sup_tax_yr
			where prop_id = @prop_id
			and   chg_of_owner_id = @input_sale_id 

			fetch next from property into @prop_id, @sup_num, @sup_tax_yr
	end
		
	close 	   property
	deallocate property

end



--Set the state code retrieval method: INDIV or SUM
set @state_code_method = 'SUM'

--Initialize variables
set @temp_imprv_val 		= 0
set @temp_land_val  		= 0
set @temp_pp_val		= 0
set @temp_land_acres 	= 0
set @temp_land_sqft 		= 0
set @temp_land_unit_price 	= 0


--Here are all the fields in the Sales table: (Astericks '**' denote a field that is being updated...)
/*
[chg_of_owner_id] [int] NOT NULL ,
[sl_ratio] [numeric](5, 2) NULL ,
[sl_financing_cd] [char] (5) NULL ,
[sl_ratio_type_cd] [char] (5) NULL ,
[sl_adj_cd] [char] (5) NULL ,
[sl_type_cd] [char] (5) NULL ,
** [sl_state_cd] [char] (5) NULL ,
** [sl_class_cd] [char] (10) NULL ,
** [sl_land_type_cd] [char] (10) NULL ,
[sl_price] [numeric](14, 0) NULL ,
[sl_dt] [datetime] NULL ,
[adjusted_sl_price] [numeric](14, 0) NULL ,
[realtor] [varchar] (30) NULL ,
[finance_comment] [varchar] (50) NULL ,
[amt_down] [numeric](18, 0) NULL ,
[interest_rate] [numeric](14, 3) NULL ,
[finance_yrs] [numeric](4, 1) NULL ,
[suppress_on_ratio_rpt_cd] [char] (5) NULL ,
[suppress_on_ratio_rsn] [varchar] (30) NULL ,
[sl_adj_sl_pct] [numeric](8, 4) NULL ,
[sl_adj_sl_amt] [numeric](14, 0) NULL ,
[sl_adj_rsn] [varchar] (50) NULL ,
[sl_comment] [varchar] (500) NULL ,
** [sl_yr_blt] [numeric](4, 0) NULL ,
** [sl_living_area] [numeric](14, 0) NULL ,
** [sl_imprv_unit_price] [numeric](14, 2) NULL ,
** [sl_land_sqft] [numeric](18, 2) NULL ,
** [sl_land_acres] [numeric](18, 4) NULL ,
** [sl_land_front_feet] [numeric](18, 2) NULL ,
** [sl_land_depth] [numeric](18, 2) NULL ,
** [sl_land_unit_price] [numeric](14, 2) NULL ,
** [sl_school_id] [int] NULL ,
** [sl_city_id] [int] NULL ,
[sl_qualifier] [varchar] (10) NULL
*/

--Here we are going to push the School entity ID into the sales record ONLY IF IT IS NULL

/* indicates to get the most current appraisal year information */
if (@input_as_of_sale = 'F')
begin
	
	select top 1 @temp_school_id = entity.entity_id
	from chg_of_owner_prop_assoc, entity_prop_assoc, entity,  property_val
	where chg_of_owner_prop_assoc.prop_id 	= property_val.prop_id
	and chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id  
	and entity_prop_assoc.sup_num = 0
	and entity_prop_assoc.tax_yr = @appr_yr
	and entity_prop_assoc.entity_id 	= entity.entity_id
	and property_val.prop_id = entity_prop_assoc.prop_id
	and property_val.sup_num = entity_prop_assoc.sup_num
	and property_val.prop_val_yr = entity_prop_assoc.tax_yr
	and entity.entity_type_cd 		= 'S'
	order by property_val.appraised_val desc
	
	select top 1 @temp_city_id = entity.entity_id
	from chg_of_owner_prop_assoc, entity_prop_assoc, entity,  property_val
	where chg_of_owner_prop_assoc.prop_id 	= property_val.prop_id
	and chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id  
	and entity_prop_assoc.sup_num = 0
	and entity_prop_assoc.tax_yr = @appr_yr
	and entity_prop_assoc.entity_id 	= entity.entity_id
	and property_val.prop_id = entity_prop_assoc.prop_id
	and property_val.sup_num = entity_prop_assoc.sup_num
	and property_val.prop_val_yr = entity_prop_assoc.tax_yr
	and entity.entity_type_cd 		= 'C'
	order by property_val.appraised_val desc
	
	--and   sl_city_id is null
	
	--Here we are going to get the predominant state code on the property (land_detail, imprv, pers_prop_seg)
	--If the property is Personal, then check the pers_prop_segs...
	
	--This will find the state code with the highest cumulative value pers_prop_seg on a property...
	select top 1 @temp_pp_state_cd = pp_state_cd,
		     @temp_pp_val      = pp_mkt_val
	from pers_prop_seg,  chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id   = pers_prop_seg.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id
	and   pers_prop_seg.prop_val_yr 	= @appr_yr
	and   pers_prop_seg.sup_num 		= 0
	and   pers_prop_seg.sale_id		= 0
	and   pers_prop_seg.pp_active_flag 	= 'T'
	and   pers_prop_seg.pp_state_cd is not null
	group by pp_state_cd, pp_mkt_val
	order by sum(pp_mkt_val) desc
		
	
	--This will find the state code with the highest cumulative value improvements on a property...
	select top 1 @temp_imprv_state_cd = imprv_state_cd,
		     @temp_imprv_val 	  = imprv_val
	from imprv, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id   = imprv.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id
	and   imprv.prop_val_yr 	=  @appr_yr
	and   imprv.sup_num 		= 0
	and   imprv.sale_id		= 0
	and   imprv.imprv_state_cd is not null
	group by imprv_state_cd, imprv_val
	order by sum(imprv_val) desc	
		
	--This will find the state code with the highest cumulative value land on a property...
	select top 1 @temp_land_state_cd  = state_cd,
		     @temp_land_val 	  = land_seg_mkt_val
	from  land_detail, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id   = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id
	and   land_detail.prop_val_yr 		= @appr_yr
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
	
	--Set the actual year built (first MA segment)
	select top 1 @temp_yr_built = id.yr_built
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = @appr_yr and
		id.sup_num = 0 and
		id.sale_id = 0 and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.yr_built > 0 and
		idt.main_area = 'T'
	order by id.imprv_det_val desc
	
	--Set the total MA area for all the MA details on a property
	select @temp_imprv_det_area = sum(imprv_det_area)
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = @appr_yr and
		id.sup_num = 0 and
		id.sale_id = 0 and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_area is not null and
		idt.main_area = 'T'
	
	--Set the base price per square foot, which is the first imprv.living_area_up found on the property
	select top 1 @temp_imprv_unit_price = id.unit_price
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = @appr_yr and
		id.sup_num = 0 and
		id.sale_id = 0 and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_area is not null and
		idt.main_area = 'T'
	
	--This will find the class code with the highest cumulative value improvement details on a property...
	select top 1
		@temp_imprv_class_cd = id.imprv_det_class_cd,
		@temp_imprv_sub_class_cd = id.imprv_det_sub_class_cd
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = @appr_yr and
		id.sup_num = 0 and
		id.sale_id = 0 and
		id.prop_id = coopa.prop_id
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_class_cd is not null
	group by id.imprv_det_class_cd, id.imprv_det_val, id.imprv_det_sub_class_cd
	order by sum(id.imprv_det_val) desc, sum(id.imprv_det_area) desc

	select top 1 @temp_imprv_type_cd = imprv_type_cd
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv as i with(nolock) on
		i.prop_val_yr = @appr_yr and
		i.sup_num = 0 and
		i.sale_id = 0 and
		i.prop_id = coopa.prop_id
	where
		coopa.chg_of_owner_id = @input_sale_id
	order by
		i.imprv_val desc
	
	--Set the sum of land_acres if method is acres...
	select @temp_land_acres = sum(land_detail.size_acres) from land_detail,  land_sched, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and land_detail.sup_num 	= 0
	and land_detail.prop_val_yr 	= @appr_yr
	and land_detail.ls_mkt_id 	= land_sched.ls_id
	and land_detail.prop_val_yr 	= land_sched.ls_year
	and land_detail.sale_id		= 0
	and land_sched.ls_method 	= 'A'
	and land_detail.size_acres is not null
	
	--Set the sum of land_sqft if method is square feet...
	select @temp_land_sqft = sum(land_detail.size_square_feet) from land_detail, land_sched, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and land_detail.sup_num 	= 0
	and land_detail.prop_val_yr 	= @appr_yr
	and land_detail.ls_mkt_id 	= land_sched.ls_id
	and land_detail.prop_val_yr 	= land_sched.ls_year
	and land_detail.sale_id		= 0
	and land_sched.ls_method 	= 'SQ'
	and land_detail.size_square_feet is not null
	
	
	--Set the sum of land_detail.effective_front if method is front foot...
	select @temp_land_ff = sum(land_detail.effective_front) from land_detail, land_sched, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and land_detail.sup_num 	= 0
	and land_detail.prop_val_yr 	= @appr_yr
	and land_detail.ls_mkt_id 	= land_sched.ls_id
	and land_detail.prop_val_yr 	= land_sched.ls_year
	and land_detail.sale_id		= 0
	and land_sched.ls_method 	= 'FF'
	and land_detail.effective_front is not null
	
	--Set the average of the land_detail.effective_depth
	select @temp_land_depth = avg(land_detail.effective_depth) from land_detail, land_sched, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and land_detail.sup_num 	= 0
	and land_detail.prop_val_yr 	= @appr_yr
	and land_detail.ls_mkt_id 	= land_sched.ls_id
	and land_detail.prop_val_yr 	= land_sched.ls_year
	and land_detail.sale_id		= 0
	and land_sched.ls_method 	= 'FF'
	and land_detail.effective_depth is not null
	
	--Get the average price per unit for a property (land_detail.mkt_unit_price)
	select @temp_land_unit_price 	= avg(land_detail.mkt_unit_price) from land_detail, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and land_detail.prop_val_yr 	= @appr_yr
	and land_detail.sup_num 	= 0
	and land_detail.sale_id		= 0
	and land_detail.mkt_unit_price is not null
	
	
	--sale.sl_land_type_cd
	--@temp_land_type_cd
	--land.land_type_cd
	--Set the dominant type code for the land details on the property
	
		--This will find the type code for the highest valued land details on a property...
	select top 1 @temp_land_type_cd = land_type_cd
	from land_detail, chg_of_owner_prop_assoc
	where chg_of_owner_prop_assoc.prop_id = land_detail.prop_id
	and   chg_of_owner_prop_assoc.chg_of_owner_id = @input_sale_id 
	and   land_detail.prop_val_yr 		= @appr_yr
	and   land_detail.sup_num 		= 0
	and   land_detail.sale_id		= 0
	and   land_detail.land_type_cd is not null
	order by land_seg_mkt_val desc
	
	select @primary_use_cd = pv.property_use_cd,
				@secondary_use_cd = pv.secondary_use_cd
	from property_val as pv
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on pv.prop_id = coopa.prop_id
	and pv.prop_val_yr = @appr_yr
	and pv.sup_num = 0
	where coopa.chg_of_owner_id = @input_sale_id
	
	delete prop_characteristic_assoc
	from prop_characteristic_assoc
	join chg_of_owner_prop_assoc as coopa with (nolock) on
							prop_characteristic_assoc.sale_id = coopa.chg_of_owner_id and
							prop_characteristic_assoc.prop_id = coopa.prop_id
	where
							coopa.chg_of_owner_id = @input_sale_id	 
							
					


		DECLARE property CURSOR FAST_FORWARD
		FOR	select pv.prop_id, pv.sup_num , @appr_yr as sup_tax_yr
				from chg_of_owner_prop_assoc as coopa with (nolock)
				join prop_supp_assoc as psa with (nolock)
				on psa.owner_tax_yr = @appr_yr
				and psa.prop_id = coopa.prop_id
				join property_val as pv with (nolock)
				on pv.prop_val_yr = psa.owner_tax_yr
				and pv.sup_num = psa.sup_num
				and pv.prop_id = psa.prop_id
				where coopa.chg_of_owner_id = @input_sale_id

		

	open property
	fetch next from property into @prop_id, @sup_num, @sup_tax_yr
		
	while (@@FETCH_STATUS = 0)
	begin


		INSERT INTO 
		prop_characteristic_assoc
		(
				prop_val_yr
			 ,sup_num
			 ,sale_id
			 ,prop_id
			 ,characteristic_cd
			 ,attribute_cd
		)
		SELECT 
				prop_val_yr
				,sup_num
				,@input_sale_id
				,prop_id
				,pca.characteristic_cd
				,pca.attribute_cd
		 FROM prop_characteristic_assoc as pca
		 WHERE pca.prop_val_yr = @sup_tax_yr
		 and pca.sup_num = @sup_num
		 and pca.prop_id = @prop_id
		 and pca.sale_id = 0


			fetch next from property into @prop_id, @sup_num, @sup_tax_yr
	end
		
	close 	   property
	deallocate property
	
									
end
else
begin
	select top 1 @temp_school_id = e.entity_id
	from chg_of_owner_prop_assoc as coopa
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on coopa.sup_tax_yr = psa.owner_tax_yr
	and coopa.prop_id = psa.prop_id
	join entity_prop_assoc as epa
	with (nolock)
	on psa.owner_tax_yr = epa.tax_yr
	and psa.sup_num = epa.sup_num
	and psa.prop_id = epa.prop_id
	join entity as e
	with (nolock)
	on epa.entity_id = e.entity_id
	and e.entity_type_cd = 'S'
	join property_val as pv
	with (nolock)
	on psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
	and psa.prop_id = pv.prop_id
	where coopa.chg_of_owner_id = @input_sale_id  
	order by pv.appraised_val desc

	select top 1 @temp_city_id = e.entity_id
	from chg_of_owner_prop_assoc as coopa
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on coopa.sup_tax_yr = psa.owner_tax_yr
	and coopa.prop_id = psa.prop_id
	join entity_prop_assoc as epa
	with (nolock)
	on psa.owner_tax_yr = epa.tax_yr
	and psa.sup_num = epa.sup_num
	and psa.prop_id = epa.prop_id
	join entity as e
	with (nolock)
	on epa.entity_id = e.entity_id
	and e.entity_type_cd    = 'C'
	join property_val as pv
	with (nolock)
	on psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
	and psa.prop_id = pv.prop_id
	where coopa.chg_of_owner_id = @input_sale_id  
	
	order by pv.appraised_val desc
	
		
	--Here we are going to get the predominant state code on the property (land_detail, imprv, pers_prop_seg)
	--If the property is Personal, then check the pers_prop_segs...
	
	--This will find the state code with the highest cumulative value pers_prop_seg on a property...
	select top 1 @temp_pp_state_cd = pps.pp_state_cd,
		     @temp_pp_val = pps.pp_mkt_val
	from  pers_prop_seg as pps
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on pps.prop_val_yr = coopa.sup_tax_yr
	and pps.sale_id = coopa.chg_of_owner_id
	and pps.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id
	and pps.pp_active_flag = 'T'
	and pps.pp_state_cd is not null
	group by pps.pp_state_cd, pps.pp_mkt_val
	order by sum(pps.pp_mkt_val) desc
		
	
	--This will find the state code with the highest cumulative value improvements on a property...
	select top 1 @temp_imprv_state_cd = i.imprv_state_cd,
		     @temp_imprv_val = i.imprv_val
	from imprv as i
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on i.prop_val_yr = coopa.sup_tax_yr
	and i.sale_id = coopa.chg_of_owner_id
	and i.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id
	and i.imprv_state_cd is not null
	group by i.imprv_state_cd, i.imprv_val
	order by sum(i.imprv_val) desc	
		
	--This will find the state code with the highest cumulative value land on a property...
	select top 1 @temp_land_state_cd = ld.state_cd,
		     @temp_land_val = ld.land_seg_mkt_val
	from  land_detail as ld
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id
	and ld.state_cd is not null
	group by ld.state_cd, ld.land_seg_mkt_val
	order by sum(ld.land_seg_mkt_val) desc	
	
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
	
	--Set the actual year built (first MA segment)
	select top 1 @temp_yr_built = id.yr_built
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = coopa.sup_tax_yr and
		id.sale_id = coopa.chg_of_owner_id and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.yr_built > 0 and
		idt.main_area = 'T'
	order by id.imprv_det_val desc
	
	--Set the total MA area for all the MA details on a property
	select @temp_imprv_det_area = sum(imprv_det_area)
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = coopa.sup_tax_yr and
		id.sale_id = coopa.chg_of_owner_id and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_area is not null and
		idt.main_area = 'T'
	
	--Set the base price per square foot, which is the first imprv.living_area_up found on the property
	select top 1 @temp_imprv_unit_price = id.unit_price
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = coopa.sup_tax_yr and
		id.sale_id = coopa.chg_of_owner_id and
		id.prop_id = coopa.prop_id
	join imprv_det_type as idt with(nolock) on
		idt.imprv_det_type_cd = id.imprv_det_type_cd
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_area is not null and
		idt.main_area = 'T'
	
	--This will find the class code with the highest cumulative value improvement details on a property...
	select top 1
		@temp_imprv_class_cd = id.imprv_det_class_cd,
		@temp_imprv_sub_class_cd = id.imprv_det_sub_class_cd
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = coopa.sup_tax_yr and
		id.sale_id = coopa.chg_of_owner_id and
		id.prop_id = coopa.prop_id
	where
		coopa.chg_of_owner_id = @input_sale_id and
		id.imprv_det_class_cd is not null
	group by id.imprv_det_class_cd, id.imprv_det_val, id.imprv_det_sub_class_cd
	order by sum(id.imprv_det_val) desc, sum(id.imprv_det_area) desc

	select top 1 @temp_imprv_type_cd = imprv_type_cd
	from chg_of_owner_prop_assoc as coopa with(nolock)
	join imprv as i with(nolock) on
		i.prop_val_yr = coopa.sup_tax_yr and
		i.sale_id = @input_sale_id and
		i.prop_id = coopa.prop_id
	where
		coopa.chg_of_owner_id = @input_sale_id
	order by
		i.imprv_val desc
	
	--Set the sum of land_acres if method is acres...
	select @temp_land_acres = sum(ld.size_acres) 
	from land_detail as ld
	with (nolock)
	join land_sched as ls
	with (nolock)
	on ld.ls_mkt_id = ls.ls_id
	and ld.prop_val_yr = ls.ls_year
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ls.ls_method = 'A'
	and ld.size_acres is not null
	
	--Set the sum of land_sqft if method is square feet...
	select @temp_land_sqft = sum(ld.size_square_feet) 
	from land_detail as ld
	with (nolock)
	join land_sched as ls
	with (nolock)
	on ld.ls_mkt_id = ls.ls_id
	and ld.prop_val_yr = ls.ls_year
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ls.ls_method = 'SQ'
	and ld.size_square_feet is not null
	
	
	--Set the sum of land_detail.effective_front if method is front foot...
	select @temp_land_ff = sum(ld.effective_front) 
	from land_detail as ld
	with (nolock)
	join land_sched as ls
	with (nolock)
	on ld.ls_mkt_id = ls.ls_id
	and ld.prop_val_yr = ls.ls_year
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ls.ls_method = 'FF'
	and ld.effective_front is not null
	
	--Set the average of the land_detail.effective_depth
	select @temp_land_depth = avg(ld.effective_depth) 
	from land_detail as ld
	with (nolock)
	join land_sched as ls
	with (nolock)
	on ld.ls_mkt_id = ls.ls_id
	and ld.prop_val_yr = ls.ls_year
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ls.ls_method = 'FF'
	and ld.effective_depth is not null
	
	--Get the average price per unit for a property (land_detail.mkt_unit_price)
	select @temp_land_unit_price 	= avg(ld.mkt_unit_price) 
	from land_detail as ld
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ld.mkt_unit_price is not null
	
	
	--sale.sl_land_type_cd
	--@temp_land_type_cd
	--land.land_type_cd
	--Set the dominant type code for the land details on the property
	
		--This will find the type code for the highest valued land details on a property...
	select top 1 @temp_land_type_cd = ld.land_type_cd
	from land_detail as ld
	with (nolock)
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on ld.prop_val_yr = coopa.sup_tax_yr
	and ld.sale_id = coopa.chg_of_owner_id
	and ld.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id 
	and ld.land_type_cd is not null
	order by ld.land_seg_mkt_val desc

	select @primary_use_cd = pv.property_use_cd,
				@secondary_use_cd = pv.secondary_use_cd
	from property_val as pv
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num
	and pv.prop_id = psa.prop_id
	join chg_of_owner_prop_assoc as coopa
	with (nolock)
	on psa.owner_tax_yr = coopa.sup_tax_yr
	and psa.prop_id = coopa.prop_id
	where coopa.chg_of_owner_id = @input_sale_id
	
end

update sale set sl_school_id     = @temp_school_id,
	sl_city_id 		 = @temp_city_id,
	sale.sl_state_cd 	 = @temp_state_cd,
	sale.sl_yr_blt 		 = @temp_yr_built,
	sale.sl_living_area 	 = @temp_imprv_det_area,
	sale.sl_imprv_unit_price = @temp_imprv_unit_price,
	sale.sl_class_cd 	 = @temp_imprv_class_cd,
	sale.sl_sub_class_cd     = @temp_imprv_sub_class_cd,
	sale.sl_imprv_type_cd = @temp_imprv_type_cd,
	sale.sl_land_acres 	 = @temp_land_acres,
	sale.sl_land_sqft 	 = @temp_land_sqft,
	sale.sl_land_front_feet  = @temp_land_ff,
	sale.sl_land_depth 	 = @temp_land_depth,
	sale.sl_land_unit_price  = @temp_land_unit_price,
	sale.sl_land_type_cd     = @temp_land_type_cd,
	sale.import_dt		 = Getdate(),
	sale.primary_use_cd = @primary_use_cd,
	sale.secondary_use_cd = @secondary_use_cd
where chg_of_owner_id = @input_sale_id

exec SetMachineLogChanges 1

GO

