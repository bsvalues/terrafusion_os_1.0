

create procedure GetPrintAddressEX
	@lAcctID int,
	@szAddressMain varchar(512) output,
	@szAddressCity varchar(50) output,
	@szAddressState varchar(50) output,
	@szAddressZip varchar(50) output, 
	@szZip varchar(5) output,
	@szCass varchar(4) output,
	@szRoute varchar(2) output,
	@szZip_4_2 varchar(14) output,
	@szAddressMainLine1 varchar(65) output,
	@szAddressMainLine2 varchar(65) output,
	@szAddressMainLine3 varchar(65) output,
	@szAddressMainLine4 varchar(65) output

as

set nocount on

	declare
		@szLine1	varchar(60),
		@szLine2	varchar(60),
		@szLine3	varchar(60),
		@nLine		int


	set @nLine = 1


	select
		@szLine1 = isnull(addr_line1,''),
		@szLine2 = isnull(addr_line2,''),
		@szLine3 = isnull(addr_line3,''),
		@szAddressCity = isnull(addr_city,''),
		@szAddressState = isnull(addr_state,''),
		@szAddressZip = isnull(addr_zip,''),
		@szZip = ISNULL(zip,''),
		@szCass = ISNULL(cass,''),
		@szRoute = ISNULL(route, ''),
		@szZip_4_2 = ISNULL(zip_4_2, '')

	from address with(nolock)
	where
		acct_id = @lAcctID and
		primary_addr = 'Y'

	set @szAddressMain = ''
	if ( @szLine1 <> '' )
	begin
		set @szAddressMain = @szLine1 + char(13)
	end
	if ( @szLine2 <> '' )
	begin
		set @szAddressMain = @szAddressMain + @szLine2 + char(13)
	end
	if ( @szLine3 <> '' )
	begin
		set @szAddressMain = @szAddressMain + @szLine3 + char(13)
	end

	/* Strip off the last char(13) */
	if ( len(@szAddressMain) > 0 )
	begin
		set @szAddressMain = left(@szAddressMain, len(@szAddressMain) - 1)
	end

	/* now set these in case szMainAddress is tabbed over as CR will left justify the second and subsequent lines */
		set @szAddressMainLine1  = ''
	set @szAddressMainLine2  = ''
	set @szAddressMainLine3  = ''
	set @szAddressMainLine4  = ''

	set @nLine = 1;
	if ( @szLine1 <> '' )
	begin
		set @szAddressMainLine1 = @szLine1
		set @nLine = 2
	end

	if ( @szLine2 <> '' )
	begin
		if(@nLine = 2)
		begin
			set @szAddressMainLine2 = @szLine2
			set @nLine = 3
		end
		else
		begin
			set @szAddressMainLine1 = @szLine2
			set @nLine = 2
		end
	end

	if ( @szLine3 <> '' )
	begin
		if(@nLine = 3)
		begin
			set @szAddressMainLine3 = @szLine3
			set @nLine = 4
		end
		else
		if(@nLine = 2)
		begin
			set @szAddressMainLine2 = @szLine3
			set @nLine = 3
		end
		else
		begin
			set @szAddressMainLine1 = @szLine3
			set @nLine = 2
		end
	end

	if(@nLine = 4)
	begin
		set @szAddressMainLine4 =  @szAddressCity + ', ' + @szAddressState + '  ' + @szAddressZip
	end
	else
	if(@nLine = 3)
	begin
		set @szAddressMainLine3 =  @szAddressCity + ', ' + @szAddressState + '  ' + @szAddressZip
	end
	else
	if(@nLine = 2)
	begin
		set @szAddressMainLine2 =  @szAddressCity + ', ' + @szAddressState + '  ' + @szAddressZip
	end
	else
	if(@nLine = 1)
	begin
		set @szAddressMainLine1 =  @szAddressCity + ', ' + @szAddressState + '  ' + @szAddressZip
	end
set nocount off

GO

