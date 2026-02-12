CREATE TABLE [dbo].[mineral_import_typickett_L2] (
    [run_id] INT            NULL,
    [id]     VARCHAR (2)    NULL,
    [nbr]    VARCHAR (5)    NULL,
    [des1b]  VARCHAR (29)   NULL,
    [des2b]  VARCHAR (29)   NULL,
    [val_78] NUMERIC (11)   NULL,
    [val_18] NUMERIC (11)   NULL,
    [apd]    VARCHAR (3)    NULL,
    [cnty1]  VARCHAR (3)    NULL,
    [prcnt1] NUMERIC (5, 5) NULL,
    [cnty2]  VARCHAR (3)    NULL,
    [prcnt2] NUMERIC (5, 5) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_typickett_L2]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

