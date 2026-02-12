

CREATE PROCEDURE imp_TravisBuildingPermits @Command int,
    @_permit_num       varchar(30),  -- first parameter from file must have underscore
    @Status            varchar(5),
    @issue_dt	       datetime,
    @dt_complete       datetime,
    @street_num        varchar(10),
    @street_prefix     varchar(10),
    @street_name       varchar(50),
--    @Street            varchar(50),
    @street_suffix     varchar(10),
    @unit_type         varchar(5),
    @unit_number       varchar(15),
    @sub_division      varchar(50),
    @plat              varchar(4),
    @block             varchar(4),
    @lot               varchar(50),
    @res_com           char(1),
    @value             numeric,
    @area              numeric,
    @dim_1             varchar(10),
    @dim_2             varchar(10),
    @dim_3             varchar(10),
    @num_floors        numeric,
    @num_units         numeric,
    @comments          varchar(512),
    @SubTypecode       varchar(5),
    @SubTypeDesc       varchar(50),
    @WorkTypecode      varchar(5),
    @WorkTypeDesc      varchar(50),
    @bldg_inspect_req  char(1),
    @elec_inspect_req  char(1),
    @mech_inspect_req  char(1),
    @plumb_inspect_req char(1),
    @issued_to         varchar(50),
    @owner_phone       varchar(16),
    @builder	       varchar(50),
    @builder_phone     varchar(16),
    @old_permit_no     varchar(20),
    @property_roll     varchar(50),
    @place_id          numeric

AS

IF @Command = 1 -- import record
BEGIN
    declare @permit_id    as int
    declare @cad_status   as varchar(5)
    declare @type_cd      as varchar(10)
    declare @sub_type_cd  as varchar(5)
    declare @issuer       as varchar(30)
    declare @limit_dt     as datetime
    declare @dt_worked    as datetime
    declare @pct_complete as numeric
    declare @active       as char(1)
    declare @last_change  as datetime
    declare @city         as varchar(30)
    declare @land_use     as varchar(30)
    declare @import_dt    as datetime
    declare @OldPermit    as int

-- convert requirements from Y/N to T/F
    select @bldg_inspect_req  = case when @bldg_inspect_req  = 'Y' then 'T' else 'F' end
    select @elec_inspect_req  = case when @elec_inspect_req  = 'Y' then 'T' else 'F' end
    select @mech_inspect_req  = case when @mech_inspect_req  = 'Y' then 'T' else 'F' end
    select @plumb_inspect_req = case when @plumb_inspect_req = 'Y' then 'T' else 'F' end

    select @import_dt = getdate()

    select @OldPermit = count(*) from building_permit
    where bldg_permit_old_permit_no = @old_permit_no AND bldg_permit_num = @_permit_num

    IF @OldPermit = 0
    BEGIN
		exec dbo.GetUniqueID 'building_permit', @permit_id output, 1, 0
        
        --HS30622 REC- (2) By default, when permits are loaded using the PACS import process the program should enter the issuer as CITY. 
        SELECT @issuer = 'CITY'
        --HS30622 REC- (3)By Default when inserting new permits the building_permit_active should be set to 'T'
        SELECT @active = 'T' 

        INSERT INTO building_permit
        (
            bldg_permit_id,
            bldg_permit_status, bldg_permit_cad_status, bldg_permit_type_cd, bldg_permit_sub_type_cd,
            bldg_permit_num, bldg_permit_issuer, bldg_permit_issue_dt, bldg_permit_limit_dt, 
            bldg_permit_dt_complete, bldg_permit_val, bldg_permit_area, bldg_permit_dim_1, bldg_permit_dim_2,
            bldg_permit_dim_3, bldg_permit_num_floors, bldg_permit_num_units,
            bldg_permit_dt_worked, bldg_permit_pct_complete, bldg_permit_builder, bldg_permit_builder_phone,
            bldg_permit_active, bldg_permit_last_chg, bldg_permit_cmnt, bldg_permit_issued_to,
            bldg_permit_owner_phone, bldg_permit_res_com, bldg_permit_street_num, bldg_permit_street_prefix,
            bldg_permit_street_name, bldg_permit_street_suffix, bldg_permit_unit_type, bldg_permit_unit_number,
            bldg_permit_sub_division, bldg_permit_plat, bldg_permit_block, bldg_permit_lot, bldg_permit_city,
            bldg_permit_land_use, bldg_permit_bldg_inspect_req, bldg_permit_elec_inspect_req,
            bldg_permit_mech_inspect_req, bldg_permit_plumb_inspect_req, bldg_permit_old_permit_no,
            bldg_permit_property_roll, bldg_permit_place_id, bldg_permit_import_dt
        )
        VALUES
        (
            @permit_id, @status, @cad_status, @type_cd, @sub_type_cd, @_permit_num, @issuer, @issue_dt, @limit_dt,
            @dt_complete, @value, @area, @dim_1, @dim_2, @dim_3, @num_floors, @num_units, @dt_worked, @pct_complete,
            @builder, @builder_phone, @active, @last_change, @comments, @issued_to, @owner_phone, @res_com,
            @street_num, @street_prefix, @street_name, @street_suffix, @unit_type, @unit_number, @sub_division,
            @plat, @block, @lot, @city, @land_use, @bldg_inspect_req,
            @elec_inspect_req, @mech_inspect_req, @plumb_inspect_req, @old_permit_no, @property_roll, @place_id,
            @import_dt
        )
    END
    ELSE
    BEGIN
        UPDATE building_permit SET
--          bldg_permit_status		   = @status,
--          bldg_permit_cad_status	   = @cad_status,
--          bldg_permit_type_cd		   = @type_cd,
--          bldg_permit_sub_type_cd	   = @sub_type_cd,
--          bldg_permit_issuer		   = @issuer,
            bldg_permit_issue_dt	   = @issue_dt,
--          bldg_permit_limit_dt	   = @limit_dt,
            bldg_permit_dt_complete	   = @dt_complete,
            bldg_permit_val		   = @value,
            bldg_permit_area		   = @area,
            bldg_permit_dim_1		   = @dim_1,
            bldg_permit_dim_2		   = @dim_2,
            bldg_permit_dim_3		   = @dim_3,
            bldg_permit_num_floors	   = @num_floors,
            bldg_permit_num_units	   = @num_units,
--          bldg_permit_dt_worked	   = @dt_worked,
--          bldg_permit_pct_complete	   = @pct_complete,
            bldg_permit_builder		   = @builder,
            bldg_permit_builder_phone	   = @builder_phone,
--          bldg_permit_active		   = @active,
--          bldg_permit_last_chg	   = @last_change,
--            bldg_permit_cmnt		   = bldg_permit_cmnt + char(13) + char(10) + @comments,
            --HS30622 REC 1- If the comments have not changed then don't add the extra line
            bldg_permit_cmnt		   = case WHEN (bldg_permit_cmnt=@comments) THEN 
                                        bldg_permit_cmnt 
                                              ELSE
                                         bldg_permit_cmnt + char(13) + char(10) + @comments
                                         End, --End the case
            bldg_permit_issued_to	   = @issued_to,
            bldg_permit_owner_phone	   = @owner_phone,
            bldg_permit_res_com		   = @res_com,
            bldg_permit_street_num	   = @street_num,
            bldg_permit_street_prefix	   = @street_prefix,
            bldg_permit_street_name	   = @street_name,
            bldg_permit_street_suffix	   = @street_suffix,
            bldg_permit_unit_type	   = @unit_type,
            bldg_permit_unit_number	   = @unit_number,
            bldg_permit_sub_division	   = @sub_division,
            bldg_permit_plat		   = @plat,
            bldg_permit_block		   = @block,
            bldg_permit_lot		   = @lot,
--          bldg_permit_city		   = @city,
--          bldg_permit_land_use	   = @land_use,
            bldg_permit_bldg_inspect_req   = @bldg_inspect_req,
            bldg_permit_elec_inspect_req   = @elec_inspect_req,
            bldg_permit_mech_inspect_req   = @mech_inspect_req,
            bldg_permit_plumb_inspect_req  = @plumb_inspect_req,
            bldg_permit_property_roll	   = @property_roll,
            bldg_permit_place_id	   = @place_id,
            bldg_permit_import_dt	   = @import_dt
        WHERE bldg_permit_old_permit_no = @old_permit_no AND bldg_permit_num = @_permit_num
    END
END

GO

