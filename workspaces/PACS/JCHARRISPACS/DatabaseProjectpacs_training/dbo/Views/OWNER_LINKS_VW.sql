








CREATE VIEW dbo.OWNER_LINKS_VW
AS
SELECT owner_links.main_owner_id, owner_links.child_owner_id, 
    account.first_name AS main_first_name, 
    account.last_name AS main_last_name, 
    account.file_as_name AS main_file_as_name, 
    account1.first_name AS child_first_name, 
    account1.last_name AS child_last_name, 
    account1.file_as_name AS child_file_as_name
FROM account INNER JOIN
    owner_links ON 
    account.acct_id = owner_links.main_owner_id INNER JOIN
    account account1 ON 
    owner_links.child_owner_id = account1.acct_id

GO

