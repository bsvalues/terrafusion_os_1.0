
create procedure SetEntityStateCdVal
	@input_yr numeric(4,0),
	@input_sup_num int,
	@input_entity_id int
as

set nocount on

declare @prop_id  		int
declare @owner_id 		int
declare @sup_num  		int
declare @sup_yr   		numeric(4)
declare @entity_id 		int
declare @taxable_val 		numeric(14)
declare @assessed_val 		numeric(14)
declare @land_hstd_val 		numeric(14)
declare @land_non_hstd_val 	numeric(14)
declare @imprv_hstd_val    	numeric(14)
declare @imprv_non_hstd_val 	numeric(14)
declare @ag_market 		numeric(14)
declare @ag_use_val 		numeric(14)
declare @timber_market 		numeric(14)
declare @timber_use		numeric(14)
declare @ten_percent_cap 	numeric(14)
declare @appraised_val		numeric(14)
declare @market			numeric(14)
declare @tif_imprv_val numeric(14,0)
declare @tif_land_val numeric(14,0)
declare @pv_assessed_val 	numeric(14)
declare @pv_land_hstd_val 	numeric(14)
declare @pv_land_non_hstd_val 	numeric(14)
declare @pv_imprv_hstd_val    	numeric(14)
declare @pv_imprv_non_hstd_val 	numeric(14)
declare @pv_ag_market 		numeric(14)
declare @pv_ag_use_val 		numeric(14)
declare @pv_timber_market 	numeric(14)
declare @pv_timber_use		numeric(14)
declare @pv_ten_percent_cap 	numeric(14)
declare @pvs_assessed_val 	numeric(14)
declare @pvs_land_hstd_val 	numeric(14)
declare @pvs_land_non_hstd_val 	numeric(14)
declare @pvs_imprv_hstd_val    	numeric(14)
declare @pvs_imprv_non_hstd_val numeric(14)
declare @pvs_ag_market 		numeric(14)
declare @pvs_ag_use_val 	numeric(14)
declare @pvs_timber_market 	numeric(14)
declare @pvs_timber_use		numeric(14)
declare @pvs_ten_percent_cap 	numeric(14)
declare @pvs_state_cd		char(5)
declare @pvs_imp_new_val	numeric(14)
declare @pvs_ag_acres			numeric(18,4)
declare @pvs_acres			numeric(18, 4)
declare @pvs_effective_front		numeric(18,4)
declare @pvs_pp_new_val		numeric(14)
declare @pvs_land_new_val	numeric(14)
declare @arb_status			char(1)

declare @total_assessed_val 		numeric(14)
declare @total_land_hstd_val 		numeric(14)
declare @total_land_non_hstd_val 	numeric(14)
declare @total_imprv_hstd_val    	numeric(14)
declare @total_imprv_non_hstd_val 	numeric(14)
declare @total_ag_market 		numeric(14)
declare @total_ag_use_val 		numeric(14)
declare @total_timber_market 		numeric(14)
declare @total_timber_use		numeric(14)
declare @total_ten_percent_cap 		numeric(14)
declare @total_taxable_val		numeric(14)
declare @total_tax_increment_imprv_val numeric(14,0)
declare @total_tax_increment_land_val numeric(14,0)

declare @state_assessed_val		numeric(14)
declare @state_land_hstd_val 		numeric(14)
declare @state_land_non_hstd_val 	numeric(14)
declare @state_imprv_hstd_val    	numeric(14)
declare @state_imprv_non_hstd_val 	numeric(14)
declare @state_ag_market 		numeric(14)
declare @state_ag_use_val 		numeric(14)
declare @state_timber_market 		numeric(14)
declare @state_timber_use		numeric(14)
declare @state_ten_percent_cap 	numeric(14)
declare @state_taxable_val		numeric(14)
declare @state_tax_increment_imprv_val numeric(14,0)
declare @state_tax_increment_land_val numeric(14,0)

declare @state_appraised_val		numeric(14)
declare @state_market			numeric(14)

declare @prop_type_cd			char(5)

declare @num_state_codes	int
declare @count			int


declare @new_value			numeric(14)
declare @state_cd_pct			numeric(13,10)
declare @hs_pct				numeric(13,10)

declare @strSQL varchar(4092)





declare prop_owner_entity_val_cursor CURSOR FAST_FORWARD
for select poev.prop_id,     
	   poev.owner_id,    
	   poev.sup_num,     
	   poev.sup_yr, 
	   poev.entity_id,   
	   IsNull(poev.taxable_val, 0),      
	   IsNull(poev.assessed_val, 0),      
	   IsNull(poev.land_hstd_val, 0),    
	   IsNull(poev.land_non_hstd_val, 0), 
	   IsNull(poev.imprv_hstd_val, 0),  
	   IsNull(poev.imprv_non_hstd_val, 0), 
           IsNull(poev.ag_market, 0),        
           IsNull(poev.ag_use_val, 0),       
           IsNull(poev.timber_market, 0),    
           IsNull(poev.timber_use, 0),       
           IsNull(poev.ten_percent_cap, 0),  
	   IsNull(pv.assessed_val, 0),      
	   IsNull(pv.land_hstd_val, 0),    
	   IsNull(pv.land_non_hstd_val, 0), 
	   IsNull(pv.imprv_hstd_val, 0),  
	   IsNull(pv.imprv_non_hstd_val, 0), 
           IsNull(pv.ag_market, 0),        
           IsNull(pv.ag_use_val, 0),       
           IsNull(pv.timber_market, 0),    
           IsNull(pv.timber_use, 0),       
           IsNull(pv.ten_percent_cap, 0) ,
	   p.prop_type_cd,
	   IsNull(poev.arb_status, 'C'),
	   isnull(poev.tax_increment_imprv_val, 0),
	   isnull(poev.tax_increment_land_val, 0)
from prop_owner_entity_val as poev with(nolock)
join property_val as pv with(nolock) on
	poev.sup_yr = pv.prop_val_yr and
	poev.sup_num = pv.sup_num and
	poev.prop_id = pv.prop_id and
	pv.prop_inactive_dt is null
join property as p with(nolock) on
	poev.prop_id = p.prop_id
where
	poev.sup_yr = @input_yr and
	poev.sup_num = @input_sup_num and
	poev.entity_id = @input_entity_id

open prop_owner_entity_val_cursor
fetch next from prop_owner_entity_val_cursor into
@prop_id,     
@owner_id,    
@sup_num,     
@sup_yr, 
@entity_id,   
@taxable_val,      
@assessed_val,      
@land_hstd_val,    
@land_non_hstd_val, 
@imprv_hstd_val,  
@imprv_non_hstd_val, 
@ag_market,        
@ag_use_val,       
@timber_market,    
@timber_use,       
@ten_percent_cap,
@pv_assessed_val,      
@pv_land_hstd_val,    
@pv_land_non_hstd_val, 
@pv_imprv_hstd_val,  
@pv_imprv_non_hstd_val, 
@pv_ag_market,        
@pv_ag_use_val,       
@pv_timber_market,    
@pv_timber_use,       
@pv_ten_percent_cap,
@prop_type_cd,
@arb_status,
@tif_imprv_val,
@tif_land_val

while (@@FETCH_STATUS = 0)
begin

	-- init variables
	set @count = 1

	select @num_state_codes = count(*) 
	from  property_val_state_cd with(nolock)
	where prop_id = @prop_id
	and   sup_num = @sup_num
	and   prop_val_yr = @sup_yr



	set @total_land_hstd_val      = @land_hstd_val
	set @total_land_non_hstd_val  = @land_non_hstd_val
	set @total_imprv_hstd_val     = @imprv_hstd_val
	set @total_imprv_non_hstd_val = @imprv_non_hstd_val
	set @total_ag_market 	      = @ag_market
	set @total_ag_use_val 	      = @ag_use_val
	set @total_timber_market      = @timber_market
	set @total_timber_use	      = @timber_use
	set @total_ten_percent_cap    = @ten_percent_cap
	set @total_assessed_val	      = @assessed_val
	set @total_taxable_val 	      = @taxable_val
	set @total_tax_increment_imprv_val = @tif_imprv_val
	set @total_tax_increment_land_val = @tif_land_val

	-- now breakdown the state code value
	if (@num_state_codes > 0)
	begin
		declare property_val_state_cd_cursor CURSOR FAST_FORWARD
		for select assessed_val,      
	   		   land_hstd_val,    
	   		   land_non_hstd_val, 
	   		   imprv_hstd_val,  
	   		   imprv_non_hstd_val, 
           		   ag_market,        
          		   ag_use_val,       
                           timber_market,    
                           timber_use,
			   ten_percent_cap,
			   state_cd,
			   imp_new_val,
			   ag_acres,
			   pp_new_val,
			   land_new_val,
			   effective_front,
			   acres
		from  property_val_state_cd with(nolock)
		where prop_id = @prop_id
		and   sup_num = @sup_num
		and   prop_val_yr = @sup_yr
		order by state_cd desc

	
		open property_val_state_cd_cursor
		fetch next from property_val_state_cd_cursor into
			   @pvs_assessed_val,      
	   		   @pvs_land_hstd_val,    
	   		   @pvs_land_non_hstd_val, 
	   		   @pvs_imprv_hstd_val,  
	   		   @pvs_imprv_non_hstd_val, 
           		   @pvs_ag_market,        
          		   @pvs_ag_use_val,       
                           @pvs_timber_market,    
                           @pvs_timber_use,
			   @pvs_ten_percent_cap,
			   @pvs_state_cd,
			   @pvs_imp_new_val,
			   @pvs_ag_acres,
			   @pvs_pp_new_val,
			   @pvs_land_new_val,
			   @pvs_effective_front,
			   @pvs_acres

		while (@@FETCH_STATUS = 0)
		begin
			
			-- since this is the last one set the total amount left over to the
			-- last state code amount
			if (@count = @num_state_codes)
			begin
				set @state_land_hstd_val      = @total_land_hstd_val
				set @state_land_non_hstd_val  = @total_land_non_hstd_val
				set @state_imprv_hstd_val     = @total_imprv_hstd_val
				set @state_imprv_non_hstd_val = @total_imprv_non_hstd_val
				set @state_ag_market 	      = @total_ag_market
				set @state_ag_use_val 	      = @total_ag_use_val
				set @state_timber_market      = @total_timber_market
				set @state_timber_use	      = @total_timber_use
				set @state_ten_percent_cap    = @total_ten_percent_cap
				set @state_assessed_val       = @total_assessed_val
				set @state_taxable_val        = @total_taxable_val
				set @state_tax_increment_imprv_val = @total_tax_increment_imprv_val
				set @state_tax_increment_land_val = @total_tax_increment_land_val
			end
			else
			begin
				set @state_land_hstd_val      = 0
				set @state_land_non_hstd_val  = 0
				set @state_imprv_hstd_val     = 0
				set @state_imprv_non_hstd_val = 0
				set @state_ag_market 	      = 0
				set @state_ag_use_val 	      = 0
				set @state_timber_market      = 0
				set @state_timber_use	      = 0
				set @state_ten_percent_cap    = 0
				set @state_assessed_val       = 0 
				set @state_taxable_val	      = 0
				set @state_tax_increment_imprv_val = 0
				set @state_tax_increment_land_val = 0

				if ( @tif_imprv_val > 0 and (@pv_imprv_hstd_val + @pv_imprv_non_hstd_val) > 0 )
				begin
					set @state_tax_increment_imprv_val = @tif_imprv_val * ((@pvs_imprv_hstd_val + @pvs_imprv_non_hstd_val) / (@pv_imprv_hstd_val + @pv_imprv_non_hstd_val))
				end
				if ( @tif_land_val > 0 and (@pv_land_hstd_val + @pv_land_non_hstd_val + @pv_ag_market + @pv_timber_market) > 0 )
				begin
					set @state_tax_increment_land_val = @tif_land_val * ((@pvs_land_hstd_val + @pvs_land_non_hstd_val + @pvs_ag_market + @pvs_timber_market) / (@pv_land_hstd_val + @pv_land_non_hstd_val + @pv_ag_market + @pv_timber_market))
				end

				if (@land_hstd_val > 0 and @pv_land_hstd_val > 0)
				begin
					set @state_land_hstd_val = @land_hstd_val * (@pvs_land_hstd_val/@pv_land_hstd_val)
				end

				if (@land_non_hstd_val > 0 and @pv_land_non_hstd_val > 0)
				begin
					set @state_land_non_hstd_val = @land_non_hstd_val * (@pvs_land_non_hstd_val/@pv_land_non_hstd_val)
				end
				
				if (@imprv_hstd_val > 0 and @pv_imprv_hstd_val > 0)
				begin
					set @state_imprv_hstd_val = @imprv_hstd_val * (@pvs_imprv_hstd_val/@pv_imprv_hstd_val)
				end
				
				if (@imprv_non_hstd_val > 0 and @pv_imprv_non_hstd_val > 0)
				begin
					set @state_imprv_non_hstd_val = @imprv_non_hstd_val * (@pvs_imprv_non_hstd_val/@pv_imprv_non_hstd_val)
				end
				
				if (@ag_market > 0 and @pv_ag_market > 0)
				begin
					set @state_ag_market = @ag_market * (@pvs_ag_market/@pv_ag_market)
				end
				
				if (@ag_use_val > 0 and @pv_ag_use_val > 0)
				begin
					set @state_ag_use_val  = @ag_use_val * (@pvs_ag_use_val/@pv_ag_use_val)
				end
				
				if (@timber_market > 0 and @pv_timber_market > 0)
				begin
					set @state_timber_market = @timber_market * (@pvs_timber_market/@pv_timber_market)
				end
				
				if (@timber_use > 0 and @pv_timber_use > 0)
				begin
					set @state_timber_use  = @timber_use * (@pvs_timber_use/@pv_timber_use)
				end
				
				if (@ten_percent_cap > 0 and @pv_ten_percent_cap > 0)
				begin
					set @state_ten_percent_cap = @ten_percent_cap * (@pvs_ten_percent_cap/@pv_ten_percent_cap)
				end

				if (@assessed_val > 0 and @pv_assessed_val > 0)
				begin
					set @state_assessed_val = @assessed_val * (@pvs_assessed_val/@pv_assessed_val)
				end

				-- use the percentages from assessed to figure out the taxable
				if (@assessed_val > 0 and @pv_assessed_val > 0)
				begin
					set @state_taxable_val = @taxable_val * (@pvs_assessed_val/@pv_assessed_val)
				end



				set @total_land_hstd_val      = @total_land_hstd_val      - @state_land_hstd_val
				set @total_land_non_hstd_val  = @total_land_non_hstd_val  - @state_land_non_hstd_val
				set @total_imprv_hstd_val     = @total_imprv_hstd_val     - @state_imprv_hstd_val
				set @total_imprv_non_hstd_val = @total_imprv_non_hstd_val - @state_imprv_non_hstd_val
				set @total_ag_market 	      = @total_ag_market          - @state_ag_market
				set @total_ag_use_val 	      = @total_ag_use_val	  - @state_ag_use_val
				set @total_timber_market      = @total_timber_market      - @state_timber_market
				set @total_timber_use	      = @total_timber_use	  - @state_timber_use
				set @total_ten_percent_cap    = @total_ten_percent_cap    - @state_ten_percent_cap
				set @total_assessed_val	      = @total_assessed_val       - @state_assessed_val
				set @total_taxable_val	      = @total_taxable_val - @state_taxable_val
				set @total_tax_increment_imprv_val = @total_tax_increment_imprv_val - @state_tax_increment_imprv_val
				set @total_tax_increment_land_val = @total_tax_increment_land_val - @state_tax_increment_land_val
			end

			if (@prop_type_cd = 'R' or @prop_type_cd = 'MH')
			begin
				set @state_appraised_val = @state_land_hstd_val + @state_land_non_hstd_val + 
							   @state_imprv_hstd_val + @state_imprv_non_hstd_val + 
							   @state_ag_use_val + @state_timber_use
				set @state_market        = @state_land_hstd_val + @state_land_non_hstd_val + 
							   @state_imprv_hstd_val + @state_imprv_non_hstd_val + 
							   @state_ag_market + @state_timber_market
				
			end
			else
			begin
				set @state_appraised_val = @state_assessed_val
				set @state_market        = @state_assessed_val
			end

			-- apply the entity owner percentage to the new value & acres
			if (@pv_assessed_val > 0  and @assessed_val <= @pv_assessed_val)
			begin
				set @pvs_imp_new_val      = @pvs_imp_new_val * (@assessed_val/@pv_assessed_val)
				set @pvs_pp_new_val       = @pvs_pp_new_val * (@assessed_val/@pv_assessed_val)
				set @pvs_land_new_val     = @pvs_land_new_val * (@assessed_val/@pv_assessed_val)
				set @pvs_ag_acres         = @pvs_ag_acres * (@assessed_val/@pv_assessed_val)		
				set @pvs_acres            = @pvs_acres * (@assessed_val/@pv_assessed_val)	
				set @pvs_effective_front  = @pvs_effective_front * (@assessed_val/@pv_assessed_val)			
			end


			/*if (@state_market > 0)
			begin
				set @new_value = ((@pvs_imp_new_val + @pvs_pp_new_val + @pvs_land_new_val)/@state_market) * @state_taxable_val
			end
			else
			begin
				set @new_value = 0
			end*/

			set @new_value = @pvs_imp_new_val + @pvs_pp_new_val + @pvs_land_new_val

			if (@imprv_hstd_val + @land_hstd_val > 0)
			begin
				set @hs_pct = (@state_imprv_hstd_val + @state_land_hstd_val)/(@imprv_hstd_val + @land_hstd_val) 
			end
			else
			begin
				set @hs_pct = 0
			end
			
			if (@assessed_val > 0)
			begin
				set @state_cd_pct = @state_assessed_val/@assessed_val
			end
			else
			begin
				set @state_cd_pct = 0
			end

			insert into property_owner_entity_state_cd with(tablock)
			(
			prop_id,     
			year,        
			sup_num,     
			owner_id,    
			entity_id,   
			state_cd, 
			ag_use_val,       
			ag_market,               
			imprv_hstd_val,   
			imprv_non_hstd_val, 
			land_hstd_val,    
			land_non_hstd_val,
 			timber_use,       
			timber_market,    

			assessed_val,
			ten_percent_cap,
			appraised_val,
			market,
			new_val,
			ag_acres,
			arb_status,
			homestead_val,
			taxable_val,
			front_foot,
			acres,
			hs_pct,
			state_cd_pct,
			tax_increment_imprv_val,
			tax_increment_land_val
			)
			values
			(
			@prop_id,     
			@sup_yr, 
			@sup_num,     
			@owner_id,    
			@entity_id,   
			@pvs_state_cd,
			@state_ag_use_val,   
			@state_ag_market, 
			@state_imprv_hstd_val,  
			@state_imprv_non_hstd_val,
			@state_land_hstd_val,    
			@state_land_non_hstd_val, 
			@state_timber_use,
			@state_timber_market,
			@state_assessed_val,
			@state_ten_percent_cap,
			@state_appraised_val,
			@state_market,
			@new_value,
			@pvs_ag_acres,
			@arb_status,
			@state_imprv_hstd_val + @state_land_hstd_val,
			@state_taxable_val,
			@pvs_effective_front,
			@pvs_acres,
			@hs_pct,
			@state_cd_pct,
			@state_tax_increment_imprv_val,
			@state_tax_increment_land_val
			)


			select @count = @count + 1

			fetch next from property_val_state_cd_cursor into
			   @pvs_assessed_val,      
	   		   @pvs_land_hstd_val,    
	   		   @pvs_land_non_hstd_val, 
	   		   @pvs_imprv_hstd_val,  
	   		   @pvs_imprv_non_hstd_val, 
           		   @pvs_ag_market,        
          		   @pvs_ag_use_val,       
                           @pvs_timber_market,    
                           @pvs_timber_use,
			   @pvs_ten_percent_cap,
			   @pvs_state_cd,
			   @pvs_imp_new_val,
			   @pvs_ag_acres,
			   @pvs_pp_new_val,
			   @pvs_land_new_val,
			   @pvs_effective_front,
			   @pvs_acres
		
		end


		close property_val_state_cd_cursor
		deallocate property_val_state_cd_cursor 
		
	end
	else
	begin
		-- if no state code values and the assessed value > 0 
		if (@assessed_val  <> 0 or 
		    @taxable_val   <> 0 or      
		    @assessed_val   <> 0 or       
		    @land_hstd_val   <> 0 or     
		    @land_non_hstd_val   <> 0 or  
		    @imprv_hstd_val   <> 0 or   
		    @imprv_non_hstd_val   <> 0 or  
		    @ag_market   <> 0 or         
		    @ag_use_val  <> 0 or        
		    @timber_market   <> 0 or     
		    @timber_use  <> 0 or        
		    @ten_percent_cap <> 0)
		begin
			
			-- since we don't store the appraised or market we will
			-- have to calculate it
			if (@prop_type_cd = 'R' or @prop_type_cd = 'MH')
			begin
				set @appraised_val = @land_hstd_val + @land_non_hstd_val + 
						     @imprv_hstd_val + @imprv_non_hstd_val + 
						     @ag_use_val + @timber_use
				set @market        = @land_hstd_val + @land_non_hstd_val + 
						     @imprv_hstd_val + @imprv_non_hstd_val + 
						     @ag_market + @timber_market
				
			end
			else
			begin
				set @appraised_val = @assessed_val
				set @market        = @assessed_val
			end

			if (@imprv_hstd_val + @land_hstd_val > 0)
			begin
				set @hs_pct = (@imprv_hstd_val + @land_hstd_val)/(@imprv_hstd_val + @land_hstd_val) 
			end
			else
			begin
				set @hs_pct = 0
			end
			
			if (@assessed_val > 0)
			begin
				set @state_cd_pct = (@assessed_val/@assessed_val)
			end
			else
			begin
				set @state_cd_pct = 0
			end
	
			insert into property_owner_entity_state_cd with(tablock)
			(
			prop_id,     
			year,        
			sup_num,     
			owner_id,    
			entity_id,   
			state_cd, 
			ag_use_val,       
			ag_market,               
			imprv_hstd_val,   
			imprv_non_hstd_val, 
			land_hstd_val,    
			land_non_hstd_val,
 			timber_use,       
			timber_market,    
			assessed_val,
			ten_percent_cap,
			appraised_val,
			market,
			new_val,
			ag_acres,
			arb_status,
			homestead_val,
			taxable_val,
			front_foot,
			acres,
			hs_pct,
			state_cd_pct,
			tax_increment_imprv_val,
			tax_increment_land_val
			)
			values
			(
			@prop_id,     
			@sup_yr, 
			@sup_num,     
			@owner_id,    
			@entity_id,   
			'ERROR',
			@ag_use_val,   
			@ag_market, 
			@imprv_hstd_val,  
			@imprv_non_hstd_val,
			@land_hstd_val,    
			@land_non_hstd_val, 
			@timber_use,
			@timber_market,
			@assessed_val,
			@ten_percent_cap,
			@appraised_val,
			@market,
			0,
			0,
			@arb_status,
			@imprv_hstd_val + @land_hstd_val,
			@taxable_val,
			0,
			0,
			@hs_pct,
			@state_cd_pct,
			@tif_imprv_val,
			@tif_land_val
			)
		end

		-- insert an error into the entity state code table
	end



	fetch next from prop_owner_entity_val_cursor into
	@prop_id ,    
	@owner_id ,   
	@sup_num   ,  
	@sup_yr ,
	@entity_id,   
	@taxable_val,      
	@assessed_val,      
	@land_hstd_val,    
	@land_non_hstd_val, 
	@imprv_hstd_val  ,
	@imprv_non_hstd_val, 
	@ag_market        ,
	@ag_use_val      , 
	@timber_market   , 
	@timber_use       ,
	@ten_percent_cap,

	@pv_assessed_val,      
	@pv_land_hstd_val,    
	@pv_land_non_hstd_val, 
	@pv_imprv_hstd_val,  
	@pv_imprv_non_hstd_val, 
	@pv_ag_market,        
	@pv_ag_use_val,       
	@pv_timber_market,    
	@pv_timber_use,       
	@pv_ten_percent_cap,
	@prop_type_cd,
	@arb_status,
	@tif_imprv_val,
	@tif_land_val

end

close prop_owner_entity_val_cursor
deallocate prop_owner_entity_val_cursor

GO

