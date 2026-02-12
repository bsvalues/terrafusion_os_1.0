

create PROCEDURE dbo.uspEnableAllTriggers
AS
	exec sp_msforeachtable @command1="print '?'", @command2="ALTER TABLE ? ENABLE TRIGGER  all"
	RETURN

GO

