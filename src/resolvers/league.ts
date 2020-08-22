import { Resolver, Query, Mutation, Ctx, Arg } from 'type-graphql';
import { League } from '../entities/League';
import { MyContext } from '../types';

@Resolver()
export class LeagueResolver {
    @Query(() => [League])
    leagues(@Ctx() { em }: MyContext): Promise<League[]> {
        return em.find(League, {});
    }

    @Query(() => League, { nullable: true })
    league(
        @Arg('id') id: number,
        @Ctx() { em }: MyContext
    ): Promise<League | null> {
        return em.findOne(League, { id });
    }

    @Mutation(() => League)
    async createLeague(
        @Arg('name') name: string,
        @Ctx() { em }: MyContext
    ): Promise<League | null> {
        const league = em.create(League, { name });
        await em.persistAndFlush(league);
        return league;
    }

    @Mutation(() => League, { nullable: true })
    async updateLeague(
        @Arg('id') id: number,
        @Arg('name', () => String, { nullable: true }) name: string,
        @Ctx() { em }: MyContext
    ): Promise<League | null> {
        const league = await em.findOne(League, { id });
        if (!league) {
            return null;
        }
        if (typeof name !== 'undefined') {
            league.name = name;
            await em.persistAndFlush(league);
        }
        return league;
    }

    @Mutation(() => Boolean)
    async deleteLeague(
        @Arg('id') id: number,
        @Ctx() { em }: MyContext
    ): Promise<boolean> {
        try {
            await em.nativeDelete(League, { id });
        } catch {
            return false;
        }
        return true;
    }
}
