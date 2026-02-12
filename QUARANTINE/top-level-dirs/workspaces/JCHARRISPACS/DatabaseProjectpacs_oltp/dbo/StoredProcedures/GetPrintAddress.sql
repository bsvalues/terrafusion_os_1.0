

create procedure GetPrintAddress
	@lAcctID int,
	@szAddressMain varchar(512) output,
	@szAddressCity varchar(50) output,
	@szAddressState varchar(50) output,
	@szAddressZip varchar(50) output
as

set nocount on

	declare
		@szLine1 varchar(60),
		@szLine2 varchar(60),
		@szLine3 varchar(60)

	select
		@szLine1 = addr_line1,
		@szLine2 = addr_line2,
		@szLine3 = addr_line3,
		@szAddressCity = addr_city,
		@szAddressState = addr_state,
		@szAddressZip = addr_zip
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

set nocount off

GO

