CREATE TABLE [dbo].[tb_ta_transaction_environment_sqldss] (
    [lEnvironmentID]           TINYINT       NOT NULL,
    [szSQLDSSServerName]       VARCHAR (128) NOT NULL,
    [szSQLDSSServerDBName]     VARCHAR (128) NOT NULL,
    [szSQLDSSServerLogin]      VARCHAR (128) NOT NULL,
    [szSQLDSSServerPassword]   VARCHAR (128) NOT NULL,
    [szSQLDSSLoginNonPrivy]    VARCHAR (128) NOT NULL,
    [szSQLDSSPasswordNonPrivy] VARCHAR (128) NOT NULL,
    CONSTRAINT [CPK_tb_ta_transaction_environment_sqldss] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_transaction_environment_sqldss_lEnvironmentID] FOREIGN KEY ([lEnvironmentID]) REFERENCES [dbo].[tb_ta_transaction_environment] ([lEnvironmentID]) ON DELETE CASCADE
);


GO

