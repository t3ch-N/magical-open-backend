"""
Test suite for Public Accreditation Application Pages (Phase 2)
Tests the public-facing application forms for vendors, media, pro-am, procurement, and jobs modules.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicModulesAPI:
    """Tests for GET /api/accreditation/modules/public endpoint"""
    
    def test_public_modules_returns_active_modules(self):
        """Verify public modules endpoint returns only active modules"""
        response = requests.get(f"{BASE_URL}/api/accreditation/modules/public")
        assert response.status_code == 200
        
        modules = response.json()
        assert isinstance(modules, list)
        assert len(modules) >= 5  # vendors, media, pro-am, procurement, jobs
        
        # Verify all returned modules are active and public
        for module in modules:
            assert module.get("is_active") == True
            assert module.get("is_public") == True
            assert "slug" in module
            assert "module_type" in module
    
    def test_public_modules_contains_required_slugs(self):
        """Verify all required module slugs are present"""
        response = requests.get(f"{BASE_URL}/api/accreditation/modules/public")
        assert response.status_code == 200
        
        modules = response.json()
        slugs = [m["slug"] for m in modules]
        
        required_slugs = ["vendors", "media", "pro-am", "procurement", "jobs"]
        for slug in required_slugs:
            assert slug in slugs, f"Missing required module slug: {slug}"


class TestVendorSubmission:
    """Tests for vendor accreditation submission"""
    
    def test_vendor_submission_success(self):
        """Test successful vendor application submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "form_data": {
                "company_name": f"TEST_Vendor_{unique_id}",
                "business_type": "Food & Beverage",
                "contact_person": "Test Contact",
                "contact_title": "Manager",
                "email": f"test_vendor_{unique_id}@example.com",
                "phone": "+254712345678",
                "physical_address": "123 Test Street, Nairobi",
                "kra_pin": f"A{unique_id}B",
                "business_registration": f"BRN{unique_id}",
                "years_in_business": 5,
                "products_services": "Catering services for events",
                "staff_count": 10,
                "insurance_coverage": "Yes"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/vendors",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert "Vendor Accreditation" in data.get("message", "")


class TestMediaSubmission:
    """Tests for media accreditation submission"""
    
    def test_media_submission_success(self):
        """Test successful media application submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "form_data": {
                "full_name": f"TEST_Media_{unique_id}",
                "media_type": "Print Journalist",
                "organization": "Test News Agency",
                "job_title": "Senior Reporter",
                "email": f"test_media_{unique_id}@example.com",
                "phone": "+254712345679",
                "nationality": "Kenyan",
                "passport_id": f"P{unique_id}",
                "organization_address": "456 Media Street, Nairobi",
                "coverage_plan": "Full tournament coverage for print media",
                "accreditation_days": "All Days (Thu-Sun)",
                "requires_parking": "Yes"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/media",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert "Media Accreditation" in data.get("message", "")


class TestProAmSubmission:
    """Tests for Pro-Am registration submission"""
    
    def test_proam_submission_success(self):
        """Test successful Pro-Am registration submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "form_data": {
                "full_name": f"TEST_ProAm_{unique_id}",
                "email": f"test_proam_{unique_id}@example.com",
                "phone": "+254712345680",
                "nationality": "Kenyan",
                "passport_id": f"PA{unique_id}",
                "handicap": 12,
                "home_club": "Karen Country Club",
                "handicap_certificate": "Yes",
                "playing_experience": 10,
                "preferred_date": "Wednesday (Main Pro-Am)",
                "shirt_size": "L",
                "emergency_contact": "Emergency Contact",
                "emergency_phone": "+254712345681"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/pro-am",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert "Pro-Am Registration" in data.get("message", "")


class TestProcurementSubmission:
    """Tests for procurement/tender submission"""
    
    def test_procurement_submission_success(self):
        """Test successful procurement application submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "form_data": {
                "company_name": f"TEST_Procurement_{unique_id}",
                "tender_category": "Catering Services",
                "contact_person": "Test Contact",
                "designation": "Director",
                "email": f"test_procurement_{unique_id}@example.com",
                "phone": "+254712345682",
                "physical_address": "789 Procurement Ave, Nairobi",
                "registration_number": f"REG{unique_id}",
                "kra_pin": f"C{unique_id}D",
                "year_established": 2015,
                "annual_turnover": "5-10 Million",
                "employee_count": 50,
                "company_profile": "Leading catering company in Kenya",
                "relevant_experience": "10 years in event catering",
                "proposed_solution": "Full catering services for tournament",
                "references": "Reference 1, Reference 2, Reference 3",
                "agpo_registered": "Yes"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/procurement",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert "Procurement" in data.get("message", "")


class TestJobsSubmission:
    """Tests for job application submission"""
    
    def test_jobs_submission_success(self):
        """Test successful job application submission"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "form_data": {
                "full_name": f"TEST_Jobs_{unique_id}",
                "email": f"test_jobs_{unique_id}@example.com",
                "phone": "+254712345683",
                "nationality": "Kenyan",
                "id_number": f"ID{unique_id}",
                "date_of_birth": "1990-01-15",
                "gender": "Male",
                "physical_address": "101 Job Street, Nairobi",
                "position_applied": "Event Coordinator",
                "employment_type": "Full Tournament (All Days)",
                "education_level": "Bachelor's Degree",
                "work_experience": "5 years in event management",
                "skills": "Communication, Leadership, Organization",
                "languages": "English, Swahili",
                "availability": "Immediately Available",
                "has_uniform": "Yes",
                "emergency_contact": "Emergency Contact",
                "emergency_phone": "+254712345684"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/jobs",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert "Job Applications" in data.get("message", "")


class TestInvalidModuleSlug:
    """Tests for invalid module slug handling"""
    
    def test_invalid_module_returns_404(self):
        """Test that invalid module slug returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/invalid-module",
            json={"form_data": {"test": "data"}}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
    
    def test_nonexistent_module_returns_404(self):
        """Test that non-existent module slug returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/xyz123",
            json={"form_data": {"test": "data"}}
        )
        
        assert response.status_code == 404


class TestVolunteerModuleRedirect:
    """Tests for volunteer module special handling"""
    
    def test_volunteer_module_returns_400(self):
        """Test that volunteer module redirects to volunteer registration"""
        response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/volunteers",
            json={"form_data": {"test": "data"}}
        )
        
        # Volunteers should use the dedicated volunteer registration page
        assert response.status_code == 400
        data = response.json()
        assert "volunteer registration" in data.get("detail", "").lower()


class TestSubmissionPersistence:
    """Tests to verify submissions are stored in database"""
    
    @pytest.fixture
    def marshal_session(self):
        """Get marshal session for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "chiefmarshal", "password": "MKO2026Admin!"}
        )
        if response.status_code == 200:
            return response.json().get("session_id")
        pytest.skip("Could not authenticate as marshal")
    
    def test_submission_stored_in_database(self, marshal_session):
        """Verify submission is stored and retrievable"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Submit application
        payload = {
            "form_data": {
                "company_name": f"TEST_Persist_{unique_id}",
                "business_type": "Equipment Rental",
                "contact_person": "Persist Test",
                "contact_title": "Owner",
                "email": f"test_persist_{unique_id}@example.com",
                "phone": "+254712345699",
                "physical_address": "Persist Street, Nairobi",
                "kra_pin": f"P{unique_id}Q",
                "business_registration": f"PER{unique_id}",
                "years_in_business": 3,
                "products_services": "Equipment rental",
                "staff_count": 5,
                "insurance_coverage": "Yes"
            }
        }
        
        submit_response = requests.post(
            f"{BASE_URL}/api/accreditation/apply/vendors",
            json=payload
        )
        
        assert submit_response.status_code == 200
        submission_id = submit_response.json().get("submission_id")
        
        # Verify submission exists in database via authenticated endpoint
        headers = {"Authorization": f"Bearer {marshal_session}"}
        get_response = requests.get(
            f"{BASE_URL}/api/accreditation/submissions/{submission_id}",
            headers=headers
        )
        
        assert get_response.status_code == 200
        submission = get_response.json()
        assert submission.get("submission_id") == submission_id
        assert submission.get("module_type") == "vendors"
        assert submission.get("status") == "submitted"
        assert submission.get("form_data", {}).get("company_name") == f"TEST_Persist_{unique_id}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
