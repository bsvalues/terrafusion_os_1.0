

CREATE PROCEDURE CreateLeaseLayer

	@input_from_year int,
	@input_to_year int

AS

	declare @lease_id varchar(20)

	declare LeaseCursor CURSOR FAST_FORWARD
	FOR SELECT DISTINCT lease_id
		FROM lease
		WHERE lease_yr = @input_from_year
		AND lease_inactive_dt IS NULL
		ORDER BY lease_id

	OPEN LeaseCursor

	FETCH NEXT FROM LeaseCursor INTO @lease_id

	WHILE @@FETCH_STATUS = 0
	BEGIN
		exec CopyLease @lease_id, @lease_id, @input_from_year, @input_to_year
		FETCH NEXT FROM LeaseCursor INTO @lease_id
	END

	CLOSE LeaseCursor
	DEALLOCATE LeaseCursor

GO

