CREATE TABLE [dbo].[appraiser_machine] (
    [machine_name] VARCHAR (256) NOT NULL,
    [appraiser_id] INT           NOT NULL,
    CONSTRAINT [CPK_appraiser_machine] PRIMARY KEY CLUSTERED ([machine_name] ASC) WITH (FILLFACTOR = 90)
);


GO

