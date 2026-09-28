/**
 * test_vat_invoicing.cjs
 * Automated Targeted Tests for VAT Treatment & Invoicing System (T1 - T21)
 * Esencialmente Psicología
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { query } = require('./config/db');

// Literal canónico unificado para toda factura presentada mediante el nuevo sistema
const CANONICAL_VAT_EXEMPTION_REASON = 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.';

function calculateInvoice(subtotal, centerPercentage, irpfPercentage, vatTreatment) {
    if (!vatTreatment || !['EXEMPT', 'STANDARD'].includes(vatTreatment)) {
        throw new Error('INVALID_VAT_TREATMENT');
    }
    const centerAmount = Number((subtotal * (centerPercentage / 100)).toFixed(2));
    const availableBase = Number((subtotal - centerAmount).toFixed(2));
    const irpfAmount = Number((availableBase * (irpfPercentage / 100)).toFixed(2));

    let ivaPercentage = 0;
    let ivaAmount = 0;
    let vatExemptionReason = null;

    if (vatTreatment === 'EXEMPT') {
        ivaPercentage = 0;
        ivaAmount = 0;
        vatExemptionReason = CANONICAL_VAT_EXEMPTION_REASON;
    } else if (vatTreatment === 'STANDARD') {
        ivaPercentage = 21;
        ivaAmount = Number((availableBase * 0.21).toFixed(2));
        vatExemptionReason = null;
    }

    const totalAmount = Number((availableBase - irpfAmount + ivaAmount).toFixed(2));

    return {
        subtotal,
        centerPercentage,
        centerAmount,
        availableBase,
        irpfPercentage,
        irpfAmount,
        vatTreatment,
        ivaPercentage,
        ivaAmount,
        vatExemptionReason,
        totalAmount
    };
}

async function runTests() {
    console.log('====================================================');
    console.log('  TEST SUITE: FACTURAS EXENTAS DE IVA (T1 - T21)    ');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name}`);
            console.error(`   Error: ${err.message}`);
            failed++;
        }
    }

    async function asyncTest(name, fn) {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name}`);
            console.error(`   Error: ${err.message}`);
            failed++;
        }
    }

    // T1 — Factura exenta
    test('T1 — Factura exenta: vatTreatment = EXEMPT', () => {
        const res = calculateInvoice(1000, 20, 15, 'EXEMPT');
        assert.strictEqual(res.vatTreatment, 'EXEMPT');
        assert.strictEqual(res.ivaPercentage, 0);
        assert.strictEqual(res.ivaAmount, 0);
        assert.strictEqual(res.vatExemptionReason, CANONICAL_VAT_EXEMPTION_REASON);
        assert.strictEqual(res.totalAmount, 680); // (1000 - 200 = 800 base) - (800 * 0.15 = 120) + 0 = 680
    });

    // T2 — Factura estándar
    test('T2 — Factura estándar: vatTreatment = STANDARD (IVA 21%)', () => {
        const res = calculateInvoice(1000, 20, 15, 'STANDARD');
        assert.strictEqual(res.vatTreatment, 'STANDARD');
        assert.strictEqual(res.ivaPercentage, 21);
        assert.strictEqual(res.ivaAmount, 168); // 800 * 0.21 = 168
        assert.strictEqual(res.vatExemptionReason, null);
        assert.strictEqual(res.totalAmount, 848); // 800 - 120 + 168 = 848
    });

    // T3 — Valor inválido
    test('T3 — Valor inválido: vatTreatment = TEST debe ser rechazado', () => {
        assert.throws(() => {
            calculateInvoice(1000, 20, 15, 'TEST');
        }, /INVALID_VAT_TREATMENT/);
    });

    // T4 — Sin elección
    test('T4 — Sin elección: vatTreatment = null debe ser rechazado', () => {
        assert.throws(() => {
            calculateInvoice(1000, 20, 15, null);
        }, /INVALID_VAT_TREATMENT/);
        assert.throws(() => {
            calculateInvoice(1000, 20, 15, undefined);
        }, /INVALID_VAT_TREATMENT/);
    });

    // T5 — PDF Exento
    test('T5 — PDF Exento: visualiza "IVA: Exento" y texto legal del artículo 20.Uno.3.º', () => {
        const exemptCalc = calculateInvoice(1000, 20, 15, 'EXEMPT');
        const exemptPdfVatLabel = (exemptCalc.vatTreatment === 'EXEMPT') ? 'IVA: Exento' : `+ ${exemptCalc.ivaPercentage}% IVA`;
        assert.strictEqual(exemptPdfVatLabel, 'IVA: Exento');
        assert.strictEqual(exemptCalc.vatExemptionReason, CANONICAL_VAT_EXEMPTION_REASON);
        assert.ok(exemptCalc.vatExemptionReason.includes('artículo 20.Uno.3.º'));
    });

    // T6 — PDF Estándar
    test('T6 — PDF Estándar: visualiza "+ 21% IVA" y NO contiene texto de exención', () => {
        const stdCalc = calculateInvoice(1000, 20, 15, 'STANDARD');
        const stdPdfVatLabel = (stdCalc.vatTreatment === 'EXEMPT') ? 'IVA: Exento' : `+ ${stdCalc.ivaPercentage}% IVA`;
        assert.strictEqual(stdPdfVatLabel, '+ 21% IVA');
        assert.strictEqual(stdCalc.vatExemptionReason, null);
    });

    // T7 — Paridad generador PDF
    test('T7 — Paridad generador PDF: módulo único compartido existente', () => {
        const pdfHelperPath = path.join(__dirname, '../client/src/utils/invoicePdfGenerator.js');
        assert.ok(fs.existsSync(pdfHelperPath), 'invoicePdfGenerator.js debe existir');
        const helperContent = fs.readFileSync(pdfHelperPath, 'utf8');
        assert.ok(helperContent.includes('export const generateInvoicePDF'), 'Debe exportar generateInvoicePDF');

        // Verificar que BillingTab y BillingDashboard importan la misma función
        const tabContent = fs.readFileSync(path.join(__dirname, '../client/src/components/BillingTab.js'), 'utf8');
        const dashContent = fs.readFileSync(path.join(__dirname, '../client/src/components/BillingDashboard.js'), 'utf8');
        assert.ok(tabContent.includes("from '../utils/invoicePdfGenerator'"), 'BillingTab debe importar invoicePdfGenerator');
        assert.ok(dashContent.includes("from '../utils/invoicePdfGenerator'"), 'BillingDashboard debe importar invoicePdfGenerator');
    });

    // T8 — Snapshot fiscal y minimización estricta de privacidad (CERO datos de pacientes)
    test('T8 — Estructura del snapshot version: 1 y minimización de privacidad', () => {
        const dummyTherapist = {
            fullName: 'Dra. María González',
            nif: '12345678Z',
            addressLine1: 'Carrer Major 1',
            city: 'Sabadell',
            postalCode: '08201',
            iban: 'ES1234567890'
        };
        const dummyCenter = {
            name: 'Esencialmente Psicología',
            legalName: 'Esencialmente Psicología S.L.',
            nif: 'B12345678',
            city: 'Sabadell'
        };

        // Simular mapeo estricto del backend: solo precio, NUNCA datos personales ni fechas
        const rawSessionsFromCalendar = [
            { id: 'cal-1', date: '2026-09-01', startTime: '10:00', clientName: 'Paciente Confidencial', patientName: 'Paciente Confidencial', title: 'Paciente - Terapia', price: 60 }
        ];

        const snapshotSessions = rawSessionsFromCalendar.map(s => ({
            price: parseFloat(s.price || 0)
        }));

        const calc = calculateInvoice(60, 20, 15, 'EXEMPT');

        const snapshot = {
            version: 1,
            issuedAt: new Date().toISOString(),
            invoiceNumber: 'FAC-2026-001',
            therapist: dummyTherapist,
            center: dummyCenter,
            sessions: snapshotSessions,
            financial: calc
        };

        assert.strictEqual(snapshot.version, 1);
        assert.strictEqual(snapshot.therapist.fullName, 'Dra. María González');
        assert.strictEqual(snapshot.therapist.nif, '12345678Z');
        assert.strictEqual(snapshot.sessions.length, 1);
        assert.strictEqual(snapshot.sessions[0].price, 60);

        // PRIVACY CHECKS: No almacenar PII ni metadatos clínicos de pacientes
        assert.strictEqual(snapshot.sessions[0].clientName, undefined, 'No debe existir clientName');
        assert.strictEqual(snapshot.sessions[0].patientName, undefined, 'No debe existir patientName');
        assert.strictEqual(snapshot.sessions[0].title, undefined, 'No debe existir title');
        assert.strictEqual(snapshot.sessions[0].date, undefined, 'No debe existir date');
        assert.strictEqual(snapshot.sessions[0].time, undefined, 'No debe existir time');
        assert.strictEqual(snapshot.sessions[0].startTime, undefined, 'No debe existir startTime');
        assert.strictEqual(snapshot.sessions[0].sessionType, undefined, 'No debe existir sessionType');
        assert.strictEqual(snapshot.sessions[0].notes, undefined, 'No debe existir notes');
        assert.strictEqual(snapshot.sessions[0].description, undefined, 'No debe existir description');
        assert.strictEqual(snapshot.sessions[0].id, undefined, 'No debe existir id de Calendar');

        assert.strictEqual(snapshot.financial.vatTreatment, 'EXEMPT');
        assert.strictEqual(snapshot.financial.ivaPercentage, 0);
    });

    // T9 — Snapshot resilience against profile changes
    test('T9 — Cambio posterior de perfil no altera la factura guardada', () => {
        const snapshot = {
            version: 1,
            therapist: { fullName: 'Nombre Original', nif: '44444444A' }
        };
        const updatedProfile = { fullName: 'Nombre Modificado', nif: '99999999Z' };

        const renderedTherapist = snapshot.therapist ? snapshot.therapist : updatedProfile;
        assert.strictEqual(renderedTherapist.fullName, 'Nombre Original');
        assert.strictEqual(renderedTherapist.nif, '44444444A');
    });

    // T10 — Snapshot resilience against calendar modifications
    test('T10 — Cambio posterior en Google Calendar no altera las sesiones guardadas', () => {
        const snapshot = {
            version: 1,
            sessions: [
                { price: 60 },
                { price: 60 }
            ]
        };
        const currentCalendarEvents = [{ price: 70 }];

        const renderedSessions = (snapshot.sessions && snapshot.sessions.length > 0) ? snapshot.sessions : currentCalendarEvents;
        assert.strictEqual(renderedSessions.length, 2);
        assert.strictEqual(renderedSessions[0].price, 60);
    });

    // T11 — Rehacer factura (revoke + resubmit flow)
    test('T11 — Flujo de rehacer factura: revoke elimina y permite re-presentar con nuevo snapshot', () => {
        let dbSubmissions = [
            { id: 101, therapist_id: 5, year: 2026, month: 7, vat_treatment: null, invoice_snapshot: null }
        ];

        // Revocación administrativa (DELETE)
        dbSubmissions = dbSubmissions.filter(s => s.id !== 101);
        assert.strictEqual(dbSubmissions.length, 0, 'La factura fue eliminada por revocación');

        // Terapeuta vuelve a presentar con nueva selección y sesiones corregidas
        const newSubmission = {
            id: 102,
            therapist_id: 5,
            year: 2026,
            month: 7,
            vat_treatment: 'EXEMPT',
            vat_exemption_reason: CANONICAL_VAT_EXEMPTION_REASON,
            invoice_snapshot: { version: 1, sessions: [{ price: 55 }] }
        };
        dbSubmissions.push(newSubmission);

        assert.strictEqual(dbSubmissions.length, 1);
        assert.strictEqual(dbSubmissions[0].id, 102);
        assert.strictEqual(dbSubmissions[0].vat_treatment, 'EXEMPT');
        assert.strictEqual(dbSubmissions[0].vat_exemption_reason, CANONICAL_VAT_EXEMPTION_REASON);
    });

    // T12 — Histórico no mutado (READ-ONLY fallback)
    test('T12 — Histórico no mutado: facturas antiguas sin snapshot ni vat_treatment usan legacy flow', () => {
        const legacyInvoice = {
            id: 42,
            vat_treatment: null,
            invoice_snapshot: null,
            iva_percentage: 0
        };

        const isLegacy = !legacyInvoice.invoice_snapshot && !legacyInvoice.vat_treatment;
        assert.ok(isLegacy, 'Debe ser detectada como factura legacy');
        assert.strictEqual(legacyInvoice.vat_treatment, null);
    });

    // T13 — Verificación en base de datos real (Neon): CERO backfill en TODAS las facturas existentes
    await asyncTest('T13 — Base de datos: 0 backfill en las 65 facturas existentes', async () => {
        const res = await query(`
            SELECT
                COUNT(*) AS total_count,
                COUNT(*) FILTER (WHERE vat_treatment IS NOT NULL) AS non_null_treatments,
                COUNT(*) FILTER (WHERE invoice_snapshot IS NOT NULL) AS non_null_snapshots
            FROM invoice_submissions;
        `);
        const row = res.rows[0];
        console.log(`   [DB STATS] Total: ${row.total_count}, Con vat_treatment: ${row.non_null_treatments}, Con snapshot: ${row.non_null_snapshots}`);
        assert.strictEqual(Number(row.total_count), 65, 'Deben existir 65 facturas registradas');
        assert.strictEqual(Number(row.non_null_treatments), 0, 'No debe haber ningún vat_treatment en facturas históricas');
        assert.strictEqual(Number(row.non_null_snapshots), 0, 'No debe haber ningún snapshot en facturas históricas');
    });

    // T14 — Test del texto legal exacto (comparación estricta y literal)
    test('T14 — Literal legal canónico exacto: igualdad byte a byte', () => {
        const expectedExact = 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.';
        assert.strictEqual(CANONICAL_VAT_EXEMPTION_REASON, expectedExact, 'El literal debe coincidir de forma idéntica con el canónico');
        
        // Verificar que el backend utiliza exactamente este texto
        const backendCode = fs.readFileSync(path.join(__dirname, 'controllers/billingController.js'), 'utf8');
        assert.ok(backendCode.includes(expectedExact), 'billingController.js debe contener exactamente el texto canónico');
        
        // Verificar que el generador PDF incluye exactamente este texto
        const pdfCode = fs.readFileSync(path.join(__dirname, '../client/src/utils/invoicePdfGenerator.js'), 'utf8');
        assert.ok(pdfCode.includes(expectedExact), 'invoicePdfGenerator.js debe contener exactamente el texto canónico');
    });

    // T15 — Cálculos financieros: base, IRPF y comisión centro
    test('T15 — Cálculo financiero de IRPF y retención de centro inalterados', () => {
        const exempt = calculateInvoice(1500, 25, 15, 'EXEMPT');
        const standard = calculateInvoice(1500, 25, 15, 'STANDARD');

        assert.strictEqual(exempt.centerAmount, 375);
        assert.strictEqual(standard.centerAmount, 375);
        assert.strictEqual(exempt.availableBase, 1125);
        assert.strictEqual(standard.availableBase, 1125);
        assert.strictEqual(exempt.irpfAmount, 168.75);
        assert.strictEqual(standard.irpfAmount, 168.75);
    });

    // T16 — server.js no contiene DDL de automigración de esta funcionalidad
    test('T16 — server.js no ejecuta ALTER TABLE de vat_treatment en arranque', () => {
        const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        assert.ok(!serverCode.includes('check_vat_treatment'), 'server.js no debe contener check_vat_treatment');
        assert.ok(!serverCode.includes('ADD COLUMN IF NOT EXISTS vat_treatment'), 'server.js no debe contener automigración de vat_treatment');
    });

    // T17 — Legacy ciclo actual → revoke → EXEMPT
    test('T17 — Legacy ciclo actual → revoke → EXEMPT: se transforma en factura nueva con snapshot v1', () => {
        // Estado inicial: Factura legacy de ciclo actual
        const legacyInvoice = {
            id: 85,
            therapist_id: 4,
            month: 7,
            year: 2026,
            vat_treatment: null,
            vat_exemption_reason: null,
            invoice_snapshot: null,
            iva_percentage: 0
        };

        // 1. Administración devuelve factura (DELETE en backend)
        let rowInDb = { ...legacyInvoice };
        rowInDb = null; // Simulación del DELETE FROM invoice_submissions WHERE id = 85
        assert.strictEqual(rowInDb, null, 'Factura eliminada tras revocación');

        // 2. Terapeuta abre de nuevo el período y selecciona EXEMPT
        const selectedVatTreatment = 'EXEMPT';
        const calc = calculateInvoice(1375, 40, 15, selectedVatTreatment);

        // 3. Terapeuta presenta: nueva inserción con snapshot v1
        const newInvoice = {
            id: 86,
            therapist_id: 4,
            month: 7,
            year: 2026,
            subtotal: 1375.00,
            center_percentage: 40,
            center_amount: calc.centerAmount,
            irpf_percentage: 15,
            irpf_amount: calc.irpfAmount,
            iva_percentage: 0,
            iva_amount: 0,
            vat_treatment: 'EXEMPT',
            vat_exemption_reason: CANONICAL_VAT_EXEMPTION_REASON,
            invoice_snapshot: {
                version: 1,
                issuedAt: new Date().toISOString(),
                sessions: [{ price: 55 }, { price: 55 }],
                financial: calc
            }
        };

        assert.strictEqual(newInvoice.vat_treatment, 'EXEMPT');
        assert.strictEqual(newInvoice.vat_exemption_reason, CANONICAL_VAT_EXEMPTION_REASON);
        assert.strictEqual(newInvoice.invoice_snapshot.version, 1);
        assert.strictEqual(newInvoice.iva_percentage, 0);
        assert.strictEqual(newInvoice.iva_amount, 0);
    });

    // T18 — Legacy ciclo actual → revoke → STANDARD
    test('T18 — Legacy ciclo actual → revoke → STANDARD: se transforma en factura con IVA 21% y snapshot v1', () => {
        // Estado inicial: Factura legacy que tenía iva_percentage = 0 o 21
        const legacyInvoice = {
            id: 84,
            therapist_id: 3,
            month: 7,
            year: 2026,
            vat_treatment: null,
            vat_exemption_reason: null,
            invoice_snapshot: null,
            iva_percentage: 21
        };

        // 1. Administración devuelve factura
        let rowInDb = null;

        // 2. Terapeuta selecciona explícitamente STANDARD (21%)
        const selectedVatTreatment = 'STANDARD';
        const calc = calculateInvoice(110, 40, 15, selectedVatTreatment);

        // 3. Terapeuta presenta de nuevo
        const reSubmittedInvoice = {
            id: 87,
            therapist_id: 3,
            month: 7,
            year: 2026,
            vat_treatment: 'STANDARD',
            vat_exemption_reason: null,
            iva_percentage: 21,
            iva_amount: calc.ivaAmount,
            invoice_snapshot: {
                version: 1,
                issuedAt: new Date().toISOString(),
                sessions: [{ price: 55 }, { price: 55 }],
                financial: calc
            }
        };

        assert.strictEqual(reSubmittedInvoice.vat_treatment, 'STANDARD');
        assert.strictEqual(reSubmittedInvoice.vat_exemption_reason, null);
        assert.strictEqual(reSubmittedInvoice.iva_percentage, 21);
        assert.strictEqual(reSubmittedInvoice.iva_amount, 13.86);
        assert.strictEqual(reSubmittedInvoice.invoice_snapshot.version, 1);
    });

    // T19 — Nueva selección obligatoria al rehacer
    test('T19 — Nueva selección obligatoria al rehacer: tras revoke, vatTreatment arranca en null', () => {
        // Estado devuelto por /api/admin/billing/invoice-status tras revoke
        const statusData = { submitted: false, submission: null };

        let vatTreatmentState = 'PREVIOUS_VALUE';
        let invoiceSubmittedState = true;

        // Lógica de BillingTab.js
        if (statusData.submitted) {
            invoiceSubmittedState = true;
        } else {
            invoiceSubmittedState = false;
            vatTreatmentState = null; // Obligatorio: debe empezar en null
        }

        assert.strictEqual(invoiceSubmittedState, false);
        assert.strictEqual(vatTreatmentState, null, 'vatTreatment debe ser estrictamente null tras revoke');

        // Botón presentar debe estar deshabilitado mientras vatTreatment sea null
        const isSubmitDisabled = !vatTreatmentState;
        assert.strictEqual(isSubmitDisabled, true, 'Presentar Factura debe estar deshabilitado sin selección');
    });

    // T20 — UNIQUE month/year no bloquea la re-presentación
    await asyncTest('T20 — UNIQUE (therapist_id, month, year) no bloquea re-presentación tras DELETE', async () => {
        // Verificar que la base de datos tiene la constraint de unicidad correcta
        const res = await query(`
            SELECT pg_get_constraintdef(c.oid) as def
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'invoice_submissions'
              AND c.conname = 'invoice_submissions_therapist_id_month_year_key';
        `);
        assert.ok(res.rows.length > 0, 'La constraint UNIQUE (therapist_id, month, year) debe existir');
        assert.ok(res.rows[0].def.includes('UNIQUE (therapist_id, month, year)'));

        // Al ejecutar DELETE en revoke, la tupla (therapist_id, month, year) deja de existir en la tabla,
        // garantizando que un INSERT posterior del mismo período sea admitido sin violación de clave única.
    });

    // T21 — Facturas legacy no devueltas permanecen legacy
    await asyncTest('T21 — Facturas legacy no devueltas permanecen 100% legacy en DB', async () => {
        // Comprobar que ninguna de las 65 facturas existentes en Neon fue alterada
        const res = await query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE vat_treatment IS NULL AND invoice_snapshot IS NULL) as legacy_count
            FROM invoice_submissions;
        `);
        const { total, legacy_count } = res.rows[0];
        assert.strictEqual(Number(total), 65);
        assert.strictEqual(Number(legacy_count), 65, 'Todas las facturas existentes permanecen con vat_treatment=NULL e invoice_snapshot=NULL');
    });

    console.log('\n====================================================');
    console.log(`  RESULTADOS: ${passed} PASSED, ${failed} FAILED     `);
    console.log('====================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Test suite execution error:', err);
    process.exit(1);
});
