
create procedure GetPIDDivisionRange
	@lYear numeric(4,0),
	@lSupNum int,
	@lNumRangesOrNumProps int,
	@bRange bit = 1
		/*
			Set to 1 to specify the # of ranges
			Zero means caller doesn't know how many ranges, but rather, how many properties per range
		*/
as

set nocount on

	declare @tbl table (
		lID int identity(1,1) not null,
		lPropID int not null,
		primary key clustered (lID)
		with fillfactor = 100
	)

	declare @lRowCount int

	insert @tbl (lPropID)
	select prop_id
	from property_val with(nolock)
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_inactive_dt is null
	order by prop_id asc

	select @lRowCount = @@rowcount

	declare @lPerRange int

	if ( @bRange = 1 )
	begin
		set @lPerRange = @lRowCount / @lNumRangesOrNumProps
	end
	else
	begin
		set @lPerRange = @lNumRangesOrNumProps /* # of properties */
	end

	declare @tblRS table (
		lPropID int not null
	)

	declare @lIndex int
	set @lIndex = 1

	declare @lPropID int

	while ( @bRange = 0 or @lIndex < @lNumRangesOrNumProps )
	begin
		insert @tblRS (lPropID)
		select lPropID
		from @tbl
		where lID = (@lIndex * @lPerRange)

		if ( @@rowcount = 0 and @bRange = 0 )
		begin
			/*
				If caller specifies the # of properties,
				then we do not know the # of ranges,
				so break when we have run out of properties
			*/
			break
		end

		set @lIndex = @lIndex + 1
	end

set nocount off

	select lPropID
	from @tblRS
	order by lPropID asc

GO

