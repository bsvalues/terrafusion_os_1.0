CREATE TABLE [dbo].[reet_rate] (
    [tax_district_id]   INT            NOT NULL,
    [reet_rate_id]      INT            NOT NULL,
    [description]       VARCHAR (50)   NULL,
    [reet_rate]         NUMERIC (5, 2) NOT NULL,
    [begin_date]        DATETIME       NULL,
    [end_date]          DATETIME       NULL,
    [is_current]        BIT            NOT NULL,
    [rate_type_cd]      VARCHAR (10)   NULL,
    [resolution_number] INT            NULL,
    [resolution_date]   DATETIME       NULL,
    CONSTRAINT [CPK_reet_rate] PRIMARY KEY CLUSTERED ([reet_rate_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_reet_rate_rate_type_cd] FOREIGN KEY ([rate_type_cd]) REFERENCES [dbo].[reet_rate_type] ([rate_type_cd]),
    CONSTRAINT [CFK_reet_rate_tax_district_id] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[tax_district] ([tax_district_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_reet_rate_id_tax_district_id]
    ON [dbo].[reet_rate]([reet_rate_id] ASC, [tax_district_id] ASC);


GO

