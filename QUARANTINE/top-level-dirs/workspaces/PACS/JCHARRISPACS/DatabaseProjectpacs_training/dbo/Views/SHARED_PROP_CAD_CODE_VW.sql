














/****** Object:  View dbo.SHARED_PROP_CAD_CODE_VW    Script Date: 1/3/99 9:45:18 PM ******/

/****** Object:  View dbo.SHARED_PROP_CAD_CODE_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.SHARED_PROP_CAD_CODE_VW    Script Date: 12/21/98 5:34:15 PM ******/
create view SHARED_PROP_CAD_CODE_VW
as
select  shared_prop.pacs_prop_id,
 shared_prop.shared_year,
 shared_prop.shared_prop_id,
 shared_prop.shared_cad_code,
        CAD.CAD_desc,
		shared_prop.sup_num
from shared_prop, CAD 
where shared_prop.shared_cad_code = CAD.CAD_code

GO

