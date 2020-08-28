import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__, COOKIE_NAME } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/user';
import { LeagueResolver } from './resolvers/league';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';

const main = async () => {
    require('dotenv').config();
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 Year timeout
                httpOnly: true,
                sameSite: 'lax', //csrf
                secure: __prod__, //cookie only works in https
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET!,
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, LeagueResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res }),
    });

    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    app.listen(4000, () => {
        console.log('Server started on localhost:4000');
    });
};

main().catch((err) => {
    console.error(err);
});
