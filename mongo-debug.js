/**
 * mongo-debug.js
 * Run: node mongo-debug.js
 * Requires: npm install mongodb dns
 */

const dns = require('dns');
const dns2 = require('dns/promises');
const net = require('net');
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://persis-user:c7d9PoHEFqNZqU8p@ac-frnh3fz-shard-00-00.f161rfw.mongodb.net:27017,ac-frnh3fz-shard-00-01.f161rfw.mongodb.net:27017,ac-frnh3fz-shard-00-02.f161rfw.mongodb.net:27017/?ssl=true&replicaSet=atlas-hi2qq4-shard-0&authSource=admin&appName=Nabil021';
const HOSTNAME = 'nabil021.f161rfw.mongodb.net';
const SRV_HOSTS = [
  'ac-frnh3fz-shard-00-00.f161rfw.mongodb.net',
  'ac-frnh3fz-shard-00-01.f161rfw.mongodb.net',
  'ac-frnh3fz-shard-00-02.f161rfw.mongodb.net',
];

const log = (label, msg, ok = null) => {
  const icon = ok === null ? '🔍' : ok ? '✅' : '❌';
  console.log(`${icon} [${label}] ${msg}`);
};

// ─── 1. DNS System Check ───────────────────────────────────────────
async function checkDns() {
  console.log('\n══════════════════════════════════');
  console.log('  STEP 1: DNS Resolution');
  console.log('══════════════════════════════════');

  // System DNS
  await new Promise((resolve) => {
    dns.lookup(HOSTNAME, (err, addr) => {
      if (err) log('System DNS', `FAILED: ${err.message}`, false);
      else log('System DNS', `Resolved → ${addr}`, true);
      resolve();
    });
  });

  // Google DNS override
  const resolver = new dns2.Resolver();
  resolver.setServers(['8.8.8.8']);
  try {
    const addrs = await resolver.resolve4(HOSTNAME);
    log('Google DNS (8.8.8.8)', `Resolved → ${addrs.join(', ')}`, true);
  } catch (e) {
    log('Google DNS (8.8.8.8)', `FAILED: ${e.message}`, false);
  }

  // SRV lookup
  try {
    const records = await resolver.resolveSrv(`_mongodb._tcp.${HOSTNAME}`);
    log('SRV Lookup', `Found ${records.length} hosts`, true);
    records.forEach(r => console.log(`   → ${r.name}:${r.port}`));
  } catch (e) {
    log('SRV Lookup', `FAILED: ${e.message}`, false);
  }
}

// ─── 2. TCP Port Check ─────────────────────────────────────────────
async function checkPorts() {
  console.log('\n══════════════════════════════════');
  console.log('  STEP 2: TCP Port 27017 Check');
  console.log('══════════════════════════════════');

  for (const host of SRV_HOSTS) {
    await new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000;

      socket.setTimeout(timeout);
      socket.connect(27017, host, () => {
        log(`TCP ${host}`, 'Port 27017 OPEN', true);
        socket.destroy();
        resolve();
      });

      socket.on('error', (err) => {
        log(`TCP ${host}`, `Port BLOCKED/FAILED: ${err.message}`, false);
        resolve();
      });

      socket.on('timeout', () => {
        log(`TCP ${host}`, 'TIMEOUT — port likely blocked by ISP', false);
        socket.destroy();
        resolve();
      });
    });
  }
}

// ─── 3. MongoDB Connect ────────────────────────────────────────────
async function checkMongo() {
  console.log('\n══════════════════════════════════');
  console.log('  STEP 3: MongoDB Connection');
  console.log('══════════════════════════════════');

  log('URI', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    family: 4,
  });

  try {
    log('MongoClient', 'Connecting...');
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    log('MongoClient', 'Connected & Ping SUCCESS 🎉', true);

    const db = client.db('logbook_db');
    const collections = await db.listCollections().toArray();
    log('Collections', `Found: ${collections.map(c => c.name).join(', ') || '(empty)'}`, true);
  } catch (e) {
    log('MongoClient', `FAILED: ${e.message}`, false);
    console.log('\n  📋 Full error:');
    console.log(' ', e.stack?.split('\n').slice(0, 4).join('\n  '));
  } finally {
    await client.close();
  }
}

// ─── Run All ───────────────────────────────────────────────────────
(async () => {
  console.log('╔══════════════════════════════════╗');
  console.log('║     MongoDB Debug Tool           ║');
  console.log('╚══════════════════════════════════╝');

  await checkDns();
  await checkPorts();
  await checkMongo();

  console.log('\n══════════════════════════════════');
  console.log('  Done. Check results above.');
  console.log('══════════════════════════════════\n');
})();