import 'urlpattern-polyfill';
import { createYoga } from 'graphql-yoga'
import { getSchema } from './schema.js'

// Skip installed stage and jump to activating stage
addEventListener('install', (event) => {
  event.waitUntil(skipWaiting())
})

// Start controlling clients as soon as the SW is activated
addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

const graphqlPath = new URL('./graphql', location).pathname

const yoga = createYoga({
  fetchAPI: fetch,
  schema: getSchema(),
  graphiql: graphqlPath,
  graphqlEndpoint: graphqlPath,
})

addEventListener('fetch', e => {
  if (isLocalRequest(e.request)) e.respondWith(handleRequest(e.request))
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

function isLocalRequest(request) {
  if (request.referrer === '') return true
  const { origin: referrerOrigin } = new URL(request.referrer)
  const { origin } = new URL(request.url)
  return origin === referrerOrigin
}