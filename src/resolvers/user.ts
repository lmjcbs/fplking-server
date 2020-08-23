import {
    Resolver,
    Mutation,
    Arg,
    InputType,
    Field,
    Ctx,
    ObjectType,
    Query,
} from 'type-graphql';
import { User } from '../entities/User';
import { MyContext } from '../types';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Query(() => [User])
    async users(@Ctx() { em }: MyContext) {
        return em.find(User, {});
    }

    @Query(() => User, { nullable: true })
    async currentUser(@Ctx() { em, req }: MyContext) {
        //not logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length < 3) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'Username must be at least 3 characters long',
                    },
                ],
            };
        }

        if (options.password.length < 3) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'Password must be at least 3 characters long',
                    },
                ],
            };
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username,
            password: hashedPassword,
        });
        try {
            await em.persistAndFlush(user);
        } catch (err) {
            if (err.code === '23505') {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'Username has already been taken',
                        },
                    ],
                };
            }
        }

        //log user in after sign up
        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {
            username: options.username,
        });
        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'Invalid username',
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, options.password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'Invalid password',
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }
}
