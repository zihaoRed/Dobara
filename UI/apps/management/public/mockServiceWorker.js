/**
 * Mock Service Worker
 * @see https://github.com/mswjs/msw
 */
const INTEGRITY_CHECKSUM = '3d6b9f06410d179a7f7404d4bf4c3c70'

self.addEventListener('message', async function (event) {
  const { type, payload } = event.data

  switch (type) {
    case 'MOCK_ACTIVATE': {
      self.clients.claim()
      break
    }

    case 'MOCK_DEACTIVATE': {
      self.clients.matchAll().then(function (clients) {
        for (const client of clients) {
          client.postMessage({ type: 'MOCK_DEACTIVATE' })
        }
      })
      break
    }

    default:
      break
  }
})

self.addEventListener('fetch', function (event) {
  const { request } = event
  const acceptHeader = request.headers.get('Accept') || ''

  // Bypass non-API requests, CDN, and non-matching paths
  if (
    !request.url.includes('/api/') ||
    (request.mode === 'navigate' && acceptHeader.includes('text/html'))
  ) {
    return
  }

  event.respondWith(
    fetch(request).catch(function () {
      return new Response(null, { status: 500 })
    }),
  )
})
