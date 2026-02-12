
CREATE VIEW group_codes_control_vw
AS
SELECT     pga.prop_id, pga.prop_group_cd, pgc.group_desc
FROM         dbo.prop_group_assoc pga INNER JOIN
                      dbo.prop_group_code pgc ON pga.prop_group_cd = pgc.group_cd

GO

