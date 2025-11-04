



create view batch_journal_distribution_vw

as

SELECT     acct, SUM(ISNULL(m_n_o, 0)) AS mno, SUM(ISNULL(i_n_s, 0)) AS ins, SUM(ISNULL(penalty, 0)) AS penalty, SUM(ISNULL(interest, 0)) AS interest, 
                      SUM(ISNULL(atty_fees, 0)) AS atty_fees, SUM(ISNULL(overages, 0)) AS overages, SUM(ISNULL(tax_cert_fees, 0)) AS tax_cert_fees, 
                      SUM(ISNULL(misc_fees, 0)) AS misc_fees, SUM(ISNULL(vit, 0)) AS vit, 
	    
sum(IsNull(curr_mno, 0)) as curr_mno, 
sum(IsNull(curr_ins, 0)) as curr_ins,
sum(IsNull(curr_penalty, 0)) as curr_penalty,
sum(IsNull(curr_interest, 0)) as curr_interest,
sum(IsNull(curr_atty_fees, 0)) as curr_atty_fees,
sum(IsNull(curr_overages, 0)) as curr_overages,
sum(IsNull(delq_mno, 0)) as delq_mno,
sum(IsNull(delq_ins, 0)) as delq_ins,
sum(IsNull(delq_penalty, 0)) as delq_penalty,
sum(IsNull(delq_interest, 0)) as delq_interest,
sum(IsNull(delq_atty_fees, 0)) as delq_atty_fees,
sum(IsNull(delq_overages, 0)) as delq_overages
FROM         dbo.batch_journal_distribution
GROUP BY acct

GO

