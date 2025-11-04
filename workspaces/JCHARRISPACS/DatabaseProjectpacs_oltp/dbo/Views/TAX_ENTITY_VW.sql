














/****** Object:  View dbo.TAX_ENTITY_VW    Script Date: 1/3/99 9:45:18 PM ******/

/****** Object:  View dbo.TAX_ENTITY_VW    Script Date: 1/3/99 11:57:08 AM ******/
/****** Object:  View dbo.TAX_ENTITY_VW    Script Date: 12/21/98 5:34:06 PM ******/
/****** Object:  View dbo.TAX_ENTITY_VW    Script Date: 9/20/98 4:28:37 PM ******/
CREATE VIEW TAX_ENTITY_VW
AS SELECT
       entity.entity_id entity_entity_id,
       account.acct_id acct_id,
       file_as_name,
       entity_cd,
       entity_type_cd,
       entity_disb_bal,
       taxing_unit_num,
       mbl_hm_submission,
       freeports_allowed,
       merged_acct_id,
       opening_balance,
       isnull(rendition_entity, 0) as rendition_entity
from entity, account
where entity.entity_id  = account.acct_id

GO

