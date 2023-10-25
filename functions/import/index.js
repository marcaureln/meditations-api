import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import axios from 'axios';
import { decode } from 'jsonwebtoken';

const { API_BASE_URL, HOST, PORT, NODE_ENV, REQUEST_WAIT_TIME } = process.env;

const fastify = Fastify({
    logger: NODE_ENV === 'development',
});

fastify.register(multipart);

fastify.get('/', async function handler(_, __) {
    return "Welcome to the Meditations Import API. Please POST a JSON file to /";
});

fastify.post('/', async function handler(request, reply) {
    const pocketbaseEndpoint = new URL('/api/collections/quotes/records', API_BASE_URL);
    const apiToken = request.headers.authorization;
    let userId;

    try {
        userId = decode(apiToken)?.id;
    } catch { }

    if (!apiToken || !userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
    }

    const file = await request.file();

    if (!file) {
        reply.code(400);
        return { error: 'No file provided' };
    }

    const buffer = await file.toBuffer();
    const content = buffer.toString('utf8');
    const json = JSON.parse(content);

    let imported = 0,
        failed = 0;

    setTimeout(() => {
        reply.code(202);
        reply.send({ message: 'Import in progress', imported, failed, submitted: json.length });
    }, REQUEST_WAIT_TIME ?? 1000);

    for (const item of json) {
        const { content, author, source, notes } = item;

        try {
            const response = await axios.get(pocketbaseEndpoint, {
                params: {
                    filter: `(content="${content}")`,
                    skipTotal: true,
                },
                headers: { authorization: apiToken },
            });

            if (response.data.items.length > 0) {
                continue;
            }
        } catch (e) {
            console.error('Failed to fetch record.', e, e.stack);
            continue;
        }

        try {
            const data = { content, author, source, notes, userId };
            await axios.post(pocketbaseEndpoint, data, { headers: { authorization: apiToken } });
            imported++;
        } catch (e) {
            console.error('Failed to insert record.', e, e.stack);
            failed++;
        }
    }

    return { message: 'Import completed', imported, failed, submitted: json.length };
});

try {
    if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is required');
    }

    await fastify.listen({ port: PORT ?? 3000, host: HOST ?? '0.0.0.0' });

    console.log('🚀 Server running on', fastify.server.address());
} catch (e) {
    console.error('🔴', e, e.stack);
    process.exit(1);
}
