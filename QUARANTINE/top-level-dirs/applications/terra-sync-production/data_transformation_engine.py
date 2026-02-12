import re
import json
import pandas as pd
import numpy as np
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Callable, Optional, Union
import phonenumbers
from phonenumbers import NumberParseException
import usaddress
from geopy.geocoders import Nominatim
import logging

class DataTransformationRule:
    def __init__(self, name: str, field: str, transformation: Callable, 
                 validation: Callable = None, required: bool = False):
        self.name = name
        self.field = field
        self.transformation = transformation
        self.validation = validation
        self.required = required

class DataQualityIssue:
    def __init__(self, row_id: Any, field: str, issue_type: str, 
                 original_value: Any, suggested_fix: Any = None):
        self.row_id = row_id
        self.field = field
        self.issue_type = issue_type
        self.original_value = original_value
        self.suggested_fix = suggested_fix
        self.timestamp = datetime.now()

class PACSDataTransformer:
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.geocoder = Nominatim(user_agent="terrafusion_pacs_converter")
        self.quality_issues = []
        self.transformation_stats = {}
        
        self.standard_transformations = {
            'parcel_id': self._standardize_parcel_id,
            'ssn': self._standardize_ssn,
            'phone': self._standardize_phone,
            'address': self._standardize_address,
            'name': self._standardize_name,
            'date': self._standardize_date,
            'currency': self._standardize_currency,
            'assessment_value': self._standardize_assessment_value,
            'tax_amount': self._standardize_tax_amount,
            'exemption_code': self._standardize_exemption_code,
            'owner_type': self._standardize_owner_type,
            'property_type': self._standardize_property_type,
            'email': self._standardize_email,
            'zip_code': self._standardize_zip_code,
            'state_code': self._standardize_state_code
        }
    
    def _standardize_parcel_id(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        parcel_str = str(value).strip().upper()
        parcel_str = re.sub(r'[^A-Z0-9]', '', parcel_str)
        
        if len(parcel_str) < 6:
            self.quality_issues.append(DataQualityIssue(
                None, 'parcel_id', 'SHORT_PARCEL_ID', value, parcel_str
            ))
        
        return parcel_str if parcel_str else None
    
    def _standardize_ssn(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        ssn_str = re.sub(r'[^0-9]', '', str(value))
        
        if len(ssn_str) == 9:
            return f"{ssn_str[:3]}-{ssn_str[3:5]}-{ssn_str[5:]}"
        elif len(ssn_str) == 4:
            return f"***-**-{ssn_str}"
        else:
            self.quality_issues.append(DataQualityIssue(
                None, 'ssn', 'INVALID_SSN_FORMAT', value, None
            ))
            return None
    
    def _standardize_phone(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        try:
            phone_number = phonenumbers.parse(str(value), "US")
            if phonenumbers.is_valid_number(phone_number):
                return phonenumbers.format_number(phone_number, phonenumbers.PhoneNumberFormat.NATIONAL)
            else:
                self.quality_issues.append(DataQualityIssue(
                    None, 'phone', 'INVALID_PHONE_NUMBER', value, None
                ))
                return None
        except NumberParseException:
            cleaned = re.sub(r'[^0-9]', '', str(value))
            if len(cleaned) == 10:
                return f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"
            else:
                self.quality_issues.append(DataQualityIssue(
                    None, 'phone', 'UNPARSEABLE_PHONE', value, None
                ))
                return None
    
    def _standardize_address(self, value: Any) -> Dict[str, str]:
        if pd.isna(value) or value == '':
            return None
        
        try:
            parsed_address = usaddress.tag(str(value))
            
            standardized = {
                'street_number': parsed_address[0].get('AddressNumber', ''),
                'street_name': f"{parsed_address[0].get('StreetName', '')} {parsed_address[0].get('StreetNamePostType', '')}".strip(),
                'unit': parsed_address[0].get('OccupancyIdentifier', ''),
                'city': parsed_address[0].get('PlaceName', ''),
                'state': parsed_address[0].get('StateName', ''),
                'zip_code': parsed_address[0].get('ZipCode', ''),
                'full_address': str(value).title()
            }
            
            if not standardized['street_number'] or not standardized['street_name']:
                self.quality_issues.append(DataQualityIssue(
                    None, 'address', 'INCOMPLETE_ADDRESS', value, standardized
                ))
            
            return standardized
            
        except Exception as e:
            self.quality_issues.append(DataQualityIssue(
                None, 'address', 'ADDRESS_PARSE_ERROR', value, str(e)
            ))
            return {'full_address': str(value), 'parse_error': True}
    
    def _standardize_name(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        name_str = str(value).strip()
        
        name_str = re.sub(r'\s+', ' ', name_str)
        name_str = name_str.title()
        
        common_prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Rev.']
        common_suffixes = ['Jr.', 'Sr.', 'III', 'IV', 'Ph.D.', 'M.D.', 'Esq.']
        
        for prefix in common_prefixes:
            name_str = name_str.replace(prefix.lower(), prefix)
        for suffix in common_suffixes:
            name_str = name_str.replace(suffix.lower(), suffix)
        
        if len(name_str) < 2:
            self.quality_issues.append(DataQualityIssue(
                None, 'name', 'SHORT_NAME', value, name_str
            ))
        
        return name_str
    
    def _standardize_date(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        date_formats = [
            '%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d',
            '%m/%d/%y', '%m-%d-%y', '%y/%m/%d', '%y-%m-%d',
            '%B %d, %Y', '%b %d, %Y', '%d-%b-%Y', '%d-%B-%Y'
        ]
        
        value_str = str(value).strip()
        
        for date_format in date_formats:
            try:
                parsed_date = datetime.strptime(value_str, date_format)
                if parsed_date.year < 1900 or parsed_date.year > 2100:
                    self.quality_issues.append(DataQualityIssue(
                        None, 'date', 'SUSPICIOUS_DATE_YEAR', value, parsed_date.strftime('%Y-%m-%d')
                    ))
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        try:
            if value_str.isdigit() and len(value_str) == 8:
                year = int(value_str[:4])
                month = int(value_str[4:6])
                day = int(value_str[6:8])
                parsed_date = date(year, month, day)
                return parsed_date.strftime('%Y-%m-%d')
        except ValueError:
            pass
        
        self.quality_issues.append(DataQualityIssue(
            None, 'date', 'UNPARSEABLE_DATE', value, None
        ))
        return None
    
    def _standardize_currency(self, value: Any) -> Decimal:
        if pd.isna(value) or value == '':
            return None
        
        if isinstance(value, (int, float, Decimal)):
            return Decimal(str(value)).quantize(Decimal('0.01'))
        
        currency_str = str(value).strip()
        currency_str = re.sub(r'[$,\s]', '', currency_str)
        currency_str = re.sub(r'[^\d.-]', '', currency_str)
        
        try:
            amount = Decimal(currency_str).quantize(Decimal('0.01'))
            if amount < 0:
                self.quality_issues.append(DataQualityIssue(
                    None, 'currency', 'NEGATIVE_AMOUNT', value, amount
                ))
            return amount
        except (InvalidOperation, ValueError):
            self.quality_issues.append(DataQualityIssue(
                None, 'currency', 'INVALID_CURRENCY_FORMAT', value, None
            ))
            return None
    
    def _standardize_assessment_value(self, value: Any) -> Decimal:
        standardized = self._standardize_currency(value)
        if standardized and standardized > 10000000:
            self.quality_issues.append(DataQualityIssue(
                None, 'assessment_value', 'UNUSUALLY_HIGH_ASSESSMENT', value, standardized
            ))
        return standardized
    
    def _standardize_tax_amount(self, value: Any) -> Decimal:
        return self._standardize_currency(value)
    
    def _standardize_exemption_code(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        code_mapping = {
            'SENIOR': 'SC',
            'SENIOR CITIZEN': 'SC',
            'SENIOR CITIZENS': 'SC',
            'DISABLED': 'DV',
            'VETERAN': 'VT',
            'DISABLED VETERAN': 'DV',
            'NONPROFIT': 'NP',
            'NON-PROFIT': 'NP',
            'RELIGIOUS': 'RE',
            'CHURCH': 'RE',
            'HOMESTEAD': 'HS',
            'AGRICULTURAL': 'AG',
            'FOREST': 'FO',
            'HISTORIC': 'HI'
        }
        
        code_str = str(value).strip().upper()
        
        if code_str in code_mapping:
            return code_mapping[code_str]
        elif len(code_str) <= 3 and code_str.isalpha():
            return code_str
        else:
            self.quality_issues.append(DataQualityIssue(
                None, 'exemption_code', 'UNKNOWN_EXEMPTION_CODE', value, code_str
            ))
            return code_str
    
    def _standardize_owner_type(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return 'INDIVIDUAL'
        
        type_mapping = {
            'IND': 'INDIVIDUAL',
            'INDIVIDUAL': 'INDIVIDUAL',
            'PERSON': 'INDIVIDUAL',
            'CORP': 'CORPORATION',
            'CORPORATION': 'CORPORATION',
            'LLC': 'LLC',
            'LP': 'LIMITED_PARTNERSHIP',
            'LLP': 'LIMITED_LIABILITY_PARTNERSHIP',
            'TRUST': 'TRUST',
            'GOVERNMENT': 'GOVERNMENT',
            'GOV': 'GOVERNMENT',
            'NONPROFIT': 'NONPROFIT',
            'NON-PROFIT': 'NONPROFIT'
        }
        
        type_str = str(value).strip().upper()
        return type_mapping.get(type_str, type_str)
    
    def _standardize_property_type(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return 'UNKNOWN'
        
        type_mapping = {
            'RES': 'RESIDENTIAL',
            'RESIDENTIAL': 'RESIDENTIAL',
            'COM': 'COMMERCIAL',
            'COMMERCIAL': 'COMMERCIAL',
            'IND': 'INDUSTRIAL',
            'INDUSTRIAL': 'INDUSTRIAL',
            'AG': 'AGRICULTURAL',
            'AGRICULTURAL': 'AGRICULTURAL',
            'VAC': 'VACANT',
            'VACANT': 'VACANT',
            'EXEMPT': 'EXEMPT'
        }
        
        type_str = str(value).strip().upper()
        return type_mapping.get(type_str, type_str)
    
    def _standardize_email(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        email_str = str(value).strip().lower()
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if re.match(email_pattern, email_str):
            return email_str
        else:
            self.quality_issues.append(DataQualityIssue(
                None, 'email', 'INVALID_EMAIL_FORMAT', value, None
            ))
            return None
    
    def _standardize_zip_code(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        zip_str = re.sub(r'[^0-9-]', '', str(value))
        
        if len(zip_str) == 5:
            return zip_str
        elif len(zip_str) == 9:
            return f"{zip_str[:5]}-{zip_str[5:]}"
        elif len(zip_str) == 10 and '-' in zip_str:
            return zip_str
        else:
            self.quality_issues.append(DataQualityIssue(
                None, 'zip_code', 'INVALID_ZIP_FORMAT', value, zip_str
            ))
            return zip_str if zip_str else None
    
    def _standardize_state_code(self, value: Any) -> str:
        if pd.isna(value) or value == '':
            return None
        
        state_mapping = {
            'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
            'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
            'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
            'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
            'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
            'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
            'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
            'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
            'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
            'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
            'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
            'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
            'WISCONSIN': 'WI', 'WYOMING': 'WY'
        }
        
        state_str = str(value).strip().upper()
        
        if len(state_str) == 2 and state_str in state_mapping.values():
            return state_str
        elif state_str in state_mapping:
            return state_mapping[state_str]
        else:
            self.quality_issues.append(DataQualityIssue(
                None, 'state_code', 'UNKNOWN_STATE', value, state_str
            ))
            return state_str
    
    def transform_dataframe(self, df: pd.DataFrame, 
                          field_mappings: Dict[str, str]) -> pd.DataFrame:
        
        transformed_df = df.copy()
        self.quality_issues = []
        self.transformation_stats = {}
        
        for source_field, target_field in field_mappings.items():
            if source_field not in df.columns:
                self.logger.warning(f"Source field {source_field} not found in dataframe")
                continue
            
            transformation_type = self._detect_transformation_type(target_field)
            if transformation_type in self.standard_transformations:
                transformer = self.standard_transformations[transformation_type]
                
                original_null_count = df[source_field].isnull().sum()
                
                try:
                    transformed_df[target_field] = df[source_field].apply(transformer)
                    
                    new_null_count = transformed_df[target_field].isnull().sum()
                    transformation_rate = (len(df) - new_null_count) / len(df) * 100
                    
                    self.transformation_stats[target_field] = {
                        'original_nulls': int(original_null_count),
                        'new_nulls': int(new_null_count),
                        'transformation_rate': round(transformation_rate, 2),
                        'quality_issues': len([qi for qi in self.quality_issues if qi.field == target_field])
                    }
                    
                except Exception as e:
                    self.logger.error(f"Transformation failed for {target_field}: {e}")
                    transformed_df[target_field] = df[source_field]
            else:
                transformed_df[target_field] = df[source_field]
        
        return transformed_df
    
    def _detect_transformation_type(self, field_name: str) -> str:
        field_lower = field_name.lower()
        
        if 'parcel' in field_lower and 'id' in field_lower:
            return 'parcel_id'
        elif 'ssn' in field_lower or 'social' in field_lower:
            return 'ssn'
        elif 'phone' in field_lower or 'telephone' in field_lower:
            return 'phone'
        elif 'address' in field_lower or 'street' in field_lower:
            return 'address'
        elif 'name' in field_lower and 'owner' in field_lower:
            return 'name'
        elif 'date' in field_lower or field_lower.endswith('_dt'):
            return 'date'
        elif 'value' in field_lower or 'amount' in field_lower or 'price' in field_lower:
            if 'assess' in field_lower:
                return 'assessment_value'
            elif 'tax' in field_lower:
                return 'tax_amount'
            else:
                return 'currency'
        elif 'exemption' in field_lower and 'code' in field_lower:
            return 'exemption_code'
        elif 'owner' in field_lower and 'type' in field_lower:
            return 'owner_type'
        elif 'property' in field_lower and 'type' in field_lower:
            return 'property_type'
        elif 'email' in field_lower:
            return 'email'
        elif 'zip' in field_lower or 'postal' in field_lower:
            return 'zip_code'
        elif 'state' in field_lower and len(field_lower) < 10:
            return 'state_code'
        else:
            return 'unknown'
    
    def validate_transformed_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        validation_results = {
            'total_rows': len(df),
            'field_validation': {},
            'critical_issues': [],
            'warnings': [],
            'data_quality_score': 0
        }
        
        critical_fields = ['parcel_id', 'owner_name', 'property_address']
        warning_threshold = 0.1
        
        for column in df.columns:
            null_count = df[column].isnull().sum()
            null_percentage = null_count / len(df)
            
            field_validation = {
                'null_count': int(null_count),
                'null_percentage': round(null_percentage * 100, 2),
                'unique_values': int(df[column].nunique()),
                'completeness_score': round((1 - null_percentage) * 100, 2)
            }
            
            if column in critical_fields and null_percentage > warning_threshold:
                validation_results['critical_issues'].append(
                    f"Critical field {column} has {null_percentage:.1%} null values"
                )
            elif null_percentage > 0.5:
                validation_results['warnings'].append(
                    f"Field {column} has {null_percentage:.1%} null values"
                )
            
            validation_results['field_validation'][column] = field_validation
        
        overall_completeness = sum(
            fv['completeness_score'] for fv in validation_results['field_validation'].values()
        ) / len(validation_results['field_validation'])
        
        quality_issues_penalty = min(len(self.quality_issues) * 2, 20)
        validation_results['data_quality_score'] = max(0, overall_completeness - quality_issues_penalty)
        
        return validation_results
    
    def generate_transformation_report(self) -> Dict[str, Any]:
        return {
            'transformation_timestamp': datetime.now().isoformat(),
            'transformation_statistics': self.transformation_stats,
            'quality_issues': [
                {
                    'field': qi.field,
                    'issue_type': qi.issue_type,
                    'original_value': str(qi.original_value),
                    'suggested_fix': str(qi.suggested_fix) if qi.suggested_fix else None,
                    'timestamp': qi.timestamp.isoformat()
                }
                for qi in self.quality_issues
            ],
            'issue_summary': self._summarize_quality_issues(),
            'recommendations': self._generate_recommendations()
        }
    
    def _summarize_quality_issues(self) -> Dict[str, int]:
        issue_summary = {}
        for qi in self.quality_issues:
            issue_summary[qi.issue_type] = issue_summary.get(qi.issue_type, 0) + 1
        return issue_summary
    
    def _generate_recommendations(self) -> List[str]:
        recommendations = []
        
        issue_counts = self._summarize_quality_issues()
        
        if issue_counts.get('INVALID_PHONE_NUMBER', 0) > 10:
            recommendations.append("Consider implementing phone number validation at data entry")
        
        if issue_counts.get('UNPARSEABLE_DATE', 0) > 5:
            recommendations.append("Standardize date formats in source system")
        
        if issue_counts.get('INVALID_EMAIL_FORMAT', 0) > 0:
            recommendations.append("Implement email validation in data collection")
        
        if issue_counts.get('SHORT_PARCEL_ID', 0) > 0:
            recommendations.append("Review parcel ID format standards")
        
        high_value_assessments = issue_counts.get('UNUSUALLY_HIGH_ASSESSMENT', 0)
        if high_value_assessments > 0:
            recommendations.append(f"Review {high_value_assessments} unusually high assessment values")
        
        return recommendations

class PACSDataValidator:
    
    def __init__(self):
        self.validation_rules = {
            'parcel_id': [
                lambda x: x is not None and len(str(x)) >= 6,
                lambda x: str(x).replace('-', '').replace(' ', '').isalnum()
            ],
            'assessment_value': [
                lambda x: x is None or (isinstance(x, (int, float, Decimal)) and x >= 0),
                lambda x: x is None or x < 50000000
            ],
            'tax_amount': [
                lambda x: x is None or (isinstance(x, (int, float, Decimal)) and x >= 0)
            ],
            'owner_name': [
                lambda x: x is not None and len(str(x).strip()) >= 2
            ],
            'property_address': [
                lambda x: x is not None and len(str(x).strip()) >= 10
            ]
        }
    
    def validate_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        validation_result = {
            'valid': True,
            'field_results': {},
            'errors': [],
            'warnings': []
        }
        
        for field, rules in self.validation_rules.items():
            if field in record:
                field_valid = True
                field_errors = []
                
                for rule in rules:
                    try:
                        if not rule(record[field]):
                            field_valid = False
                            field_errors.append(f"Validation rule failed for {field}")
                    except Exception as e:
                        field_valid = False
                        field_errors.append(f"Validation error for {field}: {str(e)}")
                
                validation_result['field_results'][field] = {
                    'valid': field_valid,
                    'errors': field_errors
                }
                
                if not field_valid:
                    validation_result['valid'] = False
                    validation_result['errors'].extend(field_errors)
        
        return validation_result
    
    def validate_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        total_records = len(df)
        valid_records = 0
        field_error_counts = {}
        
        for index, row in df.iterrows():
            record_validation = self.validate_record(row.to_dict())
            if record_validation['valid']:
                valid_records += 1
            
            for field, result in record_validation['field_results'].items():
                if not result['valid']:
                    field_error_counts[field] = field_error_counts.get(field, 0) + 1
        
        validation_summary = {
            'total_records': total_records,
            'valid_records': valid_records,
            'invalid_records': total_records - valid_records,
            'validity_rate': round(valid_records / total_records * 100, 2) if total_records > 0 else 0,
            'field_error_counts': field_error_counts,
            'recommendations': []
        }
        
        if validation_summary['validity_rate'] < 95:
            validation_summary['recommendations'].append(
                "Data quality is below acceptable threshold (95%). Consider additional cleanup."
            )
        
        for field, error_count in field_error_counts.items():
            if error_count > total_records * 0.1:
                validation_summary['recommendations'].append(
                    f"Field {field} has high error rate ({error_count}/{total_records} records)"
                )
        
        return validation_summary

def create_pacs_field_mapping_template():
    """Creates a comprehensive field mapping template for PACS systems"""
    
    field_mapping_template = {
        "assessment_data": {
            "source_fields": {
                "PARCEL_NO": "parcel_id",
                "OWNER_NAME": "owner_name", 
                "OWNER_ADDR": "owner_address",
                "PROP_ADDR": "property_address",
                "ASSESS_VAL": "assessment_value",
                "ASSESS_DATE": "assessment_date",
                "LAND_VAL": "land_value",
                "IMPR_VAL": "improvement_value",
                "PROP_TYPE": "property_type",
                "ACRES": "acreage",
                "SQ_FEET": "square_footage",
                "YEAR_BUILT": "year_built",
                "BEDROOMS": "bedrooms",
                "BATHROOMS": "bathrooms"
            }
        },
        "ownership_data": {
            "source_fields": {
                "PARCEL_ID": "parcel_id",
                "OWNER_1": "primary_owner_name",
                "OWNER_2": "secondary_owner_name",
                "MAIL_ADDR": "mailing_address",
                "MAIL_CITY": "mailing_city",
                "MAIL_STATE": "mailing_state",
                "MAIL_ZIP": "mailing_zip_code",
                "OWNER_TYPE": "owner_type",
                "CORP_NAME": "corporation_name",
                "SSN": "ssn",
                "PHONE": "phone_number",
                "EMAIL": "email_address"
            }
        },
        "exemption_data": {
            "source_fields": {
                "PARCEL_ID": "parcel_id",
                "EXEMPT_CD": "exemption_code",
                "EXEMPT_AMT": "exemption_amount",
                "EXEMPT_PCT": "exemption_percentage",
                "EXEMPT_DESC": "exemption_description",
                "START_DATE": "exemption_start_date",
                "END_DATE": "exemption_end_date",
                "APP_DATE": "application_date",
                "APPROVED_BY": "approved_by"
            }
        },
        "tax_data": {
            "source_fields": {
                "PARCEL_ID": "parcel_id",
                "TAX_YEAR": "tax_year",
                "GROSS_TAX": "gross_tax_amount",
                "NET_TAX": "net_tax_amount",
                "PAID_AMT": "paid_amount",
                "BALANCE": "balance_due",
                "DUE_DATE": "due_date",
                "PAID_DATE": "paid_date",
                "PENALTY": "penalty_amount",
                "INTEREST": "interest_amount"
            }
        }
    }
    
    with open('pacs_field_mapping_template.json', 'w') as f:
        json.dump(field_mapping_template, f, indent=2)
    
    return field_mapping_template

if __name__ == "__main__":
    create_pacs_field_mapping_template()
    
    transformer = PACSDataTransformer()
    validator = PACSDataValidator()
    
    print("PACS Data Transformation Engine initialized")
    print("Field mapping template created: pacs_field_mapping_template.json")