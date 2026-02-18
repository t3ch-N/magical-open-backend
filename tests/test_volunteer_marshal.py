"""
Comprehensive tests for Volunteer Registration and Marshal Dashboard features
Tests: Volunteer registration, Marshal login, Dashboard functionality, RBAC, CSV export
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_VOLUNTEER = {
    "first_name": "TEST_John",
    "last_name": "TEST_Doe",
    "nationality": "Kenyan",
    "identification_number": f"TEST_{uuid.uuid4().hex[:8]}",
    "golf_club": "Karen Country Club",
    "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
    "phone": "+254712345678",
    "role": "marshal",
    "volunteered_before": False,
    "availability_thursday": "all_day",
    "availability_friday": "morning",
    "availability_saturday": "afternoon",
    "availability_sunday": "all_day",
    "photo_attached": True,
    "consent_given": True
}

CHIEF_MARSHAL_CREDENTIALS = {
    "username": "chiefmarshal",
    "password": "MKO2026Admin!"
}


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API health check passed: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Magical Kenya Open" in data.get("message", "")
        print(f"✓ API root check passed: {data}")


class TestVolunteerRegistration:
    """Tests for volunteer registration functionality"""
    
    def test_volunteer_stats_endpoint(self):
        """Test volunteer stats endpoint (public)"""
        response = requests.get(f"{BASE_URL}/api/volunteers/stats")
        assert response.status_code == 200
        data = response.json()
        assert "marshals" in data
        assert "scorers" in data
        assert "current" in data["marshals"]
        assert "minimum" in data["marshals"]
        print(f"✓ Volunteer stats: Marshals {data['marshals']['current']}/{data['marshals']['minimum']}, Scorers {data['scorers']['current']}/{data['scorers']['maximum']}")
    
    def test_volunteer_registration_success(self):
        """Test successful volunteer registration"""
        response = requests.post(
            f"{BASE_URL}/api/volunteers/register",
            json=TEST_VOLUNTEER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "volunteer_id" in data
        print(f"✓ Volunteer registered successfully: {data['volunteer_id']}")
        return data["volunteer_id"]
    
    def test_volunteer_registration_duplicate_email(self):
        """Test duplicate email rejection"""
        # First registration
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        
        response1 = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        assert response1.status_code == 200
        
        # Second registration with same email
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        response2 = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json().get("detail", "").lower()
        print("✓ Duplicate email correctly rejected")
    
    def test_volunteer_registration_without_consent(self):
        """Test registration without consent fails"""
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"noconsent_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        vol_data["consent_given"] = False
        
        response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        assert response.status_code == 400
        assert "consent" in response.json().get("detail", "").lower()
        print("✓ Registration without consent correctly rejected")
    
    def test_volunteer_registration_scorer_role(self):
        """Test scorer role registration"""
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"scorer_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        vol_data["role"] = "scorer"
        
        response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Scorer registered successfully: {data['volunteer_id']}")


class TestMarshalAuthentication:
    """Tests for marshal authentication"""
    
    def test_marshal_login_success(self):
        """Test successful marshal login"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "session_id" in data
        assert "user" in data
        assert data["user"]["role"] == "chief_marshal"
        print(f"✓ Marshal login successful: {data['user']['full_name']} ({data['user']['role']})")
        return data["session_id"]
    
    def test_marshal_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "invalid", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "invalid" in response.json().get("detail", "").lower()
        print("✓ Invalid credentials correctly rejected")
    
    def test_marshal_me_without_auth(self):
        """Test /marshal/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/marshal/me")
        assert response.status_code == 401
        print("✓ Unauthenticated access correctly rejected")
    
    def test_marshal_me_with_auth(self):
        """Test /marshal/me with valid session"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        session_id = login_response.json()["session_id"]
        
        # Get profile
        response = requests.get(
            f"{BASE_URL}/api/marshal/me",
            headers={"Authorization": f"Bearer {session_id}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "chiefmarshal"
        assert data["role"] == "chief_marshal"
        print(f"✓ Marshal profile retrieved: {data['full_name']}")
    
    def test_marshal_logout(self):
        """Test marshal logout"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        session_id = login_response.json()["session_id"]
        
        # Logout
        response = requests.post(
            f"{BASE_URL}/api/marshal/logout",
            headers={"Authorization": f"Bearer {session_id}"}
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("✓ Marshal logout successful")


class TestMarshalDashboard:
    """Tests for marshal dashboard functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    def test_get_dashboard_stats(self, auth_session):
        """Test dashboard statistics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/stats",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "pending" in data
        assert "approved" in data
        assert "rejected" in data
        assert "by_role" in data
        print(f"✓ Dashboard stats: Total={data['total']}, Pending={data['pending']}, Approved={data['approved']}")
    
    def test_get_volunteers_list(self, auth_session):
        """Test get all volunteers"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} volunteers")
    
    def test_filter_volunteers_by_status(self, auth_session):
        """Test filtering volunteers by status"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers?status=pending",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        for vol in data:
            assert vol["status"] == "pending"
        print(f"✓ Filtered {len(data)} pending volunteers")
    
    def test_filter_volunteers_by_role(self, auth_session):
        """Test filtering volunteers by role"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers?role=marshal",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        for vol in data:
            assert vol["role"] == "marshal"
        print(f"✓ Filtered {len(data)} marshal volunteers")


class TestVolunteerApprovalWorkflow:
    """Tests for volunteer approval/rejection workflow"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    @pytest.fixture
    def test_volunteer_id(self):
        """Create a test volunteer and return ID"""
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"approval_test_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        return response.json()["volunteer_id"]
    
    def test_approve_volunteer(self, auth_session, test_volunteer_id):
        """Test approving a volunteer"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/{test_volunteer_id}/approve",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify status changed
        vol_response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers/{test_volunteer_id}",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert vol_response.json()["status"] == "approved"
        print(f"✓ Volunteer {test_volunteer_id} approved successfully")
    
    def test_reject_volunteer(self, auth_session):
        """Test rejecting a volunteer"""
        # Create a new volunteer for rejection
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"reject_test_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        
        reg_response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        volunteer_id = reg_response.json()["volunteer_id"]
        
        # Reject
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/{volunteer_id}/reject",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify status changed
        vol_response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers/{volunteer_id}",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert vol_response.json()["status"] == "rejected"
        print(f"✓ Volunteer {volunteer_id} rejected successfully")


class TestAttendanceTracking:
    """Tests for attendance tracking functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    @pytest.fixture
    def approved_volunteer_id(self, auth_session):
        """Create and approve a test volunteer"""
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"attendance_test_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        
        reg_response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        volunteer_id = reg_response.json()["volunteer_id"]
        
        # Approve
        requests.post(
            f"{BASE_URL}/api/marshal/volunteers/{volunteer_id}/approve",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        return volunteer_id
    
    def test_mark_attendance_present(self, auth_session, approved_volunteer_id):
        """Test marking attendance as present"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/attendance",
            headers={
                "Authorization": f"Bearer {auth_session}",
                "Content-Type": "application/json"
            },
            json={
                "volunteer_id": approved_volunteer_id,
                "date": "2026-02-19",
                "status": "present"
            }
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        print(f"✓ Attendance marked as present for {approved_volunteer_id}")
    
    def test_mark_attendance_late(self, auth_session, approved_volunteer_id):
        """Test marking attendance as late"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/attendance",
            headers={
                "Authorization": f"Bearer {auth_session}",
                "Content-Type": "application/json"
            },
            json={
                "volunteer_id": approved_volunteer_id,
                "date": "2026-02-20",
                "status": "late"
            }
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        print(f"✓ Attendance marked as late for {approved_volunteer_id}")
    
    def test_mark_attendance_absent(self, auth_session, approved_volunteer_id):
        """Test marking attendance as absent"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/attendance",
            headers={
                "Authorization": f"Bearer {auth_session}",
                "Content-Type": "application/json"
            },
            json={
                "volunteer_id": approved_volunteer_id,
                "date": "2026-02-21",
                "status": "absent"
            }
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        print(f"✓ Attendance marked as absent for {approved_volunteer_id}")
    
    def test_get_attendance_by_date(self, auth_session):
        """Test getting attendance for a specific date"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/attendance/2026-02-19",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved attendance for {len(data)} volunteers on 2026-02-19")


class TestCSVExport:
    """Tests for CSV export functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    def test_export_volunteers_csv(self, auth_session):
        """Test exporting volunteers to CSV"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/export/volunteers?format=csv",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "attachment" in response.headers.get("content-disposition", "")
        print(f"✓ Volunteers CSV export successful ({len(response.content)} bytes)")
    
    def test_export_attendance_csv(self, auth_session):
        """Test exporting attendance to CSV"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/export/attendance/2026-02-19",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ Attendance CSV export successful ({len(response.content)} bytes)")


class TestUserManagement:
    """Tests for marshal user management (Chief Marshal only)"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    def test_list_marshal_users(self, auth_session):
        """Test listing marshal users"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/users",
            headers={"Authorization": f"Bearer {auth_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least chief marshal exists
        print(f"✓ Retrieved {len(data)} marshal users")
    
    def test_create_marshal_user(self, auth_session):
        """Test creating a new marshal user"""
        new_user = {
            "username": f"test_user_{uuid.uuid4().hex[:8]}",
            "password": "TestPassword123!",
            "full_name": "Test User",
            "role": "viewer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/marshal/users",
            headers={
                "Authorization": f"Bearer {auth_session}",
                "Content-Type": "application/json"
            },
            json=new_user
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "marshal_id" in data
        print(f"✓ Created new marshal user: {new_user['username']}")
        return data["marshal_id"]
    
    def test_create_duplicate_username(self, auth_session):
        """Test creating user with duplicate username fails"""
        new_user = {
            "username": "chiefmarshal",  # Already exists
            "password": "TestPassword123!",
            "full_name": "Duplicate User",
            "role": "viewer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/marshal/users",
            headers={
                "Authorization": f"Bearer {auth_session}",
                "Content-Type": "application/json"
            },
            json=new_user
        )
        assert response.status_code == 400
        assert "exists" in response.json().get("detail", "").lower()
        print("✓ Duplicate username correctly rejected")


class TestRoleBasedAccessControl:
    """Tests for role-based access control"""
    
    @pytest.fixture
    def chief_marshal_session(self):
        """Get chief marshal session"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json=CHIEF_MARSHAL_CREDENTIALS
        )
        return response.json()["session_id"]
    
    @pytest.fixture
    def viewer_session(self, chief_marshal_session):
        """Create and login as viewer"""
        # Create viewer user
        viewer_username = f"viewer_{uuid.uuid4().hex[:8]}"
        requests.post(
            f"{BASE_URL}/api/marshal/users",
            headers={
                "Authorization": f"Bearer {chief_marshal_session}",
                "Content-Type": "application/json"
            },
            json={
                "username": viewer_username,
                "password": "ViewerPass123!",
                "full_name": "Test Viewer",
                "role": "viewer"
            }
        )
        
        # Login as viewer
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": viewer_username, "password": "ViewerPass123!"}
        )
        return response.json()["session_id"]
    
    def test_viewer_cannot_approve_volunteers(self, viewer_session, chief_marshal_session):
        """Test that viewers cannot approve volunteers"""
        # Create a volunteer
        vol_data = TEST_VOLUNTEER.copy()
        vol_data["email"] = f"rbac_test_{uuid.uuid4().hex[:8]}@example.com"
        vol_data["identification_number"] = f"TEST_{uuid.uuid4().hex[:8]}"
        
        reg_response = requests.post(f"{BASE_URL}/api/volunteers/register", json=vol_data)
        volunteer_id = reg_response.json()["volunteer_id"]
        
        # Try to approve as viewer
        response = requests.post(
            f"{BASE_URL}/api/marshal/volunteers/{volunteer_id}/approve",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 403
        print("✓ Viewer correctly denied approval permission")
    
    def test_viewer_cannot_create_users(self, viewer_session):
        """Test that viewers cannot create users"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/users",
            headers={
                "Authorization": f"Bearer {viewer_session}",
                "Content-Type": "application/json"
            },
            json={
                "username": "should_fail",
                "password": "TestPass123!",
                "full_name": "Should Fail",
                "role": "viewer"
            }
        )
        assert response.status_code == 403
        print("✓ Viewer correctly denied user creation permission")
    
    def test_viewer_can_view_volunteers(self, viewer_session):
        """Test that viewers can view volunteers"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/volunteers",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        print("✓ Viewer can view volunteers list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
