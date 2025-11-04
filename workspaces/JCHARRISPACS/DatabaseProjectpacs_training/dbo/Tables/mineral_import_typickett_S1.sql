CREATE TABLE [dbo].[mineral_import_typickett_S1] (
    [run_id] INT            NULL,
    [id]     VARCHAR (2)    NULL,
    [lease]  VARCHAR (5)    NULL,
    [type]   VARCHAR (2)    NULL,
    [code1]  VARCHAR (2)    NULL,
    [prcnt1] NUMERIC (5, 5) NULL,
    [code2]  VARCHAR (2)    NULL,
    [prcnt2] NUMERIC (5, 5) NULL,
    [code3]  VARCHAR (2)    NULL,
    [prcnt3] NUMERIC (5, 5) NULL,
    [code4]  VARCHAR (2)    NULL,
    [prcnt4] NUMERIC (5, 5) NULL,
    [code5]  VARCHAR (2)    NULL,
    [prcnt5] NUMERIC (5, 5) NULL,
    [code6]  VARCHAR (2)    NULL,
    [prcnt6] NUMERIC (5, 5) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_typickett_S1]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

