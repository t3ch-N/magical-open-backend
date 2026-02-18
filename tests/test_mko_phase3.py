"""
MKO Phase 3 Testing - Backend API Tests
Tests for:
- Volunteer stats (300/300 quotas)
- Webmaster login
- Marshal/CIO login
- Super Admin Dashboard APIs
- Email test endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://golf-accredit-1.preview.emergentagent.com')

class TestVolunteerStats:
    """Test volunteer registration stats showing 300/300 quotas"""
    
    def test_volunteer_stats_endpoint(self):
        """Test /api/volunteers/stats returns correct quota targets"""
        response = requests.get(f"{BASE_URL}/api/volunteers/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "marshals" in data
        assert "scorers" in data
        
        # Verify targets are 300
        assert data["marshals"]["target"] == 300, f"Expected marshal target 300, got {data['marshals']['target']}"
        assert data["scorers"]["target"] == 300, f"Expected scorer target 300, got {data['scorers']['target']}"
        
        print(f"✓ Volunteer stats: Marshals {data['marshals']['current']}/{data['marshals']['target']}, Scorers {data['scorers']['current']}/{data['scorers']['target']}")


class TestWebmasterLogin:
    """Test webmaster login functionality"""
    
    def test_webmaster_login_success(self):
        """Test webmaster login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/webmaster/login",
            json={"username": "webmaster", "password": "MKO2026Web!"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "session_id" in data
        assert "user" in data
        assert data["user"]["username"] == "webmaster"
        
        print(f"✓ Webmaster login successful: {data['user']['username']}")
        return data["session_id"]
    
    def test_webmaster_login_wrong_password(self):
        """Test webmaster login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/webmaster/login",
            json={"username": "webmaster", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Webmaster login correctly rejects wrong password")
    
    def test_webmaster_login_wrong_username(self):
        """Test webmaster login with wrong username"""
        response = requests.post(
            f"{BASE_URL}/api/webmaster/login",
            json={"username": "wronguser", "password": "MKO2026Web!"}
        )
        assert response.status_code == 401
        print("✓ Webmaster login correctly rejects wrong username")


class TestMarshalCIOLogin:
    """Test marshal/CIO login functionality"""
    
    def test_cio_login_success(self):
        """Test CIO login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "cio", "password": "MKO2026CIO!"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "session_id" in data
        assert "user" in data
        assert data["user"]["role"] == "cio"
        
        print(f"✓ CIO login successful: {data['user']['full_name']} (role: {data['user']['role']})")
        return data["session_id"]
    
    def test_chiefmarshal_login_success(self):
        """Test Chief Marshal login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "chiefmarshal", "password": "MKO2026Admin!"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data["user"]["role"] == "chief_marshal"
        
        print(f"✓ Chief Marshal login successful: {data['user']['full_name']}")
    
    def test_marshal_login_wrong_password(self):
        """Test marshal login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "cio", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Marshal login correctly rejects wrong password")


class TestSuperAdminAPIs:
    """Test Super Admin Dashboard APIs (CIO only)"""
    
    @pytest.fixture
    def cio_session(self):
        """Get CIO session for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "cio", "password": "MKO2026CIO!"}
        )
        if response.status_code == 200:
            return response.json()["session_id"]
        pytest.skip("CIO login failed")
    
    def test_superadmin_stats(self, cio_session):
        """Test /api/superadmin/stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/stats",
            cookies={"marshal_session": cio_session}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "marshal_users" in data
        assert "webmaster_users" in data
        assert "volunteers" in data
        
        print(f"✓ Super Admin stats: {data}")
    
    def test_superadmin_webmaster_users_list(self, cio_session):
        """Test /api/superadmin/webmaster-users endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/webmaster-users",
            cookies={"marshal_session": cio_session}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Webmaster users list: {len(data)} users")
    
    def test_marshal_users_list(self, cio_session):
        """Test /api/marshal/users endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/marshal/users",
            cookies={"marshal_session": cio_session}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Marshal users list: {len(data)} users")
    
    def test_superadmin_unauthorized_without_session(self):
        """Test Super Admin APIs require authentication"""
        response = requests.get(f"{BASE_URL}/api/superadmin/stats")
        assert response.status_code == 401
        print("✓ Super Admin APIs correctly require authentication")


class TestEmailEndpoint:
    """Test email functionality"""
    
    @pytest.fixture
    def cio_session(self):
        """Get CIO session for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/marshal/login",
            json={"username": "cio", "password": "MKO2026CIO!"}
        )
        if response.status_code == 200:
            return response.json()["session_id"]
        pytest.skip("CIO login failed")
    
    def test_email_endpoint_exists(self, cio_session):
        """Test /api/superadmin/test-email endpoint exists and requires email"""
        response = requests.post(
            f"{BASE_URL}/api/superadmin/test-email",
            json={},
            cookies={"marshal_session": cio_session}
        )
        # Should return 400 for missing email, not 404
        assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
        print("✓ Email test endpoint exists and validates input")
    
    def test_email_endpoint_unauthorized(self):
        """Test email endpoint requires CIO auth"""
        response = requests.post(
            f"{BASE_URL}/api/superadmin/test-email",
            json={"to_email": "test@example.com"}
        )
        assert response.status_code == 401
        print("✓ Email endpoint correctly requires CIO authentication")


class TestHomepageAPIs:
    """Test homepage-related APIs"""
    
    def test_leaderboard_api(self):
        """Test leaderboard API returns data"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Leaderboard API: {len(data)} entries (MOCKED data)")
    
    def test_tournament_info_api(self):
        """Test tournament info API"""
        response = requests.get(f"{BASE_URL}/api/tournament/info")
        assert response.status_code == 200
        
        data = response.json()
        assert "name" in data
        assert "venue" in data
        print(f"✓ Tournament info: {data.get('name')} at {data.get('venue')}")
    
    def test_news_api(self):
        """Test news API"""
        response = requests.get(f"{BASE_URL}/api/news?limit=3")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ News API: {len(data)} articles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
