

CREATE       PROCEDURE RecalcLandValue 
@input_prop_id    		int,
@input_tax_yr     		int,
@input_sup_num 			int,
@input_sale_id    		int,
@input_rounding_factor		numeric(1),
@input_apply_mass_factor 	char(1) = 'T',
@output_land_hstd_val     	numeric(14) output,
@output_land_non_hstd_val 	numeric(14) output,
@output_ag_use_val        	numeric(14) output,
@output_ag_market         	numeric(14) output,
@output_ag_loss           	numeric(14) output,
@output_timber_use        	numeric(14) output,
@output_timber_market     	numeric(14) output,
@output_timber_loss       	numeric(14) output,
@output_late_ag_loss		numeric(14) output

AS

declare @prop_id                	int     
declare @prop_val_yr           		numeric(4) 
declare @land_seg_id          		int  
declare @ls_mkt_id          		int   
declare @ls_ag_id     			int    
declare @land_seg_homesite  		char(1)
declare @size_acres     		numeric(18,4)             
declare @size_square_feet   		numeric(18,2) 
declare @size_eff_acres			numeric(18,4)  
declare @land_size_eff_acres		numeric(18,4)
declare @land_size_eff_acres_override   char(1)  
declare @effective_front    		numeric(18,2)        
declare @effective_depth    		numeric(18,2)       
declare @mkt_val_source     		varchar(1) 
declare @ag_use_cd      		varchar(5)  
declare @ag_apply           		char(1) 
declare @ag_val_type      		varchar(5)
declare @ag_val_source     		varchar(1) 
declare @ag_apply_yr        		numeric(4) 
declare @land_adj_amt           	numeric(14)
declare @land_adj_factor        	numeric(8,6)
declare @land_mass_adj_factor   	numeric(8,6)
declare @mkt_calc_val			numeric(14)
declare @mkt_adj_val			numeric(14)
declare @mkt_flat_val			numeric(14)
declare @ag_calc_val			numeric(14)
declare @ag_flat_val			numeric(14)
declare @mkt_unit_price     		numeric(14,2)    
declare @land_seg_mkt_val   		numeric(14)   
declare @ag_loss     			numeric(14)            
declare @ag_unit_price      		numeric(14,2)      
declare @ag_val      			numeric(14)
declare @effective_tax_year		numeric(4)
declare @land_new_val			numeric(14)
declare @num_lots			int
declare @late_ag_apply			char(1)


declare @sum_size_sqft			numeric(14,2)
declare @sum_size_acres                 numeric(18,4)

declare @sum_land_hstd_val    		numeric(14)
declare @sum_land_non_hstd_val   	numeric(14)
declare @sum_tim_use_val		numeric(14)
declare @sum_tim_market			numeric(14)
declare @sum_tim_loss			numeric(14)
declare @sum_ag_use_val    		numeric(14)
declare @sum_ag_market    		numeric(14)
declare @sum_ag_loss           		numeric(14)
declare @recalc_mkt_calc_val		numeric(14)
declare @recalc_mkt_adj_val		numeric(14)
declare @recalc_mkt_flat_val		numeric(14)
declare @recalc_mkt_unit_price		numeric(14,2)
declare @recalc_mkt_val			numeric(14)
declare @recalc_ag_calc_val		numeric(14)
declare @recalc_ag_flat_val		numeric(14)
declare @recalc_ag_val			numeric(14)
declare @recalc_ag_unit_price           numeric(14,2)
declare @recalc_ag_loss			numeric(14)

/* oil well adjustment variables */
declare @oa_sum_mkt_val			numeric(14)
declare @oa_sum_ag_val			numeric(14)
declare @oa_sum_acres			numeric(14, 6)
declare @oa_mkt_val			numeric(14)
declare @oa_ag_val			numeric(14)
declare @oa_oil_wells			numeric(14,4)
declare @oa_land_detail_id		int
declare @oa_system_adj_acres		numeric(14,4)

declare @bOilWell			char(1)
declare @error	varchar(100)


/* variables to check if legal acreage - size_acres */
declare	@legal_acreage			numeric(18,4)
declare @legal_sum_size_acres		numeric(18,4)

/* initialize sum variables */
set @recalc_mkt_calc_val	= 0
set @recalc_mkt_adj_val		= 0
set @recalc_mkt_flat_val	= 0
set @recalc_mkt_unit_price	= 0
set @recalc_mkt_val		= 0
set @recalc_ag_calc_val		= 0
set @recalc_ag_flat_val		= 0
set @recalc_ag_val		= 0
set @recalc_ag_unit_price    	= 0
set @recalc_ag_loss		= 0
set @sum_land_hstd_val     	= 0   

set @sum_land_non_hstd_val 	= 0   
set @sum_ag_use_val       	= 0   
set @sum_ag_market         	= 0    
set @sum_ag_loss       		= 0   
set @sum_tim_use_val		= 0
set @sum_tim_market	 	= 0
set @sum_tim_loss		= 0

set @oa_sum_mkt_val		= 0
set @oa_sum_ag_val		= 0
set @oa_sum_acres		= 0
set @oa_mkt_val			= 0
set @oa_ag_val			= 0
set @oa_oil_wells		= 0

set @legal_acreage		= 0
set @legal_sum_size_acres	= 0

set @output_late_ag_loss = 0

/* select the sum of the square feet, acres these will be used to find the unit price */
select @sum_size_sqft = sum(IsNull(size_square_feet, 0)), 
       @sum_size_acres = sum(IsNull(size_acres, 0))
from land_detail
    where  land_detail.prop_id 	    = @input_prop_id     
    and    land_detail.prop_val_yr  = @input_tax_yr
    and    land_detail.sup_num 	    = @input_sup_num
    and    land_detail.sale_id      = @input_sale_id

set @legal_sum_size_acres = @sum_size_acres

/* remove any oil well adjustment land segments */
delete from land_detail where prop_id = @input_prop_id
			and   sup_num = @input_sup_num
			and   prop_val_yr = @input_tax_yr
			and   sale_id     = @input_sale_id
			and   land_type_cd = 'OA'


  
DECLARE LAND_DETAIL SCROLL CURSOR
FOR select 	land_detail.prop_id,     
    		land_detail.prop_val_yr, 
    		land_seg_id, 
    		ls_mkt_id,   
    		ls_ag_id, 
                land_seg_homesite,   
    		size_acres,             
    		size_square_feet ,     
    		effective_front,        
    		effective_depth, 
     		IsNull(mkt_unit_price, 0),    
     		IsNull(land_seg_mkt_val, 0),
		IsNull(mkt_calc_val, 0) ,
		IsNull(mkt_adj_val, 0),
		IsNull(mkt_flat_val, 0),   
    		mkt_val_source, 
    		IsNull(land_detail.ag_loss, 0),            
    		ag_use_cd ,
    		IsNull(ag_unit_price, 0),      
    		ag_apply, 
    		IsNull(ag_val, 0),
		IsNull(ag_calc_val, 0),
		IsNull(ag_flat_val, 0),             
    		ag_val_type ,
    		ag_val_source, 
    		ag_apply_yr, 
    		IsNull(land_adj_amt, 0),
		IsNull(land_adj_factor, 1.00),
		IsNull(land_mass_adj_factor, 1.00),
		property_val.eff_size_acres,
		effective_tax_year,
		land_new_val,
                IsNull(land_detail.eff_size_acres, 0),
                IsNull(land_detail.eff_size_acres_override, 'F'),
		IsNull(land_detail.num_lots, 0),
		IsNull(late_ag_apply, 'F'),
		isNull(property_val.legal_acreage, 0)
    from   land_detail, property_val
    where  property_val.prop_id     = land_detail.prop_id
    and    property_val.prop_val_yr = land_detail.prop_val_yr
    and    property_val.sup_num     = land_detail.sup_num
    and    land_detail.prop_id 	    = @input_prop_id    
    and    land_detail.prop_val_yr  = @input_tax_yr
    and    land_detail.sup_num 	    = @input_sup_num
    and    land_detail.sale_id      = @input_sale_id

OPEN LAND_DETAIL
FETCH NEXT FROM LAND_DETAIL into @prop_id,
     @prop_val_yr,
     @land_seg_id,
     @ls_mkt_id,
     @ls_ag_id,
     @land_seg_homesite,
     @size_acres,
     @size_square_feet,
     @effective_front,
     @effective_depth, 
     @mkt_unit_price,
     @land_seg_mkt_val,
     @mkt_calc_val ,
     @mkt_adj_val,
     @mkt_flat_val ,   
     @mkt_val_source,
     @ag_loss,
     @ag_use_cd,
     @ag_unit_price ,
     @ag_apply,
     @ag_val,
     @ag_calc_val,
     @ag_flat_val ,  
     @ag_val_type,
     @ag_val_source,
     @ag_apply_yr,
     @land_adj_amt,
     @land_adj_factor,
     @land_mass_adj_factor,
     @size_eff_acres,
     @effective_tax_year,
     @land_new_val,
     @land_size_eff_acres,
     @land_size_eff_acres_override,
     @num_lots,
     @late_ag_apply,
     @legal_acreage

while (@@FETCH_STATUS = 0)
begin
	/* if the system is set to override eff_size_acres then we will use that regardless 
           of what is in the sum_size_acres or the sum_eff_acres */
	if (@land_size_eff_acres_override = 'T')

	begin
		set @size_eff_acres = @land_size_eff_acres
		set @sum_size_acres = 0
		set @sum_size_sqft = 0 --Fixes HelpSTAR #7513, reported by Webb CAD
	end
	
      	/* set the market value */
      	exec GetLandCalculatedValue @ls_mkt_id,
	   @input_tax_yr,
       	   0,
	   @size_acres,
	   @size_square_feet,
      	   @sum_size_acres,
	   @size_eff_acres,
           @sum_size_sqft,
           @effective_front, 
           @effective_depth,
           @mkt_unit_price,
	   @num_lots,
           @recalc_mkt_calc_val OUTPUT,
           @recalc_mkt_unit_price OUTPUT

	set @recalc_mkt_adj_val  = (@recalc_mkt_calc_val * @land_adj_factor) + @land_adj_amt

       	set @recalc_mkt_flat_val = @mkt_flat_val

	if (@mkt_val_source = 'C') 
	begin
		set @recalc_mkt_val = @recalc_mkt_calc_val
	end
	else if (@mkt_val_source = 'A')
	begin
		set @recalc_mkt_val = @recalc_mkt_adj_val
	end
	else if (@mkt_val_source = 'F')	
	begin
		set @recalc_mkt_val = @recalc_mkt_flat_val
	end

	if (@mkt_val_source = 'F')
	begin
		if (@input_apply_mass_factor = 'T')
		begin
			if (@land_mass_adj_factor > 0) and (@land_mass_adj_factor is not null)
			begin
				set @recalc_mkt_val = @recalc_mkt_val * @land_mass_adj_factor
			end
		end
	end
	else
	begin
		if (@land_mass_adj_factor > 0) and (@land_mass_adj_factor is not null)
		begin
			set @recalc_mkt_val = @recalc_mkt_val * @land_mass_adj_factor
		end
	end
       
	/**********************************************************************************/
	/************************************ log errors for market value *****************/
	/**********************************************************************************/
                                                             
	/* if the adj is 0 then log error */
	if ((@mkt_val_source = 'A') and (@land_adj_factor <= 0))
      	begin
		set @error = 'The adjustment percent for the land detail record is 0.';

		insert 
		into prop_recalc_errors
		(
                 prop_id, 
	 	 sup_num, 
	 	 sup_yr, 
	 	 sale_id,
		 imprv_id,
		 imprv_detail_id,
         	 land_detail_id, 
         	 error
                )
		values
		(
                 @input_prop_id,
	 	 @input_sup_num,
	 	 @input_tax_yr,
	 	 @input_sale_id,
		 0, 
		 0,
	 	 @land_seg_id,
	 	 @error
		)
	end
	
		/* if the value type is adjusted or calculated and the unit price is 0 then log an error */
	if ((@mkt_val_source = 'A') and (@recalc_mkt_unit_price <= 0))
	begin
		set @error = 'The unit price for the land detail record is 0.'

		insert 
		into prop_recalc_errors
		(
                 prop_id, 
	 	 sup_num, 
	 	 sup_yr, 
	 	 sale_id,
		 imprv_id,
		 imprv_detail_id,
         	 land_detail_id, 
         	 error
                )
		values
		(
                 @input_prop_id,
	 	 @input_sup_num,
	 	 @input_tax_yr,
	 	 @input_sale_id,
		 0,
		 0,
	 	 @land_seg_id,
	 	 @error
		)
		
	end



	/* if the value is 0  */
	if (@recalc_mkt_val <= 0) and (@mkt_val_source <> 'F')	
	begin
		set @error = 'The market value for the land detail record is 0.'

		insert 
		into prop_recalc_errors
		(
                 prop_id, 
	 	 sup_num, 
	 	 sup_yr, 
	 	 sale_id,
		 imprv_id,
		 imprv_detail_id,
         	 land_detail_id, 
         	 error
                )
		values
		(
                 @input_prop_id,
	 	 @input_sup_num,
	 	 @input_tax_yr,
	 	 @input_sale_id,
		 0,
		 0,
	 	 @land_seg_id,
	 	 @error
		)
	 end
	/******************************************************************************************/
	/*********************************************** end **************************************/
	/******************************************************************************************/
      	    
      	exec GetLandCalculatedValue @ls_ag_id,
				  @input_tax_yr,
      				  0,
				  @size_acres,
	   			  @size_square_feet,
      				  @sum_size_acres,
				  @size_eff_acres,
      				  @sum_size_sqft,
	           		  @effective_front, 
      				  @effective_depth,
                        	  @ag_unit_price,
				  @num_lots,
       				  @recalc_ag_calc_val OUTPUT,
      				  @recalc_ag_unit_price OUTPUT
            
      	/* set adjusted value */
      	set @recalc_ag_flat_val = @ag_flat_val

	
	/* only process the ag value and ag loss if we are apply ag */

      	if (@ag_apply = 'T')
      	begin

		if (@ag_val_source = 'C') 
		begin
			set @recalc_ag_val = @recalc_ag_calc_val
		end
		else if (@ag_val_source = 'F')	
		begin
			set @recalc_ag_val = @recalc_ag_flat_val
		end
     


          	set @recalc_ag_loss = @recalc_mkt_val - @recalc_ag_val
      	


		/**********************************************************************************/
		/************************************ log errors for ag value *********************/
		/**********************************************************************************/
                                                                                   
		/* if the value type is calculated and the unit price is 0 then log an error */
		if ((@ag_val_source = 'A')) and (@recalc_ag_unit_price <= 0)
		begin
			set @error = 'The ag unit price for the land detail record is 0.'

			insert 
			into prop_recalc_errors
			(
                 	prop_id, 
	 	 	sup_num, 
	 	 	sup_yr, 
	 	 	sale_id,
			imprv_id,
		 	imprv_detail_id,
         	 	land_detail_id, 
         	 	error

                	)
			values
			(
                 	@input_prop_id,
	 	 	@input_sup_num,
	 	 	@input_tax_yr,
	 	 	@input_sale_id,
			0,
			0,
	 	 	@land_seg_id,
	 	 	@error
			)
		
		end


		/* if the ag value is 0  */
		if (@recalc_ag_val <= 0) and (@ag_val_source <> 'F')
		begin
			set @error = 'The ag value for the land detail record is 0.'

			insert 
			into prop_recalc_errors
			(
                 	prop_id, 

	 	 	sup_num, 
	 	 	sup_yr, 
	 	 	sale_id,
			imprv_id,
		 	imprv_detail_id,
         	 	land_detail_id, 
         		error
                	)
			values
			(
                 	@input_prop_id,
	 	 	@input_sup_num,
	 	 	@input_tax_yr,
	 	 	@input_sale_id,
			0,
			0,
	 	 	@land_seg_id,
	 	 	@error
			)
		 end
		/******************************************************************************************/
		/*********************************************** end **************************************/
		/******************************************************************************************/
	end
	
	set @oa_sum_mkt_val = @oa_sum_mkt_val + @recalc_mkt_val
	set @oa_sum_ag_val  = @oa_sum_ag_val  + @recalc_ag_val
	set @oa_sum_acres   = @oa_sum_acres   + @size_acres

	   
	update land_detail
   	set     land_seg_mkt_val = round(@recalc_mkt_val, @input_rounding_factor),
          	mkt_unit_price   = @recalc_mkt_unit_price,
		mkt_calc_val	 = round(@recalc_mkt_calc_val, @input_rounding_factor),
		mkt_adj_val	 = round(@recalc_mkt_adj_val, @input_rounding_factor),
		mkt_flat_val	 = round(@recalc_mkt_flat_val, @input_rounding_factor),
          	ag_val           = round(@recalc_ag_val, @input_rounding_factor),
		ag_calc_val	 = round(@recalc_ag_calc_val, @input_rounding_factor),
		ag_flat_val	 = round(@recalc_ag_flat_val, @input_rounding_factor),
          	ag_unit_price    = @recalc_ag_unit_price,
          	ag_loss          = round(@recalc_ag_loss, @input_rounding_factor),
          	mkt_recalc_date   = GetDate(),
          	ag_recalc_date    = GetDate(),
	oa_mkt_val = 0,
	oa_ag_val   = 0
   	where land_seg_id  = @land_seg_id
   	and    prop_id     = @input_prop_id
   	and    prop_val_yr = @input_tax_yr
   	and    sup_num     = @input_sup_num
   	and    sale_id     = @input_sale_id


	  
	if (@ag_apply <> 'T') or (@ag_apply is null)
	begin
   	 	if (@land_seg_homesite = 'T')
  	 	begin
      			set @sum_land_hstd_val = @sum_land_hstd_val + round(@recalc_mkt_val, @input_rounding_factor)
   	 	end
   	 	else
   	 	begin
      			set @sum_land_non_hstd_val = @sum_land_non_hstd_val + round(@recalc_mkt_val, @input_rounding_factor)
   	 	end
        end
	else
	begin

		if (@recalc_ag_val <= @recalc_mkt_val)
		begin
			if (@ag_use_cd = '1D') or (@ag_use_cd = '1D1')
			begin

   	 			set @sum_ag_market  = @sum_ag_market +  round(@recalc_mkt_val, @input_rounding_factor)
				set @sum_ag_use_val = @sum_ag_use_val + round(@recalc_ag_val, @input_rounding_factor)
   	 			set @sum_ag_loss    = @sum_ag_loss +    round(@recalc_ag_loss, @input_rounding_factor)
			end
			else if (@ag_use_cd = 'TIM')
			begin
				set @sum_tim_market  = @sum_tim_market + round(@recalc_mkt_val, @input_rounding_factor)
				set @sum_tim_use_val = @sum_tim_use_val + round(@recalc_ag_val, @input_rounding_factor)
				set @sum_tim_loss    = @sum_tim_loss + round(@recalc_ag_loss, @input_rounding_factor)
			end

			/* add check for late ag apply */
			if (@late_ag_apply = 'T')
			begin
				set @output_late_ag_loss = @output_late_ag_loss + round(@recalc_ag_loss, @input_rounding_factor)
			end
		end
		else
		begin
			/* if the ag value is greater than the market value then set the ag use value equal to the ag market value. The 
			    ag value can never be greater than the market value for ag_apply accounts */
			if (@ag_use_cd = '1D') or (@ag_use_cd = '1D1')
			begin

   	 			set @sum_ag_market  = @sum_ag_market +  round(@recalc_mkt_val, @input_rounding_factor)
				set @sum_ag_use_val = @sum_ag_use_val + round(@recalc_mkt_val, @input_rounding_factor)
   	 			set @sum_ag_loss    = @sum_ag_loss +    0

			end
			else if (@ag_use_cd = 'TIM')
			begin
				set @sum_tim_market  = @sum_tim_market + round(@recalc_mkt_val, @input_rounding_factor)
				set @sum_tim_use_val = @sum_tim_use_val + round(@recalc_mkt_val, @input_rounding_factor)
				set @sum_tim_loss    = @sum_tim_loss + 0
			end
		end		
	end 
   
   	set @recalc_mkt_calc_val	= 0
	set @recalc_mkt_adj_val	= 0
	set @recalc_mkt_flat_val	= 0
	set @recalc_mkt_unit_price	= 0
	set @recalc_mkt_val		= 0
	set @recalc_ag_calc_val	= 0
	set @recalc_ag_flat_val	= 0
	set @recalc_ag_val		= 0
	set @recalc_ag_unit_price    = 0
	set @recalc_ag_loss		= 0
	   
   	FETCH NEXT FROM LAND_DETAIL into @prop_id,
        	@prop_val_yr,
        	@land_seg_id,
        	@ls_mkt_id,
        	@ls_ag_id,
        	@land_seg_homesite,
        	@size_acres,
        	@size_square_feet,
        	@effective_front,
        	@effective_depth,
        	@mkt_unit_price,
        	@land_seg_mkt_val ,
	@mkt_calc_val,
     	@mkt_adj_val,
    	@mkt_flat_val ,   
        	@mkt_val_source ,
        	@ag_loss,
        	@ag_use_cd,
        	@ag_unit_price ,
        	@ag_apply,
        	@ag_val,
		@ag_calc_val,
		@ag_flat_val,   
        	@ag_val_type,
        	@ag_val_source,
        	@ag_apply_yr,
        	@land_adj_amt,
     		@land_adj_factor,
     		@land_mass_adj_factor,
             	@size_eff_acres,
		@effective_tax_year,
		@land_new_val,
	        @land_size_eff_acres,
	        @land_size_eff_acres_override,
    		@num_lots,
		@late_ag_apply,
		@legal_acreage
end


CLOSE LAND_DETAIL
DEALLOCATE LAND_DETAIL


/* add oil well adjustments if necessary */
if exists (select *
	   from property_val 
	   where prop_id = @input_prop_id
	   and   sup_num = @input_sup_num
	   and   prop_val_yr = @input_tax_yr
	   and   oil_wells > 0 
	   and   oil_wells is not null 
	   and  oil_wells_apply_adjust = 'T'
	   and  oil_wells_apply_adjust is not null)
begin
	select @oa_oil_wells = oil_wells
	from property_val 
	where prop_id = @input_prop_id
	and   sup_num = @input_sup_num
	and   prop_val_yr = @input_tax_yr
	and   oil_wells > 0 
	and   oil_wells is not null

	select @oa_system_adj_acres = oil_well_adj_acres
	from pacs_system

	if (@oa_oil_wells is null)
	begin
		set @oa_oil_wells = 0
	end


	if (@oa_sum_mkt_val > 0 or @oa_sum_ag_val > 0)
	begin

		if (@oa_sum_mkt_val > 0)
		begin
			set @oa_mkt_val = round(((@oa_sum_mkt_val/@oa_sum_acres) * @oa_system_adj_acres * @oa_oil_wells), @input_rounding_factor)
		end
		else
		begin
			set @oa_mkt_val = 0
		end

		if (@oa_sum_ag_val > 0)
		begin
			set @oa_ag_val  = round(((@oa_sum_ag_val/@oa_sum_acres) * @oa_system_adj_acres * @oa_oil_wells), @input_rounding_factor)
		end
		else
		begin
			set @oa_ag_val = 0
		end
	
		/* here we will scroll through the segments and distribute the oa adjustment amount */
		declare @seg_oa_mkt_val		numeric(14)
		declare @seg_oa_ag_val		numeric(14)
		
		set @seg_oa_mkt_val  = 0
		set @seg_oa_ag_val   = 0 

		DECLARE LAND_DETAIL SCROLL CURSOR
		FOR select 	land_detail.prop_id,     
  			land_detail.prop_val_yr, 
    			land_seg_id, 
    			land_seg_mkt_val,
			ag_val,
			land_seg_homesite,   
    			ag_use_cd, 
    			ag_apply 
		from   land_detail, property_val
    		where  land_detail.prop_id 	= @input_prop_id     
    		and    land_detail.prop_val_yr  = @input_tax_yr
    		and    land_detail.sup_num 	= @input_sup_num
    		and    land_detail.sale_id      = @input_sale_id
    		and    property_val.prop_id     = @input_prop_id
   		and    property_val.prop_val_yr = @input_tax_yr
    		and    property_val.sup_num     = @input_sup_num

		OPEN LAND_DETAIL
		FETCH NEXT FROM LAND_DETAIL into @prop_id,
     						 @prop_val_yr,
     						 @land_seg_id,
    						 @land_seg_mkt_val,
     	     					 @ag_val,
						 @land_seg_homesite,   
    						 @ag_use_cd, 
    						 @ag_apply 

		while (@@FETCH_STATUS = 0)
		begin
		
			if (@oa_sum_mkt_val > 0)
			begin
				set @seg_oa_mkt_val = round(((@land_seg_mkt_val/@oa_sum_mkt_val) * @oa_mkt_val), @input_rounding_factor)
			end
			else
			begin
				set @seg_oa_mkt_val = 0
			end

			if (@oa_sum_ag_val > 0)
			begin
				set @seg_oa_ag_val  = round(((@ag_val/@oa_sum_ag_val) * @oa_ag_val), @input_rounding_factor)
			end
			else
			begin
				set @seg_oa_ag_val = 0
			end

			set @land_seg_mkt_val =  round((@land_seg_mkt_val - @seg_oa_mkt_val), @input_rounding_factor)
			set @ag_val                   = round((@ag_val - @seg_oa_ag_val), @input_rounding_factor)

			if (@land_seg_mkt_val < 0)
			begin
				set @land_seg_mkt_val = 0
			end
		
			if (@ag_val < 0)
			begin
				set @ag_val = 0
			end

			update land_detail
			set land_seg_mkt_val = @land_seg_mkt_val,
			    ag_val           = @ag_val,
			    ag_loss = @land_seg_mkt_val - @ag_val,
			     oa_mkt_val = @seg_oa_mkt_val,
			     oa_ag_val   = @seg_oa_ag_val
			where land_seg_id  = @land_seg_id
   			and    prop_id     = @input_prop_id
   			and    prop_val_yr = @input_tax_yr
   			and    sup_num     = @input_sup_num
   			and    sale_id     = @input_sale_id


			/* now readjust your totals */
			if (@ag_apply <> 'T') or (@ag_apply is null)
			begin
   	 			if (@land_seg_homesite = 'T')
  	 			begin
      					set @sum_land_hstd_val = @sum_land_hstd_val - @seg_oa_mkt_val
   	 			end
   	 			else
   	 			begin
      					set @sum_land_non_hstd_val = @sum_land_non_hstd_val - @seg_oa_mkt_val
   	 			end
        		end
			else
			begin

			if (@ag_val <= @land_seg_mkt_val)
			begin
				if (@ag_use_cd = '1D') or (@ag_use_cd = '1D1')
				begin

   	 				set @sum_ag_market  = @sum_ag_market  - @seg_oa_mkt_val
					set @sum_ag_use_val = @sum_ag_use_val - @seg_oa_ag_val
   	 				set @sum_ag_loss    = @sum_ag_market - @sum_ag_use_val
				end
				else if (@ag_use_cd = 'TIM')
				begin
					set @sum_tim_market  = @sum_tim_market  - @seg_oa_mkt_val
					set @sum_tim_use_val = @sum_tim_use_val - @seg_oa_ag_val
					set @sum_tim_loss    = @sum_tim_market - @sum_tim_use_val
				end
			end
			else
			begin
				/* if the ag value is greater than the market value then set the ag use value equal to the ag market value. The 
			 	   ag value can never be greater than the market value for ag_apply accounts */
				if (@ag_use_cd = '1D') or (@ag_use_cd = '1D1')
				begin

   	 				set @sum_ag_market  = @sum_ag_market - @seg_oa_mkt_val
					set @sum_ag_use_val = @sum_ag_use_val - @seg_oa_mkt_val
   	 				set @sum_ag_loss    = @sum_ag_loss +    0

				end
				else if (@ag_use_cd = 'TIM')
				begin
					set @sum_tim_market  = @sum_tim_market - @seg_oa_mkt_val
					set @sum_tim_use_val = @sum_tim_use_val - @seg_oa_mkt_val
					set @sum_tim_loss    = @sum_tim_loss + 0
				end
			end		
		
			end				 

			FETCH NEXT FROM LAND_DETAIL into @prop_id,
     						 @prop_val_yr,
     						 @land_seg_id,
 						 @land_seg_mkt_val,
     	     					 @ag_val,
						 @land_seg_homesite,   
    						 @ag_use_cd, 
    						 @ag_apply 

		end
		
		CLOSE LAND_DETAIL
		DEALLOCATE LAND_DETAIL


		if (@sum_ag_use_val < 0)
		begin
			
				set @error = 'The ag use for the property record is < 0.'

				insert 
				into prop_recalc_errors
				(
               	 		prop_id, 
	 			sup_num, 
	 			sup_yr, 
	 			sale_id,
 				imprv_id,
				imprv_detail_id,
         			land_detail_id, 
         			error
                		)
				values
				(
                		@input_prop_id,
	 			@input_sup_num,
	 			@input_tax_yr,
	 			@input_sale_id,
				0,
				0,
	 			@land_seg_id,
	 			@error
				)

			
			
			if (@sum_ag_market < 0)
			begin
				set @error = 'The ag market for the property record is < 0.'
	
				insert 
				into prop_recalc_errors
				(
               		 	prop_id, 
	 			sup_num, 
	 			sup_yr, 
	 			sale_id,
 				imprv_id,
				imprv_detail_id,
         			land_detail_id, 
         			error
                		)
				values
				(
                		@input_prop_id,
	 			@input_sup_num,
	 			@input_tax_yr,
	 			@input_sale_id,
				0,
				0,
	 			@land_seg_id,
	 			@error
				)
			end
		end
		else
		begin
	
			if (@sum_land_non_hstd_val < 0)
			begin
				set @error = 'The land non hstd for the property record is < 0.'

				insert 
				into prop_recalc_errors
				(
               	 		prop_id, 
	 			sup_num, 
	 			sup_yr, 
	 			sale_id,
 				imprv_id,
				imprv_detail_id,
         			land_detail_id, 
         			error
                		)
				values
				(
                		@input_prop_id,
	 			@input_sup_num,
	 			@input_tax_yr,
	 			@input_sale_id,
				0,
				0,
	 			@land_seg_id,
	 			@error
				)
			end
		end  
	end
end 



/* save the land values to the property value table */

if (@sum_ag_use_val < 0)
begin
	set @sum_ag_use_val = 0
end

if (@sum_ag_market < 0)
begin
	set @sum_ag_market = 0
end

if (@sum_land_non_hstd_val < 0)
begin
	set @sum_land_non_hstd_val = 0
end


set @output_land_hstd_val     = round(@sum_land_hstd_val, @input_rounding_factor)
set @output_land_non_hstd_val = round(@sum_land_non_hstd_val, @input_rounding_factor)
set @output_ag_use_val        = round(@sum_ag_use_val, @input_rounding_factor)
set @output_ag_market         = round(@sum_ag_market, @input_rounding_factor)
set @output_ag_loss           = round(@sum_ag_loss, @input_rounding_factor)
set @output_timber_use        = round(@sum_tim_use_val, @input_rounding_factor)
set @output_timber_market     = round(@sum_tim_market, @input_rounding_factor)
set @output_timber_loss       = round(@sum_tim_loss, @input_rounding_factor)


/*if (@legal_sum_size_acres <> @legal_acreage)
begin
	set @error = 'The legal acreage does not equal the sum of the land segments.'

	insert 
	into prop_recalc_errors
	(
	prop_id, 
	sup_num, 
	sup_yr, 
	sale_id,
	imprv_id,
	imprv_detail_id,
	land_detail_id, 
	error
	)
	values
	(
	@input_prop_id,
	@input_sup_num,
	@input_tax_yr,
	@input_sale_id,
	0,
	0,
	0,
	@error
	)
end
*/

GO

