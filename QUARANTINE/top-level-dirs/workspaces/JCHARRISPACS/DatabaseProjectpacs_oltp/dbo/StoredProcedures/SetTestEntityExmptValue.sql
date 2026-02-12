










CREATE       PROCEDURE SetTestEntityExmptValue
 @input_tax_yr       int,
 @input_sup_num  int,
 @input_entity_id   int,
 @input_lookup_yr int
AS
declare @prop_id                     	int
declare @owner_id                    	int
declare @entity_id                   	int
declare @owner_tax_yr                	numeric(4)
declare @sup_tax_yr                  	numeric(4)
declare @sup_num                     	int
declare @pct_entity_prop             	numeric(13,10)
declare @pct_ownership               	numeric(5,2)
declare @apply_pct_exemption         	char(1)
declare @exemption_owner_id          	int
declare @exemption_prop_id           	int
declare @exemption_owner_tax_yr      	numeric(4)
declare @exempt_tax_yr               	numeric(4)
declare @exempt_type_cd              	char(5)
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
declare @improv_hstd_val            	numeric(14)
declare @land_hstd_val              	numeric(14,2)
declare @ten_percent_cap		numeric(14,2)
declare @freeze_ceiling		    	numeric(14,2)
declare @freeze_year		    	numeric(4)
declare @property_taxable_val       	numeric(14)
declare @property_assessed_val      	numeric(14)
declare @property_exemption_val     	numeric(14)
declare @property_exemption_amt     	numeric(14)
declare @local_option_amt     		numeric(14)
declare @state_amt      		numeric(14)
declare @local_amt      		numeric(14)
declare @next_exemption_id          	int
declare @prorate_pct      		numeric(5,4)
declare @effective_month     		int
declare @effective_day      		int
declare @effective_year      		int
declare @termination_month     		int
declare @termination_day     		int
declare @termination_year     		int
declare @termination_days      		numeric(13,10)
declare @effective_days      		numeric(13,10)
declare @bOV65       			int
declare @exmpt_type_exmpt_type_cd   	char(5)
declare @exmpt_type_desc     		varchar(50)
declare @federal_amt                	numeric(14,2)
declare @plus_oa65_amt              	numeric(14)
declare @spl_exmpt      		char(1)
declare @sup_action			char(5)

declare @entity_exmpt_local_amt		numeric(14)
declare @entity_exmpt_state_amt	numeric(14)
declare @entity_taxable_val		numeric(14)
declare @entity_owner_assessed_val	numeric(14)

DECLARE PROPERTY_EXMPT SCROLL CURSOR
FOR select property.prop_type_cd,
           owner.prop_id,
           owner.owner_id,
           owner.pct_ownership,
    	   entity_prop_assoc.entity_prop_pct,
           property_val.assessed_val,
	   property_val.imprv_hstd_val,
	   property_val.land_hstd_val,
	   property_val.ten_percent_cap,
	   property_val.freeze_ceiling,
	   property_val.freeze_yr,
	   property_val.sup_action
    from   owner, property_val, entity_prop_assoc, property
    where  entity_prop_assoc.entity_id = @input_entity_id
    and	   entity_prop_assoc.sup_num   = @input_sup_num
    and    entity_prop_assoc.tax_yr    = @input_tax_yr
    and    entity_prop_assoc.prop_id   = property_val.prop_id
    and    entity_prop_assoc.sup_num   = property_val.sup_num
    and    entity_prop_assoc.tax_yr    = property_val.prop_val_yr
    and    property_val.prop_id        = owner.prop_id
    and    property_val.sup_num	       = owner.sup_num
    and    property_val.prop_val_yr    = owner.owner_tax_yr
    and    property_val.prop_id	       = property.prop_id
    
OPEN PROPERTY_EXMPT

FETCH NEXT FROM PROPERTY_EXMPT into @prop_type_cd, @prop_id, @owner_id, @pct_ownership, @pct_entity_prop, 

			  @property_assessed_val, @improv_hstd_val, @land_hstd_val, @ten_percent_cap, @freeze_ceiling, @freeze_year, @sup_action

while (@@FETCH_STATUS = 0)
begin 
   
   if (@sup_action <> 'D')
   begin
	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0

   
    /* set the OV65 variable to 0 to indicate the property as of right now
      does not have on OV65 */
	select @bOV65 = 0
   	
	if ((@prop_type_cd = 'R') or (@prop_type_cd = 'MH'))
   	begin
		if (@ten_percent_cap is null)
		begin
			select @ten_percent_cap = 0
		end

    		select @property_taxable_val = (@improv_hstd_val + @land_hstd_val) - @ten_percent_cap
   	end
   	else
   	begin 
        	select @property_taxable_val = @property_assessed_val
   	end
   
   	select @property_exemption_amt = @property_taxable_val * (@pct_entity_prop/100) * (@pct_ownership/100)

	/* process the properties homestead exemptions first */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'HS')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_tax_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
     		if (@property_exemption_amt > @entity_state_mandate_amt)
     		begin
               		select @state_amt = @entity_state_mandate_amt
     		end
        	else
    		begin
  			if (@property_exemption_amt > 0)
        		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end
     
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt

     		/* calculate the local option amt */
     		if (@entity_local_option_pct > 0)
     		begin
    			select @local_option_amt = @property_taxable_val * (@entity_local_option_pct/100)
  
			if (@local_option_amt < @entity_local_option_min_amt)
  			begin
            			select @local_option_amt = @entity_local_option_min_amt
   			end
     		end
     		else
     		begin
  			select @local_option_amt = @entity_local_option_amt
     		end
     
		if (@property_exemption_amt > @local_option_amt)
     		begin
               		select @local_amt = @local_option_amt
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

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @local_amt = @local_amt * (@pct_ownership/100)
     		end
     
		select @property_exemption_amt = @property_exemption_amt - @local_amt


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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0

	/* process the properties ov 65 exemption */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'OV65')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
    
		/* calculate the prorate percent for OA exemptions */
 		select @prorate_pct = 1

 		if ((@termination_dt is not null) AND
                    (@effective_dt is not null))
 		begin
    			select @termination_days = convert(numeric(5), DATEPART(dy, @termination_dt)) 
    			select @effective_days   = convert(numeric(5), DATEPART(dy, @effective_dt))
    			select @prorate_pct = (@termination_days - @effective_days)/365
        	end
 		else if ((@effective_dt is not null) AND
                 	(DATEPART(year, @effective_dt) = @input_tax_yr))
        	begin
    			select @effective_days = convert(numeric(5), DATEPART(dy, @effective_dt)) - 1
             		select @prorate_pct = (365 - @effective_days)/365
 		end
 		else if ((@termination_dt is not null) AND
                 	(DATEPART(year, @termination_dt) = @input_tax_yr))
 		begin
    			select @termination_days = convert(numeric(5), DATEPART(dy, @termination_dt))
    				select @prorate_pct = (@termination_days)/365    
 		end
 
                select @bOV65 = 1
 
	  select prorate_pct = @prorate_pct
 
            	if (@property_exemption_amt > @entity_state_mandate_amt)
     		begin


               		select @state_amt = @entity_state_mandate_amt
     		end
            	else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end
 
     		/* multiply by proration percent */
     		select @state_amt = @state_amt * @prorate_pct
     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     
		/* calculate the local option amt */
     		if (@entity_local_option_pct > 0)
     		begin
    			select @local_option_amt = @property_taxable_val * (@entity_local_option_pct/100)
  			
			if (@local_option_amt < @entity_local_option_min_amt)
  			begin
      				select @local_option_amt = @entity_local_option_min_amt
  
  			end
     		end
     		else
     		begin
  			select @local_option_amt = @entity_local_option_amt
    		end
     		
		if (@property_exemption_amt > @local_option_amt)
     		begin
               		select @local_amt = @local_option_amt
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

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @local_amt = @local_amt * (@pct_ownership/100)
     		end

     		select @local_amt = @local_amt * @prorate_pct
     		select @property_exemption_amt = @property_exemption_amt - @local_amt
      
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0

	/* process the properties dv1  */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'DV1')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
	
     		if (@bOV65 = 1)
     		begin
               		select @federal_amt = @federal_amt + @plus_oa65_amt
     		end
  
            	if (@property_exemption_amt > @federal_amt)
     		begin
               		select @state_amt = @federal_amt
     		end
      		else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end
     	
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     	
		/* no local amount on federal exemption */
     		select @local_amt = 0
	
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0
     
	/* process the properties dv2  */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'DV2')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
	
     		if (@bOV65 = 1)
     		begin
               		select @federal_amt = @federal_amt + @plus_oa65_amt
     		end
  
            	if (@property_exemption_amt > @federal_amt)
     		begin
               		select @state_amt = @federal_amt
     		end
      		else
     		begin
  			if (@property_exemption_amt > 0)

         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end
     	
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     	
		/* no local amount on federal exemption */
     		select @local_amt = 0
	
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0

	/* process the properties dv3  */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'DV3')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
	
     		if (@bOV65 = 1)
     		begin
               		select @federal_amt = @federal_amt + @plus_oa65_amt
     		end
  
            	if (@property_exemption_amt > @federal_amt)
     		begin
               		select @state_amt = @federal_amt
     		end
      		else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end
     	
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     	
		/* no local amount on federal exemption */
     		select @local_amt = 0
	
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0

	/* process the properties dv4  */
   	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'DV4')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)
  
 
	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
	
     		if (@bOV65 = 1)
     		begin
               		select @federal_amt = @federal_amt + @plus_oa65_amt
     		end
  
            	if (@property_exemption_amt > @federal_amt)
     		begin
               		select @state_amt = @federal_amt
     		end
      		else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end
     	
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     	
		/* no local amount on federal exemption */
     		select @local_amt = 0
	
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0
     
     
	/* process DP exemptions */
	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          

       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,

                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd = 'DP')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)

	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
    

       		if (@property_exemption_amt > @entity_state_mandate_amt)
     		begin
               		select @state_amt = @entity_state_mandate_amt
     		end
            	else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     
		/* calculate the local option amt */
     		if (@entity_local_option_pct > 0)
     		begin
    			select @local_option_amt = @property_taxable_val * (@entity_local_option_pct/100)
  
			if (@local_option_amt < @entity_local_option_min_amt)
  			begin
      				select @local_option_amt = @entity_local_option_min_amt
  			end
     		end
     		else
     		begin
  			select @local_option_amt = @entity_local_option_amt
     		end

     		if (@property_exemption_amt > @local_option_amt)
     		begin
               		select @local_amt = @local_option_amt
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

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @local_amt = @local_amt * (@pct_ownership/100)
     		end
     	
		select @property_exemption_amt = @property_exemption_amt - @local_amt
	
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0
     
   	/* process the properties EX exemptions next */
	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          
       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,
                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,
            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd like 'EX%')
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)

	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
  
 		/* calculate the prorate percent for EX exemptions */
 		select @prorate_pct = 1

 		if ((@termination_dt is not null) AND
            		(@effective_dt is not null))
		 begin
    			select @termination_days = convert(numeric(5), DATEPART(dy, @termination_dt)) 
    			select @effective_days   = convert(numeric(5), DATEPART(dy, @effective_dt))
    			select @prorate_pct = (@termination_days - @effective_days)/365
    
        	end
 		else if ((@effective_dt is not null) AND
                 	(DATEPART(year, @effective_dt) = @input_tax_yr))
        	begin
    			select @effective_days = convert(numeric(5), DATEPART(dy, @effective_dt)) - 1
               		select @prorate_pct = (365 - @effective_days)/365
 		end
 		else if ((@termination_dt is not null) AND
                 	(DATEPART(year, @termination_dt) = @input_tax_yr))
 		begin
    			select @termination_days = convert(numeric(5), DATEPART(dy, @termination_dt))
    			select @prorate_pct = (@termination_days)/365    
 		end
     
      		select @state_amt = @property_assessed_val
     		
		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end
 
     		/* multiply by proration percent */
     		select @state_amt = @state_amt * @prorate_pct
     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     
     		select @local_amt = 0
		
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

	/* initialize variables */
   	select 	@exempt_type_cd		     = '',          
       		@effective_dt		     = NULL,                   
       		@termination_dt		     = NULL,
		@entity_exmpt_type_cd        = '',
            	@entity_exmpt_tax_yr         = 0,
                @entity_special_exmpt        = '',
            	@entity_local_option_pct     = 0,
              	@entity_state_mandate_amt    = 0,
             	@entity_local_option_min_amt = 0,
            	@entity_local_option_amt     = 0,
            	@entity_apply_pct_ownership  = 0
            
   
   	/* process the properties EX exemptions next */
	select 	@exempt_type_cd		     = property_exemption.exmpt_type_cd,          

       		@effective_dt		     = property_exemption.effective_dt,                   
       		@termination_dt		     = property_exemption.termination_dt,
		@entity_exmpt_type_cd        = entity_exmpt.exmpt_type_cd,
            	@entity_exmpt_tax_yr         = entity_exmpt.exmpt_tax_yr,

                @entity_special_exmpt        = entity_exmpt.special_exmpt,
            	@entity_local_option_pct     = entity_exmpt.local_option_pct,
              	@entity_state_mandate_amt    = entity_exmpt.state_mandate_amt,
             	@entity_local_option_min_amt = entity_exmpt.local_option_min_amt,

            	@entity_local_option_amt     = entity_exmpt.local_option_amt,
            	@entity_apply_pct_ownership  = entity_exmpt.apply_pct_ownrship
       	from  property_exemption, entity_exmpt              
     	where (property_exemption.prop_id       = @prop_id)
     	and   (property_exemption.owner_id      = @owner_id)
     	and   (property_exemption.owner_tax_yr  = @input_tax_yr)
     	and   (property_exemption.sup_num       = @input_sup_num)
     	and   (property_exemption.exmpt_type_cd <> 'HS')
     	and   (property_exemption.exmpt_type_cd <> 'OV65')
     	and   (property_exemption.exmpt_type_cd <> 'DV1')
     	and  (property_exemption.exmpt_type_cd <> 'DV2')
     	and   (property_exemption.exmpt_type_cd <> 'DV3')
     	and   (property_exemption.exmpt_type_cd <> 'DV4')
     	and   (property_exemption.exmpt_type_cd <> 'DP')
     	and   (property_exemption.exmpt_type_cd not like 'EX%') 
	and   (entity_exmpt.exmpt_type_cd       = property_exemption.exmpt_type_cd)
	and   (entity_exmpt.entity_id		= @input_entity_id)
	and   (entity_exmpt.exmpt_tax_yr	= @input_lookup_yr)

	if (@exempt_type_cd is not null) and (@exempt_type_cd <> '')
	begin
   
       		if (@property_exemption_amt > @entity_state_mandate_amt)
     		begin
               		select @state_amt = @entity_state_mandate_amt
     		end
            	else
     		begin
  			if (@property_exemption_amt > 0)
         		begin
      				select @state_amt = @property_exemption_amt
  			end
  			else
  			begin
      				select @state_amt = 0
  			end
     		end

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @state_amt = @state_amt * (@pct_ownership/100)
     		end

     		select @property_exemption_amt = @property_exemption_amt - @state_amt
     
		/* calculate the local option amt */
     		if (@entity_local_option_pct > 0)
     		begin
    			select @local_option_amt = @property_taxable_val * (@entity_local_option_pct/100)
  			
			if (@local_option_amt < @entity_local_option_min_amt)
  			begin
            			select @local_option_amt = @entity_local_option_min_amt
    			end
     		end
     		else
     		begin
  			select @local_option_amt = @entity_local_option_amt
     		end
     
		if (@property_exemption_amt > @local_option_amt)
     		begin
               		select @local_amt = @local_option_amt
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

     		if (@apply_pct_exemption = 'Y')
     		begin
  			select @local_amt = @local_amt * (@pct_ownership/100)
     		end
     		
		select @property_exemption_amt = @property_exemption_amt - @local_amt
	
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

   end

   if exists (select * from entity_prop_assoc
		   where prop_id    = @prop_id
		   and   sup_num    = @input_sup_num
		   and   tax_yr     = @input_tax_yr

		   and   entity_id  = @input_entity_id)
   begin
		if (@sup_action <> 'D') or (@sup_action is null)
		begin

			select 	@entity_exmpt_local_amt = sum(state_amt),
		       		@entity_exmpt_state_amt = sum(local_amt)
			from property_entity_exemption
			where prop_id   = @prop_id
			and   owner_id  = @owner_id

			and   entity_id = @input_entity_id
			and   sup_num	= @input_sup_num
			and   exmpt_tax_yr = @input_tax_yr
			and   owner_tax_yr = @input_tax_yr

			if (@entity_exmpt_local_amt is null)
			begin
				select @entity_exmpt_local_amt = 0
			end

			if (@entity_exmpt_state_amt is null)
			begin
				select @entity_exmpt_state_amt = 0
			end
		
			select @entity_owner_assessed_val = (@property_assessed_val * (@pct_ownership/100))
			select @entity_taxable_val = (@property_assessed_val * (@pct_ownership/100)) - @entity_exmpt_local_amt - @entity_exmpt_state_amt
		end
		else
		begin
			select @entity_taxable_val = 0
			select @entity_owner_assessed_val = 0
		end

		insert into prop_owner_entity_val
		(
		prop_id,     
		owner_id,    
		sup_num,     
		sup_yr, 
		entity_id, 
		taxable_val,
		assessed_val
		)
		values
		(
		@prop_id,
		@owner_id,
		@input_sup_num,
		@input_tax_yr,
		@input_entity_id,
		@entity_taxable_val,
		 @entity_owner_assessed_val
		)
	end

	FETCH NEXT FROM PROPERTY_EXMPT into @prop_type_cd, @prop_id, @owner_id, @pct_ownership, @pct_entity_prop, 
			  @property_assessed_val, @improv_hstd_val, @land_hstd_val, @ten_percent_cap, @freeze_ceiling, @freeze_year, @sup_action
end

CLOSE PROPERTY_EXMPT
DEALLOCATE PROPERTY_EXMPT

GO

