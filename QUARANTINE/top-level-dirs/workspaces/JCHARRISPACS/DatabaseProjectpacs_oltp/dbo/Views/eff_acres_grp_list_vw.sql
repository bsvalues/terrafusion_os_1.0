

CREATE VIEW dbo.eff_acres_grp_list_vw
AS
SELECT     TOP 100 PERCENT eag.group_id, eag.prop_val_yr, eag.description, eag.acreage, eag.created_dt, pu.pacs_user_name, 
(select count(*) from effective_acres_assoc eaa where eaa.group_id = eag.group_id and eaa.prop_val_yr = eag.prop_val_yr) as Num_Of_Props
FROM         dbo.effective_acres_group eag INNER JOIN
dbo.pacs_user pu ON eag.created_by = pu.pacs_user_id
ORDER BY eag.group_id

GO

