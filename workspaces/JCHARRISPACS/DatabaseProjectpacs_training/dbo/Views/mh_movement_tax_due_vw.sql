


create view mh_movement_tax_due_vw as
SELECT     dbo.mh_movement_tax_due.permit_num, dbo.mh_movement_tax_due.entity_id, dbo.entity.entity_cd, dbo.account.file_as_name, 
                      dbo.mh_movement_tax_due.tax_due, dbo.mh_movement_tax_due.no_response, dbo.mh_movement_tax_due.tax_year, 
                      collector.file_as_name AS collector_file_as_name, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, 
                      dbo.address.addr_state, dbo.address.addr_zip
FROM         dbo.address INNER JOIN
                      dbo.account collector ON dbo.address.acct_id = collector.acct_id AND dbo.address.primary_addr = 'Y' RIGHT OUTER JOIN
                      dbo.account INNER JOIN
                      dbo.entity ON dbo.account.acct_id = dbo.entity.entity_id INNER JOIN
                      dbo.mh_movement_tax_due ON dbo.entity.entity_id = dbo.mh_movement_tax_due.entity_id ON collector.acct_id = dbo.entity.collector_id

GO

