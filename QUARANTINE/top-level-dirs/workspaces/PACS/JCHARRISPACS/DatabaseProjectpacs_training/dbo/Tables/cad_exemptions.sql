CREATE TABLE [dbo].[cad_exemptions] (
    [cad_code]            CHAR (5)     NOT NULL,
    [cad_exemption_code]  VARCHAR (10) NOT NULL,
    [pacs_exemption_code] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_cad_exemptions] PRIMARY KEY CLUSTERED ([cad_code] ASC, [cad_exemption_code] ASC, [pacs_exemption_code] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_cad_exemptions_pacs_exemption_code] FOREIGN KEY ([pacs_exemption_code]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd])
);


GO

