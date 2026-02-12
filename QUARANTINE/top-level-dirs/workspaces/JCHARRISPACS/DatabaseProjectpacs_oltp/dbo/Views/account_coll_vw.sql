

/****** Object:  View dbo.account_coll_vw    Script Date: 7/28/2003 2:56:50 PM ******/

CREATE VIEW dbo.account_coll_vw
AS
SELECT     dbo.account.acct_id, isnull(dbo.account_coll_num_props_vw.num_props, 0) as num_props, dbo.account.first_name, dbo.account.last_name, dbo.account.file_as_name, 
              dbo.account.ref_id1, dbo.address.addr_type_cd, dbo.address.primary_addr, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, 
              dbo.address.addr_city, dbo.address.addr_state, dbo.address.country_cd, dbo.address.addr_zip, dbo.address.ml_deliverable, 
              dbo.account.confidential_file_as_name, dbo.account.confidential_first_name, dbo.account.confidential_last_name, dbo.phone.phone_num
FROM         dbo.account LEFT OUTER JOIN
              dbo.address ON dbo.account.acct_id = dbo.address.acct_id LEFT OUTER JOIN
              dbo.phone ON dbo.account.acct_id = dbo.phone.acct_id LEFT OUTER JOIN
              dbo.account_coll_num_props_vw ON dbo.account.acct_id = dbo.account_coll_num_props_vw.owner_id
WHERE dbo.account.acct_id NOT IN
(
	SELECT agent_id	FROM agent
)
AND dbo.account.acct_id NOT IN
(
	SELECT attorney_id FROM attorney
)
AND dbo.account.acct_id NOT IN
(
	SELECT mortgage_co_id FROM mortgage_co
)
AND dbo.account.acct_id NOT IN
(
	SELECT entity_id FROM entity
)
AND dbo.account.acct_id NOT IN
(
	SELECT collector_id FROM collector
)

GO

