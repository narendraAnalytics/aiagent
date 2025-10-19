"""
Simple test script for the research API
"""
import requests
import json

# Test the public endpoint
url = "http://localhost:8000/api/research/public"
data = {
    "query": "What is transformer architecture in deep learning?"
}

print("Testing Research Assistant API...")
print(f"Sending question: {data['query']}\n")

try:
    response = requests.post(url, json=data, timeout=60)

    if response.status_code == 200:
        result = response.json()
        print("Success!")
        print(f"\nResponse:\n{result['response']}\n")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Error: {str(e)}")
