#!/usr/bin/env python3
"""
Test script for batch ASIN processing
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5000"
COUNTRY = "US"

# Sample ASINs (replace with real ASINs for testing)
SAMPLE_ASINS = [
    "B08N5WRWNW",  # Example ASIN
    "B08N5WRWNW",  # Duplicate for testing
    "B08N5WRWNW",  # Another duplicate
]

def test_single_asin():
    """Test single ASIN endpoint"""
    print("Testing single ASIN endpoint...")
    
    asin = SAMPLE_ASINS[0]
    
    # Test GET endpoint
    try:
        response = requests.get(f"{BASE_URL}/asin/{asin}")
        print(f"GET /asin/{asin}: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success')}")
            print(f"Title: {data.get('Title', 'N/A')}")
    except Exception as e:
        print(f"GET request failed: {e}")
    
    # Test POST endpoint
    try:
        response = requests.post(
            f"{BASE_URL}/asin/{COUNTRY}",
            json={"asin": asin},
            headers={"Content-Type": "application/json"}
        )
        print(f"POST /asin/{COUNTRY}: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success')}")
            print(f"Title: {data.get('Title', 'N/A')}")
    except Exception as e:
        print(f"POST request failed: {e}")

def test_batch_processing():
    """Test batch processing endpoint"""
    print("\nTesting batch processing endpoint...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/asin/batch/{COUNTRY}",
            json={"asins": SAMPLE_ASINS},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"POST /asin/batch/{COUNTRY}: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total requested: {data.get('total_requested')}")
            print(f"Successful: {data.get('successful')}")
            print(f"Failed: {data.get('failed')}")
            print(f"Success rate: {data.get('success_rate')}")
            
            # Show first result
            results = data.get('results', [])
            if results:
                first_result = results[0]
                print(f"\nFirst result:")
                print(f"ASIN: {first_result.get('asin')}")
                print(f"Success: {first_result.get('success')}")
                print(f"Title: {first_result.get('Title', 'N/A')}")
                if not first_result.get('success'):
                    print(f"Error: {first_result.get('error', 'Unknown error')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Batch request failed: {e}")

def test_health_check():
    """Test health check endpoint"""
    print("\nTesting health check endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"GET /health: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message')}")
            print(f"Rate limit: {data.get('rate_limit')}")
    except Exception as e:
        print(f"Health check failed: {e}")

def test_config():
    """Test configuration endpoint"""
    print("\nTesting configuration endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/config")
        print(f"GET /config: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Current configuration:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Config check failed: {e}")

def main():
    """Run all tests"""
    print("FBA Backend Test Suite")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("Waiting for server to be ready...")
    time.sleep(2)
    
    # Run tests
    test_health_check()
    test_config()
    test_single_asin()
    test_batch_processing()
    
    print("\n" + "=" * 50)
    print("Test suite completed!")

if __name__ == "__main__":
    main() 