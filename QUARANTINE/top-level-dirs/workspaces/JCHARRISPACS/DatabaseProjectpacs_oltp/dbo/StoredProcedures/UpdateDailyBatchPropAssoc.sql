
CREATE PROCEDURE UpdateDailyBatchPropAssoc

	@batch_id int,
	@prop_id int

AS

	SET NOCOUNT ON

	declare @prev_yr_assessed numeric(14,0)
	declare @appr_year int

	IF NOT(EXISTS(SELECT prop_id
					FROM daily_batch_prop_assoc
					WHERE batch_id = @batch_id
					AND prop_id = @prop_id))
	BEGIN
		SELECT TOP 1 @appr_year = appr_yr
		FROM pacs_system

		/*
		 * Get last year's assessed value for this property
		 */

		SELECT @prev_yr_assessed = assessed_val
		FROM property_val as pv WITH (NOLOCK)
		INNER JOIN prop_supp_assoc as psa WITH (NOLOCK)
		ON pv.prop_id = psa.prop_id
		AND pv.prop_val_yr = psa.owner_tax_yr
		AND pv.sup_num = psa.sup_num
		WHERE pv.prop_id = @prop_id
		AND pv.prop_val_yr = @appr_year - 1
		
		INSERT INTO daily_batch_prop_assoc
		(batch_id, prop_id, prev_yr_assessed)
		VALUES (@batch_id, @prop_id, @prev_yr_assessed)
	END

GO

