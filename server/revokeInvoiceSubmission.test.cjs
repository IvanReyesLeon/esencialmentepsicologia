'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

const controllerPath = path.resolve(__dirname, 'controllers/billingController.js');
const mockedDb = {
    pool: {
        connect: async () => {
            throw new Error('The exported module wrapper does not expose connect directly');
        }
    },
    query: async () => ({ rows: [] }),
    getClient: async () => {
        throw new Error('Test database client was not configured');
    }
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (parent && parent.filename === controllerPath) {
        if (request === '../services/calendarService') return {};
        if (request === 'resend') return { Resend: class Resend {} };
        if (request === '../models/therapistQueries') return { getAllTherapists: async () => [] };
        if (request === '../config/db') return mockedDb;
    }
    return originalLoad.call(this, request, parent, isMain);
};

const billingController = require(controllerPath);
Module._load = originalLoad;

function createResponse() {
    return {
        statusCode: 200,
        body: undefined,
        headersSent: false,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            if (this.headersSent) throw new Error('Response sent more than once');
            this.body = body;
            this.headersSent = true;
            return this;
        }
    };
}

function configureDb({ submission = { therapist_id: 17, month: 8, year: 2026 }, userId = 42, failOn, failureError, acquireError, rollbackError } = {}) {
    const calls = [];
    let acquisitionCount = 0;
    let releaseCount = 0;

    const client = {
        async query(sql, params = []) {
            calls.push({ sql, params });
            if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
            if (sql === 'ROLLBACK') {
                if (rollbackError) throw rollbackError;
                return { rows: [] };
            }
            if (sql.startsWith('DELETE FROM invoice_submissions')) {
                if (failOn === 'delete') throw failureError || new Error('delete failed');
                return { rows: submission ? [submission] : [] };
            }
            if (sql.startsWith('SELECT id FROM users')) return { rows: userId ? [{ id: userId }] : [] };
            if (sql.startsWith('INSERT INTO notifications')) {
                if (failOn === 'notification') throw failureError || new Error('notification failed');
                return { rows: [] };
            }
            if (sql.startsWith('UPDATE invoice_submissions')) return { rows: [], rowCount: 1 };
            throw new Error(`Unexpected SQL in test: ${sql}`);
        },
        release() {
            releaseCount += 1;
        }
    };

    mockedDb.getClient = async () => {
        acquisitionCount += 1;
        if (acquireError) throw acquireError;
        return client;
    };

    return {
        calls,
        get acquisitionCount() { return acquisitionCount; },
        get releaseCount() { return releaseCount; }
    };
}

async function invoke(body) {
    const response = createResponse();
    await billingController.revokeInvoiceSubmission({ body }, response);
    return response;
}

test('invoice validation also acquires its transaction client through getClient', async () => {
    const db = configureDb();
    const response = createResponse();
    await billingController.validateInvoiceSubmission({
        body: { therapistId: 17, month: 8, year: 2026, validated: true }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(db.acquisitionCount, 1);
    assert.equal(db.releaseCount, 1);
});

test('revoke by id uses getClient, deletes the stored period, notifies, and commits', async () => {
    const db = configureDb();
    const response = await invoke({ id: 91 });

    assert.equal(typeof mockedDb.connect, 'undefined');
    assert.equal(typeof mockedDb.pool.connect, 'function');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.deepEqual(db.calls.find(call => call.sql.startsWith('DELETE FROM invoice_submissions')).params, [91]);
    assert.deepEqual(db.calls.find(call => call.sql.startsWith('SELECT id FROM users')).params, [17]);
    const beginIndex = db.calls.findIndex(call => call.sql === 'BEGIN');
    const deleteIndex = db.calls.findIndex(call => call.sql.startsWith('DELETE FROM invoice_submissions'));
    const notificationIndex = db.calls.findIndex(call => call.sql.startsWith('INSERT INTO notifications'));
    const commitIndex = db.calls.findIndex(call => call.sql === 'COMMIT');
    assert.ok(beginIndex < deleteIndex && deleteIndex < notificationIndex && notificationIndex < commitIndex);
    assert.equal(db.acquisitionCount, 1);
    assert.equal(db.releaseCount, 1);
});

test('revoke by therapist, month, and year deletes the matching submission', async () => {
    const db = configureDb({ submission: { therapist_id: 17, month: 8, year: 2026 } });
    const response = await invoke({ therapistId: 17, month: 8, year: 2026 });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.deepEqual(db.calls.find(call => call.sql.startsWith('DELETE FROM invoice_submissions')).params, [17, 8, 2026]);
});

test('revoke reason is included in the therapist notification', async () => {
    const db = configureDb();
    await invoke({ id: 91, reason: 'Falta una sesión' });

    const notification = db.calls.find(call => call.sql.startsWith('INSERT INTO notifications'));
    assert.match(notification.params[1], /Motivo: Falta una sesión/);
});

test('invalid request returns 400 without acquiring a connection', async () => {
    const db = configureDb();
    const response = await invoke({ therapistId: 17, month: 8 });

    assert.equal(response.statusCode, 400);
    assert.equal(db.acquisitionCount, 0);
    assert.equal(db.releaseCount, 0);
});

test('missing invoice returns 404, rolls back, and does not notify', async () => {
    const db = configureDb({ submission: null });
    const response = await invoke({ id: 404, therapistId: 17, month: 8, year: 2026 });

    assert.equal(response.statusCode, 404);
    assert.ok(db.calls.some(call => call.sql === 'ROLLBACK'));
    assert.equal(db.calls.some(call => call.sql.startsWith('INSERT INTO notifications')), false);
    assert.equal(db.releaseCount, 1);
});

test('DELETE failure rolls back, preserves the original error if rollback also fails, and releases', async () => {
    const originalError = new Error('delete failed');
    const rollbackError = new Error('rollback failed');
    const db = configureDb({ failOn: 'delete', failureError: originalError, rollbackError });
    const errorLogs = [];
    const originalConsoleError = console.error;
    console.error = (...args) => errorLogs.push(args);
    let response;
    try {
        response = await invoke({ id: 91 });
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(response.statusCode, 500);
    assert.ok(db.calls.some(call => call.sql === 'ROLLBACK'));
    assert.ok(errorLogs.some(args => args[0] === 'Error revoking invoice:' && args[1] === originalError));
    assert.equal(db.releaseCount, 1);
});

test('notification failure rolls back the deletion and releases the client', async () => {
    const db = configureDb({ failOn: 'notification', failureError: new Error('notification failed') });
    const originalConsoleError = console.error;
    console.error = () => {};
    let response;
    try {
        response = await invoke({ id: 91 });
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(response.statusCode, 500);
    assert.ok(db.calls.some(call => call.sql === 'ROLLBACK'));
    assert.equal(db.calls.some(call => call.sql === 'COMMIT'), false);
    assert.equal(db.releaseCount, 1);
});

test('connection acquisition failure is handled as HTTP 500 without an unhandled rejection', async () => {
    const db = configureDb({ acquireError: new Error('connection failed') });
    const originalConsoleError = console.error;
    console.error = () => {};
    let response;
    try {
        response = await invoke({ id: 91 });
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(response.statusCode, 500);
    assert.equal(db.releaseCount, 0);
});
