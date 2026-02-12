





CREATE   procedure ProfileTypeDesc

@input_code		varchar(10),
@input_type		varchar(5),
@input_cs_ns		varchar(100),
@input_cs_ew		varchar(100),
@input_cs_quad		varchar(100),
@input_mapid		varchar(100),
@input_builders		varchar(100),
@input_opinion_of_value	varchar(100),
@input_comment		varchar(1024),
@input_inspection_dt    varchar(25),
--@input_appraisers	varchar(100)
--Now takes an appraiser ID rather than name(jmd)
@input_appraiser_id	int

as

delete from profile_type_desc
where code = @input_code
and   type = @input_type

insert into profile_type_desc
(
code,
type,
cs_ns,
cs_ew,
cs_quad,
mapid,
builders,
opinion_of_value,
comment,
inspection_date,
appraiser_id
)
values
(
@input_code,
@input_type,
@input_cs_ns,
@input_cs_ew,
@input_cs_quad,
@input_mapid,
@input_builders,
@input_opinion_of_value,
@input_comment,
convert(datetime, @input_inspection_dt),
@input_appraiser_id
)

GO

