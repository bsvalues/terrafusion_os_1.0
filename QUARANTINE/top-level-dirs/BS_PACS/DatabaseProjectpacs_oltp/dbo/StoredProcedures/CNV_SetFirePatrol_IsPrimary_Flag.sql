CREATE PROCEDURE [dbo].[CNV_SetFirePatrol_IsPrimary_Flag]

@prop_val_yr AS INT,
@agency_id AS INT

AS

-- *******************************************************
-- Stored Procedure: CNV_SetFirePatrol_IsPrimary_Flag
-- Purpose: The purpose for the procedure is to 
--			set the user_property_val.is_primary flag
--			for Fire Patrol agency for a given year.
-- Created By: HJM - 09/25/2008
-- *******************************************************

SET NOCOUNT ON

-- Disable Triggers
ALTER TABLE user_property_val DISABLE TRIGGER ALL

-- Drop Temp Tables
IF object_id('tempdb..#TMP1') IS NOT NULL
BEGIN
	DROP TABLE #TMP1
END

-- Update Table user_property_val.is_primary - Reset the is_primary flag to zero
UPDATE upv SET
	upv.is_primary = 0
FROM user_property_val AS upv WITH(NOLOCK)
INNER JOIN prop_supp_assoc AS psa WITH(NOLOCK) ON
	psa.prop_id = upv.prop_id AND
	psa.owner_tax_yr = upv.prop_val_yr AND
	psa.sup_num = upv.sup_num
WHERE
	upv.prop_val_yr = @prop_val_yr

SELECT
	x.agency_id,
	x.owner_id,
	paav.*
INTO #TMP1
FROM property_assessment_attribute_val AS paav WITH(NOLOCK)
INNER JOIN (
				SELECT
					o.owner_id,
					ps.* 
				FROM property_special_assessment AS ps WITH(NOLOCK)
				INNER JOIN prop_supp_assoc AS psa WITH(NOLOCK) ON
					psa.prop_id = ps.prop_id AND
					psa.owner_tax_yr = ps.[year] AND
					psa.sup_num = ps.sup_num
				INNER JOIN owner AS o WITH(NOLOCK) ON
					o.prop_id = ps.prop_id AND
					o.owner_tax_yr = ps.[year] AND
					o.sup_num = ps.sup_num
				WHERE
					ps.agency_id = @agency_id AND
					ps.[year] = @prop_val_yr
			) AS x ON
	x.prop_id = paav.prop_id AND
	x.[year] = paav.prop_val_yr AND
	x.sup_num = paav.sup_num
WHERE
	paav.benefit_acres = (
							SELECT
								MAX(paav2.benefit_acres)								
							FROM property_assessment_attribute_val AS paav2 WITH(NOLOCK)
							INNER JOIN (
											SELECT
												o.owner_id,
												ps.* 
											FROM property_special_assessment AS ps WITH(NOLOCK)
											INNER JOIN prop_supp_assoc AS psa WITH(NOLOCK) ON
												psa.prop_id = ps.prop_id AND
												psa.owner_tax_yr = ps.[year] AND
												psa.sup_num = ps.sup_num
											INNER JOIN owner AS o WITH(NOLOCK) ON
												o.prop_id = ps.prop_id AND
												o.owner_tax_yr = ps.[year] AND
												o.sup_num = ps.sup_num
											WHERE
												ps.agency_id = @agency_id AND
												ps.[year] = @prop_val_yr
										) AS x2 ON
								x2.prop_id = paav2.prop_id AND
								x2.[year] = paav2.prop_val_yr AND
								x2.sup_num = paav2.sup_num
							WHERE
								x2.owner_id = x.owner_id AND
								paav2.prop_val_yr = paav.prop_val_yr AND
								paav2.sup_num = paav.sup_num
						 )

-- Update Table user_property_val.is_primary - Set the is_primary flag based on #TMP1
UPDATE upv SET
	upv.is_primary = 1
FROM user_property_val AS upv WITH(NOLOCK)
INNER JOIN #TMP1 AS t1 WITH(NOLOCK) ON
	t1.prop_id = upv.prop_id AND
	t1.prop_val_yr = upv.prop_val_yr AND
	t1.sup_num = upv.sup_num

-- Enable Triggers
ALTER TABLE user_property_val ENABLE TRIGGER ALL

GO

