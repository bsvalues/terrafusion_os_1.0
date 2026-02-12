CREATE TABLE [dbo].[tb_ta_log_change] (
    [l64ChangeID]   BIGINT        IDENTITY (1, 1) NOT NULL,
    [dtChange]      DATETIME      CONSTRAINT [CDF_tb_ta_log_change_dtChange] DEFAULT (getutcdate()) NOT NULL,
    [szSQLAccount]  VARCHAR (128) CONSTRAINT [CDF_tb_ta_log_change_szSQLAccount] DEFAULT (suser_sname()) NOT NULL,
    [szMachineName] VARCHAR (128) CONSTRAINT [CDF_tb_ta_log_change_szMachineName] DEFAULT (host_name()) NOT NULL,
    [szAppName]     VARCHAR (128) CONSTRAINT [CDF_tb_ta_log_change_szAppName] DEFAULT (app_name()) NOT NULL,
    [szChangeType]  CHAR (1)      NOT NULL,
    [szTable]       [sysname]     NOT NULL,
    [szColumn]      [sysname]     NOT NULL,
    [szOldValue]    VARCHAR (255) NULL,
    [szNewValue]    VARCHAR (255) NULL,
    [szRefID]       VARCHAR (511) NULL,
    CONSTRAINT [CPK_tb_ta_log_change] PRIMARY KEY CLUSTERED ([l64ChangeID] ASC) WITH (FILLFACTOR = 100)
);


GO

