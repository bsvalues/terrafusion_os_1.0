






/****** Object:  Stored Procedure dbo.ptd_insert_error    Script Date: 6/23/2000 2:54:22 PM ******/

CREATE procedure ptd_mt_insert_error

@input_record_type	varchar(3),
@prop_id		int,
@bad_value		varchar(20),
@message		varchar(150),
@dataset bigint
as

insert into ##ptd_errors values (@input_record_type, @prop_id, @bad_value, @message, @dataset)

GO

