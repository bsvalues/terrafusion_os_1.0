



CREATE VIEW dbo.COLLECTIONS_AGENT_LIST_VW
AS
SELECT DISTINCT 
p.col_agent_id as agent_id, 
p.col_owner_id as owner_id, 
a.file_as_name AS agent_file_as_name, 
aa.file_as_name AS owner_file_as_name, 
p.prop_id, 
ps.appr_yr as owner_tax_yr,
agent_assoc.auth_to_protest

from property as p
inner join account as a on
p.col_agent_id=a.acct_id
inner join account as aa on
p.col_owner_id=aa.acct_id
inner join pacs_system as ps on
ps.appr_yr=ps.appr_yr
left join agent_assoc 
on agent_assoc.agent_id = a.acct_id

GO

