


create procedure StreetEdit
	@street_id int,
	@szNewStreetName varchar(50),
	@szNewStreetPrefix varchar(10),
	@szNewStreetSuffix varchar(10),
	@szComment varchar(1000)
as

set nocount on

	update streets set
		street_name = @szNewStreetName,
		street_prefix = @szNewStreetPrefix,
		street_sufix = @szNewStreetSuffix,
		comment = @szComment
	where
		street_id = @street_id

set nocount off

GO

