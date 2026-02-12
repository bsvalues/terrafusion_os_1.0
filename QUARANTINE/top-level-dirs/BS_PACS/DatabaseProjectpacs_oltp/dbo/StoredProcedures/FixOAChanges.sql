
CREATE PROCEDURE FixOAChanges

AS


-- first backup everything into a temp table
SELECT * INTO #oa_tmp from oa_changes

-- now remove everything from oa_changes with a prop_id <> 0
DELETE FROM oa_changes WHERE prop_id <> 0

declare @oa_id int
declare @acct_id int
declare @acct_type varchar(1)
declare @change_type varchar(1)
declare @prop_id int
declare @owner_tax_yr int
declare @sup_num int
declare @update_dt datetime

DECLARE oa CURSOR FAST_FORWARD
FOR SELECT oa_id, acct_id, acct_type, change_type, prop_id,
			owner_tax_yr, sup_num, update_dt
	FROM #oa_tmp
	WHERE prop_id <> 0
	ORDER BY update_dt DESC

OPEN oa

FETCH NEXT FROM oa INTO @oa_id, @acct_id, @acct_type, @change_type, @prop_id,
						@owner_tax_yr, @sup_num, @update_dt

WHILE @@FETCH_STATUS = 0
BEGIN
	IF NOT(EXISTS(SELECT prop_id FROM oa_changes WHERE prop_id = @prop_id AND acct_type = @acct_type))
	BEGIN
		INSERT INTO oa_changes
		(acct_id, acct_type, change_type, prop_id, owner_tax_yr, sup_num, update_dt)
		VALUES
		(@acct_id, @acct_type, @change_type, @prop_id, @owner_tax_yr, @sup_num, @update_dt)
	END
	
	FETCH NEXT FROM oa INTO @oa_id, @acct_id, @acct_type, @change_type, @prop_id,
							@owner_tax_yr, @sup_num, @update_dt
END

CLOSE oa
DEALLOCATE oa

GO

