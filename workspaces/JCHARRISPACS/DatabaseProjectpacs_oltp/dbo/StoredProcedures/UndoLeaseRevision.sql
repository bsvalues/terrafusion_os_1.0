

CREATE PROCEDURE UndoLeaseRevision

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int,
	@input_user_id int

AS

	declare @sup_num int
	declare @prop_id int
	declare @next_yr int


	SELECT @sup_num = sup_num
	FROM lease
	WITH (NOLOCK)
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @input_rev_num

	/*
	 * Use this sup_num to delete the properties, if any, from the
	 * supplement.
	 */

	declare LeaseProps CURSOR FAST_FORWARD
	FOR	SELECT prop_id
		FROM lease_prop_assoc as lpa
		WITH (NOLOCK)
		WHERE lpa.lease_id = @input_lease_id
		AND lpa.lease_yr = @input_lease_yr
		AND lpa.rev_num = @input_rev_num
		AND lpa.sup_num = @sup_num

	OPEN LeaseProps

	FETCH NEXT FROM LeaseProps INTO @prop_id

	SET @next_yr = @input_lease_yr + 1

	WHILE @@FETCH_STATUS = 0
	BEGIN
		exec DeletePropertySupplementLayer @prop_id, @sup_num, @input_lease_yr

		/*
		 * It also created a property for the next year layer as well.  So
		 * delete that one too.
		 */

		exec DeletePropertySupplementLayer @prop_id, 0, @next_yr

		/*
		 * If this property was added for this lease revision, this property
		 * should now be physically deleted as this revision is now being
		 * undone.  If this property was in a previous revision, there should
		 * still be a row in property_val with sup_num 0 or possibly another
		 * sup_num at this point.  So if there are no rows in property_val,
		 * it should be safe to delete it.
		 * 
		 * This check needs to be done because the property could have been
		 * modified or deleted as well, in which case the property should not
		 * be deleted.
		 */

		IF NOT(EXISTS(SELECT prop_id
						FROM property_val
						WITH (NOLOCK)
						WHERE prop_id = @prop_id))
		BEGIN
			exec DeleteProperty @prop_id
		END

		FETCH NEXT FROM LeaseProps INTO @prop_id
	END

	CLOSE LeaseProps
	DEALLOCATE LeaseProps

	/*
	 * Now that the supplemented properties are gone, remove all rev_num
	 * related rows from tables.
	 */

	DELETE FROM lease_entity_assoc
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @input_rev_num

	DELETE FROM lease_prop_assoc
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @input_rev_num

	DELETE FROM lease
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @input_rev_num

	INSERT INTO lease_log
	(lease_id, lease_yr, chg_desc, chg_dt, pacs_user_id)
	VALUES
	(@input_lease_id, @input_lease_yr, 
		'Undo Lease Revision #' + CONVERT(varchar(5), @input_rev_num),
		getdate(), @input_user_id)

GO

