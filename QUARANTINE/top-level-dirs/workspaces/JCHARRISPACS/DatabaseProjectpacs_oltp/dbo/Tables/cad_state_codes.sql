CREATE TABLE [dbo].[cad_state_codes] (
    [cad_code]        CHAR (5) NOT NULL,
    [cad_state_code]  CHAR (5) NOT NULL,
    [pacs_state_code] CHAR (5) NOT NULL,
    CONSTRAINT [CPK_cad_state_codes] PRIMARY KEY CLUSTERED ([cad_code] ASC, [cad_state_code] ASC, [pacs_state_code] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_cad_state_codes_pacs_state_code] FOREIGN KEY ([pacs_state_code]) REFERENCES [dbo].[state_code] ([state_cd])
);


GO

