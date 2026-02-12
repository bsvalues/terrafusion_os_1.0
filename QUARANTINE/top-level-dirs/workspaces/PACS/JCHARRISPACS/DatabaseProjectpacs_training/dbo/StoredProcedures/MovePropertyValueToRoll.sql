












CREATE    PROCEDURE MovePropertyValueToRoll
 @input_tax_yr        int,
 @input_sup_num       int
AS
declare @prop_id             	int
declare @owner_id            	int
declare @roll_item_id      	int
declare @owner_tax_yr        	numeric(4)
declare @sup_tax_yr          	numeric(4)
declare @sup_num             	int
declare @sup_group_id        	int
declare @rv_land_hstd_val    	numeric(14,2)
declare @rv_land_non_hstd_val	numeric(14,2)
declare @rv_imprv_hstd_val 	numeric(14,2)
declare @rv_imprv_non_hstd_val 	numeric(14,2)
declare @rv_appraised_val 	numeric(14,2)
declare @rv_assessed_val 	numeric(14,2)
declare @rv_market  		numeric(14,2)
declare @rv_ag_use  		numeric(14,2)
declare @rv_ag_market  		numeric(14,2)
declare @rv_freeze_ceiling 	numeric(14,2)
declare @rv_freeze_yr  		numeric(14,2)
declare @rv_prop_ag_loss 	numeric(14,2)
declare @rv_ag_late_loss 	numeric(14,2)
declare @rv_timber_78  		numeric(14,2)
declare @rv_timber_market 	numeric(14,2)
declare @rv_timber_use  	numeric(14,2)
declare @rv_timber_loss  	numeric(14,2)
declare @rv_timber_late_loss 	numeric(14,2)
declare @rv_ten_percent_cap 	numeric(14,2)
declare @current_roll_id        int

DECLARE ROLL SCROLL CURSOR
FOR select roll_item.prop_id,
           roll_item.owner_id,
           roll_item.owner_tax_yr,
           roll_item.sup_tax_yr,
           roll_item.sup_num,
           roll_item.roll_item_id,
           property_val.land_non_hstd_val,
       	   property_val.land_hstd_val,
       	   property_val.imprv_hstd_val,
       	   property_val.imprv_non_hstd_val,
       	   property_val.appraised_val,
       	   property_val.assessed_val,
       	   property_val.market,
       	   property_val.ag_use_val,
       	   property_val.ag_market,
       	   property_val.freeze_ceiling,
       	   property_val.freeze_yr,
       	   property_val.ag_loss,
       	   property_val.ag_late_loss,
       	   property_val.timber_78,
       	   property_val.timber_market,
       	   property_val.timber_use,
       	   property_val.timber_loss,
       	   property_val.timber_late_loss,
       	   property_val.ten_percent_cap
    from   roll_item, property_val
    where (roll_item.owner_tax_yr   = @input_tax_yr)
    and   (roll_item.sup_num        = @input_sup_num)
    and   (property_val.prop_id     = roll_item.prop_id)
    and   (property_val.prop_val_yr = @input_tax_yr)
    and   (property_val.sup_num     = @input_sup_num)

OPEN ROLL
FETCH NEXT FROM ROLL into @prop_id, 	
			@owner_id, 
			@owner_tax_yr, 
			@sup_tax_yr, 
			@sup_num, 
			@roll_item_id,
		        @rv_land_non_hstd_val,    
       	  		@rv_land_hstd_val, 
       	  		@rv_imprv_hstd_val, 
          		@rv_imprv_non_hstd_val,
          		@rv_appraised_val, 
          		@rv_assessed_val, 
          		@rv_market,  
          		@rv_ag_use,  
          		@rv_ag_market,  
          		@rv_freeze_ceiling, 
          		@rv_freeze_yr,  
          		@rv_prop_ag_loss, 
          		@rv_ag_late_loss, 
          		@rv_timber_78,  
          		@rv_timber_market, 
          		@rv_timber_use,  
          		@rv_timber_loss,  
          		@rv_timber_late_loss, 
          		@rv_ten_percent_cap 

while (@@FETCH_STATUS = 0)
begin 
    
        delete from roll_value_assoc where roll_item_id = @roll_item_id
      
        insert into roll_value
        ( 
        sup_tax_yr,
   	sup_num,
   	roll_item_id,
   	rv_land_hstd_val, 
   	rv_land_non_hstd_val, 
   	rv_imprv_hstd_val, 
   	rv_imprv_non_hstd_val, 
   	rv_appraised_val, 
   	rv_assessed_val,  
   	rv_market,        
   	rv_ag_use_val,    
   	rv_ag_market,     
   	rv_freeze_ceiling, 
   	rv_freeze_yr, 
   	rv_prop_ag_loss,  
   	rv_ag_late_loss,  
   	rv_timber_78,     
   	rv_timber_market, 
   	rv_timber_use,    
   	rv_timber_loss,   
   	rv_timber_late_loss, 
   	rv_ten_percent_cap 
                                                                                                                                                                                                                                 
         )
         values
         ( 
   	@sup_tax_yr,
   	@sup_num,
   	@roll_item_id,
        @rv_land_hstd_val,    
    	@rv_land_non_hstd_val, 
    	@rv_imprv_hstd_val, 
    	@rv_imprv_non_hstd_val,
    	@rv_appraised_val, 
    	@rv_assessed_val, 
    	@rv_market,  
    	@rv_ag_use,  
    	@rv_ag_market,  
    	@rv_freeze_ceiling, 
    	@rv_freeze_yr,  
    	@rv_prop_ag_loss, 
    	@rv_ag_late_loss, 
    	@rv_timber_78,  
    	@rv_timber_market, 
    	@rv_timber_use,  
    	@rv_timber_loss,  
    	@rv_timber_late_loss, 
    	@rv_ten_percent_cap 
         )

        insert into roll_value_assoc
        (
        sup_tax_yr,
        sup_num,
   	roll_item_id
        )
        values
        (
        @sup_tax_yr,
    	@sup_num,
    	@roll_item_id
        )      
    
        FETCH NEXT FROM ROLL into @prop_id, 	
			@owner_id, 
			@owner_tax_yr, 
			@sup_tax_yr, 
			@sup_num, 
			@roll_item_id,
		        @rv_land_non_hstd_val,    
       	  		@rv_land_hstd_val, 
       	  		@rv_imprv_hstd_val, 
          		@rv_imprv_non_hstd_val,
          		@rv_appraised_val, 
          		@rv_assessed_val, 
          		@rv_market,  
          		@rv_ag_use,  
          		@rv_ag_market,  
          		@rv_freeze_ceiling, 
          		@rv_freeze_yr,  
          		@rv_prop_ag_loss, 
          		@rv_ag_late_loss, 
          		@rv_timber_78,  
          		@rv_timber_market, 
          		@rv_timber_use,  
          		@rv_timber_loss,  
          		@rv_timber_late_loss, 
          		@rv_ten_percent_cap 
END
CLOSE ROLL
DEALLOCATE ROLL

GO

