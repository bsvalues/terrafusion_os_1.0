CREATE TABLE [dbo].[mobile_manager_import_target] (
    [target_id]             INT           IDENTITY (1, 1) NOT NULL,
    [target_table]          VARCHAR (100) NOT NULL,
    [index]                 VARCHAR (55)  NULL,
    [numcolumns]            VARCHAR (55)  NULL,
    [maxlengthdefs]         VARCHAR (55)  NULL,
    [notnulldefs]           VARCHAR (55)  NULL,
    [duplicatecheckcolumns] VARCHAR (55)  NOT NULL,
    [target_table_columns]  VARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([target_id] ASC)
);


GO

