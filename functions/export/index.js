import 'dotenv/config';
import Fastify from 'fastify';
import { decode } from 'jsonwebtoken';
import sendgrid from '@sendgrid/mail';
import { getUser, getUserQuotes } from './pocketbase.mjs';

const { API_BASE_URL, SENDGRID_API_KEY, SENDGRID_VERIFIED_SENDER, HOST, PORT, NODE_ENV } = process.env;

const fastify = Fastify({
    logger: NODE_ENV === 'development',
});

fastify.get('/', async function handler(_, __) {
    return { message: 'Welcome to Meditations Export API. Please POST / with an authentication token.' };
});

fastify.post('/', async function handler(request, reply) {
    const apiToken = request.headers.authorization;
    let userId, user;

    try {
        userId = decode(apiToken)?.id;
    } catch { }

    if (!apiToken || !userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
    }

    try {
        user = await getUser(API_BASE_URL, apiToken, userId);
    } catch (e) {
        console.error('Failed to fetch user.', e, e.stack);
        reply.code(500);
        return { error: 'Failed to fetch user' };
    }

    reply.code(202);
    reply.send({ message: 'Exporting your quotes. Please check your email.' });

    let quotes;

    try {
        quotes = await getUserQuotes(API_BASE_URL, apiToken);
    } catch (e) {
        console.error('Failed to fetch records.', e, e.stack);
        reply.code(500);
        return { error: 'Failed to fetch records' };
    }

    try {
        // Attachment must be base64 encoded. Still btoa() only supports ASCII. So we need to encode the JSON string first.
        const json = JSON.stringify(quotes, null, 2);
        const encoder = new TextEncoder();
        const encoded = encoder.encode(json);
        const attachment = btoa(String.fromCharCode.apply(null, encoded));
        const filename = `quotes-${userId}-${Date.now()}.json`;

        sendgrid.send({
            to: user.email,
            from: SENDGRID_VERIFIED_SENDER,
            subject: 'Your Meditations Export is ready!',
            text: 'Please find your export attached.',
            attachments: [
                {
                    content: attachment,
                    filename,
                    type: "application/json",
                    disposition: "attachment"
                }
            ]
        });
    } catch (e) {
        console.error('Failed to send email.', e, e.stack);
    }
});

try {
    if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is required');
    }

    if (!SENDGRID_API_KEY || !SENDGRID_VERIFIED_SENDER) {
        throw new Error('SENDGRID_API_KEY and SENDGRID_VERIFIED_SENDER are required');
    }

    sendgrid.setApiKey(SENDGRID_API_KEY);

    await fastify.listen({ port: PORT ?? 3000, host: HOST ?? '0.0.0.0' });

    console.log('🚀 Server running on', fastify.server.address());
} catch (e) {
    console.error('🔴', e, e.stack);
    process.exit(1);
}
