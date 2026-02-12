

create procedure ARBGetExemptions

@prop_id 	int,
@sup_num	int,
@prop_val_yr	numeric(4),
@exemptions	varchar(50) output

as

declare @exmpt_type_cd	varchar(50)

set @exemptions = ''

DECLARE EXEMPTIONS insensitive cursor
FOR select distinct RTRIM(exmpt_type_cd) as exmpt_type_cd
    from property_exemption with(nolock)
    where prop_id      = @prop_id
	and   exmpt_tax_yr = @prop_val_yr
    and   owner_tax_yr = @prop_val_yr
    and   sup_num      = @sup_num
    order by 1

OPEN EXEMPTIONS
FETCH NEXT FROM EXEMPTIONS INTO @exmpt_type_cd

WHILE (@@FETCH_STATUS = 0)
BEGIN
	if (@exemptions = '')
	begin
		set @exemptions = @exmpt_type_cd
	end
	else
	begin
		set @exemptions = @exemptions + ', '
		set @exemptions = @exemptions + @exmpt_type_cd
	end

	FETCH NEXT FROM EXEMPTIONS INTO @exmpt_type_cd
END

CLOSE EXEMPTIONS
DEALLOCATE EXEMPTIONS

GO

