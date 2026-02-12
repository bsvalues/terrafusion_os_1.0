
create procedure sp_Blocks

as

set nocount on

select spid, blocked, hostname, cmd
into #tmp_processes
from master..sysprocesses with(nolock)

create table #tmp_blockers
(
	lSpid int not null
)

declare
	@lSpid int,
	@lBlocked int,
	@szHostname varchar(64),
	@szCmd varchar(64)

declare curProcs cursor
for
	select distinct blocked
	from #tmp_processes
	where blocked <> 0
for read only

open curProcs
fetch next from curProcs into @lBlocked

while @@fetch_status = 0
begin
	set @lSpid = @lBlocked
	while @lBlocked <> 0
	begin
		select @lBlocked = blocked
		from #tmp_processes
		where spid = @lBlocked

		if @lBlocked <> 0
		begin
			set @lSpid = @lBlocked
		end
	end

	insert #tmp_blockers values (@lSpid)

	fetch next from curProcs into @lBlocked
end

close curProcs
deallocate curProcs

declare curBlockers cursor
for
	select distinct lSpid, hostname, cmd
	from #tmp_blockers
	join #tmp_processes on
		#tmp_blockers.lSpid = #tmp_processes.spid
for read only

open curBlockers
fetch next from curBlockers into @lSpid, @szHostname, @szCmd

/* For each blocker */
while @@fetch_status = 0
begin
	print 'SPID = ' + convert(varchar(8), @lSpid)
	print 'Hostname = ' + rtrim(@szHostname)
	print 'Command = ' + rtrim(@szCmd)
	dbcc inputbuffer(@lSpid)
	fetch next from curBlockers into @lSpid, @szHostname, @szCmd
end

close curBlockers
deallocate curBlockers

set nocount off

GO

