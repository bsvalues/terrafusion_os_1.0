












CREATE     PROCEDURE UpdateHSProp
 @input_prop_id      int,
 @input_supp         int,
 @input_tax_yr       int

as

declare @owner_id int

DECLARE OWNER_PROP SCROLL CURSOR
FOR select owner_id     
    from   owner
    where  prop_id = @input_prop_id
    and    sup_num = @input_supp
    and    owner_tax_yr = @input_tax_yr
    
OPEN OWNER_PROP
FETCH NEXT FROM OWNER_PROP into @owner_id

while (@@FETCH_STATUS = 0)
begin

    if exists (select * 
	       from property_exemption 
	       where prop_id       = @input_prop_id
 	       and   owner_id      = @owner_id
               and   owner_tax_yr  = @input_tax_yr
               and   exmpt_tax_yr  = @input_tax_yr
               and   sup_num       = @input_supp
	       and   exmpt_type_cd = 'HS')
    begin
        
        update owner set hs_prop = 'T' where prop_id  = @input_prop_id
				       and   owner_id = @owner_id
				       and   owner_tax_yr = @input_tax_yr
                                       and   sup_num  = @input_supp
    end
    else
    begin 
	update owner set hs_prop = 'F' where prop_id  = @input_prop_id
				       and   owner_id = @owner_id
				       and   owner_tax_yr = @input_tax_yr
                                       and   sup_num  = @input_supp				       
    end

    FETCH NEXT FROM OWNER_PROP into @owner_id
end

close      OWNER_PROP
deallocate OWNER_PROP

GO

