CREATE TABLE [dbo].[imprv_sketch_note] (
    [prop_id]           INT           NOT NULL,
    [prop_val_yr]       NUMERIC (4)   NOT NULL,
    [imprv_id]          INT           NOT NULL,
    [sup_num]           INT           NOT NULL,
    [sale_id]           INT           NOT NULL,
    [seq_num]           INT           NOT NULL,
    [NoteType]          INT           NOT NULL,
    [xLocation]         INT           NOT NULL,
    [yLocation]         INT           NOT NULL,
    [NoteText]          VARCHAR (255) NULL,
    [xLine]             INT           NOT NULL,
    [yLine]             INT           NOT NULL,
    [NoteLineType]      INT           NOT NULL,
    [NoteBorderType]    INT           NOT NULL,
    [NoteFontSize]      INT           NOT NULL,
    [NoteJustification] INT           NOT NULL,
    [NoteColor]         INT           NOT NULL,
    CONSTRAINT [CPK_imprv_sketch_note] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [seq_num] ASC) WITH (FILLFACTOR = 95),
    CONSTRAINT [CFK_imprv_sketch_note_prop_val_yr_sup_num_sale_id_prop_id_imprv_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id]) REFERENCES [dbo].[imprv] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id])
);


GO

