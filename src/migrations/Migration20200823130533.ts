import { Migration } from '@mikro-orm/migrations';

export class Migration20200823130533 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop column "player_id_code";');
  }

}
