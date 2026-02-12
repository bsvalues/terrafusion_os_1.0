
create procedure dbo.DeedProcessImportData  
        @skip_duplicate int
as

 
-- Create the batch 
DECLARE @nNewBatchID as int 
DECLARE @nDuplicatesFound as int
DECLARE @nCopyDataToMainTable as int

SELECT @nNewBatchID      = 0
SELECT @nDuplicatesFound = 0  
SELECT @nCopyDataToMainTable = 1

INSERT INTO ##deed_joiner_import_detail	  
	(batch_id,
     deed_num,
	 RecordID,
	 deed_vol,
	 deed_pg,
	 deed_type_cd,
	 deed_ex_date,
	 deed_rec_date,
	 grantor_last_name,
	 grantor_first_name,
	 grantor_full_name,
	 grantor_addr1,
	 grantor_addr2,
	 grantor_addr3,
	 grantor_city,
	 grantor_state,
	 grantor_zip,
	 grantee_last_name,
	 grantee_first_name,
	 grantee_full_name,
	 grantee_addr1,
	 grantee_addr2,
	 grantee_addr3,
	 grantee_city,
	 grantee_state,
	 grantee_zip,
	 legal_ncb,
	 legal_lot_num,
	 legal_block_num,
	 legal_subdv,
	 deed_consideration,
	 --processed,
	 document_no,
	 image_id,
	 image_filename,
     source_table_row_id)
 

SELECT  DISTINCT
        @nNewBatchID as batch_id,
        tdetails.sDocumentNO as deed_num, 
        tdetails.iRecordID,
        tdetails.sBookNo as deed_vol,
        tdetails.spageNo as deed_pg,
        tdetails.sInstrumentType as deed_type_cd,
        CAST(tdetails.InstrumentDate as datetime ) as deed_ex_date,
        CAST(tdetails.FiledDate + ' ' + grantor.FiledTime  AS datetime) as deed_rec_date,
        grantor.sNameLast as grantor_lastname,
        grantor.sNameFirst as grantor_firstname, 
        LEFT( LTRIM( ISNULL(grantor.sNameLast,'') + ' ' +  
              ISNULL(grantor.sNameFirst,'') + ' ' +
              ISNULL(grantor.sNameMiddle,'') + ' ' +
              ISNULL(grantor.sNameExt , '')), 50) as 'grantor_fullname',
       grantor.sAddress1 as 'grantor_address1',
       grantor.sAddress2 as 'grantor_address2',
       grantor.sAddress3 as 'grantor_address3', 
       grantor.sCity as 'grantor_city',                                              
       grantor.sState as 'grantor_state',                                             
       grantor.sZip as 'grantor_zip', 
       grantee.sNameLast as 'grantee_lastname',
       grantee.sNameFirst as 'grantee_firstname',
       LEFT( LTRIM( ISNULL(grantee.sNameLast,'') + ' ' + 
              ISNULL(grantee.sNameFirst,'') + ' ' +
              ISNULL(grantee.sNameMiddle,'') + ' ' +
              ISNULL(grantee.sNameExt , '') ), 50) as 'grantee_fullname',
       grantee.sAddress1 as 'grantee_address1',
       grantee.sAddress2 as 'grantee_address2',
       grantee.sAddress3 as 'grantee_address3',   
       grantee.sCity as 'grantee_city',                                              
       grantee.sState as 'grantee_state',                                             
       grantee.sZip as 'grantee_zip',  
       grantor.sPreviousParcel as legal_ncb,
       0 as legal_lot_num,
       0 as legal_block_num,
       tdetails.sSubdivision as legal_subdv,
       tdetails.mnyConsideration as deed_consideration,
       tdetails.sDocumentNO as document_no,
       tdetails.ImageID as image_id, 
       CAST(tdetails.sDocumentNO as VARCHAR(20)) + '.TIF',--img.FileName as image_filename, 
       tdetails.row_id 

	FROM ##temp_deed_import_detail tdetails
    INNER JOIN ##temp_deed_import_detail grantor ON
    grantor.iRecordID = tdetails.iRecordID AND
    grantor.sDocumentNO = tdetails.sDocumentNO
    INNER JOIN  ##temp_deed_import_detail as   grantee ON   
	grantee.iRecordID=tdetails.iRecordID 
	AND grantee.sDocumentNO=tdetails.sDocumentNO  
WHERE   
    grantor.tiPartyType  = 1
and grantee.tiPartyType  = 2
    ORDER BY tdetails.row_id ASC 
-- Add the Legal Block Num and Legal Lot Num
UPDATE ##deed_joiner_import_detail  
SET legal_block_num = 
( SELECT MAX(sRangeMin) FROM ##temp_deed_import_detail tdid WHERE 
    tdid.tiRangeType = 0 AND tdid.sDocumentNO = deed_num 
)
FROM ##deed_joiner_import_detail  
--
UPDATE ##deed_joiner_import_detail  
SET legal_lot_num =
( SELECT MAX(sRangeMin) FROM  ##temp_deed_import_detail tdidlot  WHERE
  tdidlot.tiRangeType = 1 AND tdidlot.sDocumentNO = deed_num
)
FROM ##deed_joiner_import_detail   
--Determine if there are more than 1 records for the same deed num 
UPDATE ##deed_joiner_import_detail
SET multiple_records_found = 1
WHERE deed_num in (SELECT deed_num   FROM ##deed_joiner_import_detail group by deed_num HAVING COUNT(*)>1)
 
   --code goes here
    /**********************************************************
    * If the skipduplicates flag is set then 
    * remove all the deed_nums that are already 
    * in the deed_import_detail table. If set to false then 
    * we need to return 
    *********************************************************/
    if (@skip_duplicate=1)
        BEGIN 
            DELETE ##deed_joiner_import_detail 
            FROM  ##deed_joiner_import_detail tjid
            INNER JOIN 
            deed_import_detail  did ON
            did.deed_num = tjid.deed_num 
             
    	END  
    ELSE
        BEGIN
            /************************************************************************
             * If there are any duplicates then we should not proceed with the insert
             * get the first 10 duplicates into a temp table to return to the client
             ************************************************************************/
        if EXISTS( SELECT * FROM  deed_import_detail did INNER JOIN ##deed_joiner_import_detail  ttdid
                        ON did.deed_num = ttdid.deed_num)
             BEGIN
                 SELECT DISTINCT TOP 10 batch_id = '-1',  ttdid.deed_num FROM deed_import_detail did 
                 INNER JOIN ##deed_joiner_import_detail  ttdid
                 ON did.deed_num = ttdid.deed_num
                 SET @nCopyDataToMainTable = 0
             END 
             
    
        END  
   /***********************************************************************************************
    * Don't insert duplicates into the table, this means there could be case when a deed_num is not
    * in the deed_import_detail but it's duplicate in our temporary table
    ***********************************************************************************************/
declare @total_to_copy as int
SELECT @total_to_copy = 0  

SELECT  @total_to_copy = count(*) from ##deed_joiner_import_detail 


if (@nCopyDataToMainTable=1 AND @total_to_copy>0)
BEGIN
    INSERT INTO deed_import_batch (batch_create_dt, image_path, [year])
    VALUES(GETDATE(), '_', 0)
    SELECT @nNewBatchID = @@IDENTITY  
    
	INSERT INTO  deed_import_detail
	(
     batch_id,
     deed_num,
	 RecordID,
	 deed_vol,
	 deed_pg,
	 deed_type_cd,
	 deed_ex_date,
	 deed_rec_date,
	 grantor_last_name,
	 grantor_first_name,
	 grantor_full_name,
	 grantor_addr1,
	 grantor_addr2,
	 grantor_addr3,
	 grantor_city,
	 grantor_state,
	 grantor_zip,
	 grantee_last_name,
	 grantee_first_name,
	 grantee_full_name,
	 grantee_addr1,
	 grantee_addr2,
	 grantee_addr3,
	 grantee_city,
	 grantee_state,
	 grantee_zip,
	 legal_ncb,
	 legal_lot_num,
	 legal_block_num,
	 legal_subdv,
	 deed_consideration, 
	 document_no,
	 image_id,
	 image_filename,
     multiple_records_found
         )
	 SELECT
     @nNewBatchID,
     did.deed_num,
	 did.RecordID,
	 did.deed_vol,
	 did.deed_pg,
	 did.deed_type_cd,
	 did.deed_ex_date,
	 did.deed_rec_date,
	 did.grantor_last_name,
	 did.grantor_first_name,
	 did.grantor_full_name,
	 did.grantor_addr1,
	 did.grantor_addr2,
	 did.grantor_addr3,
	 did.grantor_city,
	 did.grantor_state,
	 did.grantor_zip,
	 did.grantee_last_name,
	 did.grantee_first_name,
	 did.grantee_full_name,
	 did.grantee_addr1,
	 did.grantee_addr2,
	 did.grantee_addr3,
	 did.grantee_city,
	 did.grantee_state,
	 did.grantee_zip,
	 did.legal_ncb,
	 did.legal_lot_num,
	 did.legal_block_num,
	 did.legal_subdv,
	 did.deed_consideration, 
	 did.document_no,
	 did.image_id,
	 did.image_filename,
     did.multiple_records_found  
        FROM ##deed_joiner_import_detail did
		INNER JOIN 
		(
		 SELECT RecordID, MIN(row_id) as row_id  
		 FROM ##deed_joiner_import_detail GROUP BY RecordID 
		) X	
	ON did.row_id = X.row_id
    /*
     * Return the new batch id
     */
     SELECT @nNewBatchID as batch_id , deed_num = 0   
END 

if (@total_to_copy < 1 AND @nCopyDataToMainTable=1 ) 
BEGIN
    SELECT '0' as batch_id, 'no batch' as error
END

GO

