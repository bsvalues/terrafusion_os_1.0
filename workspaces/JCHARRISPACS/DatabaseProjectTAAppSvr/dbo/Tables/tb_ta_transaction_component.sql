CREATE TABLE [dbo].[tb_ta_transaction_component] (
    [lEnvironmentID]                  TINYINT          NOT NULL,
    [lTransactionComponentID]         INT              NOT NULL,
    [uuidTransactionComponent]        UNIQUEIDENTIFIER NOT NULL,
    [szTransactionComponentName]      VARCHAR (255)    NOT NULL,
    [szDLLName]                       VARCHAR (255)    NOT NULL,
    [lDefaultPriority]                TINYINT          NOT NULL,
    [bCreateStaticInstance]           BIT              NOT NULL,
    [bDllRegisterServer]              BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bDllRegisterServer] DEFAULT ((0)) NOT NULL,
    [bThreadPerInstance]              BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bThreadPerInstance] DEFAULT ((0)) NOT NULL,
    [bCreateStaticInstanceMasterOnly] BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bCreateStaticInstanceMasterOnly] DEFAULT ((0)) NOT NULL,
    [bEnabled]                        BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bEnabled] DEFAULT ((1)) NOT NULL,
    [bProfile]                        BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bProfile] DEFAULT ((0)) NOT NULL,
    [bProfileSQL]                     BIT              CONSTRAINT [CDF_tb_ta_transaction_component_bProfileSQL] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_tb_ta_transaction_component] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [lTransactionComponentID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tb_ta_transaction_component_bCreateStaticInstance_bCreateStaticInstanceMasterOnly] CHECK ([bCreateStaticInstanceMasterOnly]=(0) OR [bCreateStaticInstance]=(1)),
    CONSTRAINT [CCK_tb_ta_transaction_component_bCreateStaticInstance_bThreadPerInstance] CHECK ([bCreateStaticInstance]=(0) OR [bThreadPerInstance]=(0)),
    CONSTRAINT [CCK_tb_ta_transaction_component_szTransactionComponentName] CHECK (charindex(' ',[szTransactionComponentName],(1))=(0)),
    CONSTRAINT [CFK_tb_ta_transaction_component_lEnvironmentID] FOREIGN KEY ([lEnvironmentID]) REFERENCES [dbo].[tb_ta_transaction_environment] ([lEnvironmentID]) ON DELETE CASCADE
);


GO

