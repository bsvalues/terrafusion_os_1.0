CREATE TABLE [dbo].[corrected_run] (
    [run_id]               INT      NOT NULL,
    [from_date]            DATETIME NOT NULL,
    [to_date]              DATETIME NOT NULL,
    [create_date]          DATETIME NOT NULL,
    [create_by]            INT      NOT NULL,
    [last_printed_by]      INT      NULL,
    [last_print_date]      DATETIME NULL,
    [include_zero_balance] BIT      NOT NULL,
    [print_count]          INT      NOT NULL,
    CONSTRAINT [CPK_corrected_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

