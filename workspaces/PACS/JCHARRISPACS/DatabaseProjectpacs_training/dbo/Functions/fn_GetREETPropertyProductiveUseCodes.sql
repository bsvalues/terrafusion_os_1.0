CREATE FUNCTION fn_GetREETPropertyProductiveUseCodes(
  @property_id int,
  @year numeric(4,0),
  @sup_num int,
  @sale_id int = 0
)
RETURNS varchar(100)
AS
BEGIN
declare @output_codes varchar(100)
set @output_codes = ''

select @output_codes = @output_codes + ', '+ ag_use_cd FROM
(
select distinct ldf.ag_use_cd from land_detail as ldf with (nolock)
inner join ag_use as a_s with (nolock) on ldf.ag_use_cd = a_s.ag_use_cd
where 
(ldf.prop_id = @property_id and 
ldf.prop_val_yr = @year and
ldf.sup_num = @sup_num and
ldf.sale_id = @sale_id and
ldf.ag_apply = 'T' and
(a_s.timber = 1 or a_s.osp = 1 or a_s.dfl = 1 or a_s.ag = 1))
) a

if @output_codes <> ''
	set @output_codes = rtrim(substring(@output_codes, 3, Len(@output_codes)))
else 
	set @output_codes = null

return @output_codes

END

GO

