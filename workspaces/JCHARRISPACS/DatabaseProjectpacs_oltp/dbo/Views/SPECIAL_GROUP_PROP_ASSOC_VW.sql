

CREATE VIEW SPECIAL_GROUP_PROP_ASSOC_VW
AS
SELECT 	special_group_prop_assoc.special_group_id AS special_group_id,
	special_group_prop_assoc.prop_id AS prop_id,
	property.geo_id AS geo_id,
	special_group_prop_assoc.prop_val_yr AS prop_val_yr,
	special_group_prop_assoc.assoc_dt AS assoc_dt,
	REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ') AS situs_display
FROM	special_group_prop_assoc WITH (NOLOCK)
	JOIN property WITH (NOLOCK) ON
		special_group_prop_assoc.prop_id = property.prop_id
	LEFT OUTER JOIN situs WITH (NOLOCK) ON
		special_group_prop_assoc.prop_id = situs.prop_id AND
		situs.primary_situs = 'Y'

GO

