
CREATE PROCEDURE ReviseLease

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_revision_comment varchar(255),
	@input_sup_cd varchar(10),
	@input_sup_desc varchar(500),
	@input_user_id int

AS

declare @sup_group_id int
declare @sup_num int
declare @rev_num int


SET XACT_ABORT ON
SET NOCOUNT ON

BEGIN TRANSACTION

	exec CopyLease @input_lease_id, @input_lease_id, @input_lease_yr, @input_lease_yr

	/*
	 * Now check if there's a supplement open in Coding status.  If so, use it,
	 * else, create one.
	 */

	IF EXISTS(SELECT sup_group_id
				FROM sup_group
				WITH (NOLOCK)
				WHERE status_cd = 'C')
	BEGIN

		/*
		 * There really only should be 1 supplement group in the coding
		 * stage.  The TOP 1 is just a precaution in case things change
		 * later.
		 */

		SELECT TOP 1 @sup_group_id = sup_group_id
		FROM sup_group
		WITH (NOLOCK)
		WHERE status_cd = 'C'
	END
	ELSE
	BEGIN
		exec dbo.GetUniqueID 'sup_group', @sup_group_id output, 1, 0

		INSERT INTO sup_group
		(sup_group_id, sup_create_dt, status_cd)
		VALUES
		(@sup_group_id, getdate(), 'C')
	END

	/*
	 * Now check to see if there's a supplement with the year wanted.
	 */

	IF NOT(EXISTS(SELECT sup_tax_yr
				FROM supplement
				WITH (NOLOCK)
				WHERE sup_group_id = @sup_group_id))
	BEGIN
		/*
		 * There might not be a next_id row for the year, so create that too.
		 */

		IF NOT(EXISTS(SELECT next_sup_id 
						FROM next_supp_id
						WITH (NOLOCK)
						WHERE sup_year = @input_lease_yr))
		BEGIN
			INSERT INTO next_supp_id
			(sup_year, next_sup_id)
			VALUES(@input_lease_yr, 2)

			SET @sup_num = 1
		END
		ELSE
		BEGIN
			SELECT @sup_num = next_sup_id
			FROM next_supp_id
			WITH (NOLOCK)
			WHERE sup_year = @input_lease_yr

			UPDATE next_supp_id
			SET next_sup_id = @sup_num + 1
			WHERE sup_year = @input_lease_yr
		END

		INSERT INTO supplement
		(sup_tax_yr, sup_num, sup_group_id)
		VALUES
		(@input_lease_yr, @sup_num, @sup_group_id)
	END
	ELSE
	BEGIN
		SELECT @sup_num = sup_num
		FROM supplement
		WITH (NOLOCK)
		WHERE sup_group_id = @sup_group_id
		AND sup_tax_yr = @input_lease_yr
	END

	SELECT @rev_num = MAX(rev_num)
	FROM lease
	WITH (NOLOCK)
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr

	UPDATE lease
	SET rev_comment = @input_revision_comment,
		sup_cd = @input_sup_cd,
		sup_desc = @input_sup_desc,
		sup_group_id = @sup_group_id,
		sup_num = @sup_num
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @rev_num

	INSERT INTO lease_log
	(lease_id, lease_yr, chg_desc, chg_dt, pacs_user_id)
	VALUES
	(@input_lease_id, @input_lease_yr, 
		'Created Revision #' + CONVERT(varchar(5), @rev_num),
		getdate(), @input_user_id)

COMMIT TRANSACTION

SET XACT_ABORT OFF

GO

