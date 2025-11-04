
CREATE VIEW dbo.AGENT_COLL_VW
AS
SELECT     dbo.account.acct_id, dbo.account.acct_id as acct_acct_id, dbo.account.first_name, dbo.account.last_name, dbo.account.file_as_name, dbo.address.addr_type_cd, 
                      dbo.address.primary_addr, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, dbo.address.addr_state, 
                      dbo.address.country_cd, dbo.address.addr_zip, COUNT(DISTINCT dbo.agent_assoc.prop_id) AS num_props, dbo.account.ref_id1,
			dbo.phone.phone_num, convert(int, dbo.agent.inactive_flag) as inactive_flag
FROM         dbo.account
INNER JOIN dbo.agent ON dbo.account.acct_id = dbo.agent.agent_id
INNER JOIN dbo.address ON dbo.account.acct_id = dbo.address.acct_id
left outer join dbo.phone on dbo.account.acct_id = dbo.phone.acct_id
LEFT OUTER JOIN dbo.pacs_system
INNER JOIN
                      dbo.agent_assoc ON dbo.pacs_system.tax_yr = dbo.agent_assoc.owner_tax_yr ON dbo.agent.agent_id = dbo.agent_assoc.agent_id AND 
                      dbo.agent.agent_id = dbo.agent_assoc.agent_id AND dbo.agent.agent_id = dbo.agent_assoc.agent_id AND 
                      dbo.agent.agent_id = dbo.agent_assoc.agent_id AND dbo.agent.agent_id = dbo.agent_assoc.agent_id
GROUP BY dbo.account.acct_id, dbo.account.first_name, dbo.account.last_name, dbo.account.file_as_name, dbo.account.ref_id1, dbo.address.addr_type_cd, 
                      dbo.address.primary_addr, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, dbo.address.addr_state, 
                      dbo.address.country_cd, dbo.address.addr_zip, dbo.account.ref_id1, dbo.phone.phone_num, convert(int, dbo.agent.inactive_flag)

GO

