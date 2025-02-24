import axios from "axios"

export async function updateFetcher<T>(url: string): Promise<T> {
    const response = await axios.get<T>(url, {
        timeout: 60000,
    })
    return response.data
}