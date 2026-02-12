CREATE TABLE [dbo].[deferral_images] (
    [deferral_image_id] INT         IDENTITY (1, 1) NOT NULL,
    [deferral_id]       INT         NOT NULL,
    [ref_id]            INT         NOT NULL,
    [is_image]          BIT         NOT NULL,
    [statement_type]    VARCHAR (5) NOT NULL,
    [year]              NUMERIC (4) NULL,
    [send_to_state]     BIT         DEFAULT ((0)) NULL,
    CONSTRAINT [PK_deferral_images] PRIMARY KEY CLUSTERED ([deferral_image_id] ASC),
    CONSTRAINT [ck_deferral_images_statement_type] CHECK ([statement_type]='' OR [statement_type]='SA' OR [statement_type]='FEE' OR [statement_type]='BILL'),
    CONSTRAINT [FK1_deferral_id] FOREIGN KEY ([deferral_id]) REFERENCES [dbo].[deferral] ([deferral_id])
);


GO

