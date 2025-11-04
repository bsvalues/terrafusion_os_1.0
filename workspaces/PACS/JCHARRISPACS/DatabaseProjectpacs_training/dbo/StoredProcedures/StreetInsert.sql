



create procedure StreetInsert
	@szStreetName varchar(50),
	@szStreetPrefix varchar(10),
	@szStreetSuffix varchar(10),
	@szComment	varchar(1000),
	@bOutputRS bit = 0
as

set nocount on

	declare @StreetID bigint

	select @StreetID = ID
		from next_unique_id with(rowlock, holdlock, updlock)
		where id_name = 'street'

	insert streets (street_id,
		street_name, street_prefix, street_sufix, date_added, comment
	) values (@StreetID,
		@szStreetName, @szStreetPrefix, @szStreetSuffix, getdate(), @szComment
	)

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select street_id = scope_identity()
	end

GO

