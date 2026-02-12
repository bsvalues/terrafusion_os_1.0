CREATE TABLE [dbo].[imprv_sched_unit_mix] (
    [code]        VARCHAR (12) NOT NULL,
    [description] VARCHAR (30) NULL,
    CONSTRAINT [CPK_unit_mix] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

