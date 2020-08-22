import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { League } from './entities/League';
import microConfig from './mikro-orm.config';

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const league = orm.em.create(League, { name: 'my first league' });
    await orm.em.persistAndFlush(league);
};

main().catch((err) => {
    console.error(err);
});
