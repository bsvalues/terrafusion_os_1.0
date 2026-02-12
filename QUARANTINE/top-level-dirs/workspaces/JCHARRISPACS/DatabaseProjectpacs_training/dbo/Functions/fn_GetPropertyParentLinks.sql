
create function fn_GetPropertyParentLinks
(
	@lPropID int,
	@lPropValYr numeric(4,0),
	@lSupNum int
)
returns varchar(512)
as
begin

	declare @szRet varchar(512)

	declare @lParentID int
	declare @lIndex int

	declare curProps cursor
	for
		select parent_prop_id
		from property_assoc with(nolock)
		where child_prop_id = @lPropID
		and prop_val_yr = @lPropValYr
		and sup_num = @lSupNum
	for read only

	open curProps
	fetch next from curProps into @lParentID

	set @szRet = ''
	set @lIndex = 0;
	while ( @@fetch_status = 0 )
	begin
		if ( @lIndex > 0 )
		begin
			set @szRet = @szRet + ', '
		end

		set @szRet = @szRet + convert(varchar(12), @lParentID)

		set @lIndex = @lIndex + 1
		fetch next from curProps into @lParentID
	end

	close curProps
	deallocate curProps

	return( @szRet )
end

GO

