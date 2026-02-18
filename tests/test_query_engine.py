"""
Test suite for Advanced Volunteer Query Engine APIs
Tests: Query, Bulk Assign, Locations, Supervisors, Presets, Export
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQueryEngineAuth:
    """Test authentication for Query Engine endpoints"""
    
    @pytest.fixture(scope="class")
    def cio_session(self):
        """Login as CIO and get session token"""
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        assert response.status_code == 200, f"CIO login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        return data.get("session_id")
    
    def test_query_requires_auth(self):
        """Query endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/marshal/volunteers/query", json={})
        assert response.status_code == 401
    
    def test_locations_requires_auth(self):
        """Locations endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/marshal/assignment-locations")
        assert response.status_code == 401
    
    def test_supervisors_requires_auth(self):
        """Supervisors endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/marshal/assignment-supervisors")
        assert response.status_code == 401
    
    def test_presets_requires_auth(self):
        """Presets endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/marshal/query-presets")
        assert response.status_code == 401


class TestVolunteerQuery:
    """Test /api/marshal/volunteers/query endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for CIO user"""
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_query_all_approved(self, auth_headers):
        """Query all approved volunteers"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"status": "approved"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "volunteers" in data
        assert "total" in data
        assert "filters_applied" in data
        assert "statistics" in data
        
        # Verify statistics structure
        stats = data["statistics"]
        assert "by_status" in stats
        assert "by_role" in stats
        assert "karen_members" in stats
        assert "unassigned" in stats
        
        # Verify filters applied
        assert data["filters_applied"].get("status") == "approved"
    
    def test_query_by_role_marshal(self, auth_headers):
        """Query marshals only"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"role": "marshal"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All results should be marshals
        for vol in data["volunteers"]:
            assert vol.get("role") == "marshal"
        
        assert data["filters_applied"].get("role") == "marshal"
    
    def test_query_by_role_scorer(self, auth_headers):
        """Query scorers only"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"role": "scorer"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All results should be scorers
        for vol in data["volunteers"]:
            assert vol.get("role") == "scorer"
    
    def test_query_karen_members(self, auth_headers):
        """Query Karen Country Club members"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"karen_member": True, "status": "approved"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify Karen members filter applied
        assert data["filters_applied"].get("karen_member") == True
        
        # All results should be Karen members
        karen_variations = ["karen", "kcc", "karen country club", "karen golf"]
        for vol in data["volunteers"]:
            golf_club = vol.get("golf_club", "").lower()
            is_karen = any(v in golf_club for v in karen_variations)
            assert is_karen, f"Expected Karen member, got: {golf_club}"
    
    def test_query_non_karen_members(self, auth_headers):
        """Query non-Karen members"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"karen_member": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["filters_applied"].get("karen_member") == False
    
    def test_query_by_day(self, auth_headers):
        """Query by day availability"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"days": ["thursday", "friday"], "status": "approved"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["filters_applied"].get("days") == ["thursday", "friday"]
    
    def test_query_by_time_slot(self, auth_headers):
        """Query by time slot (requires day filter)"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"days": ["saturday"], "time_slots": ["morning", "all_day"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "time_slots" in data["filters_applied"]
    
    def test_query_kenyan_nationality(self, auth_headers):
        """Query Kenyan volunteers"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"nationality": "kenyan"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["filters_applied"].get("nationality") == "kenyan"
    
    def test_query_experienced_volunteers(self, auth_headers):
        """Query volunteers with previous experience"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"volunteered_before": True}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["filters_applied"].get("volunteered_before") == True
    
    def test_query_unassigned_only(self, auth_headers):
        """Query unassigned volunteers only"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"unassigned_only": True, "status": "approved"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["filters_applied"].get("unassigned_only") == True
        
        # All results should be unassigned
        for vol in data["volunteers"]:
            assert not vol.get("assigned_location"), f"Expected unassigned, got: {vol.get('assigned_location')}"
    
    def test_query_combined_filters(self, auth_headers):
        """Query with multiple combined filters"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={
                "role": "marshal",
                "status": "approved",
                "karen_member": True,
                "days": ["thursday"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all filters applied
        filters = data["filters_applied"]
        assert filters.get("role") == "marshal"
        assert filters.get("status") == "approved"
        assert filters.get("karen_member") == True


class TestAssignmentLocations:
    """Test /api/marshal/assignment-locations endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_get_locations(self, auth_headers):
        """Get assignment locations"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/assignment-locations",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "locations" in data
        locations = data["locations"]
        assert isinstance(locations, list)
        assert len(locations) > 0
        
        # Verify predefined locations exist
        expected_locations = ["Hole 1", "Hole 18", "Clubhouse", "Scoring Tent"]
        for loc in expected_locations:
            assert loc in locations, f"Expected location '{loc}' not found"


class TestAssignmentSupervisors:
    """Test /api/marshal/assignment-supervisors endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_get_supervisors(self, auth_headers):
        """Get assignment supervisors"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/assignment-supervisors",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "supervisors" in data
        supervisors = data["supervisors"]
        assert isinstance(supervisors, list)
        assert len(supervisors) > 0
        
        # Verify supervisor structure
        for sup in supervisors:
            assert "full_name" in sup


class TestQueryPresets:
    """Test /api/marshal/query-presets endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_get_presets(self, auth_headers):
        """Get query presets"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/query-presets",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "presets" in data
        presets = data["presets"]
        assert isinstance(presets, list)
        
        # Verify preset structure
        for preset in presets:
            assert "preset_id" in preset
            assert "name" in preset
            assert "filters" in preset
    
    def test_save_preset(self, auth_headers):
        """Save a new query preset"""
        import uuid
        preset_name = f"Test Preset {uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/marshal/query-presets",
            headers=auth_headers,
            json={
                "name": preset_name,
                "description": "Test preset for automated testing",
                "filters": {"role": "marshal", "status": "approved"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "preset_id" in data
        
        # Verify preset was saved
        get_response = requests.get(
            f"{BASE_URL}/api/marshal/query-presets",
            headers=auth_headers
        )
        presets = get_response.json().get("presets", [])
        preset_names = [p.get("name") for p in presets]
        assert preset_name in preset_names


class TestBulkAssign:
    """Test /api/marshal/volunteers/bulk-assign endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_bulk_assign_requires_volunteers(self, auth_headers):
        """Bulk assign requires volunteer IDs"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/bulk-assign",
            headers=auth_headers,
            json={"volunteer_ids": [], "location": "Hole 1"}
        )
        assert response.status_code == 400
        assert "No volunteers selected" in response.json().get("detail", "")
    
    def test_bulk_assign_success(self, auth_headers):
        """Bulk assign volunteers to location"""
        # First get a volunteer ID
        query_response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/query",
            headers=auth_headers,
            json={"status": "approved"}
        )
        volunteers = query_response.json().get("volunteers", [])
        
        if len(volunteers) > 0:
            volunteer_id = volunteers[0].get("volunteer_id")
            
            response = requests.post(
                f"{BASE_URL}/api/marshal/volunteers/bulk-assign",
                headers=auth_headers,
                json={
                    "volunteer_ids": [volunteer_id],
                    "location": "Hole 2",
                    "supervisor": "Test Supervisor",
                    "notes": "Automated test assignment"
                }
            )
            assert response.status_code == 200
            data = response.json()
            
            assert data.get("success") == True
            assert data.get("assigned_count") >= 0


class TestExportQuery:
    """Test /api/marshal/volunteers/export-query endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/marshal/login", json={
            "username": "cio",
            "password": "MKO2026CIO!"
        })
        session_id = response.json().get("session_id")
        return {"Authorization": f"Bearer {session_id}"}
    
    def test_export_csv(self, auth_headers):
        """Export query results as CSV"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/export-query?format=csv",
            headers=auth_headers,
            json={"status": "approved"}
        )
        assert response.status_code == 200
        
        # Verify CSV content
        content = response.text
        assert "First Name" in content
        assert "Last Name" in content
        assert "Role" in content
        assert "Karen Member" in content
        assert "QUERY RESULTS SUMMARY" in content
