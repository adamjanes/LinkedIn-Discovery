const BASE_URL =
  "https://webhook-processor-production-48f8.up.railway.app/webhook"

class ApiService {
  async getUser(userId) {
    const response = await fetch(
      `${BASE_URL}/8c7fa7a0-3360-48c7-9f59-92868e60f55d/users/${userId}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    return response.json()
  }

  async updateApifyKey(userId, apiKey) {
    const response = await fetch(`${BASE_URL}/apify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        api_key: apiKey,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to update Apify key")
    }
    return response.json()
  }

  async createNetwork(userId, title, profileUrls) {
    const response = await fetch(`${BASE_URL}/networks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        title: title,
        profile_urls: profileUrls,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to create network")
    }
    return response.json()
  }

  async getNetworkProfiles(userId, networkId) {
    const response = await fetch(
      `${BASE_URL}/8c7fa7a0-3360-48c7-9f59-92868e60f55d/networks/${userId}/${networkId}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch network profiles")
    }
    return response.json()
  }

  async expandNetwork(userId, networkId, profileIds) {
    const response = await fetch(`${BASE_URL}/expandNetwork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: userId,
        network_id: networkId,
        profile_ids: profileIds,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to expand network")
    }
    return response.json()
  }

  async getApifyBalance(userId) {
    const response = await fetch(
      `${BASE_URL}/8c7fa7a0-3360-48c7-9f59-92868e60f55d/apify-balance/${userId}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch Apify balance")
    }
    return response.json()
  }

  async getNetworkGraph(networkId) {
    const response = await fetch(
      `${BASE_URL}/8c7fa7a0-3360-48c7-9f59-92868e60f55d/networkgraph/${networkId}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch network graph data")
    }
    return response.json()
  }
}

export default new ApiService()
