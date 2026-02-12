CREATE TABLE [dbo].[penpad_imprv_codeset] (
    [imprv_type]       VARCHAR (5)  NOT NULL,
    [imprv_table]      VARCHAR (64) NOT NULL,
    [imprv_code_avail] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_penpad_imprv_codeset] PRIMARY KEY CLUSTERED ([imprv_type] ASC, [imprv_table] ASC, [imprv_code_avail] ASC) WITH (FILLFACTOR = 90)
);


GO

