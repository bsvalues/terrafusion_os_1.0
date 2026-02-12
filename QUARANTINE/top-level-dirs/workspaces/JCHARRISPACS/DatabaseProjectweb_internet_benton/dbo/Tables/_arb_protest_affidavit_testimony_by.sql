CREATE TABLE [dbo].[_arb_protest_affidavit_testimony_by] (
    [affidavit_testimony_by_cd]   VARCHAR (10) NOT NULL,
    [affidavit_testimony_by_desc] VARCHAR (50) NULL,
    [sys_flag]                    CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_protest_affidavit_testimony_by] PRIMARY KEY CLUSTERED ([affidavit_testimony_by_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

