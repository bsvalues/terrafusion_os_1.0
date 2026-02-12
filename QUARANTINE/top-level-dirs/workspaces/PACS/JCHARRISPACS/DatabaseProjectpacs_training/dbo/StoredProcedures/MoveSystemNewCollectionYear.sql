
CREATE PROCEDURE MoveSystemNewCollectionYear
AS

-- local variable to hold the new tax year
DECLARE @newTaxYear INT

-- determine what the new tax year will be
SELECT @newTaxYear = tax_yr + 1
FROM pacs_system
	WITH (NOLOCK)

-- update the system to the new tax year
UPDATE pacs_system
SET tax_yr = @newTaxYear

-- for all Treasurer-type users whose default property search year is the old tax year,
-- update their default property search year to the new tax year
UPDATE pacs_user_settings
SET [value] = @newTaxYear
WHERE settings_group = 'PROPERTYSEARCHSETTINGS'
	AND [name] = 'PROPERTYSEARCHSETTINGS_YEAR'
	AND [value] = @newTaxYear - 1
	AND pacs_user_id IN
	(
		-- detect users whose default role is Treasurer
		SELECT pu.pacs_user_id
		FROM pacs_user pu
			WITH (NOLOCK)
			JOIN user_role_user_assoc urua
				WITH (NOLOCK)
				ON urua.pacs_user_id = pu.pacs_user_id
			JOIN user_role ur
				WITH (NOLOCK)
				ON ur.role_id = urua.role_id
		WHERE urua.default_role = 1
			AND ur.role_type = 1
	)

GO

