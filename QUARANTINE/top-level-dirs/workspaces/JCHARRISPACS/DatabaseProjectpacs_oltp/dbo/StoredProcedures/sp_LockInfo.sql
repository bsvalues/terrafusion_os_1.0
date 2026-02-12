
create procedure sp_LockInfo
as

select
	resource_type = case s.rsc_type
		when 2 then 'DB'
		when 3 then 'File'
		when 4 then 'Index'
		when 5 then 'Table'
		when 6 then 'Page'
		when 7 then 'Key'
		when 8 then 'Extent'
		when 9 then 'Row'
		when 10 then 'App'
		else 'Unknown'
	end,
	so.name,
	rtrim(sp.hostname) as host,
	status = case s.req_status
		when 1 then 'Granted'
		when 2 then 'Converting'
		when 3 then 'Waiting'
		when 4 then 'Unknown'
	end
from master..syslockinfo as s
join master..sysprocesses as sp on
	s.req_spid = sp.spid
join sysobjects as so on
	s.rsc_objid = so.id
where
	s.rsc_dbid = db_id()

GO

