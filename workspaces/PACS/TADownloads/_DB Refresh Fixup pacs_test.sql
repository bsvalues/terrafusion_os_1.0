--Set authorization on the db
ALTER AUTHORIZATION on DATABASE::pacs_test to sa

--Set compatibility to sql version(80 = 2000, 90 = 2005, 100 = 2008, 110 = 2012, 120 = 2014, 130 = 2016, 140 = 2017, 150 =2019)
EXEC sp_dbcmptlevel pacs_test, 130;

--Set Trustworthy option
ALTER DATABASE pacs_test
SET TRUSTWORTHY ON
GO

--Set Recovery Mode to Simple
USE master ;
ALTER DATABASE pacs_test SET RECOVERY SIMPLE ;


--Set pacsnonprivy

use pacs_test;

if not exists (
	select *
	from master.dbo.syslogins
	where name = 'pacsnonprivy'
)
begin
	exec master.dbo.sp_addlogin 'pacsnonprivy', 'xi4b]ftx1p.w'
	exec master.dbo.sp_grantdbaccess 'pacsnonprivy'
end
go

if exists (
	select *
	from sysusers
	where name = 'pacsnonprivy'
)
begin
	exec sp_dropuser 'pacsnonprivy'
end
go

exec sp_grantdbaccess 'pacsnonprivy'
exec sp_addrolemember 'db_datareader', 'pacsnonprivy'
exec('grant insert on user_input_query to pacsnonprivy')
exec('grant insert on user_input_query_idlist to pacsnonprivy')
go