

create procedure LawsuitInsertContact
	@lawsuit_id int,
	@contact_type_cd varchar(10)
as

set nocount on

	declare @contact_id int

	insert lawsuit_contact (
		lawsuit_id, contact_type_cd
	) values (
		@lawsuit_id, @contact_type_cd
	)
	set @contact_id = @@identity

set nocount off

	select contact_id = @contact_id

GO

