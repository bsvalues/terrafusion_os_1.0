CREATE TABLE [dbo].[batch_journal_distribution_detail] (
    [id]             INT             IDENTITY (1, 1) NOT NULL,
    [trans_type]     CHAR (5)        NULL,
    [journal_date]   DATETIME        NULL,
    [acct]           INT             NULL,
    [m_n_o]          NUMERIC (14, 2) NULL,
    [i_n_s]          NUMERIC (14, 2) NULL,
    [penalty]        NUMERIC (14, 2) NULL,
    [interest]       NUMERIC (14, 2) NULL,
    [atty_fees]      NUMERIC (14, 2) NULL,
    [overages]       NUMERIC (14, 2) NULL,
    [tax_cert_fees]  NUMERIC (14, 2) NULL,
    [misc_fees]      NUMERIC (14, 2) NULL,
    [vit]            NUMERIC (14, 2) NULL,
    [curr_mno]       NUMERIC (14, 2) NULL,
    [curr_ins]       NUMERIC (14, 2) NULL,
    [curr_penalty]   NUMERIC (14, 2) NULL,
    [curr_interest]  NUMERIC (14, 2) NULL,
    [curr_atty_fees] NUMERIC (14, 2) NULL,
    [curr_overages]  NUMERIC (14, 2) NULL,
    [delq_mno]       NUMERIC (14, 2) NULL,
    [delq_ins]       NUMERIC (14, 2) NULL,
    [delq_penalty]   NUMERIC (14, 2) NULL,
    [delq_interest]  NUMERIC (14, 2) NULL,
    [delq_atty_fees] NUMERIC (14, 2) NULL,
    [delq_overages]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_batch_journal_distribution_detail] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

