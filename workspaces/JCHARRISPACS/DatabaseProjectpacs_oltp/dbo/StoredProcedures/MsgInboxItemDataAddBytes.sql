
CREATE procedure [dbo].[MsgInboxItemDataAddBytes]
	@item_id uniqueidentifier,
	@data_id uniqueidentifier,
	@binData varbinary(max),
	@startIndex bigint,
	@dataLength bigint,
	@is_file bit = 0
as

set nocount on

	update msg_inbox_item_data
	set item_data.write(@binData, @startIndex, @dataLength)
	where
		item_id = @item_id and
		data_id = @data_id and
		is_file = @is_file

GO

