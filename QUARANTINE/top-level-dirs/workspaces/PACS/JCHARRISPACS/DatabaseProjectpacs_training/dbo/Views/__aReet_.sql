create view __aReet_ as 
SELECT     reet.reet_id, reet.excise_number, reet.status_cd, reet.reet_type_cd, reet.instrument_type_cd, reet.pers_prop_included, reet.pers_prop_val, reet.pers_prop_description, reet.exemption_claimed, reet.wac_number_type_cd, reet.wac_reason, reet.tax_area_id, 
                  reet.urban_growth_cd, reet.exemption_amount, reet.agency_id, reet.imp_manual_entry, reet.imp_partial_sale, reet.imp_continuance_flag, reet.imp_historic_flag, reet.imp_open_space_flag, reet.imp_city, reet.imp_current_use_flag, reet.imp_unique_identifier, 
                  reet.comment, reet.hidden, reet_chg_of_owner_assoc.chg_of_owner_id
FROM        reet INNER JOIN
                  reet_chg_of_owner_assoc ON reet.reet_id = reet_chg_of_owner_assoc.reet_id

GO

