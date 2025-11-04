
create function fn_GetPhoneNumberList
(
	@acct_id int
)
returns varchar(8000)
as
begin

	declare @szList varchar(8000)
	set @szList = ''

	declare
		@szType varchar(5),
		@szNum varchar(20)

	declare curPhones cursor
	for
		select rtrim(phone_type_cd), rtrim(phone_num)
		from phone with(nolock)
		where acct_id = @acct_id
	for read only

	open curPhones
	fetch next from curPhones into @szType, @szNum

	while ( @@fetch_status = 0 )
	begin
		if ( @szList <> '' )
		begin
			set @szList = @szList + ' '
		end

		set @szList = @szList + @szType + ':' + @szNum

		fetch next from curPhones into @szType, @szNum
	end

	close curPhones
	deallocate curPhones

	return(@szList)

end

GO

