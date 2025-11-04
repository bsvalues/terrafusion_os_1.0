


CREATE VIEW dbo.entity_tax_statement_print_history_vw
AS
SELECT pacs_user.pacs_user_name, 
    entity_tax_statement_run_print_history.levy_group_id, 
    entity_tax_statement_run_print_history.levy_year, 
    entity_tax_statement_run_print_history.levy_sup_num, 
    entity_tax_statement_run_print_history.levy_run, 
    entity_tax_statement_run_print_history.printed_by, 
    entity_tax_statement_run_print_history.printed_date, 
    entity_tax_statement_run_print_history.print_option, 
    entity_tax_statement_run_print_history.print_zero_due, 
    entity_tax_statement_run_print_history.print_agent_only_copy, 
    entity_tax_statement_run_print_history.print_agent_taxpayer_copy,
     entity_tax_statement_run_print_history.print_mortgage_only_copy,
     entity_tax_statement_run_print_history.print_mortgage_taxpayer_copy,
     entity_tax_statement_run_print_history.print_indiv_agent_id, 
    entity_tax_statement_run_print_history.print_indiv_mort_id, 
    account1.file_as_name AS agent_name, 
    account1.file_as_name AS mortgage_name, 
    entity_tax_statement_run_print_history.print_si, 
    entity_tax_statement_run_print_history.print_undeliverable, 
    entity_tax_statement_run_print_history.print_foreign_addr, 
    entity_tax_statement_run_print_history.history_id, 
    entity_tax_statement_run_print_history.print_ov65_zero_due, 
    entity_tax_statement_run_print_history.print_begin_option, 
    entity_tax_statement_run_print_history.print_begin_id, 
    entity_tax_statement_run_print_history.print_agent_none, 
    entity_tax_statement_run_print_history.print_mortgage_none, 
    account2.file_as_name AS taxserver_name, 
    entity_tax_statement_run_print_history.print_taxserver_only_copy,
     entity_tax_statement_run_print_history.print_taxserver_taxpayer_copy,
     entity_tax_statement_run_print_history.print_indiv_taxserver_id,
     entity_tax_statement_run_print_history.print_taxserver_none
FROM entity_tax_statement_run_print_history INNER JOIN
    pacs_user ON 
    entity_tax_statement_run_print_history.printed_by = pacs_user.pacs_user_id
     LEFT OUTER JOIN
    account account2 ON 
    entity_tax_statement_run_print_history.print_indiv_taxserver_id
     = account2.acct_id LEFT OUTER JOIN
    account account1 ON 
    entity_tax_statement_run_print_history.print_indiv_mort_id = account1.acct_id
     LEFT OUTER JOIN
    account ON 
    entity_tax_statement_run_print_history.print_indiv_agent_id = account1.acct_id

GO

