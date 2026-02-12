
create procedure LayerOperationSupplementCreateEvent
	@lPropID int,
	@lEventID int,
	@szPacsUserName varchar(30),
	@szEventDesc varchar(2048)
as

set nocount on

	insert dbo.event with(rowlock) (
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		ref_evt_type, ref_year,
		ref_num, ref_id1, ref_id2, ref_id3, ref_id4, ref_id5, ref_id6
	) values (
		@lEventID,
		'A',
		'SYSTEM',
		getdate(),
		@szPacsUserName,
		@szEventDesc,
		null, null,
		0, 0, 0, 0, 0, 0, 0
	)

	insert dbo.prop_event_assoc with(rowlock) (prop_id, event_id) values (@lPropID, @lEventID)

	return(0)

GO

