

CREATE PROCEDURE LeaseSupplementAllProperties

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int,
	@input_sup_num int,
	@input_type varchar(3)

AS

	declare @prop_id int
	declare @sup_num int
	declare @sup_cd varchar(10)
	declare @sup_desc varchar(500)
	declare @interest_type_cd varchar(5)
	declare @bSupplement bit

	SELECT @sup_cd = sup_cd,
			@sup_desc = sup_desc
	FROM lease
	WITH (NOLOCK)
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	AND rev_num = @input_rev_num

	/*
	 * Depending on what the user does, it is possible that
	 * some of the properties are already supplemented.  For
	 * example, if there was a split on a WI property, all WI
	 * properties would be supplemented when the user removes
	 * the WI property and then upon adding any others to
	 * complete the split, all would be supplemented again.
	 * Prevent supplementing the same properties by joining
	 * with prop_supp_assoc and sup_num <> lease.sup_num (@input_sup_num).
	 */

	DECLARE LeaseProps CURSOR FAST_FORWARD
	FOR	SELECT lpa.prop_id, lpa.sup_num, lpa.interest_type_cd
	FROM lease_prop_assoc as lpa
	WITH (NOLOCK)
	INNER JOIN prop_supp_assoc as psa
	ON lpa.prop_id = psa.prop_id
	AND lpa.lease_yr = psa.owner_tax_yr
	AND lpa.sup_num = psa.sup_num
	INNER JOIN property_val as pv
	WITH (NOLOCK)
	ON lpa.prop_id = pv.prop_id
	AND lpa.lease_yr = pv.prop_val_yr
	AND lpa.sup_num = pv.sup_num
	AND pv.prop_inactive_dt IS NULL
	WHERE lpa.lease_id = @input_lease_id
	AND lpa.lease_yr = @input_lease_yr
	AND lpa.rev_num = @input_rev_num
	AND lpa.sup_num <> @input_sup_num

	ORDER BY lpa.prop_id

	OPEN LeaseProps

	FETCH NEXT FROM LeaseProps INTO @prop_id, @sup_num, @interest_type_cd

	WHILE @@FETCH_STATUS = 0
	BEGIN
		SET @bSupplement = 0

		IF @input_type = 'ALL'
		BEGIN
			SET @bSupplement = 1
		END
		ELSE IF @input_type = 'WI'
		BEGIN
			IF @interest_type_cd = 'WI'
			BEGIN
				SET @bSupplement = 1
			END
		END
		ELSE IF @input_type = 'RI'
		BEGIN
			IF @interest_type_cd = 'RI' OR @interest_type_cd = 'OR'
			BEGIN
				SET @bSupplement = 1
			END
		END

		IF @bSupplement = 1
		BEGIN
			exec CreatePropertySupplementLayer @prop_id, @sup_num, @input_lease_yr, @input_sup_num, @input_lease_yr, @prop_id, 'F'

			/*
			 * CreatePropertySupplementLayer just copies the previous layer to the new one.
			 * So, after the new layer is created, update the sup_cd, desc and date with the
			 * information that the user entered upon hitting the Revise button.  Any property
			 * supplemented in here will be a modification because adds and deletes are
			 * processed separately in LeaseMineralPropertiesPg.cpp.
			 */
	
			UPDATE property_val
			SET sup_cd = @sup_cd,
				sup_desc = @sup_desc,
				sup_dt = getdate(),
				sup_action = 'M'
			WHERE prop_id = @prop_id
			AND prop_val_yr = @input_lease_yr
			AND sup_num = @input_sup_num
		END

		FETCH NEXT FROM LeaseProps INTO @prop_id, @sup_num, @interest_type_cd
	END

	CLOSE LeaseProps
	DEALLOCATE LeaseProps

GO

