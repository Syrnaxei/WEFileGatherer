import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { IFlow } from './core/flow';
import * as path from 'path';

interface Database {
  flows: IFlow[];
}

const file = path.join(__dirname, '../data/db.json');
const adapter = new JSONFile<Database>(file);
export const db = new Low<Database>(adapter, { flows: [] });

/** 初始化数据库，确保文件存在 */
export async function initDb() {
  await db.read();
  db.data = db.data ?? { flows: [] };
  await db.write();
}
