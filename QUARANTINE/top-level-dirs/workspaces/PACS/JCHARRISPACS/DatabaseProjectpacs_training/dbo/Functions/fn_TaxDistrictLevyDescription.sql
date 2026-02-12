
create function fn_TaxDistrictLevyDescription(@input_tax_district_id int, @input_year numeric(4,0))

returns varchar(500)

as

begin
	declare @levy_desc varchar(500)
	declare @desc varchar(50)

	set @levy_desc = ''

	declare levy_cursor cursor fast_forward
	for select levy_description
		from levy as l
		with (nolock)
		where year = @input_year
		and tax_district_id = @input_tax_district_id
		order by l.levy_description

	open levy_cursor

	fetch next from levy_cursor into @desc

	while @@fetch_status = 0
	begin
		if len(@levy_desc) > 0
		begin
			set @levy_desc = @levy_desc + ', '
		end
		set @levy_desc = @levy_desc + @desc
		fetch next from levy_cursor into @desc
	end

	close levy_cursor
	deallocate levy_cursor

	return @levy_desc
end

GO

