


CREATE VIEW dbo.event_tax_stmnt_vw
AS
SELECT event.event_id, event.system_type, event.event_type, 
    event.event_date, event.pacs_user, event.event_desc, 
    event.ref_evt_type, transfer_tax_stmnt.owner_name, 
    transfer_tax_stmnt.owner_addr_line1, 
    transfer_tax_stmnt.owner_addr_line2, 
    transfer_tax_stmnt.owner_addr_line3, 
    transfer_tax_stmnt.owner_addr_city, 
    transfer_tax_stmnt.owner_addr_state, 
    transfer_tax_stmnt.owner_addr_zip, 
    transfer_tax_stmnt.owner_addr_country, 
    transfer_tax_stmnt.entity_1_cd, 
    transfer_tax_stmnt.entity_2_cd, 
    transfer_tax_stmnt.entity_3_cd, 
    transfer_tax_stmnt.entity_4_cd, 
    transfer_tax_stmnt.entity_5_cd, 
    transfer_tax_stmnt.entity_6_cd, 
    transfer_tax_stmnt.entity_7_cd, 
    transfer_tax_stmnt.entity_8_cd, 
    transfer_tax_stmnt.entity_9_cd, 
    transfer_tax_stmnt.entity_10_cd, 
    transfer_tax_stmnt.levy_group_id, 
    transfer_tax_stmnt.levy_group_yr, 
    transfer_tax_stmnt.levy_run_id, transfer_tax_stmnt.prop_id, 
    transfer_tax_stmnt.owner_id, transfer_tax_stmnt.sup_num, 
    transfer_tax_stmnt.sup_tax_yr, transfer_tax_stmnt.stmnt_id, 
    transfer_tax_stmnt.event_id AS Expr1
FROM event INNER JOIN
    prop_event_assoc ON 
    event.event_id = prop_event_assoc.event_id INNER JOIN
    transfer_tax_stmnt ON 
    prop_event_assoc.prop_id = transfer_tax_stmnt.prop_id AND 
    event.ref_year = transfer_tax_stmnt.levy_group_yr AND 
    event.ref_id1 = transfer_tax_stmnt.levy_group_id AND 
    event.ref_id2 = transfer_tax_stmnt.sup_num AND 
    event.ref_id3 = transfer_tax_stmnt.levy_run_id AND 
    event.ref_id4 = transfer_tax_stmnt.prop_id AND 
    event.ref_id5 = transfer_tax_stmnt.owner_id AND 
    event.ref_id6 = transfer_tax_stmnt.stmnt_id

GO

