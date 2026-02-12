CREATE TABLE [dbo].[collection_pursuit_status] (
    [pursuit_status_code]        VARCHAR (10) NOT NULL,
    [pursuit_status_description] VARCHAR (50) NOT NULL,
    [pursuit_type_code]          VARCHAR (10) NOT NULL,
    [enable_fee]                 BIT          NOT NULL,
    [fee_type_cd]                VARCHAR (10) NULL,
    [enable_event]               BIT          NOT NULL,
    [litigation_event_type]      VARCHAR (10) NULL,
    CONSTRAINT [CPK_collection_pursuit_status] PRIMARY KEY CLUSTERED ([pursuit_status_code] ASC)
);


GO

