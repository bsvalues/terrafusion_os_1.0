
CREATE procedure [dbo].[MsgInboxItemInsertUpdate]
	@item_id uniqueidentifier,
	@item_sender int,
	@item_recipient int,
	@item_subject varchar(255),
	@item_date datetime,
	@is_read bit,
	@notification_id int
as

set nocount on

	if(@notification_id = -1)
	begin
		set @notification_id = null
	end

	update msg_inbox_item
	set
		item_subject = @item_subject,
		is_read = @is_read
	where item_id = @item_id
	
	if ( @@rowcount = 0 )
	begin
		insert msg_inbox_item (item_id, item_sender, item_recipient, item_subject, item_date, is_read, notification_id)
		values (@item_id, @item_sender, @item_recipient, @item_subject, @item_date, @is_read, @notification_id)
	end

GO

