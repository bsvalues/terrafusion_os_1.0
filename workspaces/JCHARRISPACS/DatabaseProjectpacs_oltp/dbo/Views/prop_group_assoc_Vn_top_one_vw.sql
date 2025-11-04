
CREATE VIEW dbo.prop_group_assoc_Vn_top_one_vw
AS 
SELECT prop_id, prop_group_cd
FROM prop_group_assoc 
WHERE prop_group_cd IN ('V1', 'V2', 'V3', 'V4', 'V5')

GO

