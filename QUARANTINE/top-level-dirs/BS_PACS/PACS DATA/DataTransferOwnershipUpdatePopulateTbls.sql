
CREATE PROCEDURE DBO.DataTransferOwnershipUpdatePopulateTbls
                    @input_begin_date varchar(25),
                    @input_end_date   varchar(25),
                    @input_entities   varchar(512),
                    @input_prop_dataset_id     varchar(25),
                    @input_entities_datase_id  varchar(25)

AS

SET NOCOUNT ON 
                    

--WE are going to search all those properties whose addresses had changes
--in a specified datee time range
declare @begindate datetime
declare @enddate   datetime
declare @datasetPropsID bigint
declare @tax_yr    numeric (4,0)
--
set @begindate = @input_begin_date
set @enddate   = @input_end_date 

select top 1 @tax_yr = tax_yr from pacs_system 
/*
 * Enter the entities
 */  
    declare @dyn_sql varchar(500)
    SET @dyn_sql = 'INSERT INTO ##data_transfr_entities (entity_id, entity_cd, dataset_id) '
    SET @dyn_sql = @dyn_sql + ' SELECT entity_id , entity_cd, ' + CAST(@input_entities_datase_id AS varchar(25) ) 
                   + '  FROM entity '
    IF (@input_entities<>'<ALL>')
    BEGIN
        SET @dyn_sql = @dyn_sql + 'WHERE entity_cd in ( ' + @input_entities + ' ) '
    END
    --PRINT 'Entities Query:' + @dyn_sql
    exec (@dyn_sql)
    /* Clean up */
    set @dyn_sql = ''
 
/*
 * This procedure selects all the properties that had changes in the selected date range
 */
INSERT INTO ##data_transfr_props 
    select DISTINCT pv.prop_id, 
           pv.prop_val_yr , 
           pv.sup_num, 
           @input_prop_dataset_id 
from 
           property_val pv with(nolock)
    INNER JOIN [owner] o with(nolock)
    ON  pv.prop_id = o.prop_id 
    AND pv.sup_num = o.sup_num
    AND pv.sup_num < 32767
    AND pv.prop_val_yr = o.owner_tax_yr
    INNER JOIN [address] addr with(nolock)
    ON  addr.acct_id = o.owner_id
    INNER JOIN [account] act with(nolock)
    on act.acct_id = o.owner_id
    INNER JOIN entity_prop_assoc epas with(nolock)
    ON epas.tax_yr = o.owner_tax_yr
    AND epas.sup_num = o.sup_num
    AND epas.prop_id = pv.prop_id
    WHERE ((pv.owner_update_dt >= @begindate) 
    and (pv.owner_update_dt <=  @enddate)  
    and (pv.owner_update_dt is  not null) )
    OR ( act.update_dt>= @begindate 
         AND act.update_dt<= @begindate 
         AND act.update_dt is not null
       )  
    AND o.owner_tax_yr = @tax_yr 
    AND entity_id = (SELECT entity_id FROM ##data_transfr_entities WHERE dataset_id = @input_entities_datase_id ) 
        OR ( addr.last_change_dt >= @begindate 
             AND addr.last_change_dt<= @begindate 
             AND  addr.last_change_dt is not null
            )  
--we also need to filter by entity id

---------------------------------------------------------------------------------------------------------
-- Export the Address changes
/*
SELECT count(*) FROM address addr WITH(NOLOCK)
INNER JOIN owner o with(nolock)
ON addr.acct_id = o.owner_id

INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)
ON  dtp.prop_id = o.prop_id
AND dtp.prop_val_yr = o.owner_tax_yr
AND dtp.sup_num = o.sup_num 
WHERE
dtp.dataset_id = 789 
AND (addr.last_change_dt >= @begindate AND addr.last_change_dt<= @enddate AND  addr.last_change_dt is not null) 

--Export the account changes

SELECT * FROM account acct  WITH(NOLOCK)
         INNER JOIN OWNER O WITH(NOLOCK)
ON   acct.acct_id = o.owner_id
INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)
ON  dtp.prop_id     = o.prop_id
AND dtp.prop_val_yr = o.owner_tax_yr
AND dtp.sup_num     = o.sup_num 
WHERE
    dtp.dataset_id = 789 
AND (acct.update_dt >= @begindate 
AND acct.update_dt<= @enddate 
AND  acct.update_dt is not null) 


-- Export the owner changes

SELECT * FROM OWNER o WITH(NOLOCK) 
INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)
ON  dtp.prop_id     = o.prop_id
AND dtp.prop_val_yr = o.owner_tax_yr
AND dtp.sup_num     = o.sup_num 
WHERE
    dtp.dataset_id = 789 
AND (O.update_dt >= @begindate 
AND O.update_dt<= @enddate 
AND  O.update_dt is not null) 

*/


-- select top 20 * from ##data_transfr_props where dataset_id = 789





SET QUOTED_IDENTIFIER OFF

GO

