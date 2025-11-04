CREATE TABLE [dbo].[data_columns_definition] (
    [columns_id]      INT            IDENTITY (1, 1) NOT NULL,
    [control_id]      INT            NOT NULL,
    [column_number]   SMALLINT       NOT NULL,
    [column_name]     VARCHAR (50)   NOT NULL,
    [heading_text]    VARCHAR (50)   NOT NULL,
    [field_type]      SMALLINT       NOT NULL,
    [display_type]    SMALLINT       NOT NULL,
    [justification]   SMALLINT       NULL,
    [width]           SMALLINT       NULL,
    [read_only]       SMALLINT       NULL,
    [hideable]        SMALLINT       NULL,
    [lookup_query]    VARCHAR (512)  NULL,
    [item_text]       VARCHAR (1024) NULL,
    [decimals]        SMALLINT       NULL,
    [monetary_symbol] CHAR (1)       NULL,
    [default_value]   VARCHAR (255)  NULL,
    [lower_range]     FLOAT (53)     NULL,
    [upper_range]     FLOAT (53)     NULL,
    [lower_date]      DATETIME       NULL,
    [upper_date]      DATETIME       NULL,
    [totaling_column] SMALLINT       NULL,
    [required]        SMALLINT       NULL,
    [key_field]       SMALLINT       NULL,
    [text_color]      INT            NULL,
    CONSTRAINT [CPK_data_columns_definition] PRIMARY KEY CLUSTERED ([columns_id] ASC) WITH (FILLFACTOR = 100)
);


GO

