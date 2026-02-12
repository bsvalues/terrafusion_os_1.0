-- Global variable FeatureCatalog is initialized in the Host
FeatureCatalog = HostInitializeFeatureCatalog()

local readonly = 
{
    __newindex = function(table, key, value)
        error("Table is readonly!", 2)
    end
}

setmetatable(FeatureCatalog, readonly)

local Utils = require('Utils')

function TestFeatureCatalog()
    function TestFeatureTypes()
        for code, ft in pairs(FeatureCatalog.FeatureTypes) do
            print(code)
            for ref,attrBinding in pairs(ft.AttributeBindings) do
                local mult = '{'..attrBinding.LowerMultiplicity..','..attrBinding.UpperMultiplicity..'}'
                print('',ref, mult)
                for _,permittedVal in ipairs(attrBinding.PermittedValues) do
                    print('', '', permittedVal)
                end
            end
        end
    end

    function TestInformationTypes()
        for code, it in pairs(FeatureCatalog.InformationTypes) do
            print(code)
            for ref,attrBinding in pairs(it.AttributeBindings) do
                local mult = '{'..attrBinding.LowerMultiplicity..','..attrBinding.UpperMultiplicity..'}'
                print('',ref, mult)
                for _,permittedVal in ipairs(attrBinding.PermittedValues) do
                    print('', '', permittedVal)
                end
            end
        end
    end

    function TestComplexAttributes()
        for code, ca in pairs(FeatureCatalog.ComplexAttributes) do
            print('ComplexAttribute: '..code)
            for ref,attrBinding in pairs(ca.AttributeBindings) do
                local mult = '{'..attrBinding.LowerMultiplicity..','..attrBinding.UpperMultiplicity..'}'

                if FeatureCatalog.SimpleAttributes[ref] ~= nil then
                    local sa = FeatureCatalog.SimpleAttributes[ref]
                    print('', '', ref, mult, 'valueType: ', sa.ValueType)
                    for attrcode,attrlabel in pairs(sa.EnumValues) do
                       print('', '', '', attrcode..'. '..attrlabel)
                    end
                else
                    print('',ref, mult)
                end

                for _,permittedVal in ipairs(attrBinding.PermittedValues) do
                    print('', '', '', 'permitted code: ', permittedVal)
                end
            end
        end
    end

    function TestSimpleAttributes()
        local test = 1
    end

    -- TestFeatureTypes()
    -- TestComplexAttributes()

    -- test re-initialization (should returen the same instance)
    local a = HostInitializeFeatureCatalog()

    TestFeatureTypes()
    TestInformationTypes()
end