CREATE TABLE [dbo].[levy_cert_reset_history] (
    [levy_cert_reset_id] INT         IDENTITY (1, 1) NOT NULL,
    [levy_cert_run_id]   INT         NOT NULL,
    [year]               NUMERIC (4) NOT NULL,
    [batch_id]           INT         NOT NULL,
    [pacs_user_id]       INT         NOT NULL,
    [start_dt]           DATETIME    DEFAULT (getdate()) NOT NULL,
    [stop_dt]            DATETIME    NULL,
    CONSTRAINT [PK_refund_levy_reset_history] PRIMARY KEY CLUSTERED ([levy_cert_reset_id] ASC)
);


GO

