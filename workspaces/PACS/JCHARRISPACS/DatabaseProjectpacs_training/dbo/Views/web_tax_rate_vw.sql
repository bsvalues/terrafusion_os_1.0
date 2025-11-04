




CREATE VIEW dbo.web_tax_rate_vw
AS
SELECT entity_id, tax_rate_yr, 
    m_n_o_tax_pct + i_n_s_tax_pct AS tax_rate,
    appraise_for
FROM tax_rate

GO

