
CREATE procedure [dbo].[MsgInboxItemDataInsertUpdate]
	@item_id uniqueidentifier,
	@data_id uniqueidentifier,
	@is_file bit = 0
as

set nocount on

	update msg_inbox_item_data
	set item_data = 0x0
	where
		item_id = @item_id and
		data_id = @data_id and
		is_file = @is_file
	
	if ( @@rowcount = 0 )
	begin
		insert msg_inbox_item_data (item_id, data_id, item_data, is_file)
		values (@item_id, @data_id, 0x0, @is_file)
	end

GO

