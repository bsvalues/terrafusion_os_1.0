
CREATE PROCEDURE UpdateDailyBatch

	@batch_id int,
	@description varchar(50),
	@comment varchar(255),
	@user_id int

AS
	SET NOCOUNT ON

	IF NOT(EXISTS(SELECT batch_id
					FROM daily_batch
					WHERE batch_id = @batch_id))
	BEGIN
		IF @batch_id = 0
		BEGIN
			INSERT INTO daily_batch
			(batch_desc, batch_comment, batch_user_id, batch_create_dt)
			VALUES
			(@description, @comment, @user_id, getdate())

			SET NOCOUNT OFF

			SELECT cast(@@IDENTITY as int) as batch_id
		END
	END
	ELSE
	BEGIN
		UPDATE daily_batch
		SET batch_desc = @description,
			batch_comment = @comment
		WHERE batch_id = @batch_id

		SET NOCOUNT OFF

		SELECT @batch_id as batch_id
	END

GO

