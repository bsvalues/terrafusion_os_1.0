CREATE TABLE [dbo].[refund_levy_config] (
    [refund_levy_config_id] INT          NOT NULL,
    [year]                  NUMERIC (4)  NOT NULL,
    [description]           VARCHAR (30) NOT NULL,
    [admin_refunds]         BIT          DEFAULT (NULL) NULL,
    [adjudicated_refunds]   BIT          DEFAULT (NULL) NULL,
    [refund_begin_dt]       DATETIME     DEFAULT (getdate()) NOT NULL,
    [refund_end_dt]         DATETIME     DEFAULT (getdate()) NOT NULL,
    [include_interest_paid] BIT          DEFAULT ((1)) NOT NULL,
    CONSTRAINT [PK_refund_levy_config] PRIMARY KEY CLUSTERED ([refund_levy_config_id] ASC)
);


GO

