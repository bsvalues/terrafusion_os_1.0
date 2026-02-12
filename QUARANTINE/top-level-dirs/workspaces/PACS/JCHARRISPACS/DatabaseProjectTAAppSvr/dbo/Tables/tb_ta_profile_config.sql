CREATE TABLE [dbo].[tb_ta_profile_config] (
    [lEnvironmentID] TINYINT       NOT NULL,
    [szFilter]       VARCHAR (511) NOT NULL,
    [bProfileSQL]    BIT           CONSTRAINT [CDF_tb_ta_profile_config_bProfileSQL] DEFAULT ((1)) NOT NULL,
    [bEnabled]       BIT           CONSTRAINT [CDF_tb_ta_profile_config_bEnabled] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_tb_ta_profile_config] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [szFilter] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_profile_config_lEnvironmentID] FOREIGN KEY ([lEnvironmentID]) REFERENCES [dbo].[tb_ta_transaction_environment] ([lEnvironmentID]) ON DELETE CASCADE
);


GO

