import {CorsOptions} from 'cors'

export const corsConfig: CorsOptions = {
    origin: function(origin, callback) {
        console.log('CORS Check - Request Origin:', origin); // <-- AÑADE ESTE LOG
        console.log('CORS Check - FRONTEND_URL from env:', process.env.FRONTEND_URL); // <-- Y ESTE

        const whitelist = [process.env.FRONTEND_URL];

        if(process.argv[2] === '--api'){
            whitelist.push(undefined);
        }
        console.log('CORS Check - Whitelist:', whitelist); // <-- Y ESTE

        if(whitelist.includes(origin)) {
            console.log('CORS Check - Origin ALLOWED'); // <-- Y ESTE
            callback(null, true);
        } else {
            console.error('CORS Check - Origin DENIED'); // <-- Y ESTE
            callback(new Error('Error de CORS'));
        }
    }
}