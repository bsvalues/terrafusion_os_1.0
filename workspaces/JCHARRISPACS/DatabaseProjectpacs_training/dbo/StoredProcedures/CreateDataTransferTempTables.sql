
/*  
    *  RonaldEspejo 3/30/2006
    *  CreateDataTransferTempTables
    *   
    */
CREATE PROCEDURE CreateDataTransferTempTables
   
AS
SET NOCOUNT ON
 
IF EXISTS (select name from tempdb.dbo.sysobjects where name = '##data_transfr_props')
BEGIN
	drop table [dbo].[##data_transfr_props]
END

    CREATE TABLE [##data_transfr_props](
        [prop_id]		[int] NULL,
        [prop_val_yr]	[numeric](4)NULL,
        [sup_num]		[int]NULL,
        [dataset_id]    [bigint] NOT NULL
) ON [PRIMARY]


IF EXISTS (select name from tempdb.dbo.sysobjects where name = '##data_transfr_entities')
BEGIN
	drop table [dbo].[##data_transfr_entities]
END

    CREATE TABLE [##data_transfr_entities](
        [entity_id]     int NULL,
        [entity_cd]     char(5)NULL,
        [dataset_id]    [bigint] NOT NULL
) ON [PRIMARY]

/*
 * These are for the import
 */
IF EXISTS (select name from tempdb.dbo.sysobjects where name = '##data_transfer_verify_data_map')
BEGIN
	drop table [dbo].[##data_transfer_verify_data_map]
END

    CREATE TABLE [##data_transfer_verify_data_map](
        [id]                  [int] IDENTITY (1, 1) NOT NULL, 
        [table_name]          varchar(100) NOT NULL,
        [temp_table_name]     varchar(100) NOT NULL,
        [n_conflicts]         int NOT NULL DEFAULT (0),
        [error_hint]          varchar(255)NULL,
        [verify_status]       bit NOT NULL DEFAULT (0),
        [table_is_supported]  bit NOT NULL DEFAULT (0),
        [is_ownership_update] bit NOT NULL DEFAULT (0),
        [dataset_id]          [bigint] NOT NULL
) ON [PRIMARY]

GO

