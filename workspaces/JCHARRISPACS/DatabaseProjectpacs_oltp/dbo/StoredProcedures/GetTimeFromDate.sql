

create procedure GetTimeFromDate
	@dt datetime,
	@szTime varchar(16) output
as

set nocount on

	declare @l int
	declare @lMinute int
	set @l = datepart(hour, @dt)
	if ( @l > 12 )
	begin
		set @lMinute = datepart(minute, @dt)
		if ( @lMinute < 10 )
		begin
			set @szTime = convert(varchar(2), @l - 12) + ':0' + convert(varchar(2), @lMinute) + ' PM'
		end
		else
		begin
			set @szTime = convert(varchar(2), @l - 12) + ':' + convert(varchar(2), @lMinute) + ' PM'
		end
	end
	else
	begin
		set @lMinute = datepart(minute, @dt)
		if ( @lMinute < 10 )
		begin
			set @szTime = convert(varchar(2), @l) + ':0' + convert(varchar(2), @lMinute) + ' AM'
		end
		else
		begin
			set @szTime = convert(varchar(2), @l) + ':' + convert(varchar(2), @lMinute) + ' AM'
		end
	end

set nocount off

GO

