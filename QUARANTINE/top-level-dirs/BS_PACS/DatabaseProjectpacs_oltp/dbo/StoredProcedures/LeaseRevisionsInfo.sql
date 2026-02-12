

CREATE PROCEDURE LeaseRevisionsInfo

	@input_lease_id varchar(20),
	@input_lease_yr int

AS

	SELECT rev_num,
			CASE WHEN create_dt IS NULL THEN ''
				ELSE CONVERT(varchar(10), create_dt, 101)
			END as create_dt,
			rev_comment,
			(SELECT COUNT(prop_id)
			 FROM lease_prop_assoc as lpa
			 WITH (NOLOCK)
			 WHERE lpa.lease_id = lease.lease_id
			 AND lpa.lease_yr = lease.lease_yr
			 AND lpa.rev_num = lease.rev_num) as num_props
	FROM lease
	WITH (NOLOCK)
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr
	ORDER BY rev_num DESC

GO

