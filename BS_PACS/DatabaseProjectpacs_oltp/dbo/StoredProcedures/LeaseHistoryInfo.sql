

CREATE PROCEDURE LeaseHistoryInfo

	@input_lease_id varchar(20),
	@input_lease_yr int

AS

	SELECT CONVERT(varchar(10), chg_dt, 101) as chg_dt,
			RIGHT(CONVERT(VARCHAR(20), chg_dt, 100), 7) as chg_tm,
			chg_desc,
			full_name
	FROM lease_log
	INNER JOIN pacs_user
	ON lease_log.pacs_user_id = pacs_user.pacs_user_id
	WHERE lease_id = @input_lease_id
	AND lease_yr = @input_lease_yr

	ORDER BY lease_chg_id DESC

GO

