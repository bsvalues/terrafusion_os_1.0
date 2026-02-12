CREATE TABLE [dbo].[event_object] (
    [event_id]         INT            NOT NULL,
    [object_id]        INT            NOT NULL,
    [object_desc]      VARCHAR (2048) NULL,
    [location]         VARCHAR (255)  NULL,
    [attach_date]      DATETIME       NULL,
    [display_filename] VARCHAR (255)  NULL,
    [pacs_user]        VARCHAR (30)   NULL,
    [pacs_user_id]     INT            NULL,
    CONSTRAINT [CPK_event_object] PRIMARY KEY CLUSTERED ([event_id] ASC, [object_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_event_object_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id])
);


GO


CREATE TRIGGER dbo.tr__event_object_set_attachment_on_deletion
ON dbo.event_object
AFTER DELETE
AS
BEGIN
	DECLARE @event_id int
	SELECT @event_id = event_id
	FROM deleted 

    UPDATE [event] 
	SET attachment = 0
	WHERE [event].event_id = @event_id
END

GO


CREATE TRIGGER tr__event_object_set_attachment_on_insertion
ON [event_object]
AFTER INSERT
AS
BEGIN
	DECLARE @event_id int
	SELECT @event_id = event_id
	FROM inserted 

    UPDATE [event] 
	SET attachment = 1
	WHERE [event].event_id = @event_id
END

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The pacs user id associated to the user that generated the event object', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event_object', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

