CREATE TABLE [dbo].[property_lien_release] (
    [lien_id]         INT           NOT NULL,
    [release_index]   INT           IDENTITY (0, 1) NOT NULL,
    [release_date]    DATETIME      NULL,
    [partial_release] BIT           NOT NULL,
    [mete_and_bounds] VARCHAR (MAX) NULL,
    CONSTRAINT [CPK_property_lien_release] PRIMARY KEY CLUSTERED ([lien_id] ASC, [release_index] ASC),
    CONSTRAINT [CFK_property_lien_release_property_lien] FOREIGN KEY ([lien_id]) REFERENCES [dbo].[property_lien] ([lien_id])
);


GO

