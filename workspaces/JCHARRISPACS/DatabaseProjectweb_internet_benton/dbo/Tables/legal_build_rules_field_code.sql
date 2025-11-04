CREATE TABLE [dbo].[legal_build_rules_field_code] (
    [lFieldCode]  INT          NOT NULL,
    [szFieldDesc] VARCHAR (63) NOT NULL,
    CONSTRAINT [CPK_legal_build_rules_field_code] PRIMARY KEY CLUSTERED ([lFieldCode] ASC) WITH (FILLFACTOR = 100)
);


GO

