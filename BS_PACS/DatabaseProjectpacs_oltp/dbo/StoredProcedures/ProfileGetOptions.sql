


create procedure ProfileGetOptions

@input_run_id		int,
@output_date_range	varchar(50)	output,
@output_school		varchar(250)	output,
@output_state_code	varchar(250)	output,
@output_sale_type	varchar(250)	output

as

declare @entity_cd	varchar(5)
declare @begin_date	varchar(25)
declare @end_date	varchar(25)
declare @sale_type	varchar(5)
declare @state_cd	varchar(5)

set @output_school     = ''
set @output_state_code = ''
set @output_sale_type  = ''
set @output_date_range = ''

DECLARE school CURSOR FAST_FORWARD
FOR select  rtrim(entity.entity_cd)
from profile_run_list_options, entity
where run_id 	  = @input_run_id
and   option_type = 'SH'
and   option_id   = entity.entity_id

open school
fetch next from school into @entity_cd

while (@@FETCH_STATUS = 0)
begin
	if (@output_school = '')
	begin
		set @output_school = @entity_cd
	end
	else
	begin
		set @output_school = @output_school + ', ' + @entity_cd
	end

	fetch next from school into @entity_cd
end

close school
deallocate school



DECLARE state_codes CURSOR FAST_FORWARD
FOR select  rtrim(option_desc)
from profile_run_list_options
where run_id 	  = @input_run_id
and   option_type = 'SC'
order by option_desc

open state_codes
fetch next from state_codes into @state_cd

while (@@FETCH_STATUS = 0)
begin
	if (@output_state_code = '')
	begin
		set @output_state_code = @state_cd
	end
	else
	begin
		set @output_state_code = @output_state_code + ', ' + @state_cd
	end

	fetch next from state_codes into @state_cd
end

close state_codes
deallocate state_codes



DECLARE sale_type CURSOR FAST_FORWARD
FOR select  rtrim(option_desc)
from profile_run_list_options
where run_id 	  = @input_run_id
and   option_type = 'ST'
order by option_desc

open sale_type
fetch next from sale_type into @sale_type

while (@@FETCH_STATUS = 0)
begin
	if (@output_sale_type = '')
	begin
		set @output_sale_type = @sale_type
	end
	else
	begin
		set @output_sale_type = @output_sale_type + ', ' + @sale_type
	end
	
	fetch next from sale_type into @sale_type
end

close sale_type
deallocate sale_type

set @begin_date = ''
set @end_date   = ''

select @begin_date = rtrim(option_desc)
from profile_run_list_options
where option_type = 'BD'
and   run_id = @input_run_id

select @end_date = rtrim(option_desc)
from profile_run_list_options
where option_type = 'ED'
and   run_id = @input_run_id


if (@begin_date <> '' and @end_date <> '')
begin
	set @output_date_range = @begin_date + ' - ' + @end_date
end
else
begin
	set @output_date_range = '<ALL>'
end
	

if (@output_school = '')
begin
	set @output_school = '<ALL>'
end

if (@output_state_code = '')
begin
	set @output_state_code = '<ALL>'
end

if (@output_sale_type = '')
begin
	set @output_sale_type  = '<ALL>'
end

GO

