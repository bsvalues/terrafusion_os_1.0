


CREATE PROCEDURE Appraisal_Value_Ceritification_a  
  @property_id int,
  @sup_num int,
  @owner_id int,
  @owner_tax_year int,
  @pacs_user_id_ int
 AS
declare @pacs_ID int
--temps
DECLARE @property_id_temp int
--clear the other DBs
delete from value_cert_notice where prop_id = @property_id AND sup_num=@sup_num AND owner_id=@owner_id AND 

pacs_user_id=@pacs_user_id_
delete from value_cert_notice_entity where prop_id = @property_id AND owner_id=@owner_id AND pacs_user_id=@pacs_user_id_
delete from value_cert_notice_entity_exempt where prop_id = @property_id AND sup_num=@sup_num AND owner_id=@owner_id AND 

pacs_user_id=@pacs_user_id_
--
select @pacs_ID = @pacs_user_id_
insert into value_cert_notice ( pacs_user_id,
				prop_id,
                                sup_num,
                                owner_id,
                                geo_id,
                                situs_display,
                                legal_desc,
                                entities,
                                exemptions,
                                owner_name,
                                address_line1,
                                address_line2,
                                address_line3,
                                address_city,
                                address_state,
                                address_zip,
                                certification_year)



select 
@pacs_user_id_,
@property_id,
@sup_num,
@owner_id,
geo_id,
situs_display, 
legal_desc,
dbo.fn_getEntities(@property_id,@owner_tax_year, @sup_num) as entities, 
dbo.fn_getExemptions(@property_id,@owner_tax_year, @sup_num)as exemptions,
case when a.confidential_file_as_name is not null then a.confidential_file_as_name
    else a.file_as_name end as file_as_name,
addr_line1,
addr_line2,
addr_line3,
addr_city,
addr_state,
addr_zip,
@owner_tax_year  from 
            property inner join property_val AS PV
            on property.prop_id = PV.prop_id
            INNER JOIN owner AS O 
            on
            PV.prop_id = O.prop_id  AND
            PV.sup_num = O.sup_num  AND
            PV.prop_val_yr = O.owner_tax_yr AND
            O.prop_id = @property_id  AND
            O.owner_id = @owner_id AND
            O.sup_num = @sup_num AND
            O.owner_tax_yr = @owner_tax_year 
            

            INNER JOIN account AS A 
            on O.owner_id = A.acct_id 
            LEFT OUTER JOIN address AS Ad 
	    on A.acct_id = Ad.acct_id AND
	    Ad.primary_addr = 'Y'
            LEFT OUTER JOIN Situs AS S 
            on PV.prop_id = S.prop_id AND
            S.primary_situs = 'Y'
 
exec CalculateTaxable '', @sup_num,@owner_tax_year,@property_id,'',@pacs_user_id_, 0   
exec Appr_Val_Cert_Insrt_a @pacs_user_id_,@property_id,  @owner_id,@sup_num, @owner_tax_year

GO

