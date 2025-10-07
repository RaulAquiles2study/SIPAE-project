// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault:true,
    migrations: {
      directory: 'migrations',
      extension:"cjs"
    }
  },

  staging: {
    client: 'sqlite3',
    connection: {
      filename: './sta.sqlite3'
    },
    useNullAsDefault:true,
    migrations: {
      directory: 'migrations',
      extension:"cjs"
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './pro.sqlite3'
    },
    useNullAsDefault:true,
    migrations: {
      directory: 'migrations',
      extension:"cjs"
    }
  }

};
