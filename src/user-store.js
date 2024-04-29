import { openDB } from 'idb';

const defaultMe = {
  id: 'me',
  favoriteCharactersIds: ['3', '4'],
}

export async function getIdbUserStore() {
  const db = await openDB('graphql-yoga-sw-example', undefined, {
    upgrade(db) {
      db.createObjectStore('user')
    },
  });
  const userStore = new UserStore(db);
  if (!await userStore.has(defaultMe.id)) {
    await userStore.set(defaultMe.id, defaultMe);
  }
  return userStore;
}

export function getMemoryUserStore() {
  const userStore = new UserStore(new MemoryBackend());
  userStore.set(defaultMe.id, defaultMe);
  return userStore;
}

class UserStore {
  constructor(backend) {
    this.backend = backend;
  }

  async get(id) {
    return this.backend.get('user', id);
  }

  async set(id, user) {
    return this.backend.put('user', user, id);
  }

  async has(id) {
    return null != await this.get(id);
  }
}

class MemoryBackend {
  users = {};

  get(_, id) {
    return this.users[id];
  }

  put(_, user, id) {
    this.users[id] = user;
  }
}
