

create procedure InsertIntegrityCheckHistory
	@process_cd VARCHAR(10),
	@check_type INT,
	@range_type VARCHAR(10),
	@year VARCHAR (100),
	@sup_num INT,
	@pacs_user_id INT,
	@entities VARCHAR (255),
	@options VARCHAR (50),
	@ic_ref_id VARCHAR(10) = NULL
as

SET nocount on

	DECLARE @batch_id INT
	DECLARE @curdate DATETIME;
	DECLARE @expdate DATETIME;
	DECLARE @description VARCHAR(150);
	DECLARE @pacs_user_name VARCHAR(30);
	DECLARE @process_desc VARCHAR(50);

	SELECT @pacs_user_name = pacs_user_name
	FROM pacs_user
	WHERE pacs_user_id = @pacs_user_id

	SELECT @process_desc = process_desc
	FROM integrity_process_cd
	WHERE process_cd = @process_cd

	SET @curdate = GETDATE();

	--This removes the Time portion of getdate
	SET @expdate = DATEADD(month, 6, CONVERT(DATETIME, CEILING(CONVERT(FLOAT, GETDATE()))));


	SET @description = @process_desc;
	IF( @ic_ref_id != '')
	BEGIN
		SET @description = @description + ' w/ ID:' + @ic_ref_id;
	END

	SET @description = @description + ' On ' + convert(VARCHAR, @curdate) + 
		' By User:' + @pacs_user_name;
	INSERT integrity_check_history (
		process_cd, 
		check_type, 
		range_type,
		check_dt, 
		year, 
		sup_num, 
		pacs_user_id, 
		description, 
		expiration_dt, 
		ic_ref_id,
		entities,
		options
	) VALUES (
		@process_cd, 
		@check_type,
		@range_type,
		getdate(), 
		@year,
		@sup_num,
		@pacs_user_id, 
		rtrim(@description), 
		@expdate, 
		@ic_ref_id,
		@entities,
		@options
	)

	SET @batch_id = @@identity

SET nocount off

	SELECT batch_id = @batch_id

GO

