/* TrentN - 7/21/04 - Altered this to do a left outer join on address because some owners don't have a primary address */
/* 	The field review card's SP uses this same type of logic. */
CREATE VIEW dbo.appr_card_owner_vw
AS
SELECT 	owner.owner_id, owner.owner_tax_yr, owner.prop_id, 
    	owner.pct_ownership, address.addr_line1, address.addr_line2, 
    	address.addr_line3, address.addr_city, address.addr_state, 
    	address.country_cd, address.addr_zip, address.zip_4_2, account.file_as_name, 
    	owner.sup_num, account.ref_id1, address.zip, address.cass, address.route, owner.udi_child_prop_id
FROM account 
	INNER JOIN owner ON 
	    	account.acct_id = owner.owner_id 
	LEFT OUTER JOIN address ON 
		account.acct_id = address.acct_id AND
		address.primary_addr = 'Y'

GO

