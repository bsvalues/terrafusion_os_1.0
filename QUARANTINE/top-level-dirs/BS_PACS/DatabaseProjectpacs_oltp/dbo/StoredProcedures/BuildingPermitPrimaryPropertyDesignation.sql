
CREATE PROCEDURE BuildingPermitPrimaryPropertyDesignation

AS

SET NOCOUNT ON

-- Assumptions:
-- 1. We only want to update Building Permits that do not already have a primary_property assigned.
-- 2. When designating Primary Properties, we will use the Property that has the highest Market value
--    for the current Appraisal Year as the Primary Property.

DECLARE @permit TABLE
(
	bldg_permit_id INT, -- a Building Permit
	prop_count INT -- contains the number of Properties associated with bldg_permit_id
)

-- populate the @permit table with Building Permits and associated Property counts
INSERT INTO @permit
SELECT bp.bldg_permit_id,
	COUNT(prop_id) AS prop_count -- will contain the number of Properties associated
FROM prop_building_permit_assoc AS bp
	WITH (NOLOCK)
	LEFT JOIN
	(
		SELECT DISTINCT bldg_permit_id
		FROM prop_building_permit_assoc
			WITH (NOLOCK)
		WHERE primary_property = 1
	) AS t2
		ON bp.bldg_permit_id = t2.bldg_permit_id
WHERE t2.bldg_permit_id IS NULL -- only retrieve Building Permits without Primary Properties
GROUP BY bp.bldg_permit_id

-- set the Building Permit's Primary Property for single property permits
UPDATE pbpa
SET primary_property = 1
FROM prop_building_permit_assoc AS pbpa
	WITH (NOLOCK)
	JOIN @permit AS singleProp
		ON pbpa.bldg_permit_id = singleProp.bldg_permit_id
			AND singleProp.prop_count = 1

-- set the Building Permit's Primary Property for multi property permits

-- first, for a given Building Permit, we need to find out which of its associated Properties
-- has the highest value...
DECLARE @year NUMERIC(4,0) 
SET @year =
(
	SELECT appr_yr
	FROM pacs_system
		WITH (NOLOCK)
)

-- there will be a smaller number of Building Permits with multiple Property associations, theoretically;
-- so get the market values for the Properties in question
DECLARE @market TABLE
(
	bldg_permit_id INT,
	prop_id INT,
	market NUMERIC(14,0),
	primary_property BIT
)

INSERT INTO @market
(
	bldg_permit_id,
	prop_id,
	market
)
SELECT
	multiProp.bldg_permit_id,
	pv.prop_id,
	pv.market
FROM property_val AS pv
	WITH (NOLOCK)
	JOIN prop_supp_assoc AS psa  -- join here to get latest sup_num for year, prop_id
		ON pv.prop_val_yr = psa.owner_tax_yr
			AND pv.sup_num = psa.sup_num 
			AND pv.prop_id = psa.prop_id
	JOIN prop_building_permit_assoc AS pbpa
		ON pv.prop_id = pbpa.prop_id
	JOIN @permit AS multiProp
		ON pbpa.bldg_permit_id = multiProp.bldg_permit_id
			AND multiProp.prop_count > 1
WHERE pv.prop_val_yr = @year  

-- multiple Properties might have the same market value, so the following query
-- may update more than one Property...
-- but the query after this (the one that updates the live table) will only choose
-- one Property if multiple Properties are marked, based on the highest prop_id
UPDATE m
SET primary_property = 1
FROM @market AS m
	JOIN
	(
		SELECT
			bldg_permit_id,
			MAX(market) AS max_market
		FROM @market
		GROUP BY bldg_permit_id
	) AS mm
		ON m.bldg_permit_id = mm.bldg_permit_id
			AND m.market = mm.max_market

-- finally, update based on the highest value Property per Building Permit;
-- as stated earlier, if multiple Properties have the same highest value,
-- the one with the highest prop_id is arbitrarily chosen as the primary_property
UPDATE pbpa
SET primary_property = 1
FROM prop_building_permit_assoc AS pbpa
	WITH (NOLOCK)
	JOIN @permit AS multiProp
		ON pbpa.bldg_permit_id = multiProp.bldg_permit_id
			AND multiProp.prop_count > 1
	JOIN
	(
		SELECT
			bldg_permit_id,
			MAX(prop_id) AS prop_id
		FROM @market AS pv
		WHERE primary_property = 1
		GROUP BY bldg_permit_id
	) AS primProp
		ON pbpa.prop_id = primProp.prop_id

GO

