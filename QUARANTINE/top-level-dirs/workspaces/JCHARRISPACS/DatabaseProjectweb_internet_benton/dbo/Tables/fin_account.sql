CREATE TABLE [dbo].[fin_account] (
    [fin_account_id]           INT           NOT NULL,
    [account_number]           VARCHAR (259) NOT NULL,
    [account_description]      VARCHAR (100) NULL,
    [account_type_cd]          VARCHAR (25)  NOT NULL,
    [active]                   BIT           NOT NULL,
    [create_date]              DATETIME      NOT NULL,
    [last_update_date]         DATETIME      NULL,
    [has_mr_offset]            BIT           NOT NULL,
    [mr_offset_fin_account_id] INT           NULL,
    CONSTRAINT [CPK_fin_account] PRIMARY KEY CLUSTERED ([fin_account_id] ASC) WITH (FILLFACTOR = 100)
);


GO

