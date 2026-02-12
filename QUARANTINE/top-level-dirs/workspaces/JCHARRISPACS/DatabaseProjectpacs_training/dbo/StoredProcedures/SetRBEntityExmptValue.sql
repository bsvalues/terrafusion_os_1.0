







CREATE             PROCEDURE SetRBEntityExmptValue
 @input_tax_yr       int,
 @input_sup_num  int,
 @input_entity_id   int,
 @input_pacs_user_id int = 0

AS
declare @prop_id                     	int
declare @owner_id                    	int
declare @entity_id                   	int
declare @owner_tax_yr                	numeric(4)
declare @sup_tax_yr                  	numeric(4)
declare @sup_num                     	int
declare @pct_entity_prop             	numeric(5,2)
declare @pct_ownership               	numeric(5,2)
declare @apply_pct_exemption         	char(1)
declare @exemption_owner_id          	int
declare @exemption_prop_id           	int
declare @exemption_owner_tax_yr      	numeric(4)
declare @exempt_tax_yr               	numeric(4)
declare @exempt_type_cd              	char(5)
declare @exempt_type_desc		varchar(20)
declare @effective_dt       		datetime
declare @termination_dt       		datetime
declare @exemption_sup_num      	int
declare @entity_entity_id      		int
declare @entity_exmpt_type_cd      	char(5)
declare @entity_exmpt_tax_yr      	numeric(4)
declare @entity_exmpt_desc      	varchar(50)
declare @entity_special_exmpt      	char(1)
declare @entity_local_option_pct     	numeric(13,10)
declare @entity_state_mandate_amt    	numeric(14)
declare @entity_local_option_amt     	numeric(14)
declare @entity_local_option_min_amt 	numeric(14)
declare @entity_apply_pct_ownership  	char(1)
declare @prop_type_cd              	varchar(5)
declare @ten_percent_cap		numeric(14)
declare @improv_hstd_val            	numeric(14)
declare @land_hstd_val              	numeric(14)
declare @improv_non_hstd_val		numeric(14)
declare @land_non_hstd_val		numeric(14)
declare @ag_market			numeric(14)
declare @timber_market			numeric(14)
declare @appraised_val			numeric(14)
declare @property_taxable_val       	numeric(14)
declare @property_market		numeric(14)
declare @property_assessed_val      	numeric(14)
declare @property_exemption_val     	numeric(14)
declare @property_exemption_amt     	numeric(14)
declare @property_homesite_exemption_amt numeric(14)
declare @local_option_amt     		numeric(14)
declare @state_amt      		numeric(14)
declare @local_amt      		numeric(14)
declare @next_exemption_id          	int
declare @effective_month     		int
declare @effective_day      		int
declare @effective_year      		int
declare @termination_month     		int
declare @termination_day     		int
declare @termination_year     		int
declare @termination_days      		numeric(13,10)
declare @effective_days      		numeric(13,10)
declare @exmpt_type_exmpt_type_cd   	char(5)
declare @exmpt_type_desc     		varchar(50)
declare @federal_amt                	numeric(14,2)
declare @plus_oa65_amt              	numeric(14)
declare @spl_exmpt      		char(1)
declare @sup_action			char(5)
declare @sp_value_type			char(1)
declare @sp_value_option		char(1)
declare @sp_amt				numeric(14,2)
declare @sp_pct				numeric(5,2)
declare @market				numeric(14,2)
declare @property_hs_amt		numeric(14,2)
declare @ag_late_loss			numeric(14,0)

declare @ag_app_filed			char(1)

declare @entity_exmpt_local_amt		numeric(14)
declare @entity_exmpt_state_amt	numeric(14)
declare @entity_taxable_val		numeric(14)
declare @entity_owner_assessed_val	numeric(14)
declare @frz_taxable			numeric(14)
declare @frz_assessed			numeric(14)
declare @temp_use_frz			char(1)
declare @temp_frz_yr			numeric(4)
declare @temp_frz_ceiling		numeric(14,2)
declare @use_frz			char(1)
declare @frz_yr				numeric(4)
declare @frz_ceiling			numeric(14,2)
declare @actual_tax			numeric(14,2)
declare @bill_freeze_m_n_o		numeric(14,2)
declare @bill_freeze_i_n_s		numeric(14,2)
declare @bill_m_n_o			numeric(14,2)
declare @bill_i_n_s			numeric(14,2)
declare @m_n_o_tax_pct      		numeric(13,10)
declare @i_n_s_tax_pct       		numeric(13,10)
declare @prot_i_n_s_tax_pct  		numeric(13,10)
declare @tax_rate			numeric(13,10)
declare @entity_type			char(5)

declare @weed_control			char(1)
declare @weed_acres			numeric(14,4)
declare @exempt_val			numeric(14)
declare @tif_imprv_val			numeric(14)
declare @tif_land_val			numeric(14)
declare @tif_flag			char(1)
declare @arb_status			varchar(1)
declare @prorated_ex_amount		numeric(14)
declare @tax_increment_flag		char(1)

declare @ag_use			numeric(14)
declare @timb_use			numeric(14)
declare @ag_mkt			numeric(14)
declare @timb_mkt			numeric(14)
declare @ag_entity_exmpt_local_amt 	numeric(14)
declare @ag_entity_exmpt_state_amt  	numeric(14)

declare @bHS				int
declare @bDP				int
declare @bOV65				int
declare @bOV65S				int
declare @bEX				int
declare @bEXProrated			int
declare @bCanBumpDV			int

declare @hs_state_amt			numeric(14)
declare @hs_local_amt			numeric(14)
declare @dp_state_amt			numeric(14)
declare @dp_local_amt			numeric(14)
declare @ov65_state_amt			numeric(14)
declare @ov65_local_amt			numeric(14)
declare @ov65S_state_amt		numeric(14)
declare @ov65S_local_amt		numeric(14)

declare @ov65_prorate_pct		numeric(5,4)
declare @ex_prorate_pct			numeric(5,4)

set 	@m_n_o_tax_pct      = 0
set     @i_n_s_tax_pct      = 0
set	@prot_i_n_s_tax_pct = 0
set     @entity_type	    = ''
set	@weed_control       = ''

/* select the tax rates for the entity */
select 	@m_n_o_tax_pct      = tax_rate.m_n_o_tax_pct,
       	@i_n_s_tax_pct      = tax_rate.i_n_s_tax_pct,
	@prot_i_n_s_tax_pct = tax_rate.prot_i_n_s_tax_pct,
	@entity_type	    = entity_type_cd,
	@weed_control       = entity.weed_control
from   tax_rate, entity
where  (tax_rate.entity_id   = @input_entity_id)
and    (tax_rate.tax_rate_yr = @input_tax_yr)
and    (entity.entity_id     = tax_rate.entity_id)


DECLARE PROPERTY_EXMPT CURSOR FORWARD_ONLY STATIC
FOR select 	#property_val.prop_type_cd,
		#property_val.prop_id,
		#property_val.owner_id,
		#property_val.pct_ownership,
		#property_val.apply_pct_exemptions,
		#entity_prop_assoc.entity_prop_pct,
	   	IsNull(#property_val.market, 0),
	  	IsNull(#property_val.assessed_val, 0),
	   	IsNull(#property_val.appraised_val, 0),
	   	IsNull(#property_val.imprv_hstd_val, 0),
	   	IsNull(#property_val.imprv_non_hstd_val, 0),
	   	IsNull(#property_val.land_hstd_val, 0),
	   	IsNull(#property_val.land_non_hstd_val, 0),
	  	IsNull(#property_val.ten_percent_cap, 0),
	   	#property_val.sup_action,
		IsNull(#property_val.ag_use_val, 0),
		IsNull(#property_val.timber_use, 0),
		IsNull(#property_val.ag_market, 0),
		IsNull(#property_val.timber_market, 0),
		IsNull(#property_val.tif_imprv_val, 0),
		IsNull(#property_val.tif_land_val, 0),
		#property_val.tif_flag,
		#property_val.ag_app_filed,
		#property_val.ag_late_loss
		from #property_val, #entity_prop_assoc
		where #property_val.prop_id = #entity_prop_assoc.prop_id
		and   #property_val.sup_num = #entity_prop_assoc.sup_num
		and   #property_val.prop_val_yr = #entity_prop_assoc.tax_yr
		and   #entity_prop_assoc.entity_id   = @input_entity_id
		and   #property_val.prop_val_yr = @input_tax_yr
		and   #property_val.sup_num     = @input_sup_num

OPEN PROPERTY_EXMPT

FETCH NEXT FROM PROPERTY_EXMPT into 
@prop_type_cd, @prop_id, @owner_id, @pct_ownership, 
@apply_pct_exemption, @pct_entity_prop, @property_market,
@property_assessed_val, @appraised_val, @improv_hstd_val, 
@improv_non_hstd_val, @land_hstd_val, @land_non_hstd_val, 
@ten_percent_cap, @sup_action, @ag_use, @timb_use, @ag_mkt, 
@timb_mkt, @tif_imprv_val, @tif_land_val, @tif_flag, @ag_app_filed, @ag_late_loss

while (@@FETCH_STATUS = 0)
begin 
	set @entity_exmpt_local_amt = 0
	set @entity_exmpt_state_amt = 0

	set @land_hstd_val 	 = @land_hstd_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @land_non_hstd_val 	 = @land_non_hstd_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @improv_hstd_val 	 = @improv_hstd_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @improv_non_hstd_val = @improv_non_hstd_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @ag_market 		 = @ag_mkt * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @ag_use 		 = @ag_use * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @timber_market 	 = @timb_mkt * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @timb_use 		 = @timb_use * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @ten_percent_cap 	 = @ten_percent_cap * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @tif_imprv_val 	 = @tif_imprv_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @tif_land_val 	 = @tif_land_val * (@pct_ownership/100) * (@pct_entity_prop/100)
	set @tax_increment_flag  = @tif_flag
	set @ag_late_loss        = @ag_late_loss * (@pct_ownership/100) * (@pct_entity_prop/100)

	if (@prop_type_cd = 'R' or @prop_type_cd = 'MH')
	begin
		set @property_assessed_val = @improv_hstd_val + @improv_non_hstd_val + @land_hstd_val + @land_non_hstd_val +
					     @ag_use + @timb_use - @ten_percent_cap
		set @property_market       = @improv_hstd_val + @improv_non_hstd_val + @land_hstd_val + @land_non_hstd_val +
					     @ag_market + @timber_market
	end
	else
	begin
		set @property_assessed_val = @property_assessed_val * (@pct_entity_prop/100) * (@pct_ownership/100)
		set @property_market	   = @property_market * (@pct_entity_prop/100) * (@pct_ownership/100) 
	end
	
	set @market                       	= @appraised_val
   	set @property_homesite_exemption_amt 	= (@improv_hstd_val + @land_hstd_val) - @ten_percent_cap
   	set @property_exemption_amt 	  	= @property_assessed_val 
	set @property_taxable_val		= @property_assessed_val 
	set @property_hs_amt			= (@improv_hstd_val + @land_hstd_val) - @ten_percent_cap



	set @bHS     = 0
	set @bDP     = 0
	set @bOV65   = 0
	set @bOV65S  = 0

	set @bEX         = 0
	set @bEXProrated = 0	
	set @bCanBumpDV  = 0

	set @use_frz     = 'F'
	set @frz_ceiling = NULL
	set @frz_yr	 = NULL
	
	if exists (select * from #property_exemption 
	   	   where prop_id = @prop_id
		   and   owner_id = @owner_id
		   and   sup_num  = @input_sup_num
		   and   owner_tax_yr =  @input_tax_yr )

	begin
		DECLARE PROP_PROPERTY_EXMPT CURSOR FORWARD_ONLY STATIC
		FOR select #property_exemption.exmpt_type_cd, exmpt_order.exmpt_type_desc, 
			   #property_exemption.effective_dt,  #property_exemption.termination_dt,
			   IsNull(#property_exemption.use_freeze, 'F'), #property_exemption.freeze_ceiling, #property_exemption.freeze_yr 
		    from #property_exemption, exmpt_order 
	   	    where #property_exemption.prop_id      = @prop_id
		    and   #property_exemption.owner_id     = @owner_id
		    and   #property_exemption.sup_num      = @input_sup_num
		    and   #property_exemption.owner_tax_yr = @input_tax_yr
		    and   exmpt_order.exmpt_type_cd    	   = #property_exemption.exmpt_type_cd 
		    and   exmpt_order.entity_type = 'R'
		    order by exmpt_order.exmpt_order

		open PROP_PROPERTY_EXMPT
		fetch next from PROP_PROPERTY_EXMPT into @exempt_type_cd, @exempt_type_desc, @effective_dt, @termination_dt,
							 @temp_use_frz,  @temp_frz_ceiling, @temp_frz_yr

		while (@@FETCH_STATUS = 0)
		begin

			/* initialize variables */  
		 	set	@entity_exmpt_type_cd        = ''
		        set    	@entity_exmpt_tax_yr         = 0
		        set     @entity_special_exmpt        = ''
		        set    	@entity_local_option_pct     = 0
		        set     @entity_state_mandate_amt    = 0
		        set     @entity_local_option_min_amt = 0
		        set    	@entity_local_option_amt     = 0
		        set    	@entity_apply_pct_ownership  = 0
			set	@federal_amt		     = 0
			set	@plus_oa65_amt		     = 0
			set	@state_amt 		     = 0
			set	@local_amt 		     = 0
			set	@sp_value_type    	     = ''
		        set    	@sp_value_option  	     = ''
		        set     @sp_pct		  	     = 0
			set	@sp_amt		  	     = 0


			/***************************************/
			/********** get prorate pct ************/
			/***************************************/
			if ((@exempt_type_cd = 'OV65') or (@exempt_type_cd = 'OV65S'))
			begin
				set @bCanBumpDV = 1
				set @bCanBumpDV = 1
				set @use_frz     = @temp_use_frz
				set @frz_ceiling = @temp_frz_ceiling
				set @frz_yr	 = @temp_frz_yr
			end
			
										
			if ((@exempt_type_cd = 'OV65') or 
			    (@exempt_type_cd = 'OV65S') and 
			     exists (select * from entity_exmpt 
				    where entity_exmpt.entity_id    = @input_entity_id
				    and   entity_exmpt.exmpt_tax_yr = @input_tax_yr
				    and   entity_exmpt.exmpt_type_cd = @exempt_type_cd))
			
			begin
				set @bOV65      = 1

				select 	@entity_local_option_pct     = entity_exmpt.local_option_pct,
			              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
			             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
			            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
			            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
			       	from  entity_exmpt              
			     	where (entity_exmpt.exmpt_type_cd = @exempt_type_cd)
				and   (entity_exmpt.entity_id	  = @input_entity_id)
				and   (entity_exmpt.exmpt_tax_yr  = @input_tax_yr)
			  
				if (@apply_pct_exemption = 'Y')
		     		begin
		  			set @entity_state_mandate_amt = @entity_state_mandate_amt * (@pct_ownership/100)
		     		end
		
		     		if (@property_homesite_exemption_amt > @entity_state_mandate_amt)
		     		begin
		               		set @state_amt = @entity_state_mandate_amt
		     		end
		        	else
		    		begin
		  			if (@property_homesite_exemption_amt > 0)
		        		begin
		      				set @state_amt = @property_homesite_exemption_amt
		  			end
		  			else
		  			begin
		      				set @state_amt = 0
		  			end
		
		     		end
		     
				select @property_homesite_exemption_amt = @property_homesite_exemption_amt - @state_amt
		     		select @property_exemption_amt 		= @property_exemption_amt - @state_amt

				/* calculate the local option amt */
		     		if (@entity_local_option_pct > 0)
		     		begin
		    			--set @local_option_amt =  @property_hs_amt * (@entity_local_option_pct/100) --OLD
		  			set @local_option_amt =  (@property_hs_amt + @ten_percent_cap) * (@entity_local_option_pct/100) --NEW
		
					if (@local_option_amt < @entity_local_option_min_amt)
		  			begin
		            			set @local_option_amt = @entity_local_option_min_amt
		   			end
		     		end
		     		else
		     		begin
					select @local_option_amt = @entity_local_option_amt
		     		
					if (@apply_pct_exemption = 'Y')
		     			begin
		  				set @local_option_amt = @local_option_amt * (@pct_ownership/100)
		     			end
				end     
				
		
				if (@property_homesite_exemption_amt > @local_option_amt)
		     		begin
		               		set @local_amt = @local_option_amt
		     		end
		        	else
		     		begin
		  			if (@property_homesite_exemption_amt > 0)
		         		begin
		      				set @local_amt = @property_homesite_exemption_amt
		  			end
		  			else
		  			begin
		      				set @local_amt = 0
		  			end
		     		end
		     
				set @property_homesite_exemption_amt = @property_homesite_exemption_amt - @local_amt
				set @property_exemption_amt 		= @property_exemption_amt - @local_amt

				if @input_pacs_user_id = 0
				begin
					insert into property_entity_exemption
					(
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
				else
				begin
					insert into property_entity_exemption_preview
					(
					pacs_user_id,
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 

					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@input_pacs_user_id,
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
	
			end

			
			/* only process the dp exemption, if the OV65 does not exists */
			if ( (@bOV65 = 0) and 
			     (@exempt_type_cd = 'DP') and 
			     exists (select * from entity_exmpt 
				    where entity_exmpt.entity_id    = @input_entity_id
				    and   entity_exmpt.exmpt_tax_yr = @input_tax_yr
				    and   entity_exmpt.exmpt_type_cd = @exempt_type_cd))
			
			begin
	
				set @bOV65      = 1

				select 	@entity_local_option_pct     = entity_exmpt.local_option_pct,
			              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
			             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
			   	@entity_local_option_amt     = entity_exmpt.local_option_amt,
			            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
			       	from  entity_exmpt              
			     	where (entity_exmpt.exmpt_type_cd = @exempt_type_cd)
				and   (entity_exmpt.entity_id	  = @input_entity_id)
				and   (entity_exmpt.exmpt_tax_yr  = @input_tax_yr)
			  
				if (@apply_pct_exemption = 'Y')
		     		begin
		  			set @entity_state_mandate_amt = @entity_state_mandate_amt * (@pct_ownership/100)
		     		end
		
		     		if (@property_homesite_exemption_amt > @entity_state_mandate_amt)
		     		begin
		               		set @state_amt = @entity_state_mandate_amt
		     		end
		        	else
		    		begin
		  			if (@property_homesite_exemption_amt > 0)
		        		begin
		      				set @state_amt = @property_homesite_exemption_amt
		  			end
		  			else
		  			begin
		      				set @state_amt = 0
		  			end
		
		     		end
		     
				select @property_homesite_exemption_amt = @property_homesite_exemption_amt - @state_amt
		     		select @property_exemption_amt 		= @property_exemption_amt - @state_amt

				/* calculate the local option amt */
		     		if (@entity_local_option_pct > 0)
		     		begin
		    			--set @local_option_amt =  @property_hs_amt * (@entity_local_option_pct/100) --OLD
					set @local_option_amt =  (@property_hs_amt + @ten_percent_cap) * (@entity_local_option_pct/100) --NEW
		  
		
					if (@local_option_amt < @entity_local_option_min_amt)
		  			begin
		            			set @local_option_amt = @entity_local_option_min_amt
		   			end
		     		end
		     		else
		
		     		begin
		  			select @local_option_amt = @entity_local_option_amt
		     		end
		     
				if (@apply_pct_exemption = 'Y')
		     		begin
		  			set @local_option_amt = @local_option_amt * (@pct_ownership/100)
		     		end
		
				if (@property_homesite_exemption_amt > @local_option_amt)
		
		     		begin
		               		set @local_amt = @local_option_amt
		     		end
		        	else
		     		begin
		  			if (@property_homesite_exemption_amt > 0)
		         		begin
		      				set @local_amt = @property_homesite_exemption_amt
		  			end
		  			else
		  			begin
		      				set @local_amt = 0
		  			end
		     		end
		     
				set @property_homesite_exemption_amt = @property_homesite_exemption_amt - @local_amt
				set @property_exemption_amt 		= @property_exemption_amt - @local_amt

				if @input_pacs_user_id = 0
				begin
					insert into property_entity_exemption
					(
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
				else
				begin
					insert into property_entity_exemption_preview
					(
					pacs_user_id,
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@input_pacs_user_id,
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
	
			end

			if ( @exempt_type_cd = 'HS' and 
			     exists (select * from entity_exmpt 
				    where entity_exmpt.entity_id    = @input_entity_id
				    and   entity_exmpt.exmpt_tax_yr = @input_tax_yr
				    and   entity_exmpt.exmpt_type_cd = @exempt_type_cd))
			
			begin
	
				select 	@entity_local_option_pct     = entity_exmpt.local_option_pct,
			              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
			             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
			            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
			            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
			       	from  entity_exmpt              
			     	where (entity_exmpt.exmpt_type_cd = @exempt_type_cd)
				and   (entity_exmpt.entity_id	  = @input_entity_id)

				and   (entity_exmpt.exmpt_tax_yr  = @input_tax_yr)

				/* only process the HS State if no OV65 exists on the property */
				if (@bOV65 = 0)
				begin
				  
					if (@apply_pct_exemption = 'Y')
			     		begin
			  			set @entity_state_mandate_amt = @entity_state_mandate_amt * (@pct_ownership/100)
			     		end
			
			   		if (@property_homesite_exemption_amt > @entity_state_mandate_amt)
			     		begin
			               		set @state_amt = @entity_state_mandate_amt
			     		end
			        		else
			    		begin
			  			if (@property_homesite_exemption_amt > 0)
			        		begin
			      				set @state_amt = @property_homesite_exemption_amt
			  			end
			  			else
			  			begin
			      				set @state_amt = 0
			  			end
			
			     		end
			     
					select @property_homesite_exemption_amt = @property_homesite_exemption_amt - @state_amt
			     		select @property_exemption_amt 		= @property_exemption_amt - @state_amt
				end

				/* calculate the local option amt */
		     		if (@entity_local_option_pct > 0)
		     		begin
		    			--set @local_option_amt =  @property_hs_amt * (@entity_local_option_pct/100) --OLD
					set @local_option_amt =  (@property_hs_amt + @ten_percent_cap) * (@entity_local_option_pct/100) --NEW
		  
		
					if (@local_option_amt < @entity_local_option_min_amt)
		  			begin
		            			set @local_option_amt = @entity_local_option_min_amt
		   			end
		     		end
		     		else
		
		     		begin
		  			select @local_option_amt = @entity_local_option_amt
		     		end
		     
				-- commented out per tj @ collin cad. this is not valid
				-- on local options
				--if (@apply_pct_exemption = 'Y')
		     		--begin
		  		--	set @local_option_amt = @local_option_amt * (@pct_ownership/100)
		     		--end
		
				if (@property_homesite_exemption_amt > @local_option_amt)
		
		     		begin
		               		set @local_amt = @local_option_amt
		     		end
		        	else
		     		begin
		  			if (@property_homesite_exemption_amt > 0)
		         		begin
		      				set @local_amt = @property_homesite_exemption_amt
		  			end
		  			else
		  			begin
		      				set @local_amt = 0
		  			end
		     		end
		     
				set @property_homesite_exemption_amt = @property_homesite_exemption_amt - @local_amt
				set @property_exemption_amt 		= @property_exemption_amt - @local_amt

				if @input_pacs_user_id = 0
				begin
					insert into property_entity_exemption
					(
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
				else
				begin
					insert into property_entity_exemption_preview
					(
					pacs_user_id,
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@input_pacs_user_id,
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
	
			end

		
			if (@exempt_type_cd = 'DV1' or 
			    @exempt_type_cd = 'DV2' or
			    @exempt_type_cd = 'DV3' or
			    @exempt_type_cd = 'DV4' or
			    @exempt_type_cd = 'DV1S' or 
			    @exempt_type_cd = 'DV2S' or
			    @exempt_type_cd = 'DV3S' or
			    @exempt_type_cd = 'DV4S')
			begin
				/* process the properties dv1  */
			   	select 	@federal_amt		     = exmpt_type.federal_amt,
					@plus_oa65_amt		     = exmpt_type.plus_oa65_amt
			       	from  exmpt_type      
			     	where exmpt_type.exmpt_type_cd = @exempt_type_cd
			  
			 		
		     		if (@bCanBumpDV = 1)
		     		begin
		               		set @federal_amt = @federal_amt + @plus_oa65_amt
		     		end
		
				if (@apply_pct_exemption = 'Y')
		     		begin
		  			set @federal_amt = @federal_amt * (@pct_ownership/100)
		     		end
		  
		            	if (@property_exemption_amt > @federal_amt)
		     		begin
		               		set @state_amt = @federal_amt
		     		end
		      		else
		     		begin
		  			if (@property_exemption_amt > 0)
		         		begin
		      				set @state_amt = @property_exemption_amt
		
		  			end
		  			else
		  			begin
		      				set @state_amt = 0
		  			end
		     		end
		     			  		
				/* calculate the amount of the dv exemption that is non homesite */
				declare @nhs_exemption_amt	numeric(14)
				set @nhs_exemption_amt = @property_exemption_amt - @property_homesite_exemption_amt

    			    		
				set @property_exemption_amt = @property_exemption_amt - @state_amt

				if (@state_amt > @nhs_exemption_amt)
				begin
					set @property_homesite_exemption_amt = @property_homesite_exemption_amt - (@state_amt - @nhs_exemption_amt)
		     		end
		     	
				/* no local amount on federal exemption */
		     		set @local_amt = 0

				if @input_pacs_user_id = 0
				begin		
					insert into property_entity_exemption
					(
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
				else
				begin
					insert into property_entity_exemption_preview
					(
					pacs_user_id,
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt
					)
					values
					(
					@input_pacs_user_id,
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt
					)
				end
			end


			
			if ((@exempt_type_cd = 'AB' or 
			     @exempt_type_cd = 'EN' or
			     @exempt_type_cd = 'FR' or
			     @exempt_type_cd = 'HT' or
			     @exempt_type_cd = 'PC' or 
			     @exempt_type_cd = 'PRO' or
			     @exempt_type_cd = 'SO') and
			    exists (select * from  #property_exemption, property_special_entity_exemption             
			     	where (#property_exemption.prop_id       = @prop_id)
			     	and   (#property_exemption.owner_id      = @owner_id)
			     	and   (#property_exemption.owner_tax_yr  = @input_tax_yr)
			     	and   (#property_exemption.sup_num       = @input_sup_num)
			     	and   (#property_exemption.exmpt_type_cd = @exempt_type_cd)
				and   (#property_exemption.prop_id 	= property_special_entity_exemption.prop_id)
				and   (#property_exemption.owner_id 	= property_special_entity_exemption.owner_id)
				and   (#property_exemption.sup_num 	= property_special_entity_exemption.sup_num)
				and   (#property_exemption.owner_tax_yr 	= property_special_entity_exemption.owner_tax_yr)
				and   (#property_exemption.exmpt_type_cd = property_special_entity_exemption.exmpt_type_cd)
				and   (property_special_entity_exemption.entity_id = @input_entity_id)))
			begin
				/* initialize variables */
			   	select 	@sp_value_type	     = #property_exemption.sp_value_type,
					@sp_value_option     = #property_exemption.sp_value_option,
					@sp_pct		     = property_special_entity_exemption.sp_pct,
					@sp_amt		     = property_special_entity_exemption.sp_amt	
			       	from  #property_exemption, property_special_entity_exemption             
			     	where (#property_exemption.prop_id       = @prop_id)
			     	and   (#property_exemption.owner_id      = @owner_id)
			     	and   (#property_exemption.owner_tax_yr  = @input_tax_yr)
			     	and   (#property_exemption.sup_num       = @input_sup_num)
			     	and   (#property_exemption.exmpt_type_cd = @exempt_type_cd)
				and   (#property_exemption.prop_id 	= property_special_entity_exemption.prop_id)
				and   (#property_exemption.owner_id 	= property_special_entity_exemption.owner_id)
				and   (#property_exemption.sup_num 	= property_special_entity_exemption.sup_num)
				and   (#property_exemption.owner_tax_yr 	= property_special_entity_exemption.owner_tax_yr)
				and   (#property_exemption.exmpt_type_cd = property_special_entity_exemption.exmpt_type_cd)
				and   (property_special_entity_exemption.entity_id = @input_entity_id)
			  
			 
				if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
				begin
			
					if (@sp_value_type = 'P')
			
					begin
			
						if (@sp_value_option = 'L')
						begin
							select @local_amt = (@land_hstd_val + @land_non_hstd_val + @ag_market + @timber_market) * (@sp_pct/100)
						end 
						else if (@sp_value_option = 'I')
						begin
							select @local_amt = (@improv_hstd_val + @improv_non_hstd_val) * (@sp_pct/100)
						end
						else if (@sp_value_option = 'M')
						begin

							select @local_amt = @market * (@sp_pct/100)
						end
					end
					else
					begin
						select @local_amt = @sp_amt
					end
			
					if (@apply_pct_exemption = 'Y')
			     		begin
			  			select @local_amt = @local_amt * (@pct_ownership/100)
			     		end
			
					if (@property_exemption_amt > @local_amt)
			     		begin
			               		select @local_amt = @local_amt
			     		end
			        		else
			    		begin
			  			if (@property_exemption_amt > 0)
			        			begin
			      				select @local_amt = @property_exemption_amt
			  			end
			  			else
			  			begin
			      				select @local_amt = 0
			  			end
			     		end
			     
					select @property_exemption_amt = @property_exemption_amt - @local_amt
				
					if @input_pacs_user_id = 0
					begin
						insert into property_entity_exemption
						(
						prop_id,     
						owner_id,    
						sup_num,     
						exmpt_tax_yr, 
						owner_tax_yr, 
						exmpt_type_cd, 
						entity_id,   
						state_amt,        
						local_amt
						)
						values
						(
						@prop_id,
						@owner_id,
						@input_sup_num,
						@input_tax_yr,
						@input_tax_yr,
						@exempt_type_cd,
						@input_entity_id,
						@state_amt,
						@local_amt
						)
					end
					else
					begin
						insert into property_entity_exemption_preview
						(
						pacs_user_id,
						prop_id,     
						owner_id,    
						sup_num,     
						exmpt_tax_yr, 
						owner_tax_yr, 
						exmpt_type_cd, 
						entity_id,   
						state_amt,        
						local_amt
						)
						values
						(
						@input_pacs_user_id,
						@prop_id,
						@owner_id,
						@input_sup_num,
						@input_tax_yr,
						@input_tax_yr,
						@exempt_type_cd,
						@input_entity_id,
						@state_amt,
						@local_amt
						)
					end
				end
			end

			
			if ((@exempt_type_cd = 'EX366') and
			    exists (select * from  #property_exemption, property_special_entity_exemption             
			     	where (#property_exemption.prop_id       = @prop_id)
			     	and   (#property_exemption.owner_id      = @owner_id)
			     	and   (#property_exemption.owner_tax_yr  = @input_tax_yr)
			     	and   (#property_exemption.sup_num       = @input_sup_num)
			     	and   (#property_exemption.exmpt_type_cd = @exempt_type_cd)
				and   (#property_exemption.prop_id 	= property_special_entity_exemption.prop_id)
				and   (#property_exemption.owner_id 	= property_special_entity_exemption.owner_id)
				and   (#property_exemption.sup_num 	= property_special_entity_exemption.sup_num)
				and   (#property_exemption.owner_tax_yr 	= property_special_entity_exemption.owner_tax_yr)
				and   (#property_exemption.exmpt_type_cd = property_special_entity_exemption.exmpt_type_cd)
				and   (property_special_entity_exemption.entity_id = @input_entity_id)))
			begin
								
			   	select 	@exempt_type_cd	     = #property_exemption.exmpt_type_cd,          
			       		@effective_dt	     = #property_exemption.sp_date_approved,                   
			       		@termination_dt	     = #property_exemption.sp_expiration_date,
					@sp_value_type	     = #property_exemption.sp_value_type,
					@sp_value_option     = #property_exemption.sp_value_option,
					@sp_pct		     = property_special_entity_exemption.sp_pct,
					@sp_amt		     = property_special_entity_exemption.sp_amt	
			       	from  #property_exemption, property_special_entity_exemption             
			     	where (#property_exemption.prop_id       = @prop_id)
			     	and   (#property_exemption.owner_id      = @owner_id)
			     	and   (#property_exemption.owner_tax_yr  = @input_tax_yr)
			     	and   (#property_exemption.sup_num       = @input_sup_num)
			     	and   (#property_exemption.exmpt_type_cd = 'EX366')
				and   (#property_exemption.prop_id 	= property_special_entity_exemption.prop_id)
				and   (#property_exemption.owner_id 	= property_special_entity_exemption.owner_id)
				and   (#property_exemption.sup_num 	= property_special_entity_exemption.sup_num)
				and   (#property_exemption.owner_tax_yr 	= property_special_entity_exemption.owner_tax_yr)
				and   (#property_exemption.exmpt_type_cd = property_special_entity_exemption.exmpt_type_cd)
				and   (property_special_entity_exemption.entity_id = @input_entity_id)
			  
			 
				if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
				begin
					select @bEX = 1
			 	
					if (@prop_type_cd = 'MH' or @prop_type_cd = 'R')
					begin
						set @state_amt = @property_market -  (@property_assessed_val - @property_exemption_amt)

					end
					else
					begin
			      			set @state_amt = @property_assessed_val -  (@property_assessed_val - @property_exemption_amt)
					end
			     		
					if (@apply_pct_exemption = 'Y')
			     		begin
			  			set @state_amt = @state_amt * (@pct_ownership/100)
			     		end
			 
			     		set @property_exemption_amt = @property_exemption_amt - @state_amt
			       		set @local_amt = 0
					
					if @input_pacs_user_id = 0
					begin
						insert into property_entity_exemption
						(
						prop_id,     
						owner_id,    
						sup_num,     
						exmpt_tax_yr, 
						owner_tax_yr, 
						exmpt_type_cd, 
						entity_id,   
						state_amt,        
						local_amt
						)
						values
						(
						@prop_id,
						@owner_id,
						@input_sup_num,
						@input_tax_yr,
						@input_tax_yr,
						@exempt_type_cd,
						@input_entity_id,
						@state_amt,
						@local_amt
						)
					end
					else
					begin
						insert into property_entity_exemption_preview
						(
						pacs_user_id,
						prop_id,     
						owner_id,    
						sup_num,     
						exmpt_tax_yr, 
						owner_tax_yr, 
						exmpt_type_cd, 
						entity_id,   
						state_amt,        
						local_amt
						)
						values
						(
						@input_pacs_user_id,
						@prop_id,
						@owner_id,
						@input_sup_num,
						@input_tax_yr,
						@input_tax_yr,
						@exempt_type_cd,
						@input_entity_id,
						@state_amt,
						@local_amt
						)
					end
			
				end
			end


			if (@exempt_type_desc = 'EX')
			begin

				set @bEX = 1

				exec GetProratePct @effective_dt,
					           @termination_dt,
						   @input_tax_yr,
						   @ex_prorate_pct output

				if (@ex_prorate_pct <> 1)
				begin
					set @bEX = 0
				end
 
	
				if (@prop_type_cd = 'MH' or @prop_type_cd = 'R')
				begin
					/* we will only use the assessed value on ex with ag value and prorated */
					if ( ((@ag_mkt > @ag_use) or (@timb_mkt > @timb_use)) and @ex_prorate_pct <> 1)
					begin
						set @state_amt = @property_assessed_val -  (@property_assessed_val - @property_exemption_amt)
					end
					else
					begin
						set @state_amt = @property_market -  (@property_assessed_val - @property_exemption_amt)
					end
				end
				else
				begin
		      			set @state_amt = @property_assessed_val -  (@property_assessed_val - @property_exemption_amt)
				end
		     		
				if (@apply_pct_exemption = 'Y')
		     		begin
		  			set @state_amt = @state_amt * (@pct_ownership/100)
		     		end
		 
		     		/* multiply by proration percent */
		     		set @state_amt = @state_amt * @ex_prorate_pct
		     		set @local_amt = 0
		
				set @property_exemption_amt = @property_exemption_amt - @state_amt
				set @prorated_ex_amount = @state_amt
				
				if @input_pacs_user_id = 0
				begin
					insert into property_entity_exemption
					(
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt,
					prorate_pct
					)
					values
					(
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt,
					@ex_prorate_pct
					)
				end
				else
				begin
					insert into property_entity_exemption_preview
					(
					pacs_user_id,
					prop_id,     
					owner_id,    
					sup_num,     
					exmpt_tax_yr, 
					owner_tax_yr, 
					exmpt_type_cd, 
					entity_id,   
					state_amt,        
					local_amt,
					prorate_pct
					)
					values
					(
					@input_pacs_user_id,
					@prop_id,
					@owner_id,
					@input_sup_num,
					@input_tax_yr,
					@input_tax_yr,
					@exempt_type_cd,
					@input_entity_id,
					@state_amt,
					@local_amt,
					@ex_prorate_pct
					)
				end
			end


			/* update exemption variables */
			set @entity_exmpt_local_amt = @entity_exmpt_local_amt + @local_amt
			set @entity_exmpt_state_amt = @entity_exmpt_state_amt + @state_amt


			fetch next from PROP_PROPERTY_EXMPT into @exempt_type_cd, @exempt_type_desc, @effective_dt, @termination_dt,
								 @temp_use_frz,  @temp_frz_ceiling, @temp_frz_yr

		end

		close PROP_PROPERTY_EXMPT
		deallocate PROP_PROPERTY_EXMPT

	
	end

 

	/****************************************************/
	/************** BUILD TAXABLE ***********************/
	/****************************************************/
	if (@sup_action <> 'D') or (@sup_action is null)
	begin
		
		if ((@prop_type_cd = 'R' or @prop_type_cd = 'MH') 
		     and @bEX = 1
		     and @property_market > 0)
		begin
			if ( ((@ag_mkt > @ag_use) or (@timb_mkt > @timb_use)) and
			     @ex_prorate_pct <> 1)
			begin
				set @entity_owner_assessed_val = @property_assessed_val
				set @entity_taxable_val = (@property_assessed_val - @entity_exmpt_local_amt - @entity_exmpt_state_amt)	
			end
			else
			begin
				set @entity_owner_assessed_val = @property_market
				set @entity_taxable_val = (@property_market - @entity_exmpt_local_amt - @entity_exmpt_state_amt)	
			end
		end
		else
		begin
			select @entity_owner_assessed_val = @property_assessed_val
			set @entity_taxable_val           = (@property_assessed_val - @entity_exmpt_local_amt - @entity_exmpt_state_amt)	
		end
		if ((@use_frz = 'T' ) and (@use_frz is not null and @frz_ceiling  is not null and @frz_yr is not null) and (@entity_type = 'S'))
		begin


			set @frz_assessed = ((@improv_hstd_val + @land_hstd_val - @ten_percent_cap))
			set @frz_taxable  = (@frz_assessed - @entity_exmpt_local_amt - @entity_exmpt_state_amt)

			set @bill_freeze_m_n_o = (((@improv_hstd_val + @land_hstd_val  - @ten_percent_cap )) - (@entity_exmpt_local_amt + @entity_exmpt_state_amt))/100 *  @m_n_o_tax_pct
			set @bill_freeze_i_n_s   = (((@improv_hstd_val + @land_hstd_val  - @ten_percent_cap )) -  (@entity_exmpt_local_amt + @entity_exmpt_state_amt))/100 *  @i_n_s_tax_pct

			/* check to see if current taxes are greater then freeze taxes if so, use the freeze values */
				if ((@frz_ceiling < (@bill_freeze_m_n_o + @bill_freeze_i_n_s))
 				and (convert(int, @frz_yr) <= @input_tax_yr))
				begin
 					set @bill_m_n_o      = @frz_ceiling * ((@m_n_o_tax_pct)/(@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
					set @bill_i_n_s      = @frz_ceiling * ((@i_n_s_tax_pct)/(@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))

			end
			else
			begin
				set @bill_m_n_o = @bill_freeze_m_n_o

				set @bill_i_n_s   = @bill_freeze_i_n_s

			end

			set @actual_tax = @bill_m_n_o + @bill_i_n_s
		end
		else
		begin
			set @frz_assessed = 0
			set @frz_taxable  = 0

			set @actual_tax = 0
		end

		if (@frz_taxable < 0 or @frz_taxable is null)
		begin
			set @frz_taxable = 0
		end

		if (@frz_assessed < 0 or @frz_assessed is null)

		begin
			set @frz_assessed = 0
		end

		if (@actual_tax < 0 or @actual_tax is null)
		begin
			set @actual_tax = 0
		end

		if (@weed_control is not null and @weed_control = 'T')
		begin
			select @weed_acres = sum(size_acres) from land_detail, land_sched
					           where land_detail.ls_mkt_id    = land_sched.ls_id
					           and    land_sched.ls_year       = land_detail.prop_val_yr
					           and    land_detail.prop_id        = @prop_id

					           and    land_detail.sup_num     = @input_sup_num
					           and    land_detail.prop_val_yr = @input_tax_yr
					           and    land_sched.ls_method  = 'A'
			if (@weed_acres is null)
			begin
				set @weed_acres = 0
			end
			
			set @weed_acres = @weed_acres * (@pct_ownership/100) * (@pct_entity_prop/100)
			set @entity_taxable_val = @weed_acres
			set @entity_owner_assessed_val = @weed_acres
				
		end
	end
	else
	begin
		set @entity_taxable_val        = 0
		set @entity_owner_assessed_val = 0
		set @frz_assessed		  = 0
		set @frz_taxable		  = 0
		set @actual_tax		  = 0
	end

	set @tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct

	if (@tax_rate is null)
	begin
		set @tax_rate = 0
	end

	if (@bEX = 1)
	begin
		if (@bExProrated = 1)
		begin
			set @exempt_val = @prorated_ex_amount
		end
		else
		begin
			set @exempt_val = @property_assessed_val
		end

	end
	else
	begin
		set @exempt_val = 0
	end

	set @arb_status = ''

	if exists (select prop_id from arb_protest where prop_id = @prop_id 
							and appr_year = @input_tax_yr
							and protest_record = 'T'
							and close_date is null)
	begin
		set @arb_status = 'A'
	end
	else
	begin
		set @arb_status = 'C'
	end

	if (@entity_taxable_val < 0)
	begin
		set @entity_taxable_val = 0
	end

	if @input_pacs_user_id = 0
	begin
		insert into prop_owner_entity_val
		(
		prop_id,     
		owner_id,    
		sup_num,     
		sup_yr, 
		entity_id, 
		taxable_val,
		assessed_val,
		frz_taxable_val,
		frz_assessed_val,
		frz_actual_tax,
		frz_tax_rate,
		weed_taxable_acres,
		land_hstd_val,
		land_non_hstd_val,
		imprv_hstd_val,
		imprv_non_hstd_val,
		ag_market,
		ag_use_val,
		timber_market,
		timber_use,
		ten_percent_cap,
		exempt_val,
		prop_type_cd,
		tax_increment_flag,
		tax_increment_imprv_val,
		tax_increment_land_val,
		arb_status,
		market_val,
		ag_late_loss,
		appraised_val,
		freeport_late_loss,
		transfer_pct,
		transfer_freeze_assessed,
		transfer_freeze_taxable,
		transfer_entity_taxable,
		transfer_taxable_adjustment,
		transfer_flag
		)
		values
		(
		@prop_id,
		@owner_id,
		@input_sup_num,
		@input_tax_yr,
		@input_entity_id,
		@entity_taxable_val,
		@entity_owner_assessed_val,
		@frz_taxable,
		@frz_assessed,
		@actual_tax,
		@tax_rate,
		@weed_acres,
		@land_hstd_val,
		@land_non_hstd_val,
		@improv_hstd_val,
		@improv_non_hstd_val,
		@ag_market,
		@ag_use,
		@timber_market,
		@timb_use,
		@ten_percent_cap,
		@exempt_val,
		@prop_type_cd,
		@tax_increment_flag,
		@tif_imprv_val,
		@tif_land_val,
		@arb_status,
		@property_market,
		@ag_late_loss,
		@entity_owner_assessed_val + @ten_percent_cap,
		0,
		0,
		0,
		0,
		0,
		0,
		'F'
		)
	end
	else
	begin
		insert into prop_owner_entity_val_preview
		(
		pacs_user_id,
		prop_id,     
		owner_id,    
		sup_num,     
		sup_yr, 
		entity_id, 
		taxable_val,
		assessed_val,
		frz_taxable_val,
		frz_assessed_val,
		frz_actual_tax,
		frz_tax_rate,
		weed_taxable_acres,
		land_hstd_val,
		land_non_hstd_val,
		imprv_hstd_val,
		imprv_non_hstd_val,
		ag_market,
		ag_use_val,
		timber_market,
		timber_use,
		ten_percent_cap,
		exempt_val,
		prop_type_cd,
		tax_increment_flag,
		tax_increment_imprv_val,
		tax_increment_land_val,
		arb_status,
		market_val,
		ag_late_loss,
		appraised_val,
		freeport_late_loss,
		transfer_pct,
		transfer_freeze_assessed,
		transfer_freeze_taxable,
		transfer_entity_taxable,
		transfer_taxable_adjustment,
		transfer_flag
		)
		values
		(
		@input_pacs_user_id,
		@prop_id,
		@owner_id,
		@input_sup_num,
		@input_tax_yr,
		@input_entity_id,
		@entity_taxable_val,
		@entity_owner_assessed_val,
		@frz_taxable,
		@frz_assessed,
		@actual_tax,
		@tax_rate,
		@weed_acres,
		@land_hstd_val,
		@land_non_hstd_val,
		@improv_hstd_val,
		@improv_non_hstd_val,
		@ag_market,
		@ag_use,
		@timber_market,
		@timb_use,
		@ten_percent_cap,
		@exempt_val,
		@prop_type_cd,
		@tax_increment_flag,
		@tif_imprv_val,
		@tif_land_val,
		@arb_status,
		@property_market,
		@ag_late_loss,
		@entity_owner_assessed_val + @ten_percent_cap,
		0,
		0,
		0,
		0,
		0,
		0,
		'F'
		)
	end

	FETCH NEXT FROM PROPERTY_EXMPT into @prop_type_cd, @prop_id, @owner_id, @pct_ownership, @apply_pct_exemption, @pct_entity_prop, @property_market,
			  @property_assessed_val, @appraised_val, @improv_hstd_val, @improv_non_hstd_val,  @land_hstd_val, @land_non_hstd_val, @ten_percent_cap,  @sup_action,
			  @ag_use, @timb_use, @ag_mkt, @timb_mkt, @tif_imprv_val, @tif_land_val, @tif_flag,  @ag_app_filed, @ag_late_loss
end


CLOSE PROPERTY_EXMPT
DEALLOCATE PROPERTY_EXMPT


if @input_pacs_user_id = 0
begin
	exec SetEntityStateCdVal  @input_tax_yr, @input_sup_num, @input_entity_id
end

GO

