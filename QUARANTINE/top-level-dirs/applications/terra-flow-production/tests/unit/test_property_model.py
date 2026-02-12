"""
Unit tests for the Property model.
"""
import pytest
import uuid
import datetime
from decimal import Decimal

from models import Property, Assessment, TaxRecord


@pytest.mark.unit
class TestPropertyModel:
    """Test cases for the Property model."""
    
    def test_property_creation(self, db_session):
        """Test that a property can be created with valid data."""
        # Arrange
        property_id = uuid.uuid4()
        property_data = {
            "id": property_id,
            "parcel_id": f"TEST-PARCEL-{property_id.hex[:8]}",
            "address": "456 Test Avenue",
            "city": "Richland",
            "state": "WA",
            "zip_code": "99352",
            "property_type": "residential",
            "lot_size": 7500.0,
            "year_built": 1995,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "total_area": 2800.0,
            "owner_name": "Test Owner 2",
            "owner_address": "456 Test Avenue, Richland, WA 99352",
            "purchase_date": datetime.date(2015, 3, 20),
            "purchase_price": 425000.0,
            "features": {
                "garage": True,
                "pool": True,
                "fireplace": False,
                "basement": True
            },
            "location": {
                "type": "Point",
                "coordinates": [-119.2818, 46.2853]
            }
        }
        
        # Act
        property_obj = Property(**property_data)
        db_session.add(property_obj)
        db_session.commit()
        
        # Assert
        saved_property = Property.query.get(property_id)
        assert saved_property is not None
        assert saved_property.parcel_id == property_data["parcel_id"]
        assert saved_property.address == property_data["address"]
        assert saved_property.city == property_data["city"]
        assert saved_property.property_type == property_data["property_type"]
        assert saved_property.lot_size == property_data["lot_size"]
        assert saved_property.year_built == property_data["year_built"]
        assert saved_property.bedrooms == property_data["bedrooms"]
        assert saved_property.features == property_data["features"]
        assert saved_property.location == property_data["location"]
    
    def test_property_unique_parcel_id(self, db_session):
        """Test that properties must have unique parcel IDs."""
        # Arrange
        parcel_id = f"TEST-PARCEL-{uuid.uuid4().hex[:8]}"
        
        # Create first property
        property1 = Property(
            id=uuid.uuid4(),
            parcel_id=parcel_id,
            address="789 Test Street",
            city="Kennewick",
            state="WA",
            zip_code="99336",
            property_type="residential"
        )
        db_session.add(property1)
        db_session.commit()
        
        # Create second property with same parcel_id
        property2 = Property(
            id=uuid.uuid4(),
            parcel_id=parcel_id,
            address="Another Address",
            city="Kennewick",
            state="WA",
            zip_code="99336",
            property_type="residential"
        )
        db_session.add(property2)
        
        # Act & Assert
        with pytest.raises(Exception):  # SQLAlchemy will raise an IntegrityError
            db_session.commit()
    
    def test_property_relationships(self, db_session, test_property, admin_user):
        """Test property relationships with assessments and tax records."""
        # Arrange
        property_obj, _ = test_property
        
        # Create assessment
        assessment = Assessment(
            property_id=property_obj.id,
            assessment_date=datetime.date.today(),
            assessor_id=admin_user.id,
            land_value=100000.0,
            improvement_value=200000.0,
            total_value=300000.0,
            valuation_method="market",
            status="complete"
        )
        
        # Create tax record
        tax_record = TaxRecord(
            property_id=property_obj.id,
            tax_year=datetime.date.today().year,
            land_value=100000.0,
            improvement_value=200000.0,
            total_value=300000.0,
            tax_amount=3500.0,
            tax_rate=0.0117,
            status="paid"
        )
        
        db_session.add(assessment)
        db_session.add(tax_record)
        db_session.commit()
        
        # Act
        refreshed_property = Property.query.get(property_obj.id)
        
        # Assert
        assert refreshed_property.assessments.count() == 1
        assert refreshed_property.tax_records.count() == 1
        
        # Check assessment
        db_assessment = refreshed_property.assessments.first()
        assert db_assessment.property_id == property_obj.id
        assert db_assessment.land_value == 100000.0
        assert db_assessment.improvement_value == 200000.0
        assert db_assessment.total_value == 300000.0
        
        # Check tax record
        db_tax_record = refreshed_property.tax_records.first()
        assert db_tax_record.property_id == property_obj.id
        assert db_tax_record.tax_year == datetime.date.today().year
        assert db_tax_record.land_value == 100000.0
        assert db_tax_record.tax_amount == 3500.0