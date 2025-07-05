import dotenv from 'dotenv';

dotenv.config(); 

export default {
    ACCESS_SECRET: process.env.JWT_SECRET_ACCESS, // Secret key for signing access tokens
    REFRESH_SECRET: process.env.JWT_SECRET_REFRESH, // Secret key for signing refresh tokens
    ACCESS_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION, // How long access tokens are valid
    REFRESH_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION, // How long refresh tokens are valid
};