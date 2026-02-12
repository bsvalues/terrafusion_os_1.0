CREATE PROCEDURE [dbo].[api_ExportPropertyData]
    @ExportType VARCHAR(50),
    @YearFilter INT = NULL,
    @BatchSize INT = 1000,
    @Offset INT = 0,
    @Format VARCHAR(10) = 'JSON' -- Can be 'JSON' or 'XML'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SQL NVARCHAR(MAX);
    
    -- Common fields across all export types
    DECLARE @CommonFields NVARCHAR(MAX) = '
        p.prop_id,
        p.geo_id,
        p.property_class,
        pv.prop_val_yr,
        pv.market,
        pv.assessed,
        pv.taxable,
        s.situs_num,
        s.situs_street,
        s.situs_city,
        s.situs_state,
        s.situs_zip';

    IF @ExportType = 'PROPERTY_BASIC'
    BEGIN
        SET @SQL = '
        SELECT ' + 
        CASE WHEN @Format = 'JSON' 
            THEN 'FOR JSON PATH, ROOT(''properties'')' 
            ELSE 'FOR XML PATH(''Property''), ROOT(''Properties'')' 
        END + '
        FROM property p
        LEFT JOIN property_val pv ON p.prop_id = pv.prop_id
        LEFT JOIN situs s ON p.prop_id = s.prop_id
        WHERE (@YearFilter IS NULL OR pv.prop_val_yr = @YearFilter)
        ORDER BY p.prop_id
        OFFSET @Offset ROWS
        FETCH NEXT @BatchSize ROWS ONLY';
    END

    IF @ExportType = 'PROPERTY_DETAILED'
    BEGIN
        SET @SQL = '
        SELECT ' + @CommonFields + ',
            i.imprv_type_cd,
            i.year_built,
            i.effective_yr_built,
            i.quality_cd,
            i.condition_cd,
            ld.land_type_cd,
            ld.zoning,
            ld.area,
            ld.unit_type_cd ' +
        CASE WHEN @Format = 'JSON' 
            THEN 'FOR JSON PATH, ROOT(''properties'')' 
            ELSE 'FOR XML PATH(''Property''), ROOT(''Properties'')' 
        END + '
        FROM property p
        LEFT JOIN property_val pv ON p.prop_id = pv.prop_id
        LEFT JOIN situs s ON p.prop_id = s.prop_id
        LEFT JOIN imprv i ON p.prop_id = i.prop_id
        LEFT JOIN land_detail ld ON p.prop_id = ld.prop_id
        WHERE (@YearFilter IS NULL OR pv.prop_val_yr = @YearFilter)
        ORDER BY p.prop_id
        OFFSET @Offset ROWS
        FETCH NEXT @BatchSize ROWS ONLY';
    END

    IF @ExportType = 'PROPERTY_VALUATION'
    BEGIN
        SET @SQL = '
        SELECT ' + @CommonFields + ',
            pv.imprv_hstd_val,
            pv.imprv_non_hstd_val,
            pv.land_hstd_val,
            pv.land_non_hstd_val,
            pv.ag_market,
            pv.timber_market ' +
        CASE WHEN @Format = 'JSON' 
            THEN 'FOR JSON PATH, ROOT(''properties'')' 
            ELSE 'FOR XML PATH(''Property''), ROOT(''Properties'')' 
        END + '
        FROM property p
        LEFT JOIN property_val pv ON p.prop_id = pv.prop_id
        LEFT JOIN situs s ON p.prop_id = s.prop_id
        WHERE (@YearFilter IS NULL OR pv.prop_val_yr = @YearFilter)
        ORDER BY p.prop_id
        OFFSET @Offset ROWS
        FETCH NEXT @BatchSize ROWS ONLY';
    END

    EXEC sp_executesql @SQL, 
        N'@YearFilter INT, @BatchSize INT, @Offset INT',
        @YearFilter, @BatchSize, @Offset;
END
