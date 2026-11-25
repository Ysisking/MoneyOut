// Transaksi yang dikirim OrderBook (aplikasi pencatatan pesanan) lewat fitur "Aplikasi terhubung".
// OrderBook mengenali transaksinya dari awalan catatan ini, jadi jangan diubah formatnya.
export const ORDERBOOK_PREFIX = 'OrderBook · '
export const ORDERBOOK_WEB = 'https://orderbook.gamma-tau.workers.dev'
export const isFromOrderBook = (note) => typeof note === 'string' && note.startsWith(ORDERBOOK_PREFIX)
export const stripOrderBook = (note) => (isFromOrderBook(note) ? note.slice(ORDERBOOK_PREFIX.length) : note)
