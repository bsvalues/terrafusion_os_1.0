

CREATE PROCEDURE LeasePropertyList

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int

AS

	SELECT lpa.prop_id,
			lpa.sup_num,
			lpa.interest_type_cd,
			lpa.interest_pct,
			a.file_as_name as owner_name,
			ISNULL(pv.assessed_val, 0) as value
	FROM lease_prop_assoc as lpa
	WITH (NOLOCK)

	INNER JOIN prop_supp_assoc as psa
	WITH (NOLOCK)
	ON lpa.prop_id = psa.prop_id
	AND lpa.lease_yr = psa.owner_tax_yr
	AND lpa.sup_num = psa.sup_num

	INNER JOIN owner as o
	WITH (NOLOCK)
	ON lpa.prop_id = o.prop_id
	AND lpa.lease_yr = o.owner_tax_yr
	AND lpa.sup_num = o.sup_num

	INNER JOIN account as a
	WITH (NOLOCK)
	ON o.owner_id = a.acct_id

	INNER JOIN property_val as pv
	WITH (NOLOCK)
	ON lpa.prop_id = pv.prop_id
	AND lpa.lease_yr = pv.prop_val_yr
	AND lpa.sup_num = pv.sup_num

	WHERE lpa.lease_id = @input_lease_id
	AND lpa.lease_yr = @input_lease_yr
	AND lpa.rev_num = @input_rev_num
	AND pv.prop_inactive_dt IS NULL

	ORDER BY lpa.interest_type_cd, a.file_as_name

GO

