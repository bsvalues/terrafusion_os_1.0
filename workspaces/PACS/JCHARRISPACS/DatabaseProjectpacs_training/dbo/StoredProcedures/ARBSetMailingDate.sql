


create procedure ARBSetMailingDate
	@dtMailing datetime
as

set nocount on

	declare @szMailingDate varchar(32)
	set @szMailingDate =
		datename(month, @dtMailing) + ' ' +
		convert(varchar(2), datepart(day, @dtMailing)) + ', ' +
		convert(varchar(4), datepart(year, @dtMailing))

	update _arb_mailing_date set
		szMailingDate = @szMailingDate
	where
		szHostName = host_name()

	if ( @@rowcount = 0 )
	begin
		insert _arb_mailing_date (
			szHostName, szMailingDate
		) values (
			host_name(), @szMailingDate
		)
	end

set nocount off

GO

