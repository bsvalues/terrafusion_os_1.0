CREATE TABLE [dbo].[ccCheckSum_Compare_Procedure_Run_Settings] (
    [setting_name]  VARCHAR (250) NOT NULL,
    [setting_value] VARCHAR (500) NOT NULL,
    CONSTRAINT [CPK_ccCheckSum_Compare_Procedure_Run_Settings] PRIMARY KEY CLUSTERED ([setting_name] ASC)
);


GO

