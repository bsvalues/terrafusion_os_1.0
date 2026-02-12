CREATE TABLE [dbo].[bp_cad_status_cd] (
    [CadStatus]   VARCHAR (5)  NOT NULL,
    [Description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_bp_cad_status_cd] PRIMARY KEY CLUSTERED ([CadStatus] ASC) WITH (FILLFACTOR = 100)
);


GO

