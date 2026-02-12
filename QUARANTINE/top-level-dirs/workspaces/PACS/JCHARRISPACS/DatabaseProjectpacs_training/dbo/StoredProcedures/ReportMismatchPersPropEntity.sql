
CREATE   PROCEDURE ReportMismatchPersPropEntity
	@appr_year int = null,
	@spid      int = null

AS


-- Delete any previous records associated with this SPID
delete from ##mismatch_pers_prop_entity_work where session_id=@spid

if	@appr_year is null
	return

DECLARE @parent_prop int
DECLARE @child_prop int
DECLARE @prop_val_p numeric(19,2)

---------------------------------
-- BEGIN QUERY AND CURSOR DECLARE
-- First part of UNION picks entities from real props missing in personal props.
-- Second part of UNION picks entities from personal props missing in real props.
DECLARE mismatch_curs cursor FOR

-- First part of UNION picks entities from real props missing in personal props.
SELECT DISTINCT
	prop1.prop_id AS prop1,
	prop2.prop_id AS prop2
FROM -- parent_prop_id, child_prop_id
	property_assoc AS p1
INNER JOIN -- parent_prop_id, child_prop_id
	property_assoc AS p2 ON
	p2.parent_prop_id = p1.child_prop_id AND
	p2.child_prop_id = p1.parent_prop_id
INNER JOIN -- prop_id
	property AS prop1 ON
	p1.parent_prop_id = prop1.prop_id
INNER JOIN -- prop_id
	property AS prop2 ON
	p1.child_prop_id = prop2.prop_id
INNER JOIN -- prop_id, prop_val_yr, sup_num
	property_val AS pv1 ON
	p1.parent_prop_id = pv1.prop_id AND
	pv1.prop_val_yr = @appr_year AND
	(pv1.prop_inactive_dt IS NULL OR ISNULL(pv1.udi_parent, '') = 'T')
INNER JOIN -- prop_id, prop_val_yr, sup_num
	property_val AS pv2 ON
	p1.child_prop_id = pv2.prop_id AND
	pv2.prop_val_yr = @appr_year AND
	(pv2.prop_inactive_dt IS NULL OR ISNULL(pv2.udi_parent, '') = 'T')
INNER JOIN -- entity_id, prop_id, sup_num, tax_yr
	entity_prop_assoc AS epa ON
	epa.prop_id = pv1.prop_id AND
	epa.tax_yr = @appr_year AND
	epa.sup_num = pv1.sup_num
INNER JOIN -- prop_id, owner_tax_yr, sup_num
	prop_supp_assoc psa1 ON
	psa1.prop_id = prop1.prop_id AND
	psa1.owner_tax_yr = pv1.prop_val_yr AND
	psa1.sup_num = pv1.sup_num
INNER JOIN -- prop_id, owner_tax_yr, sup_num
	prop_supp_assoc psa2 ON
	psa2.prop_id = prop2.prop_id AND
	psa2.owner_tax_yr = pv2.prop_val_yr AND
	psa2.sup_num = pv2.sup_num
WHERE
	prop1.prop_type_cd = 'R' AND
	prop2.prop_type_cd = 'P' AND
	epa.tax_yr = @appr_year AND
	NOT EXISTS
		(
			SELECT
				e2.entity_id
			FROM
				entity_prop_assoc AS e2
			WHERE
				e2.entity_id = epa.entity_id AND
				e2.tax_yr = @appr_year AND
				e2.prop_id = pv2.prop_id AND
				e2.sup_num = pv2.sup_num
		)

UNION

-- Second part of UNION	picks entities FROM personal props missing in real props.
SELECT DISTINCT
	prop1.prop_id AS prop1,
	prop2.prop_id AS prop2
FROM -- parent_prop_id, child_prop_id
	property_assoc AS p1
INNER JOIN -- parent_prop_id, child_prop_id
	property_assoc AS p2 ON
	p2.parent_prop_id = p1.child_prop_id AND
	p2.child_prop_id = p1.parent_prop_id
INNER JOIN -- prop_id
	property AS prop1 ON
	p1.parent_prop_id = prop1.prop_id
INNER JOIN -- prop_id
	property AS prop2 ON
	p1.child_prop_id = prop2.prop_id
INNER JOIN -- prop_id, prop_val_yr, sup_num
	property_val AS pv1 ON
	p1.parent_prop_id = pv1.prop_id AND
	pv1.prop_val_yr = @appr_year AND
	(pv1.prop_inactive_dt IS NULL OR ISNULL(pv1.udi_parent, '') = 'T')
INNER JOIN -- prop_id, prop_val_yr, sup_num
	property_val AS pv2 ON
	p1.child_prop_id = pv2.prop_id AND
	pv2.prop_val_yr = @appr_year AND
	(pv2.prop_inactive_dt IS NULL OR ISNULL(pv2.udi_parent, '') = 'T')
INNER JOIN -- entity_id, prop_id, sup_num, tax_yr
	entity_prop_assoc AS epa ON
	epa.prop_id = pv2.prop_id AND
	epa.tax_yr = @appr_year AND
	epa.sup_num = pv2.sup_num
INNER JOIN -- prop_id, owner_tax_yr, sup_num
	prop_supp_assoc psa1 ON
	psa1.prop_id = prop1.prop_id AND
	psa1.owner_tax_yr = pv1.prop_val_yr AND
	psa1.sup_num = pv1.sup_num
INNER JOIN -- prop_id, owner_tax_yr, sup_num
	prop_supp_assoc psa2 ON
	psa2.prop_id = prop2.prop_id AND
	psa2.owner_tax_yr = pv2.prop_val_yr AND
	psa2.sup_num = pv2.sup_num
WHERE
	prop1.prop_type_cd = 'R' AND
	prop2.prop_type_cd = 'P' AND
	epa.tax_yr = @appr_year AND
	NOT EXISTS
		(
			SELECT
				e2.entity_id
			FROM
				entity_prop_assoc AS e2
			WHERE
				e2.entity_id = epa.entity_id AND
				e2.tax_yr = @appr_year AND
				e2.prop_id = pv1.prop_id AND
				e2.sup_num = pv1.sup_num
		)

-- END QUERY AND CURSOR DECLARE
-------------------------------

OPEN mismatch_curs

FETCH NEXT FROM mismatch_curs INTO @parent_prop, @child_prop 

WHILE (@@FETCH_STATUS = 0)
BEGIN

	SELECT TOP 1
		@prop_val_p = ISNULL(property_val.market,0.0)
	FROM
		property_val
	WHERE
		property_val.prop_val_yr = @appr_year AND
		property_val.prop_id = @child_prop

	INSERT ##mismatch_pers_prop_entity_work (session_id,prop_id_r,prop_id_p,prop_val_p ) VALUES (@spid,@parent_prop,@child_prop,@prop_val_p)

	FETCH NEXT FROM mismatch_curs INTO @parent_prop, @child_prop 
END

CLOSE mismatch_curs
DEALLOCATE mismatch_curs

GO

