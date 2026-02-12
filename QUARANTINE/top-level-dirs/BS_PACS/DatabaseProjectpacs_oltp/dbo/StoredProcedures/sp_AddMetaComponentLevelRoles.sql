
CREATE PROCEDURE dbo.sp_AddMetaComponentLevelRoles
		@component_level_id int
		,@role_type_list varchar(8000)
AS
SET NOCOUNT ON

declare @LIST varchar(8000)
set @LIST = @role_type_list
declare @counter int, @start int, @end int
set @counter = 0
set @end = 1
set @start = 1
declare @Delimiter char(1)
set @Delimiter = ','

    while charindex(@Delimiter, @LIST, 1) > 0 
    begin
        set @end = charindex(@Delimiter, @LIST, 1)
        set @counter = @counter + 1
		set @LIST = substring(@LIST, @end + 1, len(@LIST) - @end)
	end -- while loop
set @counter = @counter + 1

declare @num_params int
declare @var int
set @num_params = @counter
set @counter = 1
while(@counter <= @num_params)
begin

set @var = (select cast(dbo.fn_ParseDelimitedList(@role_type_list, ',', @counter) as int))

if not exists (select 1 from meta_component_level_role where component_level_id = @component_level_id and role_type = @var)
begin
	insert meta_component_level_role (component_level_id, role_type)
	values (@component_level_id, @var)
end

set @counter = @counter + 1
end

GO

