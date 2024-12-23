// functions/hello.ts
import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
    const { name, age } = JSON.parse(event.body || '{}');

    return {
        statusCode: 200,
        body: JSON.stringify({ message: `Hello, ${name}! You are ${age} years old.` }),
    };
};

export { handler };