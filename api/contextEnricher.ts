export async function enrichContext(payload: any, metadata: any, env: any) {
    if (!metadata || (!metadata.lat && !metadata.location)) return payload;
    
    let enrichedPayload = JSON.parse(JSON.stringify(payload));
    let contextString = "\n\n--- REAL-TIME CONTEXT DATA ---\n";
    
    // 1. Fetch Weather (if keys exist)
    if (env.OPENWEATHER_API_KEY && metadata.lat && metadata.lon) {
        try {
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${metadata.lat}&lon=${metadata.lon}&appid=${env.OPENWEATHER_API_KEY}&units=metric`);
            if (weatherRes.ok) {
                const weatherData = await weatherRes.json();
                const forecast = weatherData.list.slice(0, 8).map((item: any) => `${new Date(item.dt * 1000).toLocaleString()}: ${item.weather[0].description}, ${item.main.temp}°C`).join('; ');
                contextString += `WEATHER FORECAST: ${forecast}\n(Rule: If raining/bad weather, prioritize INDOOR activities.)\n`;
            }
        } catch(e) { console.error("Weather fetch failed"); }
    } else {
        contextString += "WEATHER FORECAST: Sunny, 22°C (MOCK DATA - Add OPENWEATHER_API_KEY for real data)\n";
    }

    // 2. Fetch Places (if keys exist)
    if (env.GOOGLE_PLACES_API_KEY && (metadata.lat || metadata.location)) {
        try {
            const query = metadata.location || `${metadata.lat},${metadata.lon}`;
            const placesRes = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.types'
                },
                body: JSON.stringify({
                    textQuery: `family friendly attractions near ${query}`,
                    maxResultCount: 5
                })
            });
            if (placesRes.ok) {
                const placesData = await placesRes.json();
                const placesList = (placesData.places || []).map((p: any) => `- ${p.displayName?.text} (${p.formattedAddress}) [Rating: ${p.rating}]`).join('\n');
                contextString += `VERIFIED FAMILY PLACES:\n${placesList}\n(Rule: MUST include at least one of these places in the itinerary.)\n`;
            }
        } catch(e) { console.error("Places fetch failed"); }
    } else {
        contextString += "VERIFIED FAMILY PLACES: Science Museum (MOCK), Adventure Park (MOCK) (Add GOOGLE_PLACES_API_KEY for real data)\n";
    }

    contextString += "------------------------------\n";

    // Inject into the first text part of the prompt
    if (enrichedPayload.contents && enrichedPayload.contents[0] && enrichedPayload.contents[0].parts && enrichedPayload.contents[0].parts[0]) {
        enrichedPayload.contents[0].parts[0].text = contextString + enrichedPayload.contents[0].parts[0].text;
    }
    
    return enrichedPayload;
}
