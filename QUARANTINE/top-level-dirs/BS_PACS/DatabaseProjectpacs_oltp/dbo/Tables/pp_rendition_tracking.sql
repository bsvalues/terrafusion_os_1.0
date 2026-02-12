CREATE TABLE [dbo].[pp_rendition_tracking] (
    [prop_id]                        INT             NOT NULL,
    [prop_val_yr]                    NUMERIC (4)     NOT NULL,
    [extension1]                     VARCHAR (5)     CONSTRAINT [CDF_pp_rendition_tracking_extension1] DEFAULT ('NR') NOT NULL,
    [extension1_processed_dt]        SMALLDATETIME   NULL,
    [extension1_printed_dt]          SMALLDATETIME   NULL,
    [extension1_comment]             VARCHAR (512)   NULL,
    [extension2]                     VARCHAR (5)     CONSTRAINT [CDF_pp_rendition_tracking_extension2] DEFAULT ('NR') NOT NULL,
    [extension2_processed_dt]        SMALLDATETIME   NULL,
    [extension2_printed_dt]          SMALLDATETIME   NULL,
    [extension2_comment]             VARCHAR (512)   NULL,
    [imposition_letter_dt]           SMALLDATETIME   NULL,
    [imposition_letter_receieved_dt] SMALLDATETIME   NULL,
    [request_support_doc_comment]    VARCHAR (512)   NULL,
    [request_support_doc_dt]         SMALLDATETIME   NULL,
    [print_request_support_doc_dt]   SMALLDATETIME   NULL,
    [request_support_doc_rec_dt]     SMALLDATETIME   NULL,
    [penalty_waiver_status]          VARCHAR (5)     CONSTRAINT [CDF_pp_rendition_tracking_penalty_waiver_status] DEFAULT ('NR') NULL,
    [penalty_waiver_status_dt]       SMALLDATETIME   NULL,
    [penalty_waiver_request_dt]      SMALLDATETIME   NULL,
    [penalty_waiver_print_dt]        SMALLDATETIME   NULL,
    [waiver_request_mandatory_dt]    SMALLDATETIME   NULL,
    [penalty_comment]                VARCHAR (512)   NULL,
    [penalty_amount]                 NUMERIC (14, 2) NULL,
    [penalty_amount_override]        INT             NULL,
    [penalty_amount_dt]              SMALLDATETIME   NULL,
    [penalty_paid_dt]                SMALLDATETIME   NULL,
    [fraud_penalty_dt]               SMALLDATETIME   NULL,
    [fraud_penalty_amount]           NUMERIC (14, 2) NULL,
    [fraud_penalty_paid_dt]          SMALLDATETIME   NULL,
    [fraud_comment]                  VARCHAR (512)   NULL,
    [fraud_penalty_flag]             BIT             NULL,
    [sup_num]                        INT             CONSTRAINT [CDF_pp_rendition_tracking_sup_num] DEFAULT (0) NOT NULL,
    [last_print_dt]                  DATETIME        NULL,
    [last_filing_dt]                 DATETIME        NULL,
    [do_not_print_until]             BIT             CONSTRAINT [CDF_pp_rendition_tracking_do_not_print_until] DEFAULT ((0)) NOT NULL,
    [do_not_print_until_year]        NUMERIC (4)     NULL,
    [do_not_print_ever]              BIT             CONSTRAINT [CDF_pp_rendition_tracking_do_not_print_ever] DEFAULT ((0)) NOT NULL,
    [penalty_user_override_dt]       DATETIME        NULL,
    [penalty_user_id_override]       INT             NULL,
    [fraud_user_override_dt]         DATETIME        NULL,
    [fraud_user_id_override]         INT             NULL,
    CONSTRAINT [CPK_pp_rendition_tracking] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_pp_rendition_tracking_extension1] FOREIGN KEY ([extension1]) REFERENCES [dbo].[pp_extension] ([code]),
    CONSTRAINT [CFK_pp_rendition_tracking_extension2] FOREIGN KEY ([extension2]) REFERENCES [dbo].[pp_extension] ([code]),
    CONSTRAINT [CFK_pp_rendition_tracking_penalty_waiver_status] FOREIGN KEY ([penalty_waiver_status]) REFERENCES [dbo].[pp_waiver_status] ([code])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[pp_rendition_tracking]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User who overrode fraud', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'fraud_user_id_override';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Last printing date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'last_print_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Do not print tracking ever', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'do_not_print_ever';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Last filing date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'last_filing_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date in which user overrode penalty', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'penalty_user_override_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Do not print tracking until', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'do_not_print_until';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'User who overrode penalty', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'penalty_user_id_override';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Do not print tracking until this year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'do_not_print_until_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date in which user overrode fraud', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_tracking', @level2type = N'COLUMN', @level2name = N'fraud_user_override_dt';


GO

