import 'urlpattern-polyfill';
import { createYoga } from 'graphql-yoga'
import { getSchema } from './schema.js'
import { getIdbUserStore } from './user-store.js';

// Skip installed stage and jump to activating stage
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// Start controlling clients as soon as the SW is activated
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

const graphqlUrl = new URL('./graphql', self.registration.scope)

const userStorePromise = getIdbUserStore()

const yoga = createYoga({
  fetchAPI: fetch,
  graphiql: graphqlUrl.pathname,
  graphqlEndpoint: graphqlUrl.pathname,
  context: async () => ({
    userStore: await userStorePromise,
  }),
  schema: getSchema(),
})

self.addEventListener('fetch', e => {
  if (isGraphqlRequest(e.request)) e.respondWith(handleRequest(e.request))
})

async function handleRequest(request) {
  try {
    return await yoga(request)
  } catch (err) {
    console.error(err)
    return new Response(undefined, {
      status: 500,
    })
  }
}

function isGraphqlRequest(request) {
  const requestUrl = new URL(request.url)
  if (request.referrer !== '') {
    const { origin: referrerOrigin } = new URL(request.referrer)
    if (requestUrl.origin !== referrerOrigin) return false
  }
  return requestUrl.pathname === graphqlUrl.pathname
}