CREATE TABLE [dbo].[batch_journal_distribution] (
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
    [check_num]      INT             NULL,
    [comment]        VARCHAR (255)   NULL,
    [pacs_user_id]   INT             NULL,
    [check_line1]    VARCHAR (50)    NULL,
    [check_line2]    VARCHAR (50)    NULL,
    [check_line3]    VARCHAR (50)    NULL,
    [check_line4]    VARCHAR (50)    NULL,
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
    CONSTRAINT [CPK_batch_journal_distribution] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

