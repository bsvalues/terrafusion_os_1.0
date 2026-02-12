




CREATE procedure SetRollExemption

@input_tax_yr	numeric(4),
@input_sup_num	int

as

declare @prop_id	int
declare @owner_id	int
declare @exmpt_type_cd  varchar(5)
declare @prev_prop_id	int
declare @prev_owner_id	int
declare @str_exemption  varchar(500)

select @prev_prop_id  = 0
select @prev_owner_id = 0

update owner set roll_exemption = NULL where owner_tax_yr = @input_tax_yr and sup_num = @input_sup_num

declare property_exemption_cursor SCROLL CURSOR
FOR select prop_id,
	   owner_id,
	   exmpt_type_cd
    from  property_exemption
    where owner_tax_yr = @input_tax_yr
    and   sup_num      = @input_sup_num
    order by exmpt_type_cd
  
OPEN property_exemption_cursor
FETCH NEXT from property_exemption_cursor into @prop_id, @owner_id, @exmpt_type_cd

while (@@FETCH_STATUS = 0)
begin
	select @str_exemption = roll_exemption from owner
	where prop_id      = @prop_id
	and   owner_id     = @owner_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr

	if (@str_exemption is null)
	begin
		select @str_exemption = RTRIM(@exmpt_type_cd)
	end
	else
	begin
		select @str_exemption = @str_exemption + ', ' + RTRIM(@exmpt_type_cd)
	end

	update owner set roll_exemption = @str_exemption 
	where prop_id      = @prop_id
	and   owner_id     = @owner_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr
	

	FETCH NEXT from property_exemption_cursor into @prop_id, @owner_id, @exmpt_type_cd

end

CLOSE property_exemption_cursor
DEALLOCATE property_exemption_cursor

GO

