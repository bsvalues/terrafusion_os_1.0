


--Declare @quality as int
--declare @sub_quality as int ;
create view [dbo].[__new_quality] as

SELECT 
row_number() 
over (partition by prop_id 
order by "prop_id" ASC) as "num", 
prop_id, class_cd,imprv_det_sub_class_cd,


CASE
	 WHEN rtrim(class_cd) = 'chp' THEN '1' 
	 WHEN rtrim(class_cd)='Low'THEN '1'
	 WHEN rtrim(class_cd) = 'fair' THEN '2'
	 WHEN rtrim(class_cd) = 'Avg' THEN '3'
	 WHEN rtrim(class_cd) = 'Good' THEN '4'
	 WHEN rtrim(class_cd) = 'VGD' THEN '5'
	 WHEN rtrim(class_cd) = 'EXC' THEN '6'
	else '0' end as 'Quality',
	case 
	when rtrim(imprv_det_sub_class_cd)='+' then '5'
	else '0' end as 'Sub_quality'


FROM property_profile

WHERE
[prop_val_yr] = (select appr_yr 
from pacs_system)

GO

