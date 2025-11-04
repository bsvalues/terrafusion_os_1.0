CREATE TABLE [dbo].[exmpt_type] (
    [exmpt_type_cd] VARCHAR (10)    NOT NULL,
    [exmpt_desc]    VARCHAR (50)    NULL,
    [federal_amt]   NUMERIC (14, 2) NULL,
    [plus_oa65_amt] NUMERIC (14, 2) NULL,
    [spl_exmpt]     CHAR (1)        NOT NULL,
    [freeze_flag]   BIT             NOT NULL,
    CONSTRAINT [CPK_exmpt_type] PRIMARY KEY CLUSTERED ([exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

