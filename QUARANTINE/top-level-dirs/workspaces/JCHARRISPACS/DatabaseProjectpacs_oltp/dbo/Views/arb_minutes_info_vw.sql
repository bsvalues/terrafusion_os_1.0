


/****** Object:  View dbo.arb_minutes_info_vw    Script Date: 7/5/2000 2:11:55 PM ******/
CREATE VIEW dbo.arb_minutes_info_vw
AS
SELECT arb_resolution_cd.resolution_desc, property.geo_id, 
    arb_protest.appr_year, arb_protest.case_id, 
    arb_protest.arb_board, arb_protest.arb_hearing_date, 
    arb_protest.resolution_cd, arb_protest.resolution_comment, 
    arb_protest.arb_motion, arb_protest.arb_second, 
    arb_protest.arb_unanimous, account.file_as_name, 
    arb_protest.prop_id
FROM arb_protest INNER JOIN
    arb_resolution_cd ON 
    arb_protest.resolution_cd = arb_resolution_cd.resolution_cd INNER
     JOIN
    property ON 
    arb_protest.prop_id = property.prop_id INNER JOIN
    owner ON property.prop_id = owner.prop_id AND 
    arb_protest.appr_year = owner.owner_tax_yr INNER JOIN
    account ON owner.owner_id = account.acct_id INNER JOIN
    prop_supp_assoc ON 
    property.prop_id = prop_supp_assoc.prop_id AND 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND 
    owner.sup_num = prop_supp_assoc.sup_num AND 
    arb_protest.appr_year = prop_supp_assoc.owner_tax_yr

GO

