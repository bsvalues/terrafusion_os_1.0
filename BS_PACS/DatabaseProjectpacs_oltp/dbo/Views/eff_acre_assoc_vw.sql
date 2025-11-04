




CREATE   VIEW dbo.eff_acre_assoc_vw
AS
SELECT     eaa.group_id, eaa.prop_id, eag.description, eag.acreage, eag.prop_val_yr
FROM         dbo.effective_acres_assoc eaa INNER JOIN
                      dbo.effective_acres_group eag ON eag.group_id = eaa.group_id
			and eag.prop_val_yr = eaa.prop_val_yr

GO

