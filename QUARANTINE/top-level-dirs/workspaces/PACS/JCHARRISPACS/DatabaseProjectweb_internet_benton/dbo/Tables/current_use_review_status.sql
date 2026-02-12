CREATE TABLE [dbo].[current_use_review_status] (
    [cur_use_cd]   VARCHAR (15) NOT NULL,
    [cur_use_desc] VARCHAR (50) NOT NULL,
    [initial]      BIT          NOT NULL,
    [closed]       BIT          NOT NULL,
    CONSTRAINT [PK__current_use_revi__2069DFD7] PRIMARY KEY CLUSTERED ([cur_use_cd] ASC)
);


GO

