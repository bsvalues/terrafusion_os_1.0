CREATE TABLE [dbo].[mobile_manager_mass_update_log] (
    [prop_id]  INT           NOT NULL,
    [old]      VARCHAR (50)  NOT NULL,
    [new]      VARCHAR (50)  NOT NULL,
    [datetime] DATETIME      DEFAULT (getdate()) NOT NULL,
    [user]     VARCHAR (50)  NOT NULL,
    [type]     VARCHAR (50)  CONSTRAINT [DF_mobile_manager_mass_update_log_type] DEFAULT ('unknown') NOT NULL,
    [run_id]   INT           CONSTRAINT [DF_mobile_manager_mass_update_log_run_id] DEFAULT ((0)) NOT NULL,
    [criteria] VARCHAR (500) CONSTRAINT [DF_mobile_manager_mass_update_log_criteria] DEFAULT ('prop_id') NULL,
    CONSTRAINT [mobile_manager_mass_update_log_pk1] PRIMARY KEY CLUSTERED ([prop_id] ASC, [datetime] ASC, [user] ASC)
);


GO

