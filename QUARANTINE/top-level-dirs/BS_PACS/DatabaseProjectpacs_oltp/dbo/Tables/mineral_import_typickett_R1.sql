CREATE TABLE [dbo].[mineral_import_typickett_R1] (
    [run_id]          INT         NULL,
    [id]              VARCHAR (2) NULL,
    [lease]           VARCHAR (5) NULL,
    [rrc]             VARCHAR (6) NULL,
    [well_type]       VARCHAR (1) NULL,
    [new_value]       INT         NULL,
    [field_number]    VARCHAR (8) NULL,
    [operator_number] VARCHAR (6) NULL,
    [agent_code]      VARCHAR (2) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_typickett_R1]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

