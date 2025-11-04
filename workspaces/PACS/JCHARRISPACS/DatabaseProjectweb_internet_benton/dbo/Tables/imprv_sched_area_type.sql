CREATE TABLE [dbo].[imprv_sched_area_type] (
    [imprv_sched_area_type_cd]   CHAR (10)     NOT NULL,
    [imprv_sched_area_type_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_imprv_sched_area_type] PRIMARY KEY CLUSTERED ([imprv_sched_area_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

