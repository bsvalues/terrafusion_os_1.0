<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:esri="ESRI">

  <xsl:include href="NITF-Legacy.xslt" />
  
  <xsl:output method="xml" encoding="UTF-8" version="1.0"
              indent="yes"/>

  <xsl:variable name="FieldTable" select="document('NITFFields.xml')"/>
  <xsl:variable name="FileVersion">
    <xsl:value-of select="/NITF/Version/text()"/>
  </xsl:variable>

  <!-- Document root -->
  <xsl:template match="/">
    <xsl:apply-templates select="NITF" />
    <xsl:apply-templates select="esri:NITF" />
  </xsl:template>

  <!-- Root nodes -->
  <xsl:template match="NITF">
    <Group>
      <xsl:attribute name="name"><xsl:value-of select="normalize-space(FileHeader/FTITLE)" /></xsl:attribute>
      <xsl:apply-templates select="FileHeader" />
      <xsl:apply-templates select="Images" />
      <xsl:apply-templates select="Text" />
      <!--<xsl:apply-templates select="SymbolSegments" />
            <xsl:apply-templates select="Graphics" />
            <xsl:apply-templates select="Labels" />-->
      <xsl:apply-templates select="DESs" />
    </Group>

  </xsl:template>

  <!-- File Header -->
  <xsl:template match="FileHeader">
    <Group>
      <xsl:attribute name="shortName">FileHeader</xsl:attribute>
      <xsl:attribute name="name">File Header</xsl:attribute>
      <xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>
      <xsl:attribute name="info">/FileHeader@Info</xsl:attribute>
      <xsl:for-each select="*">
        <xsl:choose>
          <xsl:when test="name() = 'Security'">
            <xsl:apply-templates select="." >
              <xsl:with-param name="InfoRoot">/FileHeader</xsl:with-param>
            </xsl:apply-templates>
          </xsl:when>
          <xsl:when test="name() = 'TREs'">
            <xsl:call-template name="TREs" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name='Field'>
              <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/Header/Field" />
              <xsl:with-param name="InfoRoot">/FileHeader</xsl:with-param>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
    </Group>
  </xsl:template>

  <!-- Image Segments -->
  <xsl:template match="Images">
    <Group>
      <xsl:attribute name="shortName">Images</xsl:attribute>
      <xsl:attribute name="name">Images (<xsl:value-of select="count(Image)" />)</xsl:attribute>
      <xsl:attribute name="icon">ISDImgSegs16</xsl:attribute>
      <xsl:attribute name="total"><xsl:value-of select="count(Image)" /></xsl:attribute>
      <xsl:for-each select="*">
        <Group>
          <xsl:attribute name="shortName"><xsl:value-of select="position()" /></xsl:attribute>
          <xsl:choose>
            <xsl:when test="$FileVersion = '02.10'">
              <xsl:attribute name="name"><xsl:value-of select="normalize-space(ICAT/text())" /> / <xsl:value-of select="normalize-space(IID1/text())" /> / <xsl:value-of select="normalize-space(IID2/text())" /></xsl:attribute>
            </xsl:when>
            <xsl:when test="$FileVersion = '02.00'">
              <xsl:attribute name="name">
                <xsl:value-of select="normalize-space(ICAT/text())" /> / <xsl:value-of select="normalize-space(IID1/text())" /> / <xsl:value-of select="normalize-space(IID2/text())" />
              </xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="name">Image</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:choose>
            <xsl:when test="number(NBANDS/text()) > 1">
              <xsl:attribute name="icon">ISDLevel1MultiBnd16</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="icon">ISDLevel1SingleBnd16</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:attribute name="info">/ImageHeader@Info</xsl:attribute>
          <xsl:for-each select="*">
            <xsl:choose>
              <xsl:when test="name() = 'Security'">
                <xsl:apply-templates select="." >
                  <xsl:with-param name="InfoRoot">/ImageHeader</xsl:with-param>
                </xsl:apply-templates>
              </xsl:when>
              <xsl:when test="name() = 'TREs'">
                <xsl:call-template name="TREs" />
              </xsl:when>
              <xsl:when test="name() = 'Bands'">
                <xsl:apply-templates select="." >
                  <xsl:with-param name="InfoRoot">/ImageHeader</xsl:with-param>
                </xsl:apply-templates>
              </xsl:when>
              <xsl:when test="name() = 'Comments'">
                <xsl:apply-templates select="." />
              </xsl:when>
              <xsl:otherwise>
                <xsl:call-template name='Field'>
                  <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/Image/Field" />
                  <xsl:with-param name="InfoRoot">/ImageHeader</xsl:with-param>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:for-each>
        </Group>
      </xsl:for-each>
    </Group>
  </xsl:template>

  <!-- Text Segments -->
  <xsl:template match="Text">
    <xsl:choose>
      <xsl:when test="count(Text) > 0">
        <Group>
          <xsl:attribute name="shortName">Text</xsl:attribute>
          <xsl:attribute name="name">Text (<xsl:value-of select="count(Text)" />)</xsl:attribute>
          <xsl:attribute name="icon">ISDTextSegs16</xsl:attribute>
          <xsl:attribute name="total"><xsl:value-of select="count(Text)" /></xsl:attribute>
          <xsl:for-each select="*">
            <Group>
              <xsl:attribute name="shortName"><xsl:value-of select="position()" /></xsl:attribute>
              <xsl:attribute name="name"><xsl:value-of select="normalize-space(TXTITL)" /></xsl:attribute>
              <xsl:attribute name="icon">ISDLevel1Text16</xsl:attribute>
              <xsl:for-each select="*">
                <xsl:choose>
                  <xsl:when test="name() = 'Security'">
                    <xsl:apply-templates select="." >
                      <xsl:with-param name="InfoRoot">/TextHeader</xsl:with-param>
                    </xsl:apply-templates>
                  </xsl:when>
                  <xsl:when test="name() = 'TREs'">
                    <xsl:call-template name="TREs" />
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:call-template name='Field'>
                      <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/Text/Field" />
                      <xsl:with-param name="InfoRoot">/TextHeader</xsl:with-param>
                    </xsl:call-template>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:for-each>
            </Group>
          </xsl:for-each>
        </Group>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!-- DE Segments -->
  <xsl:template match="DESs">
    <xsl:choose>
      <xsl:when test="count(DES) > 0">
        <Group>
          <xsl:attribute name="shortName">DES</xsl:attribute>
          <xsl:attribute name="name">DES (<xsl:value-of select="count(DES)" />)</xsl:attribute>
          <xsl:attribute name="total"><xsl:value-of select="count(DES)" /></xsl:attribute>
          <xsl:attribute name="icon">ISDDESSegs16</xsl:attribute>
          <xsl:for-each select="*">
            <xsl:variable name="FName">
              <xsl:choose>
                <xsl:when test="DESTAG/text() = 'CSSHPA DES'">
                  CSSHPA - <xsl:value-of select="UserDefinedSubHeader/SHAPE_USE/text()"/>
                </xsl:when>
                <xsl:when test="DESTAG/text() = 'CSSHPB DES'">
                  CSSHPB - <xsl:value-of select="UserDefinedSubHeader/SHAPE_USE/text()"/>
                </xsl:when>
                <xsl:when test="DESTAG/text() = 'CSSHPB'">
                  CSSHPB - <xsl:value-of select="UserDefinedSubHeader/SHAPE_USE/text()"/>
                </xsl:when>
                <xsl:when test="DESTAG/text() = 'CSATTA DES'">
                  CSATTA - <xsl:value-of select="UserDefinedSubHeader/ATT_TYPE/text()"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="DESTAG"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <xsl:variable name="Tag" select="DESTAG/text()"/>
            <xsl:variable name="FieldDef" select="$FieldTable/NITF/TRE[@name = $FName]"/>

            <Group>
              <xsl:attribute name="name"><xsl:value-of select="normalize-space($FName)" /></xsl:attribute>
              <!--<xsl:attribute name="fullName"><xsl:value-of select="$FieldDef/Name/text()" /></xsl:attribute>-->
              <xsl:attribute name="shortName"><xsl:value-of select="position()" /></xsl:attribute>
              <xsl:attribute name="icon">ISDLevel1DES16</xsl:attribute>
              <xsl:attribute name="info">/<xsl:value-of select="translate(normalize-space($Tag), ' ', '_')" />@Info</xsl:attribute>
              <xsl:for-each select="*">
                <xsl:choose>
                  <xsl:when test="name() = 'Security'">
                    <xsl:apply-templates select="." >
                      <xsl:with-param name="InfoRoot">/DESHeader</xsl:with-param>
                    </xsl:apply-templates>
                  </xsl:when>
                  <xsl:when test="name() = 'TREs'">
                    <xsl:call-template name="TREs" />
                  </xsl:when>
                  <xsl:when test="name() = 'UserDefinedSubHeader'">
                    <!--<Group>-->
                      <!--<xsl:attribute name="name">
                        <xsl:value-of select='name()'/>
                      </xsl:attribute>-->
                      <xsl:for-each select="*">
                        <xsl:call-template name='Field'>
                          <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/TRE/Field" />
                          <xsl:with-param name="InfoRoot">/<xsl:value-of select="translate(normalize-space($Tag), ' ', '_')" /></xsl:with-param>
                        </xsl:call-template>
                      </xsl:for-each>
                    <!--</Group>-->

                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:call-template name='Field'>
                      <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/DES/Field | $FieldDef/Field" />
                      <xsl:with-param name="InfoRoot">/DESHeader</xsl:with-param>
                    </xsl:call-template>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:for-each>
            </Group>
          </xsl:for-each>
        </Group>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!-- Generic Security -->
  <xsl:template match="Security">
    <xsl:param name="InfoRoot"/>

    <Group>
      <xsl:attribute name="name">Security</xsl:attribute>
      <!--<xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>-->
      <xsl:for-each select="*">
        <xsl:call-template name='Field'>
          <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/Security/Field" />
          <xsl:with-param name="InfoRoot" select="$InfoRoot" />
        </xsl:call-template>
      </xsl:for-each>
    </Group>
  </xsl:template>

  <!-- Bands -->
  <xsl:template match="Bands">
    <xsl:param name="InfoRoot"/>

    <Group>
      <xsl:attribute name="name">Bands</xsl:attribute>
      <!--<xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>-->
      <xsl:for-each select="*">
        <Group>
          <xsl:attribute name="name"><xsl:value-of select="position()" /></xsl:attribute>
          <!--<xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>-->
          <xsl:for-each select="*">
            <xsl:call-template name='Field'>
              <xsl:with-param name="FieldRoot" select="$FieldTable/NITF/Band/Field" />
              <xsl:with-param name="InfoRoot" select="$InfoRoot" />
            </xsl:call-template>
          </xsl:for-each>
        </Group>
      </xsl:for-each>
    </Group>
  </xsl:template>

  <!-- Comments -->
  <xsl:template match="Comments">
    <Field>
      <xsl:attribute name="name">Comments</xsl:attribute>
      <xsl:attribute name="info">/ImageHeader/ICOM@Info</xsl:attribute>
      <!--<xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>-->
      <xsl:for-each select="*">
        <xsl:if test="position() > 1">
          <xsl:text>&#xD;</xsl:text>
        </xsl:if>
        <xsl:value-of select="."/>
      </xsl:for-each>
    </Field>
  </xsl:template>

  <!-- TREs -->
  <xsl:template name="TREs">
    <xsl:choose>
      <xsl:when test="count(*) > 0">
        <Group>
          <xsl:attribute name="shortName">TREs</xsl:attribute>
          <xsl:attribute name="name">TREs</xsl:attribute>
          <xsl:for-each select="*">
            <xsl:call-template name='TRE' />
          </xsl:for-each>
        </Group>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!-- TRE -->
  <xsl:template name="TRE">
    <xsl:variable name="FName">
      <xsl:choose>
        <xsl:when test="boolean(_isRaw/text())">RAW_TRE</xsl:when>
        <xsl:otherwise><xsl:value-of select="name()"/></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="InfoRoot">/<xsl:value-of select="$FName"/></xsl:variable>
    <xsl:variable name="FieldDef" select="$FieldTable/NITF/TRE[@name = $FName]"/>

    <!-- Full Name -->
    <!--
    <xsl:variable name="FieldDesc">
      <xsl:choose>
        <xsl:when test="$FieldDef/Name/text()">
          <xsl:value-of select="$FieldDef/Name/text()" />
        </xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    -->
    <xsl:choose>
      <xsl:when test="*[name() = $FName]">
        <xsl:for-each select="*">
          <xsl:call-template name='TRE' />
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <Group>
          <xsl:attribute name="name"><xsl:value-of select='_treID/text()'/></xsl:attribute>
          <!--<xsl:attribute name="fullName"><xsl:value-of select="$FieldDesc" /></xsl:attribute>-->
          <xsl:attribute name="icon">ISDLevel2NoEditTRE16</xsl:attribute>
          <xsl:attribute name="info"><xsl:value-of select="$InfoRoot"/>@Info</xsl:attribute>      
          <xsl:for-each select="*">
            <xsl:call-template name='Field'>
              <xsl:with-param name="FieldRoot" select="$FieldDef/Field" />
              <xsl:with-param name="InfoRoot" select="$InfoRoot"/>
            </xsl:call-template>
          </xsl:for-each>
        </Group>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Field -->
  <xsl:template name="Field">
    <xsl:param name="FieldRoot"/>
    <xsl:param name="InfoRoot"/>

    <xsl:variable name="FName"><xsl:value-of select="name()"/></xsl:variable>
    <xsl:variable name="FieldDef" select="$FieldRoot[@name = $FName]"/>
    
    <xsl:choose>
      <xsl:when test="name() = '_treID'">
      </xsl:when>
      <xsl:when test="count(*)">
        <Group>
          <xsl:attribute name="name"><xsl:value-of select='name()'/></xsl:attribute>
          <xsl:if test="not(boolean($FieldDef/@info))">
            <xsl:attribute name="info"><xsl:value-of select="$InfoRoot" />/<xsl:value-of select="name()"/>@Info</xsl:attribute>
          </xsl:if>
          <xsl:for-each select="*">
            <xsl:call-template name='Field'>
              <xsl:with-param name="FieldRoot" select="$FieldRoot" />
              <xsl:with-param name="InfoRoot" select="$InfoRoot" />
            </xsl:call-template>
          </xsl:for-each>
        </Group>
      </xsl:when>
      <xsl:otherwise>

        <!-- Full Name -->
        <!--
        <xsl:variable name="FieldDesc">
          <xsl:choose>
            <xsl:when test="$FieldDef/Name/text()">
              <xsl:value-of select="$FieldDef/Name/text()" />
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        -->
        
        <!-- Field Name -->
        <xsl:variable name="FieldName">
          <xsl:choose>
            <xsl:when test="$FieldDef/FieldName/text()">
              <xsl:value-of select="$FieldDef/FieldName/text()" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="name()" />
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        
        <!-- Type -->
        <xsl:variable name="FieldType">
          <xsl:choose>
            <xsl:when test="$FieldDef/@format">
              <xsl:value-of select="$FieldDef/@format" />
            </xsl:when>
            <xsl:otherwise>string</xsl:otherwise>
          </xsl:choose>
        </xsl:variable>

        <xsl:if test="not(boolean($FieldDef/@hidden))">
          <Field>
            <xsl:attribute name="name"><xsl:value-of select="$FieldName" /></xsl:attribute>
            <!--<xsl:attribute name="fullName"><xsl:value-of select="$FieldDesc" /></xsl:attribute>-->
            <!--<xsl:attribute name="size"><xsl:value-of select="$FieldDef/@size" /></xsl:attribute>-->
            <xsl:attribute name="type"><xsl:value-of select="$FieldType" /></xsl:attribute>
            <xsl:if test="not(boolean($FieldDef/@info)) and ($FName != 'Value')">
              <xsl:attribute name="info"><xsl:value-of select="$InfoRoot" />/<xsl:value-of select="$FieldName"/>@Info</xsl:attribute>
            </xsl:if>

            <xsl:value-of select="."/>
          </Field>
        </xsl:if>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:transform>
