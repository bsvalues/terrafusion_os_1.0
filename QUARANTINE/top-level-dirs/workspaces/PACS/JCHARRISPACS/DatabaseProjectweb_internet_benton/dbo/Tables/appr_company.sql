CREATE TABLE [dbo].[appr_company] (
    [appr_company_id] INT           NOT NULL,
    [appr_company_nm] VARCHAR (100) NULL,
    [sys_flag]        CHAR (1)      NULL,
    CONSTRAINT [CPK_appr_company] PRIMARY KEY CLUSTERED ([appr_company_id] ASC) WITH (FILLFACTOR = 100)
);


GO

