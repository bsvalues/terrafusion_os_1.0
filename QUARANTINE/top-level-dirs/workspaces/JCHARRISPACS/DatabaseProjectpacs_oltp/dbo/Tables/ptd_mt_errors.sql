CREATE TABLE [dbo].[ptd_mt_errors] (
    [record_type] VARCHAR (3)   NULL,
    [prop_id]     INT           NULL,
    [bad_value]   VARCHAR (20)  NULL,
    [message]     VARCHAR (150) NULL,
    [dataset_id]  BIGINT        NOT NULL
);


GO

