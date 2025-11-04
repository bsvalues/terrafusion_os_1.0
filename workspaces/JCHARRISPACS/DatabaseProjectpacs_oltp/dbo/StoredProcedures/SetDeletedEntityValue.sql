
CREATE procedure  SetDeletedEntityValue 
 @input_tax_yr	int, 
 @input_sup_num	int,
 @input_prop_id		int = 0

AS

declare @prop_id	int
declare @owner_id	int
declare @sup_num	int
declare @tax_yr		numeric(4)
declare @entity_id	int
declare @prop_type_cd char(5)

if (@input_prop_id <> 0)
begin

	DECLARE PROPERTY_WITH_DELETED_ENTITY SCROLL CURSOR
	FOR
	select distinct
		owner.prop_id,
		owner.owner_id,
		owner.sup_num,
		owner.owner_tax_yr,
		entity_prop_assoc.entity_id,
		property.prop_type_cd
	from  entity_prop_assoc, owner, property_val, property
	where entity_prop_assoc.tax_yr  = @input_tax_yr
	and   entity_prop_assoc.prop_id in (select prop_id from property_val 
		     	            	    where sup_num = @input_sup_num and prop_val_yr = @input_tax_yr)
	and   entity_prop_assoc.sup_num = (select max(property_val.sup_num) 
				   	   from property_val
				   	   where property_val.prop_id = entity_prop_assoc.prop_id
				   	   and   property_val.sup_num = entity_prop_assoc.sup_num
				   	   and   property_val.prop_val_yr = entity_prop_assoc.tax_yr
	    			   	   and   property_val.sup_num <> @input_sup_num)
	and   entity_prop_assoc.entity_id not in (select epa.entity_id 
			                  	  from  entity_prop_assoc epa
	 			          	  where epa.prop_id   = entity_prop_assoc.prop_id
				    	  	  and   epa.entity_id = entity_prop_assoc.entity_id
				    	  	  and   epa.tax_yr    = @input_tax_yr
				    	  	  and   epa.sup_num   = @input_sup_num)
	and   entity_prop_assoc.prop_id = owner.prop_id
	and   entity_prop_assoc.tax_yr  = owner.owner_tax_yr
	and   owner.sup_num             = @input_sup_num
	and   owner.prop_id      = @input_prop_id
	and   owner.prop_id = property_val.prop_id
	and   owner.sup_num = property_val.sup_num
	and   owner.owner_tax_yr = property_val.prop_val_yr
	and   property_val.accept_create_id is null
	and   entity_prop_assoc.prop_id = property.prop_id
end
else
begin
	DECLARE PROPERTY_WITH_DELETED_ENTITY SCROLL CURSOR
	FOR
	select distinct owner.prop_id,
	owner.owner_id,
	owner.sup_num,
	owner.owner_tax_yr,
	entity_prop_assoc.entity_id,
	property.prop_type_cd
	from  entity_prop_assoc, owner, property_val, property
	where entity_prop_assoc.tax_yr  = @input_tax_yr
	and   entity_prop_assoc.prop_id in (select prop_id from property_val 
		     	            	    where sup_num = @input_sup_num and prop_val_yr = @input_tax_yr)
	and   entity_prop_assoc.sup_num = (select max(property_val.sup_num) 
				   	   from property_val
				   	   where property_val.prop_id = entity_prop_assoc.prop_id
				   	   and   property_val.sup_num = entity_prop_assoc.sup_num
				   	   and   property_val.prop_val_yr = entity_prop_assoc.tax_yr
	    			   	   and   property_val.sup_num <> @input_sup_num)
	and   entity_prop_assoc.entity_id not in (select epa.entity_id 
			                  	  from  entity_prop_assoc epa
	 			          	  where epa.prop_id   = entity_prop_assoc.prop_id
				    	  	  and   epa.entity_id = entity_prop_assoc.entity_id
				    	  	  and   epa.tax_yr    = @input_tax_yr
				    	  	  and   epa.sup_num   = @input_sup_num)
	and   entity_prop_assoc.prop_id = owner.prop_id
	and   entity_prop_assoc.tax_yr  = owner.owner_tax_yr
	and   owner.sup_num             = @input_sup_num
	and   owner.prop_id = property_val.prop_id
	and   owner.sup_num = property_val.sup_num
	and   owner.owner_tax_yr = property_val.prop_val_yr
	and   property_val.accept_create_id is null
	and   entity_prop_assoc.prop_id = property.prop_id
end
   
OPEN PROPERTY_WITH_DELETED_ENTITY
FETCH NEXT FROM PROPERTY_WITH_DELETED_ENTITY into @prop_id, @owner_id, @sup_num, @tax_yr, @entity_id, @prop_type_cd

while (@@FETCH_STATUS = 0)
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
	arb_status,
	prop_type_cd
	)

	values
	(
	@prop_id,
	@owner_id,
	@input_sup_num,
	@input_tax_yr,
	@entity_id,
	0,
	0,
	0,
	0,
	0.00,
	0.0000,
	0.0000,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	'C',
	@prop_type_cd
	)


	FETCH NEXT FROM PROPERTY_WITH_DELETED_ENTITY into @prop_id, @owner_id, @sup_num, @tax_yr, @entity_id, @prop_type_cd
end

close PROPERTY_WITH_DELETED_ENTITY
deallocate PROPERTY_WITH_DELETED_ENTITY

GO

