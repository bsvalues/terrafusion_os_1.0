
CREATE PROCEDURE imp_TravisCASS @Command int, @Reason varchar(5),
    @owner_id int, @owner_tax_yr int, @addr_type_cd char(1),
    @addr_line1 varchar(50), @addr_line2 varchar(50), @addr_line3 varchar(50),
    @addr_city varchar(50), @addr_state varchar(2),
    @new_zip varchar(10), @new_cass varchar(10), @new_route varchar(10)
AS

if @Command = 0 -- Initialize import process
BEGIN
    IF EXISTS(select name from tempdb.dbo.sysobjects where name = '##imp_TravisCassReport')
        DROP TABLE ##imp_TravisCassReport

    create table ##imp_TravisCassReport(row_num int, row_text varchar(80), row_data int)
    INSERT ##imp_TravisCassReport Values(1, 'Travis Cass Report', 0)
    INSERT ##imp_TravisCassReport Values(3, 'Number of records Processed', 0)
    INSERT ##imp_TravisCassReport Values(4, 'Number of records updated', 0)
END
ELSE if @Command = 1 -- import record
BEGIN
    if @new_zip <> '' OR @new_cass <> '' OR @new_route <> ''
    BEGIN
        UPDATE address
        SET chg_reason_cd = @Reason, zip = @new_zip, cass = @new_cass, route = substring(@new_route, 1, 2)
        FROM address, owner
        where address.acct_id = @owner_id
        and isnull(address.addr_line1, '') = @addr_line1
        and isnull(address.addr_line2, '') = @addr_line2
        and isnull(address.addr_line3, '') = @addr_line3
        and isnull(address.addr_city, '')  = @addr_city
        and isnull(address.addr_state, '') = @addr_state
        and address.addr_type_cd = @addr_type_cd
        and address.primary_addr = 'Y'
        and owner.owner_id = address.acct_id
        and owner.owner_tax_yr = @owner_tax_yr

        UPDATE ##imp_TravisCassReport
        SET row_Data = row_data+1 where row_num = 3

        if @@ROWCOUNT <> 0
        BEGIN
            UPDATE ##imp_TravisCassReport
            SET row_Data = row_data+1 where row_num = 4
        END
    END
    UPDATE ##imp_TravisCassReport
    SET row_Data = row_data+1 where row_num = 3
END 
ELSE if @Command = 2 -- import ended
BEGIN
    UPDATE ##imp_TravisCassReport
    SET row_text = cast(row_data as varchar(10)) + ' total records processed'
    where row_num = 3

    UPDATE ##imp_TravisCassReport
    SET row_text = cast(row_data as varchar(10)) + ' records updated'
    where row_num = 4
END

GO

