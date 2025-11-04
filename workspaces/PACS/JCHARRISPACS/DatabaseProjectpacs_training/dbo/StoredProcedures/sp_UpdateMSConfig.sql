create procedure sp_UpdateMSConfig

	@year_of_costdata numeric(4,0),
	@type varchar(3)

as

set nocount on

if @type = 'com'
begin
	if not exists(select [year]
					from ms_config
					with (nolock)
					where [year] = @year_of_costdata + 1)
	begin
		insert ms_config
		([year])
		values
		(@year_of_costdata + 1)
	end

	update ms_config
	set commercial_enabled = 1,
		commercial_loaded = 1,
		commercial_report_date = '07/01/' + convert(varchar, @year_of_costdata)
	where [year] = @year_of_costdata + 1
end
else if @type = 'res'
begin
	if not exists(select [year]
					from ms_config
					with (nolock)
					where [year] = @year_of_costdata)
	begin
		insert ms_config
		([year])
		values
		(@year_of_costdata)
	end

	update ms_config
	set residential_enabled = 1,
		residential_loaded = 1
	where [year] = @year_of_costdata
end

set nocount off

GO

