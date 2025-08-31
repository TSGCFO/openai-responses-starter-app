"""
Function implementations for tool calls.
Converted from config/functions.ts and API routes.
"""

import httpx
import json
from typing import Dict, Any

async def get_weather(location: str, unit: str) -> Dict[str, Any]:
    """
    Get the weather for a given location.
    Converted from app/api/functions/get_weather/route.ts
    """
    try:
        # 1. Get coordinates for the city
        async with httpx.AsyncClient() as client:
            geo_response = await client.get(
                f"https://nominatim.openstreetmap.org/search?q={location}&format=json"
            )
            geo_data = geo_response.json()

        if not geo_data:
            return {"error": "Invalid location"}

        lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]

        # 2. Fetch weather data from Open-Meteo
        async with httpx.AsyncClient() as client:
            weather_response = await client.get(
                f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m&temperature_unit={unit or 'celsius'}"
            )
            
        if weather_response.status_code != 200:
            raise Exception("Failed to fetch weather data")

        weather = weather_response.json()

        # 3. Get current UTC time in ISO format
        from datetime import datetime
        now = datetime.utcnow()
        current_hour_iso = now.strftime("%Y-%m-%dT%H:00")

        # 4. Get current temperature
        try:
            index = weather["hourly"]["time"].index(current_hour_iso)
            current_temperature = weather["hourly"]["temperature_2m"][index]
        except (ValueError, IndexError):
            return {"error": "Temperature data unavailable"}

        return {"temperature": current_temperature}

    except Exception as e:
        print(f"Error getting weather: {e}")
        return {"error": "Error getting weather"}

async def get_joke() -> Dict[str, Any]:
    """
    Get a programming joke.
    Converted from app/api/functions/get_joke/route.ts
    """
    try:
        async with httpx.AsyncClient() as client:
            joke_response = await client.get("https://v2.jokeapi.dev/joke/Programming")
            
        if joke_response.status_code != 200:
            raise Exception("Failed to fetch joke")

        joke_data = joke_response.json()

        # Format joke response based on its type
        if joke_data["type"] == "twopart":
            joke = f"{joke_data['setup']} - {joke_data['delivery']}"
        else:
            joke = joke_data["joke"]

        return {"joke": joke}

    except Exception as e:
        print(f"Error fetching joke: {e}")
        return {"error": "Could not fetch joke"}

# Functions mapping to tool calls
# Define one function per tool call - each tool call should have a matching function
# Parameters for a tool call are passed as an object to the corresponding function
FUNCTIONS_MAP = {
    "get_weather": get_weather,
    "get_joke": get_joke,
}