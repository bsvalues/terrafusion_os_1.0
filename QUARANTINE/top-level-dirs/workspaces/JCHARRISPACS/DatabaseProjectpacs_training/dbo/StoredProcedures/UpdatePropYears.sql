








CREATE PROCEDURE UpdatePropYears

as
 
declare @prop_id             		int
declare @prop_val_yr          		numeric(4)
declare @delete_dt             		datetime
declare @year				numeric(4)
declare @orig_year			numeric(4)
declare @month				int


DECLARE PROPERTY SCROLL CURSOR
FOR select property_val.prop_id,
	   property_val.prop_val_yr,
	   property_val.prop_inactive_dt
    from   property_val
    where  prop_inactive_dt is not null
    and    prop_id = 10275
 
OPEN PROPERTY
FETCH NEXT FROM PROPERTY into @prop_id, @prop_val_yr, @delete_dt

while (@@FETCH_STATUS = 0)
begin
	select @year      = datepart(year, @delete_dt)
	select @orig_year = datepart(year, @delete_dt)
	select @month     = datepart(month, @delete_dt)

	if (@month < 7)
	begin
		select @year = @year - 1
	end

	update owner set owner_tax_yr = @year
	where prop_id = @prop_id
	
	update entity_prop_assoc set tax_yr = @year
	where prop_id = @prop_id
		
	update property_exemption set exmpt_tax_yr= @year, owner_tax_yr = @year
	where prop_id = @prop_id
	
	update property_val set prop_val_yr = @year
	where prop_id = @prop_id
		
	update prop_supp_assoc set owner_tax_yr = @year
	where prop_id = @prop_id
	
	FETCH NEXT FROM PROPERTY into @prop_id, @prop_val_yr, @delete_dt
end

CLOSE PROPERTY
DEALLOCATE PROPERTY

GO

