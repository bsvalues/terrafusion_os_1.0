
CREATE PROCEDURE [dbo].[MassCreateNewPropertiesCopyPropGroupCodes]
	@to_prop_id int,
	@group_code varchar(20),
	@expiration_dt datetime,
	@assessment_yr numeric,
	@create_dt datetime,
	@to_create_id int
	--@prop_val_year decimal
	
AS

delete
	prop_group_assoc
from
	prop_group_assoc as pga
inner join
	property as p
on
	p.prop_id = pga.prop_id
where
	pga.prop_id = @to_prop_id
and
	pga.prop_group_cd = @group_code

insert into
	prop_group_assoc
(
	prop_id,
	prop_group_cd,
	expiration_dt,
	assessment_yr,
	create_dt,
	create_id
	--prop_val_yr
)
select
	@to_prop_id,
	@group_code,
	@expiration_dt,
	@assessment_yr,	
	@create_dt,
	@to_create_id
	--@prop_val_year

GO

