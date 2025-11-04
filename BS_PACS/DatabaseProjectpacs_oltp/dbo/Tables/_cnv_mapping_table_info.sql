CREATE TABLE [dbo].[_cnv_mapping_table_info] (
    [TargetTable]                  VARCHAR (500)  NULL,
    [TargetColumn]                 [sysname]      NOT NULL,
    [PK]                           VARCHAR (2)    NOT NULL,
    [TargetDataType]               VARCHAR (1000) NULL,
    [Source System Table]          VARCHAR (10)   NULL,
    [Source Column]                VARCHAR (10)   NULL,
    [Source Data Type]             VARCHAR (10)   NULL,
    [Transformation/Business rule] VARCHAR (10)   NULL,
    [Comments/Other rules]         VARCHAR (10)   NULL,
    [ordinal_position]             SMALLINT       NULL
);


GO

