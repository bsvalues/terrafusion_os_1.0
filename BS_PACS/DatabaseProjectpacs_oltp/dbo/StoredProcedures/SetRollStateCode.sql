




CREATE procedure SetRollStateCode

@input_tax_yr	numeric(4),
@input_sup_num	int

as

declare @prop_id	int
declare @imprv_state_cd varchar(5)
declare @land_state_cd  varchar(5)
declare @pp_state_cd	varchar(5)
declare @str_state_code varchar(500)

update owner set roll_state_code = NULL where owner_tax_yr = @input_tax_yr and sup_num = @input_sup_num

declare imprv_cursor SCROLL CURSOR
FOR select distinct prop_id,
	   imprv_state_cd
    from  imprv
    where prop_val_yr = @input_tax_yr
    and   sup_num     = @input_sup_num
  
OPEN imprv_cursor
FETCH NEXT from imprv_cursor into @prop_id, @imprv_state_cd

while (@@FETCH_STATUS = 0)
begin
	select top 1 @str_state_code = roll_state_code 
        from owner
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr

	if (@str_state_code is null)
	begin
		select @str_state_code = RTRIM(@imprv_state_cd)
	end
	else
	begin
		select @str_state_code = @str_state_code + ', ' + RTRIM(@imprv_state_cd)
	end

	update owner set roll_state_code = @str_state_code 
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr
	

	FETCH NEXT from imprv_cursor into @prop_id, @imprv_state_cd

end

CLOSE imprv_cursor
DEALLOCATE imprv_cursor

declare land_cursor SCROLL CURSOR
FOR select distinct prop_id,
	   state_cd
    from  land_detail
    where prop_val_yr = @input_tax_yr
    and   sup_num     = @input_sup_num
  
OPEN land_cursor
FETCH NEXT from land_cursor into @prop_id, @land_state_cd

while (@@FETCH_STATUS = 0)
begin
	select top 1 @str_state_code = roll_state_code 
        from owner
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr

	if (@str_state_code is null)
	begin
		select @str_state_code = RTRIM(@land_state_cd)
	end
	else
	begin
		select @str_state_code = @str_state_code + ', ' + RTRIM(@land_state_cd)
	end

	update owner set roll_state_code = @str_state_code 
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr
	

	FETCH NEXT from land_cursor into @prop_id, @land_state_cd

end

CLOSE land_cursor
DEALLOCATE land_cursor

declare pers_prop_cursor SCROLL CURSOR
FOR select distinct prop_id,
	   pp_state_cd
    from  pers_prop_seg
    where prop_val_yr = @input_tax_yr
    and   sup_num     = @input_sup_num
  
OPEN pers_prop_cursor
FETCH NEXT from pers_prop_cursor into @prop_id, @pp_state_cd

while (@@FETCH_STATUS = 0)
begin
	select top 1 @str_state_code = roll_state_code 
        from owner
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr

	if (@str_state_code is null)
	begin
		select @str_state_code = RTRIM(@pp_state_cd)
	end
	else
	begin
		select @str_state_code = @str_state_code + ', ' + RTRIM(@pp_state_cd)
	end

	update owner set roll_state_code = @str_state_code 
	where prop_id      = @prop_id
	and   sup_num      = @input_sup_num
	and   owner_tax_yr = @input_tax_yr
	

	FETCH NEXT from pers_prop_cursor into @prop_id, @pp_state_cd

end

CLOSE pers_prop_cursor
DEALLOCATE pers_prop_cursor

GO

