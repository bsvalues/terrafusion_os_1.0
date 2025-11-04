CREATE TABLE [dbo].[_arb_protest_affidavit_testimony_received] (
    [affidavit_testimony_received_cd]   VARCHAR (10) NOT NULL,
    [affidavit_testimony_received_desc] VARCHAR (50) NULL,
    [sys_flag]                          CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_protest_affidavit_testimony_received] PRIMARY KEY CLUSTERED ([affidavit_testimony_received_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

