
create procedure sp_SaveTextFile
	@file_name varchar(255) = NULL,
	@trusted bit = 1,
	@user varchar(32) = NULL,
	@pwd varchar(32) = NULL
as

declare @cmd varchar(512)

if @file_name is NULL
begin
	If object_id('tempdb..##text_export_table')  IS NULL
		begin
			create table ##text_export_table
			(
				text varchar(8000),
				seq int not null,
				spid int not null
			)
		end 
	delete from ##text_export_table where spid=@@SPID
	return
end

if @trusted = 0
	begin
		set @cmd='bcp "select text from ##text_export_table where spid='+cast(@@SPID as varchar(10))+ 'order by seq" queryout "'+@file_name+'" -c -q -S"'+@@SERVERNAME+'" -U"'+@user+'" -P"'+@pwd+'"'
		exec master..xp_CmdShell @cmd
	end
else
	begin
		set @cmd='bcp "select text from ##text_export_table where spid='+cast(@@SPID as varchar(10))+ 'order by seq" queryout "'+@file_name+'" -c -q -S"'+@@SERVERNAME+'" -T'
		exec master..xp_CmdShell @cmd
	end

GO

