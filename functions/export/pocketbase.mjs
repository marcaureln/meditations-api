import axios from 'axios';

export async function getUserQuotes(apiBaseUrl, apiToken) {
    const endpoint = new URL('/api/collections/quotes/records', apiBaseUrl);

    let page = 1, totalPage = 1;
    const quotes = [];

    while (page <= totalPage) {
        const response = await axios.get(endpoint, {
            params: {
                fields: 'content,author,source,notes',
                perPage: 500, // PocketBase max per page
                page,
            },
            headers: { authorization: apiToken },
        });

        quotes.push(...response.data.items);
        totalPage = response.data.totalPages;
        page++;
    }

    return quotes;
}

export async function getUser(apiBaseUrl, apiToken, userId) {
    const endpoint = new URL('/api/collections/users/records/' + userId, apiBaseUrl);

    const response = await axios.get(endpoint, {
        headers: { authorization: apiToken },
    });

    return response.data;
}