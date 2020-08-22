import { Migration } from '@mikro-orm/migrations';

export class Migration20200822124120 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "league" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" text not null);');
  }

}
