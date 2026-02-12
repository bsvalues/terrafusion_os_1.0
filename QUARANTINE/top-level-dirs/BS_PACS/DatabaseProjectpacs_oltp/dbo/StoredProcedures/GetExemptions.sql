




CREATE procedure GetExemptions

@input_type	      char(1),
@input_prop_id	      int,
@input_owner_id       int,
@input_sup_num        int,
@input_yr	      numeric(4),
@input_exemptions     varchar(250) output

as

declare @exmpt_type_cd	varchar(5)

declare @strSQL		varchar(2048)

set @strSQL = ' DECLARE EXEMPTIONS CURSOR FAST_FORWARD'
set @strSQL = @strSQL + ' FOR select '
set @strSQL = @strSQL + ' exmpt_type_cd'

if (@input_type = 'P')
begin
	set @strSQL = @strSQL + ' from prelim_property_exemption '
end
else
begin
	set @strSQL = @strSQL + ' from property_exemption'
end

set @strSQL = @strSQL + ' where prop_id  = ' + convert(varchar(15), @input_prop_id)
set @strSQL = @strSQL + ' and   owner_id = ' + convert(varchar(15), @input_owner_id)
set @strSQL = @strSQL + ' and   sup_num  = ' + convert(varchar(15), @input_sup_num)
set @strSQL = @strSQL + ' and   owner_tax_yr  =' + convert(varchar(4), @input_yr)

exec (@strSQL)

OPEN EXEMPTIONS
FETCH NEXT FROM EXEMPTIONS into @exmpt_type_cd

while (@@FETCH_STATUS = 0)
begin
	set @exmpt_type_cd = rtrim(@exmpt_type_cd)

	if (@input_exemptions = '')
	begin
		set @input_exemptions = @exmpt_type_cd
	end
	else
	begin
		set @input_exemptions = @input_exemptions + ', ' + @exmpt_type_cd
	end

	FETCH NEXT FROM EXEMPTIONS into @exmpt_type_cd
end

CLOSE EXEMPTIONS
DEALLOCATE EXEMPTIONS

GO

