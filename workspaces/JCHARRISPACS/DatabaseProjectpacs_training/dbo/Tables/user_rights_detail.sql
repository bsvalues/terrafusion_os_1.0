CREATE TABLE [dbo].[user_rights_detail] (
    [right_id]         INT           NOT NULL,
    [name]             VARCHAR (100) NOT NULL,
    [description]      VARCHAR (255) NOT NULL,
    [parent_right]     INT           NULL,
    [category]         VARCHAR (255) NOT NULL,
    [is_appraisal]     BIT           NOT NULL,
    [is_collections]   BIT           NOT NULL,
    [is_administrator] BIT           NOT NULL,
    CONSTRAINT [PK_user_rights_detail] PRIMARY KEY CLUSTERED ([right_id] ASC)
);


GO

