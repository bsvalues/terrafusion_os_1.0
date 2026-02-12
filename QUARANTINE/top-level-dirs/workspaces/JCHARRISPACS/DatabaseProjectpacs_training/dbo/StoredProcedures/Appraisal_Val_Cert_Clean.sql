



CREATE PROCEDURE Appraisal_Val_Cert_Clean
  @property_id int,
  @sup_num int,
  @owner_id int,
  @owner_tax_year int,
  @pacs_user_id int
 AS 
--temps
--clear the other DBs
delete from value_cert_notice where prop_id = @property_id AND sup_num=@sup_num AND owner_id=@owner_id AND 

pacs_user_id=@pacs_user_id
delete from value_cert_notice_entity where prop_id = @property_id AND owner_id=@owner_id AND pacs_user_id=@pacs_user_id
delete from value_cert_notice_entity_exempt where prop_id = @property_id AND sup_num=@sup_num AND owner_id=@owner_id AND 

pacs_user_id=@pacs_user_id

delete property_entity_exemption_preview
where pacs_user_id = @pacs_user_id
and prop_id = @property_id
and owner_tax_yr = @owner_tax_year
and sup_num = @sup_num
delete prop_owner_entity_val_preview
where pacs_user_id = @pacs_user_id
and prop_id = @property_id
and sup_yr = @owner_tax_year
and sup_num = @sup_num

GO

