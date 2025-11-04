
CREATE FUNCTION [internal].[get_space_used]
(
     @objname nvarchar(776)   
)
RETURNS bigint
AS 
BEGIN
    IF @objname IS NULL    
    BEGIN
        RETURN -1
    END
    
    DECLARE  @id int         
    DECLARE @type  character(2) 
    DECLARE @pages bigint          
            
    
    SELECT @id = [object_id], @type = [type] 
    FROM [sys].[objects] 
    WHERE object_id = object_id(@objname)

    
    
    IF (@id IS NULL OR @type  <> 'U')
    BEGIN
        RETURN -1
    END

    SELECT 
        @pages = SUM(in_row_data_page_count + lob_used_page_count + row_overflow_used_page_count)
    FROM sys.dm_db_partition_stats
    WHERE object_id = @id;

    
    RETURN @pages * 8
    
END

GO

ADD SIGNATURE TO OBJECT::[internal].[get_space_used]
    BY CERTIFICATE [MS_SQLISSigningCertificate] WITH SIGNATURE = 0xFEC7EF129C28D67AE1FCDA76F86F7D05E871174D7338E31F419EDED46A1D7BB22B240C00F1DA632757DC8E462DB198AB5A25EB053969CEBE7F631FFC52277515F847510DC23889A62F67A44C906CF42CD84BE76A0C0258DCD2052A2DCC8E6F847635EBB32E698DF6F06DE69B10287B3CAAF92CE1085800FF3231F0E9BDE05442;


GO

