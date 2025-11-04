

CREATE PROCEDURE TriggerStatus

	@flag	varchar(1) = NULL,
	@suppress_output varchar(1) = 'F'
	
	--Values:
	--'T' - Enable all triggers
	--'F' - Disable all triggers

AS

--Author: EricZ
--Date: 08/16/2005
--Purpose: Provide an easy interface to enable/disable triggers as well as view the status of all triggers on a database

SET NOCOUNT ON

if @flag = 'T'
begin
	exec sp_msforeachtable "ALTER TABLE ? ENABLE TRIGGER all"

	if (@suppress_output = 'F')
	begin
		SET NOCOUNT OFF

		print char(10) + '********** ALL TRIGGERS ENABLED **********'
	end
end
else if @flag = 'F'
begin
	exec sp_msforeachtable "ALTER TABLE ? DISABLE TRIGGER all"

	if (@suppress_output = 'F')
	begin
		SET NOCOUNT OFF

		print char(10) + '********** ALL TRIGGERS DISABLED **********'
	end
end
else if @flag is null
begin
	if (@suppress_output = 'F')
	begin
		SET NOCOUNT OFF
	end
end
else
begin
	if (@suppress_output = 'F')
	begin
		SET NOCOUNT OFF

		print '********** Option not found; only ''T'' and ''F'' supported **********'
	end
end

if (@suppress_output = 'F')
begin
	SET NOCOUNT OFF

	print char(10) + '********** TRIGGER STATUS LIST **********' + char(10)

	SELECT TOP 100 PERCENT WITH TIES
		cast(T.[name] as varchar(50)) as TableName,
		cast(TR.[Name] as varchar(75)) as TriggerName,
		CASE WHEN 1=OBJECTPROPERTY(TR.[id], 'ExecIsTriggerDisabled') THEN 'Disabled' ELSE 'Enabled' END Status
	FROM sysobjects T INNER JOIN sysobjects TR
		on t.[ID] = TR.parent_obj
	WHERE (T.xtype = 'U' or T.XType = 'V')
		AND (TR.xtype = 'TR')
	ORDER BY T.[name],
		TR.[name]

end

GO

