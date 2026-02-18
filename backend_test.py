#!/usr/bin/env python3
"""
Comprehensive API Testing for Magical Kenya Open Tournament Website
Tests all backend endpoints including public and protected routes
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class MagicalKenyaOpenAPITester:
    def __init__(self, base_url="https://golf-accredit-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.results = {
            "public_endpoints": [],
            "auth_endpoints": [],
            "admin_endpoints": [],
            "data_endpoints": []
        }

    def log_result(self, test_name: str, success: bool, endpoint: str, status_code: int, 
                   category: str = "public_endpoints", error_msg: str = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - Status: {status_code}")
        else:
            print(f"❌ {test_name} - Expected success, got {status_code}")
            if error_msg:
                print(f"   Error: {error_msg}")
            self.failed_tests.append({
                "test": test_name,
                "endpoint": endpoint,
                "status_code": status_code,
                "error": error_msg
            })
        
        self.results[category].append({
            "test": test_name,
            "endpoint": endpoint,
            "success": success,
            "status_code": status_code,
            "error": error_msg
        })

    def test_health_endpoints(self):
        """Test basic health and info endpoints"""
        print("\n🔍 Testing Health & Info Endpoints...")
        
        # Root endpoint
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            self.log_result("API Root", success, "/", response.status_code)
        except Exception as e:
            self.log_result("API Root", False, "/", 0, error_msg=str(e))

        # Health check
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            self.log_result("Health Check", success, "/health", response.status_code)
        except Exception as e:
            self.log_result("Health Check", False, "/health", 0, error_msg=str(e))

    def test_tournament_info_endpoints(self):
        """Test tournament information endpoints"""
        print("\n🔍 Testing Tournament Info Endpoints...")
        
        endpoints = [
            ("/tournament/info", "Tournament Info"),
            ("/tournament/schedule", "Tournament Schedule"),
            ("/tournament/past-winners", "Past Winners")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                success = response.status_code == 200
                if success:
                    data = response.json()
                    print(f"   📊 {name} returned {len(data) if isinstance(data, list) else 'object'} items")
                self.log_result(name, success, endpoint, response.status_code, "data_endpoints")
            except Exception as e:
                self.log_result(name, False, endpoint, 0, "data_endpoints", str(e))

    def test_leaderboard_endpoints(self):
        """Test leaderboard and player endpoints"""
        print("\n🔍 Testing Leaderboard & Player Endpoints...")
        
        # Get players
        try:
            response = requests.get(f"{self.api_url}/players", timeout=10)
            success = response.status_code == 200
            players_data = []
            if success:
                players_data = response.json()
                print(f"   📊 Found {len(players_data)} players")
            self.log_result("Get Players", success, "/players", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Players", False, "/players", 0, "data_endpoints", str(e))
            players_data = []

        # Get leaderboard
        try:
            response = requests.get(f"{self.api_url}/leaderboard", timeout=10)
            success = response.status_code == 200
            leaderboard_data = []
            if success:
                leaderboard_data = response.json()
                print(f"   📊 Found {len(leaderboard_data)} leaderboard entries")
            self.log_result("Get Leaderboard", success, "/leaderboard", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Leaderboard", False, "/leaderboard", 0, "data_endpoints", str(e))

        # Test individual player endpoint if we have players
        if players_data and len(players_data) > 0:
            player_id = players_data[0].get('player_id')
            if player_id:
                try:
                    response = requests.get(f"{self.api_url}/players/{player_id}", timeout=10)
                    success = response.status_code == 200
                    self.log_result("Get Single Player", success, f"/players/{player_id}", response.status_code, "data_endpoints")
                except Exception as e:
                    self.log_result("Get Single Player", False, f"/players/{player_id}", 0, "data_endpoints", str(e))

    def test_news_endpoints(self):
        """Test news and content endpoints"""
        print("\n🔍 Testing News & Content Endpoints...")
        
        # Get news
        try:
            response = requests.get(f"{self.api_url}/news", timeout=10)
            success = response.status_code == 200
            news_data = []
            if success:
                news_data = response.json()
                print(f"   📊 Found {len(news_data)} news articles")
            self.log_result("Get News", success, "/news", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get News", False, "/news", 0, "data_endpoints", str(e))

        # Test news with filters
        try:
            response = requests.get(f"{self.api_url}/news?status=published&limit=5", timeout=10)
            success = response.status_code == 200
            self.log_result("Get News (Filtered)", success, "/news?status=published&limit=5", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get News (Filtered)", False, "/news?status=published&limit=5", 0, "data_endpoints", str(e))

        # Test individual article if we have news
        if news_data and len(news_data) > 0:
            article_id = news_data[0].get('article_id')
            if article_id:
                try:
                    response = requests.get(f"{self.api_url}/news/{article_id}", timeout=10)
                    success = response.status_code == 200
                    self.log_result("Get Single Article", success, f"/news/{article_id}", response.status_code, "data_endpoints")
                except Exception as e:
                    self.log_result("Get Single Article", False, f"/news/{article_id}", 0, "data_endpoints", str(e))

    def test_gallery_endpoints(self):
        """Test gallery endpoints"""
        print("\n🔍 Testing Gallery Endpoints...")
        
        try:
            response = requests.get(f"{self.api_url}/gallery", timeout=10)
            success = response.status_code == 200
            if success:
                gallery_data = response.json()
                print(f"   📊 Found {len(gallery_data)} gallery items")
            self.log_result("Get Gallery", success, "/gallery", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Gallery", False, "/gallery", 0, "data_endpoints", str(e))

    def test_tickets_endpoints(self):
        """Test tickets and enquiry endpoints"""
        print("\n🔍 Testing Tickets & Enquiry Endpoints...")
        
        # Get ticket packages
        try:
            response = requests.get(f"{self.api_url}/tickets/packages", timeout=10)
            success = response.status_code == 200
            if success:
                packages_data = response.json()
                print(f"   📊 Found {len(packages_data)} ticket packages")
            self.log_result("Get Ticket Packages", success, "/tickets/packages", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Ticket Packages", False, "/tickets/packages", 0, "data_endpoints", str(e))

        # Test enquiry submission
        enquiry_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+254123456789",
            "enquiry_type": "tickets",
            "message": "Test enquiry for API testing"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/enquiries",
                json=enquiry_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            self.log_result("Submit Enquiry", success, "/enquiries", response.status_code, "public_endpoints")
        except Exception as e:
            self.log_result("Submit Enquiry", False, "/enquiries", 0, "public_endpoints", str(e))

    def test_contact_endpoints(self):
        """Test contact form endpoints"""
        print("\n🔍 Testing Contact Endpoints...")
        
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "API Test Message",
            "message": "This is a test message for API testing purposes"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/contact",
                json=contact_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            self.log_result("Submit Contact Form", success, "/contact", response.status_code, "public_endpoints")
        except Exception as e:
            self.log_result("Submit Contact Form", False, "/contact", 0, "public_endpoints", str(e))

    def test_policies_endpoints(self):
        """Test policy document endpoints"""
        print("\n🔍 Testing Policy Document Endpoints...")
        
        # Get policies (public endpoint)
        try:
            response = requests.get(f"{self.api_url}/policies", timeout=10)
            success = response.status_code == 200
            if success:
                policies_data = response.json()
                print(f"   📊 Found {len(policies_data)} policy documents")
            self.log_result("Get Policies", success, "/policies", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Policies", False, "/policies", 0, "data_endpoints", str(e))

        # Test policies with category filter
        try:
            response = requests.get(f"{self.api_url}/policies?category=governance", timeout=10)
            success = response.status_code == 200
            self.log_result("Get Policies (Filtered)", success, "/policies?category=governance", response.status_code, "data_endpoints")
        except Exception as e:
            self.log_result("Get Policies (Filtered)", False, "/policies?category=governance", 0, "data_endpoints", str(e))

    def test_upload_endpoints_without_auth(self):
        """Test upload endpoints without authentication (should fail appropriately)"""
        print("\n🔍 Testing Upload Endpoints (Unauthenticated)...")
        
        # Test image upload without auth (should return 401)
        try:
            response = requests.post(f"{self.api_url}/admin/upload", timeout=10)
            success = response.status_code == 401
            self.log_result("Image Upload (No Auth)", success, "/admin/upload", response.status_code, "auth_endpoints")
        except Exception as e:
            self.log_result("Image Upload (No Auth)", False, "/admin/upload", 0, "auth_endpoints", str(e))

        # Test policy upload without auth (should return 401)
        try:
            response = requests.post(f"{self.api_url}/admin/policies/upload", timeout=10)
            success = response.status_code == 401
            self.log_result("Policy Upload (No Auth)", success, "/admin/policies/upload", response.status_code, "auth_endpoints")
        except Exception as e:
            self.log_result("Policy Upload (No Auth)", False, "/admin/policies/upload", 0, "auth_endpoints", str(e))

        # Test admin policies list without auth (should return 401)
        try:
            response = requests.get(f"{self.api_url}/admin/policies", timeout=10)
            success = response.status_code == 401
            self.log_result("Admin Policies List (No Auth)", success, "/admin/policies", response.status_code, "auth_endpoints")
        except Exception as e:
            self.log_result("Admin Policies List (No Auth)", False, "/admin/policies", 0, "auth_endpoints", str(e))

        # Test admin uploads list without auth (should return 401)
        try:
            response = requests.get(f"{self.api_url}/admin/uploads", timeout=10)
            success = response.status_code == 401
            self.log_result("Admin Uploads List (No Auth)", success, "/admin/uploads", response.status_code, "auth_endpoints")
        except Exception as e:
            self.log_result("Admin Uploads List (No Auth)", False, "/admin/uploads", 0, "auth_endpoints", str(e))

    def test_auth_endpoints_without_token(self):
        """Test auth endpoints without authentication (should fail appropriately)"""
        print("\n🔍 Testing Auth Endpoints (Unauthenticated)...")
        
        # These should return 401
        protected_endpoints = [
            ("/auth/me", "Get Current User"),
            ("/auth/request-role", "Request Role"),
            ("/admin/users", "Get Users (Admin)"),
            ("/admin/registration-requests", "Get Registration Requests")
        ]
        
        for endpoint, name in protected_endpoints:
            try:
                if endpoint == "/auth/request-role":
                    response = requests.post(f"{self.api_url}{endpoint}", json={}, timeout=10)
                else:
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                
                # Should return 401 for protected endpoints
                success = response.status_code == 401
                self.log_result(f"{name} (No Auth)", success, endpoint, response.status_code, "auth_endpoints")
            except Exception as e:
                self.log_result(f"{name} (No Auth)", False, endpoint, 0, "auth_endpoints", str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Magical Kenya Open API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Test all endpoints
        self.test_health_endpoints()
        self.test_tournament_info_endpoints()
        self.test_leaderboard_endpoints()
        self.test_news_endpoints()
        self.test_gallery_endpoints()
        self.test_tickets_endpoints()
        self.test_contact_endpoints()
        self.test_policies_endpoints()
        self.test_upload_endpoints_without_auth()
        self.test_auth_endpoints_without_token()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {len(self.failed_tests)}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test['test']}: {test['endpoint']} (Status: {test['status_code']})")
                if test['error']:
                    print(f"     Error: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MagicalKenyaOpenAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        results_data = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": len(tester.failed_tests),
            "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            "results": tester.results,
            "failed_details": tester.failed_tests
        }
        
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump(results_data, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())