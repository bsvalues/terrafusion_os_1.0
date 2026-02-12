

create view [dbo].[__aaaAddress] as 
SELECT       property.prop_id, address.acct_id, address.addr_line1, address.addr_line2, address.addr_line3, address.addr_city, address.addr_state, address.zip, address.primary_addr
--owner.prop_id

FROM            address INNER JOIN
                         account ON address.acct_id = account.acct_id INNER JOIN
                         owner ON account.acct_id = owner.owner_id INNER JOIN
                         property ON owner.prop_id = property.prop_id
						
	
WHERE primary_addr = 'Y'
and owner_tax_yr=2020
and [prop_type_cd]='r'

GO

