

CREATE VIEW SPECIAL_GROUP_OWNER_ASSOC_VW
AS
SELECT 	dbo.special_group_owner_assoc.special_group_id AS special_group_id,
	dbo.special_group_owner_assoc.owner_id AS owner_id,
	dbo.special_group_owner_assoc.owner_tax_yr AS owner_tax_yr,
	dbo.special_group_owner_assoc.assoc_dt AS assoc_dt,
	dbo.account.file_as_name AS file_as_name
FROM	dbo.special_group_owner_assoc WITH (NOLOCK)
	JOIN dbo.account WITH (NOLOCK) ON
		dbo.special_group_owner_assoc.owner_id = dbo.account.acct_id

GO

