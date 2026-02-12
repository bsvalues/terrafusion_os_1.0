CREATE TABLE [dbo].[distribution] (
    [distribution_id]       INT          NOT NULL,
    [distribution_type]     VARCHAR (10) NOT NULL,
    [distribute_date]       DATETIME     NOT NULL,
    [distribute_user_id]    INT          NOT NULL,
    [begin_date]            DATETIME     NOT NULL,
    [end_date]              DATETIME     NOT NULL,
    [validated]             BIT          NOT NULL,
    [validate_user_id]      INT          NULL,
    [validate_date]         DATETIME     NULL,
    [exported]              BIT          NOT NULL,
    [export_user_id]        INT          NULL,
    [export_date]           DATETIME     NULL,
    [export_to_fms]         BIT          NOT NULL,
    [undo_distribution_id]  INT          NULL,
    [verify_export_status]  VARCHAR (5)  NULL,
    [verify_export_user_id] INT          NULL,
    [verify_export_date]    DATETIME     NULL,
    CONSTRAINT [CPK_distribution] PRIMARY KEY CLUSTERED ([distribution_id] ASC) WITH (FILLFACTOR = 100)
);


GO

