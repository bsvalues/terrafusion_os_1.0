


CREATE VIEW dbo.CURR_QP_TAX_PROP_INFO_VW
AS
SELECT property_val.prop_id, property_val.prop_val_yr, 
    property_val.legal_desc, property_val.legal_desc_2, 
    p.col_owner_id as owner_id, address.addr_line1, address.addr_line2, 
    address.addr_line3, address.addr_city, address.addr_state, 
    address.addr_zip, address.country_cd, address.primary_addr, 
    prop_supp_assoc.owner_tax_yr, property_type.prop_type_cd, 
    property_type.prop_type_desc, p.geo_id, 
    p.dba_name, phone.phone_num, 
    phone_type.phone_type_cd, mortgage_co.mortgage_cd, 
    account1.file_as_name AS mortgage_file_as_name, 
    bill.stmnt_id, account.file_as_name AS owner_file_as_name, 
    bill.sup_tax_yr
FROM bill 

		inner join property as p on
				bill.prop_id=p.prop_id

		INNER JOIN account on 
				account.acct_id=p.col_owner_id

    INNER JOIN property_val on
				p.prop_id=property_val.prop_id

		INNER JOIN prop_supp_assoc ON 
    		property_val.prop_id = prop_supp_assoc.prop_id 
		AND property_val.sup_num = prop_supp_assoc.sup_num 
		AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr 
    
    INNER JOIN property_type ON 
    p.prop_type_cd = property_type.prop_type_cd 


    LEFT OUTER JOIN address ON 
			p.col_owner_id = address.acct_id 
		AND  address.primary_addr = 'Y'

 		LEFT OUTER JOIN mortgage_assoc on
			p.prop_id = mortgage_assoc.prop_id

		LEFT OUTER JOIN mortgage_co ON 
    		mortgage_assoc.mortgage_co_id = mortgage_co.mortgage_co_id

    LEFT OUTER JOIN  account account1 ON 
    		mortgage_co.mortgage_co_id = account1.acct_id 		

		LEFT OUTER JOIN phone ON 
      account1.acct_id = phone.acct_id 

		LEFT OUTER JOIN phone_type ON
				phone_type.phone_type_cd = phone.phone_type_cd

WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa, pacs_system
      WHERE psa.prop_id = property_val.prop_id AND 
           owner_tax_yr <= pacs_system.tax_yr))

GO

