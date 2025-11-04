
















/****** Object:  View dbo.unprocessed_levy_roll    Script Date: 1/3/99 9:45:19 PM ******/

/****** Object:  View dbo.unprocessed_levy_roll    Script Date: 1/3/99 11:57:08 AM ******/
/****** Object:  View dbo.unprocessed_levy_roll    Script Date: 12/21/98 5:34:30 PM ******/
create view unprocessed_levy_roll
as
select tax_rate.entity_id, tax_rate.tax_rate_yr, entity.entity_cd, account.file_as_name
from account, entity, tax_rate
left outer join processed_levy_roll_vw as plrv1 on tax_rate.entity_id   = plrv1.entity_id
           join processed_levy_roll_vw as plrv2 on tax_rate.tax_rate_yr <> plrv2.tax_yr
where entity.entity_id = tax_rate.entity_id
and   entity.entity_id = account.acct_id

GO

