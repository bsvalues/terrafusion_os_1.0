
CREATE PROCEDURE TNTExportInsert

	@input_exported_yr int,
	@input_pacs_user_id int,
	@input_entities varchar(500)

AS

declare @sup_num int
declare @last_sup_num int
declare @status_cd varchar(5)
declare @bFound bit
declare @tnt_export_id int
declare @strSQL varchar(1000)


SET NOCOUNT ON

	declare SUPPS CURSOR FAST_FORWARD
	FOR SELECT DISTINCT sup_num, status_cd
		FROM supplement as s
		WITH (NOLOCK)
		INNER JOIN sup_group as sg
		WITH (NOLOCK)
		ON s.sup_group_id = sg.sup_group_id
		WHERE sup_tax_yr = @input_exported_yr - 1
		ORDER BY sup_num
	
	OPEN SUPPS
	
	FETCH NEXT FROM SUPPS INTO @sup_num, @status_cd
	
	SET @bFound = 0
	SET @last_sup_num = 0
	
	WHILE @@FETCH_STATUS = 0 AND @bFound = 0
	BEGIN
		IF @status_cd <> 'A' AND @status_cd <> 'BC'
		BEGIN
			SET @bFound = 1
		END
		ELSE
		BEGIN
			SET @last_sup_num = @sup_num
		END
	
		FETCH NEXT FROM SUPPS INTO @sup_num, @status_cd
	END
	
	CLOSE SUPPS
	DEALLOCATE SUPPS

	INSERT INTO tnt_export
	(exported_yr, prev_yr_sup_num, pacs_user_id, entities, run_date_time)
	VALUES
	(@input_exported_yr, @last_sup_num, @input_pacs_user_id, @input_entities, getdate())

	SELECT @tnt_export_id = @@IDENTITY

	SET @input_entities = REPLACE(@input_entities, ',', ''',''')

	SET @strSQL = 'INSERT INTO tnt_export_entity '
	SET @strSQL = @strSQL + 'SELECT ' + convert(varchar(10), @tnt_export_id) + ', entity_id '
	SET @strSQL = @strSQL + 'FROM entity '
	SET @strSQL = @strSQL + 'WHERE entity_cd IN (''' + @input_entities + ''') '

	exec (@strSQL)

	SELECT next_id = @tnt_export_id,
			prev_yr_sup_num = @last_sup_num

GO

